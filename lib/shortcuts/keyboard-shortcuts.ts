export const SHORTCUTS = {
  SAVE: 'Cmd+S / Ctrl+S',
  SEARCH: 'Cmd+K / Ctrl+K',
  NEW_SKILL: 'Cmd+N / Ctrl+N',
  CLOSE: 'Escape',
  NAVIGATE_CONFIGS: 'Alt+1',
  NAVIGATE_SKILLS: 'Alt+2',
  NAVIGATE_PLUGINS: 'Alt+3',
  NAVIGATE_MCP: 'Alt+4',
} as const

export type ShortcutKey = keyof typeof SHORTCUTS

export function getShortcutKey(key: ShortcutKey): string {
  return SHORTCUTS[key]
}

export function formatShortcut(shortcut: string): string {
  // Format shortcut for display based on platform
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

  if (isMac) {
    return shortcut.split('/')[0].trim()
  } else {
    return shortcut.split('/')[1]?.trim() || shortcut.split('/')[0].trim()
  }
}

