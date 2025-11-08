# Accessibility Specification

**Phase**: 4.3 (Documentation & Polish)  
**Status**: 🟡 Specification  
**Target**: WCAG 2.1 Level AA  
**Last Updated**: 2025-11-06

---

## Overview

Claude Code Manager aims for WCAG 2.1 Level AA compliance to ensure the application is accessible to all users.

---

## Accessibility Targets

### WCAG 2.1 Level AA Compliance

**Target**: 100% compliance with WCAG 2.1 Level AA  
**Testing**: Manual and automated (axe-core, Lighthouse)

---

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+S` | Save current file |
| `Cmd/Ctrl+K` | Open search |
| `Cmd/Ctrl+N` | New skill |
| `Escape` | Close dialog/modal |
| `Alt+1` | Navigate to Configs |
| `Alt+2` | Navigate to Skills |
| `Alt+3` | Navigate to Plugins |
| `Alt+4` | Navigate to MCP |

### Component-Specific

- **File Tree**: Arrow keys for navigation, Enter to open
- **Editor**: Standard Monaco keyboard shortcuts
- **Dialogs**: Tab to navigate, Escape to close
- **Buttons**: Space or Enter to activate
- **Links**: Enter to follow

### Focus Management

```typescript
// Good: Trap focus in dialogs
<Dialog onOpenChange={(open) => {
  if (open) {
    // Focus first focusable element
    dialogRef.current?.querySelector('button, input')?.focus()
  }
}}>
```

---

## Screen Reader Support

### ARIA Labels

**Rule**: All interactive elements must have accessible names.

```tsx
// Good
<button aria-label="Save file">
  <SaveIcon />
</button>

// Bad
<button>
  <SaveIcon />
</button>
```

### ARIA Live Regions

**Rule**: Dynamic content changes must be announced.

```tsx
// Toast notifications
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>

// Loading states
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>
```

### Semantic HTML

**Rule**: Use semantic HTML elements when possible.

```tsx
// Good
<nav>
  <ul>
    <li><a href="/configs">Configs</a></li>
  </ul>
</nav>

// Bad
<div>
  <div onClick={() => navigate('/configs')}>Configs</div>
</div>
```

---

## Color and Contrast

### Contrast Ratios

**Minimum contrast ratios** (WCAG 2.1 Level AA):
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

### Color Independence

**Rule**: Never rely on color alone to convey information.

```tsx
// Good: Icon + color
<Alert variant="error">
  <AlertCircle className="text-red-500" />
  <span>Error: File not found</span>
</Alert>

// Bad: Color only
<span className="text-red-500">Error</span>
```

---

## Form Accessibility

### Labels

**Rule**: All form inputs must have associated labels.

```tsx
// Good
<label htmlFor="skill-name">Skill Name</label>
<input id="skill-name" type="text" />

// Also good (implicit)
<label>
  Skill Name
  <input type="text" />
</label>
```

### Error Messages

**Rule**: Error messages must be programmatically associated with inputs.

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

### Required Fields

```tsx
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" required aria-required="true" />
```

---

## Focus Indicators

### Visible Focus

**Rule**: All focusable elements must have visible focus indicators.

```css
/* Good: Custom focus ring */
.btn:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Bad: Removing focus outline */
.btn:focus {
  outline: none; /* Never do this without replacement */
}
```

### Skip Links

**Rule**: Provide skip links for keyboard users.

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

---

## Images and Icons

### Alt Text

**Rule**: All images must have alt text (or empty alt for decorative images).

```tsx
// Informative image
<img src="skill-icon.png" alt="Brainstorming skill icon" />

// Decorative image
<img src="decoration.png" alt="" />

// Icon with adjacent text
<button>
  <SaveIcon aria-hidden="true" />
  Save
</button>
```

---

## Modals and Dialogs

### Focus Trap

**Rule**: Focus must be trapped within open modals.

```tsx
import { Dialog } from '@radix-ui/react-dialog'

<Dialog>
  <DialogContent>
    {/* Focus automatically trapped */}
  </DialogContent>
</Dialog>
```

### Close Mechanisms

**Rule**: Modals must have multiple ways to close (X button, Escape key, backdrop click).

---

## Testing Checklist

### Automated Testing

- [ ] Run axe-core accessibility tests
- [ ] Lighthouse accessibility score > 95
- [ ] No automatic WCAG violations

### Manual Testing

- [ ] Navigate entire app with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify all interactive elements are focusable
- [ ] Check color contrast ratios
- [ ] Test with browser zoom at 200%
- [ ] Verify focus indicators are visible
- [ ] Test skip links work
- [ ] Verify ARIA labels are descriptive

### Screen Reader Testing

**Test with**:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- TalkBack (Android, if mobile support added)

---

## Common Pitfalls

### ❌ Don't

- Remove focus outlines without replacement
- Use `div` or `span` as buttons without proper ARIA
- Rely on color alone for information
- Use placeholder as label replacement
- Auto-play audio/video
- Use `tabindex` > 0

### ✅ Do

- Use semantic HTML
- Provide keyboard alternatives for all mouse actions
- Include ARIA labels for icon-only buttons
- Test with actual assistive technology
- Provide text alternatives for non-text content
- Ensure sufficient color contrast

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Related Documents**:
- `docs/ux/loading-states.md` - Loading state patterns
- `docs/plans/phase-4-polish-testing.md` - Implementation phase

