import { NextRequest, NextResponse } from 'next/server'
import { extractDocument } from '@/lib/extract'

// ── In-memory rate limiting ───────────────────────────────────────────────────
// Shared within a single serverless instance. Imprecision across instances is
// acceptable for a demo — no external dependency required.

const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_PER_IP = 10
const DAILY_CAP = 200

const ipTimestamps = new Map<string, number[]>()
let dailyCount = 0
let dailyCountDate = utcDate()

function utcDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// Falls back to 'unknown' when x-forwarded-for is absent (direct connections, local dev).
// All such requests share one rate-limit bucket, which is intentionally conservative
// for a demo that's always expected to run behind a proxy in production.
function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const pruned = (ipTimestamps.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  if (pruned.length >= RATE_LIMIT_PER_IP) {
    ipTimestamps.set(ip, pruned)
    return false
  }
  ipTimestamps.set(ip, [...pruned, now])
  return true
}

function checkDailyCap(): boolean {
  const today = utcDate()
  if (today !== dailyCountDate) {
    dailyCount = 0
    dailyCountDate = today
  }
  if (dailyCount >= DAILY_CAP) return false
  dailyCount++
  return true
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getIp(request)

  // Rate limit is checked before parsing the body — cheap rejection for abusive callers.
  // Daily cap runs later (after file validation) so the slot is only consumed by valid requests.
  if (!checkRateLimit(ip)) {
    console.log(`[extract] rejected reason=rate_limited ip=${ip}`)
    return NextResponse.json(
      { error: 'rate_limited', message: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { status: 'error', code: 'unreadable_document', message: 'Could not parse the request body as multipart form data.' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  const documentType = formData.get('document_type')

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { status: 'error', code: 'unreadable_document', message: 'No file provided. Include a PDF as the "file" field.' },
      { status: 400 }
    )
  }

  if (!documentType || typeof documentType !== 'string') {
    return NextResponse.json(
      { status: 'error', code: 'wrong_document_type', message: 'No document_type provided.' },
      { status: 400 }
    )
  }

  if (file.size > 5 * 1024 * 1024) {
    console.log(`[extract] rejected reason=file_too_large ip=${ip} size=${file.size}`)
    return NextResponse.json(
      { error: 'file_too_large', message: 'File too large. Maximum size is 5MB.' },
      { status: 413 }
    )
  }

  // Reject only when both checks fail — browsers vary in what MIME type they report for PDFs,
  // so accepting on either extension or MIME prevents spurious rejections.
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    return NextResponse.json(
      { status: 'error', code: 'unreadable_document', message: 'Only PDF files are accepted.' },
      { status: 422 }
    )
  }

  if (!checkDailyCap()) {
    console.log(`[extract] rejected reason=daily_cap_reached ip=${ip}`)
    return NextResponse.json(
      { error: 'daily_cap_reached', message: 'Demo is temporarily at capacity. Check back tomorrow.' },
      { status: 503 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await extractDocument(buffer, file.name, documentType)

  if (result.status === 'error' && result.code === 'upstream_capacity') {
    console.log(`[extract] rejected reason=upstream_limit ip=${ip}`)
    return NextResponse.json(
      { error: 'limit_reached', message: "This is only a prototype and has hit the compute limit we've given it. If you'd like to learn more, get in touch." },
      { status: 503 }
    )
  }

  return NextResponse.json(result, { status: result.status === 'error' ? 422 : 200 })
}
