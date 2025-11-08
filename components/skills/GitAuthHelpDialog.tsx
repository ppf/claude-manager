'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GitAuthHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GitAuthHelpDialog({
  open,
  onOpenChange,
}: GitAuthHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Git Authentication Setup</DialogTitle>
          <DialogDescription>
            Configure git credentials to access private repositories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Private repositories require authentication. Choose one of the
              methods below:
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Option 1: SSH Keys (Recommended)</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Generate SSH key: <code className="bg-muted px-1 py-0.5 rounded">ssh-keygen -t ed25519 -C &quot;your_email@example.com&quot;</code></li>
                <li>Add to SSH agent: <code className="bg-muted px-1 py-0.5 rounded">ssh-add ~/.ssh/id_ed25519</code></li>
                <li>Copy public key: <code className="bg-muted px-1 py-0.5 rounded">cat ~/.ssh/id_ed25519.pub</code></li>
                <li>Add to GitHub: Settings → SSH and GPG keys → New SSH key</li>
                <li>Use SSH URLs: <code className="bg-muted px-1 py-0.5 rounded">git@github.com:user/repo.git</code></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Option 2: Personal Access Token</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>GitHub: Settings → Developer settings → Personal access tokens</li>
                <li>Generate new token with &apos;repo&apos; scope</li>
                <li>Store token securely</li>
                <li>Use HTTPS URLs with token: <code className="bg-muted px-1 py-0.5 rounded">https://TOKEN@github.com/user/repo.git</code></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Option 3: Git Credential Helper</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Configure credential helper: <code className="bg-muted px-1 py-0.5 rounded">git config --global credential.helper store</code></li>
                <li>First clone will prompt for credentials</li>
                <li>Credentials stored for future use</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Troubleshooting</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Verify SSH connection: <code className="bg-muted px-1 py-0.5 rounded">ssh -T git@github.com</code></li>
                <li>Check git config: <code className="bg-muted px-1 py-0.5 rounded">git config --list</code></li>
                <li>Clear credentials: <code className="bg-muted px-1 py-0.5 rounded">git credential-osxkeychain erase</code> (macOS)</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
