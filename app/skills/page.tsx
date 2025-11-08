'use client'

import { useEffect, useState } from 'react'
import { SkillCard } from '@/components/skills/SkillCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Skill } from '@/types/claude-config'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
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
        setSkills(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const localSkills = skills.filter((s) => s.source === 'local' || s.path !== '')
  const marketplaceSkills = skills.filter(
    (s) => s.source === 'marketplace' && s.path === ''
  )

  if (isLoading) {
    return <div className="p-8">Loading skills...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Skills</h1>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">
            Installed ({localSkills.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace">
            Marketplace ({marketplaceSkills.length})
          </TabsTrigger>
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
    </div>
  )
}
