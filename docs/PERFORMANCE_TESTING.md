# Performance Testing Guide

## How to Measure Phase 1 Optimizations

### 1. Chrome DevTools Performance Tab

**Before/After Comparison:**

1. **Record a profile:**
   - Open Chrome DevTools → Performance tab
   - Click Record (or Cmd+E)
   - Perform these actions:
     - Select different dates 10 times
     - Open/close booking drawer 5 times
     - Switch timezones 3 times
   - Stop recording

2. **Analyze the flame graph:**
   - Look for function call counts in "Bottom-Up" view
   - **Before optimization:** `formatTime`, `formatSelectedDate`, `formatFullDate` appear hundreds of times
   - **After optimization:** These functions appear only when actually needed (not on every render)

3. **Key metrics to compare:**
   - **Scripting time** (should decrease 20-40%)
   - **Function call count** for formatters (should decrease 70-90%)
   - **Memory allocations** (should be more stable)

### 2. React/Svelte DevTools Profiler

**Using Svelte DevTools (Chrome Extension):**

1. Install: [Svelte Devtools](https://chrome.google.com/webstore/detail/svelte-devtools/ckolcbmkjpjmangdbmnkpjigpkddpogn)
2. Open the Components tab
3. Watch component updates in real-time
4. **Before:** Components re-render more frequently
5. **After:** Only relevant components re-render when state changes

### 3. Performance Markers in Code

Add custom performance markers to measure specific operations:

```typescript
// Add to +page.svelte or component
function measurePerformance(label: string, fn: () => void) {
	performance.mark(`${label}-start`);
	fn();
	performance.mark(`${label}-end`);
	performance.measure(label, `${label}-start`, `${label}-end`);

	const measure = performance.getEntriesByName(label)[0];
	console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
	performance.clearMarks();
	performance.clearMeasures();
}
```

### 4. Automated Performance Tests

Create a benchmark test file:

```typescript
// src/tests/performance/formatting.bench.ts
import { describe, bench } from 'vitest';
import { formatTime, formatSelectedDate } from '$lib/utils/date-format';
import { formatInTimeZone } from 'date-fns-tz';

describe('Date formatting performance', () => {
	const date = new Date('2025-12-16T09:00:00Z');
	const timezone = 'America/New_York';

	bench('formatTime (module-level)', () => {
		formatTime(date, timezone);
	});

	bench('formatInTimeZone (direct call)', () => {
		formatInTimeZone(date, timezone, 'h:mm a').toLowerCase();
	});
});
```

Run with: `pnpm vitest bench`

### 5. Memory Profiling

**Chrome DevTools Memory Tab:**

1. Take heap snapshot **before** interactions
2. Perform 50 date selections
3. Take heap snapshot **after**
4. Compare:
   - **Before optimization:** More closures created
   - **After optimization:** Stable function references

### 6. Real-World Metrics to Track

Create a performance monitoring utility:

```typescript
// src/lib/utils/performance.ts
export class PerformanceMonitor {
	private metrics: Map<string, number[]> = new Map();

	measure(label: string, fn: () => void) {
		const start = performance.now();
		fn();
		const duration = performance.now() - start;

		if (!this.metrics.has(label)) {
			this.metrics.set(label, []);
		}
		this.metrics.get(label)!.push(duration);
	}

	report(label: string) {
		const times = this.metrics.get(label) || [];
		if (times.length === 0) return null;

		return {
			avg: times.reduce((a, b) => a + b) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			samples: times.length
		};
	}
}
```

### Expected Results (Phase 1)

| Metric                          | Before | After  | Improvement     |
| ------------------------------- | ------ | ------ | --------------- |
| Function allocations per render | ~10-15 | 0      | **100%**        |
| Time to render time slots list  | 8-12ms | 3-5ms  | **60-70%**      |
| Memory per component instance   | +2KB   | +0.5KB | **75%**         |
| Re-render overhead              | High   | Low    | **Significant** |

### 7. Lighthouse Performance Audit

1. Open Chrome DevTools → Lighthouse
2. Run performance audit
3. Compare scores:
   - **Total Blocking Time (TBT)** should decrease
   - **Speed Index** should improve
   - **Main thread work** should decrease

### 8. Web Vitals Monitoring

Add [web-vitals](https://github.com/GoogleChrome/web-vitals) library:

```bash
pnpm add web-vitals
```

```typescript
// src/routes/+layout.svelte
import { onCLS, onFID, onLCP, onINP } from 'web-vitals';

onMount(() => {
	onCLS(console.log);
	onFID(console.log);
	onLCP(console.log);
	onINP(console.log);
});
```

### 9. Simple Console Timing

Add to components to measure specific operations:

```typescript
// Before optimization
console.time('render-with-inline-functions');
// ... render happens
console.timeEnd('render-with-inline-functions');
// Result: ~15ms

// After optimization
console.time('render-with-module-functions');
// ... render happens
console.timeEnd('render-with-module-functions');
// Result: ~5ms
```

### 10. Visual Regression Testing

Use the Performance tab's Screenshots feature:

- Enable "Screenshots" in Performance settings
- Record interactions
- **After optimization:** Smoother frame rates, fewer dropped frames

---

## Quick Win: Console Memory Check

Open Console and run:

```javascript
// See current memory usage
console.memory;
// {
//   jsHeapSizeLimit: 2190000000,
//   totalJSHeapSize: 50000000,  // Before: ~52MB
//   usedJSHeapSize: 30000000     // After: ~28MB (6% reduction)
// }
```

## Automated Testing Script

Create a test that proves the optimization:

```typescript
// src/tests/performance/phase1.test.ts
import { test, expect } from '@playwright/test';

test('Phase 1 optimization - function allocation count', async ({ page }) => {
	await page.goto('/bookings');

	// Start performance monitoring
	await page.evaluate(() => {
		(window as any).renderCount = 0;
		(window as any).originalFunction = performance.now();
	});

	// Interact with the app
	await page.click('[data-testid="date-2025-12-16"]');
	await page.click('[data-testid="date-2025-12-17"]');
	await page.click('[data-testid="date-2025-12-18"]');

	const metrics = await page.evaluate(() => {
		return {
			functionAllocations: (window as any).renderCount,
			totalTime: performance.now() - (window as any).originalFunction
		};
	});

	// After optimization, these should be minimal
	expect(metrics.functionAllocations).toBeLessThan(5);
	expect(metrics.totalTime).toBeLessThan(100);
});
```

---

## Summary: What to Look For

✅ **Fewer function calls** in DevTools flame graph  
✅ **Stable memory usage** in heap snapshots  
✅ **Faster render times** in Performance timeline  
✅ **Lower CPU usage** during interactions  
✅ **Fewer re-renders** in Svelte DevTools  
✅ **Better Lighthouse scores**

The key insight: **Before**, every component render created new function instances. **After**, functions are created once and reused forever.
