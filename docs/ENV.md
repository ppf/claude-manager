# Environment Variables

This document consolidates all environment variables used by Claude Code Manager.

## Configuration File

All environment variables should be defined in `.env.local` at the project root.

```bash
# .env.local
```

---

## Core Configuration

### `CLAUDE_HOME`

**Description**: Path to Claude Code configuration directory  
**Default**: `~/.claude`  
**Required**: No  
**Example**: `CLAUDE_HOME=/Users/username/.claude`

Override the default location of the Claude Code configuration directory. Useful for:
- Testing with isolated configurations
- Supporting multiple Claude installations
- Custom directory structures

---

### `NODE_ENV`

**Description**: Node.js environment mode  
**Default**: `development`  
**Required**: No  
**Values**: `development` | `production` | `test`

Controls behavior like:
- Error verbosity
- Hot module reloading
- Build optimizations

---

### `PORT`

**Description**: Server port  
**Default**: `3000`  
**Required**: No  
**Example**: `PORT=3001`

The port on which the Next.js development/production server runs.

---

## Database Configuration

### `DATABASE_PATH`

**Description**: Path to SQLite search index database  
**Default**: `./data/search.db`  
**Required**: No  
**Example**: `DATABASE_PATH=/var/lib/claude-manager/search.db`

Location for the full-text search index. The directory will be created if it doesn't exist.

**Note**: The search index excludes sensitive fields (passwords, tokens, API keys, secrets) for security.

---

## Marketplace Configuration (Phase 2)

### `MARKETPLACE_TYPE`

**Description**: Marketplace adapter type  
**Default**: `github`  
**Required**: No  
**Values**: `github` | `api` | `file`

Determines how the app fetches skills from the marketplace:
- `github`: Fetch from a GitHub organization
- `api`: Fetch from a custom API endpoint
- `file`: Load from a local JSON file

---

### `MARKETPLACE_GITHUB_ORG`

**Description**: GitHub organization for skills marketplace  
**Default**: `claude-skills`  
**Required**: No (only if `MARKETPLACE_TYPE=github`)  
**Example**: `MARKETPLACE_GITHUB_ORG=my-org`

The GitHub organization to fetch skills from when using the GitHub adapter.

---

### `MARKETPLACE_CACHE_TTL`

**Description**: Marketplace cache time-to-live (seconds)  
**Default**: `86400` (24 hours)  
**Required**: No  
**Example**: `MARKETPLACE_CACHE_TTL=3600`

How long to cache marketplace data before refetching. Set to `0` to disable caching.

---

### `MARKETPLACE_API_URL`

**Description**: Custom marketplace API endpoint  
**Default**: None  
**Required**: Yes (only if `MARKETPLACE_TYPE=api`)  
**Example**: `MARKETPLACE_API_URL=https://api.example.com/skills`

URL for the marketplace API when using the `api` adapter type.

---

### `MARKETPLACE_FILE_PATH`

**Description**: Local marketplace file path  
**Default**: None  
**Required**: Yes (only if `MARKETPLACE_TYPE=file`)  
**Example**: `MARKETPLACE_FILE_PATH=./data/marketplace.json`

Path to a local JSON file containing marketplace skills when using the `file` adapter type.

---

## MCP Configuration (Phase 3)

### `MCP_CONFIG_PATH`

**Description**: Path to MCP servers configuration file  
**Default**: `~/.claude/mcp-servers.json`  
**Required**: No  
**Example**: `MCP_CONFIG_PATH=/etc/claude/mcp-servers.json`

Override the default location of the MCP servers configuration file. Determined during Phase 0.4 research.

---

## Testing Configuration

### `TEST_CLAUDE_HOME`

**Description**: Path to test Claude directory  
**Default**: Temporary directory  
**Required**: No (only for tests)  
**Example**: `TEST_CLAUDE_HOME=/tmp/claude-test`

Used by test suites to isolate test data from production configuration.

---

## Example Configuration

Here's a complete example `.env.local` file:

```bash
# Core Configuration
CLAUDE_HOME=~/.claude
NODE_ENV=development
PORT=3000

# Database
DATABASE_PATH=./data/search.db

# Marketplace (Phase 2)
MARKETPLACE_TYPE=github
MARKETPLACE_GITHUB_ORG=claude-skills
MARKETPLACE_CACHE_TTL=86400

# MCP (Phase 3)
MCP_CONFIG_PATH=~/.claude/mcp-servers.json

# Testing (optional)
# TEST_CLAUDE_HOME=/tmp/claude-test
```

---

## Security Considerations

1. **Never commit `.env.local`** to version control
2. **Use `.env.example`** to document required variables (without values)
3. **Sensitive data**: API keys, tokens, and passwords should never be indexed by the search system
4. **Path validation**: All paths are sanitized to prevent path traversal attacks

---

## Validation

Environment variables are validated at startup using Zod schemas. Invalid configurations will:
1. Log a warning to the console
2. Fall back to default values
3. Display a setup wizard (if critical variables are missing)

See `lib/claude/setup-checker.ts` for validation logic.

---

## Phase-Specific Variables

Some environment variables are only relevant after specific phases are implemented:

| Variable | Phase | Status |
|----------|-------|--------|
| `CLAUDE_HOME` | Phase 1 | ✅ Core |
| `DATABASE_PATH` | Phase 3 | 🟡 Search |
| `MARKETPLACE_*` | Phase 2 | 🟡 Skills |
| `MCP_CONFIG_PATH` | Phase 3 | 🟡 MCP |

---

**Last Updated**: 2025-11-06  
**Related Documents**:
- `docs/plans/phase-0-discovery.md` - Research findings
- `docs/plans/GAPS-AND-ADDITIONS.md` - Implementation details
- `docs/plans/2025-11-02-claude-manager-design.md` - Architecture

