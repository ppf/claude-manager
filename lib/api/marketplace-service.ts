import fs from 'fs/promises'
import { Dirent } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import type { Marketplace, MarketplacePlugin } from '@/types/claude-config'
import { detectCommands } from './skills-service'

/**
 * Get all installed marketplaces from the cache directory
 */
export async function getMarketplaces(): Promise<Marketplace[]> {
  try {
    const pluginsCacheDir = path.join(CLAUDE_PATHS.PLUGINS, 'cache')
    const skillsDir = CLAUDE_PATHS.SKILLS

    // Check if plugins cache directory exists
    let cacheEntries: Dirent[] = []
    try {
      cacheEntries = await fs.readdir(pluginsCacheDir, { withFileTypes: true })
    } catch {
      // No marketplaces installed yet
      return []
    }

    // Get list of installed skill IDs
    let installedSkillIds: Set<string> = new Set()
    try {
      const skillEntries = await fs.readdir(skillsDir, { withFileTypes: true })
      installedSkillIds = new Set(
        skillEntries.filter((e) => e.isDirectory()).map((e) => e.name)
      )
    } catch {
      // Skills directory might not exist yet
    }

    const marketplaces: Marketplace[] = []

    // Scan each cached marketplace directory
    for (const entry of cacheEntries) {
      if (!entry.isDirectory()) continue

      const marketplaceCachePath = path.join(pluginsCacheDir, entry.name)
      const marketplaceJsonPath = path.join(
        marketplaceCachePath,
        '.claude-plugin',
        'marketplace.json'
      )

      try {
        const marketplaceContent = await fs.readFile(marketplaceJsonPath, 'utf-8')
        const marketplace = JSON.parse(marketplaceContent)

        const marketplaceName = marketplace.name || entry.name
        const plugins = marketplace.plugins || []

        // Count installed plugins from this marketplace
        let installedCount = 0
        for (const plugin of plugins) {
          const pluginId = plugin.name || entry.name
          if (installedSkillIds.has(pluginId)) {
            installedCount++
          }
        }

        marketplaces.push({
          id: entry.name,
          name: marketplaceName,
          description: marketplace.description,
          url: marketplace.url || marketplace.repository,
          path: marketplaceCachePath,
          pluginCount: plugins.length,
          installedCount,
        })
      } catch (error) {
        // Skip invalid marketplace.json files
        console.warn(`Failed to read marketplace: ${marketplaceJsonPath}`, error)
      }
    }

    return marketplaces
  } catch (error) {
    console.error('Failed to fetch marketplaces:', error)
    return []
  }
}

/**
 * Get details for a specific marketplace including all its plugins
 */
export async function getMarketplaceDetails(
  marketplaceId: string
): Promise<Marketplace | null> {
  try {
    const marketplaces = await getMarketplaces()
    return marketplaces.find((m) => m.id === marketplaceId) || null
  } catch (error) {
    console.error(`Failed to fetch marketplace details for ${marketplaceId}:`, error)
    return null
  }
}

/**
 * Get all plugins from a specific marketplace
 */
export async function getMarketplacePlugins(
  marketplaceId: string
): Promise<MarketplacePlugin[]> {
  try {
    const pluginsCacheDir = path.join(CLAUDE_PATHS.PLUGINS, 'cache')
    const skillsDir = CLAUDE_PATHS.SKILLS

    const marketplaceCachePath = path.join(pluginsCacheDir, marketplaceId)
    const marketplaceJsonPath = path.join(
      marketplaceCachePath,
      '.claude-plugin',
      'marketplace.json'
    )

    // Get list of installed skill IDs
    let installedSkillIds: Set<string> = new Set()
    let installedSkillsData: Map<string, { enabled: boolean }> = new Map()
    try {
      const skillEntries = await fs.readdir(skillsDir, { withFileTypes: true })
      for (const entry of skillEntries) {
        if (!entry.isDirectory()) continue
        installedSkillIds.add(entry.name)

        // Try to read enabled status
        try {
          const skillFile = path.join(skillsDir, entry.name, 'SKILL.md')
          const content = await fs.readFile(skillFile, 'utf-8')
          const { data } = matter(content)
          installedSkillsData.set(entry.name, {
            enabled: data.enabled !== false,
          })
        } catch {
          // Skip if can't read skill file
        }
      }
    } catch {
      // Skills directory might not exist yet
    }

    // Read marketplace registry
    const marketplaceContent = await fs.readFile(marketplaceJsonPath, 'utf-8')
    const marketplace = JSON.parse(marketplaceContent)
    const marketplaceName = marketplace.name || marketplaceId

    const plugins: MarketplacePlugin[] = []

    if (marketplace.plugins && Array.isArray(marketplace.plugins)) {
      for (const plugin of marketplace.plugins) {
        const pluginId = plugin.name || marketplaceId
        const isInstalled = installedSkillIds.has(pluginId)
        const skillData = installedSkillsData.get(pluginId)

        // Check if plugin has a SKILL.md file in the cache
        const pluginSourcePath = path.resolve(
          marketplaceCachePath,
          plugin.source || '.'
        )
        const skillFile = path.join(pluginSourcePath, 'SKILL.md')

        let skillMetadata: Record<string, unknown> = {}
        let commands: string[] = []

        try {
          const skillContent = await fs.readFile(skillFile, 'utf-8')
          const parsed = matter(skillContent)
          skillMetadata = parsed.data
          commands = detectCommands(skillContent)
        } catch {
          // No SKILL.md file, use marketplace.json data
        }

        plugins.push({
          id: pluginId,
          name: (skillMetadata.name as string) || plugin.name || pluginId,
          description:
            (skillMetadata.description as string) ||
            plugin.description ||
            'No description available',
          version: (skillMetadata.version as string) || plugin.version,
          author:
            (skillMetadata.author as string) ||
            plugin.author?.name ||
            plugin.author?.email,
          gitUrl: plugin.repository || plugin.gitUrl || plugin.url,
          source: plugin.source,
          installed: isInstalled,
          enabled: skillData?.enabled,
          commands: commands.length > 0 ? commands : undefined,
          tags: Array.isArray(skillMetadata.tags)
            ? (skillMetadata.tags as string[])
            : [],
          marketplaceName,
        })
      }
    }

    return plugins
  } catch (error) {
    console.error(`Failed to fetch plugins for marketplace ${marketplaceId}:`, error)
    return []
  }
}

/**
 * Get details for a specific plugin from a marketplace
 */
export async function getMarketplacePluginDetails(
  marketplaceId: string,
  pluginId: string
): Promise<MarketplacePlugin | null> {
  try {
    const plugins = await getMarketplacePlugins(marketplaceId)
    return plugins.find((p) => p.id === pluginId) || null
  } catch (error) {
    console.error(
      `Failed to fetch plugin details for ${pluginId} in ${marketplaceId}:`,
      error
    )
    return null
  }
}

/**
 * Get the README content for a plugin
 */
export async function getPluginReadme(
  marketplaceId: string,
  pluginId: string
): Promise<string | null> {
  try {
    const pluginsCacheDir = path.join(CLAUDE_PATHS.PLUGINS, 'cache')
    const marketplaceCachePath = path.join(pluginsCacheDir, marketplaceId)
    const marketplaceJsonPath = path.join(
      marketplaceCachePath,
      '.claude-plugin',
      'marketplace.json'
    )

    // Read marketplace registry to find plugin source
    const marketplaceContent = await fs.readFile(marketplaceJsonPath, 'utf-8')
    const marketplace = JSON.parse(marketplaceContent)

    if (!marketplace.plugins || !Array.isArray(marketplace.plugins)) {
      return null
    }

    const plugin = marketplace.plugins.find(
      (p: { name?: string }) => p.name === pluginId
    )

    if (!plugin) {
      return null
    }

    const pluginSourcePath = path.resolve(
      marketplaceCachePath,
      plugin.source || '.'
    )

    // Try to read README.md or SKILL.md
    const readmeFiles = ['README.md', 'readme.md', 'SKILL.md']

    for (const readmeFile of readmeFiles) {
      try {
        const readmePath = path.join(pluginSourcePath, readmeFile)
        const content = await fs.readFile(readmePath, 'utf-8')
        return content
      } catch {
        // Try next file
        continue
      }
    }

    return null
  } catch (error) {
    console.error(
      `Failed to fetch README for ${pluginId} in ${marketplaceId}:`,
      error
    )
    return null
  }
}
