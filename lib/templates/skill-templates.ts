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
category: {{CATEGORY}}
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
category: {{CATEGORY}}
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
  return skillTemplates.find((t) => t.id === id)
}

export function renderTemplate(
  template: SkillTemplate,
  variables: Record<string, string>
): SkillTemplate {
  const rendered: SkillTemplate = {
    ...template,
    files: {},
  }

  for (const [filename, content] of Object.entries(template.files)) {
    let renderedContent = content
    for (const [key, value] of Object.entries(variables)) {
      renderedContent = renderedContent.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value
      )
    }
    rendered.files[filename] = renderedContent
  }

  return rendered
}
