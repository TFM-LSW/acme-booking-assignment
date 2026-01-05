import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import { stagehandConfig } from './stagehand.config';
/**
 * End-to-end tests for the booking application
 *
 * Supports two modes:
 * - USE_AI_ACTIONS=false: Fast, quota-free Playwright selectors (default)
 * - USE_AI_ACTIONS=true: AI-powered natural language actions (requires API key)
 *
 * Toggle via environment variable:
 * USE_AI_ACTIONS=true pnpm test:e2e
 */

const USE_AI_ACTIONS = process.env.USE_AI_ACTIONS === 'true';
const BASE_URL = process.env.BASE_URL && process.env.BASE_URL.startsWith('http') 
	? process.env.BASE_URL 
	: 'http://localhost:5173';

/**
 * Type for page objects that support evaluate (works with both Playwright and Stagehand pages)
 */
type EvaluablePage = {
	evaluate: (fn: () => boolean | Promise<boolean>) => Promise<boolean>;
};

/**
 * Helper function to wait for a condition to be true
 * This polls the condition and returns as soon as it's met, rather than waiting a fixed duration
 */
async function waitForCondition(
	page: EvaluablePage,
	condition: () => boolean | Promise<boolean>,
	options: { timeout?: number; pollInterval?: number } = {}
): Promise<void> {
	const { timeout = 10000, pollInterval = 100 } = options;
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		const result = await page.evaluate(condition);
		if (result) return;
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Helper functions that switch between AI and standard selectors
 */
const helpers = {
	/**
	 * Click on an available date in the calendar
	 */
	async clickAvailableDate(stagehand: Stagehand) {
		if (USE_AI_ACTIONS) {
			await stagehand.act('click on an available date in the calendar');
		} else {
			const page = stagehand.context.pages()[0];
			// Find an enabled button with a number (date button)
			await page.evaluate(() => {
				const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
				for (const button of buttons) {
					if (button.textContent && /^\d+$/.test(button.textContent.trim())) {
						(button as HTMLButtonElement).click();
						break;
					}
				}
			});
		}
	},

	/**
	 * Click on a time slot
	 */
	async clickTimeSlot(stagehand: Stagehand) {
		if (USE_AI_ACTIONS) {
			await stagehand.act('click on the first available time slot');
		} else {
			const page = stagehand.context.pages()[0];
			await page.evaluate(() => {
				const buttons = Array.from(document.querySelectorAll('button'));
				for (const button of buttons) {
					if (button.textContent && /\d+:\d+/.test(button.textContent)) {
						button.click();
						break;
					}
				}
			});
		}
	},

	/**
	 * Check if page heading contains "book"
	 */
	async getHeading(stagehand: Stagehand): Promise<string> {
		if (USE_AI_ACTIONS) {
			const { heading } = await stagehand.extract(
				'extract the main heading of the page',
				z.object({ heading: z.string() })
			);
			return heading;
		} else {
			const page = stagehand.context.pages()[0];
			return await page.evaluate(() => {
				return document.querySelector('h1')?.textContent || '';
			});
		}
	},

	/**
	 * Count available dates
	 */
	async countAvailableDates(stagehand: Stagehand): Promise<number> {
		if (USE_AI_ACTIONS) {
			const { availableDates } = await stagehand.extract(
				'count dates that have availability',
				z.object({ availableDates: z.number() })
			);
			return availableDates;
		} else {
			const page = stagehand.context.pages()[0];
			return await page.evaluate(() => {
				const buttons = Array.from(document.querySelectorAll('button'));
				return buttons.filter((b) => b.textContent && /^\d+$/.test(b.textContent.trim())).length;
			});
		}
	},

	/**
	 * Check if time slots are visible
	 */
	async areTimeSlotsVisible(stagehand: Stagehand): Promise<boolean> {
		if (USE_AI_ACTIONS) {
			const { timeSlotsVisible } = await stagehand.extract(
				'check if time slots are visible',
				z.object({ timeSlotsVisible: z.boolean() })
			);
			return timeSlotsVisible;
		} else {
			const page = stagehand.context.pages()[0];
			return await page.evaluate(() => {
				const buttons = Array.from(document.querySelectorAll('button'));
				return buttons.some((b) => b.textContent && /\d+:\d+/.test(b.textContent));
			});
		}
	},

	/**
	 * Check if drawer/form is visible
	 */
	async isDrawerVisible(stagehand: Stagehand): Promise<boolean> {
		if (USE_AI_ACTIONS) {
			const { drawerVisible } = await stagehand.extract(
				'check if booking form or drawer is visible',
				z.object({ drawerVisible: z.boolean() })
			);
			return drawerVisible;
		} else {
			const page = stagehand.context.pages()[0];
			return await page.evaluate(() => {
				const nameInput = document.querySelector('input[type="text"]');
				return nameInput !== null && window.getComputedStyle(nameInput).display !== 'none';
			});
		}
	},

	/**
	 * Navigate to next month
	 */
	async clickNextMonth(stagehand: Stagehand) {
		if (USE_AI_ACTIONS) {
			await stagehand.act('click the next month button');
		} else {
			const page = stagehand.context.pages()[0];
			await page.evaluate(() => {
				const nextButton = document.querySelector('button[aria-label="Next month"]');
				if (nextButton) {
					(nextButton as HTMLButtonElement).click();
				}
			});
		}
	}
};
describe('Booking Application E2E', () => {
	let stagehand: Stagehand;

	beforeEach(async () => {
		stagehand = new Stagehand(stagehandConfig);
		await stagehand.init();
	});

	afterEach(async () => {
		await stagehand?.close();
	});

	it('should load the booking page successfully', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto(`${BASE_URL}/bookings`, { waitUntil: 'networkidle' });

		const heading = await helpers.getHeading(stagehand);
		expect(heading).toBeTruthy();
		expect(heading.toLowerCase()).toContain('book');
	}, 30000);

	it('should display calendar and allow date selection', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto(`${BASE_URL}/bookings`, { waitUntil: 'networkidle' });

		// Check calendar grid is visible
		const hasCalendar = await page.evaluate(() => {
			return !!document.querySelector('[class*="grid-cols-7"]');
		});
		expect(hasCalendar).toBe(true);

		// Count available dates
		const availableDates = await helpers.countAvailableDates(stagehand);
		expect(availableDates).toBeGreaterThan(0);
	}, 30000);

	it('should show time slots when a date is selected', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto(`${BASE_URL}/bookings`, { waitUntil: 'networkidle' });

		// Click available date using helper
		await helpers.clickAvailableDate(stagehand);

		// Wait for time slots to appear - polls and exits as soon as condition is met
		await waitForCondition(page, () => {
			const buttons = Array.from(document.querySelectorAll('button'));
			return buttons.some((b) => b.textContent && /\d+:\d+/.test(b.textContent));
		});

		// Check if time slots are visible
		const timeSlotsVisible = await helpers.areTimeSlotsVisible(stagehand);
		expect(timeSlotsVisible).toBe(true);
	}, 30000);

	it('should open booking drawer when time slot is clicked', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto(`${BASE_URL}/bookings`, { waitUntil: 'networkidle' });

		// Select date and time slot
		await helpers.clickAvailableDate(stagehand);

		// Wait for time slots to appear - polls and exits as soon as condition is met
		await waitForCondition(page, () => {
			const buttons = Array.from(document.querySelectorAll('button'));
			return buttons.some((b) => b.textContent && /\d+:\d+/.test(b.textContent));
		});

		await helpers.clickTimeSlot(stagehand);

		// Wait for drawer/form to appear - polls and exits as soon as condition is met
		await waitForCondition(page, () => {
			const nameInput = document.querySelector('input[type="text"]');
			return nameInput !== null && window.getComputedStyle(nameInput).display !== 'none';
		});

		// Check if drawer is visible
		const drawerVisible = await helpers.isDrawerVisible(stagehand);
		expect(drawerVisible).toBe(true);
	}, 30000);

	it.skip('should display timezone selector when user is in different timezone', async () => {
		// This test depends on user's actual timezone and is difficult to test reliably
		// Skip for now - manual testing recommended
	}, 30000);

	it('should handle month navigation', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto(`${BASE_URL}/bookings`, { waitUntil: 'networkidle' });

		// Get current month - it's in an h2 element
		const monthText = await page.evaluate(() => {
			return document.querySelector('h2')?.textContent;
		});

		// Navigate to next month
		await helpers.clickNextMonth(stagehand);

		// Wait for month text to change - check multiple times until it changes
		let newMonthText = monthText;
		const startTime = Date.now();
		const timeout = 10000;
		while (newMonthText === monthText && Date.now() - startTime < timeout) {
			newMonthText = await page.evaluate(() => {
				return document.querySelector('h2')?.textContent;
			});
			if (newMonthText !== monthText && newMonthText !== null) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Verify month changed
		expect(newMonthText).not.toBe(monthText);
		expect(newMonthText).toBeTruthy();
	}, 30000);

	it('should complete full booking flow successfully', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto(`${BASE_URL}/bookings`, { waitUntil: 'networkidle' });

		// Step 1: Select a date
		await helpers.clickAvailableDate(stagehand);

		// Wait for time slots to appear
		await waitForCondition(page, () => {
			const buttons = Array.from(document.querySelectorAll('button'));
			return buttons.some((b) => b.textContent && /\d+:\d+/.test(b.textContent));
		}, { timeout: 15000 });

		// Step 2: Click a time slot
		await helpers.clickTimeSlot(stagehand);

		// Wait for drawer/form to appear
		await waitForCondition(page, () => {
			const nameInput = document.querySelector('input[type="text"]');
			return nameInput !== null && window.getComputedStyle(nameInput).display !== 'none';
		}, { timeout: 10000 });

		// Step 3: Fill in the form using Svelte 5 compatible approach
		const testName = `E2E Test User ${Date.now()}`;
		const testEmail = `test-${Date.now()}@example.com`;

		await page.evaluate((data) => {
			const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
			const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
			
			if (nameInput && emailInput) {
				// Set values directly on input elements
				nameInput.value = data.name;
				emailInput.value = data.email;
				
				// Dispatch input events to trigger Svelte reactivity
				nameInput.dispatchEvent(new Event('input', { bubbles: true }));
				emailInput.dispatchEvent(new Event('input', { bubbles: true }));
				
				// Also dispatch change events
				nameInput.dispatchEvent(new Event('change', { bubbles: true }));
				emailInput.dispatchEvent(new Event('change', { bubbles: true }));
			}
		}, { name: testName, email: testEmail });

		// Wait for Svelte reactivity to process and enable the submit button
		// The form validates that name and email are filled, so button will be enabled when ready
		await waitForCondition(page, () => {
			const buttons = Array.from(document.querySelectorAll('button'));
			const submitButton = buttons.find(b => {
				const text = b.textContent?.toLowerCase() || '';
				return text.includes('confirm') && !text.includes('confirming');
			}) as HTMLButtonElement | undefined;
			return submitButton ? !submitButton.disabled : false;
		}, { timeout: 5000, pollInterval: 50 });

		// Step 4: Submit the form
		if (USE_AI_ACTIONS) {
			await stagehand.act('click the confirm or book meeting button');
		} else {
			await page.evaluate(() => {
				// Find the submit button (text contains "Confirm" or "Book")
				const buttons = Array.from(document.querySelectorAll('button'));
				const submitButton = buttons.find(b => {
					const text = b.textContent?.toLowerCase() || '';
					return text.includes('confirm') || text.includes('book');
				});
				if (submitButton) {
					(submitButton as HTMLButtonElement).click();
				}
			});
		}

		// Step 5: Wait for booking to complete and confirmation to appear
		// This is the critical part - we need to wait for the API call to complete
		// and the confirmation state to be rendered in the drawer
		await waitForCondition(page, () => {
			// Look for specific success indicators:
			// 1. The success checkmark icon in green circle (h3 + svg with checkmark)
			// 2. The "Meeting confirmed!" heading
			// 3. The confirmation message text
			// 4. The "Done" button that replaces "Confirm meeting"
			const hasCheckmarkIcon = !!document.querySelector('svg polyline[points="20 6 9 17 4 12"]');
			const hasConfirmedHeading = document.body.textContent?.includes('Meeting confirmed!');
			const hasConfirmationMessage = document.body.textContent?.includes('calendar invite and confirmation have been sent');
			const hasDoneButton = Array.from(document.querySelectorAll('button')).some(
				btn => btn.textContent?.trim() === 'Done'
			);
			
			// Return true if we find multiple success indicators (more reliable)
			return !!(hasCheckmarkIcon && hasConfirmedHeading) || (hasConfirmationMessage && hasDoneButton);
		}, { timeout: 25000, pollInterval: 500 });

		// Step 6: Verify booking was successful with multiple checks
		const confirmationState = await page.evaluate(() => {
			const hasCheckmarkIcon = !!document.querySelector('svg polyline[points="20 6 9 17 4 12"]');
			const hasConfirmedHeading = document.body.textContent?.includes('Meeting confirmed!');
			const hasGreenCircle = !!document.querySelector('.bg-green-50');
			const hasDoneButton = Array.from(document.querySelectorAll('button')).some(
				btn => btn.textContent?.trim() === 'Done'
			);
			
			return {
				hasCheckmarkIcon,
				hasConfirmedHeading,
				hasGreenCircle,
				hasDoneButton,
				isConfirmed: hasCheckmarkIcon && hasConfirmedHeading && hasDoneButton
			};
		});

		expect(confirmationState.isConfirmed).toBe(true);
		expect(confirmationState.hasCheckmarkIcon).toBe(true);
		expect(confirmationState.hasConfirmedHeading).toBe(true);

		// Step 7: Verify booked date is highlighted in green
		const hasBookedDateHighlight = await page.evaluate(() => {
			// Look for a calendar button with green styling
			const buttons = Array.from(document.querySelectorAll('button'));
			return buttons.some(button => {
				const classes = button.className || '';
				return classes.includes('bg-green-50') && classes.includes('text-green-600');
			});
		});

		expect(hasBookedDateHighlight).toBe(true);

		// Step 8: Verify booked date is disabled
		const bookedDateDisabled = await page.evaluate(() => {
			// Find the button with green styling and check if it's disabled
			const buttons = Array.from(document.querySelectorAll('button'));
			const bookedButton = buttons.find(button => {
				const classes = button.className || '';
				return classes.includes('bg-green-50') && classes.includes('text-green-600');
			}) as HTMLButtonElement | undefined;
			return bookedButton?.disabled === true;
		});

		expect(bookedDateDisabled).toBe(true);
	}, 60000);
});
