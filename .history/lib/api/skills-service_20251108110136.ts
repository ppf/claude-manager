import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import type { Skill } from '@/types/claude-config'
import { isGitRepository, cloneRepository } from '@/lib/git/git-manager'

/**
 * Detect commands in skill content by looking for /command patterns
 */
export function detectCommands(content: string): string[] {
  const commandPattern = /\/([a-z][a-z0-9-]*)/g
  const matches = content.matchAll(commandPattern)
  const commands = new Set<string>()

  for (const match of matches) {
    commands.add(match[1])
  }

  return Array.from(commands)
}

export async function getLocalSkills(): Promise<Skill[]> {
  try {
    const skillsDir = CLAUDE_PATHS.SKILLS
    const entries = await fs.readdir(skillsDir, { withFileTypes: true })

    const skills: Skill[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillPath = path.join(skillsDir, entry.name)
      const skillFile = path.join(skillPath, 'SKILL.md')

      try {
        const content = await fs.readFile(skillFile, 'utf-8')
        const { data } = matter(content)

        const isGit = await isGitRepository(entry.name)
        const commands = detectCommands(content)

        skills.push({
          id: entry.name,
          name: data.name || entry.name,
          description: data.description || '',
          path: skillPath,
          enabled: data.enabled !== false,
          source: isGit ? 'marketplace' : 'local',
          version: data.version,
          author: data.author,
          hasCommands: commands.length > 0,
          commands: commands.length > 0 ? commands : undefined,
          tags: data.tags || [],
        })
      } catch (error) {
        // Skip invalid skills
        console.warn(`Invalid skill: ${entry.name}`, error)
      }
    }

    return skills
  } catch (error) {
    console.error('Failed to read skills:', error)
    return []
  }
}

export async function getMarketplaceSkills(): Promise<Skill[]> {
  // Placeholder for marketplace integration
  // This will be implemented based on MARKETPLACE_TYPE env variable
  // Supports: github | api | file
  return []
}

export async function installSkill(skillId: string, gitUrl: string): Promise<void> {
  await cloneRepository({
    url: gitUrl,
    directory: skillId,
  })
}

export async function uninstallSkill(skillId: string): Promise<void> {
  const skillPath = path.join(CLAUDE_PATHS.SKILLS, skillId)
  await fs.rm(skillPath, { recursive: true, force: true })
}

export async function toggleSkill(skillId: string, enabled: boolean): Promise<void> {
  const skillPath = path.join(CLAUDE_PATHS.SKILLS, skillId, 'SKILL.md')
  const content = await fs.readFile(skillPath, 'utf-8')
  const { data, content: skillContent } = matter(content)

  data.enabled = enabled

  const updated = matter.stringify(skillContent, data)
  await fs.writeFile(skillPath, updated, 'utf-8')
}
