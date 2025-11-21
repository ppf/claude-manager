import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseInfiniteScrollOptions {
  threshold?: number // Distance from bottom to trigger load (in pixels)
  enabled?: boolean
}

export interface UseInfiniteScrollResult {
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  reset: () => void
  ref: React.RefObject<HTMLDivElement>
}

/**
 * Hook for infinite scroll functionality
 * @param loadMoreFn Function to load more items, should return true if more items available
 * @param options Configuration options
 *
 * @example
 * const { ref, isLoadingMore, hasMore } = useInfiniteScroll(
 *   async () => {
 *     const newItems = await fetchMoreItems(page)
 *     setItems(prev => [...prev, ...newItems])
 *     return newItems.length > 0
 *   },
 *   { threshold: 200, enabled: true }
 * )
 *
 * return (
 *   <div ref={ref}>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     {isLoadingMore && <LoadingSpinner />}
 *   </div>
 * )
 */
export function useInfiniteScroll(
  loadMoreFn: () => Promise<boolean>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollResult {
  const { threshold = 300, enabled = true } = options

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef(loadMoreFn)

  useEffect(() => {
    loadMoreRef.current = loadMoreFn
  }, [loadMoreFn])

  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const moreAvailable = await loadMoreRef.current()
      setHasMore(moreAvailable)
    } catch (error) {
      console.error('Error loading more items:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [enabled, isLoadingMore, hasMore])

  const reset = useCallback(() => {
    setHasMore(true)
    setIsLoadingMore(false)
  }, [])

  useEffect(() => {
    if (!enabled || !hasMore) return

    const element = ref.current
    if (!element) return

    function handleScroll() {
      if (!element || isLoadingMore || !hasMore) return

      const { scrollTop, scrollHeight, clientHeight } = element
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < threshold) {
        loadMore()
      }
    }

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [enabled, hasMore, isLoadingMore, threshold, loadMore])

  return {
    isLoadingMore,
    hasMore,
    loadMore,
    reset,
    ref,
  }
}
