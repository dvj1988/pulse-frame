# Pulseframe

> **Your data never leaves your browser.**

Pulseframe is a client-side stream inspector for SSE, JSONL, and
timestamp-prefixed structured logs. Paste sensitive production output and turn
each event or record into a searchable, collapsible JSON preview without
sending its contents to a server.

## Browser-only by design

Pasted data is held only in the page's in-memory React state and parsed in the
browser. Pulseframe does not upload, persist, or analyze it on a server, and it
does not use an API route, server action, analytics service, or browser storage
for the input. Refreshing or closing the page clears it.

The hosting server delivers the application files and may retain ordinary HTTP
request metadata in its access logs, but the text pasted into Pulseframe is not
part of those requests.

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
- Browser-only parsing—pasted data is never uploaded

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
