import { describe, expect, it } from 'vitest'
import { parseInput } from './parseInput'

describe('parseInput', () => {
  it('detects and parses SSE input', () => {
    const result = parseInput('data: {"one":1}\n\n: ping')

    expect(result.format).toBe('sse')
    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].parsed).toEqual({ one: 1 })
  })

  it('previews each non-empty JSONL line as a record', () => {
    const result = parseInput('{"one":1}\n\n[2,3]\ntrue')

    expect(result.format).toBe('jsonl')
    expect(result.entries.map((entry) => entry.parsed)).toEqual([
      { one: 1 },
      [2, 3],
      true,
    ])
  })

  it('keeps malformed JSONL records visible as errors', () => {
    const result = parseInput('{"ok":true}\n{"broken":')

    expect(result.entries[1]).toMatchObject({
      data: '{"broken":',
      jsonStatus: 'invalid',
      parseError: expect.stringMatching(/record 2/i),
    })
  })

  it('parses timestamp-prefixed JSON logs and retains the outer timestamp', () => {
    const result = parseInput(
      '2026-08-13T04:58:52.056426394Z {"level":"INFO","message":"healthy"}\n' +
        '2026-08-13T04:58:53.464036314Z {"level":"ERROR","line":482}',
    )

    expect(result.format).toBe('structured-log')
    expect(result.entries).toHaveLength(2)
    expect(result.entries[0]).toMatchObject({
      parsed: { level: 'INFO', message: 'healthy' },
      jsonStatus: 'valid',
      event: 'Log entry',
      unknownFields: [
        {
          field: 'stream timestamp',
          value: '2026-08-13T04:58:52.056426394Z',
        },
      ],
    })
  })

  it('does not change SSE parsing when its JSON contains timestamps', () => {
    const result = parseInput(
      'data: {"timestamp":"2026-08-13T04:58:52.056Z","message":"healthy"}',
    )

    expect(result.format).toBe('sse')
    expect(result.entries[0].parsed).toEqual({
      timestamp: '2026-08-13T04:58:52.056Z',
      message: 'healthy',
    })
  })

  it('reports whitespace-only input as empty', () => {
    expect(parseInput(' \n\n')).toEqual({ format: 'empty', entries: [] })
  })
})
