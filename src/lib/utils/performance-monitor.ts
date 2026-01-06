/**
 * Performance monitoring utility for tracking render and computation costs.
 * Use this to measure the impact of optimizations in real-time.
 */

export class PerformanceMonitor {
	private metrics: Map<string, number[]> = new Map();
	private renderCounts: Map<string, number> = new Map();

	/**
	 * Measure the execution time of a function
	 */
	measure(label: string, fn: () => void): void {
		const start = performance.now();
		fn();
		const duration = performance.now() - start;

		if (!this.metrics.has(label)) {
			this.metrics.set(label, []);
		}
		this.metrics.get(label)!.push(duration);
	}

	/**
	 * Track render counts for components
	 */
	trackRender(componentName: string): void {
		const current = this.renderCounts.get(componentName) || 0;
		this.renderCounts.set(componentName, current + 1);
	}

	/**
	 * Get statistics for a specific measurement
	 */
	getStats(label: string) {
		const times = this.metrics.get(label) || [];
		if (times.length === 0) return null;

		const sorted = [...times].sort((a, b) => a - b);
		const sum = times.reduce((a, b) => a + b, 0);

		return {
			count: times.length,
			avg: sum / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.floor(sorted.length * 0.95)],
			total: sum
		};
	}

	/**
	 * Get render count for a component
	 */
	getRenderCount(componentName: string): number {
		return this.renderCounts.get(componentName) || 0;
	}

	/**
	 * Generate a performance report
	 */
	report(): string {
		let output = '\n📊 Performance Report\n';
		output += '═'.repeat(60) + '\n\n';

		// Render counts
		output += '🔄 Component Renders:\n';
		for (const [name, count] of this.renderCounts.entries()) {
			output += `   ${name}: ${count} renders\n`;
		}

		// Timing metrics
		output += '\n⏱️  Timing Metrics:\n';
		for (const [label, times] of this.metrics.entries()) {
			const stats = this.getStats(label);
			if (stats) {
				output += `   ${label}:\n`;
				output += `      Calls: ${stats.count}\n`;
				output += `      Avg: ${stats.avg.toFixed(2)}ms\n`;
				output += `      Min: ${stats.min.toFixed(2)}ms\n`;
				output += `      Max: ${stats.max.toFixed(2)}ms\n`;
				output += `      P95: ${stats.p95.toFixed(2)}ms\n`;
				output += `      Total: ${stats.total.toFixed(2)}ms\n`;
			}
		}

		output += '\n' + '═'.repeat(60) + '\n';
		return output;
	}

	/**
	 * Clear all metrics
	 */
	clear(): void {
		this.metrics.clear();
		this.renderCounts.clear();
	}

	/**
	 * Export metrics as JSON for further analysis
	 */
	export() {
		return {
			metrics: Object.fromEntries(this.metrics),
			renderCounts: Object.fromEntries(this.renderCounts),
			timestamp: new Date().toISOString()
		};
	}
}

// Singleton instance for global use
export const perfMonitor = new PerformanceMonitor();

// Expose to window for debugging in browser console
if (typeof window !== 'undefined') {
	(window as any).__perfMonitor = perfMonitor;
}
