/**
 * Reusable Svelte actions for DOM element behavior.
 */

/**
 * Configuration options for the intersection observer action.
 */
export interface IntersectionObserverOptions {
	/** Callback fired when intersection state changes */
	onIntersect: (isIntersecting: boolean) => void;
	/** Threshold at which to trigger the callback (0-1) */
	threshold?: number;
	/** Margin around the root element */
	rootMargin?: string;
	/** Root element for intersection (defaults to viewport) */
	root?: Element | null;
}

/**
 * Svelte action that observes when an element enters or exits the viewport.
 * Useful for sticky headers, lazy loading, scroll animations, etc.
 * 
 * @param node - The DOM element to observe
 * @param options - Configuration for the intersection observer
 * @returns Svelte action lifecycle methods
 * 
 * @example
 * ```svelte
 * <div use:intersectionObserver={{ 
 *   onIntersect: (isVisible) => console.log('Visible:', isVisible),
 *   threshold: 0.1,
 *   rootMargin: '-50px 0px 0px 0px'
 * }}>
 *   Content
 * </div>
 * ```
 */
export function intersectionObserver(node: HTMLElement, options: IntersectionObserverOptions) {
	const { onIntersect, threshold = 0, rootMargin = '0px', root = null } = options;

	const observer = new IntersectionObserver(
		(entries) => {
			onIntersect(entries[0].isIntersecting);
		},
		{
			threshold,
			rootMargin,
			root
		}
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
