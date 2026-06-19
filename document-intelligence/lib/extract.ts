import Anthropic from '@anthropic-ai/sdk'
import { getPrompt } from './prompts'
import { writeLog, type LogEntry } from './logger'
import type { ExtractionPayload, FieldKey, FieldValue } from './schemas'
import { COMPLIANCE_CERTIFICATE_FIELDS } from './schemas'

export interface ExtractionResult {
  status: 'success'
  document_type: string
  document_verified: boolean
  extracted_at: string
  fields: Record<FieldKey, FieldValue>
}

export interface ExtractionError {
  status: 'error'
  code: 'unreadable_document' | 'wrong_document_type' | 'extraction_failed' | 'upstream_capacity'
  message: string
}

const SUPPORTED_TYPES = [
  'compliance-certificate',
  'grs-scope-certificate',
  'gots-certificate',
  'transaction-certificate',
]

function blankFields(): Record<FieldKey, FieldValue> {
  return Object.fromEntries(
    COMPLIANCE_CERTIFICATE_FIELDS.map(k => [k, { value: null, confidence: 'low' as const }])
  ) as Record<FieldKey, FieldValue>
}

export async function extractDocument(
  buffer: Buffer,
  filename: string,
  documentType: string
): Promise<ExtractionResult | ExtractionError> {
  if (!SUPPORTED_TYPES.includes(documentType)) {
    return {
      status: 'error',
      code: 'wrong_document_type',
      message: `Document type "${documentType}" is not supported. Supported types: ${SUPPORTED_TYPES.join(', ')}.`,
    }
  }

  if (!buffer || buffer.length === 0) {
    return {
      status: 'error',
      code: 'unreadable_document',
      message: 'The uploaded file appears to be empty or could not be read.',
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL

  if (!apiKey || !model) {
    return {
      status: 'error',
      code: 'extraction_failed',
      message: 'Service configuration error. Please contact support.',
    }
  }

  let extractedText = ''
  let extractionPath: 'text' | 'base64' = 'base64'

  try {
    // Dynamic import so bundler doesn't inline pdf-parse (serverExternalPackages handles the rest).
    // We prefer the text path: it costs fewer tokens and is more reliable for digital PDFs.
    // The 100-char floor filters out metadata-only or image-only parses that contain no usable
    // content — those need the base64 path so Claude can process the visual layer instead.
    const mod = await import('pdf-parse')
    const pdfParse = (mod.default ?? mod) as (buf: Buffer) => Promise<{ text: string }>
    const parsed = await pdfParse(buffer)
    if (parsed.text && parsed.text.trim().length > 100) {
      extractedText = parsed.text.trim()
      extractionPath = 'text'
    }
  } catch {
    // Fall through to base64 path — scanned or encrypted PDF
  }

  const client = new Anthropic({ apiKey })
  const prompt = getPrompt(documentType)

  type ContentBlock =
    | { type: 'text'; text: string }
    | {
        type: 'document'
        source: {
          type: 'base64'
          media_type: 'application/pdf'
          data: string
        }
      }

  let messageContent: ContentBlock[]

  if (extractionPath === 'text') {
    // Inline the extracted text with the prompt — a single text block is sufficient.
    messageContent = [{ type: 'text', text: `${prompt}\n\n---\n\n${extractedText}` }]
  } else {
    // Claude's document API requires the document block to appear before the prompt text.
    const base64Pdf = buffer.toString('base64')
    messageContent = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Pdf,
        },
      },
      { type: 'text', text: prompt },
    ]
  }

  let parsed: ExtractionPayload | null = null
  const now = new Date().toISOString()
  const logBase: Omit<LogEntry, 'document_verified' | 'fields_extracted' | 'success'> = {
    timestamp: now,
    document_type: documentType,
    input_filename: filename,
    extraction_path: extractionPath,
    extracted_text_chars: extractedText.length,
  }

  // Two attempts: capacity errors bail immediately (retrying under load won't help);
  // parse or transient network errors get one retry before we give up.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: messageContent as Anthropic.MessageParam['content'],
          },
        ],
      })

      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') throw new Error('No text in response')

      let raw = textBlock.text.trim()
      // Strip markdown code fences if the model adds them despite instructions
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

      parsed = JSON.parse(raw) as ExtractionPayload
      break
    } catch (err: unknown) {
      const e = err as { status?: number; error?: { type?: string } }
      const isCapacity =
        e.status === 429 ||
        e.status === 529 ||
        e.error?.type === 'rate_limit_error' ||
        e.error?.type === 'overloaded_error'
      if (isCapacity) {
        await writeLog({ ...logBase, document_verified: null, fields_extracted: 0, success: false })
        return { status: 'error', code: 'upstream_capacity', message: 'The extraction service is temporarily at capacity.' }
      }
      if (attempt === 1) {
        await writeLog({
          ...logBase,
          document_verified: null,
          fields_extracted: 0,
          success: false,
        })
        return {
          status: 'error',
          code: 'extraction_failed',
          message: "We couldn't extract the required fields. Please review the document manually.",
        }
      }
    }
  }

  // TypeScript guard — the loop always either sets parsed and breaks, or returns early.
  if (!parsed) {
    await writeLog({ ...logBase, document_verified: null, fields_extracted: 0, success: false })
    return {
      status: 'error',
      code: 'extraction_failed',
      message: "We couldn't extract the required fields. Please review the document manually.",
    }
  }

  const fields: Record<FieldKey, FieldValue> = blankFields()
  let fieldsExtracted = 0

  if (parsed.fields) {
    for (const key of COMPLIANCE_CERTIFICATE_FIELDS) {
      const f = parsed.fields[key]
      if (f) {
        fields[key] = {
          value: f.value ?? null,
          confidence: ['high', 'medium', 'low'].includes(f.confidence) ? f.confidence : 'low',
        }
        if (f.value) fieldsExtracted++
      }
    }
  }

  await writeLog({
    ...logBase,
    document_verified: parsed.document_verified ?? false,
    fields_extracted: fieldsExtracted,
    success: true,
  })

  return {
    status: 'success',
    document_type: documentType,
    document_verified: parsed.document_verified ?? false,
    extracted_at: now,
    fields,
  }
}
