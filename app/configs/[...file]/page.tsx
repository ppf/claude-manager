'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { ConfigFile } from '@/types/claude-config'

export default function FileEditorPage() {
  const params = useParams()
  const router = useRouter()
  const filePath = Array.isArray(params.file) ? params.file.join('/') : params.file

  const [file, setFile] = useState<ConfigFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath])

  async function fetchFile() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/configs/${filePath}`)
      const result = await response.json()

      if (result.success) {
        setFile(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!file) {
    return <div className="p-4">File not found</div>
  }

  const language =
    file.type === 'markdown'
      ? 'markdown'
      : file.type === 'json'
        ? 'json'
        : file.type === 'yaml'
          ? 'yaml'
          : 'plaintext'

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.push('/configs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="font-semibold">{file.name}</h2>
          <p className="text-sm text-muted-foreground">{filePath}</p>
        </div>
      </div>

      <div className="flex-1">
        <CodeEditor
          filePath={filePath}
          initialContent={file.content}
          language={language}
          autoSave={true}
          autoSaveDelay={2000}
        />
      </div>
    </div>
  )
}
