<script lang="ts">
	import { onMount } from 'svelte';
	import { perfMonitor } from '$lib/utils/performance-monitor';

	/**
	 * Performance monitor component - displays real-time performance metrics
	 * Add this to your layout to see optimization impact in development
	 */

	let showMonitor = $state(false);
	let report = $state('');

	onMount(() => {
		// Show/hide with keyboard shortcut: Ctrl+Shift+P
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				showMonitor = !showMonitor;
				if (showMonitor) {
					updateReport();
				}
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	});

	function updateReport() {
		report = perfMonitor.report();
	}

	function clearMetrics() {
		perfMonitor.clear();
		updateReport();
	}

	function downloadMetrics() {
		const data = perfMonitor.export();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `performance-metrics-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

{#if showMonitor}
	<div
		class="fixed bottom-4 right-4 z-[9999] w-[600px] rounded-lg border-2 border-blue-500 bg-gray-900 p-4 font-mono text-xs text-white shadow-2xl"
	>
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
				<h3 class="font-bold text-green-400">Performance Monitor</h3>
			</div>
			<div class="flex gap-2">
				<button
					onclick={updateReport}
					class="rounded bg-blue-600 px-2 py-1 hover:bg-blue-700"
					title="Refresh report"
				>
					🔄 Refresh
				</button>
				<button
					onclick={clearMetrics}
					class="rounded bg-yellow-600 px-2 py-1 hover:bg-yellow-700"
					title="Clear metrics"
				>
					🗑️ Clear
				</button>
				<button
					onclick={downloadMetrics}
					class="rounded bg-green-600 px-2 py-1 hover:bg-green-700"
					title="Download as JSON"
				>
					💾 Export
				</button>
				<button
					onclick={() => (showMonitor = false)}
					class="rounded bg-red-600 px-2 py-1 hover:bg-red-700"
					title="Close (Ctrl+Shift+P)"
				>
					✕
				</button>
			</div>
		</div>

		<div class="max-h-[500px] overflow-auto rounded bg-black p-3">
			{#if report}
				<pre class="whitespace-pre">{report}</pre>
			{:else}
				<p class="text-gray-400">No metrics collected yet. Interact with the app to see data.</p>
			{/if}
		</div>

		<div class="mt-2 text-[10px] text-gray-400">
			Press <kbd class="rounded bg-gray-700 px-1">Ctrl+Shift+P</kbd> to toggle • Phase 1 Optimization
			Monitoring
		</div>
	</div>
{/if}
