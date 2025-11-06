# Phase 2.2: Skills Editor (Detailed Specification)

**Duration**: 2-3 days
**Branch**: `phase-2.2-skills-editor`
**Status**: 🔴 Not Started
**Prerequisites**: Phase 2.1 completed

---

## 📊 Phase Status

| Task | Status | Started | Completed |
|------|--------|---------|-----------|
| 2.2.1 Skill Template Schema | 🔴 Not Started | - | - |
| 2.2.2 Skill Creation Wizard | 🔴 Not Started | - | - |
| 2.2.3 Skill Metadata Editor | 🔴 Not Started | - | - |
| 2.2.4 Multi-file Skill Support | 🔴 Not Started | - | - |
| 2.2.5 Skill Validation & Testing | 🔴 Not Started | - | - |

---

## 🎯 Phase Goal

Enable users to create and edit custom skills with:
- Template-based skill creation
- Visual metadata editor
- Multi-file skill editing
- Real-time validation
- Skill testing (optional)

**Success Criteria**:
✅ Can create new skill from template
✅ Can edit skill metadata (name, description, tags)
✅ Can edit SKILL.md with Monaco
✅ Can add/edit supporting files
✅ Validation shows errors clearly
✅ Changes persist correctly

---

## 📋 Task 2.2.1: Define Skill Template Schema

**Goal**: Create skill templates and validation schemas

### Skill Frontmatter Schema

**File**: `lib/validators/skill-schema.ts`

```typescript
import { z } from 'zod'

export const skillMetadataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format (use semver)').optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  category: z.enum(['productivity', 'development', 'writing', 'research', 'other']).default('other'),
  dependencies: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  homepage: z.string().url('Invalid URL').optional(),
  repository: z.string().url('Invalid repository URL').optional(),
  license: z.string().default('MIT'),
})

export type SkillMetadata = z.infer<typeof skillMetadataSchema>

export const skillFileSchema = z.object({
  metadata: skillMetadataSchema,
  content: z.string().min(1, 'Skill content cannot be empty'),
})

export function validateSkillFile(content: string): {
  valid: boolean
  metadata?: SkillMetadata
  errors?: Array<{ field: string; message: string }>
} {
  try {
    const matter = require('gray-matter')
    const { data, content: skillContent } = matter(content)
    
    const result = skillMetadataSchema.safeParse(data)
    
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }
    }
    
    if (skillContent.trim().length === 0) {
      return {
        valid: false,
        errors: [{ field: 'content', message: 'Skill content cannot be empty' }],
      }
    }
    
    return {
      valid: true,
      metadata: result.data,
    }
  } catch (error) {
    return {
      valid: false,
      errors: [{ field: 'parse', message: 'Failed to parse skill file' }],
    }
  }
}
```

### Skill Templates

**File**: `lib/templates/skill-templates.ts`

```typescript
export interface SkillTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  files: {
    [filename: string]: string
  }
}

export const skillTemplates: SkillTemplate[] = [
  {
    id: 'basic-skill',
    name: 'Basic Skill',
    description: 'Simple single-file skill template',
    category: 'general',
    difficulty: 'beginner',
    files: {
      'SKILL.md': `---
name: {{NAME}}
description: {{DESCRIPTION}}
version: 1.0.0
author: {{AUTHOR}}
tags: []
enabled: true
category: other
---

# {{NAME}}

## Description

{{DESCRIPTION}}

## Usage

Describe how to use this skill.

## Examples

Provide examples of this skill in action.

## Notes

Any additional notes or limitations.
`,
      'README.md': `# {{NAME}}

{{DESCRIPTION}}

## Installation

This skill is part of your local Claude Code skills collection.

## Usage

[Usage instructions]

## License

MIT
`,
    },
  },
  
  {
    id: 'advanced-skill',
    name: 'Advanced Skill',
    description: 'Multi-file skill with prompts and examples',
    category: 'general',
    difficulty: 'advanced',
    files: {
      'SKILL.md': `---
name: {{NAME}}
description: {{DESCRIPTION}}
version: 1.0.0
author: {{AUTHOR}}
tags: []
enabled: true
category: other
dependencies: []
---

# {{NAME}}

## Description

{{DESCRIPTION}}

## Prompts

See the \`prompts/\` directory for reusable prompts.

## Examples

See the \`examples/\` directory for usage examples.

## Configuration

[Configuration options if any]

## Advanced Usage

[Advanced features and techniques]
`,
      'README.md': `# {{NAME}}

{{DESCRIPTION}}

## Files

- \`SKILL.md\` - Main skill definition
- \`prompts/\` - Reusable prompt templates
- \`examples/\` - Usage examples
- \`docs/\` - Additional documentation

## Contributing

Contributions welcome! Please follow the guidelines.
`,
      'prompts/example-prompt.md': `# Example Prompt

This is an example prompt template that can be referenced by the skill.

## Variables

- \`{{variable1}}\` - Description
- \`{{variable2}}\` - Description

## Usage

[How to use this prompt]
`,
      'examples/example-usage.md': `# Example Usage

## Scenario

[Describe the scenario]

## Input

[Example input]

## Output

[Expected output]

## Explanation

[Why this works]
`,
    },
  },
  
  {
    id: 'code-review-skill',
    name: 'Code Review Skill',
    description: 'Template for code review and analysis skills',
    category: 'development',
    difficulty: 'intermediate',
    files: {
      'SKILL.md': `---
name: {{NAME}}
description: {{DESCRIPTION}}
version: 1.0.0
author: {{AUTHOR}}
tags: [code-review, development]
enabled: true
category: development
---

# {{NAME}}

## Description

A skill for performing code reviews with focus on: {{DESCRIPTION}}

## Review Checklist

- [ ] Code style and formatting
- [ ] Logic and correctness
- [ ] Performance considerations
- [ ] Security issues
- [ ] Test coverage
- [ ] Documentation

## Review Process

1. **Initial scan**: Quick overview of changes
2. **Detailed review**: Line-by-line analysis
3. **Pattern detection**: Look for anti-patterns
4. **Suggestions**: Provide actionable feedback
5. **Summary**: Overall assessment

## Output Format

Provide review in this format:
- **Summary**: Overall assessment
- **Issues**: List of issues found (with severity)
- **Suggestions**: Improvement recommendations
- **Positive**: What's done well

## Examples

See \`examples/\` for review examples.
`,
      'examples/pull-request-review.md': `# Pull Request Review Example

## Code Snippet

\`\`\`javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
\`\`\`

## Review

**Summary**: Basic implementation works but can be improved.

**Issues**:
- No input validation (items could be null/undefined)
- No handling for invalid prices
- Less readable than functional approach

**Suggestions**:
\`\`\`javascript
function calculateTotal(items = []) {
  return items.reduce((total, item) => {
    const price = parseFloat(item?.price ?? 0);
    return total + price;
  }, 0);
}
\`\`\`

**Positive**:
- Clear function name
- Simple logic easy to understand
`,
    },
  },
]

export function getTemplate(id: string): SkillTemplate | undefined {
  return skillTemplates.find(t => t.id === id)
}

export function renderTemplate(template: SkillTemplate, variables: Record<string, string>): SkillTemplate {
  const rendered: SkillTemplate = {
    ...template,
    files: {},
  }
  
  for (const [filename, content] of Object.entries(template.files)) {
    let renderedContent = content
    for (const [key, value] of Object.entries(variables)) {
      renderedContent = renderedContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    rendered.files[filename] = renderedContent
  }
  
  return rendered
}
```

### API Route: List Templates

**File**: `app/api/skills/templates/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { skillTemplates } from '@/lib/templates/skill-templates'
import { successResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  return successResponse(skillTemplates)
}
```

---

## 📋 Task 2.2.2: Skill Creation Wizard

**Goal**: UI wizard for creating new skills from templates

### Create Wizard Component

**File**: `components/skills/CreateSkillWizard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import type { SkillTemplate } from '@/lib/templates/skill-templates'

interface CreateSkillWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: SkillTemplate[]
}

type Step = 'template' | 'details' | 'confirm'

export function CreateSkillWizard({ open, onOpenChange, templates }: CreateSkillWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [skillData, setSkillData] = useState({
    name: '',
    description: '',
    author: '',
    category: 'other',
  })
  const [isCreating, setIsCreating] = useState(false)

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  async function handleCreate() {
    try {
      setIsCreating(true)

      const response = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          ...skillData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Skill created successfully')
        onOpenChange(false)
        router.push(`/skills/${result.data.id}`)
      } else {
        toast.error(result.error?.message || 'Failed to create skill')
      }
    } catch (error) {
      toast.error('Failed to create skill')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'template' && 'Choose a Template'}
            {step === 'details' && 'Skill Details'}
            {step === 'confirm' && 'Confirm Creation'}
          </DialogTitle>
        </DialogHeader>

        {step === 'template' && (
          <div className="space-y-4">
            <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                >
                  <RadioGroupItem value={template.id} id={template.id} />
                  <div className="flex-1">
                    <Label htmlFor={template.id} className="cursor-pointer">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {template.category}
                        </span>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {template.difficulty}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep('details')} disabled={!selectedTemplate}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                value={skillData.name}
                onChange={(e) => setSkillData({ ...skillData, name: e.target.value })}
                placeholder="My Awesome Skill"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={skillData.description}
                onChange={(e) => setSkillData({ ...skillData, description: e.target.value })}
                placeholder="A brief description of what this skill does..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={skillData.author}
                onChange={(e) => setSkillData({ ...skillData, author: e.target.value })}
                placeholder="Your Name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={skillData.category} onValueChange={(value) => setSkillData({ ...skillData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('template')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!skillData.name || !skillData.description}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedTemplateData && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <span className="font-medium">Template:</span> {selectedTemplateData.name}
              </div>
              <div>
                <span className="font-medium">Name:</span> {skillData.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {skillData.description}
              </div>
              {skillData.author && (
                <div>
                  <span className="font-medium">Author:</span> {skillData.author}
                </div>
              )}
              <div>
                <span className="font-medium">Category:</span> {skillData.category}
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">Files to be created:</div>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {Object.keys(selectedTemplateData.files).map((filename) => (
                  <li key={filename}>{filename}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Skill'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

### API Route: Create Skill

**File**: `app/api/skills/create/route.ts`

```typescript
import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import { getTemplate, renderTemplate } from '@/lib/templates/skill-templates'
import { successResponse, validationError, filesystemError } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, name, description, author, category } = body

    if (!templateId || !name || !description) {
      return validationError('Missing required fields')
    }

    const template = getTemplate(templateId)
    if (!template) {
      return validationError('Invalid template ID')
    }

    // Generate skill ID from name (slug)
    const skillId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const skillPath = path.join(CLAUDE_PATHS.SKILLS, skillId)

    // Check if skill already exists (slug collision detection)
    try {
      await fs.access(skillPath)
      return validationError(
        `A skill with this name already exists (ID: ${skillId}). ` +
        'Please choose a different name or manually rename the existing skill directory.'
      )
    } catch {
      // Skill doesn't exist, continue
    }

    // Render template with variables
    const rendered = renderTemplate(template, {
      NAME: name,
      DESCRIPTION: description,
      AUTHOR: author || 'Unknown',
      CATEGORY: category || 'other',
    })

    // Create skill directory
    await fs.mkdir(skillPath, { recursive: true })

    // Create all files
    for (const [filename, content] of Object.entries(rendered.files)) {
      const filePath = path.join(skillPath, filename)
      const fileDir = path.dirname(filePath)

      // Create subdirectories if needed
      await fs.mkdir(fileDir, { recursive: true })

      // Write file
      await fs.writeFile(filePath, content, 'utf-8')
    }

    return successResponse({
      id: skillId,
      name,
      path: skillPath,
      message: 'Skill created successfully',
    })
  } catch (error) {
    console.error('Error creating skill:', error)
    return filesystemError(
      error instanceof Error ? error.message : 'Failed to create skill'
    )
  }
}
```

### Update Skills Page

**File**: `app/skills/page.tsx` (add button)

```typescript
// Add to existing skills page
import { CreateSkillWizard } from '@/components/skills/CreateSkillWizard'

export default function SkillsPage() {
  const [showWizard, setShowWizard] = useState(false)
  const [templates, setTemplates] = useState([])
  
  useEffect(() => {
    fetchTemplates()
  }, [])
  
  async function fetchTemplates() {
    const response = await fetch('/api/skills/templates')
    const result = await response.json()
    if (result.success) {
      setTemplates(result.data)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Skills</h1>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Skill
        </Button>
      </div>
      
      {/* existing tabs */}
      
      <CreateSkillWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        templates={templates}
      />
    </div>
  )
}
```

---

## 📋 Task 2.2.3: Skill Metadata Editor

**Goal**: Visual editor for skill frontmatter

### Create Metadata Editor Component

**File**: `components/skills/SkillMetadataEditor.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { SkillMetadata } from '@/lib/validators/skill-schema'

interface SkillMetadataEditorProps {
  metadata: SkillMetadata
  onChange: (metadata: SkillMetadata) => void
}

export function SkillMetadataEditor({ metadata, onChange }: SkillMetadataEditorProps) {
  const [newTag, setNewTag] = useState('')

  function handleAddTag() {
    if (newTag && !metadata.tags.includes(newTag)) {
      onChange({
        ...metadata,
        tags: [...metadata.tags, newTag],
      })
      setNewTag('')
    }
  }

  function handleRemoveTag(tag: string) {
    onChange({
      ...metadata,
      tags: metadata.tags.filter(t => t !== tag),
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={metadata.name}
            onChange={(e) => onChange({ ...metadata, name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={metadata.version || ''}
            onChange={(e) => onChange({ ...metadata, version: e.target.value })}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={metadata.description}
          onChange={(e) => onChange({ ...metadata, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={metadata.author || ''}
            onChange={(e) => onChange({ ...metadata, author: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={metadata.category}
            onValueChange={(value) => onChange({ ...metadata, category: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="writing">Writing</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {metadata.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tag..."
          />
          <Button onClick={handleAddTag} variant="outline">
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="enabled">Enabled</Label>
        <Switch
          id="enabled"
          checked={metadata.enabled}
          onCheckedChange={(checked) => onChange({ ...metadata, enabled: checked })}
        />
      </div>
    </div>
  )
}
```

---

## 📋 Task 2.2.4: Multi-file Skill Support

**Goal**: Edit multiple files within a skill

### Create Skill Editor Page

**File**: `app/skills/[id]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Save, Plus } from 'lucide-react'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { SkillMetadataEditor } from '@/components/skills/SkillMetadataEditor'
import { toast } from 'sonner'
import matter from 'gray-matter'
import type { SkillMetadata } from '@/lib/validators/skill-schema'

export default function SkillEditorPage() {
  const params = useParams()
  const skillId = params.id as string

  const [files, setFiles] = useState<string[]>([])
  const [currentFile, setCurrentFile] = useState('SKILL.md')
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [metadata, setMetadata] = useState<SkillMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSkillFiles()
  }, [skillId])

  async function fetchSkillFiles() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skills/${skillId}/files`)
      const result = await response.json()

      if (result.success) {
        setFiles(result.data.files)
        setFileContents(result.data.contents)

        // Parse metadata from SKILL.md
        if (result.data.contents['SKILL.md']) {
          const { data } = matter(result.data.contents['SKILL.md'])
          setMetadata(data as SkillMetadata)
        }
      }
    } catch (error) {
      toast.error('Failed to load skill files')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveMetadata() {
    if (!metadata) return

    try {
      const skillContent = fileContents['SKILL.md']
      const { content } = matter(skillContent)
      const updated = matter.stringify(content, metadata)

      const response = await fetch(`/api/skills/${skillId}/files/SKILL.md`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updated }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Metadata saved')
        setFileContents({ ...fileContents, 'SKILL.md': updated })
        
        // Note: Search index will be automatically updated via file watcher
        // (Phase 1.4 file watching integration with Phase 3.1 search indexing)
      } else {
        toast.error('Failed to save metadata')
      }
    } catch (error) {
      toast.error('Failed to save metadata')
    }
  }

  async function handleSaveFile(filename: string, content: string) {
    try {
      const response = await fetch(`/api/skills/${skillId}/files/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('File saved')
        setFileContents({ ...fileContents, [filename]: content })
      } else {
        toast.error('Failed to save file')
      }
    } catch (error) {
      toast.error('Failed to save file')
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">{metadata?.name || skillId}</h1>
      </div>

      <Tabs defaultValue="metadata" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {files.map((file) => (
              <TabsTrigger key={file} value={file}>
                {file}
              </TabsTrigger>
            ))}
            <Button variant="ghost" size="sm" className="ml-2">
              <Plus className="h-4 w-4" />
            </Button>
          </TabsList>
        </div>

        <TabsContent value="metadata" className="flex-1 p-4">
          {metadata && (
            <div className="max-w-2xl">
              <SkillMetadataEditor metadata={metadata} onChange={setMetadata} />
              <div className="mt-4">
                <Button onClick={handleSaveMetadata}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Metadata
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {files.map((file) => (
          <TabsContent key={file} value={file} className="flex-1">
            <CodeEditor
              filePath={`${skillId}/${file}`}
              initialContent={fileContents[file] || ''}
              language={file.endsWith('.md') ? 'markdown' : 'plaintext'}
              onSave={(content) => handleSaveFile(file, content)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
```

### API Route: Skill Files

**File**: `app/api/skills/[id]/files/route.ts`

```typescript
import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skillPath = path.join(CLAUDE_PATHS.SKILLS, params.id)
    const entries = await fs.readdir(skillPath, { withFileTypes: true })

    const files: string[] = []
    const contents: Record<string, string> = {}

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(entry.name)
        const content = await fs.readFile(
          path.join(skillPath, entry.name),
          'utf-8'
        )
        contents[entry.name] = content
      }
    }

    return successResponse({ files, contents })
  } catch (error) {
    return filesystemError('Failed to read skill files')
  }
}
```

**File**: `app/api/skills/[id]/files/[...file]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; file: string[] } }
) {
  try {
    const filename = params.file.join('/')
    const { content } = await request.json()

    const filePath = path.join(CLAUDE_PATHS.SKILLS, params.id, filename)
    await fs.writeFile(filePath, content, 'utf-8')

    return successResponse({ message: 'File saved' })
  } catch (error) {
    return filesystemError('Failed to save file')
  }
}
```

---

## 📋 Task 2.2.5: Skill Validation & Testing

**Goal**: Validate skill files and show errors

### Add Validation to Editor

**File**: `components/skills/SkillValidator.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { validateSkillFile } from '@/lib/validators/skill-schema'

interface SkillValidatorProps {
  content: string
}

export function SkillValidator({ content }: SkillValidatorProps) {
  const [validation, setValidation] = useState<ReturnType<typeof validateSkillFile>>()

  useEffect(() => {
    const result = validateSkillFile(content)
    setValidation(result)
  }, [content])

  if (!validation) return null

  if (validation.valid) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Valid Skill</AlertTitle>
        <AlertDescription>Skill file is valid and ready to use</AlertDescription>
      </Alert>
    )
  }

  // Validation errors are non-blocking - user can still save
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Warnings</AlertTitle>
      <AlertDescription>
        <p className="mb-2">The following issues were found (you can still save):</p>
        <ul className="list-disc list-inside">
          {validation.errors?.map((error, i) => (
            <li key={i}>
              <strong>{error.field}</strong>: {error.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
```

---

## ✅ Phase 2.2 Completion Checklist

### Functionality
- [ ] Templates system working
- [ ] Wizard creates skills correctly
- [ ] Slug collision detection prevents duplicate IDs
- [ ] Metadata editor saves changes
- [ ] Multi-file editing works
- [ ] Validation shows warnings (non-blocking)
- [ ] All files persist correctly
- [ ] Search index updates automatically after save (via Phase 1.4 watcher)

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] All validation schemas working
- [ ] Error handling comprehensive
- [ ] No data loss scenarios

### Testing
- [ ] Test skill creation from each template
- [ ] Test metadata editing
- [ ] Test multi-file editing
- [ ] Test validation with invalid data
- [ ] Test file persistence

---

## 📝 Commit

```bash
git add .
git commit -m "phase-2.2: Implement skill editor and creation wizard

- Create skill templates system with 3 templates
- Build skill creation wizard (3-step process)
- Add skill metadata editor with validation
- Implement multi-file skill editing
- Add skill validation with error display
- Support for tags, categories, and all metadata fields"

git push -u origin phase-2.2-skills-editor
```

---

**Next**: [Phase 2.3 - Plugins Manager](./phase-2.3-plugins-detailed.md)
