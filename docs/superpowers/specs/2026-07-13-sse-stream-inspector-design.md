# SSE Stream Inspector Design

## Goal

Build a fast, local-first web app that turns pasted Server-Sent Events output into a readable event timeline. Each SSE event is parsed independently, and JSON payloads are formatted without sending content to a server.

## Scope

The first version accepts pasted SSE text only. It does not execute curl commands or connect to remote endpoints. This avoids CORS, credential handling, and proxy-server complexity.

## Architecture

- Node.js 22 for local tooling.
- Next.js App Router, React, and TypeScript for a Vercel-ready application.
- A pure parser module converts raw SSE text into typed event records.
- A client component renders input, summary, filters, and event cards; the root layout supplies metadata and global styles.
- No backend, persistence, authentication, or analytics.

## Parsing behavior

The parser normalizes CRLF and CR newlines, then processes SSE blocks separated by blank lines.

- Lines beginning with `:` are comments and are represented as keepalive entries.
- `data:` fields are collected and joined with newline characters according to SSE rules.
- `event`, `id`, and `retry` fields are retained as metadata.
- Each completed event is parsed independently.
- JSON data is stored as a parsed value and rendered with indentation.
- Non-JSON or malformed data remains visible with a parse error.
- Empty blocks are ignored.
- Input that ends without a blank line still emits its final event.

## Interface

The desktop layout is a two-column workbench:

1. A raw-input panel with a large paste area, clear action, and example affordance.
2. A results panel with summary counts, filters, search, bulk expand/collapse controls, and a chronological event list.

Each result card shows:

- A compact event sequence header with optional SSE metadata.
- An interactive JSON tree as the dominant content for valid data events.
- Independent expand/collapse controls on every object and array node, including child counts.
- The original payload and parse error when JSON parsing fails.
- A copy action for the formatted payload.

Keepalive comments use compact timeline rows rather than full event cards. Global expand/collapse controls apply to every JSON node in every visible event.

On narrow screens the input and results stack vertically.

## Visual direction

The app should feel like a focused stream-inspection instrument:

- Cool slate application canvas.
- Crisp white working surfaces.
- Indigo for data events, amber for keepalives, and red for errors.
- A vertical pulse rail connecting events to make chronology obvious.
- Characterful but restrained heading type, highly readable body type, and a monospace data face.
- Minimal motion: a short result-entry transition, disabled when reduced motion is requested.

## Interaction and accessibility

- Parsing updates immediately after paste or typing.
- Filters support data events, comments, valid JSON, and invalid payloads.
- Search matches raw payload text and SSE metadata.
- Controls are keyboard accessible with visible focus states.
- Color is never the only indicator of event state.
- Empty and invalid states explain the next useful action.

## Error handling

- Malformed JSON is isolated to its event and never prevents other events from rendering.
- Clipboard failures display a local, actionable message.
- Unexpected field lines are retained as raw metadata where practical rather than silently corrupting an event.
- Large input remains client-side; the initial version does not impose a hard limit.

## Testing

Unit tests cover:

- LF, CRLF, and CR line endings.
- Multiple events and a final event without a trailing blank line.
- Comment/keepalive lines.
- Multiline `data:` fields.
- Valid JSON primitives, arrays, and objects.
- Malformed JSON and plain-text payloads.
- `event`, `id`, and `retry` metadata.
- Empty input and empty blocks.

Component-level checks cover filtering, searching, expansion, clearing, and copy behavior. A production build verifies the final integration.

## Success criteria

- Pasting the supplied sample produces separate, ordered entries.
- Ping comments are visually distinct and filterable.
- Every valid JSON `data:` payload is independently formatted and collapsible.
- One malformed payload does not affect neighboring events.
- The app works locally with Node.js 22 and is usable on desktop and mobile.
