# SSE Stream Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-only React app that parses pasted SSE text into a searchable, filterable, human-readable event timeline.

**Architecture:** A pure TypeScript parser produces typed event records without browser dependencies. A Next.js App Router page mounts the interactive dashboard through a client component, while the root layout owns metadata and global styles. All pasted content remains in memory in the browser.

**Tech Stack:** Node.js 22, Next.js App Router, React, TypeScript, Vitest, Testing Library, CSS

## Global Constraints

- Use Node.js 22.
- Keep all pasted content client-side.
- Do not connect to remote SSE endpoints or store credentials.
- Support desktop and mobile layouts, keyboard focus, and reduced motion.
- Isolate malformed JSON to its own event.

---

### Task 1: Scaffold and parser

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/lib/parseSse.ts`
- Test: `src/lib/parseSse.test.ts`

**Interfaces:**
- Produces: `parseSse(input: string): ParsedSseEntry[]`
- Produces: `ParsedSseEntry` with `kind`, `sequence`, `data`, `parsed`, `jsonStatus`, `comment`, `event`, `id`, `retry`, and `unknownFields`.

- [ ] **Step 1: Scaffold Vite React TypeScript with Vitest dependencies**

Use scripts `dev`, `build`, `test`, and `test:run`. Configure Vitest with the jsdom environment and a setup file.

- [ ] **Step 2: Write parser tests**

Cover empty input, LF/CRLF/CR delimiters, comments, multiple events, final events without trailing blank lines, multiline data, valid JSON values, malformed JSON, metadata fields, and unknown fields.

- [ ] **Step 3: Run parser tests and verify failure**

Run: `npm run test:run -- src/lib/parseSse.test.ts`

Expected: FAIL because `parseSse` does not exist yet.

- [ ] **Step 4: Implement the pure parser**

Normalize newlines, split input into logical SSE blocks, identify comment-only blocks, accumulate supported fields, retain unknown fields, join repeated data with `\n`, and parse JSON independently.

- [ ] **Step 5: Run parser tests**

Run: `npm run test:run -- src/lib/parseSse.test.ts`

Expected: all parser tests PASS.

### Task 2: Build the dashboard behavior

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/test/setup.ts`
- Create: `src/components/EventCard.tsx`
- Create: `src/components/JsonView.tsx`
- Create: `src/data/sample.ts`

**Interfaces:**
- Consumes: `parseSse(input: string): ParsedSseEntry[]`
- Produces: `App` with raw input, summary, filtering, search, expansion, clear, sample, and copy behavior.

- [ ] **Step 1: Write component tests**

Verify that loading the sample creates separate data and keepalive cards; search narrows results; kind filters toggle; clear empties both panes; and expand/collapse controls change event details.

- [ ] **Step 2: Run component tests and verify failure**

Run: `npm run test:run -- src/App.test.tsx`

Expected: FAIL because the application components do not exist yet.

- [ ] **Step 3: Implement dashboard state and controls**

Parse with `useMemo`, derive summary counts, filter by selected categories and case-insensitive search, and manage the set of expanded entry sequence numbers.

- [ ] **Step 4: Implement event and JSON rendering**

Render valid data events as JSON-first document cards. Each object and array node has an accessible independent expand/collapse control and child count; global controls expand or collapse every node across visible events. Render comments as compact keepalive rows, while malformed payloads retain a full error card. Use a recursive JSON renderer so keys, strings, numbers, booleans, and null have distinct tokens without injecting HTML.

- [ ] **Step 5: Run component tests**

Run: `npm run test:run -- src/App.test.tsx`

Expected: all component tests PASS.

### Task 3: Apply the stream-inspector visual system

**Files:**
- Create: `src/styles.css`

**Interfaces:**
- Consumes: semantic class names from `App`, `EventCard`, and `JsonView`.
- Produces: responsive two-column workbench, pulse rail, event state styling, visible focus states, and reduced-motion support.

- [ ] **Step 1: Define design tokens**

Create CSS variables for slate canvas, white surfaces, ink, muted text, indigo data, amber keepalive, red error, borders, shadows, and three typography roles.

- [ ] **Step 2: Build the responsive workbench**

Use a sticky input panel and independently readable result column on desktop. Stack panels below 900px and remove sticky positioning.

- [ ] **Step 3: Build the pulse timeline and states**

Connect event markers with a vertical line, pair color with text labels/icons, style JSON tokens, and keep controls quiet and consistent.

- [ ] **Step 4: Add accessibility and motion safeguards**

Add visible `:focus-visible` rings, touch-friendly controls, screen-reader text where needed, and a `prefers-reduced-motion` override.

### Task 4: Verify the complete application

**Files:**
- Modify as required: files introduced in Tasks 1–3

**Interfaces:**
- Consumes: complete application.
- Produces: tested production build runnable on Node.js 22.

- [ ] **Step 1: Install dependencies with Node.js 22**

Run: `nvm use 22 && npm install`

Expected: dependency installation succeeds and a lockfile is created.

- [ ] **Step 2: Run all tests**

Run: `npm run test:run`

Expected: all tests PASS.

- [ ] **Step 3: Run TypeScript and production build**

Run: `npm run build`

Expected: TypeScript succeeds and Vite writes `dist/`.

- [ ] **Step 4: Inspect lints and application behavior**

Check edited files for IDE diagnostics. Start the app with `npm run dev -- --host 127.0.0.1`, verify the supplied SSE shape renders as separate events, then stop the server.

- [ ] **Step 5: Confirm scope**

Verify no bearer token, curl execution, remote connection code, persistence, or analytics was introduced.
