import chokidar, { type FSWatcher } from 'chokidar'
import { CLAUDE_HOME } from '@/lib/claude/paths'
import { EventEmitter } from 'events'

export type FileChangeEvent = {
  type: 'add' | 'change' | 'unlink'
  path: string
  timestamp: number
}

class FileWatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null

  start() {
    if (this.watcher) return

    this.watcher = chokidar.watch(CLAUDE_HOME, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    })

    this.watcher
      .on('add', (path: string) =>
        this.emit('change', { type: 'add', path, timestamp: Date.now() })
      )
      .on('change', (path: string) =>
        this.emit('change', { type: 'change', path, timestamp: Date.now() })
      )
      .on('unlink', (path: string) =>
        this.emit('change', { type: 'unlink', path, timestamp: Date.now() })
      )
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}

export const fileWatcher = new FileWatcherService()
