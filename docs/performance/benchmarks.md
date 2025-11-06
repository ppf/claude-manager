# Performance Benchmarks

**Phase**: 4.3 (Documentation & Polish)  
**Status**: 🟡 Specification  
**Last Updated**: 2025-11-06

---

## Overview

This document defines performance targets and measurement criteria for Claude Code Manager.

---

## Performance Targets

### Page Load

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.0s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.0s | Lighthouse |
| Total Blocking Time (TBT) | < 300ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |

### API Response Times

| Operation | Target | Notes |
|-----------|--------|-------|
| Read config file | < 50ms | Small files (< 100KB) |
| Save config file | < 100ms | Includes write + fsync |
| List skills | < 100ms | Up to 100 skills |
| Search query | < 100ms | Full-text search |
| Git clone | < 5s | Small repos (< 10MB) |
| Index rebuild | < 2s | ~100 files |

### UI Responsiveness

| Interaction | Target | Notes |
|-------------|--------|-------|
| Button click feedback | < 100ms | Visual feedback |
| File tree expansion | < 50ms | Render children |
| Editor typing latency | < 50ms | Monaco performance |
| Search debounce | 300ms | After last keystroke |
| Auto-save debounce | 2000ms | After last edit |

---

## Bundle Size

### JavaScript Bundles

| Bundle | Target | Current | Notes |
|--------|--------|---------|-------|
| Initial JS | < 200KB | TBD | Gzipped |
| Monaco Editor | < 500KB | ~450KB | Lazy loaded |
| Total JS | < 800KB | TBD | All bundles |

### Optimization Strategies

1. **Code Splitting**: Lazy load Monaco, search, and other heavy components
2. **Tree Shaking**: Remove unused code from dependencies
3. **Dynamic Imports**: Load features on demand
4. **Bundle Analysis**: Use `@next/bundle-analyzer`

```bash
# Analyze bundle
ANALYZE=true pnpm build
```

---

## Database Performance

### SQLite Search Index

| Operation | Target | Notes |
|-----------|--------|-------|
| Full-text search | < 100ms | FTS5 index |
| Index single file | < 10ms | Incremental update |
| Rebuild entire index | < 2s | ~100 files |
| Database size | < 10MB | For ~100 files |

### Optimization

- Use FTS5 for full-text search (faster than FTS4)
- Index incrementally (don't rebuild on every change)
- Exclude binary files from indexing
- Limit indexed content size (first 10KB per file)

---

## Memory Usage

### Target

| Metric | Target | Notes |
|--------|--------|-------|
| Idle memory | < 100MB | No files open |
| With editor | < 200MB | One file open |
| Peak memory | < 500MB | Heavy operations |

### Monitoring

```typescript
// Check memory usage in dev
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage()
    console.log('Memory:', Math.round(usage.heapUsed / 1024 / 1024), 'MB')
  }, 5000)
}
```

---

## Caching Strategy

### What to Cache

1. **Marketplace data**: 24 hours (configurable)
2. **File tree structure**: Until file watcher detects change
3. **Search results**: 5 minutes
4. **Git repository info**: Until manual refresh

### Cache Implementation

```typescript
// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>()

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  if (Date.now() > cached.expires) {
    cache.delete(key)
    return null
  }
  return cached.data
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  })
}
```

---

## Lazy Loading

### Components to Lazy Load

```typescript
// Monaco Editor (large bundle)
const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false,
})

// Search (only needed when searching)
const SearchDialog = dynamic(() => import('@/components/search/SearchDialog'))

// MCP Manager (only needed on MCP page)
const MCPManager = dynamic(() => import('@/components/mcp/MCPManager'))
```

---

## Performance Monitoring

### Development

```typescript
// Measure operation timing
console.time('search')
await performSearch(query)
console.timeEnd('search')
```

### Production (Optional)

Consider adding performance monitoring:
- Web Vitals tracking
- Custom performance marks
- Error rate monitoring

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  // Send to your analytics service
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

---

## Testing Performance

### Lighthouse CI

```bash
# Run Lighthouse
pnpm dlx @lhci/cli@latest autorun
```

### Load Testing

```bash
# Test API endpoints with autocannon
pnpm add -D autocannon

autocannon -c 10 -d 10 http://localhost:3000/api/configs
```

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm build
```

---

## Performance Checklist

### Before Release

- [ ] Lighthouse score > 90 (all categories)
- [ ] Bundle size < 800KB (gzipped)
- [ ] All API calls < 100ms (except git operations)
- [ ] Search < 100ms for typical queries
- [ ] No memory leaks (test with long sessions)
- [ ] File watcher doesn't impact performance
- [ ] Monaco loads in < 1s
- [ ] No layout shifts (CLS < 0.1)

### Optimization Techniques Applied

- [ ] Code splitting for large components
- [ ] Lazy loading for Monaco and search
- [ ] Image optimization (if any)
- [ ] Bundle analysis run and reviewed
- [ ] Debouncing for search and auto-save
- [ ] Caching for marketplace and search
- [ ] Incremental search indexing
- [ ] SQLite FTS5 for fast search

---

## Performance Regression Prevention

### CI Checks

Add performance checks to CI:

```yaml
# .github/workflows/performance.yml
name: Performance
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm dlx @lhci/cli@latest autorun
```

---

## Troubleshooting

### Slow Search

1. Check index size: `SELECT COUNT(*) FROM search_index`
2. Verify FTS5 is being used: `EXPLAIN QUERY PLAN SELECT ...`
3. Limit indexed content size
4. Exclude binary files

### Large Bundle

1. Run bundle analyzer: `ANALYZE=true pnpm build`
2. Check for duplicate dependencies
3. Ensure tree shaking is working
4. Lazy load heavy components

### Memory Leaks

1. Use Chrome DevTools Memory Profiler
2. Check for event listener cleanup
3. Verify file watcher cleanup
4. Test long-running sessions

---

**Related Documents**:
- `docs/ux/loading-states.md` - Loading state patterns
- `docs/ux/accessibility.md` - Accessibility targets
- `docs/plans/phase-4-polish-testing.md` - Implementation phase

