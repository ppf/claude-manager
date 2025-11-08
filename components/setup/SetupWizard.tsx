'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { SetupStatus } from '@/lib/claude/setup-checker'

export function SetupWizard() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    checkSetup()
  }, [])

  async function checkSetup() {
    const response = await fetch('/api/setup/check')
    const result = await response.json()

    if (result.success) {
      setStatus(result.data)
      if (result.data.needsInitialization) {
        setOpen(true)
      }
    }
  }

  async function handleInitialize() {
    setIsInitializing(true)
    const response = await fetch('/api/setup/initialize', { method: 'POST' })
    const result = await response.json()

    if (result.success) {
      await checkSetup()
      setOpen(false)
    }
    setIsInitializing(false)
  }

  if (!status || !status.needsInitialization) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Required</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Claude Code Manager needs to set up your environment.</AlertDescription>
        </Alert>
        <Button onClick={handleInitialize} disabled={isInitializing} className="w-full">
          {isInitializing ? 'Initializing...' : 'Initialize Environment'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
