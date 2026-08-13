import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import 'react18-json-view/src/style.css'
import '../src/styles.css'

export const metadata: Metadata = {
  title: 'Pulseframe — stream inspector',
  description:
    'Preview pasted SSE, JSONL, and timestamped structured logs as readable JSON.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
