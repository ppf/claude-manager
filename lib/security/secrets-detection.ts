/**
 * Patterns for detecting potential API keys and secrets in configuration
 */
const SECRETS_PATTERNS = [
  // API keys
  { pattern: /\b[A-Za-z0-9]{20,}\b/g, label: 'Possible API Key' },
  { pattern: /\bapi[-_]?key\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi, label: 'API Key' },
  { pattern: /\bsecret[-_]?key\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi, label: 'Secret Key' },
  { pattern: /\baccess[-_]?token\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi, label: 'Access Token' },

  // AWS
  { pattern: /\b(AKIA[0-9A-Z]{16})\b/g, label: 'AWS Access Key' },
  { pattern: /\b[A-Za-z0-9/+=]{40}\b/g, label: 'AWS Secret Key' },

  // GitHub
  { pattern: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g, label: 'GitHub Token' },

  // Generic tokens
  { pattern: /\btoken\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi, label: 'Token' },
  { pattern: /\bpassword\s*[:=]\s*["']?([^\s"']{8,})["']?/gi, label: 'Password' },

  // JWT
  { pattern: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, label: 'JWT Token' },

  // Private keys
  { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, label: 'Private Key' },
]

/**
 * Common environment variable names that likely contain secrets
 */
const SECRET_ENV_NAMES = new Set([
  'api_key',
  'apikey',
  'secret',
  'secret_key',
  'secretkey',
  'password',
  'passwd',
  'token',
  'access_token',
  'accesstoken',
  'auth_token',
  'authtoken',
  'private_key',
  'privatekey',
  'credentials',
  'aws_access_key_id',
  'aws_secret_access_key',
  'github_token',
  'gitlab_token',
  'stripe_key',
  'stripe_secret',
  'openai_api_key',
  'anthropic_api_key',
])

export interface SecretDetection {
  type: string
  value: string
  label: string
  position?: { start: number; end: number }
}

/**
 * Detect potential secrets in a string
 * @param text Text to analyze
 * @param strict If true, use stricter detection (fewer false positives)
 * @returns Array of detected secrets
 */
export function detectSecrets(text: string, strict: boolean = false): SecretDetection[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const detections: SecretDetection[] = []
  const seen = new Set<string>()

  for (const { pattern, label } of SECRETS_PATTERNS) {
    const matches = text.matchAll(pattern)

    for (const match of matches) {
      const value = match[1] || match[0]
      const key = `${label}:${value}`

      // Skip if already detected
      if (seen.has(key)) continue

      // In strict mode, skip generic patterns that might have false positives
      if (strict && label === 'Possible API Key' && value.length < 32) {
        continue
      }

      seen.add(key)
      detections.push({
        type: label.toLowerCase().replace(/\s+/g, '_'),
        value,
        label,
        position: {
          start: match.index!,
          end: match.index! + match[0].length,
        },
      })
    }
  }

  return detections
}

/**
 * Check if an environment variable name suggests it contains a secret
 * @param name Environment variable name
 * @returns true if the name suggests a secret
 */
export function isSecretEnvName(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[-_]/g, '')

  // Check exact matches
  if (SECRET_ENV_NAMES.has(normalized)) {
    return true
  }

  // Check if it contains any secret-related keywords
  return Array.from(SECRET_ENV_NAMES).some(keyword =>
    normalized.includes(keyword.replace(/[-_]/g, ''))
  )
}

/**
 * Analyze environment variables object for secrets
 * @param env Environment variables object
 * @param strict Use strict detection
 * @returns Detections grouped by environment variable name
 */
export function detectSecretsInEnv(
  env: Record<string, string>,
  strict: boolean = false
): Record<string, SecretDetection[]> {
  const result: Record<string, SecretDetection[]> = {}

  for (const [name, value] of Object.entries(env)) {
    // Check if the env name itself suggests a secret
    const nameIsSecret = isSecretEnvName(name)

    // Detect patterns in the value
    const valueSecrets = detectSecrets(value, strict)

    if (nameIsSecret || valueSecrets.length > 0) {
      result[name] = valueSecrets.length > 0
        ? valueSecrets
        : [{ type: 'secret_env_name', value, label: 'Possible Secret (by name)' }]
    }
  }

  return result
}

/**
 * Mask a secret value for display
 * @param value Secret value
 * @param showLength Number of characters to show at start/end
 * @returns Masked value
 */
export function maskSecret(value: string, showLength: number = 4): string {
  if (value.length <= showLength * 2) {
    return '*'.repeat(value.length)
  }

  const start = value.slice(0, showLength)
  const end = value.slice(-showLength)
  const maskedLength = value.length - (showLength * 2)

  return `${start}${'*'.repeat(maskedLength)}${end}`
}
