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

  it('reports whitespace-only input as empty', () => {
    expect(parseInput(' \n\n')).toEqual({ format: 'empty', entries: [] })
  })
})
