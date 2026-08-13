import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import 'react18-json-view/src/style.css'
import '../src/styles.css'

export const metadata: Metadata = {
  title: 'Pulseframe — stream inspector',
  description:
    'Inspect SSE, JSONL, and structured logs locally. Your data never leaves your browser.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
