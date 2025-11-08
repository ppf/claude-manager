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

  const localSkills = skills.filter((s) => s.source === 'local' || s.path !== '')
  const marketplaceSkills = skills.filter((s) => s.source === 'marketplace' && s.path === '')

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
          <TabsTrigger value="installed">Installed ({localSkills.length})</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace ({marketplaceSkills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkills} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketplaceSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkills} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CreateSkillWizard open={showWizard} onOpenChange={setShowWizard} templates={templates} />
    </div>
  )
}
