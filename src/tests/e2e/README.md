# E2E Testing with Stagehand

This directory contains end-to-end tests powered by [Stagehand](https://github.com/browserbase/stagehand), an AI-powered browser automation framework built on Playwright.

## Test Modes

Tests support two execution modes:

### 🚀 Standard Mode (Default)

Uses fast Playwright selectors. **No AI API key required.**

```bash
pnpm test:e2e
```

### 🤖 AI Mode

Uses natural language AI actions via Stagehand. **Requires AI API key.**

```bash
pnpm test:e2e:ai
```

**When to use AI Mode:**

- Testing complex interactions that are hard to select
- Natural language test readability
- Dynamic UI where selectors change

**When to use Standard Mode:**

- Fast CI/CD pipelines
- No API quota/cost concerns
- Stable UI with predictable selectors

## What is Stagehand?

Stagehand is a browser automation tool that uses AI to interact with web pages using natural language instructions. It's built on Playwright and provides three main primitives:

- **`act()`** - Perform actions with natural language (e.g., "click the submit button")
- **`extract()`** - Extract structured data from pages using Zod schemas
- **`observe()`** - Discover elements and get suggested actions

## Setup

### 1. Install Dependencies

Dependencies are already installed if you've run `pnpm install`:

```bash
pnpm install
```

### 2. Install Playwright Browsers

Stagehand uses Playwright under the hood, so you need to install the browsers:

```bash
npx playwright install chromium
```

### 3. Configure API Key (Optional for Standard Mode)

**Only required for AI mode** (`pnpm test:e2e:ai`). We recommend Google's Gemini which has a generous free tier.

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then add your API key (choose one):

```env
# Option 1: Google Gemini (Recommended - free tier available)
# Get your key at: https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Option 2: OpenAI (requires paid account)
OPENAI_API_KEY=your_key_here

# Option 3: Anthropic Claude
ANTHROPIC_API_KEY=your_key_here

# Optional: For cloud browser testing
BROWSERBASE_API_KEY=your_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here

# Optional: Base URL for E2E tests (defaults to http://localhost:5173)
# Use this to test against different ports or deployment environments
BASE_URL=http://localhost:5173
```

## Running Tests

### Option 1: Automated (Recommended for CI/CD)

Runs dev server and tests together automatically:

```bash
pnpm test:e2e:ci
```

This uses `concurrently` to start the dev server, wait for it to be ready, run tests, and cleanup.

### Option 2: Manual (For Development)

Run in separate terminals for better control:

```bash
# Terminal 1 - Start dev server
pnpm dev

# Terminal 2 - Run tests
pnpm test:e2e
```

### Run all e2e tests (Standard Mode - No API Key Required)

```bash
pnpm test:e2e
```

### Run with AI actions (Requires API Key)

```bash
pnpm test:e2e:ai
```

### Run e2e tests in UI mode

```bash
pnpm test:e2e:ui
```

### Run specific test file

```bash
pnpm vitest run src/tests/e2e/booking.e2e.test.ts
```

## Test Structure

```
src/tests/e2e/
├── README.md                    # This file
├── stagehand.config.ts          # Stagehand configuration
└── booking.e2e.test.ts          # Booking flow e2e tests
```

## Writing Tests

Here's a basic example:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import { stagehandConfig } from './stagehand.config';

describe('My Feature', () => {
	let stagehand: Stagehand;

	beforeEach(async () => {
		stagehand = new Stagehand(stagehandConfig);
		await stagehand.init();
	});

	afterEach(async () => {
		await stagehand?.close();
	});

	it('should do something', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto('http://localhost:5173/my-page');

		// Use natural language to interact
		await stagehand.act('click the submit button');

		// Extract structured data
		const { title } = await stagehand.extract(
			'extract the page title',
			z.object({
				title: z.string()
			})
		);

		expect(title).toBe('Success');
	});
});
```

## Configuration

The Stagehand configuration is in [`stagehand.config.ts`](./stagehand.config.ts):

```typescript
export const stagehandConfig = {
	env: 'LOCAL', // Run locally (vs BROWSERBASE cloud)
	localBrowserLaunchOptions: {
		headless: true, // Run headless (set to false for debugging)
		viewport: { width: 1280, height: 720 }
	},
	verbose: 1, // Logging level (0-2)
	disablePino: true,
	logger: (line) => console.log(line)
};
```

### Running with Cloud Browsers (Browserbase)

To run tests in the cloud:

1. Get API credentials from [Browserbase](https://browserbase.com/)
2. Update `.env` with your credentials
3. Change `stagehand.config.ts`:

```typescript
export const stagehandConfig = {
	env: 'BROWSERBASE',
	apiKey: process.env.BROWSERBASE_API_KEY,
	projectId: process.env.BROWSERBASE_PROJECT_ID,
	verbose: 1
};
```

## Debugging

### Run with headed browser

In `stagehand.config.ts`, set `headless: false`:

```typescript
localBrowserLaunchOptions: {
  headless: false,  // Browser window will be visible
  viewport: { width: 1280, height: 720 }
}
```

### Increase logging

Set `verbose: 2` for more detailed logs:

```typescript
verbose: 2; // Maximum logging
```

### Use observe() to debug

```typescript
// See what elements Stagehand can see
const elements = await stagehand.observe('What buttons are on this page?');
console.log(elements);
```

## Tips

1. **Start dev server first**: Make sure `pnpm dev` is running before tests
2. **Use longer timeouts**: E2E tests can be slow, use longer timeouts (30s+)
3. **Be specific**: More specific natural language instructions work better
4. **Use Zod schemas**: Type-safe data extraction prevents runtime errors
5. **Wait for state**: Add `page.waitForTimeout()` after actions that trigger state changes

## Resources

- [Stagehand Documentation](https://docs.stagehand.dev/)
- [Stagehand GitHub](https://github.com/browserbase/stagehand)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
