'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Terminal, Package, User, GitBranch } from 'lucide-react'
import type { MarketplacePlugin } from '@/types/claude-config'
import ReactMarkdown from 'react-markdown'

interface PluginDetailViewProps {
  plugin: MarketplacePlugin & { readme?: string | null }
}

export function PluginDetailView({ plugin }: PluginDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CardTitle className="text-2xl">{plugin.name}</CardTitle>
                  {plugin.installed && (
                    <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Installed
                    </Badge>
                  )}
                  {!plugin.installed && (
                    <Badge variant="outline">Available</Badge>
                  )}
                </div>
                <CardDescription className="text-base">{plugin.description}</CardDescription>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              {plugin.version && (
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Version</div>
                    <div className="text-sm font-medium">{plugin.version}</div>
                  </div>
                </div>
              )}
              {plugin.author && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Author</div>
                    <div className="text-sm font-medium">{plugin.author}</div>
                  </div>
                </div>
              )}
              {plugin.marketplaceName && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Marketplace</div>
                    <div className="text-sm font-medium">{plugin.marketplaceName}</div>
                  </div>
                </div>
              )}
              {plugin.commands && plugin.commands.length > 0 && (
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Commands</div>
                    <div className="text-sm font-medium">{plugin.commands.length}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Commands List */}
        {plugin.commands && plugin.commands.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Available Commands</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.commands.map((command) => (
                  <Badge key={command} variant="outline" className="font-mono">
                    /{command}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}

        {/* Tags */}
        {plugin.tags && plugin.tags.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* README Card */}
      {plugin.readme && (
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{plugin.readme}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No README Message */}
      {!plugin.readme && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No documentation available for this plugin.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
