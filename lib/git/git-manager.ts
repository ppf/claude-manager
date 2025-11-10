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

export interface UpdateStatus {
  updateAvailable: boolean
  behind: number
  ahead: number
  currentVersion: string
  latestVersion: string
  modified: boolean
}

export async function checkForUpdates(directory: string): Promise<UpdateStatus> {
  const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
  const repo = git.cwd(repoPath)

  try {
    // Fetch latest from remote
    await repo.fetch()

    // Get current branch
    const branchSummary = await repo.branch()
    const currentBranch = branchSummary.current

    // Get status
    const status = await repo.status()

    // Get commit counts
    const log = await repo.log({
      from: `HEAD`,
      to: `origin/${currentBranch}`,
    })

    const behind = log.total
    const aheadLog = await repo.log({
      from: `origin/${currentBranch}`,
      to: `HEAD`,
    })
    const ahead = aheadLog.total

    // Get current and latest commit hashes
    const currentLog = await repo.log({ maxCount: 1 })
    const currentVersion = currentLog.latest?.hash.substring(0, 7) || 'unknown'

    const remoteLog = await repo.log({
      from: `origin/${currentBranch}`,
      maxCount: 1,
    })
    const latestVersion = remoteLog.latest?.hash.substring(0, 7) || currentVersion

    return {
      updateAvailable: behind > 0,
      behind,
      ahead,
      currentVersion,
      latestVersion,
      modified: status.modified.length > 0 || status.created.length > 0 || status.deleted.length > 0,
    }
  } catch (error) {
    // If fetch fails, assume no updates available
    return {
      updateAvailable: false,
      behind: 0,
      ahead: 0,
      currentVersion: 'unknown',
      latestVersion: 'unknown',
      modified: false,
    }
  }
}

export async function updateRepository(directory: string): Promise<void> {
  const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
  const repo = git.cwd(repoPath)

  try {
    // Check for local modifications
    const status = await repo.status()
    if (status.modified.length > 0 || status.created.length > 0 || status.deleted.length > 0) {
      throw new Error(
        'Cannot update: Local modifications detected. Please commit or discard changes first.'
      )
    }

    // Pull latest changes
    await repo.pull()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Handle merge conflicts
    if (errorMessage.includes('CONFLICT') || errorMessage.includes('Merge conflict')) {
      throw new Error(
        'Update failed due to merge conflicts. Please resolve conflicts manually or reinstall the skill.'
      )
    }

    // Handle authentication errors
    if (
      errorMessage.includes('Authentication failed') ||
      errorMessage.includes('Permission denied')
    ) {
      throw new GitAuthError(
        'Authentication required. Please ensure you have access to this repository.'
      )
    }

    throw error
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
