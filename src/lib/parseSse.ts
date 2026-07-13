export type JsonStatus = 'valid' | 'invalid' | 'none'

export interface UnknownSseField {
  field: string
  value: string
}

export interface ParsedSseEntry {
  sequence: number
  kind: 'event' | 'comment'
  data: string
  parsed?: unknown
  jsonStatus: JsonStatus
  parseError?: string
  comment?: string
  event?: string
  id?: string
  retry?: number
  unknownFields: UnknownSseField[]
}

function fieldValue(line: string, colonIndex: number): string {
  if (colonIndex === -1) return ''
  const value = line.slice(colonIndex + 1)
  return value.startsWith(' ') ? value.slice(1) : value
}

export function parseSse(input: string): ParsedSseEntry[] {
  const normalized = input.replace(/\r\n?/g, '\n')
  if (!normalized.trim()) return []

  const blocks = normalized.split(/\n[ \t]*\n+/)
  const entries: ParsedSseEntry[] = []

  for (const block of blocks) {
    if (!block.trim()) continue

    const dataLines: string[] = []
    const comments: string[] = []
    const unknownFields: UnknownSseField[] = []
    let event: string | undefined
    let id: string | undefined
    let retry: number | undefined

    for (const line of block.split('\n')) {
      if (line.startsWith(':')) {
        comments.push(line.slice(1).replace(/^ /, ''))
        continue
      }
      if (!line) continue

      const colonIndex = line.indexOf(':')
      const field = colonIndex === -1 ? line : line.slice(0, colonIndex)
      const value = fieldValue(line, colonIndex)

      switch (field) {
        case 'data':
          dataLines.push(value)
          break
        case 'event':
          event = value
          break
        case 'id':
          id = value
          break
        case 'retry': {
          const parsedRetry = Number(value)
          if (Number.isInteger(parsedRetry) && parsedRetry >= 0) retry = parsedRetry
          else unknownFields.push({ field, value })
          break
        }
        default:
          unknownFields.push({ field, value })
      }
    }

    const data = dataLines.join('\n')
    const hasEventFields =
      dataLines.length > 0 ||
      event !== undefined ||
      id !== undefined ||
      retry !== undefined ||
      unknownFields.length > 0

    if (!hasEventFields && comments.length > 0) {
      entries.push({
        sequence: entries.length + 1,
        kind: 'comment',
        data: '',
        jsonStatus: 'none',
        comment: comments.join('\n'),
        unknownFields: [],
      })
      continue
    }

    if (!hasEventFields) continue

    const entry: ParsedSseEntry = {
      sequence: entries.length + 1,
      kind: 'event',
      data,
      jsonStatus: dataLines.length > 0 ? 'invalid' : 'none',
      comment: comments.length > 0 ? comments.join('\n') : undefined,
      event,
      id,
      retry,
      unknownFields,
    }

    if (dataLines.length > 0) {
      try {
        entry.parsed = JSON.parse(data)
        entry.jsonStatus = 'valid'
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        entry.parseError = `Invalid JSON: ${message}`
      }
    }

    entries.push(entry)
  }

  return entries
}
