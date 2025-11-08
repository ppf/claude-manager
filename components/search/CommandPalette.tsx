'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { FileText, Puzzle, Package, Server } from 'lucide-react'
import type { SearchResult } from '@/types/claude-config'

const TYPE_ICONS = {
  config: FileText,
  skill: Puzzle,
  plugin: Package,
  mcp: Server,
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Toggle command palette with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Fetch search results
  useEffect(() => {
    async function fetchResults() {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
        const data = await response.json()

        if (data.success) {
          setResults(data.data)
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(result: SearchResult) {
    setOpen(false)
    setQuery('')

    // Navigate based on type
    switch (result.type) {
      case 'config':
        router.push(`/configs/${encodeURIComponent(result.path)}`)
        break
      case 'skill':
        router.push('/skills')
        break
      case 'plugin':
        router.push('/plugins')
        break
      case 'mcp':
        router.push('/mcp')
        break
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search configs, skills, plugins, MCP servers..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((result) => {
              const Icon = TYPE_ICONS[result.type]
              return (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-start gap-2"
                >
                  <Icon className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.path}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {result.type}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {!query && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setOpen(false); router.push('/configs') }}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Browse Configs</span>
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); router.push('/skills') }}>
              <Puzzle className="mr-2 h-4 w-4" />
              <span>Browse Skills</span>
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); router.push('/plugins') }}>
              <Package className="mr-2 h-4 w-4" />
              <span>Browse Plugins</span>
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); router.push('/mcp') }}>
              <Server className="mr-2 h-4 w-4" />
              <span>Manage MCP Servers</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

