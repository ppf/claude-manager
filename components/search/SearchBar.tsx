'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Search, FileText, Puzzle, Package, Server, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/types/claude-config'

const TYPE_ICONS = {
  config: FileText,
  skill: Puzzle,
  plugin: Package,
  mcp: Server,
}

const TYPE_LABELS = {
  config: 'Config',
  skill: 'Skill',
  plugin: 'Plugin',
  mcp: 'MCP',
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch search results
  useEffect(() => {
    async function fetchResults() {
      if (!debouncedQuery.trim()) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
        const data = await response.json()

        if (data.success) {
          setResults(data.data)
          setIsOpen(true)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  function navigateToResult(result: SearchResult) {
    // Close dropdown and clear search
    setIsOpen(false)
    setQuery('')

    // Navigate based on type
    switch (result.type) {
      case 'config':
        window.location.href = `/configs/${encodeURIComponent(result.path)}`
        break
      case 'skill':
        window.location.href = '/skills'
        break
      case 'plugin':
        window.location.href = '/plugins'
        break
      case 'mcp':
        window.location.href = '/mcp'
        break
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search configs, skills, plugins..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg max-h-[400px] overflow-y-auto">
          {results.map((result, index) => {
            const Icon = TYPE_ICONS[result.type]
            return (
              <button
                key={result.id}
                onClick={() => navigateToResult(result)}
                className={cn(
                  'w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0',
                  selectedIndex === index && 'bg-accent'
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{result.title}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {TYPE_LABELS[result.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">{result.path}</p>
                    {result.excerpt && (
                      <div
                        className="text-xs text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
          No results found
        </div>
      )}
    </div>
  )
}

