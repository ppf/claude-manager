import type { ApiResponse, ApiError } from '@/types/claude-config'

const DEFAULT_RETRIES = 3
const BASE_DELAY = 1000 // 1 second

export class ApiClientError extends Error {
  constructor(
    message: string,
    public error: ApiError,
    public response?: Response
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/**
 * Make an API call with retry logic and exponential backoff
 */
export async function apiCall<T>(
  url: string,
  options?: RequestInit,
  retries = DEFAULT_RETRIES
): Promise<T> {
  let lastError: ApiClientError | Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      
      // Try to parse JSON response
      let result: ApiResponse<T>
      try {
        result = await response.json()
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${response.statusText}`)
      }

      // Check if response indicates success
      if (result.success) {
        return result.data
      }

      // Response has error
      const error = result.error || {
        type: 'unknown' as const,
        message: 'Request failed',
        recoverable: false,
      }

      // Don't retry validation errors or non-recoverable errors
      if (error.type === 'validation' || !error.recoverable) {
        throw new ApiClientError(error.message, error, response)
      }

      // Store error and potentially retry
      lastError = new ApiClientError(error.message, error, response)
    } catch (error) {
      // Network error or other exception
      if (error instanceof ApiClientError) {
        // Don't retry validation errors
        if (error.error.type === 'validation' || !error.error.recoverable) {
          throw error
        }
        lastError = error
      } else {
        lastError = error as Error
      }

      // If this is not the last retry, wait before retrying
      if (i < retries - 1) {
        const delay = BASE_DELAY * Math.pow(2, i) // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    throw lastError
  }

  throw new Error('Request failed for unknown reason')
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T>(url: string, options?: RequestInit) =>
    apiCall<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: unknown, options?: RequestInit) =>
    apiCall<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: unknown, options?: RequestInit) =>
    apiCall<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string, options?: RequestInit) =>
    apiCall<T>(url, { ...options, method: 'DELETE' }),
}

