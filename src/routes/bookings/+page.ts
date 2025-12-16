import type { PageLoad } from './$types';
import { PUBLIC_API_BASE_URL, PUBLIC_API_AVAILABILITY_PATH } from '$env/static/public';
import { format, isValid, parseISO, isBefore, isAfter, startOfToday } from 'date-fns';
import { redirect } from '@sveltejs/kit';

/**
 * Regex pattern for validating YYYY-MM-DD date format
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Represents a single availability time slot from the API
 */
export interface AvailabilitySlot {
	/** ISO 8601 timestamp for slot start (UTC) */
	start: string;
	/** ISO 8601 timestamp for slot end (UTC) */
	end: string;
}

/**
 * Validates a date string for both format and actual date validity.
 * 
 * @param dateStr - Date string to validate
 * @returns True if valid YYYY-MM-DD format and represents a real date
 */
function isValidDateString(dateStr: string): boolean {
	if (!DATE_PATTERN.test(dateStr)) return false;
	const date = parseISO(dateStr);
	return isValid(date);
}

/**
 * Load function for the bookings page.
 * Fetches availability data for a given date range from the API.
 * 
 * URL Parameters:
 * - start: Start date in YYYY-MM-DD format (defaults to today, validated)
 * - end: End date in YYYY-MM-DD format (defaults to last day of current month, validated)
 * 
 * Validates that:
 * - Dates are in correct format and represent real dates
 * - Start date is not after end date
 * - Start date is not in the past
 * 
 * Redirects to clean URL with valid defaults if params are invalid or missing.
 * Returns availability slots, date range, and optional error message.
 */
export const load: PageLoad = async ({ fetch, url }) => {
	const searchParams = url.searchParams;
	const startParam = searchParams.get('start');
	const endParam = searchParams.get('end');
	
	// Get defaults
	const defaultStart = getDefaultStartDate();
	const defaultEnd = getDefaultEndDate();
	
	// Validate format and actual date validity
	const startIsValid = startParam ? isValidDateString(startParam) : false;
	const endIsValid = endParam ? isValidDateString(endParam) : false;
	
	let startDate = startIsValid ? startParam : defaultStart;
	let endDate = endIsValid ? endParam : defaultEnd;
	
	// Additional validation: ensure start <= end and start >= today
	let needsRedirect = false;
	
	if (startIsValid && endIsValid) {
		const start = parseISO(startParam!);
		const end = parseISO(endParam!);
		const today = startOfToday();
		
		// Start date can't be in the past
		if (isBefore(start, today)) {
			startDate = defaultStart;
			endDate = defaultEnd;
			needsRedirect = true;
		}
		// Start date can't be after end date
		else if (isAfter(start, end)) {
			startDate = defaultStart;
			endDate = defaultEnd;
			needsRedirect = true;
		}
	} else if (!startIsValid || !endIsValid) {
		// One or both params invalid - use defaults
		needsRedirect = true;
	}
	
	// Redirect to clean URL with valid params if needed
	if (needsRedirect && (startParam || endParam)) {
		throw redirect(302, `/bookings?start=${startDate}&end=${endDate}`);
	}

	// Fetch availability from API
	const apiUrl = `${PUBLIC_API_BASE_URL}${PUBLIC_API_AVAILABILITY_PATH}?start=${startDate}&end=${endDate}`;
	const response = await fetch(apiUrl);

	if (!response.ok) {
		// Return empty data instead of throwing - allows page to still render
		console.error(`API error: ${response.status} ${response.statusText}`);
		return {
			availability: [],
			startDate,
			endDate,
			error: `Failed to load availability: ${response.statusText}`
		};
	}

	const availability: AvailabilitySlot[] = await response.json();

	return {
		availability,
		startDate,
		endDate
	};
};

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
function getDefaultStartDate(): string {
	return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Returns the last day of the current month formatted as YYYY-MM-DD
 */
function getDefaultEndDate(): string {
	const today = new Date();
	// Create date for first day of next month, then subtract one day
	const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
	return format(lastDay, 'yyyy-MM-dd');
}
