import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export interface TestClaudeDirectory {
  path: string
  cleanup: () => Promise<void>
}

/**
 * Create a temporary Claude directory structure for testing
 */
export async function createTestClaudeDirectory(): Promise<TestClaudeDirectory> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-'))

  // Create directory structure
  await fs.mkdir(path.join(tmpDir, 'skills'), { recursive: true })
  await fs.mkdir(path.join(tmpDir, 'plugins'), { recursive: true })

  // Create config files
  await fs.writeFile(
    path.join(tmpDir, 'CLAUDE.md'),
    `---
name: Test Claude
version: 1.0.0
---

# Test Configuration

This is a test configuration file.
`
  )

  await fs.writeFile(
    path.join(tmpDir, 'FLAGS.md'),
    `# Feature Flags

test_flag: true
debug_mode: false
`
  )

  await fs.writeFile(
    path.join(tmpDir, 'RULES.md'),
    `# Coding Rules

1. Write clean code
2. Add tests
3. Document your work
`
  )

  // Create test skill
  const skillDir = path.join(tmpDir, 'skills', 'test-skill')
  await fs.mkdir(skillDir, { recursive: true })
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---
name: Test Skill
description: A test skill for unit tests
author: Test Author
version: 1.0.0
---

# Test Skill

This is a test skill.
`
  )

  // Create test plugin
  const pluginDir = path.join(tmpDir, 'plugins', 'test-plugin')
  await fs.mkdir(pluginDir, { recursive: true })
  await fs.writeFile(
    path.join(pluginDir, 'plugin.json'),
    JSON.stringify(
      {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        main: 'index.js',
      },
      null,
      2
    )
  )

  // Create MCP config
  await fs.writeFile(
    path.join(tmpDir, '.mcp.json'),
    JSON.stringify(
      {
        mcpServers: {
          'test-server': {
            command: 'node',
            args: ['server.js'],
            env: {},
            enabled: true,
          },
        },
      },
      null,
      2
    )
  )

  const cleanup = async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }

  return { path: tmpDir, cleanup }
}

/**
 * Create a temporary file
 */
export async function createTempFile(filename: string, content: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-test-'))
  const filePath = path.join(tmpDir, filename)
  await fs.writeFile(filePath, content, 'utf-8')
  return filePath
}

/**
 * Cleanup test directory
 */
export async function cleanupTestDirectory(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true })
  } catch (error) {
    console.error('Failed to cleanup test directory:', error)
  }
}

