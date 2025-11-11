'use client'

import { useEffect, useState } from 'react'
import { SkillCard } from '@/components/skills/SkillCard'
import { CreateSkillWizard } from '@/components/skills/CreateSkillWizard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Skill } from '@/types/claude-config'
import type { SkillTemplate } from '@/lib/templates/skill-templates'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [templates, setTemplates] = useState<SkillTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchSkills()
    fetchTemplates()
  }, [])

  useEffect(() => {
    // Check for updates on installed marketplace skills
    async function checkUpdates() {
      const marketplaceInstalled = skills.filter(
        (s) => s.path !== '' && s.origin === 'marketplace'
      )

      for (const skill of marketplaceInstalled) {
        try {
          const response = await fetch(`/api/skills/${skill.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check-update' }),
          })

          const result = await response.json()

          if (result.success && result.data?.updateAvailable) {
            // Update the skill in state
            setSkills((prev) =>
              prev.map((s) =>
                s.id === skill.id
                  ? {
                      ...s,
                      updateAvailable: result.data.updateAvailable,
                      latestVersion: result.data.latestVersion,
                      gitStatus: result.data.gitStatus,
                    }
                  : s
              )
            )
          }
        } catch (error) {
          console.error(`Failed to check updates for ${skill.id}:`, error)
        }
      }
    }

    if (skills.length > 0) {
      checkUpdates()
    }
  }, [skills])

  async function fetchSkills() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skills?source=all')
      const result = await response.json()

      if (result.success) {
        setSkills(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/skills/templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  // Installed: All skills with filesystem path (local + marketplace-installed)
  const installedSkills = skills.filter((s) => s.path !== '')
  // Available: Uninstalled marketplace skills only
  const availableSkills = skills.filter((s) => s.path === '')

  if (isLoading) {
    return <div className="p-8">Loading skills...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Skills</h1>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Skill
        </Button>
      </div>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">Installed ({installedSkills.length})</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace ({availableSkills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {installedSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkills} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkills} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CreateSkillWizard open={showWizard} onOpenChange={setShowWizard} templates={templates} />
    </div>
  )
}
