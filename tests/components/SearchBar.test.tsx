import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchBar } from '@/components/search/SearchBar'

// Mock fetch
global.fetch = vi.fn()

describe('SearchBar component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/search/i)
    expect(input).toBeInTheDocument()
  })

  it('should debounce search input', async () => {
    const mockResponse = { success: true, data: [] }
    ;(global.fetch as any).mockResolvedValue({
      json: async () => mockResponse,
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/search/i)

    // Type quickly
    fireEvent.change(input, { target: { value: 't' } })
    fireEvent.change(input, { target: { value: 'te' } })
    fireEvent.change(input, { target: { value: 'tes' } })
    fireEvent.change(input, { target: { value: 'test' } })

    // Should only call fetch once after debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should display search results', async () => {
    const mockResults = [
      {
        id: 'test-1',
        type: 'config',
        title: 'Test Config',
        path: 'test.md',
        excerpt: 'Test content',
        score: 0.9,
      },
    ]
    ;(global.fetch as any).mockResolvedValue({
      json: async () => ({ success: true, data: mockResults }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/search/i)

    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('Test Config')).toBeInTheDocument()
    })
  })

  it('should handle empty results', async () => {
    ;(global.fetch as any).mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/search/i)

    fireEvent.change(input, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText(/no results/i)).toBeInTheDocument()
    })
  })

  it('should handle search errors gracefully', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/search/i)

    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      // Should not crash, might show error message
      expect(input).toBeInTheDocument()
    })
  })

  it('should clear results when input is cleared', async () => {
    const mockResults = [
      {
        id: 'test-1',
        type: 'config',
        title: 'Test Config',
        path: 'test.md',
        excerpt: 'Test content',
        score: 0.9,
      },
    ]
    ;(global.fetch as any).mockResolvedValue({
      json: async () => ({ success: true, data: mockResults }),
    })

    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement

    // Search
    fireEvent.change(input, { target: { value: 'test' } })
    await waitFor(() => {
      expect(screen.getByText('Test Config')).toBeInTheDocument()
    })

    // Clear
    fireEvent.change(input, { target: { value: '' } })
    await waitFor(() => {
      expect(screen.queryByText('Test Config')).not.toBeInTheDocument()
    })
  })
})

