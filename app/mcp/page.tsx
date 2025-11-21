'use client'

import { useEffect, useState } from 'react'
import { MCPServerCard } from '@/components/mcp/MCPServerCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConfirmation } from '@/components/ui/confirmation-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Server } from 'lucide-react'
import type { MCPServer } from '@/types/claude-config'
import { toast } from 'sonner'

export default function MCPPage() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const { confirm, dialog } = useConfirmation()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    args: '',
    env: '',
  })

  useEffect(() => {
    fetchServers()
  }, [])

  async function fetchServers() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/mcp')
      const result = await response.json()

      if (result.success) {
        setServers(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error)
      toast.error('Failed to load MCP servers')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddServer() {
    try {
      const args = formData.args.trim() ? formData.args.split(/\s+/) : []
      const env = formData.env.trim() ? JSON.parse(formData.env) : {}

      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          command: formData.command,
          args,
          env,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('MCP server added successfully')
        setIsAddDialogOpen(false)
        resetForm()
        fetchServers()
      } else {
        toast.error(result.error?.message || 'Failed to add server')
      }
    } catch (error) {
      toast.error('Failed to add server')
      console.error('Add error:', error)
    }
  }

  async function handleEditServer() {
    if (!selectedServer) return

    try {
      const args = formData.args.trim() ? formData.args.split(/\s+/) : []
      const env = formData.env.trim() ? JSON.parse(formData.env) : {}

      const response = await fetch(`/api/mcp/${selectedServer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          command: formData.command,
          args,
          env,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('MCP server updated successfully')
        setIsEditDialogOpen(false)
        setSelectedServer(null)
        resetForm()
        fetchServers()
      } else {
        toast.error(result.error?.message || 'Failed to update server')
      }
    } catch (error) {
      toast.error('Failed to update server')
      console.error('Update error:', error)
    }
  }

  async function handleToggle(serverId: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/mcp/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(enabled ? 'Server enabled' : 'Server disabled')
        fetchServers()
      } else {
        toast.error(result.error?.message || 'Failed to toggle server')
      }
    } catch (error) {
      toast.error('Failed to toggle server')
      console.error('Toggle error:', error)
    }
  }

  async function handleDelete(serverId: string) {
    const server = servers.find((s) => s.id === serverId)
    await confirm({
      title: 'Remove MCP Server',
      description: `Are you sure you want to remove "${server?.name || 'this server'}"? This action cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/mcp/${serverId}`, {
            method: 'DELETE',
          })

          const result = await response.json()

          if (result.success) {
            toast.success('MCP server removed')
            fetchServers()
          } else {
            toast.error(result.error?.message || 'Failed to remove server')
          }
        } catch (error) {
          toast.error('Failed to remove server')
          console.error('Delete error:', error)
        }
      },
    })
  }

  async function handleTest(serverId: string) {
    try {
      const response = await fetch(`/api/mcp/${serverId}/test`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success && result.data.success) {
        toast.success('Connection test successful')
      } else {
        toast.error('Connection test failed')
      }
    } catch (error) {
      toast.error('Connection test failed')
      console.error('Test error:', error)
    }
  }

  async function handleViewLogs(serverId: string) {
    try {
      const response = await fetch(`/api/mcp/${serverId}/logs`)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data.logs)
        setIsLogsDialogOpen(true)
      } else {
        toast.error('Failed to fetch logs')
      }
    } catch (error) {
      toast.error('Failed to fetch logs')
      console.error('Logs error:', error)
    }
  }

  function handleEdit(serverId: string) {
    const server = servers.find((s) => s.id === serverId)
    if (!server) return

    setSelectedServer(server)
    setFormData({
      name: server.name,
      command: server.command,
      args: server.args?.join(' ') || '',
      env: server.env ? JSON.stringify(server.env, null, 2) : '',
    })
    setIsEditDialogOpen(true)
  }

  async function handleStart(serverId: string) {
    try {
      const response = await fetch(`/api/mcp/${serverId}/start`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Server started')
        fetchServers()
      } else {
        toast.error(result.error?.message || 'Failed to start server')
      }
    } catch (error) {
      toast.error('Failed to start server')
      console.error('Start error:', error)
    }
  }

  async function handleStop(serverId: string) {
    try {
      const response = await fetch(`/api/mcp/${serverId}/stop`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Server stopped')
        fetchServers()
      } else {
        toast.error(result.error?.message || 'Failed to stop server')
      }
    } catch (error) {
      toast.error('Failed to stop server')
      console.error('Stop error:', error)
    }
  }

  async function handleRestart(serverId: string) {
    try {
      const response = await fetch(`/api/mcp/${serverId}/restart`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Server restarted')
        fetchServers()
      } else {
        toast.error(result.error?.message || 'Failed to restart server')
      }
    } catch (error) {
      toast.error('Failed to restart server')
      console.error('Restart error:', error)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      command: '',
      args: '',
      env: '',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading MCP servers...</div>
      </div>
    )
  }

  return (
    <>
      {dialog}
      <div className="h-full overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MCP Servers</h1>
            <p className="text-muted-foreground mt-1">Manage Model Context Protocol servers</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Server
          </Button>
        </div>

        {/* Server List */}
        {servers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No MCP servers configured</p>
            <p className="text-sm mt-2">Add your first MCP server to get started.</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              Add Server
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {servers.map((server) => (
              <MCPServerCard
                key={server.id}
                server={server}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onTest={handleTest}
                onViewLogs={handleViewLogs}
                onEdit={handleEdit}
                onStart={handleStart}
                onStop={handleStop}
                onRestart={handleRestart}
              />
            ))}
          </div>
        )}

        {/* Add Server Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add MCP Server</DialogTitle>
              <DialogDescription>Configure a new Model Context Protocol server</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  placeholder="my-mcp-server"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  placeholder="node"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="args">Arguments (space-separated)</Label>
                <Input
                  id="args"
                  placeholder="/path/to/server.js --port 3000"
                  value={formData.args}
                  onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="env">Environment Variables (JSON)</Label>
                <Textarea
                  id="env"
                  placeholder='{"API_KEY": "your-key", "PORT": "3000"}'
                  value={formData.env}
                  onChange={(e) => setFormData({ ...formData, env: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddServer}>Add Server</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Server Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit MCP Server</DialogTitle>
              <DialogDescription>Update server configuration</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Server Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-command">Command</Label>
                <Input
                  id="edit-command"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-args">Arguments (space-separated)</Label>
                <Input
                  id="edit-args"
                  value={formData.args}
                  onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-env">Environment Variables (JSON)</Label>
                <Textarea
                  id="edit-env"
                  value={formData.env}
                  onChange={(e) => setFormData({ ...formData, env: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditServer}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logs Dialog */}
        <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Server Logs</DialogTitle>
              <DialogDescription>Real-time logs from the MCP server</DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <div className="font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No logs available</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap break-all">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button onClick={() => setIsLogsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  )
}
