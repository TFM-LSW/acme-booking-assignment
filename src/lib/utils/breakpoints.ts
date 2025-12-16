/**
 * Tailwind breakpoints for use in JavaScript
 * Must match the breakpoints defined in Tailwind config
 */
export const breakpoints = {
	sm: '640px',
	md: '768px',
	lg: '1024px',
	xl: '1280px',
	'2xl': '1536px'
} as const;

/**
 * Create a media query matcher for a given breakpoint
 */
export function matchBreakpoint(breakpoint: keyof typeof breakpoints): MediaQueryList {
	return window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`);
}
