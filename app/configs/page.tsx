'use client'

import { useRouter } from 'next/navigation'
import { FileTree } from '@/components/file-tree/FileTree'

export default function ConfigsPage() {
  const router = useRouter()

  const handleFileSelect = (path: string) => {
    // Navigate to editor page
    router.push(`/configs/${path}`)
  }

  return (
    <div className="flex h-full">
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Config Files</h2>
        </div>
        <FileTree onFileSelect={handleFileSelect} />
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a file to edit
        </div>
      </div>
    </div>
  )
}
