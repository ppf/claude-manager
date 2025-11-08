import path from 'path'
import { homedir } from 'os'

export const CLAUDE_HOME = process.env.CLAUDE_HOME || path.join(homedir(), '.claude')

export function getClaudePath(...segments: string[]): string {
  return path.join(CLAUDE_HOME, ...segments)
}

export function sanitizePath(userPath: string): string {
  const resolved = path.resolve(CLAUDE_HOME, userPath)
  if (!resolved.startsWith(CLAUDE_HOME)) {
    throw new Error('Path traversal attempt detected')
  }
  return resolved
}

export function getRelativePath(absolutePath: string): string {
  return path.relative(CLAUDE_HOME, absolutePath)
}

export const CLAUDE_PATHS = {
  CONFIGS: getClaudePath(),
  SKILLS: getClaudePath('skills'),
  PLUGINS: getClaudePath('plugins'),
  MCP_CONFIG: getClaudePath('mcp-servers.json'),
} as const
