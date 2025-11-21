'use client'

import { useEffect, useState } from 'react'
import { MarketplaceCard } from '@/components/marketplaces/MarketplaceCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Info } from 'lucide-react'
import type { Marketplace } from '@/types/claude-config'
import Link from 'next/link'

export default function MarketplacesPage() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketplaces()
  }, [])

  async function fetchMarketplaces() {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/marketplaces')
      const result = await response.json()

      if (result.success) {
        setMarketplaces(result.data)
      } else {
        setError(result.error?.message || 'Failed to load marketplaces')
      }
    } catch (err) {
      setError('Failed to fetch marketplaces')
      console.error('Failed to fetch marketplaces:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading marketplaces...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Marketplaces</h1>
          <p className="text-muted-foreground mt-1">
            Browse and explore plugins from installed marketplaces
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a read-only view of your installed marketplaces. To install plugins from a
            marketplace, use the{' '}
            <Link href="/skills" className="underline">
              Skills page
            </Link>
            .
          </AlertDescription>
        </Alert>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!error && marketplaces.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Marketplaces Found</h2>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t installed any marketplaces yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Marketplaces are stored in <code className="text-xs">~/.claude/plugins/cache/</code>
            </p>
          </div>
        )}

        {/* Marketplaces Grid */}
        {!error && marketplaces.length > 0 && (
          <div className="grid gap-4">
            {marketplaces.map((marketplace) => (
              <MarketplaceCard key={marketplace.id} marketplace={marketplace} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
