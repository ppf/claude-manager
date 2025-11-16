'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PluginDetailView } from '@/components/marketplaces/PluginDetailView'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import type { MarketplacePlugin } from '@/types/claude-config'
import Link from 'next/link'

export default function PluginDetailPage() {
  const params = useParams()
  const router = useRouter()
  const marketplaceId = params.id as string
  const pluginId = params.pluginId as string

  const [plugin, setPlugin] = useState<(MarketplacePlugin & { readme?: string | null }) | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPluginData()
  }, [marketplaceId, pluginId])

  async function fetchPluginData() {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch plugin details with README
      const response = await fetch(
        `/api/marketplaces/${marketplaceId}/plugins/${pluginId}?readme=true`
      )
      const result = await response.json()

      if (result.success) {
        setPlugin(result.data)
      } else {
        setError(result.error?.message || 'Failed to load plugin details')
      }
    } catch (err) {
      setError('Failed to fetch plugin data')
      console.error('Failed to fetch plugin data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading plugin...</div>
      </div>
    )
  }

  if (error || !plugin) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertDescription>{error || 'Plugin not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Navigation */}
        <Link href={`/marketplaces/${marketplaceId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {plugin.marketplaceName}
          </Button>
        </Link>

        {/* Plugin Details */}
        <PluginDetailView plugin={plugin} />
      </div>
    </div>
  )
}
