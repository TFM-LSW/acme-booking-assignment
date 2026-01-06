<script lang="ts">
	import './layout.css';
	import { dev } from '$app/environment';
	import PerformanceMonitor from '$lib/components/dev/PerformanceMonitor.svelte';

	let { children } = $props();
</script>

{@render children()}

{#if dev}
	<PerformanceMonitor />
{/if}
