'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ExternalLink, Terminal, Trash2 } from 'lucide-react'
import type { Skill } from '@/types/claude-config'
import Link from 'next/link'

interface PluginCardProps {
  skill: Skill
  onToggle?: (skillId: string, enabled: boolean) => void
  onDelete?: (skillId: string) => void
}

export function PluginCard({ skill, onToggle, onDelete }: PluginCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{skill.name}</CardTitle>
              {skill.hasCommands && (
                <Badge variant="secondary" className="gap-1">
                  <Terminal className="h-3 w-3" />
                  Commands
                </Badge>
              )}
              {skill.source === 'marketplace' && <Badge variant="outline">Marketplace</Badge>}
            </div>
            <CardDescription className="mt-2">{skill.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Switch
              checked={skill.enabled}
              onCheckedChange={(checked) => onToggle?.(skill.id, checked)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Commands List */}
          {skill.commands && skill.commands.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skill.commands.map((command) => (
                <Badge key={command} variant="outline" className="font-mono text-xs">
                  /{command}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {skill.version && <span>v{skill.version}</span>}
            {skill.author && <span>by {skill.author}</span>}
            {skill.tags && skill.tags.length > 0 && (
              <div className="flex gap-1">
                {skill.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Link href={`/skills`}>
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-3 w-3" />
                View Details
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(skill.id)}
                className="gap-1 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

