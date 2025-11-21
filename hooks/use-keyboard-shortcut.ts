import { useEffect, useRef } from 'react'

export interface KeyboardShortcutOptions {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  preventDefault?: boolean
  enabled?: boolean
}

/**
 * Hook to register keyboard shortcuts
 * @param callback Function to call when shortcut is pressed
 * @param options Shortcut configuration
 *
 * @example
 * // Cmd+S (Mac) / Ctrl+S (Windows)
 * useKeyboardShortcut(() => handleSave(), {
 *   key: 's',
 *   metaKey: true,
 *   ctrlKey: true,
 *   preventDefault: true
 * })
 *
 * @example
 * // Escape key
 * useKeyboardShortcut(() => handleClose(), {
 *   key: 'Escape',
 *   preventDefault: true
 * })
 */
export function useKeyboardShortcut(
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const {
      key,
      ctrlKey = false,
      metaKey = false,
      shiftKey = false,
      altKey = false,
      preventDefault = true,
      enabled = true,
    } = options

    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      // Check if key matches (case-insensitive)
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()

      // Check modifier keys
      // For save shortcuts, accept either Cmd (Mac) or Ctrl (Windows/Linux)
      const modifiersMatch =
        (metaKey && ctrlKey ? event.metaKey || event.ctrlKey : true) &&
        (metaKey && !ctrlKey ? event.metaKey : true) &&
        (ctrlKey && !metaKey ? event.ctrlKey : true) &&
        (!metaKey && !ctrlKey ? !event.metaKey && !event.ctrlKey : true) &&
        (shiftKey ? event.shiftKey : !event.shiftKey) &&
        (altKey ? event.altKey : !event.altKey)

      if (keyMatches && modifiersMatch) {
        if (preventDefault) {
          event.preventDefault()
        }
        callbackRef.current(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [options])
}
