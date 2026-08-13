import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import 'react18-json-view/src/style.css'
import '../src/styles.css'

export const metadata: Metadata = {
  title: 'Pulseframe — SSE & JSONL inspector',
  description:
    'Preview pasted Server-Sent Events and JSONL as readable, collapsible JSON.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
