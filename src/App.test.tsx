import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('loads an example and renders data events and keepalives separately', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /load example/i }))

    expect(screen.getByText('3 total')).toBeInTheDocument()
    expect(screen.getByText('2 JSON')).toBeInTheDocument()
    expect(screen.getByText('1 keepalive')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('note', { name: /keepalive event 2/i })).toBeInTheDocument()
  })

  it('searches payloads and metadata', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /load example/i }))

    await user.type(screen.getByRole('searchbox'), 'submitted')

    const results = screen.getByTestId('event-list')
    expect(within(results).getAllByRole('article')).toHaveLength(1)
    expect(within(results).getByText('submitted')).toBeInTheDocument()
  })

  it('filters keepalives independently', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /load example/i }))

    await user.click(screen.getByRole('button', { name: 'Keepalives' }))

    const results = screen.getByTestId('event-list')
    expect(within(results).getAllByRole('article')).toHaveLength(2)
    expect(within(results).queryByText(/ping -/i)).not.toBeInTheDocument()
  })

  it('clears input and results', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /load example/i }))

    await user.click(screen.getByRole('button', { name: /^clear$/i }))

    expect(screen.getByRole('textbox', { name: /raw sse stream/i })).toHaveValue('')
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText(/paste an sse response/i)).toBeInTheDocument()
  })

  it('collapses and expands every JSON node', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /load example/i }))

    expect(screen.getAllByText('jsonrpc')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: /collapse all/i }))
    expect(screen.queryByText('jsonrpc')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /expand all/i }))
    expect(screen.getAllByText('jsonrpc')).toHaveLength(2)
  })

  it('collapses an individual nested JSON node without hiding its siblings', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /load example/i }))

    await user.click(
      screen.getAllByRole('button', { name: /collapse result object/i })[0],
    )

    expect(screen.queryByText('submitted')).not.toBeInTheDocument()
    expect(screen.getAllByText('jsonrpc')).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: /expand result object/i }),
    ).toHaveTextContent('5 keys')
  })
})
