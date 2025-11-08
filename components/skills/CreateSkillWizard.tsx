'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)

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
    } catch {
      toast.error('Failed to create skill')
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
              <Select
                value={skillData.category}
                onValueChange={(value) => setSkillData({ ...skillData, category: value })}
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
