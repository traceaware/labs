import { SCHEMA_DESCRIPTION } from './schemas'

function buildPrompt(docName: string, docDescription: string): string {
  return `You are a document data extraction engine. Your task is to extract structured fields from a ${docName}.

Examine the document carefully. First, determine whether it is a ${docDescription}. Set "document_verified" to true if it is, false if it is not.

If it is a valid ${docName}, extract the following fields as accurately as possible:
- certified_entity: The name of the company, factory, or facility being certified
- certificate_number: The unique identifier or reference number of the certificate
- certification_body: The organisation that issued the certificate (the certifier, not the scheme owner)
- certified_scope: The activities, products, or processes covered by the certification
- issue_date: The date the certificate was issued (normalise to YYYY-MM-DD)
- expiry_date: The date the certificate expires (normalise to YYYY-MM-DD)

For each field, assign a confidence level:
- high: the field is explicitly labelled in the document and the value is unambiguous — for example, a field clearly marked "Certificate Number:" with a value directly next to it.
- medium: the value is present but required some inference — for example, a date found in a sentence rather than next to a clear label, or a company name that appears in the document body but isn't in a dedicated field.
- low: the value was genuinely uncertain — for example, inferred from context with no direct reference, or where multiple possible values existed and one was chosen.

If a field cannot be found, set its value to null with confidence "low".

Return ONLY valid JSON matching this exact schema — no preamble, no explanation, no markdown fences:
${SCHEMA_DESCRIPTION}`
}

const PROMPTS: Record<string, string> = {
  'compliance-certificate': buildPrompt(
    'compliance or certification certificate',
    'a valid compliance or certification certificate (ISO, GOTS, OEKO-TEX, SA8000, BCI, or similar scheme)',
  ),
  'grs-scope-certificate': buildPrompt(
    'GRS scope certificate',
    'a valid GRS (Global Recycled Standard) scope certificate issued by an accredited certification body',
  ),
  'gots-certificate': buildPrompt(
    'GOTS certificate',
    'a valid GOTS (Global Organic Textile Standard) certificate issued by an approved certification body',
  ),
  'transaction-certificate': buildPrompt(
    'transaction certificate',
    'a valid transaction certificate (TC) issued under any recognised standard (GRS, GOTS, OCS, RCS, or similar)',
  ),
}

export function getPrompt(documentType: string): string {
  return PROMPTS[documentType] ?? PROMPTS['compliance-certificate']
}
