import type { V3Options } from '@browserbasehq/stagehand';

/**
 * Stagehand configuration for e2e tests
 * 
 * This configuration uses LOCAL environment for testing.
 * For AI-powered testing, you need to provide an API key via environment variable.
 * 
 * Supported API keys (add to .env):
 * - OPENAI_API_KEY (ChatGPT)
 * - GOOGLE_GENERATIVE_AI_API_KEY (Gemini - free tier available)
 * - ANTHROPIC_API_KEY (Claude)
 */

// Auto-detect which API key is available and use appropriate model
const getModel = (): string | undefined => {
	if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
		return 'google/gemini-2.0-flash-exp';
	}
	if (process.env.OPENAI_API_KEY) {
		return 'openai/gpt-4o-mini';
	}
	if (process.env.ANTHROPIC_API_KEY) {
		return 'anthropic/claude-3-5-haiku-latest';
	}
	// No API key found - return undefined (OK for non-AI testing)
	return undefined;
};

export const stagehandConfig: V3Options = {
	env: 'LOCAL',
	localBrowserLaunchOptions: {
		headless: true,
		viewport: { width: 1280, height: 720 }
	},
	model: getModel(),
	verbose: 0,
	enableCaching: true
};

export default stagehandConfig;
