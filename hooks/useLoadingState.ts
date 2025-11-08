import { useState, useEffect } from 'react'

const LOADING_DELAY_MS = 200 // Show loading after 200ms
const LOADING_MINIMUM_MS = 500 // Keep loading visible for at least 500ms

export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }

    // Delay showing loading indicator
    const timer = setTimeout(() => {
      setShowLoading(true)
    }, LOADING_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isLoading])

  const startLoading = () => setIsLoading(true)

  const stopLoading = (immediate = false) => {
    if (immediate) {
      setIsLoading(false)
      return
    }

    // Ensure minimum display time
    setTimeout(() => {
      setIsLoading(false)
    }, LOADING_MINIMUM_MS)
  }

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading,
  }
}

export async function withMinimumLoadingTime<T>(
  promise: Promise<T>,
  minimumMs = LOADING_MINIMUM_MS
): Promise<T> {
  const startTime = Date.now()
  const result = await promise
  const elapsed = Date.now() - startTime
  const remaining = Math.max(0, minimumMs - elapsed)

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining))
  }

  return result
}

