import fs from 'fs/promises'
import path from 'path'
import { CLAUDE_HOME, CLAUDE_PATHS } from './paths'

export interface SetupStatus {
  claudeHomeExists: boolean
  hasWritePermission: boolean
  requiredDirsExist: string[]
  missingDirs: string[]
  needsInitialization: boolean
}

export async function checkEnvironment(): Promise<SetupStatus> {
  const status: SetupStatus = {
    claudeHomeExists: false,
    hasWritePermission: false,
    requiredDirsExist: [],
    missingDirs: [],
    needsInitialization: false,
  }

  // Check if Claude home exists
  try {
    await fs.access(CLAUDE_HOME)
    status.claudeHomeExists = true
  } catch {
    status.needsInitialization = true
    return status
  }

  // Check write permissions
  try {
    const testFile = path.join(CLAUDE_HOME, '.write-test')
    await fs.writeFile(testFile, 'test')
    await fs.unlink(testFile)
    status.hasWritePermission = true
  } catch {
    status.hasWritePermission = false
  }

  // Check required directories
  const requiredDirs = ['skills', 'plugins']
  for (const dir of requiredDirs) {
    const dirPath = path.join(CLAUDE_HOME, dir)
    try {
      await fs.access(dirPath)
      status.requiredDirsExist.push(dir)
    } catch {
      status.missingDirs.push(dir)
    }
  }

  status.needsInitialization = status.missingDirs.length > 0
  return status
}

export async function initializeEnvironment(): Promise<void> {
  await fs.mkdir(CLAUDE_HOME, { recursive: true })
  await fs.mkdir(CLAUDE_PATHS.SKILLS, { recursive: true })
  await fs.mkdir(path.join(CLAUDE_HOME, 'plugins'), { recursive: true })

  // Create default config files if they don't exist
  const defaultConfigs = {
    'CLAUDE.md': '# Claude Configuration\n\nWelcome to Claude Code Manager!\n',
    'FLAGS.md': '# Feature Flags\n',
    'RULES.md': '# Rules\n',
  }

  for (const [filename, content] of Object.entries(defaultConfigs)) {
    const filePath = path.join(CLAUDE_HOME, filename)
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, content, 'utf-8')
    }
  }
}
