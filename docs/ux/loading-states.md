# Loading States Specification

**Phase**: 4.3 (Documentation & Polish)  
**Status**: 🟡 Specification  
**Last Updated**: 2025-11-06

---

## Overview

This document specifies loading state behavior for Claude Code Manager to ensure consistent UX across all async operations.

---

## Loading State Principles

### 1. Delay Before Showing

**Rule**: Don't show loading indicators for operations that complete quickly.

```typescript
const LOADING_DELAY_MS = 200 // Show loading after 200ms
```

**Rationale**: Prevents "flashing" loading states that appear and disappear too quickly, which feels janky.

### 2. Minimum Display Time

**Rule**: Once shown, loading indicators must be visible for at least 500ms.

```typescript
const LOADING_MINIMUM_MS = 500 // Keep loading visible for at least 500ms
```

**Rationale**: Prevents disorienting "blink" where loading appears for just a frame.

### 3. Skeleton Screens

**Rule**: Use skeleton screens for predictable layouts (lists, cards).

**When to use**:
- File browser (loading file tree)
- Skills list (loading skills)
- Search results (loading results)

**When NOT to use**:
- Small operations (save file)
- Unpredictable content size

---

## Loading State Types

### 1. Spinner (Small Operations)

**Use for**:
- Saving files
- Toggling settings
- Quick API calls

**Component**: `<Spinner size="sm" />`

### 2. Progress Bar (Long Operations)

**Use for**:
- Git clone operations
- Large file uploads
- Search indexing

**Component**: `<ProgressBar value={percent} />`

### 3. Skeleton Screens (Lists/Cards)

**Use for**:
- File tree loading
- Skills list loading
- Plugin list loading

**Component**: `<SkeletonCard count={5} />`

### 4. Full-Page Loading

**Use for**:
- Initial app load
- Environment setup wizard

**Component**: `<LoadingScreen />`

---

## Implementation Pattern

```typescript
function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }

    // Delay showing loading indicator
    const timer = setTimeout(() => {
      setShowLoading(true)
    }, LOADING_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isLoading])

  async function handleAction() {
    setIsLoading(true)
    const startTime = Date.now()

    try {
      await performAction()
    } finally {
      // Ensure minimum display time
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, LOADING_MINIMUM_MS - elapsed)
      
      setTimeout(() => {
        setIsLoading(false)
      }, remaining)
    }
  }

  return (
    <div>
      {showLoading && <Spinner />}
      {/* content */}
    </div>
  )
}
```

---

## Loading Messages

### Good Loading Messages

- ✅ "Cloning repository..."
- ✅ "Saving changes..."
- ✅ "Indexing files..."
- ✅ "Testing connection..."

### Bad Loading Messages

- ❌ "Loading..." (too vague)
- ❌ "Please wait..." (no context)
- ❌ "Processing..." (what are we processing?)

---

## Error States

**Rule**: Failed operations should show error state, not just stop loading.

```typescript
// Good
if (error) {
  return <ErrorState message={error.message} onRetry={handleRetry} />
}

// Bad
if (error) {
  setIsLoading(false) // Just stops loading, no feedback
}
```

---

## Accessibility

- Loading states must have `aria-live="polite"` or `aria-busy="true"`
- Screen readers should announce loading state changes
- Loading spinners should have descriptive `aria-label`

```tsx
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading && <Spinner aria-label="Saving file" />}
</div>
```

---

## Testing Checklist

- [ ] Loading appears after 200ms delay
- [ ] Loading visible for at least 500ms
- [ ] No "flashing" on fast operations
- [ ] Skeleton screens match final layout
- [ ] Error states show on failure
- [ ] Screen reader announces loading states
- [ ] Loading messages are descriptive

---

**Related Documents**:
- `docs/ux/accessibility.md` - ARIA requirements
- `docs/performance/benchmarks.md` - Performance targets
- `docs/plans/phase-4-polish-testing.md` - Implementation phase

