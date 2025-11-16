'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, CheckCircle2, Terminal } from 'lucide-react'
import type { MarketplacePlugin } from '@/types/claude-config'
import Link from 'next/link'

interface MarketplacePluginCardProps {
  plugin: MarketplacePlugin
  marketplaceId: string
}

export function MarketplacePluginCard({ plugin, marketplaceId }: MarketplacePluginCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              {plugin.installed && (
                <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Installed
                </Badge>
              )}
              {plugin.commands && plugin.commands.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Terminal className="h-3 w-3" />
                  Commands
                </Badge>
              )}
            </div>
            <CardDescription className="mt-2">{plugin.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Commands */}
          {plugin.commands && plugin.commands.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plugin.commands.map((command) => (
                <Badge key={command} variant="outline" className="font-mono text-xs">
                  /{command}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata and Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {plugin.version && <span>v{plugin.version}</span>}
              {plugin.author && <span>by {plugin.author}</span>}
              {plugin.tags && plugin.tags.length > 0 && (
                <div className="flex gap-1">
                  {plugin.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Link href={`/marketplaces/${marketplaceId}/${plugin.id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
