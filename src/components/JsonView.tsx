import { useEffect, useState } from 'react'

interface JsonViewProps {
  value: unknown
  expanded: boolean
}

function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span className="json-null">null</span>
  if (typeof value === 'string') {
    return <span className="json-string">{value}</span>
  }
  if (typeof value === 'number') {
    return <span className="json-number">{String(value)}</span>
  }
  if (typeof value === 'boolean') {
    return <span className="json-boolean">{String(value)}</span>
  }
  return <span>{String(value)}</span>
}

interface JsonNodeProps extends JsonViewProps {
  label: string | number
  root?: boolean
}

function JsonNode({ value, label, root = false, expanded }: JsonNodeProps) {
  const isArray = Array.isArray(value)
  const isObject = value !== null && typeof value === 'object'
  const isContainer = isArray || isObject
  const [isOpen, setIsOpen] = useState(expanded)

  useEffect(() => {
    setIsOpen(expanded)
  }, [expanded])

  if (!isContainer) {
    return (
      <div className="json-row json-row--primitive">
        {!root &&
          (typeof label === 'number' ? (
            <span className="json-index">{label}</span>
          ) : (
            <span className="json-key">{label}</span>
          ))}
        <Primitive value={value} />
      </div>
    )
  }

  const items: Array<[string | number, unknown]> = isArray
    ? value.map((item, index) => [index, item])
    : Object.entries(value)
  const type = isArray ? 'array' : 'object'
  const countLabel = `${items.length} ${isArray ? 'items' : 'keys'}`
  const accessibleLabel = root ? `root ${type}` : `${String(label)} ${type}`

  return (
    <div className={`json-node${root ? ' json-node--root' : ''}`}>
      <button
        className="json-node-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${accessibleLabel}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="json-caret" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
        {!root &&
          (typeof label === 'number' ? (
            <span className="json-index">{label}</span>
          ) : (
            <span className="json-key">{label}</span>
          ))}
        <span className="json-container-mark" aria-hidden="true">
          {isArray ? '[]' : '{}'}
        </span>
        <span className="json-count">{countLabel}</span>
      </button>

      {isOpen && (
        <div className={`json-children json-${type}`} role="list">
          {items.map(([childLabel, item]) => (
            <div
              className="json-child"
              role="listitem"
              key={`${typeof childLabel}-${String(childLabel)}`}
            >
              <JsonNode
                value={item}
                label={childLabel}
                expanded={expanded}
              />
            </div>
          ))}
          <span className="json-closing" aria-hidden="true">
            {isArray ? ']' : '}'}
          </span>
        </div>
      )}
    </div>
  )
}

export function JsonView({ value, expanded }: JsonViewProps) {
  return (
    <div className="json-view" aria-label="Formatted JSON">
      <JsonNode value={value} label="root" root expanded={expanded} />
    </div>
  )
}
