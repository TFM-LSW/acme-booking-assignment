import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			exclude: ['node_modules/', 'src/routes/**', '.svelte-kit/']
		}
	},
	resolve: {
		alias: {
			$lib: resolve(dirname(fileURLToPath(import.meta.url)), './src/lib')
		},
		conditions: ['browser']
	}
});
