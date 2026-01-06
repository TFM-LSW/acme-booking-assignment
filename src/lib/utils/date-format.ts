import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Date and time formatting utilities.
 * Pure functions extracted from component render paths for performance.
 */

/**
 * Formats a Date object as a time string in the selected timezone (e.g., "9:00 am").
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York', 'UTC')
 * @returns Formatted time string in lowercase (e.g., "9:00 am")
 */
export function formatTime(date: Date, timezone: string): string {
	if (!timezone) return '';
	return formatInTimeZone(date, timezone, 'h:mm a').toLowerCase();
}

/**
 * Formats a YYYY-MM-DD date string as a human-readable string.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Wednesday 17th")
 */
export function formatSelectedDate(dateStr: string): string {
	return format(parseISO(dateStr), 'EEEE do');
}

/**
 * Formats a Date object as a full date string in the selected timezone.
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted date string (e.g., "Wednesday, December 16, 2025")
 */
export function formatFullDate(date: Date, timezone: string): string {
	return formatInTimeZone(date, timezone, 'EEEE, MMMM d, yyyy');
}

/**
 * Formats a time range as a string in the selected timezone.
 *
 * @param start - Start time
 * @param end - End time
 * @param timezone - IANA timezone identifier
 * @returns Formatted time range (e.g., "9:00 am - 9:30 am")
 */
export function formatTimeRange(start: Date, end: Date, timezone: string): string {
	const startTime = formatTime(start, timezone);
	const endTime = formatTime(end, timezone);
	return `${startTime} - ${endTime}`;
}
