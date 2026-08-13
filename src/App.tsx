'use client'

import { useMemo, useState } from 'react'
import { EventCard } from './components/EventCard'
import { sampleSse } from './data/sample'
import { parseInput } from './lib/parseInput'
import type { ParsedSseEntry } from './lib/parseSse'

type FilterKey = 'data' | 'keepalives' | 'valid' | 'errors'

const initialFilters: Record<FilterKey, boolean> = {
  data: true,
  keepalives: true,
  valid: true,
  errors: true,
}

function searchableText(entry: ParsedSseEntry): string {
  return [
    entry.data,
    entry.comment,
    entry.event,
    entry.id,
    entry.retry,
    ...entry.unknownFields.flatMap(({ field, value }) => [field, value]),
  ]
    .filter((value) => value !== undefined)
    .join(' ')
    .toLocaleLowerCase()
}

export default function App() {
  const [rawInput, setRawInput] = useState('')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [expandAll, setExpandAll] = useState(true)
  const [copyStatus, setCopyStatus] = useState<
    Record<number, 'copied' | 'error' | undefined>
  >({})

  const parsedInput = useMemo(() => parseInput(rawInput), [rawInput])
  const entries = parsedInput.entries
  const isStructuredLog = parsedInput.format === 'structured-log'
  const isRecordInput = parsedInput.format === 'jsonl' || isStructuredLog

  const counts = useMemo(
    () => ({
      total: entries.length,
      json: entries.filter(({ jsonStatus }) => jsonStatus === 'valid').length,
      keepalives: entries.filter(({ kind }) => kind === 'comment').length,
      errors: entries.filter(({ jsonStatus }) => jsonStatus === 'invalid').length,
    }),
    [entries],
  )

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return entries.filter((entry) => {
      if (entry.kind === 'comment' && !filters.keepalives) return false
      if (entry.kind === 'event' && !filters.data) return false
      if (entry.jsonStatus === 'valid' && !filters.valid) return false
      if (entry.jsonStatus === 'invalid' && !filters.errors) return false
      return !normalizedQuery || searchableText(entry).includes(normalizedQuery)
    })
  }, [entries, filters, query])

  function toggleFilter(filter: FilterKey) {
    setFilters((current) => ({ ...current, [filter]: !current[filter] }))
  }

  async function copyEntry(entry: ParsedSseEntry) {
    const text =
      entry.jsonStatus === 'valid'
        ? JSON.stringify(entry.parsed, null, 2)
        : entry.data
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus((current) => ({ ...current, [entry.sequence]: 'copied' }))
    } catch {
      setCopyStatus((current) => ({ ...current, [entry.sequence]: 'error' }))
    }
  }

  function clearAll() {
    setRawInput('')
    setQuery('')
    setFilters(initialFilters)
    setExpandAll(true)
    setCopyStatus({})
  }

  const hasVisibleJson = visibleEntries.some(
    ({ jsonStatus }) => jsonStatus === 'valid',
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pulseframe home">
          <span className="brand-pulse" aria-hidden="true" />
          <span>Pulseframe</span>
        </a>
        <p>
          Stream inspector <span>/ local only</span>
        </p>
      </header>

      <main className="workbench">
        <section className="input-panel" aria-labelledby="input-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Source</p>
              <h1 id="input-title">Paste the stream.</h1>
            </div>
            <span className="privacy-note">Never uploaded</span>
          </div>

          <p className="panel-intro">
            Paste raw SSE, JSONL, or timestamped JSON logs. Each frame or record
            becomes a separate, readable entry.
          </p>

          <div className="input-label-row">
            <label className="input-label" htmlFor="raw-stream">
              Raw response
            </label>
            <button
              className="example-button"
              type="button"
              onClick={() => {
                setRawInput(sampleSse)
                setExpandAll(true)
              }}
              disabled={Boolean(rawInput)}
              title={
                rawInput ? 'Clear the input before loading the example' : undefined
              }
            >
              Use sample SSE
            </button>
          </div>
          <textarea
            id="raw-stream"
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder={'data: {"status":"working"}\n\n: ping'}
            spellCheck={false}
          />

          <div className="input-actions">
            <button
              className="button button--quiet"
              type="button"
              onClick={clearAll}
              disabled={!rawInput}
            >
              Clear
            </button>
            <span>{rawInput.length.toLocaleString()} chars</span>
          </div>

          <aside className="protocol-note">
            <strong>
              {isStructuredLog
                ? 'Structured logs detected'
                : parsedInput.format === 'jsonl'
                  ? 'JSONL detected'
                  : 'What you captured'}
            </strong>
            <p>
              {isStructuredLog ? (
                <>
                  Each line’s outer timestamp is preserved while its JSON
                  payload is previewed independently.
                </>
              ) : parsedInput.format === 'jsonl' ? (
                <>
                  Each non-empty line is previewed as an independent JSON
                  record.
                </>
              ) : (
                <>
                  An HTTP response streamed as Server-Sent Events. <code>data:</code>{' '}
                  carries payloads; lines beginning with <code>:</code> are
                  keepalive comments.
                </>
              )}
            </p>
          </aside>
        </section>

        <section className="results-panel" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="eyebrow">
                {isRecordInput ? 'Preview' : 'Timeline'}
              </p>
              <h2 id="results-title">
                {isStructuredLog
                  ? 'Structured logs'
                  : parsedInput.format === 'jsonl'
                    ? 'JSONL records'
                    : 'Decoded events'}
              </h2>
            </div>
            <div className="summary" aria-label="Stream summary">
              <span>{counts.total} total</span>
              <span>{counts.json} JSON</span>
              {!isRecordInput && (
                <span>{counts.keepalives} keepalive</span>
              )}
              <span className={counts.errors ? 'has-errors' : undefined}>
                {counts.errors} {counts.errors === 1 ? 'error' : 'errors'}
              </span>
            </div>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <span className="sr-only">Search events</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search payloads and metadata"
              />
            </label>
            <div className="filter-row" aria-label="Event filters">
              {(
                [
                  ['data', isRecordInput ? 'Records' : 'Data'],
                  ['keepalives', 'Keepalives'],
                  ['valid', 'Valid JSON'],
                  ['errors', 'Errors'],
                ] as const
              )
                .filter(
                  ([key]) =>
                    key !== 'keepalives' || !isRecordInput,
                )
                .map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="filter-chip"
                    aria-pressed={filters[key]}
                    onClick={() => toggleFilter(key)}
                  >
                    {label}
                  </button>
                ))}
            </div>
            {hasVisibleJson && (
              <button
                className="expand-button"
                type="button"
                onClick={() => setExpandAll((current) => !current)}
              >
                {expandAll ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          {visibleEntries.length > 0 ? (
            <div className="event-list" data-testid="event-list">
              {visibleEntries.map((entry) => (
                <EventCard
                  key={entry.sequence}
                  entry={entry}
                  expandAll={expandAll}
                  copyStatus={copyStatus[entry.sequence]}
                  onCopy={() => void copyEntry(entry)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">∿</span>
              <h3>
                {entries.length > 0
                  ? `No ${isRecordInput ? 'records' : 'events'} match`
                  : 'Paste an SSE, JSONL, or structured log response to begin'}
              </h3>
              <p>
                {entries.length > 0
                  ? 'Adjust your search or enable another result type.'
                  : 'Your decoded preview will appear here.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
