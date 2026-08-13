import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('loads an example and renders data events and keepalives separately', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /sample sse/i }))

    expect(screen.getByText('3 total')).toBeInTheDocument()
    expect(screen.getByText('2 JSON')).toBeInTheDocument()
    expect(screen.getByText('1 keepalive')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('note', { name: /keepalive event 2/i })).toBeInTheDocument()
  })

  it('searches payloads and metadata', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /sample sse/i }))

    await user.type(screen.getByRole('searchbox'), 'submitted')

    const results = screen.getByTestId('event-list')
    expect(within(results).getAllByRole('article')).toHaveLength(1)
    expect(within(results).getByText(/submitted/)).toBeInTheDocument()
  })

  it('filters keepalives independently', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /sample sse/i }))

    await user.click(screen.getByRole('button', { name: 'Keepalives' }))

    const results = screen.getByTestId('event-list')
    expect(within(results).getAllByRole('article')).toHaveLength(2)
    expect(within(results).queryByText(/ping -/i)).not.toBeInTheDocument()
  })

  it('clears input and results', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /sample sse/i }))

    await user.click(screen.getByRole('button', { name: /^clear$/i }))

    expect(screen.getByRole('textbox', { name: /raw response/i })).toHaveValue('')
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText(/paste an sse or jsonl response/i)).toBeInTheDocument()
  })

  it('collapses and expands every JSON node', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /sample sse/i }))

    expect(screen.getAllByText('jsonrpc')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: /collapse all/i }))
    expect(screen.queryByText('jsonrpc')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /expand all/i }))
    expect(screen.getAllByText('jsonrpc')).toHaveLength(2)
  })

  it('collapses an individual nested JSON node without hiding its siblings', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /sample sse/i }))

    // The JSON viewer exposes per-node fold toggles as icon-only controls
    // rather than accessibly-named buttons, so we target the toggle for the
    // first "result" node directly via its container.
    const resultPair = screen.getAllByText('result')[0].closest('.json-view--pair')
    const foldToggle = resultPair?.querySelector('.jv-size-chevron')
    expect(foldToggle).toBeTruthy()

    await user.click(foldToggle as Element)

    const results = within(screen.getByTestId('event-list'))
    expect(results.queryByText(/submitted/)).not.toBeInTheDocument()
    expect(results.getAllByText('jsonrpc')).toHaveLength(2)

    const unfoldToggle = resultPair?.querySelector('.jv-button')
    expect(unfoldToggle).toBeTruthy()

    await user.click(unfoldToggle as Element)

    expect(results.getByText(/submitted/)).toBeInTheDocument()
  })

  it('previews JSONL records automatically and reports malformed lines', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('textbox', { name: /raw response/i }))
    await user.paste('{"status":"ok"}\n{"count":2}\n{"broken":')

    expect(screen.getByRole('heading', { name: /jsonl records/i })).toBeInTheDocument()
    expect(screen.getByText('3 total')).toBeInTheDocument()
    expect(screen.getByText('2 JSON')).toBeInTheDocument()
    expect(screen.getByText('1 error')).toBeInTheDocument()
    expect(screen.getByText(/invalid json on record 3/i)).toBeInTheDocument()
  })

  it('does not let the sample replace pasted input', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('textbox', { name: /raw response/i }))
    await user.paste('{"mine":true}')

    expect(screen.getByRole('button', { name: /sample sse/i })).toBeDisabled()
  })
})
