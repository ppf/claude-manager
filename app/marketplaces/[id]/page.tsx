'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MarketplacePluginCard } from '@/components/marketplaces/MarketplacePluginCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Search, Package } from 'lucide-react'
import type { Marketplace, MarketplacePlugin } from '@/types/claude-config'
import Link from 'next/link'

export default function MarketplaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const marketplaceId = params.id as string

  const [marketplace, setMarketplace] = useState<Marketplace | null>(null)
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'installed' | 'available'>('all')

  useEffect(() => {
    fetchMarketplaceData()
  }, [marketplaceId])

  async function fetchMarketplaceData() {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch marketplace details and plugins in parallel
      const [marketplaceRes, pluginsRes] = await Promise.all([
        fetch(`/api/marketplaces/${marketplaceId}`),
        fetch(`/api/marketplaces/${marketplaceId}/plugins`),
      ])

      const marketplaceResult = await marketplaceRes.json()
      const pluginsResult = await pluginsRes.json()

      if (marketplaceResult.success) {
        setMarketplace(marketplaceResult.data)
      } else {
        setError(marketplaceResult.error?.message || 'Failed to load marketplace')
      }

      if (pluginsResult.success) {
        setPlugins(pluginsResult.data)
      } else {
        setError(pluginsResult.error?.message || 'Failed to load plugins')
      }
    } catch (err) {
      setError('Failed to fetch marketplace data')
      console.error('Failed to fetch marketplace data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter plugins based on search and tab
  const filteredPlugins = plugins.filter((plugin) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Tab filter
    const matchesTab =
      filterTab === 'all' ||
      (filterTab === 'installed' && plugin.installed) ||
      (filterTab === 'available' && !plugin.installed)

    return matchesSearch && matchesTab
  })

  const installedCount = plugins.filter((p) => p.installed).length
  const availableCount = plugins.filter((p) => !p.installed).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading marketplace...</div>
      </div>
    )
  }

  if (error || !marketplace) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertDescription>{error || 'Marketplace not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/marketplaces">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplaces
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold">{marketplace.name}</h1>
            {marketplace.description && (
              <p className="text-muted-foreground mt-1">{marketplace.description}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)}>
          <TabsList>
            <TabsTrigger value="all">All ({plugins.length})</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installedCount})</TabsTrigger>
            <TabsTrigger value="available">Available ({availableCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            {filteredPlugins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No plugins found</p>
              </div>
            ) : (
              filteredPlugins.map((plugin) => (
                <MarketplacePluginCard
                  key={plugin.id}
                  plugin={plugin}
                  marketplaceId={marketplaceId}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="installed" className="mt-6 space-y-4">
            {filteredPlugins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No installed plugins found</p>
              </div>
            ) : (
              filteredPlugins.map((plugin) => (
                <MarketplacePluginCard
                  key={plugin.id}
                  plugin={plugin}
                  marketplaceId={marketplaceId}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-6 space-y-4">
            {filteredPlugins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available plugins found</p>
              </div>
            ) : (
              filteredPlugins.map((plugin) => (
                <MarketplacePluginCard
                  key={plugin.id}
                  plugin={plugin}
                  marketplaceId={marketplaceId}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
