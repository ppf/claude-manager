# Branch Workflow Memory - Claude Code Manager

**Project**: Claude Code Manager
**Created**: 2025-11-02
**Purpose**: Critical workflow rules for branch management

---

## 📋 Prerequisites

### Required Tools

1. **Git** (2.30+)
2. **GitHub CLI** (`gh`) - Required for PR creation commands shown in this document

**Install GitHub CLI**:
```bash
# macOS
brew install gh

# Linux
sudo apt install gh  # Debian/Ubuntu
sudo dnf install gh  # Fedora

# Windows
winget install --id GitHub.cli
```

**Authenticate**:
```bash
gh auth login
```

### Alternative: Manual PR Creation

If you prefer not to use GitHub CLI, replace `gh pr create` commands with:

```bash
# Instead of:
gh pr create --title "..." --body "..."

# Use:
git push -u origin <branch-name>
# Then manually create PR at: https://github.com/YOUR_ORG/claude-manager/compare/<branch-name>
```

---

## 🔴 CRITICAL PRE-IMPLEMENTATION RULE

**BEFORE ANY IMPLEMENTATION:**

```bash
# Step 1: ALWAYS check current branch
git branch --show-current
```

**If output is `main` or `master`:**
- ❌ **STOP** - Do NOT implement on main/master
- ✅ **CREATE FEATURE BRANCH** first
- ✅ **ASK USER** for branch name with your proposition

---

## Branch Strategy

### Phase Branches
```
phase-{N}-{short-description}

Examples:
- phase-1-core-foundation
- phase-2-skills-plugins
- phase-3-search-mcp
- phase-4-polish-testing
```

### Subphase Branches
```
phase-{N}.{M}-{short-description}

Examples:
- phase-1.1-project-setup
- phase-1.2-file-browser
- phase-1.3-monaco-editor
```

---

## Workflow Pattern

### Starting New Phase

```bash
# 1. Check current branch
git branch --show-current

# 2. If on main, create phase branch
git checkout -b phase-1-core-foundation

# 3. Create first subphase branch
git checkout -b phase-1.1-project-setup
```

### Completing Subphase

```bash
# 1. Commit work
git add .
git commit -m "phase-1.1: Initial setup complete"

# 2. Push subphase branch
git push -u origin phase-1.1-project-setup

# 3. Merge into phase branch
git checkout phase-1-core-foundation
git merge phase-1.1-project-setup

# 4. Create next subphase
git checkout -b phase-1.2-file-browser
```

### Completing Phase

```bash
# 1. Merge all subphases into phase branch
git checkout phase-1-core-foundation
git merge phase-1.1-project-setup
git merge phase-1.2-file-browser
git merge phase-1.3-monaco-editor

# 2. Push phase branch
git push -u origin phase-1-core-foundation

# 3. Create PR or merge to main
gh pr create --title "Phase 1: Core Foundation" --base main

# OR direct merge (after approval)
git checkout main
git merge phase-1-core-foundation
git push
```

---

## Interaction Examples

### Example 1: User wants to start Phase 1

```
User: "Let's start implementing Phase 1"

Claude: *Checks branch first*

$ git branch --show-current
main

Claude: "I see we're on main branch. Before starting Phase 1, we need to create the phase branch.

I propose: `phase-1-core-foundation`

Should I create this branch now?"

User: "Yes"

Claude: *Creates branch*
$ git checkout -b phase-1-core-foundation

"Phase 1 branch created. Now I'll create the first subphase branch for project setup.

Branch: `phase-1.1-project-setup`"

$ git checkout -b phase-1.1-project-setup

"Ready to start implementation!"
```

### Example 2: User wants to continue existing phase

```
User: "Continue with file browser"

Claude: *Checks branch*

$ git branch --show-current
phase-1.2-file-browser

Claude: "We're on phase-1.2-file-browser branch. Ready to continue implementation."
```

### Example 3: Accidentally on main

```
User: "Add Monaco editor"

Claude: *Checks branch*

$ git branch --show-current
main

Claude: "⚠️ We're on main branch. We should NOT implement directly here.

I propose creating: `phase-1.3-monaco-editor`

Should I create this branch? (Any uncommitted work will be stashed first)"

User: "Yes"

Claude: *Safely moves to feature branch*
$ git stash
$ git checkout -b phase-1.3-monaco-editor
$ git stash pop

"Now safely on feature branch. Ready to implement!"
```

---

## Master Plan Updates

### MANDATORY after each subphase completion:

1. Open `docs/plans/MASTER-PLAN.md`
2. Update status table
3. Add dates
4. Commit changes

**Example**:
```markdown
| **Phase 1**: Core Foundation | 🟡 In Progress | phase-1-core-foundation | 2025-11-03 | - |
```

---

## Emergency Recovery

### If made changes on main by mistake:

```bash
# 1. DON'T PANIC!
git stash

# 2. Create correct branch
git checkout -b phase-{N}-{description}

# 3. Restore changes
git stash pop

# 4. Commit on correct branch
git add .
git commit -m "..."
```

---

## Testing Before Merge

**ALWAYS run before merging:**

```bash
pnpm type-check  # Must pass
pnpm lint        # Must pass
pnpm test        # Must pass (when tests exist)
```

---

## Quick Reference

| Situation | Branch | Action |
|-----------|--------|--------|
| Start new phase | `main` | Create `phase-{N}-{desc}` |
| Start subphase | `phase-{N}-{desc}` | Create `phase-{N}.{M}-{desc}` |
| Complete subphase | `phase-{N}.{M}-{desc}` | Merge into `phase-{N}-{desc}` |
| Complete phase | `phase-{N}-{desc}` | PR or merge to `main` |
| Accidentally on main | `main` | Stash → Create branch → Pop |

---

## Files to Reference

- **Project Rules**: `.claude/PROJECT_RULES.md`
- **Master Plan**: `docs/plans/MASTER-PLAN.md`
- **Phase 1**: `docs/plans/phase-1-core-foundation.md`
- **Phase 2**: `docs/plans/phase-2-skills-plugins.md`
- **Phase 3**: `docs/plans/phase-3-search-mcp.md`
- **Phase 4**: `docs/plans/phase-4-polish-testing.md`

---

**Remember**: Check branch FIRST, create feature branch if needed, THEN implement!
