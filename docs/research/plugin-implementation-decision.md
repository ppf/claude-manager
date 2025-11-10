# Plugin Implementation Decision

**Date**: 2025-11-08
**Based on**: Phase 0.3 Research
**Decision**: Scenario B - Simplified Implementation

---

## Findings Summary

Based on Phase 0.3 research:

- ✅ **Plugins exist** and are in Public Beta (October 2025)
- **Plugins = Skills**: Same infrastructure, same `~/.claude/skills/` directory
- **No separate plugin system**: Everything uses `SKILL.md` format
- **Terminology varies**: CLI uses `/plugin` commands but installs to `skills/`
- **Key distinction**: Skills auto-activate, commands require `/command` trigger

---

## Decision

- [x] **Scenario B: Simplified Implementation**
- [ ] Scenario A: Full Implementation
- [ ] Scenario C: Defer to Post-MVP

---

## Rationale

1. **Plugins = Skills**: No need for separate infrastructure
2. **Reuse existing code**: Skills service, API, and UI already handle everything
3. **UI differentiation**: Create a "Plugins" view that filters/displays skills differently
4. **Commands support**: Add optional commands/ directory support in future
5. **Time efficient**: 4-6 hours instead of 2-3 days

---

## Implementation Plan

### What We'll Build (4-6 hours)

1. **Plugin Page** (`app/plugins/page.tsx`):
   - Display skills with "plugin" tag or those containing commands
   - Filter view: Show all skills but emphasize command-based ones
   - Reuse existing SkillCard component with different styling
   - Add "Commands" badge for skills with slash commands

2. **No New API Routes**:
   - Reuse `/api/skills/*` endpoints
   - Add `?type=plugin` or `?hasCommands=true` query param
   - Filter logic in existing skills-service.ts

3. **Minor UI Additions**:
   - Badge component to show "Commands Available"
   - Filter toggle: "All Skills" vs "Command Skills" vs "Auto Skills"
   - Link from Plugins page to Skills page for full management

### What We Won't Build

- ❌ Separate `/api/plugins/*` endpoints
- ❌ Separate plugin directory (`~/.claude/plugins/`)
- ❌ Plugin-specific configuration
- ❌ Marketplace integration (use skills marketplace)
- ❌ Commands directory support (defer to Phase 3 or post-MVP)

### File Changes

**New Files**:
- `app/plugins/page.tsx` - Plugin view (simplified skills list)
- `components/plugins/PluginCard.tsx` - Optional: Specialized card for command display

**Modified Files**:
- `lib/api/skills-service.ts` - Add command detection helper
- `types/claude-config.ts` - Add `hasCommands` boolean to Skill type

---

## Plugin Configuration

Since plugins use the same structure as skills:

- **Location**: `~/.claude/skills/{skill-id}/`
- **Config**: Same `SKILL.md` frontmatter
- **Enable/Disable**: Same as skills (frontmatter or settings)
- **Commands**: Detected by parsing `SKILL.md` for `/command` patterns

---

## Timeline Impact

**Original Phase 2.3**: 2-3 days  
**Simplified Implementation**: 4-6 hours  
**Time Saved**: ~1.5 days

This allows us to:
- Complete Phase 2.3 faster
- Move to Phase 3 (Search & MCP) sooner
- Add commands/ directory support in Phase 3 if needed

---

## Future Enhancements (Post-MVP)

1. **Commands Directory**: Support `~/.claude/commands/` for standalone commands
2. **Command Palette**: UI to browse/execute commands
3. **Command Editor**: Specialized editor for `.md` command files
4. **Command Templates**: Quick-create common command patterns
5. **Command Testing**: Test runner for commands

---

## Acceptance Criteria (Simplified)

For Phase 2.3 to be complete:

- ✅ Plugins page exists and shows skills
- ✅ Can filter/view skills with commands
- ✅ Badge shows "Commands Available" for relevant skills
- ✅ Can click through to full skill management
- ✅ Documentation updated
- ✅ No separate plugin infrastructure needed

---

**Status**: Ready to implement ✅



