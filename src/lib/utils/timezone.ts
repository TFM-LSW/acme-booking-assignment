/**
 * Timezone utility functions for handling timezone detection, offset calculation,
 * and timezone information extraction from ISO 8601 timestamps.
 * 
 * This module focuses on UTC offset-based timezone handling rather than location-based
 * timezones, using Etc/GMT identifiers for compatibility with formatInTimeZone.
 */

/**
 * Gets the UTC offset string for a given timezone based on the browser's current time.
 * Uses the browser's built-in timezone offset calculation.
 * 
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York', 'UTC')
 * @returns Formatted offset string for display (e.g., "UTC-8", "UTC+1", "UTC+0", "UTC+5:30")
 * 
 * @example
 * getTimezoneOffset('America/New_York') // returns "UTC-5" (during EST)
 * getTimezoneOffset('Asia/Kolkata') // returns "UTC+5:30"
 */
export function getTimezoneOffset(timezone?: string): string {
	if (!timezone) return '';
	
	// Get current offset in minutes
	const now = new Date();
	const offsetMinutes = -now.getTimezoneOffset();
	const hours = Math.floor(Math.abs(offsetMinutes) / 60);
	const minutes = Math.abs(offsetMinutes) % 60;
	const sign = offsetMinutes >= 0 ? '+' : '-';
	const offset = minutes > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${hours}`;
	
	return `UTC${sign}${offset}`;
}

/**
 * Extracts the UTC offset from an ISO 8601 timestamp for display purposes.
 * Handles both Z-format (UTC) and offset-format timestamps.
 * 
 * @param timestamp - ISO 8601 timestamp (e.g., "2025-12-16T09:00:00-05:00" or "2025-12-16T09:00:00Z")
 * @returns Formatted offset string for display (e.g., "UTC+0", "UTC-5", "UTC+5:30")
 * 
 * @example
 * parseOffsetFromTimestamp('2025-12-16T09:00:00Z') // returns 'UTC+0'
 * parseOffsetFromTimestamp('2025-12-16T09:00:00-05:00') // returns 'UTC-5'
 * parseOffsetFromTimestamp('2025-12-16T09:00:00+05:30') // returns 'UTC+5:30'
 */
export function parseOffsetFromTimestamp(timestamp: string): string {
	// Check for Z (UTC) format first
	if (timestamp.endsWith('Z')) {
		return 'UTC+0';
	}
	
	// Extract offset from ISO string (e.g., "2025-12-16T09:00:00-05:00")
	const match = timestamp.match(/([+-]\d{2}):(\d{2})$/);
	if (match) {
		const hours = parseInt(match[1]);
		const minutes = match[2];
		if (minutes === '00') {
			return `UTC${hours >= 0 ? '+' : ''}${hours}`;
		} else {
			return `UTC${match[1]}:${minutes}`;
		}
	}
	
	return 'UTC+0'; // Fallback
}

/**
 * Determines whether the timezone selector should be shown.
 * Only shows when the user's UTC offset differs from the organization's UTC offset.
 * 
 * @param localOffset - User's local timezone offset (e.g., "UTC-8")
 * @param orgOffset - Organization's timezone offset (e.g., "UTC-5")
 * @returns True if the offsets differ, false otherwise
 */
export function shouldShowTimezoneSelector(localOffset: string, orgOffset: string): boolean {
	return localOffset !== orgOffset;
}

/**
 * Converts an ISO 8601 timestamp to an IANA timezone identifier based on its offset.
 * This is used for formatInTimeZone to display times in the organization's timezone.
 * 
 * Uses Etc/GMT timezones for whole-hour offsets. Note that Etc/GMT signs are inverted:
 * - UTC-5 (EST offset) becomes Etc/GMT+5
 * - UTC+5 becomes Etc/GMT-5
 * 
 * Falls back to a provided timezone for non-whole-hour offsets since Etc/GMT only
 * supports whole-hour offsets.
 * 
 * @param timestamp - ISO 8601 timestamp (e.g., "2025-12-16T09:00:00-05:00")
 * @param fallbackTimezone - Timezone to use for non-whole-hour offsets like +05:30 (default: 'UTC')
 * @returns IANA timezone identifier compatible with formatInTimeZone (e.g., "Etc/GMT+5", "UTC")
 * 
 * @example
 * getTimezoneFromOffset('2025-12-16T09:00:00Z') // returns 'UTC'
 * getTimezoneFromOffset('2025-12-16T09:00:00-05:00') // returns 'Etc/GMT+5'
 * getTimezoneFromOffset('2025-12-16T09:00:00+05:30', 'Asia/Kolkata') // returns 'Asia/Kolkata'
 */
export function getTimezoneFromOffset(timestamp: string, fallbackTimezone: string = 'UTC'): string {
	// Handle Z format
	if (timestamp.endsWith('Z')) return 'UTC';
	
	// Extract offset from timestamp (e.g., "-05:00")
	const match = timestamp.match(/([+-])(\d{2}):(\d{2})$/);
	if (!match) return 'UTC';
	
	const sign = match[1];
	const hours = parseInt(match[2]);
	const minutes = match[3];
	
	// For Etc/GMT timezones, signs are inverted
	// UTC-5 (EST) = Etc/GMT+5
	// UTC+5 = Etc/GMT-5
	const invertedSign = sign === '+' ? '-' : '+';
	
	// Only use Etc/GMT for whole hour offsets
	if (minutes === '00') {
		return `Etc/GMT${invertedSign}${hours}`;
	}
	
	// For non-whole hour offsets, use the fallback timezone
	// since Etc/GMT doesn't support 30/45 minute offsets
	return fallbackTimezone;
}
