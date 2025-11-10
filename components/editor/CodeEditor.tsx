'use client'

import { useEffect, useRef, useState } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useDebounce } from '@/hooks/useDebounce'
import { useLoadingState } from '@/hooks/useLoadingState'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
  const { showLoading: showSaving, startLoading, stopLoading } = useLoadingState()
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
      startLoading()
      await api.post(`/api/configs/${filePath}`, { content: contentToSave })
      toast.success('File saved')
      onSave?.(contentToSave)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save file'
      toast.error(message)
      console.error('Save error:', error)
    } finally {
      stopLoading()
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

      {showSaving && (
        <div className="absolute top-2 right-2 bg-background/80 px-3 py-1 rounded-md text-sm flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  )
}
