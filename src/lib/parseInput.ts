import { parseSse, type ParsedSseEntry } from './parseSse'

export type InputFormat = 'empty' | 'sse' | 'jsonl' | 'structured-log'

export interface ParsedInput {
  format: InputFormat
  entries: ParsedSseEntry[]
}

const sseFieldPattern = /^(?:data|event|id|retry)(?::|$)/
const timestampedJsonPattern = /^(\d{4}-\d{2}-\d{2}T\S+Z)\s+([\[{].*)$/

export function parseInput(input: string): ParsedInput {
  const normalized = input.replace(/\r\n?/g, '\n')
  const nonEmptyLines = normalized.split('\n').filter((line) => line.trim())

  if (nonEmptyLines.length === 0) return { format: 'empty', entries: [] }

  const isSse = nonEmptyLines.some(
    (line) => line.startsWith(':') || sseFieldPattern.test(line),
  )

  if (isSse) return { format: 'sse', entries: parseSse(normalized) }

  const isStructuredLog = nonEmptyLines.some((line) =>
    timestampedJsonPattern.test(line.trim()),
  )

  const entries = nonEmptyLines.map((line, index): ParsedSseEntry => {
    const trimmedLine = line.trim()
    const timestampedMatch = isStructuredLog
      ? trimmedLine.match(timestampedJsonPattern)
      : null
    const data = timestampedMatch?.[2] ?? trimmedLine
    const entry: ParsedSseEntry = {
      sequence: index + 1,
      kind: 'event',
      data,
      jsonStatus: 'invalid',
      event: isStructuredLog ? 'Log entry' : 'JSONL record',
      unknownFields: timestampedMatch
        ? [{ field: 'stream timestamp', value: timestampedMatch[1] }]
        : [],
    }

    try {
      entry.parsed = JSON.parse(data)
      entry.jsonStatus = 'valid'
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      entry.parseError = `Invalid JSON on record ${index + 1}: ${message}`
    }

    return entry
  })

  return { format: isStructuredLog ? 'structured-log' : 'jsonl', entries }
}
