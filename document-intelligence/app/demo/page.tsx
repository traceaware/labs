'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import s from './demo.module.css'

const B = 'rgba(41,8,0,0.12)'
const BS = 'rgba(41,8,0,0.24)'
const EM = '#6B4A40'

type DemoStatus = 'idle' | 'loading' | 'done' | 'error'

interface FieldValue {
  value: string | null
  confidence: 'high' | 'medium' | 'low'
}

interface ApiResult {
  status?: 'success' | 'error'
  document_verified?: boolean
  document_type?: string
  extracted_at?: string
  fields?: Record<string, FieldValue>
  code?: string
  error?: string
  message?: string
}

const CERT_OPTIONS = [
  {
    value: 'grs-scope-certificate',
    label: 'GRS scope certificate',
    subtitle: 'Global Recycled Standard',
    iconType: 'check' as const,
  },
  {
    value: 'gots-certificate',
    label: 'GOTS certificate',
    subtitle: 'Global Organic Textile Standard',
    iconType: 'check' as const,
  },
  {
    value: 'transaction-certificate',
    label: 'Transaction certificate',
    subtitle: 'TC - any standard body',
    iconType: 'doc' as const,
  },
]

const FIELD_ROWS = [
  { key: 'certified_entity', label: 'Certified entity' },
  { key: 'certificate_number', label: 'Certificate number' },
  { key: 'certification_body', label: 'Certification body' },
  { key: 'certified_scope', label: 'Certified scope' },
  { key: 'issue_date', label: 'Issue date' },
  { key: 'expiry_date', label: 'Expiry date' },
]

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DemoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [certType, setCertType] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<DemoStatus>('idle')
  const [result, setResult] = useState<ApiResult | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [revealedCount, setRevealedCount] = useState(0)
  const [verdictRevealed, setVerdictRevealed] = useState(false)
  const [expiryRevealed, setExpiryRevealed] = useState(false)
  const [timingVisible, setTimingVisible] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [systemError, setSystemError] = useState<{ code: string; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timeouts.current.forEach(clearTimeout) }
  }, [])

  const clearTimeouts = () => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setFileError(null)
    setSystemError(null)
    setStatus('idle')
    setResult(null)
    setRevealedCount(0)
    setVerdictRevealed(false)
    setExpiryRevealed(false)
    setTimingVisible(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  const runDemo = async () => {
    if (!file || !certType) return
    clearTimeouts()
    setStatus('loading')
    setResult(null)
    setSystemError(null)
    setRevealedCount(0)
    setVerdictRevealed(false)
    setExpiryRevealed(false)
    setTimingVisible(false)

    const start = Date.now()
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('document_type', certType)
      const res = await fetch('/api/v1/extract', { method: 'POST', body: fd })
      const data: ApiResult = await res.json()
      const elapsed = Date.now() - start
      setElapsedMs(elapsed)

      if (!res.ok) {
        if (data.error === 'file_too_large') {
          setFileError(data.message ?? 'File too large. Maximum size is 5MB.')
        } else if (data.error) {
          setSystemError({ code: data.error, message: data.message ?? 'Something went wrong. Please try again.' })
        }
        setStatus('idle')
        return
      }

      if (data.status === 'error') {
        setStatus('idle')
        return
      }

      setResult(data)
      setStatus('done')

      FIELD_ROWS.forEach((_, i) => {
        const t = setTimeout(() => setRevealedCount(i + 1), i * 200)
        timeouts.current.push(t)
      })
      const vt = setTimeout(() => setVerdictRevealed(true), FIELD_ROWS.length * 200 + 300)
      timeouts.current.push(vt)
      const et = setTimeout(() => setExpiryRevealed(true), FIELD_ROWS.length * 200 + 450)
      timeouts.current.push(et)
      const tt = setTimeout(() => setTimingVisible(true), FIELD_ROWS.length * 200 + 500)
      timeouts.current.push(tt)

    } catch {
      setStatus('idle')
    }
  }

  const resetDemo = () => {
    clearTimeouts()
    setFile(null)
    setCertType(null)
    setStatus('idle')
    setResult(null)
    setRevealedCount(0)
    setVerdictRevealed(false)
    setExpiryRevealed(false)
    setTimingVisible(false)
    setFileError(null)
    setSystemError(null)
    setIsDragging(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const certLabel = CERT_OPTIONS.find(o => o.value === certType)?.label ?? certType ?? ''
  const isMatch = result?.document_verified === true
  const docTypeText = result
    ? (isMatch ? `${certLabel} — detected` : 'Document type not recognised')
    : ''

  const btnDisabled = !file || !certType || status === 'loading'
  const btnText = status === 'loading' ? 'Reading...' : status === 'done' ? 'Reset' : 'Read document'
  const btnOpacity = status === 'loading' ? 0.7 : btnDisabled ? 0.35 : 1
  const btnCursor = status === 'loading' ? 'wait' : btnDisabled ? 'not-allowed' : 'pointer'

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>

      {/* Demo header */}
      <div style={{ padding: '32px 48px 0', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#290800', marginBottom: '6px' }}>
          What our API does
        </h1>
        <p style={{ fontSize: '14px', color: EM, marginBottom: '32px' }}>
          Upload a certificate and set your expectation. Your system sends us a document, we read it and get you a verdict in 1.1s.
        </p>
      </div>

      {/* Demo body */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: 0,
        borderTop: `0.5px solid ${B}`,
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        padding: '32px 48px 48px',
      }}>

        {/* LEFT: Input panel */}
        <div style={{ paddingRight: '40px', borderRight: `0.5px solid ${B}` }}>
          <p style={{ fontSize: '11px', fontWeight: 500, color: EM, letterSpacing: '0.02em', marginBottom: '16px' }}>
            1. Upload a document
          </p>

          {/* Upload zone */}
          <div
            className={`${s.uploadZone} ${file ? s.uploadZoneHasFile : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            style={isDragging ? { borderColor: '#FF3300', background: 'rgba(255,51,0,0.02)' } : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#290800', marginTop: '8px', marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF3300', flexShrink: 0 }} />
                {file.name}
              </div>
            ) : (
              <>
                <svg style={{ width: '36px', height: '36px', margin: '0 auto 12px', color: EM }} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 4v20M10 12l8-8 8 8"/>
                  <path d="M6 28h24" strokeWidth="1.5"/>
                </svg>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#290800', marginBottom: '4px' }}>Drop a PDF here</p>
                <p style={{ fontSize: '12px', color: EM }}>or click to choose a file</p>
              </>
            )}
          </div>

          {fileError && (
            <p style={{ fontSize: '12px', color: '#B91C1C', marginTop: '-16px', marginBottom: '16px' }}>
              {fileError}
            </p>
          )}

          <p style={{ fontSize: '11px', fontWeight: 500, color: EM, letterSpacing: '0.02em', marginBottom: '10px', marginTop: '8px' }}>
            2. What do you expect it to be?
          </p>
          <p style={{ fontSize: '12px', color: EM, marginBottom: '14px' }}>
            Select the document type your system expected the user to upload.
          </p>

          <div style={{ marginBottom: '28px' }}>
            {CERT_OPTIONS.map(opt => (
              <div
                key={opt.value}
                className={`${s.certOption} ${certType === opt.value ? s.certOptionSelected : ''}`}
                onClick={() => setCertType(opt.value)}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: `1.5px solid ${certType === opt.value ? '#290800' : BS}`,
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.12s',
                }}>
                  {certType === opt.value && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#290800', display: 'block' }} />
                  )}
                </div>

                <div style={{
                  width: '32px', height: '32px', borderRadius: '4px',
                  background: 'rgba(41,8,0,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {opt.iconType === 'check' ? (
                    <svg viewBox="0 0 14 14" fill="none" stroke={EM} strokeWidth="1.2" style={{ width: '14px', height: '14px' }}>
                      <circle cx="7" cy="7" r="6"/>
                      <path d="M4 7l2 2 4-4"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 14 14" fill="none" stroke={EM} strokeWidth="1.2" style={{ width: '14px', height: '14px' }}>
                      <rect x="2" y="2" width="10" height="10" rx="1.5"/>
                      <path d="M4.5 7h5M4.5 5h5M4.5 9h3"/>
                    </svg>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#290800', display: 'block' }}>{opt.label}</span>
                  <span style={{ fontSize: '11px', color: EM, display: 'block', marginTop: '1px', fontWeight: 400 }}>{opt.subtitle}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={btnDisabled}
            onClick={status === 'done' ? resetDemo : runDemo}
            style={{
              width: '100%',
              background: '#290800',
              color: '#F5F5F5',
              border: 'none',
              padding: '13px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: btnCursor,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
              opacity: btnOpacity,
            }}
          >
            {btnText}
          </button>
        </div>

        {/* RIGHT: Result panel */}
        <div style={{ paddingLeft: '40px', minHeight: '400px' }}>

          {/* Empty state */}
          {status === 'idle' && !systemError && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', minHeight: '320px', textAlign: 'center',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                border: `0.5px dashed ${BS}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A7060" strokeWidth="1.2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
              <p style={{ fontSize: '13px', color: EM, maxWidth: '220px', lineHeight: 1.6 }}>
                Upload a document and set an expectation to see what we&apos;d return to your system.
              </p>
            </div>
          )}

          {/* System error block — limit_reached, rate_limited, daily_cap_reached */}
          {status === 'idle' && systemError && (
            <div className={`${s.verdictBlock} ${s.verdictBlockMismatch} ${s.verdictBlockRevealed}`} style={{ marginTop: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', background: 'rgba(185,28,28,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#991B1B" strokeWidth="1.5"/>
                  <path d="M8 7.5v4" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="5" r="0.75" fill="#991B1B"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                {systemError.code === 'limit_reached' ? (
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#B91C1C' }}>
                    This is only a prototype and has hit the compute limit we&apos;ve given it. If you&apos;d like to learn more,{' '}
                    <a href="mailto:rhys@wearaware.co" style={{ color: '#991B1B', textDecoration: 'underline', fontWeight: 500 }}>get in touch</a>.
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#B91C1C' }}>
                    {systemError.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {status === 'loading' && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500, color: EM, letterSpacing: '0.01em', marginBottom: '0', opacity: 0.5 }}>
                Reading document
              </p>
              <div className={s.loadingDots}>
                <div className={s.loadingDot} />
                <div className={s.loadingDot} />
                <div className={s.loadingDot} />
              </div>
            </div>
          )}

          {/* Result fields */}
          {(status === 'done') && result && (
            <div>
              <p style={{
                fontSize: '12px', fontWeight: 500, color: EM,
                letterSpacing: '0.01em', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {docTypeText}
              </p>

              {/* Verdict block — appears after fields */}
              <div className={`${s.verdictBlock} ${isMatch ? s.verdictBlockMatch : s.verdictBlockMismatch} ${verdictRevealed ? s.verdictBlockRevealed : ''}`}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px',
                  background: isMatch ? 'rgba(45,125,70,0.12)' : 'rgba(185,28,28,0.1)',
                }}>
                  {isMatch ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#1A5C2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '15px', fontWeight: 600, marginBottom: '4px',
                    color: isMatch ? '#1A5C2E' : '#991B1B',
                  }}>
                    {isMatch ? 'Document matches' : 'Document type mismatch'}
                  </p>
                  <p style={{
                    fontSize: '13px', lineHeight: 1.5,
                    color: isMatch ? '#2D7D46' : '#B91C1C',
                  }}>
                    {isMatch
                      ? `This is a valid ${certLabel}. It matches your expectation.`
                      : `This does not appear to be a ${certLabel}.`}
                  </p>
                  <div className={`${s.verdictTiming} ${timingVisible ? s.verdictTimingVisible : ''}`}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2D7D46', flexShrink: 0 }} />
                    Processed in {(elapsedMs / 1000).toFixed(1)}s
                  </div>
                </div>
              </div>

              {/* Expiry callout — only when certificate is expired */}
              {isExpired(result.fields?.expiry_date?.value ?? null) && (
                <div className={`${s.verdictBlock} ${s.verdictBlockMismatch} ${expiryRevealed ? s.verdictBlockRevealed : ''}`}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', background: 'rgba(185,28,28,0.1)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2.5L14 13.5H2L8 2.5Z" stroke="#991B1B" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M8 6.5v3" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="11.5" r="0.75" fill="#991B1B"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: '#991B1B' }}>Certificate expired</p>
                    <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#B91C1C' }}>
                      This certificate expired on {formatDate(result.fields!.expiry_date!.value!)}.
                    </p>
                  </div>
                </div>
              )}

              {/* Field rows */}
              {FIELD_ROWS.map((row, i) => {
                const field = result.fields?.[row.key]
                const val = field?.value ?? null
                return (
                  <div
                    key={row.key}
                    className={`${s.fieldRow} ${i < revealedCount ? s.fieldRowRevealed : ''}`}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 500, color: EM, letterSpacing: '0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 500, color: '#290800' }}>
                      {val ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Demo context bar */}
      <div style={{
        background: 'rgba(41,8,0,0.04)',
        borderTop: `0.5px solid ${B}`,
        padding: '14px 48px',
        fontSize: '12px',
        color: EM,
        lineHeight: 1.5,
      }}>
        <strong style={{ color: '#290800', fontWeight: 500 }}>This is a demo.</strong>{' '}
        In production, your system sends a document and an expectation via API - no interface needed. The result you see here is exactly what your system receives as JSON.{' '}
        <Link href="/#api-section" style={{ color: '#FF3300', cursor: 'pointer' }}>
          See the API reference →
        </Link>
      </div>

    </div>
  )
}
