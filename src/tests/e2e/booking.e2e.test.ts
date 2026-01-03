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
				return buttons.filter((b) => b.textContent && /^\d+$/.test(b.textContent.trim()))
					.length;
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
		await page.goto('http://localhost:5173/bookings', { waitUntil: 'networkidle' });

		const heading = await helpers.getHeading(stagehand);
		expect(heading).toBeTruthy();
		expect(heading.toLowerCase()).toContain('book');
	}, 30000);

	it('should display calendar and allow date selection', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto('http://localhost:5173/bookings', { waitUntil: 'networkidle' });

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
		await page.goto('http://localhost:5173/bookings', { waitUntil: 'networkidle' });

		// Click available date using helper
		await helpers.clickAvailableDate(stagehand);
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Check if time slots are visible
		const timeSlotsVisible = await helpers.areTimeSlotsVisible(stagehand);
		expect(timeSlotsVisible).toBe(true);
	}, 30000);

	it('should open booking drawer when time slot is clicked', async () => {
		const page = stagehand.context.pages()[0];
		await page.goto('http://localhost:5173/bookings', { waitUntil: 'networkidle' });

		// Select date and time slot
		await helpers.clickAvailableDate(stagehand);
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await helpers.clickTimeSlot(stagehand);
		await new Promise((resolve) => setTimeout(resolve, 1000));

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
		await page.goto('http://localhost:5173/bookings', { waitUntil: 'networkidle' });

		// Get current month - it's in an h2 element
		const monthText = await page.evaluate(() => {
			return document.querySelector('h2')?.textContent;
		});

		// Navigate to next month
		await helpers.clickNextMonth(stagehand);
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Verify month changed
		const newMonthText = await page.evaluate(() => {
			return document.querySelector('h2')?.textContent;
		});
		expect(newMonthText).not.toBe(monthText);
		expect(newMonthText).toBeTruthy();
	}, 30000);
});
