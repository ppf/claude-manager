'use client'

import { useEffect, useRef, useState } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

interface CodeEditorProps {
  filePath: string
  initialContent: string
  language: string
  onSave?: (content: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
}

export function CodeEditor({
  filePath,
  initialContent,
  language,
  onSave,
  autoSave = true,
  autoSaveDelay = 2000,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const debouncedContent = useDebounce(content, autoSaveDelay)

  // Auto-save when content changes (debounced)
  useEffect(() => {
    if (autoSave && debouncedContent !== initialContent && debouncedContent) {
      handleSave(debouncedContent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, autoSave])

  async function handleSave(contentToSave: string) {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/configs/${filePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSave }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('File saved')
        onSave?.(contentToSave)
      } else {
        toast.error(result.error?.message || 'Failed to save file')
      }
    } catch (error) {
      toast.error('Failed to save file')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor

    // Add Cmd/Ctrl+S to manually save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave(editor.getValue())
    })
  }

  return (
    <div className="h-full relative">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={(value) => setContent(value || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          rulers: [80, 120],
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
        }}
      />

      {isSaving && (
        <div className="absolute top-2 right-2 bg-background/80 px-3 py-1 rounded-md text-sm">
          Saving...
        </div>
      )}
    </div>
  )
}
