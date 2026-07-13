import { describe, expect, it } from 'vitest'
import { parseSse } from './parseSse'

describe('parseSse', () => {
  it('returns no entries for empty input and empty blocks', () => {
    expect(parseSse(' \n\n\r\n')).toEqual([])
  })

  it.each(['\n\n', '\r\n\r\n', '\r\r'])(
    'separates events using %j line endings',
    (separator) => {
      const entries = parseSse(`data: {"n":1}${separator}data: {"n":2}`)

      expect(entries).toHaveLength(2)
      expect(entries.map((entry) => entry.parsed)).toEqual([{ n: 1 }, { n: 2 }])
    },
  )

  it('emits the final event without a trailing blank line', () => {
    const [entry] = parseSse('data: {"done":true}')

    expect(entry.jsonStatus).toBe('valid')
    expect(entry.parsed).toEqual({ done: true })
  })

  it('represents comment blocks as keepalive entries', () => {
    const [entry] = parseSse(': ping - 2026-07-13 04:14:19+00:00')

    expect(entry).toMatchObject({
      kind: 'comment',
      sequence: 1,
      comment: 'ping - 2026-07-13 04:14:19+00:00',
      jsonStatus: 'none',
    })
  })

  it('joins repeated data fields with newlines', () => {
    const [entry] = parseSse('data: first\ndata: second')

    expect(entry.data).toBe('first\nsecond')
    expect(entry.jsonStatus).toBe('invalid')
  })

  it.each([
    ['object', '{"value":1}', { value: 1 }],
    ['array', '[1,2]', [1, 2]],
    ['string', '"hello"', 'hello'],
    ['number', '42', 42],
    ['boolean', 'true', true],
    ['null', 'null', null],
  ])('parses valid JSON %s payloads', (_, payload, expected) => {
    const [entry] = parseSse(`data: ${payload}`)

    expect(entry.jsonStatus).toBe('valid')
    expect(entry.parsed).toEqual(expected)
  })

  it('keeps malformed JSON visible without throwing', () => {
    const [entry] = parseSse('data: {"broken":')

    expect(entry.data).toBe('{"broken":')
    expect(entry.jsonStatus).toBe('invalid')
    expect(entry.parseError).toMatch(/JSON/i)
  })

  it('retains SSE metadata and unknown fields', () => {
    const [entry] = parseSse(
      'event: update\nid: evt-7\nretry: 5000\ntrace: abc\ndata: {}',
    )

    expect(entry).toMatchObject({
      event: 'update',
      id: 'evt-7',
      retry: 5000,
      unknownFields: [{ field: 'trace', value: 'abc' }],
    })
  })
})
