'use client'

import { useEffect, useState } from 'react'
import { FileTreeNode } from './FileTreeNode'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileTreeNode as FileTreeNodeType } from '@/types/claude-config'

interface FileTreeProps {
  onFileSelect: (path: string) => void
}

export function FileTree({ onFileSelect }: FileTreeProps) {
  const [tree, setTree] = useState<FileTreeNodeType[]>([])
  const [selectedPath, setSelectedPath] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTree()
  }, [])

  async function fetchTree() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/configs')
      const result = await response.json()

      if (result.success) {
        setTree(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch file tree:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (path: string) => {
    setSelectedPath(path)
    onFileSelect(path)
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
