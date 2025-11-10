'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FileTreeNode as FileTreeNodeType } from '@/types/claude-config'

interface FileTreeNodeProps {
  node: FileTreeNodeType
  level: number
  selectedPath?: string
  onSelect: (path: string) => void
}

export function FileTreeNode({ node, level, selectedPath, onSelect }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const isSelected = selectedPath === node.path
  const isDirectory = node.type === 'directory'

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleClick = () => {
    if (isDirectory) {
      // For directories, toggle expansion instead of selecting
      setIsExpanded(!isExpanded)
    } else {
      // For files, call onSelect to navigate to editor
      onSelect(node.path)
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory && (
          <span className="flex-shrink-0" onClick={handleToggle}>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!isDirectory && <span className="w-4" />}

        <span className="flex-shrink-0" onClick={isDirectory ? handleToggle : undefined}>
          {isDirectory ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
        </span>

        <span className="text-sm truncate">{node.name}</span>
      </div>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
