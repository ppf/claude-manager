'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useConfirmation } from '@/components/ui/confirmation-dialog'
import { Download, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import type { Skill } from '@/types/claude-config'

interface SkillCardProps {
  skill: Skill
  onUpdate: () => void
}

export function SkillCard({ skill, onUpdate }: SkillCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { confirm, dialog } = useConfirmation()

  async function handleInstall() {
    try {
      setIsLoading(true)
      // TODO: Get git URL from marketplace
      const gitUrl = `https://github.com/example/${skill.id}.git`

      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install', gitUrl }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Skill installed successfully')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to install skill')
      }
    } catch {
      toast.error('Failed to install skill')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUninstall() {
    await confirm({
      title: 'Uninstall Skill',
      description: `Are you sure you want to uninstall "${skill.name}"? This action cannot be undone.`,
      confirmLabel: 'Uninstall',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/skills/${skill.id}`, {
            method: 'DELETE',
          })

          const result = await response.json()

          if (result.success) {
            toast.success('Skill uninstalled successfully')
            onUpdate()
          } else {
            toast.error(result.error?.message || 'Failed to uninstall skill')
          }
        } catch {
          toast.error('Failed to uninstall skill')
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  async function handleToggle() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: !skill.enabled }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(skill.enabled ? 'Skill disabled' : 'Skill enabled')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to update skill')
      }
    } catch {
      toast.error('Failed to update skill')
    } finally {
      setIsLoading(false)
    }
  }

  const isInstalled = skill.source === 'local' || skill.path !== ''

  return (
    <>
      {dialog}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{skill.name}</span>
            <div className="flex items-center gap-2">
              {skill.origin && (
                <Badge variant={skill.origin === 'marketplace' ? 'secondary' : 'outline'}>
                  {skill.origin === 'marketplace' ? 'Marketplace' : 'Local'}
                </Badge>
              )}
              {skill.enabled && (
                <Badge className="bg-green-500 hover:bg-green-600">Enabled</Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>{skill.description}</CardDescription>
        </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {!isInstalled ? (
            <Button onClick={handleInstall} disabled={isLoading} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          ) : (
            <>
              <Button
                onClick={handleToggle}
                disabled={isLoading}
                variant={skill.enabled ? 'outline' : 'default'}
                size="sm"
              >
                <Power className="h-4 w-4 mr-2" />
                {skill.enabled ? 'Disable' : 'Enable'}
              </Button>
              <Button
                onClick={handleUninstall}
                disabled={isLoading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Uninstall
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  )
}
