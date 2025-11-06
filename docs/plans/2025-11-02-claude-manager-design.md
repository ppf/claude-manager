# Claude Code Manager - Design Document

**Date**: 2025-11-02
**Status**: Approved
**Timeline**: 9-11 weeks (revised after gap analysis)

---

## Executive Summary

A Next.js full-stack web application for managing Claude Code configurations, skills, plugins, and MCP servers. Provides a modern web-based GUI for editing config files, browsing/installing skills and plugins, configuring MCP servers, and searching across all resources.

**Key Decisions**:
- **Interface**: Web-based GUI (browser)
- **Deployment**: Local-only (localhost)
- **Integration**: Deep integration with Claude Code CLI
- **Stack**: TypeScript + Next.js 14+ (App Router)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────┐
│           Next.js Full-Stack App            │
│            (TypeScript, React)              │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend (React Components)                │
│  ├─ Config File Editor (Monaco Editor)     │
│  ├─ Skills/Plugins Browser                 │
│  ├─ MCP Server Manager                     │
│  └─ Search & Organization UI               │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Backend (Next.js API Routes)               │
│  ├─ File System API (~/.claude/)           │
│  ├─ Claude Code CLI Bridge                 │
│  ├─ Git Operations (skills/plugins)        │
│  └─ Search Index (SQLite/in-memory)        │
│                                             │
├─────────────────────────────────────────────┤
│           Data Layer                        │
│  ├─ Local Files (~/.claude/*)              │
│  ├─ Skills Cache (git repos)               │
│  ├─ Plugins Cache (marketplace data)       │
│  └─ Search Index DB                        │
└─────────────────────────────────────────────┘
         ↕                ↕
    Claude Code      File System
    CLI Commands    (~/.claude/)
```

### Architecture Principles

- **Server Components**: Use Next.js server components for filesystem access
- **File-based Persistence**: Direct read/write to `~/.claude/` (no separate database for configs)
- **CLI Integration**: Spawn child processes to run `claude` commands for validation/testing
- **Search Index**: SQLite for fast full-text search without re-parsing files
- **Real-time Updates**: Monitor filesystem changes for external edits

---

## 2. Tech Stack

### Framework & Language
- **Next.js**: 14+ (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js 18+

### Frontend
- **React**: 18+ (UI framework)
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library (copy-paste, customizable)
- **Monaco Editor**: Code editing (VS Code editor)
- **React Query**: Server state management
- **Zustand**: Client state management

### Backend/API
- **Next.js API Routes**: Server endpoints
- **Node.js fs/promises**: File operations
- **simple-git**: Git operations for skills/plugins
- **child_process**: Claude CLI bridge
- **zod**: Validation schemas

### Data/Search
- **better-sqlite3**: Search index (embedded database)
- **gray-matter**: Frontmatter parsing (Markdown files)
- **fuse.js**: Fuzzy search fallback

### Dev Tools
- **TypeScript**: Type safety
- **ESLint + Prettier**: Code quality
- **Vitest**: Unit testing
- **Playwright**: E2E testing (optional)

### Why This Stack?

| Technology | Justification |
|------------|---------------|
| Next.js 14+ | Server components for filesystem access, API routes for backend logic, no separate server needed |
| Monaco Editor | Same editor as VS Code, excellent syntax highlighting, mature and feature-rich |
| shadcn/ui | Copy-paste components, no package bloat, fully customizable |
| SQLite | Zero-config embedded database, perfect for local search indexing |
| simple-git | Mature Git library for managing skills/plugins repositories |
| TypeScript | Type safety crucial for filesystem operations and API contracts |

---

## 3. Component Architecture

### Frontend Structure

```
app/                              # Next.js App Router (no src/ prefix)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Dashboard/home
│   ├── configs/
│   │   ├── page.tsx            # Config files browser
│   │   └── [file]/page.tsx     # Config editor (Monaco)
│   ├── skills/
│   │   ├── page.tsx            # Skills browser
│   │   ├── marketplace/page.tsx # Marketplace explorer
│   │   └── [skill]/page.tsx    # Skill detail/editor
│   ├── plugins/
│   │   └── page.tsx            # Plugins manager
│   ├── mcp/
│   │   └── page.tsx            # MCP servers config
│   └── api/                     # API Routes
│       ├── configs/route.ts     # CRUD for config files
│       ├── skills/route.ts      # Skills operations
│       ├── plugins/route.ts     # Plugins operations
│       ├── mcp/route.ts         # MCP config
│       ├── search/route.ts      # Search endpoint
│       └── claude-cli/route.ts  # CLI bridge
│
components/
│   ├── ui/                      # shadcn components
│   ├── ConfigEditor.tsx         # Monaco-based editor
│   ├── FileTree.tsx            # Config file browser
│   ├── SkillCard.tsx           # Skill display card
│   ├── PluginManager.tsx       # Plugin list/controls
│   └── SearchBar.tsx           # Global search
│
lib/
│   ├── api.ts                  # API client functions
│   ├── claude-paths.ts         # Path resolution (~/.claude/)
│   ├── git-manager.ts          # Git operations
│   ├── search-index.ts         # SQLite search
│   └── validators.ts           # Zod schemas
│
types/
    └── claude-config.ts         # TypeScript types
```

### Data Flow Example: Edit Config File

```
User edits CLAUDE.md in Monaco Editor
    ↓
Client validates with Zod schema (real-time)
    ↓
POST /api/configs with file path + content
    ↓
Server validates + writes to ~/.claude/CLAUDE.md
    ↓
Server updates search index
    ↓
Server calls `claude --validate-config` (optional validation)
    ↓
Response with success/errors
    ↓
Client updates UI + shows validation feedback
```

---

## 4. Core Features

### 4.1 Config File Management

**Features**:
- File browser with tree view (`~/.claude/`)
- Monaco Editor with:
  - Markdown syntax highlighting
  - Real-time validation (debounced)
  - Auto-save (configurable)
  - Diff view (compare with git history)
- Templates for new config files
- Import/Export configurations

**API Endpoints**:
```typescript
GET    /api/configs              // List all config files
GET    /api/configs/[path]       // Read specific file
POST   /api/configs/[path]       // Create/update file
DELETE /api/configs/[path]       // Delete file (with confirmation)
GET    /api/configs/validate     // Validate all configs
```

**File Structure**:
```
~/.claude/
├── CLAUDE.md
├── FLAGS.md
├── RULES.md
├── PRINCIPLES.md
├── MODE_*.md
├── MAGENTO_DEVELOPMENT.md
├── MAGENTO_TESTING.md
├── MCP_Context7.md
├── SERENA.md
└── ...
```

---

### 4.2 Skills Management

**Features**:
- Browse `~/.claude/skills/` and marketplace repos
- Install from marketplace (git clone)
- Create new skill (template scaffolding)
- Edit skill files (SKILL.md, supporting files)
- Enable/disable skills (modify config)
- Update skills (git pull)
- Uninstall skills (remove directory)

**API Endpoints**:
```typescript
GET    /api/skills              // List all skills (local + marketplace)
POST   /api/skills/install      // Install from marketplace
POST   /api/skills/create       // Create new skill from template
PUT    /api/skills/[id]/toggle  // Enable/disable
PUT    /api/skills/[id]         // Update skill content
DELETE /api/skills/[id]         // Uninstall
GET    /api/skills/marketplace  // Fetch marketplace data
```

**Skill Structure**:
```
~/.claude/skills/
├── custom-skill/
│   ├── SKILL.md
│   └── supporting-files/
└── marketplace-skill/
    └── SKILL.md
```

---

### 4.3 Plugins Management

**Features**:
- List installed plugins (`~/.claude/plugins/`)
- Browse plugin marketplace
- Install/update/remove plugins
- Configure plugin settings
- View plugin documentation
- Enable/disable plugins

**API Endpoints**:
```typescript
GET    /api/plugins             // List all plugins
POST   /api/plugins/install     // Install plugin
PUT    /api/plugins/[id]/config // Update plugin config
PUT    /api/plugins/[id]/toggle // Enable/disable
DELETE /api/plugins/[id]        // Uninstall
GET    /api/plugins/marketplace // Fetch marketplace
```

---

### 4.4 MCP Server Configuration

**Features**:
- List configured MCP servers
- Add/edit/remove server configs
- Test server connection (spawn process, check health)
- View server logs
- Enable/disable servers

**Data Source**: `~/.claude/mcp-servers.json` (or Claude Code config file)

**API Endpoints**:
```typescript
GET    /api/mcp                 // List all MCP servers
POST   /api/mcp                 // Add new server
PUT    /api/mcp/[id]            // Update server config
DELETE /api/mcp/[id]            // Remove server
POST   /api/mcp/[id]/test       // Test connection
GET    /api/mcp/[id]/logs       // View server logs
```

**MCP Server Types**:
- Serena (code intelligence)
- Context7 (documentation)
- Chrome DevTools (browser automation)
- Playwright (E2E testing)
- Custom MCP servers

---

### 4.5 Search & Organization

**Search Features**:
- Full-text search across:
  - Config files content
  - Skill names, descriptions, content
  - Plugin metadata
  - MCP server configurations
- Filters: type (config/skill/plugin), category, tags
- Search results with context snippets
- Recent searches history

**Organization Features**:
- Tag configs/skills (stored in frontmatter)
- Category grouping
- Favorites/bookmarks
- Recent files tracking
- Custom folder organization

**Implementation**:
- SQLite FTS5 for full-text search
- Index built on startup + updated on file changes
- Fuzzy search with fuse.js as fallback
- Debounced search input (300ms)

**API Endpoints**:
```typescript
GET  /api/search?q=query&type=all&limit=20
POST /api/tags                  // Add tag to resource
GET  /api/recent                // Recent files
GET  /api/favorites             // Bookmarked items
```

**Search Index Schema**:
```sql
CREATE VIRTUAL TABLE search_index USING fts5(
  id UNINDEXED,
  type,           -- config/skill/plugin/mcp
  title,
  content,
  path UNINDEXED,
  tags,
  updated_at UNINDEXED
);
```

---

## 5. Error Handling & Validation

### Client-Side Error Handling

```typescript
// React Error Boundaries
- Component crash recovery
- Graceful degradation to read-only mode
- User-friendly error messages

// Toast Notifications
- Success/info/warning/error states
- Auto-dismiss (configurable)
- Action buttons (retry, undo)

// Logging
- Console logging (development)
- Optional file logging (production)
```

### Server-Side Error Handling

```typescript
type ApiError = {
  type: 'validation' | 'filesystem' | 'git' | 'claude-cli' | 'unknown'
  message: string
  details?: Record<string, any>
  recoverable: boolean
}

// Error Categories:
- Validation errors (Zod schema violations)
- File operation errors (permissions, not found, parse errors)
- Git operation errors (merge conflicts, network issues)
- Claude CLI errors (command not found, validation failures)
- Network errors (marketplace unavailable)
```

### Recovery Strategies

```typescript
// Auto-retry
- Transient errors: 3 attempts with exponential backoff
- Network errors: Retry with timeout

// Backup & Rollback
- Backup files before destructive operations
- Undo functionality for file edits
- Git integration for rollback

// Graceful Degradation
- Read-only mode if write permissions fail
- Cached marketplace data if network unavailable
- Local search if index unavailable
```

### Validation

```typescript
// Zod Schemas
- Config file structure validation
- API request/response validation
- File path sanitization (prevent path traversal)

// Claude CLI Validation
- Optional: Run `claude --validate-config` after edits
- Parse CLI output for errors
- Display validation results to user
```

---

## 6. Security Considerations

### Local-Only Deployment

```typescript
// Security Model:
- No authentication needed (localhost only)
- File system access restricted to ~/.claude/
- No external API calls (except git/marketplace)
- Input sanitization (prevent path traversal)
- CSP headers (Content Security Policy)
- Search index excludes sensitive fields (passwords, tokens, API keys)

// Path Sanitization:
const sanitizePath = (userPath: string): string => {
  const resolved = path.resolve(CLAUDE_HOME, userPath)
  if (!resolved.startsWith(CLAUDE_HOME)) {
    throw new Error('Path traversal attempt')
  }
  return resolved
}

// Search Index Security:
// Do NOT index fields containing:
// - password, token, secret, api_key, private_key
// - Content from .env files or credential files
```

### Future Security (Remote Access)

```typescript
// If remote access added:
- Authentication required (JWT or session-based)
- HTTPS only (TLS certificates)
- CSRF protection
- Rate limiting
- IP whitelisting (optional)
```

---

## 7. Testing Strategy

### Unit Tests (Vitest)

```typescript
// Test Coverage:
- API route handlers (all endpoints)
- Validation schemas (Zod)
- Path resolution logic
- Search index operations
- Git manager functions

// Target: 70%+ coverage
```

### Integration Tests

```typescript
// Test Scenarios:
- File CRUD operations (read, write, delete)
- Git operations (clone, pull, commit)
- Claude CLI bridge (spawn, parse output)
- Search functionality (index, query)
- Multi-step workflows
```

### E2E Tests (Optional - Playwright)

```typescript
// User Workflows:
- Complete config editing flow
- Skill installation flow
- Plugin management flow
- Search and navigation
- Error handling scenarios

// Local HTTPS Testing (*.local domains):
// Playwright config for SSL certificate bypass:
const context = await browser.newContext({
  ignoreHTTPSErrors: true,  // Ignore SSL warnings for *.local
})

// Chrome DevTools flags for local HTTPS:
// --ignore-certificate-errors
// --ignore-ssl-errors
// --allow-running-insecure-content
```

---

## 8. Development Workflow

### Setup

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev                    # localhost:3000

# Production build
pnpm build
pnpm start

# Testing
pnpm test                   # Unit tests
pnpm test:e2e              # E2E tests
pnpm test:coverage         # Coverage report
```

### Development Tools

```typescript
// Hot Reload
- Instant feedback on code changes
- Server and client hot reload

// Type Checking
- TypeScript strict mode enabled
- Run `pnpm type-check` before commit

// Linting & Formatting
- ESLint + Prettier on save
- Pre-commit hooks (Husky)
- Enforced code style
```

### Environment Variables

```bash
# .env.local
CLAUDE_HOME=~/.claude                    # Override default path to Claude directory
NODE_ENV=development                     # Dev/prod mode
PORT=3000                                # Server port
DATABASE_PATH=./data/search.db           # Search index location

# Marketplace Configuration (Phase 2)
MARKETPLACE_TYPE=github                  # github | api | file
MARKETPLACE_GITHUB_ORG=claude-skills     # GitHub organization for skills
MARKETPLACE_CACHE_TTL=86400              # Cache TTL in seconds (24 hours)

# MCP Configuration (Phase 3)
MCP_CONFIG_PATH=~/.claude/mcp-servers.json  # Override MCP config file location
```

**See `docs/ENV.md` for complete documentation of all environment variables.**

---

## 9. Implementation Phases

### Phase 1 - Core Foundation (Week 1-2)

**Goals**: Basic app structure, file editing working

```yaml
Tasks:
  - ✅ Next.js app setup with TypeScript
  - ✅ Basic UI layout (sidebar navigation)
  - ✅ File browser for ~/.claude/
  - ✅ Monaco Editor integration
  - ✅ Read/write config files API
  - ✅ Basic Zod validation
  - ✅ Error handling (toast notifications)

Deliverables:
  - Can browse and edit config files
  - Changes persist to ~/.claude/
  - Basic error handling working
```

### Phase 2 - Skills & Plugins (Week 3-4)

**Goals**: Skills/plugins management fully functional

```yaml
Tasks:
  - ✅ Skills browser (local + marketplace)
  - ✅ Git operations (clone, pull, push)
  - ✅ Install/uninstall skills
  - ✅ Skill editor (edit SKILL.md)
  - ✅ Plugins manager (list, install, configure)
  - ✅ Enable/disable functionality
  - ✅ Marketplace integration

Deliverables:
  - Can install skills from marketplace
  - Can create and edit custom skills
  - Can manage plugins
  - Enable/disable skills and plugins
```

### Phase 3 - Search & MCP (Week 5-6)

**Goals**: Search and MCP configuration working

```yaml
Tasks:
  - ✅ SQLite search index setup
  - ✅ Full-text search implementation
  - ✅ Search filters and organization
  - ✅ MCP server configuration UI
  - ✅ MCP connection testing
  - ✅ Server logs viewer
  - ✅ Tags and favorites

Deliverables:
  - Fast search across all resources
  - Can configure MCP servers
  - Can test MCP connections
  - Organization features working
```

### Phase 4 - Polish & Testing (Week 7-8)

**Goals**: Production-ready MVP

```yaml
Tasks:
  - ✅ Error handling improvements
  - ✅ Unit tests (70%+ coverage)
  - ✅ Integration tests
  - ✅ E2E tests (critical flows)
  - ✅ Documentation (README, setup guide)
  - ✅ Performance optimization
  - ✅ UX improvements
  - ✅ Bug fixes

Deliverables:
  - Well-tested codebase
  - Good documentation
  - Polished UX
  - Ready for daily use
```

---

## 10. Success Criteria

### MVP Must-Haves

```yaml
Functionality:
  ✅ All config files editable with syntax highlighting
  ✅ Config validation working
  ✅ Skills installable from marketplace
  ✅ Custom skills creatable and editable
  ✅ Plugins manageable with configuration
  ✅ MCP servers configurable and testable
  ✅ Search working across all resources
  ✅ No data loss (backup strategy implemented)

Quality:
  ✅ Test coverage >70%
  ✅ No critical bugs
  ✅ Error handling comprehensive
  ✅ Performance acceptable (<500ms for most operations)

UX:
  ✅ Responsive design (works on laptop screens)
  ✅ Intuitive navigation
  ✅ Clear error messages
  ✅ Fast feedback (loading states, progress indicators)
```

---

## 11. Post-MVP Enhancements

### Future Features

```yaml
Priority 1 (Next Iteration):
  - Backup/restore configurations
  - Configuration templates library
  - Visual diff tool for configs
  - Skill development toolkit (scaffolding, testing)
  - Undo/redo for file operations

Priority 2 (Later):
  - Plugin marketplace curation
  - Analytics/usage tracking
  - Multi-user support (profiles)
  - Import/export full configurations
  - Version control integration (git UI)

Priority 3 (Nice to Have):
  - Remote access (authenticated)
  - Collaborative editing
  - Cloud backup
  - Mobile app (read-only view)
  - VS Code extension integration
```

---

## 12. Risk Assessment

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude CLI API changes | High | Abstract CLI calls, easy to update |
| File system permissions | Medium | Clear error messages, fallback to read-only |
| Git merge conflicts | Medium | Detect conflicts, offer resolution UI |
| Search index corruption | Low | Rebuild index on startup if corrupted |
| Monaco Editor performance | Low | Lazy loading, virtual scrolling for large files |

### Project Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | Medium | Strict MVP definition, phase gates |
| Testing overhead | Low | Start testing early, 70% coverage goal |
| UX complexity | Medium | User testing, iterative refinement |
| Marketplace API changes | Medium | Cache marketplace data, graceful degradation |

---

## 13. Unresolved Questions

1. **Claude CLI validation**: Exact command syntax for config validation?
2. **Marketplace structure**: Official marketplace API or scrape GitHub?
3. **MCP server config format**: Exact file format and location?
4. **Skill templates**: Standard templates for new skills?
5. **Plugin installation**: Use npm/yarn or custom plugin format?
6. **Authentication**: If remote access added, which auth provider?
7. **Backup strategy**: Auto-backup frequency and retention?
8. **File watching**: Use Node.js fs.watch or chokidar?

---

## Appendix: Technology References

### Key Libraries

- **Next.js**: https://nextjs.org/docs
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **shadcn/ui**: https://ui.shadcn.com/
- **better-sqlite3**: https://github.com/WiseLibs/better-sqlite3
- **simple-git**: https://github.com/steveukx/git-js
- **Zod**: https://zod.dev/

### Similar Projects (Inspiration)

- VS Code Settings Editor
- GitHub Desktop (Git operations UI)
- npm/yarn package manager UIs
- WordPress Plugin Manager

---

**End of Design Document**
