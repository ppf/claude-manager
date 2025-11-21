'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { detectSecretsInEnv, maskSecret, type SecretDetection } from '@/lib/security/secrets-detection'
import { Button } from '@/components/ui/button'

interface SecretsWarningProps {
  env: Record<string, string>
  className?: string
}

export function SecretsWarning({ env, className }: SecretsWarningProps) {
  const [showValues, setShowValues] = useState(false)
  const detections = detectSecretsInEnv(env, true)

  if (Object.keys(detections).length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Potential Secrets Detected
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowValues(!showValues)}
          className="h-6 px-2 text-xs"
        >
          {showValues ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show
            </>
          )}
        </Button>
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          We detected potential API keys or secrets in your configuration. Consider using environment
          variables or a secrets manager instead of hardcoding credentials.
        </p>

        <div className="space-y-2 mt-3">
          {Object.entries(detections).map(([envName, secrets]) => (
            <div key={envName} className="text-sm">
              <div className="font-mono font-semibold mb-1">{envName}</div>
              <div className="flex flex-wrap gap-1">
                {secrets.map((secret, index) => (
                  <Badge key={index} variant="outline" className="font-mono text-xs">
                    {secret.label}
                    {showValues ? `: ${secret.value}` : `: ${maskSecret(secret.value)}`}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs opacity-90">
          <p className="font-semibold mb-1">Recommendations:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Use environment variables instead of hardcoded values</li>
            <li>Store secrets in a secure secrets manager</li>
            <li>Never commit secrets to version control</li>
            <li>Rotate credentials if accidentally exposed</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  )
}
