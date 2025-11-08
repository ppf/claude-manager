# Contributing to Claude Code Manager

Thank you for your interest in contributing to Claude Code Manager! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+ or Node.js 20+
- pnpm (recommended) or npm
- Git
- VS Code (recommended)

### Initial Setup

1. **Fork and clone the repository**:
```bash
git clone https://github.com/your-username/claude-manager.git
cd claude-manager
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment**:
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

4. **Start development server**:
```bash
pnpm dev
```

5. **Run tests**:
```bash
pnpm test
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new files
- Enable strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Use type for unions and intersections

```typescript
// Good
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): User {
  // ...
}

// Avoid
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use meaningful component names (PascalCase)
- Extract complex logic into custom hooks
- Use TypeScript for props

```typescript
// Good
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {children}
    </button>
  )
}
```

### File Organization

- One component per file
- Co-locate related files
- Use index.ts for exports
- Keep components small and focused

```
components/
├── search/
│   ├── SearchBar.tsx          # Main component
│   ├── SearchResults.tsx      # Sub-component
│   └── useSearch.ts           # Custom hook
```

### Naming Conventions

- **Components**: PascalCase (`SearchBar.tsx`)
- **Hooks**: camelCase with "use" prefix (`useDebounce.ts`)
- **Utilities**: camelCase (`sanitizePath.ts`)
- **Types**: PascalCase (`ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Code Formatting

We use Prettier for code formatting:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### Linting

We use ESLint for code quality:

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

## Testing Requirements

### Test Coverage

- Aim for 70%+ overall coverage
- Critical paths: 90%+ coverage
- API routes: 80%+ coverage
- Components: 60%+ coverage

### Writing Tests

1. **Unit Tests** (`tests/unit/`):
```typescript
import { describe, it, expect } from 'vitest'
import { sanitizePath } from '@/lib/claude/paths'

describe('sanitizePath', () => {
  it('should prevent path traversal', () => {
    expect(() => sanitizePath('../../../etc/passwd')).toThrow()
  })

  it('should allow valid paths', () => {
    expect(sanitizePath('CLAUDE.md')).toBeTruthy()
  })
})
```

2. **Component Tests** (`tests/components/`):
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

it('should handle click events', () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  
  fireEvent.click(screen.getByText('Click me'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

3. **Integration Tests** (`tests/integration/`):
```typescript
import { GET } from '@/app/api/search/route'
import { NextRequest } from 'next/server'

it('should search documents', async () => {
  const request = new NextRequest('http://localhost:3000/api/search?q=test')
  const response = await GET(request)
  const data = await response.json()
  
  expect(data.success).toBe(true)
})
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(search): add full-text search with FTS5

Implement SQLite FTS5-powered search across all resources.
Includes indexing, querying, and incremental updates.

Closes #123
```

```bash
fix(editor): prevent auto-save on initial load

Auto-save was triggering immediately after loading a file,
causing unnecessary API calls.
```

```bash
docs(readme): update installation instructions

Add pnpm as recommended package manager and update
environment variable documentation.
```

## Pull Request Process

1. **Create a feature branch**:
```bash
git checkout -b feat/your-feature-name
```

2. **Make your changes**:
   - Write code following style guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Run checks locally**:
```bash
pnpm lint
pnpm type-check
pnpm test
pnpm format:check
```

4. **Commit your changes**:
```bash
git add .
git commit -m "feat: add your feature"
```

5. **Push to your fork**:
```bash
git push origin feat/your-feature-name
```

6. **Create Pull Request**:
   - Use a clear title and description
   - Link related issues
   - Add screenshots for UI changes
   - Ensure CI passes

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No linter errors or warnings
- [ ] Type checking passes
- [ ] PR description is clear and complete

## Architecture Guidelines

### API Routes

- Use Next.js App Router API routes
- Return standardized responses
- Handle errors gracefully
- Validate inputs with Zod

```typescript
import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return successResponse(data)
  } catch (error) {
    return errorResponse({
      type: 'unknown',
      message: 'Failed to fetch data',
      recoverable: true,
    })
  }
}
```

### Error Handling

- Use try/catch blocks
- Display user-friendly messages
- Log errors for debugging
- Provide recovery options

```typescript
try {
  await dangerousOperation()
} catch (error) {
  const message = error instanceof Error ? error.message : 'Operation failed'
  toast.error(message)
  console.error('Operation error:', error)
}
```

### State Management

- Use React hooks for local state
- Use context for shared state
- Keep state close to where it's used
- Avoid prop drilling

### Performance

- Lazy load heavy components
- Debounce user input
- Use React.memo for expensive renders
- Optimize images and assets
- Implement virtual scrolling for long lists

## Documentation

### Code Comments

- Document complex logic
- Explain "why" not "what"
- Use JSDoc for functions
- Keep comments up-to-date

```typescript
/**
 * Create a backup of a file before destructive operations
 * 
 * @param filePath - Path to the file to backup
 * @param content - File content to backup
 * @returns Backup metadata including ID and timestamp
 * @throws {Error} If backup directory cannot be created
 */
export async function createBackup(filePath: string, content: string): Promise<Backup> {
  // Implementation
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing setup process
- Updating dependencies
- Adding environment variables

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Reach out to maintainers for major changes

Thank you for contributing! 🎉

