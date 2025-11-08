# Claude Code Manager

A modern web-based management tool for Claude Code configurations, skills, plugins, and MCP servers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **📝 Config Editor**: Edit Claude Code configuration files with Monaco Editor
  - Syntax highlighting and auto-completion
  - Auto-save functionality
  - Real-time validation
  
- **🎯 Skills Management**: Install, create, and manage skills
  - Browse marketplace skills
  - Create custom skills from templates
  - Git integration for skill repositories
  - Enable/disable skills
  
- **🔌 Plugins Manager**: Manage plugins with ease
  - Install and configure plugins
  - Enable/disable plugins
  - View plugin documentation
  
- **🔍 Full-Text Search**: Fast search across all resources
  - SQLite FTS5-powered search
  - Search configs, skills, plugins, and MCP servers
  - Filter by resource type
  - Instant results
  
- **🖥️ MCP Configuration**: Configure and test MCP servers
  - Add and manage MCP servers
  - Test server connections
  - View real-time logs
  - Enable/disable servers

## Quick Start

### Prerequisites

- Node.js 18+ or Node.js 20+
- pnpm (recommended) or npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/claude-manager.git
cd claude-manager

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Environment Variables

Create a `.env.local` file:

```bash
# Claude home directory (default: ~/.claude)
CLAUDE_HOME=~/.claude

# Database path for search index (default: ./data/search.db)
DATABASE_PATH=./data/search.db

# MCP configuration file path (default: ~/.claude/.mcp.json)
MCP_CONFIG_PATH=~/.claude/.mcp.json

# Marketplace configuration (optional)
MARKETPLACE_TYPE=github
MARKETPLACE_GITHUB_ORG=claude-skills
MARKETPLACE_CACHE_TTL=86400
```

## Development

### Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript type checking
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting

# Testing
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage report
```

### Project Structure

```
claude-manager/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── configs/           # Config editor pages
│   ├── skills/            # Skills management pages
│   ├── plugins/           # Plugins management pages
│   └── mcp/               # MCP server pages
├── components/            # React components
│   ├── editor/           # Code editor components
│   ├── file-tree/        # File tree components
│   ├── layout/           # Layout components
│   ├── mcp/              # MCP components
│   ├── plugins/          # Plugin components
│   ├── search/           # Search components
│   ├── skills/           # Skills components
│   └── ui/               # UI components
├── lib/                   # Utility libraries
│   ├── api/              # API services
│   ├── backup/           # Backup service
│   ├── claude/           # Claude-specific utilities
│   ├── db/               # Database utilities
│   ├── git/              # Git operations
│   ├── templates/        # Skill templates
│   ├── validators/       # Schema validators
│   └── watchers/         # File watchers
├── hooks/                 # React hooks
├── types/                 # TypeScript type definitions
└── tests/                 # Test files
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── components/       # Component tests
```

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **Database**: SQLite (FTS5 for search)
- **Git**: simple-git
- **UI Components**: Radix UI, shadcn/ui
- **Forms**: React Hook Form, Zod
- **Testing**: Vitest, Testing Library

## Architecture

### File System Access

The application manages files in the Claude home directory (`~/.claude/` by default):

```
~/.claude/
├── CLAUDE.md              # Main configuration
├── FLAGS.md               # Feature flags
├── RULES.md               # Coding rules
├── .mcp.json              # MCP server config
├── skills/                # Skills directory
│   └── [skill-name]/     
│       └── SKILL.md
└── plugins/               # Plugins directory
    └── [plugin-name]/
```

### Search Indexing

- Full-text search powered by SQLite FTS5
- Automatic indexing of configs, skills, plugins, and MCP servers
- Incremental updates via file watching
- Excludes sensitive fields (passwords, tokens, API keys)

### MCP Server Management

- JSON-based configuration
- Process management for server lifecycle
- Health checks and status monitoring
- Real-time log viewing

## Security

- **Local-only deployment**: No authentication required (runs on localhost)
- **File system restrictions**: Access limited to Claude home directory
- **Path sanitization**: Prevents path traversal attacks
- **Input validation**: Zod schemas for all inputs
- **Sensitive data exclusion**: Passwords and tokens never indexed

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Roadmap

### Phase 1: Core Foundation ✅
- ✅ Project setup
- ✅ File browser
- ✅ Monaco editor integration

### Phase 2: Skills & Plugins ✅
- ✅ Skills browser and editor
- ✅ Plugin manager
- ✅ Git integration

### Phase 3: Search & MCP ✅
- ✅ Search implementation
- ✅ MCP server manager

### Phase 4: Polish & Testing 🚧
- ✅ Error handling
- ✅ Testing infrastructure
- ✅ Documentation
- 🚧 UX polish
- 🚧 Performance optimization

### Future Enhancements
- Backup/restore configurations
- Visual diff tool
- Skill development toolkit
- Enhanced markdown editor with live preview
- Remote access (with authentication)

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/your-org/claude-manager/issues).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)

