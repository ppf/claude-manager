import simpleGit, { SimpleGit } from 'simple-git'
import path from 'path'
import { CLAUDE_PATHS } from '@/lib/claude/paths'

const git: SimpleGit = simpleGit()

export class GitAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GitAuthError'
  }
}

export interface GitRepository {
  url: string
  branch?: string
  directory: string
}

export async function cloneRepository(repo: GitRepository): Promise<void> {
  const targetPath = path.join(CLAUDE_PATHS.SKILLS, repo.directory)

  try {
    await git.clone(
      repo.url,
      targetPath,
      [repo.branch ? `--branch=${repo.branch}` : ''].filter(Boolean)
    )
  } catch (error) {
    // Detect authentication errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('Authentication failed') ||
      errorMessage.includes('Permission denied') ||
      errorMessage.includes('could not read Username')
    ) {
      throw new GitAuthError(
        'Authentication required. Please ensure you have access to this repository. ' +
          'For private repos, configure SSH keys or use personal access tokens.'
      )
    }
    throw error
  }
}

export async function pullRepository(directory: string): Promise<void> {
  const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
  await git.cwd(repoPath).pull()
}

export async function getRepositoryInfo(directory: string) {
  const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
  const repo = git.cwd(repoPath)

  const [remotes, branch, log] = await Promise.all([
    repo.getRemotes(true),
    repo.branch(),
    repo.log({ maxCount: 1 }),
  ])

  return {
    remotes,
    currentBranch: branch.current,
    latestCommit: log.latest,
  }
}

export async function isGitRepository(directory: string): Promise<boolean> {
  try {
    const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
    await git.cwd(repoPath).checkIsRepo()
    return true
  } catch {
    return false
  }
}
