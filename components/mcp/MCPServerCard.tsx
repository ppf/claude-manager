'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Square, TestTube, FileText, Trash2, Settings, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { MCPServer } from '@/types/claude-config'

interface MCPServerCardProps {
  server: MCPServer
  onToggle?: (serverId: string, enabled: boolean) => void
  onDelete?: (serverId: string) => void
  onTest?: (serverId: string) => void
  onViewLogs?: (serverId: string) => void
  onEdit?: (serverId: string) => void
}

const STATUS_CONFIG = {
  running: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Running',
  },
  stopped: {
    icon: Square,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'Stopped',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Error',
  },
}

export function MCPServerCard({
  server,
  onToggle,
  onDelete,
  onTest,
  onViewLogs,
  onEdit,
}: MCPServerCardProps) {
  const [isTesting, setIsTesting] = useState(false)

  const status = server.status || 'stopped'
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  async function handleTest() {
    if (!onTest) return
    setIsTesting(true)
    try {
      await onTest(server.id)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{server.name}</CardTitle>
              <Badge variant="secondary" className={`gap-1 ${statusConfig.bgColor}`}>
                <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                <span className={statusConfig.color}>{statusConfig.label}</span>
              </Badge>
            </div>
            <CardDescription className="font-mono text-xs">
              {server.command} {server.args?.join(' ')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Switch
              checked={server.enabled}
              onCheckedChange={(checked) => onToggle?.(server.id, checked)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Environment Variables */}
          {server.env && Object.keys(server.env).length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Environment:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.keys(server.env).map((key) => (
                  <Badge key={key} variant="outline" className="text-xs font-mono">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting}
              className="gap-1"
            >
              {isTesting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <TestTube className="h-3 w-3" />
              )}
              Test Connection
            </Button>

            {status === 'running' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewLogs?.(server.id)}
                className="gap-1"
              >
                <FileText className="h-3 w-3" />
                View Logs
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(server.id)}
              className="gap-1"
            >
              <Settings className="h-3 w-3" />
              Edit
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(server.id)}
              className="gap-1 text-destructive ml-auto"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

