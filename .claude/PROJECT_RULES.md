# Claude Code Manager - Project Rules

**Project**: Claude Code Manager
**Created**: 2025-11-02

---

## 🔴 CRITICAL: Branch Management Rules

### MANDATORY Pre-Implementation Check

**BEFORE starting ANY implementation work, you MUST:**

1. **Check current branch**:
```bash
git branch --show-current
```

2. **If on `main` or `master`**:
   - ❌ **NEVER implement directly on main/master**
   - ✅ **ALWAYS create feature branch first**
   - Ask user for branch name with your proposition

3. **Branch naming convention**:
   - Phase branches: `phase-{N}-{short-description}`
   - Subphase branches: `phase-{N}.{M}-{short-description}`
   - Example: `phase-1-core-foundation`, `phase-1.1-project-setup`

### Branch Creation Workflow

```bash
# For main phase
git checkout -b phase-{N}-{description}

# For subphase (from phase branch)
git checkout phase-{N}-{description}
git checkout -b phase-{N}.{M}-{sub-description}
```

### Example Interaction

```
User: "Let's implement the file browser"

Claude: *Checks current branch first*

# Step 1: Check current branch
git branch --show-current
# Output: main

# Step 2: Propose feature branch
Claude: "I see we're on main branch. Before implementing, we need to create a feature branch.

I propose: `phase-1.2-file-browser`

Should I create this branch now?"

User: "Yes"

Claude: *Creates branch and proceeds*
git checkout -b phase-1.2-file-browser
```

---

## 🔴 CRITICAL: Master Plan Updates

### MANDATORY After Every Subphase Completion

**Update `docs/plans/MASTER-PLAN.md`**:

1. Update status in table
2. Fill in started/completed dates
3. Commit master plan updates

### Status Values

- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⚠️ Blocked
- 🔵 In Review

### Example Update

**Before starting Phase 1**:
```markdown
| **Phase 1**: Core Foundation | 🟡 In Progress | phase-1-core-foundation | 2025-11-03 | - | [→ Phase 1](./phase-1-core-foundation.md) |
```

**After completing Phase 1**:
```markdown
| **Phase 1**: Core Foundation | 🟢 Completed | phase-1-core-foundation | 2025-11-03 | 2025-11-15 | [→ Phase 1](./phase-1-core-foundation.md) |
```

---

## 📝 Documentation Standards

### Code Comments

- Add comments for complex logic only
- Use JSDoc for exported functions
- Document assumptions and gotchas
- Keep comments up-to-date

### Commit Messages

**Format**:
```
phase-{N}.{M}: Brief description (50 chars max)

- Bullet point of change
- Another change
- Third change
```

**Examples**:
```bash
git commit -m "phase-1.1: Initialize Next.js project with TypeScript

- Install all core dependencies
- Set up directory structure
- Configure TypeScript and ESLint
- Create type definitions"
```

---

## 🧪 Testing Requirements

### Before Marking Subphase Complete

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Manual testing completed
- [ ] All acceptance criteria met

### Test Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Tests
pnpm test

# All checks
pnpm type-check && pnpm lint && pnpm test
```

---

## 🔄 Merge Strategy

### Subphase → Phase

```bash
# Merge subphase into phase
git checkout phase-{N}-{description}
git merge phase-{N}.{M}-{sub-description}
git push
```

### Phase → Main

```bash
# After ALL subphases complete
git checkout main
git merge phase-{N}-{description}

# OR create Pull Request
gh pr create --title "Phase {N}: {Description}" --base main
```

---

## 🚨 Emergency Procedures

### If Accidentally on Main/Master

```bash
# DON'T PANIC!

# 1. Stash changes
git stash

# 2. Create correct branch
git checkout -b phase-{N}-{description}

# 3. Apply stashed changes
git stash pop

# 4. Continue work
```

### If Need to Switch Phases

```bash
# Commit current work
git add .
git commit -m "WIP: {description}"

# Switch to other phase
git checkout phase-{other}-{description}

# Return later
git checkout phase-{N}-{description}
```

---

## 📚 Reference Documents

- **Master Plan**: `docs/plans/MASTER-PLAN.md`
- **Design Document**: `docs/plans/2025-11-02-claude-manager-design.md`
- **Phase Details**:
  - Phase 1: `docs/plans/phase-1-core-foundation.md`
  - Phase 2: `docs/plans/phase-2-skills-plugins.md`
  - Phase 3: `docs/plans/phase-3-search-mcp.md`
  - Phase 4: `docs/plans/phase-4-polish-testing.md`

---

## ✅ Pre-Implementation Checklist

**EVERY TIME before implementing:**

```
[ ] Checked current branch (not on main/master)
[ ] Read relevant phase document
[ ] Understand current subphase tasks
[ ] Have feature branch created
[ ] Master plan is up-to-date
[ ] Previous tests passing
```

---

**Last Updated**: 2025-11-02
**Next Review**: After Phase 1 completion