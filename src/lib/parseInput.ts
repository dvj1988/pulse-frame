import { parseSse, type ParsedSseEntry } from './parseSse'

export type InputFormat = 'empty' | 'sse' | 'jsonl'

export interface ParsedInput {
  format: InputFormat
  entries: ParsedSseEntry[]
}

const sseFieldPattern = /^(?:data|event|id|retry)(?::|$)/

export function parseInput(input: string): ParsedInput {
  const normalized = input.replace(/\r\n?/g, '\n')
  const nonEmptyLines = normalized.split('\n').filter((line) => line.trim())

  if (nonEmptyLines.length === 0) return { format: 'empty', entries: [] }

  const isSse = nonEmptyLines.some(
    (line) => line.startsWith(':') || sseFieldPattern.test(line),
  )

  if (isSse) return { format: 'sse', entries: parseSse(normalized) }

  const entries = nonEmptyLines.map((line, index): ParsedSseEntry => {
    const data = line.trim()
    const entry: ParsedSseEntry = {
      sequence: index + 1,
      kind: 'event',
      data,
      jsonStatus: 'invalid',
      event: 'JSONL record',
      unknownFields: [],
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

  return { format: 'jsonl', entries }
}
