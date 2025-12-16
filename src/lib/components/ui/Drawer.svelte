<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { matchBreakpoint } from '$lib/utils/breakpoints';

	interface Props {
		/**
		 * Whether the drawer is open
		 */
		open: boolean;
		/**
		 * Drawer title
		 */
		title?: string;
		/**
		 * Callback to close the drawer
		 */
		onClose: () => void;
		/**
		 * Children content
		 */
		children?: any;
		/**
		 * Footer content (optional)
		 */
		footer?: any;
	}

	let { open, title, onClose, children, footer }: Props = $props();

	/**
	 * Detect if screen is mobile (< Tailwind's sm breakpoint)
	 */
	let isMobile = $state(false);

	$effect(() => {
		const checkMobile = () => {
			isMobile = !matchBreakpoint('sm').matches;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	/**
	 * Close drawer when clicking the backdrop
	 */
	function handleBackdropClick() {
		onClose();
	}

	/**
	 * Prevent clicks inside drawer from closing it
	 */
	function handleDrawerClick(e: MouseEvent) {
		e.stopPropagation();
	}

	/**
	 * Handle escape key to close drawer
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/50"
		transition:fade={{ duration: 300 }}
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- Drawer -->
		<div
			class="bg-background fixed z-50 flex w-full flex-col overflow-y-auto shadow-2xl sm:inset-y-0 sm:right-0 sm:max-w-md"
			class:inset-x-0={isMobile}
			class:bottom-0={isMobile}
			class:rounded-t-2xl={isMobile}
			transition:fly={isMobile
				? { y: '100%', duration: 300, opacity: 1 }
				: { x: '100%', duration: 300, opacity: 1 }}
			onclick={handleDrawerClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'drawer-title' : undefined}
		>
			<!-- Header -->
			{#if title}
				<div
					class="bg-background border-border sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3"
				>
					<h2 id="drawer-title" class="text-lg font-semibold">{title}</h2>
					<button
						type="button"
						onclick={onClose}
						class="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
						aria-label="Close"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 p-6">
				{@render children?.()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="border-border bg-background sticky bottom-0 border-t p-4">
					{@render footer?.()}
				</div>
			{/if}
		</div>
	</div>
{/if}
