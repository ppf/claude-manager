# Phase 3: Search & MCP Configuration

**Duration**: Week 5-6 (10-14 days)
**Branch**: `phase-3-search-mcp`
**Status**: 🔴 Not Started
**Prerequisites**: Phase 2 completed

---

## 📊 Phase Status

| Subphase | Status | Started | Completed | Branch |
|----------|--------|---------|-----------|--------|
| 3.1 Search Implementation | 🔴 Not Started | - | - | phase-3.1-search |
| 3.2 MCP Server Manager | 🔴 Not Started | - | - | phase-3.2-mcp-manager |

---

## 🎯 Phase Goal

Implement search and MCP server management:
- SQLite-powered full-text search index
- Search across configs, skills, plugins
- Filters and organization (tags, favorites)
- MCP server configuration UI
- Connection testing for MCP servers
- Server logs viewer

**Success Criteria**:
✅ Fast full-text search (<100ms)
✅ Search across all resource types
✅ Filters work correctly
✅ Can configure MCP servers
✅ Can test MCP connections
✅ Can view server logs

---

## 🌳 Subphase 3.1: Search Implementation (3-4 days)

### Branch Management

```bash
git checkout -b phase-3-search-mcp
git checkout -b phase-3.1-search
```

### Tasks

#### Task 3.1.1: Create SQLite Search Index

**File**: `lib/db/search-index.ts`

Create SQLite database with FTS5 (Full-Text Search) virtual table for fast search across all resources.

**Key Features**:
- FTS5 virtual table for full-text search
- Index configs, skills, plugins, MCP servers
- Snippet generation for search results
- Rank-based ordering

#### Task 3.1.2: Create Indexer Service

**File**: `lib/db/indexer.ts`

Service to populate search index from all sources.

**Functions**:
- `indexConfigs()` - Index all config files
- `indexSkills()` - Index skills
- `indexPlugins()` - Index plugins
- `indexMCP()` - Index MCP servers
- `rebuildSearchIndex()` - Full rebuild

#### Task 3.1.3: Create Search API

**File**: `app/api/search/route.ts`

API endpoint for search queries.

**Endpoint**: `GET /api/search?q={query}&type={type}&limit={limit}`

**Parameters**:
- `q`: Search query (required)
- `type`: Filter by type (config/skill/plugin/mcp)
- `limit`: Max results (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "config-CLAUDE.md",
      "type": "config",
      "title": "CLAUDE.md",
      "path": "CLAUDE.md",
      "excerpt": "...matched text...",
      "score": 0.85
    }
  ]
}
```

#### Task 3.1.4: Create Search UI Component

**File**: `components/search/SearchBar.tsx`

Global search bar component with:
- Debounced search input (300ms)
- Real-time results dropdown
- Keyboard navigation
- Result highlighting
- Type indicators (config/skill/plugin/mcp)

#### Task 3.1.5: Add Search to Layout

Update `app/layout.tsx` to include search bar in header.

#### Task 3.1.6: Index on Startup

Add initialization code to rebuild search index on app startup (development mode) or when database doesn't exist.

**Database Configuration**:
- Path: Configured via `DATABASE_PATH` environment variable (default: `./data/search.db`)
- Schema versioning: Rebuild index if schema changes detected
- **Security**: Exclude sensitive fields from indexing (passwords, tokens, API keys, secrets)

#### Task 3.1.7: Incremental Search Indexing

**Goal**: Update search index automatically when files change (via Phase 1.4 file watcher)

**File**: `lib/db/search-index.ts` (add to existing)

```typescript
import { fileWatcher } from '@/lib/watchers/file-watcher'

let indexUpdateQueue: string[] = []
let indexUpdateTimeout: NodeJS.Timeout | null = null

// Debounced index updates (1 second delay)
fileWatcher.on('change', (event) => {
  if (event.type === 'unlink') {
    removeFromIndex(event.path)
  } else {
    queueIndexUpdate(event.path)
  }
})

function queueIndexUpdate(path: string) {
  if (!indexUpdateQueue.includes(path)) {
    indexUpdateQueue.push(path)
  }

  if (indexUpdateTimeout) {
    clearTimeout(indexUpdateTimeout)
  }

  indexUpdateTimeout = setTimeout(() => {
    processIndexQueue()
  }, 1000) // Debounce 1 second
}

async function processIndexQueue() {
  const paths = [...indexUpdateQueue]
  indexUpdateQueue = []

  for (const path of paths) {
    await updateIndexForFile(path)
  }
}

async function updateIndexForFile(filePath: string) {
  // Read file, parse content, update or insert into search index
  // Emit update event for UI refresh if needed
}

async function removeFromIndex(filePath: string) {
  // Remove from search index
}
```

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` Task 3.1.7 (lines 729-786) for complete implementation.

### Testing Checklist

- [ ] Search index creates successfully
- [ ] Indexer populates all resource types
- [ ] Search API returns correct results
- [ ] Search is fast (<100ms for typical queries)
- [ ] Results are ranked correctly
- [ ] Snippets show matched context
- [ ] Filters work (by type)
- [ ] Debounce working (not searching on every keystroke)
- [ ] Incremental indexing updates on file changes
- [ ] Queue-based processing prevents duplicate updates
- [ ] Sensitive fields excluded from index
- [ ] TypeScript compiles without errors

### Commit

```bash
git add .
git commit -m "phase-3.1: Implement SQLite search with FTS5

- Create SQLite search index with FTS5
- Build indexer for all resource types
- Add search API endpoint
- Create search bar component with debounce
- Implement real-time search results
- Add index rebuild on startup"

git push -u origin phase-3.1-search
```

---

## 🌳 Subphase 3.2: MCP Server Manager (2-3 days)

**Goal**: Complete MCP server configuration and testing

### Branch Management

```bash
git checkout phase-3-search-mcp
git merge phase-3.1-search
git checkout -b phase-3.2-mcp-manager
```

### Tasks

#### Task 3.2.1: Create MCP Service

**File**: `lib/api/mcp-service.ts`

Service for MCP server operations:
- Read MCP config file (location configurable via `MCP_CONFIG_PATH` env variable)
- Update MCP config
- Test server connection (spawn process)
- Get server status with health checks
- Read server logs
- Process management (start/stop/restart)

**Environment Configuration**:
```bash
# MCP Configuration (add to .env.local)
MCP_CONFIG_PATH=~/.claude/mcp-servers.json  # Override default MCP config location
```

**Health Check Implementation** (see GAPS-AND-ADDITIONS.md Task 3.2.1 expanded):
```typescript
export interface MCPServerStatus {
  running: boolean
  pid?: number
  uptime?: number
  lastHealthCheck?: Date
  error?: string
}

export async function getServerStatus(serverId: string): Promise<MCPServerStatus> {
  const server = runningServers.get(serverId)
  
  if (!server) {
    return { running: false }
  }

  return {
    running: true,
    pid: server.process.pid,
    uptime: Date.now() - server.startTime,
    lastHealthCheck: new Date(),
  }
}

export async function testMCPConnection(server: MCPServer): Promise<boolean> {
  // Start server temporarily, wait for startup, check if running, then stop
  // Returns true if server starts successfully
}
```

#### Task 3.2.2: Create MCP API Routes

**File**: `app/api/mcp/route.ts`

CRUD endpoints for MCP servers:
- `GET /api/mcp` - List all servers
- `POST /api/mcp` - Add new server
- `PUT /api/mcp/[id]` - Update server config
- `DELETE /api/mcp/[id]` - Remove server
- `POST /api/mcp/[id]/test` - Test connection
- `GET /api/mcp/[id]/logs` - View logs

#### Task 3.2.3: Create MCP Server Card Component

**File**: `components/mcp/MCPServerCard.tsx`

Display card for MCP server with:
- Server name and status indicator
- Command and arguments display
- Enable/disable toggle
- Test connection button
- View logs button
- Edit/delete actions

#### Task 3.2.4: Create MCP Page

**File**: `app/mcp/page.tsx`

Page for managing MCP servers:
- List all configured servers
- Add new server dialog
- Edit server config
- Test connections
- View logs in modal

#### Task 3.2.5: Add Server Status Monitoring

Implement periodic health checks for enabled servers:
- Check if server process is running (via PID and process status)
- Update status indicator in real-time
- Alert on connection failures
- Track uptime and last health check timestamp
- Automatic restart on crash (optional)

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` Task 3.2.1 expanded (lines 790-875) for complete health check and process management implementation.

### Testing Checklist

- [ ] Can list all MCP servers
- [ ] Can add new MCP server
- [ ] Can edit server configuration
- [ ] Can delete server
- [ ] Can enable/disable server
- [ ] Connection test works
- [ ] Server logs display correctly
- [ ] Status indicators accurate (running/stopped/error)
- [ ] Health checks update status in real-time
- [ ] MCP_CONFIG_PATH env override works
- [ ] Process management (start/stop) works correctly
- [ ] TypeScript compiles without errors

### Commit

```bash
git add .
git commit -m "phase-3.2: Implement MCP server manager

- Create MCP service for config management
- Add MCP API routes (CRUD + test + logs)
- Build MCPServerCard component
- Create MCP page with full management UI
- Add connection testing
- Implement server status monitoring"

git push -u origin phase-3.2-mcp-manager
```

---

## ✅ Phase 3 Completion

### Final Integration

```bash
# Merge all subphases into phase-3
git checkout phase-3-search-mcp
git merge phase-3.1-search
git merge phase-3.2-mcp-manager

# Final testing
pnpm type-check
pnpm lint
pnpm test

# Push phase-3 branch
git push -u origin phase-3-search-mcp
```

### Phase 3 Acceptance Criteria

✅ **Search Functionality**:
- [ ] Full-text search working across all types
- [ ] Search results accurate and relevant
- [ ] Search is fast (<100ms)
- [ ] Results show context snippets
- [ ] Can filter by resource type
- [ ] Debounced input (smooth UX)

✅ **MCP Management**:
- [ ] Can view all MCP servers
- [ ] Can add/edit/delete servers
- [ ] Can enable/disable servers
- [ ] Connection testing works
- [ ] Server logs viewable
- [ ] Status indicators working

✅ **Code Quality**:
- [ ] TypeScript strict mode passing
- [ ] ESLint passing
- [ ] No console errors
- [ ] Proper error handling

### Update Master Plan

**File**: `docs/plans/MASTER-PLAN.md`

Update the status table:

```markdown
| **Phase 3**: Search & MCP | 🟢 Completed | phase-3-search-mcp | 2025-XX-XX | 2025-XX-XX | [→ Phase 3](./phase-3-search-mcp.md) |
```

### Create Pull Request

```bash
gh pr create \
  --title "Phase 3: Search & MCP Configuration" \
  --body "Implements search and MCP server management.

**Completed**:
- ✅ SQLite FTS5 search index
- ✅ Search across all resources
- ✅ MCP server configuration UI
- ✅ Connection testing
- ✅ Server logs viewer

**Testing**: All acceptance criteria met

**Next**: Phase 4 - Polish & Testing" \
  --base main
```

---

**Next Phase**: [Phase 4 - Polish & Testing](./phase-4-polish-testing.md)
