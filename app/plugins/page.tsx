'use client'

import { useEffect, useState } from 'react'
import { PluginCard } from '@/components/plugins/PluginCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Plus, Terminal } from 'lucide-react'
import type { Skill } from '@/types/claude-config'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PluginsPage() {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [])

  async function fetchSkills() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skills?source=all')
      const result = await response.json()

      if (result.success) {
        setAllSkills(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error)
      toast.error('Failed to load plugins')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle(skillId: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/skills/${skillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(enabled ? 'Plugin enabled' : 'Plugin disabled')
        fetchSkills()
      } else {
        toast.error(result.error?.message || 'Failed to toggle plugin')
      }
    } catch (error) {
      toast.error('Failed to toggle plugin')
      console.error('Toggle error:', error)
    }
  }

  async function handleDelete(skillId: string) {
    if (!confirm('Are you sure you want to remove this plugin?')) {
      return
    }

    try {
      const response = await fetch(`/api/skills/${skillId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Plugin removed')
        fetchSkills()
      } else {
        toast.error(result.error?.message || 'Failed to remove plugin')
      }
    } catch (error) {
      toast.error('Failed to remove plugin')
      console.error('Delete error:', error)
    }
  }

  const pluginSkills = allSkills.filter((s) => s.hasCommands)
  const regularSkills = allSkills.filter((s) => !s.hasCommands)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading plugins...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plugins & Commands</h1>
            <p className="text-muted-foreground mt-1">
              Manage skills with slash commands and plugins
            </p>
          </div>
          <Link href="/skills">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Skill
            </Button>
          </Link>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            In Claude Code, &quot;plugins&quot; are skills that provide slash commands. All plugins
            are stored in <code className="text-xs">~/.claude/skills/</code> directory.{' '}
            <Link href="/skills" className="underline">
              View all skills
            </Link>
            .
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs defaultValue="plugins" className="w-full">
          <TabsList>
            <TabsTrigger value="plugins">Command Skills ({pluginSkills.length})</TabsTrigger>
            <TabsTrigger value="all">All Skills ({allSkills.length})</TabsTrigger>
            <TabsTrigger value="auto">Auto Skills ({regularSkills.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="plugins" className="space-y-4 mt-6">
            {pluginSkills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No command skills found</p>
                <p className="text-sm mt-2">
                  Install skills that provide slash commands to see them here.
                </p>
                <Link href="/skills">
                  <Button variant="outline" className="mt-4">
                    Browse Skills
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {pluginSkills.map((skill) => (
                  <PluginCard
                    key={skill.id}
                    skill={skill}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {allSkills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No skills found</p>
                <Link href="/skills">
                  <Button variant="outline" className="mt-4">
                    Add Your First Skill
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {allSkills.map((skill) => (
                  <PluginCard
                    key={skill.id}
                    skill={skill}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auto" className="space-y-4 mt-6">
            {regularSkills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No auto-activation skills found</p>
                <Link href="/skills">
                  <Button variant="outline" className="mt-4">
                    Browse Skills
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {regularSkills.map((skill) => (
                  <PluginCard
                    key={skill.id}
                    skill={skill}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
