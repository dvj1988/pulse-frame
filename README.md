# Pulseframe

Pulseframe is a local-first stream inspector for pasted SSE, JSONL, and
timestamp-prefixed structured logs. It turns each event or record into a
searchable, collapsible JSON preview without uploading the input.

## Supported input

Pulseframe detects the format automatically.

### Server-Sent Events

```text
event: status
id: evt-7
data: {"state":"working"}

: keepalive
```

SSE fields and comments are preserved. Each `data:` payload is parsed
independently, so one malformed event does not prevent the others from being
inspected.

### JSON Lines

```jsonl
{"state":"queued","id":1}
{"state":"running","id":2}
{"state":"complete","id":3}
```

Each non-empty line becomes a separate record.

### Timestamp-prefixed JSON logs

```text
2026-08-13T04:58:52.056426394Z {"level":"INFO","message":"healthy"}
2026-08-13T04:58:53.464036314Z {"level":"ERROR","message":"timeout"}
```

The outer timestamp is retained as metadata and the JSON portion is rendered
as the record payload.

## Features

- Automatic input-format detection
- Interactive JSON trees with per-node and bulk expand/collapse
- Full-text search and result-type filters
- Clear visibility for malformed payloads
- Copy formatted JSON per record
- SSE keepalive and metadata support
- Responsive layout and keyboard-accessible controls
- Entirely client-side parsing

## Run locally

Pulseframe requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run test:run
npx tsc --noEmit
npm run build
```

## Stack

- Next.js App Router
- React and TypeScript
- Vitest and Testing Library
- `react18-json-view`
