import fs from 'fs/promises'
import { Dirent } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import type { Skill } from '@/types/claude-config'
import { cloneRepository, isGitRepository } from '@/lib/git/git-manager'
import { skillMetadataSchema } from '@/lib/validators/skill-schema'

/**
 * Parse skill commands from frontmatter using Zod validation
 * Falls back to empty array if commands not specified or invalid
 */
export function parseSkillCommands(frontmatter: unknown): string[] {
  const result = skillMetadataSchema.safeParse(frontmatter)

  if (result.success) {
    return result.data.commands || []
  }

  // Fallback: if parsing fails but commands field exists as array, use it
  if (
    typeof frontmatter === 'object' &&
    frontmatter !== null &&
    'commands' in frontmatter &&
    Array.isArray(frontmatter.commands)
  ) {
    return frontmatter.commands.filter((cmd): cmd is string => typeof cmd === 'string')
  }

  return []
}

/**
 * Check if a skill ID exists in any marketplace registry
 * @returns true if skill is registered in marketplace.json, false otherwise
 */
async function isMarketplaceSkill(skillId: string): Promise<boolean> {
  try {
    const pluginsCacheDir = path.join(CLAUDE_PATHS.PLUGINS, 'cache')
    
    let cacheEntries: Dirent[] = []
    try {
      cacheEntries = await fs.readdir(pluginsCacheDir, { withFileTypes: true })
    } catch {
      return false
    }

    // Check each marketplace registry
    for (const entry of cacheEntries) {
      if (!entry.isDirectory()) continue

      const marketplaceJsonPath = path.join(
        pluginsCacheDir,
        entry.name,
        '.claude-plugin',
        'marketplace.json'
      )

      try {
        const content = await fs.readFile(marketplaceJsonPath, 'utf-8')
        const marketplace = JSON.parse(content)

        if (marketplace.plugins && Array.isArray(marketplace.plugins)) {
          // Check if skillId matches any plugin name
          const found = marketplace.plugins.some(
            (plugin: { name?: string }) => plugin.name === skillId
          )
          if (found) return true
        }
      } catch {
        // Skip invalid marketplace files
        continue
      }
    }

    return false
  } catch {
    return false
  }
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

        const isMarketplace = await isMarketplaceSkill(entry.name)
        const commands = parseSkillCommands(data)

        skills.push({
          id: entry.name,
          name: data.name || entry.name,
          description: data.description || '',
          path: skillPath,
          enabled: data.enabled !== false,
          source: isMarketplace ? 'marketplace' : 'local',
          origin: isMarketplace ? 'marketplace' : 'local',
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
  try {
    const pluginsCacheDir = path.join(CLAUDE_PATHS.PLUGINS, 'cache')
    const skillsDir = CLAUDE_PATHS.SKILLS

    // Get list of installed skill IDs to filter out already-installed plugins
    let installedSkillIds: Set<string> = new Set()
    try {
      const skillEntries = await fs.readdir(skillsDir, { withFileTypes: true })
      installedSkillIds = new Set(
        skillEntries.filter((e) => e.isDirectory()).map((e) => e.name)
      )
    } catch {
      // Skills directory might not exist yet
    }

    // Check if plugins cache directory exists
    let cacheEntries: Dirent[] = []
    try {
      cacheEntries = await fs.readdir(pluginsCacheDir, { withFileTypes: true })
    } catch {
      // Plugins cache might not exist
      return []
    }

    const marketplaceSkills: Skill[] = []

    // Scan each cached plugin directory for marketplace.json
    for (const entry of cacheEntries) {
      if (!entry.isDirectory()) continue

      const pluginCachePath = path.join(pluginsCacheDir, entry.name)
      const marketplaceJsonPath = path.join(
        pluginCachePath,
        '.claude-plugin',
        'marketplace.json'
      )

      try {
        const marketplaceContent = await fs.readFile(marketplaceJsonPath, 'utf-8')
        const marketplace = JSON.parse(marketplaceContent)

        // Extract marketplace name from the directory or marketplace.json
        const marketplaceName = marketplace.name || entry.name

        // Process each plugin in the marketplace
        if (marketplace.plugins && Array.isArray(marketplace.plugins)) {
          for (const plugin of marketplace.plugins) {
            const pluginId = plugin.name || entry.name

            // Skip if already installed
            if (installedSkillIds.has(pluginId)) {
              continue
            }

            // Check if plugin has a SKILL.md file in the cache
            const pluginSourcePath = path.resolve(
              pluginCachePath,
              plugin.source || '.'
            )
            const skillFile = path.join(pluginSourcePath, 'SKILL.md')

            let skillData: Record<string, unknown> = {}
            let commands: string[] = []

            try {
              const skillContent = await fs.readFile(skillFile, 'utf-8')
              const parsed = matter(skillContent)
              skillData = parsed.data
              commands = parseSkillCommands(parsed.data)
            } catch {
              // No SKILL.md file, use marketplace.json data
            }

            marketplaceSkills.push({
              id: `${pluginId}@${marketplaceName}`,
              name: (skillData.name as string) || plugin.name || pluginId,
              description:
                (skillData.description as string) ||
                plugin.description ||
                'No description available',
              path: '', // Not installed yet
              enabled: false,
              source: 'marketplace',
              origin: 'marketplace',  // Always marketplace for uninstalled skills
              version: (skillData.version as string) || plugin.version,
              author:
                (skillData.author as string) ||
                plugin.author?.name ||
                plugin.author?.email,
              hasCommands: commands.length > 0,
              commands: commands.length > 0 ? commands : undefined,
              tags: Array.isArray(skillData.tags) ? (skillData.tags as string[]) : [],
              gitUrl: plugin.repository || plugin.gitUrl || plugin.url,  // Extract git URL from marketplace.json
            })
          }
        }
      } catch (error) {
        // Skip invalid marketplace.json files
        console.warn(`Failed to read marketplace: ${marketplaceJsonPath}`, error)
      }
    }

    return marketplaceSkills
  } catch (error) {
    console.error('Failed to fetch marketplace skills:', error)
    return []
  }
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

export async function checkSkillUpdates(skillId: string): Promise<{
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string
  gitStatus?: {
    ahead: number
    behind: number
    modified: boolean
  }
}> {
  // Check if it's a git repository
  const isGit = await isGitRepository(skillId)
  if (!isGit) {
    return {
      updateAvailable: false,
      currentVersion: 'local',
      latestVersion: 'local',
    }
  }

  // Import git functions
  const { checkForUpdates } = await import('@/lib/git/git-manager')
  
  const updateStatus = await checkForUpdates(skillId)

  return {
    updateAvailable: updateStatus.updateAvailable,
    currentVersion: updateStatus.currentVersion,
    latestVersion: updateStatus.latestVersion,
    gitStatus: {
      ahead: updateStatus.ahead,
      behind: updateStatus.behind,
      modified: updateStatus.modified,
    },
  }
}

export async function updateSkill(skillId: string): Promise<void> {
  // Check if it's a git repository
  const isGit = await isGitRepository(skillId)
  if (!isGit) {
    throw new Error('Cannot update: Skill is not a git repository')
  }

  // Import git functions
  const { updateRepository } = await import('@/lib/git/git-manager')
  
  // Update the repository
  await updateRepository(skillId)
}
