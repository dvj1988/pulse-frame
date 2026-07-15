import JsonView from 'react18-json-view'
import type { ParsedSseEntry } from '../lib/parseSse'

interface EventCardProps {
  entry: ParsedSseEntry
  expandAll: boolean
  copyStatus?: 'copied' | 'error'
  onCopy: () => void
}

export function EventCard({
  entry,
  expandAll,
  copyStatus,
  onCopy,
}: EventCardProps) {
  const metadata = [
    entry.id && `id ${entry.id}`,
    entry.retry !== undefined && `retry ${entry.retry}ms`,
  ].filter((item): item is string => typeof item === 'string')

  if (entry.kind === 'comment') {
    return (
      <div
        className="keepalive-row"
        role="note"
        aria-label={`Keepalive event ${entry.sequence}`}
      >
        <div className="timeline-marker" aria-hidden="true">
          <span>PING</span>
        </div>
        <span className="event-number">
          #{String(entry.sequence).padStart(3, '0')}
        </span>
        <span className="keepalive-dot" aria-hidden="true" />
        <span className="keepalive-message">{entry.comment}</span>
      </div>
    )
  }

  const isInvalid = entry.jsonStatus === 'invalid'

  return (
    <article
      className={`event-card json-document${isInvalid ? ' event-card--error' : ''}`}
    >
      <div className="timeline-marker" aria-hidden="true">
        <span>{isInvalid ? 'ERR' : 'JSON'}</span>
      </div>

      <header className="event-card__header">
        <div className="event-identity">
          <span className="event-number">#{String(entry.sequence).padStart(3, '0')}</span>
          <span className="event-label">
            {isInvalid ? 'Invalid payload' : entry.event || 'JSON payload'}
          </span>
        </div>
        <button className="copy-button" type="button" onClick={onCopy}>
          {copyStatus === 'copied'
            ? 'Copied'
            : copyStatus === 'error'
              ? 'Copy failed'
              : 'Copy JSON'}
        </button>
      </header>

      {(metadata.length > 0 || entry.unknownFields.length > 0) && (
        <div className="event-meta">
          {metadata.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {entry.unknownFields.map(({ field, value }) => (
            <span key={`${field}-${value}`}>
              {field} {value}
            </span>
          ))}
        </div>
      )}

      <div className="event-body">
        {entry.jsonStatus === 'valid' ? (
          <JsonView
            src={entry.parsed}
            collapsed={!expandAll}
            enableClipboard={false}
            className="event-json-view"
          />
        ) : (
          <>
            <p className="parse-error">{entry.parseError}</p>
            <pre className="raw-payload">{entry.data}</pre>
          </>
        )}
      </div>
    </article>
  )
}
