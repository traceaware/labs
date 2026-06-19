import Link from 'next/link'

const B = 'rgba(41,8,0,0.12)'
const BS = 'rgba(41,8,0,0.24)'
const EM = '#6B4A40'

/* Hardcoded HTML strings for the syntax-highlighted code blocks.
   dangerouslySetInnerHTML is safe here — no user input involved. */

const k = (s: string) => `<span style="color:rgba(245,245,245,0.4)">${s}</span>`
const str = (s: string) => `<span style="color:#FF9980">${s}</span>`
const boolT = (s: string) => `<span style="color:#66CC99">${s}</span>`
const boolF = (s: string) => `<span style="color:#FF6B6B">${s}</span>`
const comment = (s: string) => `<span style="color:rgba(245,245,245,0.22);font-style:italic">${s}</span>`

const POST_RESPONSE_HTML = [
  '{',
  `  ${k('"status"')}: ${str('"success"')},`,
  `  ${k('"document_verified"')}: ${boolT('true')},`,
  `  ${k('"match"')}: ${boolT('true')},`,
  `  ${k('"fields"')}: {`,
  `    ${k('"certified_entity"')}: ${str('"Shenzhen Textile Co."')},`,
  `    ${k('"certificate_number"')}: ${str('"GRS-2024-CN-00421"')},`,
  `    ${k('"certification_body"')}: ${str('"Control Union"')},`,
  `    ${k('"certified_scope"')}: ${str('"Recycled polyester yarn"')},`,
  `    ${k('"issue_date"')}: ${str('"2024-03-01"')},`,
  `    ${k('"expiry_date"')}: ${str('"2025-02-28"')},`,
  `    ${k('"expired"')}: ${boolF('false')}`,
  '  }',
  '}',
].join('\n')

const GET_RESPONSE_HTML = [
  '{',
  `  ${k('"session_id"')}: ${str('"sess_abc123"')},`,
  `  ${k('"created_at"')}: ${str('"2026-06-01T09:14:00Z"')},`,
  `  ${k('"documents"')}: [`,
  '    {',
  `      ${k('"document_verified"')}: ${boolT('true')},`,
  `      ${k('"match"')}: ${boolT('true')},`,
  `      ${k('"fields"')}: { ${comment('...')} }`,
  '    }',
  '  ]',
  '}',
].join('\n')

const REQ = <span style={{ color: '#FF3300', fontSize: '10px', verticalAlign: 'middle' }}>required</span>

export default function LandingPage() {
  return (
    <main>

      {/* ── HERO ── */}
      <section style={{
        padding: '96px 48px 80px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <h1 style={{
          fontSize: '56px',
          fontWeight: 600,
          lineHeight: 1.08,
          color: '#290800',
          maxWidth: '800px',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
        }}>
          Check supplier documentation auto-magically.
        </h1>
        <p style={{
          fontSize: '17px',
          color: EM,
          maxWidth: '680px',
          lineHeight: 1.65,
          marginBottom: '40px',
        }}>
          Suppliers upload wrong documents, and most systems don&apos;t notice until it&apos;s too late. AWARE™ Document Intelligence reads every document, tells you what it is, checks it against what it should be, and flags expired certificates and mistakes before they become someone else&apos;s problem.
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/demo" style={{
            background: '#FF3300',
            color: '#F5F5F5',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            Try the demo
          </Link>
          <a href="#api-section" style={{
            background: 'none',
            color: '#290800',
            border: `0.5px solid ${BS}`,
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            See how it works
          </a>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section style={{
        padding: '48px 48px 80px',
        borderTop: `0.5px solid ${B}`,
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#290800', marginBottom: '36px' }}>
          Why it matters
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          <ValueItem n="01" title="We can tell you what your users upload" pr={40} pl={0} border>
            Suppliers upload the wrong documents all the time. They&apos;re busy, under pressure. By the time anyone notices, it can be too late and workflows have to start over. We read the document and tell you what it actually is - before it becomes a problem.
          </ValueItem>
          <ValueItem n="02" title="We can check if it's what you need" pr={40} pl={40} border>
            Most compliance systems don&apos;t care if the document is correct - if there&apos;s a file, a box is ticked. We care. Send us a document and an expectation - a GRS scope certificate, a GOTS certificate, a transaction certificate - and we&apos;ll tell you whether it matches.
          </ValueItem>
          <ValueItem n="03" title="We can spot expired documents immediately" pr={0} pl={40} border={false}>
            A certificate that expired six months ago is not evidence of anything useful - but it has a similar file name to the new one. We check expiry dates as part of every read and flag documents that are past their expiration or approaching it.
          </ValueItem>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{
        padding: '80px 48px',
        borderTop: `0.5px solid ${B}`,
        background: '#290800',
        color: '#F5F5F5',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, color: '#F5F5F5', marginBottom: '0', lineHeight: 1.2 }}>
            How it works
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(245,245,245,0.55)', marginTop: '-16px', marginBottom: '48px', maxWidth: '520px', lineHeight: 1.6 }}>
            An API service built for machines - this is a demo.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '32px' }}>
            <HowStep n="01" title="Send a document" connector>
              POST a document - PDF, scan, photo - to our API along with what you expect it to be.
            </HowStep>
            <HowStep n="02" title="We read it" connector>
              Our service reads the document, identifies what it is, and extracts the key details.
            </HowStep>
            <HowStep n="03" title="We check your expectation" connector>
              We compare what we found against what you said the document should be - including whether it&apos;s expired.
            </HowStep>
            <HowStep n="04" title="You get a verdict" connector={false}>
              Match or mismatch. Your system decides what happens next.
            </HowStep>
          </div>
        </div>
      </section>

      {/* ── API REFERENCE ── */}
      <section id="api-section" style={{
        padding: '80px 48px',
        borderTop: `0.5px solid ${B}`,
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#290800', marginBottom: '8px' }}>
          One endpoint with one job
        </h2>
        <p style={{ fontSize: '14px', color: EM, marginBottom: 0, maxWidth: '480px' }}>
          Send a document and an expectation. Get back what the document is, its key details, and whether it matches.
        </p>

        {/* POST /api/v1/extract */}
        <ApiEndpoint
          method="POST"
          path="/api/v1/extract"
          desc="Submit a document for extraction and verification."
          params={
            <>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(245,245,245,0.3)', letterSpacing: '0.08em', marginBottom: '14px' }}>
                REQUEST BODY &nbsp;·&nbsp; multipart/form-data
              </p>
              <ParamRow name="file" req meta="file · PDF" desc="The document to extract. PDF only. Max 10 MB." />
              <ParamRow
                name="document_type" req
                meta="string"
                desc={<>What the document is expected to be. One of: <code style={{ fontSize: '11px', color: '#FF9980' }}>grs-scope-certificate</code>, <code style={{ fontSize: '11px', color: '#FF9980' }}>gots-certificate</code>, <code style={{ fontSize: '11px', color: '#FF9980' }}>transaction-certificate</code></>}
              />
              <ParamRow name="session_id" meta="string · optional" desc="Group multiple extractions into a named session for retrieval." last />
            </>
          }
          responseTitle="RESPONSE · 200 OK"
          responseHtml={POST_RESPONSE_HTML}
        />

        {/* GET /api/v1/session/:id */}
        <ApiEndpoint
          method="GET"
          path="/api/v1/session/:id"
          desc="Retrieve previous extraction results by session ID."
          params={
            <>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(245,245,245,0.3)', letterSpacing: '0.08em', marginBottom: '14px' }}>
                PATH PARAMETERS
              </p>
              <ParamRow
                name="id" req
                meta="string"
                desc={<>The session ID returned from a previous <code style={{ fontSize: '11px', color: '#FF9980' }}>POST /extract</code> call, or one you provided at submission time.</>}
                last
              />
            </>
          }
          responseTitle={<>RESPONSE · 200 OK <span style={{ color: 'rgba(245,245,245,0.25)', fontWeight: 400 }}>coming in v1.1</span></>}
          responseHtml={GET_RESPONSE_HTML}
        />

        <div style={{ marginTop: '32px' }}>
          <a
            href="mailto:rhys@wearaware.co"
            style={{
              background: '#FF3300',
              color: '#F5F5F5',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Get in touch about API access
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '48px',
        borderTop: `0.5px solid ${B}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <p style={{ fontSize: '13px', color: EM }}>
          AWARE™ Document Intelligence is part of the AWARE™ platform by The Movement B.V., Amsterdam.
        </p>
        <Link href="/demo" style={{ fontSize: '13px', color: '#FF3300', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
          Try the demo →
        </Link>
      </div>

    </main>
  )
}

/* ── Sub-components ── */

function ValueItem({ n, title, children, pr, pl, border }: {
  n: string; title: string; children: React.ReactNode; pr: number; pl: number; border: boolean
}) {
  return (
    <div style={{ padding: `32px ${pr}px 32px ${pl}px`, borderRight: border ? `0.5px solid ${B}` : 'none' }}>
      <span style={{ fontSize: '11px', fontWeight: 500, color: '#FF3300', marginBottom: '16px', display: 'block' }}>{n}</span>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#290800', marginBottom: '12px', lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: '14px', color: EM, lineHeight: 1.65 }}>{children}</p>
    </div>
  )
}

function HowStep({ n, title, children, connector }: {
  n: string; title: string; children: React.ReactNode; connector: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <p style={{ fontSize: '11px', color: 'rgba(245,245,245,0.3)', marginBottom: '12px', fontWeight: 500 }}>{n}</p>
      <p style={{ fontSize: '15px', fontWeight: 500, color: '#F5F5F5', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'rgba(245,245,245,0.5)', lineHeight: 1.6 }}>{children}</p>
      {connector && (
        <span style={{ position: 'absolute', top: '6px', right: '-16px', color: 'rgba(245,245,245,0.2)', fontSize: '12px' }}>→</span>
      )}
    </div>
  )
}

function ApiEndpoint({ method, path, desc, params, responseTitle, responseHtml }: {
  method: 'POST' | 'GET'
  path: string
  desc: string
  params: React.ReactNode
  responseTitle: React.ReactNode
  responseHtml: string
}) {
  const methodColor = method === 'POST'
    ? { bg: '#FF3300', text: '#1a1a1a' }
    : { bg: '#66CC99', text: '#0a2e1a' }

  return (
    <div style={{ marginTop: '24px', background: '#290800', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', borderBottom: '0.5px solid rgba(245,245,245,0.08)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: methodColor.text, background: methodColor.bg, padding: '3px 7px', borderRadius: '3px', flexShrink: 0 }}>
          {method}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#F5F5F5', fontFamily: "'Courier New', monospace", flex: 1 }}>
          {path}
        </span>
        <span style={{ fontSize: '13px', color: 'rgba(245,245,245,0.55)', lineHeight: 1.5 }}>{desc}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ padding: '20px 24px', borderRight: '0.5px solid rgba(245,245,245,0.08)' }}>{params}</div>
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(245,245,245,0.3)', letterSpacing: '0.08em', marginBottom: '14px' }}>
            {responseTitle}
          </p>
          <pre
            style={{
              background: 'rgba(245,245,245,0.05)',
              borderRadius: '6px',
              padding: '14px 16px',
              fontSize: '12px',
              fontFamily: "'Courier New', monospace",
              color: 'rgba(245,245,245,0.7)',
              lineHeight: 1.75,
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: responseHtml }}
          />
        </div>
      </div>
    </div>
  )
}

function ParamRow({ name, req, meta, desc, last }: {
  name: string; req?: boolean; meta: string; desc: React.ReactNode; last?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px 0', borderBottom: last ? 'none' : '0.5px solid rgba(245,245,245,0.06)' }}>
      <span style={{ fontSize: '12px', fontFamily: "'Courier New', monospace", color: '#FF9980' }}>
        {name} {req && REQ}
      </span>
      <span style={{ fontSize: '11px', color: 'rgba(245,245,245,0.3)' }}>{meta}</span>
      <span style={{ fontSize: '12px', color: 'rgba(245,245,245,0.55)', lineHeight: 1.5, marginTop: '2px' }}>{desc}</span>
    </div>
  )
}
