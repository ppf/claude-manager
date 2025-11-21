'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, ChevronRight } from 'lucide-react'
import type { Marketplace } from '@/types/claude-config'
import Link from 'next/link'

interface MarketplaceCardProps {
  marketplace: Marketplace
}

export function MarketplaceCard({ marketplace }: MarketplaceCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{marketplace.name}</CardTitle>
              <CardDescription className="mt-1">
                {marketplace.description || 'No description available'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="font-normal">
                {marketplace.pluginCount} {marketplace.pluginCount === 1 ? 'plugin' : 'plugins'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="font-normal">
                {marketplace.installedCount} installed
              </Badge>
            </div>
          </div>
          <Link href={`/marketplaces/${marketplace.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              View Plugins
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
