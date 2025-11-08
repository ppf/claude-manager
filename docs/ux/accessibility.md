# Accessibility Requirements

**Goal**: WCAG 2.1 Level AA Compliance

## Keyboard Navigation

### Requirements

- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order (top to bottom, left to right)
- Skip navigation links for long content
- Escape key closes dialogs and modals

### Implementation Checklist

- [ ] All buttons and links keyboard accessible
- [ ] Form inputs navigable via Tab
- [ ] Modal dialogs trap focus
- [ ] Escape closes dialogs
- [ ] Tab order is logical
- [ ] Focus indicators visible and clear

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Next element |
| Shift+Tab | Previous element |
| Enter | Activate button/link |
| Space | Toggle checkbox/switch |
| Escape | Close dialog/modal |
| Cmd/Ctrl+S | Save file |
| Cmd/Ctrl+K | Open search |
| Cmd/Ctrl+N | New skill |
| Alt+1/2/3/4 | Navigate sections |

## Screen Reader Support

### Requirements

- All non-text content has text alternatives
- ARIA labels on all icons and icon-only buttons
- ARIA live regions for dynamic content
- Semantic HTML structure
- Proper heading hierarchy

### Implementation

```tsx
// Good: Icon button with ARIA label
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Good: Loading state with ARIA
<div role="status" aria-live="polite">
  <span className="sr-only">Loading...</span>
  <Spinner />
</div>

// Good: Form input with label
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### ARIA Labels Checklist

- [ ] All icon-only buttons have `aria-label`
- [ ] All form inputs have associated labels
- [ ] Dynamic content has `aria-live` regions
- [ ] Loading states have `aria-busy`
- [ ] Error messages have `aria-invalid` and `aria-describedby`

## Color and Contrast

### Requirements

- Minimum contrast ratio: 4.5:1 for text
- Minimum contrast ratio: 3:1 for large text (18pt+)
- Don't rely on color alone to convey information
- Support for high contrast mode

### Implementation

```css
/* Good: Sufficient contrast */
.text-primary {
  color: #1a1a1a; /* Dark text on light background */
}

/* Good: Visual indicator beyond color */
.error-input {
  border-color: red;
  border-width: 2px; /* Width indicates error */
}
```

### Contrast Checklist

- [ ] Text meets 4.5:1 contrast ratio
- [ ] Large text meets 3:1 contrast ratio
- [ ] Interactive elements have clear focus states
- [ ] Error states use more than just color
- [ ] Test with high contrast mode

## Focus Management

### Requirements

- Focus visible at all times
- Focus moves logically
- Focus not lost during operations
- Modal dialogs trap focus

### Implementation

```tsx
// Focus trap in dialog
<Dialog onOpenChange={setOpen}>
  <DialogContent onEscapeKeyDown={() => setOpen(false)}>
    {/* Focus trapped within dialog */}
  </DialogContent>
</Dialog>

// Restore focus after operation
function handleSave() {
  const currentFocus = document.activeElement
  await save()
  currentFocus?.focus()
}
```

### Focus Checklist

- [ ] All focusable elements have visible focus indicator
- [ ] Focus moves in logical order
- [ ] Dialogs trap focus
- [ ] Focus restored after modal closes
- [ ] No keyboard traps (unless intentional)

## Testing

### Manual Testing

1. **Keyboard Navigation**:
   - Tab through entire interface
   - Verify all interactive elements reachable
   - Check focus indicators visible
   - Test keyboard shortcuts

2. **Screen Reader Testing**:
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content announced
   - Check ARIA labels correct
   - Test form inputs

3. **Contrast Testing**:
   - Use browser DevTools contrast checker
   - Test with high contrast mode
   - Verify color-blind friendly

### Automated Testing

```bash
# Install axe DevTools extension
# Run accessibility audit in Chrome DevTools

# Or use automated testing
pnpm test:a11y
```

### Tools

- **Browser Extensions**:
  - axe DevTools
  - WAVE
  - Lighthouse

- **Screen Readers**:
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (Mac)

- **Contrast Checkers**:
  - WebAIM Contrast Checker
  - Chrome DevTools Contrast Ratio

## Common Patterns

### Button

```tsx
// Accessible button
<button
  type="button"
  aria-label="Delete item"
  onClick={handleDelete}
>
  <Trash className="h-4 w-4" />
</button>
```

### Form Input

```tsx
// Accessible form input
<div>
  <label htmlFor="username" className="block mb-2">
    Username
  </label>
  <input
    id="username"
    type="text"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "username-error" : undefined}
  />
  {hasError && (
    <p id="username-error" className="text-red-500">
      Username is required
    </p>
  )}
</div>
```

### Loading State

```tsx
// Accessible loading state
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? (
    <>
      <span className="sr-only">Loading content...</span>
      <Spinner />
    </>
  ) : (
    <Content />
  )}
</div>
```

### Modal Dialog

```tsx
// Accessible modal
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
    <DialogDescription id="dialog-description">
      Are you sure you want to continue?
    </DialogDescription>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
