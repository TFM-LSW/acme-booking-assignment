import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'node', // E2E tests run in node, not jsdom
		include: ['src/tests/e2e/**/*.{test,spec}.{js,ts}'],
		testTimeout: 30000, // E2E tests need longer timeout
		hookTimeout: 30000
	},
	resolve: {
		alias: {
			$lib: resolve(dirname(fileURLToPath(import.meta.url)), './src/lib')
		}
	}
});
