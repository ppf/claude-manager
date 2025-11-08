# Skills Marketplace - Research Findings

**Date**: 2025-11-07
**Task**: 0.2 Marketplace Investigation
**Status**: Complete ✅

---

## Executive Summary

Claude Code uses a **plugin marketplace** system for discovering and installing skills. Skills/plugins are distributed via GitHub repositories and installed using CLI commands. There is no centralized API - discovery happens through GitHub and community-curated lists.

**Key Finding**: "Skills" and "Plugins" terminology is used interchangeably in the ecosystem, but technically:
- **Skills**: Auto-activate based on context, no explicit trigger needed
- **Plugins**: May include commands that need `/command` trigger

---

## Marketplace Source

**Type**: GitHub-based (no centralized API)

**Official Repository**: https://github.com/anthropics/skills

**Distribution Model**:
- Skills/plugins are GitHub repositories
- Users add "marketplace" repos to their Claude Code instance
- Claude Code clones skills from these repos

**Authentication**:
- Public repos: No authentication required
- Private repos: Requires GitHub credentials (SSH or HTTPS token)

**Rate Limits**:
- Subject to GitHub API rate limits
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour

---

## Discovery Mechanisms

### Option A: Official Anthropic Skills Repository ✅

**URL**: https://github.com/anthropics/skills

**Installation Pattern**:
```bash
# Add the official marketplace (if not already added)
/plugin marketplace add anthropics/skills

# Install a specific skill
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

### Option B: Community Marketplaces ✅

Multiple community-curated marketplaces exist:

1. **obra/superpowers** - Core skills library
   - URL: https://github.com/obra/superpowers
   - Add: `/plugin marketplace add obra/superpowers-marketplace`
   - Install: `/plugin install superpowers@superpowers-marketplace`

2. **jeremylongshore/claude-code-plugins-plus** - 227+ plugins hub
   - URL: https://github.com/jeremylongshore/claude-code-plugins-plus
   - Add: `/plugin marketplace add jeremylongshore/claude-code-plugins`
   - Install: `/plugin install devops-automation-pack@claude-code-plugins-plus`

3. **mhattingpete/claude-skills-marketplace** - Git automation, testing, code review
   - URL: https://github.com/mhattingpete/claude-skills-marketplace
   - Add: `/plugin marketplace add mhattingpete/claude-skills-marketplace`

4. **netresearch/claude-code-marketplace** - Netresearch DTT GmbH collection
   - URL: https://github.com/netresearch/claude-code-marketplace
   - Add: `/plugin marketplace add netresearch/claude-code-marketplace`

5. **ananddtyagi/claude-code-marketplace** - Marketplace repo for plugins
   - URL: https://github.com/ananddtyagi/claude-code-marketplace

6. **EveryInc/every-marketplace** - Official Every-Env plugin marketplace
   - URL: https://github.com/EveryInc/every-marketplace

7. **travisvn/awesome-claude-skills** - Curated list of resources
   - URL: https://github.com/travisvn/awesome-claude-skills

### Option C: Direct GitHub Clone ✅

Users can manually clone any skill repository:

```bash
cd ~/.claude/skills/
git clone https://github.com/username/skill-repo skill-name
```

### Option D: Web Marketplace (Emerging) ⚠️

**URL**: https://skillsmp.com

**Status**: Community-built marketplace website

**Type**: Discovery portal (links to GitHub repos)

---

## Installation Process

### Method 1: CLI Plugin Command (Recommended)

```bash
# Step 1: Add a marketplace source
/plugin marketplace add [github-org/repo]

# Step 2: Browse available plugins (if CLI supports it)
/plugin list [marketplace-name]

# Step 3: Install a plugin
/plugin install [skill-name]@[marketplace-name]

# Example workflow:
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

### Method 2: Manual Git Clone

```bash
# Navigate to skills directory
cd ~/.claude/skills/

# Clone the skill repository
git clone https://github.com/username/skill-repo.git skill-name

# Verify installation
ls -la skill-name/
cat skill-name/SKILL.md

# Claude Code automatically detects new skills
# No restart required
```

### Method 3: Project-Specific Installation (Future)

Some documentation suggests project-scoped skills may be supported:

```bash
# Project-level skills (if supported)
cd /path/to/project/.claude/skills/
git clone https://github.com/username/skill-repo.git skill-name
```

**Status**: Not confirmed in current version

---

## Git Operations Details

### Protocol Support

**HTTPS** (Recommended for public repos):
```bash
git clone https://github.com/anthropics/skills.git
```

**SSH** (For private repos or when preferred):
```bash
git clone git@github.com:anthropics/skills.git
```

### Authentication

**Public Repositories**: No authentication required

**Private Repositories**:
- SSH: Requires SSH key added to GitHub account
- HTTPS: Requires GitHub Personal Access Token
  - Scope needed: `repo` (full control of private repositories)
  - Storage: Git credential helper or environment variable

**Credential Storage**:
```bash
# Configure git credential helper
git config --global credential.helper store

# Or use SSH keys (preferred for security)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add to GitHub: Settings > SSH and GPG keys
```

### Update Operations

```bash
# Update a skill
cd ~/.claude/skills/skill-name/
git pull

# Check for updates across all skills
cd ~/.claude/skills/
for dir in */; do
  echo "Checking $dir..."
  cd "$dir"
  git fetch
  git status
  cd ..
done
```

### Submodules

**Check for submodules**:
```bash
cd ~/.claude/skills/skill-name/
git submodule status
```

**Initialize submodules** (if present):
```bash
git submodule update --init --recursive
```

**Current finding**: No widespread use of submodules in skills repos observed

---

## Discovery API Specification

**Finding**: No official REST API exists

**Alternative**: GitHub API can be used for discovery

### GitHub API Approach

```bash
# List repos in an organization
curl https://api.github.com/orgs/anthropics/repos

# Search for skills repositories
curl "https://api.github.com/search/repositories?q=claude+skill+in:name"

# Get repository details
curl https://api.github.com/repos/anthropics/skills

# List repository contents (to find SKILL.md files)
curl https://api.github.com/repos/anthropics/skills/contents
```

**Response Format**: JSON

**Rate Limits**:
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour (using `Authorization: token YOUR_TOKEN`)

### Marketplace Registry Format (Inferred)

Based on community implementations, marketplace repos likely maintain a registry file:

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "name": "skill-name",
      "description": "Skill description",
      "repository": "https://github.com/org/repo",
      "author": "Author Name",
      "tags": ["tag1", "tag2"],
      "version": "1.0.0"
    }
  ]
}
```

**Location**: Likely `marketplace.json` or `skills.json` in repo root

**Note**: This is inferred from community patterns, not official spec

---

## Plugin Status (Public Beta - October 2025)

**Current Status**: Public Beta as of October 2025

**Maturity**: Features and best practices still evolving

**Stability**:
- ✅ Core functionality working
- ⚠️ CLI commands may change
- ⚠️ Marketplace format may evolve

**Documentation**:
- Official docs available but limited
- Community resources filling gaps

---

## Marketplace Adapter Specification

For our Claude Manager implementation, we need an adapter to abstract marketplace operations:

```typescript
interface MarketplaceAdapter {
  // Discovery
  listMarketplaces(): Promise<Marketplace[]>
  addMarketplace(url: string): Promise<void>
  removeMarketplace(id: string): Promise<void>

  // Skills browsing
  listSkills(marketplaceId?: string): Promise<Skill[]>
  searchSkills(query: string): Promise<Skill[]>
  getSkill(id: string): Promise<SkillDetails>

  // Installation
  installSkill(skillId: string, marketplaceId: string): Promise<void>
  updateSkill(skillId: string): Promise<void>
  uninstallSkill(skillId: string): Promise<void>

  // Local skills
  getInstalledSkills(): Promise<Skill[]>
  getSkillStatus(skillId: string): Promise<SkillStatus>
}

interface Marketplace {
  id: string
  name: string
  url: string
  type: 'github' | 'custom'
  description?: string
}

interface Skill {
  id: string
  name: string
  description: string
  author: string
  repository: string
  version: string
  tags: string[]
  installed: boolean
  updateAvailable: boolean
}

interface SkillDetails extends Skill {
  readme: string
  dependencies?: string[]
  configuration?: any
}

interface SkillStatus {
  installed: boolean
  version: string
  lastUpdated: Date
  updateAvailable: boolean
  latestVersion?: string
  gitStatus?: {
    ahead: number
    behind: number
    modified: boolean
  }
}
```

---

## Implementation Strategy

### Phase 1: Basic Support (MVP)
- ✅ List installed skills from `~/.claude/skills/`
- ✅ Display skill details from `SKILL.md`
- ✅ Manual Git clone support (provide instructions)

### Phase 2: Git Integration
- ✅ Clone skill from URL
- ✅ Check for updates (git fetch)
- ✅ Pull updates (git pull)
- ✅ Credential management

### Phase 3: Marketplace Integration
- ✅ Add/remove marketplace sources
- ✅ Browse skills from marketplace
- ✅ One-click install from marketplace
- ✅ Search across marketplaces

### Phase 4: Advanced Features
- Auto-update checks
- Skill dependency resolution
- Custom marketplace support
- Skill publishing helpers

---

## Recommendations

### Caching Strategy
- **Marketplace metadata**: Cache for 1 hour
- **Skill listings**: Cache for 30 minutes
- **Installed skills**: Read from filesystem (no cache needed)
- **Update checks**: Cache for 24 hours, manual refresh available

### Offline Mode
- Always show installed skills (read from filesystem)
- Display cached marketplace data if available
- Show "offline mode" indicator
- Provide refresh button for when online

### Fallback Mechanism
- If GitHub API fails, fall back to cached data
- If marketplace unreachable, show installed skills only
- Provide manual URL input for direct installation
- Support local file path for offline skill import

### Error Handling
- Network errors: Show cached data + retry option
- Git errors: Display git output, suggest solutions
- Authentication errors: Prompt for credentials
- Rate limiting: Show clear message, suggest waiting period

### Security
- Prompt before cloning from unknown sources
- Display repository URL before installation
- Show SKILL.md contents before activation
- Implement allowlist/blocklist for marketplaces

---

## Testing Results

**Environment**: Claude Code v2.0.34, remote cloud environment

**Tests Performed**:
```bash
# ✅ Skills directory exists
ls -la ~/.claude/skills/

# ✅ Example skill found
ls -la ~/.claude/skills/session-start-hook/
cat ~/.claude/skills/session-start-hook/SKILL.md

# ✅ Git operations work
cd /tmp
git clone https://github.com/anthropics/skills.git test-skills
# Success! GitHub clone works

# ⚠️ CLI commands not tested (would require user interaction)
# Cannot test: /plugin marketplace add
# Cannot test: /plugin install
```

**Conclusion**: Git-based distribution confirmed working, CLI integration to be tested in actual usage

---

## Open Questions

1. **Marketplace registry format**: No official spec found
   - Resolution: Use GitHub API + infer from SKILL.md files

2. **Plugin CLI availability**: Commands found in docs but not all tested
   - Resolution: Implement both CLI wrapper and direct Git approach

3. **Private marketplace support**: Not documented
   - Resolution: Support via manual Git URL input

4. **Skill versioning**: No clear semver standard
   - Resolution: Use Git tags/commits as version

5. **Dependency management**: How do skills declare dependencies?
   - Resolution: Parse SKILL.md, document custom format if needed

---

## References

- Official Skills Repo: https://github.com/anthropics/skills
- Community Marketplaces: Multiple (listed above)
- Claude Code Plugins Beta: October 2025
- GitHub API: https://api.github.com/
- Web Marketplace: https://skillsmp.com

---

## Conclusion

**Status**: ✅ Marketplace system well-understood

**Implementation Path**: Clear - use Git-based approach with GitHub API for discovery

**Blocking Issues**: None

**Confidence Level**: High - can proceed with Phase 2.1/2.2 implementation
