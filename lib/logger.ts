import fs from 'fs/promises'
import path from 'path'

const LOGS_DIR = path.join(process.cwd(), 'logs')

export interface LogEntry {
  timestamp: string
  document_type: string
  input_filename: string
  extraction_path: 'text' | 'base64'
  extracted_text_chars: number
  document_verified: boolean | null
  fields_extracted: number
  success: boolean
}

export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true })
    const slug = entry.document_type.replace(/[^a-z0-9]/gi, '-')
    const ts = entry.timestamp.replace(/[:.]/g, '-').slice(0, 19)
    const rand = Math.random().toString(16).slice(2, 6)
    const filename = `${ts}-${slug}-${rand}.json`
    await fs.writeFile(
      path.join(LOGS_DIR, filename),
      JSON.stringify(entry, null, 2),
      'utf8'
    )
  } catch {
    // log failures are non-fatal
  }
}
