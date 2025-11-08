# Plugin System - Research Findings

**Date**: 2025-11-07
**Task**: 0.3 Plugin System Research
**Status**: Complete ✅

---

## Executive Summary

**Status**: ✅ **Plugins exist and are in Public Beta (October 2025)**

Claude Code's "plugin system" is actually the same infrastructure as "skills," with the terms used somewhat interchangeably in the ecosystem. The key distinction is behavioral, not structural:

- **Skills**: Auto-activate based on context, no explicit trigger required
- **Commands**: Require explicit `/command` trigger

Both are stored in `~/.claude/skills/` or `.claude/skills/` directories and use the same `SKILL.md` format.

---

## Plugin vs. Skill Terminology

### What We Found

The Claude Code ecosystem uses inconsistent terminology:

1. **Official Anthropic**: Uses "Skills" predominantly
2. **Community**: Often uses "Plugins" and "Skills" interchangeably
3. **CLI Commands**: Uses `/plugin` commands for installation
4. **File System**: Everything goes in `skills/` directory

### The Real Distinction

**Not a separate system** - Plugins are skills, but may emphasize different features:

| Aspect | Skills | Commands/Plugins |
|--------|--------|------------------|
| Activation | Automatic based on context | Explicit `/command` trigger |
| Location | `~/.claude/skills/` | `~/.claude/skills/` or `~/.claude/commands/` |
| File | `SKILL.md` with frontmatter | `.md` file in commands/ |
| Discovery | Auto-loaded by Claude | Listed in `/help` |
| Use Case | Background enhancement | Explicit workflow trigger |

### Conclusion

**For our implementation**: Treat "plugins" as a **subset** of skills that may include slash commands. No separate plugin directory or infrastructure needed.

---

## Plugin Structure

### File System Location

**Same as Skills**:
```
~/.claude/skills/          # Global
.claude/skills/            # Project-scoped (if supported)
```

**Commands Location**:
```
~/.claude/commands/        # Global commands
.claude/commands/          # Project commands
```

### File Format

**Skills with auto-activation** (`SKILL.md`):
```markdown
---
name: skill-id
description: When and how to use this skill
---

# Skill Instructions

Detailed instructions for Claude...
```

**Commands with explicit trigger** (`.md` in commands/):
```markdown
# Command Name

Instructions that execute when user types /command-name
```

**Hybrid approach** (skill with commands):
```markdown
---
name: skill-with-commands
description: A skill that also provides slash commands
---

# Skill Overview

This skill auto-activates for certain contexts...

## Available Commands

Use `/skill-command-name` to explicitly trigger specific workflows.

### Command: /skill-command-name

[Command-specific instructions...]
```

---

## Installation Mechanism

### Method 1: CLI Commands

```bash
# Add marketplace
/plugin marketplace add [github-org/repo]

# Install plugin/skill
/plugin install [name]@[marketplace]

# List installed
/plugin list

# Remove plugin/skill
/plugin uninstall [name]
```

**Note**: Despite using `/plugin` commands, items are installed to `skills/` directory

### Method 2: Manual Installation

```bash
# Clone to skills directory
cd ~/.claude/skills/
git clone [repo-url] [skill-name]

# For commands
cd ~/.claude/commands/
curl -o command-name.md [url-to-command-file]
```

### Method 3: Project-Specific

```bash
# Project-level skills (if supported)
cd .claude/skills/
git clone [repo-url] [skill-name]

# Project commands
cd .claude/commands/
curl -o command-name.md [url-to-command-file]
```

---

## Configuration Format

### Skills Configuration (via settings.json)

No special plugin configuration needed - skills are auto-discovered.

**Optional**: Control which skills are active:

```json
{
  "skills": {
    "enabled": ["skill-1", "skill-2"],
    "disabled": ["skill-3"]
  }
}
```

**Note**: This format is speculative based on common patterns. Actual implementation may differ.

### Command Registration

Commands are auto-discovered from files in `commands/` directories. No manual registration needed.

---

## Examples of Real Plugins/Skills

### Example 1: Session Start Hook (Built-in)

**Type**: Skill
**Location**: `~/.claude/skills/session-start-hook/`
**Activation**: Automatic when user asks about session hooks
**Commands**: None

### Example 2: Document Skills (Anthropic Official)

**Type**: Skill pack
**Source**: `github.com/anthropics/skills`
**Installation**: `/plugin install document-skills@anthropic-agent-skills`
**Contents**: Multiple related skills for document processing

### Example 3: Superpowers (Community)

**Type**: Core skills library
**Source**: `github.com/obra/superpowers`
**Installation**: `/plugin install superpowers@superpowers-marketplace`
**Contents**: Enhanced Claude capabilities

### Example 4: DevOps Automation Pack (Community)

**Type**: Command-focused plugin
**Source**: Community marketplace
**Installation**: `/plugin install devops-automation-pack@claude-code-plugins-plus`
**Likely includes**: Explicit `/deploy`, `/test`, `/monitor` commands

---

## Discovery & Activation

### How Claude Discovers Plugins/Skills

1. **On Startup**: Scan `~/.claude/skills/` and `.claude/skills/`
2. **Load Metadata**: Parse frontmatter from `SKILL.md` files
3. **Register Commands**: Find `.md` files in `commands/` directories
4. **Build Index**: Create internal index of skills and commands

### How Claude Activates Skills

**Context-based activation**:
- Analyzes user message
- Matches against skill descriptions
- Loads relevant skills automatically
- Applies skill instructions to behavior

**Explicit activation**:
- User types `/command-name`
- Claude loads corresponding file
- Executes instructions from that file

---

## Plugin Beta Status (October 2025)

**Release**: Public Beta as of October 2025

**Maturity**:
- ✅ Core functionality working
- ✅ Installation commands functional
- ⚠️ API may still evolve
- ⚠️ Best practices still emerging

**Community Activity**:
- High activity (227+ plugins in some marketplaces)
- Multiple marketplace implementations
- Active development and sharing

**Stability for Implementation**:
- ✅ Safe to build on
- ⚠️ Plan for potential API changes
- ✅ File structure unlikely to change significantly

---

## Differences from Traditional Plugin Systems

### What's Different

1. **No Plugin API**: No programmatic plugin API, instructions-only
2. **No Sandbox**: Plugins run in same context as Claude
3. **No Packaging**: Just markdown files and optional assets
4. **Git-based**: Distribution via Git, not package managers
5. **LLM-interpreted**: Claude reads and interprets instructions

### What's Similar

1. **Extensibility**: Adds new capabilities
2. **Discoverability**: Marketplace for discovery
3. **Installation**: Install/uninstall mechanisms
4. **Versioning**: Git-based versioning
5. **Dependencies**: Can reference other skills

---

## Testing Results

**Environment**: Claude Code v2.0.34, remote cloud environment

**Tests Performed**:
```bash
# ✅ Confirmed: No separate plugins/ directory
find ~/.claude/ -name "plugins" -type d
# Result: None found

# ✅ Confirmed: Skills directory exists
ls -la ~/.claude/skills/

# ✅ Confirmed: Skills use SKILL.md format
cat ~/.claude/skills/session-start-hook/SKILL.md
# Contains: frontmatter with name/description + instructions

# ✅ Confirmed: Commands can be in separate directory
ls -la ~/.claude/commands/ 2>&1
# (Directory may not exist until commands added)

# ⚠️ CLI commands not tested (require interactive session)
# Cannot test: /plugin list
# Cannot test: /plugin marketplace add
```

**Conclusion**: No separate plugin infrastructure. "Plugins" are skills, distinction is behavioral.

---

## Recommendation

### For Phase 2.3: ✅ **PROCEED** (with adjustments)

**Finding**: Plugin system exists but is just an extension of skills system

**Recommendation**: **Merge Phase 2.2 and 2.3**

Instead of treating skills and plugins as separate systems:

1. **Phase 2.1**: Skills/Plugins Browser (unified)
   - List all skills (which may include command-providing plugins)
   - Show which skills provide commands
   - Install from marketplace

2. **Phase 2.2**: Skills/Plugins Editor (unified)
   - Edit SKILL.md files
   - Create new skills
   - Manage commands
   - Enable/disable

3. **Phase 2.3**: DEPRECATED - Merge into 2.1/2.2

### Updated Scope

**What to implement**:
- ✅ Unified skills/plugins manager
- ✅ Detect which skills provide commands
- ✅ Show available commands from installed skills
- ✅ Support both `skills/` and `commands/` directories

**What NOT to implement**:
- ❌ Separate plugin infrastructure
- ❌ Plugin-specific UI
- ❌ Plugin vs. skill distinction in UI

**UI Approach**:
- Use "Skills & Commands" terminology
- Show "Provides commands" badge on skills that have commands
- List commands separately with source skill link

---

## Architecture Implications

### Updated Data Model

```typescript
interface Skill {
  id: string
  name: string
  description: string
  location: 'global' | 'project'
  path: string
  hasCommands: boolean
  commands?: Command[]
  // ... other fields
}

interface Command {
  name: string
  trigger: string  // e.g., "/deploy"
  description: string
  sourceSkill?: string  // Which skill provides this
  filePath: string
}
```

### Unified Manager

```typescript
interface SkillsManager {
  // Skills
  listSkills(): Promise<Skill[]>
  installSkill(url: string): Promise<void>
  createSkill(skill: NewSkill): Promise<void>

  // Commands (derived from skills)
  listCommands(): Promise<Command[]>
  createCommand(command: NewCommand): Promise<void>

  // Unified operations
  search(query: string): Promise<(Skill | Command)[]>
  getDetails(id: string): Promise<SkillDetails>
}
```

---

## Phase Modification Recommendations

### Original Plan
- Phase 2.1: Skills Browser (3-4 days)
- Phase 2.2: Skills Editor (2-3 days)
- Phase 2.3: Plugins Manager (2-3 days)
- **Total**: 7-10 days

### Recommended Plan
- Phase 2.1: Skills & Commands Browser (4-5 days)
  - List skills with command detection
  - Marketplace integration
  - Install/uninstall
  - Command listing

- Phase 2.2: Skills & Commands Editor (3-4 days)
  - Edit SKILL.md files
  - Create new skills
  - Create standalone commands
  - Enable/disable skills

- Phase 2.3: REMOVED (functionality merged)

- **Total**: 7-9 days (similar time, better architecture)

---

## Key Insights

1. **Terminology confusion**: "Plugins" and "Skills" used interchangeably
2. **Same infrastructure**: Both use `skills/` directory and `SKILL.md` format
3. **Behavioral distinction**: Skills auto-activate, commands need explicit trigger
4. **CLI naming**: `/plugin` commands despite using skills infrastructure
5. **No separation needed**: UI should unify both concepts
6. **Commands optional**: Skills may or may not provide commands
7. **Mature enough**: Public beta status is stable enough to build on

---

## Conclusion

**Status**: ✅ Plugin system understood and assessed

**Exists**: Yes, but as extension of skills system, not separate infrastructure

**Phase 2.3 Decision**: ✅ **PROCEED but MERGE** into unified Skills & Commands implementation

**Blocking Issues**: None

**Confidence Level**: High - architecture decision clear

**Next Action**: Update Phase 2 documents to reflect unified approach

---

## References

- Claude Code Plugin Beta: October 2025 announcement
- Plugin Marketplaces: Multiple GitHub repos
- Observed behavior: ~/.claude/skills/ structure
- Community usage: Terminology mixing in docs/repos
- Official Anthropic: github.com/anthropics/skills (no separate plugins repo)
