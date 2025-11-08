import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiCall, api, ApiClientError } from '@/lib/api/client'

// Mock fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('apiCall', () => {
    it('should make successful API call', async () => {
      const mockResponse = { success: true, data: { message: 'Success' } }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await apiCall('/api/test')
      expect(result).toEqual({ message: 'Success' })
    })

    it('should throw ApiClientError on validation error', async () => {
      const mockResponse = {
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          recoverable: false,
        },
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      await expect(apiCall('/api/test')).rejects.toThrow(ApiClientError)
    })

    it('should retry on recoverable errors', async () => {
      const mockError = {
        success: false,
        error: {
          type: 'network',
          message: 'Network error',
          recoverable: true,
        },
      }
      const mockSuccess = { success: true, data: { message: 'Success' } }

      ;(global.fetch as any)
        .mockResolvedValueOnce({ json: async () => mockError })
        .mockResolvedValueOnce({ json: async () => mockSuccess })

      const result = await apiCall('/api/test', undefined, 2)
      expect(result).toEqual({ message: 'Success' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry validation errors', async () => {
      const mockError = {
        success: false,
        error: {
          type: 'validation',
          message: 'Invalid input',
          recoverable: false,
        },
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockError,
      })

      await expect(apiCall('/api/test', undefined, 3)).rejects.toThrow()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should use exponential backoff for retries', async () => {
      const mockError = {
        success: false,
        error: {
          type: 'network',
          message: 'Network error',
          recoverable: true,
        },
      }

      ;(global.fetch as any).mockResolvedValue({
        json: async () => mockError,
      })

      const start = Date.now()
      await expect(apiCall('/api/test', undefined, 2)).rejects.toThrow()
      const duration = Date.now() - start

      // Should have delayed at least 1 second (base delay)
      expect(duration).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('api convenience methods', () => {
    it('should make GET request', async () => {
      const mockResponse = { success: true, data: { result: 'data' } }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      await api.get('/api/test')
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'GET' }))
    })

    it('should make POST request with body', async () => {
      const mockResponse = { success: true, data: { result: 'created' } }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      await api.post('/api/test', { name: 'test' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
    })

    it('should make PUT request with body', async () => {
      const mockResponse = { success: true, data: { result: 'updated' } }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      await api.put('/api/test', { name: 'updated' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        })
      )
    })

    it('should make DELETE request', async () => {
      const mockResponse = { success: true, data: null }
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      await api.delete('/api/test')
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'DELETE' }))
    })
  })
})

