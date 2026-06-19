export const COMPLIANCE_CERTIFICATE_FIELDS = [
  'certified_entity',
  'certificate_number',
  'certification_body',
  'certified_scope',
  'issue_date',
  'expiry_date',
] as const

export type FieldKey = typeof COMPLIANCE_CERTIFICATE_FIELDS[number]

export interface FieldValue {
  value: string | null
  confidence: 'high' | 'medium' | 'low'
}

export interface ExtractionPayload {
  document_verified: boolean
  document_type_detected: string
  fields: Record<FieldKey, FieldValue>
}

export const SCHEMA_DESCRIPTION = `{
  "document_verified": true,
  "document_type_detected": "compliance-certificate",
  "fields": {
    "certified_entity":   { "value": "string or null", "confidence": "high | medium | low" },
    "certificate_number": { "value": "string or null", "confidence": "high | medium | low" },
    "certification_body": { "value": "string or null", "confidence": "high | medium | low" },
    "certified_scope":    { "value": "string or null", "confidence": "high | medium | low" },
    "issue_date":         { "value": "YYYY-MM-DD or null", "confidence": "high | medium | low" },
    "expiry_date":        { "value": "YYYY-MM-DD or null", "confidence": "high | medium | low" }
  }
}`

export function fieldLabel(key: string): string {
  const words = key.split('_').join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
