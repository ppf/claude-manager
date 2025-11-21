'use client'

import { useEffect, useState, useCallback } from 'react'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { SkillCard } from '@/components/skills/SkillCard'
import { CreateSkillWizard } from '@/components/skills/CreateSkillWizard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import type { Skill } from '@/types/claude-config'
import type { SkillTemplate } from '@/lib/templates/skill-templates'

export default function SkillsPage() {
  const [installedSkills, setInstalledSkills] = useState<Skill[]>([])
  const [marketplaceSkills, setMarketplaceSkills] = useState<Skill[]>([])
  const [marketplacePage, setMarketplacePage] = useState(1)
  const [templates, setTemplates] = useState<SkillTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchInstalledSkills()
    fetchMarketplaceSkills(1)
    fetchTemplates()
  }, [])

  useEffect(() => {
    // Check for updates on installed marketplace skills
    async function checkUpdates() {
      const marketplaceInstalled = installedSkills.filter(
        (s) => s.origin === 'marketplace'
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
            setInstalledSkills((prev) =>
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

    if (installedSkills.length > 0) {
      checkUpdates()
    }
  }, [installedSkills.length])

  async function fetchInstalledSkills() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skills?source=local&page=1&pageSize=1000')
      const result = await response.json()

      if (result.success) {
        setInstalledSkills(result.data.skills)
      }
    } catch (error) {
      console.error('Failed to fetch installed skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchMarketplaceSkills(page: number) {
    try {
      const response = await fetch(`/api/skills?source=marketplace&page=${page}&pageSize=20`)
      const result = await response.json()

      if (result.success) {
        if (page === 1) {
          setMarketplaceSkills(result.data.skills)
        } else {
          setMarketplaceSkills((prev) => [...prev, ...result.data.skills])
        }
        return result.data.pagination.hasMore
      }
      return false
    } catch (error) {
      console.error('Failed to fetch marketplace skills:', error)
      return false
    }
  }

  const loadMoreMarketplace = useCallback(async () => {
    const nextPage = marketplacePage + 1
    const hasMore = await fetchMarketplaceSkills(nextPage)
    setMarketplacePage(nextPage)
    return hasMore
  }, [marketplacePage])

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

  const refetchAll = useCallback(() => {
    fetchInstalledSkills()
    setMarketplaceSkills([])
    setMarketplacePage(1)
    fetchMarketplaceSkills(1)
  }, [])

  // Infinite scroll for marketplace
  const { ref: marketplaceRef, isLoadingMore, hasMore } = useInfiniteScroll(
    loadMoreMarketplace,
    { threshold: 300, enabled: true }
  )

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
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {installedSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={refetchAll} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <div ref={marketplaceRef} className="h-[calc(100vh-250px)] overflow-auto">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4">
              {marketplaceSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onUpdate={refetchAll} />
              ))}
            </div>

            {/* Loading indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* End of list message */}
            {!hasMore && marketplaceSkills.length > 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                All marketplace skills loaded
              </div>
            )}

            {/* Empty state */}
            {marketplaceSkills.length === 0 && !isLoadingMore && (
              <div className="text-center py-12 text-muted-foreground">
                No marketplace skills available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateSkillWizard open={showWizard} onOpenChange={setShowWizard} templates={templates} />
    </div>
  )
}
