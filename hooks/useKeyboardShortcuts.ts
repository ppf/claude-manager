import { useEffect, useCallback } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

export function useKeyboardShortcut(shortcut: KeyboardShortcut) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey
      const matchesMeta = shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey
      const matchesAlt = shortcut.altKey === undefined || e.altKey === shortcut.altKey
      const matchesShift = shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey

      if (matchesKey && matchesCtrl && matchesMeta && matchesAlt && matchesShift) {
        e.preventDefault()
        shortcut.handler(e)
      }
    },
    [shortcut]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const matchesCtrl = shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey
        const matchesMeta = shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey
        const matchesAlt = shortcut.altKey === undefined || e.altKey === shortcut.altKey
        const matchesShift = shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey

        if (matchesKey && matchesCtrl && matchesMeta && matchesAlt && matchesShift) {
          e.preventDefault()
          shortcut.handler(e)
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Common keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SAVE: { key: 's', ctrlKey: true, metaKey: true, description: 'Save' },
  SEARCH: { key: 'k', ctrlKey: true, metaKey: true, description: 'Search' },
  NEW_SKILL: { key: 'n', ctrlKey: true, metaKey: true, description: 'New skill' },
  CLOSE: { key: 'Escape', description: 'Close dialog' },
  NAV_CONFIGS: { key: '1', altKey: true, description: 'Navigate to configs' },
  NAV_SKILLS: { key: '2', altKey: true, description: 'Navigate to skills' },
  NAV_PLUGINS: { key: '3', altKey: true, description: 'Navigate to plugins' },
  NAV_MCP: { key: '4', altKey: true, description: 'Navigate to MCP' },
} as const

