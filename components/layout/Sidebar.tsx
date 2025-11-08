'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Puzzle, Package, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search/SearchBar'

const navigation = [
  { name: 'Configs', href: '/configs', icon: FileText },
  { name: 'Skills', href: '/skills', icon: Puzzle },
  { name: 'Plugins', href: '/plugins', icon: Package },
  { name: 'MCP Servers', href: '/mcp', icon: Server },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-2 p-4 border-r bg-muted/40 h-screen w-64">
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-3">Claude Manager</h1>
        <SearchBar />
      </div>

      <nav className="flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
