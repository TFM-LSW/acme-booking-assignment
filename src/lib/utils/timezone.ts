import { formatInTimeZone } from 'date-fns-tz';

/**
 * Timezone utility functions for handling timezone detection, offset calculation,
 * and timezone information extraction from ISO 8601 timestamps.
 *
 * This module focuses on UTC offset-based timezone handling using ISO 8601 timestamp
 * offset information rather than IANA timezone identifiers. Etc/GMT identifiers are
 * used for formatInTimeZone compatibility when needed.
 */

/**
 * ISO 8601 timestamp string with timezone offset or Z suffix.
 * @example '2025-12-16T09:00:00-05:00' | '2025-12-16T09:00:00Z' | '2025-12-16T09:00:00+05:30'
 */
export type ISO8601Timestamp = string;

/**
 * UTC offset string for display purposes.
 * @example 'UTC+0' | 'UTC-5' | 'UTC+5:30'
 */
export type UTCOffsetDisplay = string;

/**
 * IANA timezone identifier.
 * @example 'America/New_York' | 'Europe/London' | 'UTC' | 'Etc/GMT+5'
 */
export type IANATimezone = string;

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
export function parseOffsetFromTimestamp(timestamp: ISO8601Timestamp): UTCOffsetDisplay {
	if (timestamp.endsWith('Z')) {
		return 'UTC+0';
	}

	const match = timestamp.match(/([+-]\d{2}):(\d{2})$/);
	if (match) {
		const hours = parseInt(match[1]);
		const minutes = match[2];
		if (minutes === '00') {
			return `UTC${hours >= 0 ? '+' : ''}${hours}`;
		}
		return `UTC${match[1]}:${minutes}`;
	}

	return 'UTC+0';
}

/**
 * Determines whether the timezone selector should be shown to the user.
 * Only shows when the user's UTC offset differs from the organization's UTC offset.
 * Compares offsets extracted from ISO 8601 timestamp strings rather than timezone names
 * to ensure accurate comparison based on actual offset data.
 *
 * @param userTimestamp - ISO 8601 timestamp from user's timezone (e.g., '2025-12-16T09:00:00Z', '2025-12-16T09:00:00-05:00')
 * @param orgTimestamp - ISO 8601 timestamp from organization's timezone (e.g., '2025-12-16T14:00:00Z', '2025-12-16T09:00:00-05:00')
 * @returns True if the UTC offsets differ, false otherwise
 *
 * @example
 * shouldShowTimezoneSelector('2025-12-16T09:00:00Z', '2025-12-16T09:00:00Z') // returns false (both UTC+0)
 * shouldShowTimezoneSelector('2025-12-16T09:00:00-05:00', '2025-12-16T14:00:00Z') // returns true (UTC-5 vs UTC+0)
 */
export function shouldShowTimezoneSelector(
	userTimestamp: ISO8601Timestamp,
	orgTimestamp: ISO8601Timestamp
): boolean {
	const userOffset = parseOffsetFromTimestamp(userTimestamp);
	const orgOffset = parseOffsetFromTimestamp(orgTimestamp);

	return userOffset !== orgOffset;
}

/**
 * Generates an ISO 8601 timestamp representing the current time in the user's local timezone.
 * Detects the user's timezone using the Intl API and formats the current time with its UTC offset
 * using date-fns-tz formatInTimeZone function.
 *
 * @returns ISO 8601 timestamp with offset (e.g., '2025-12-18T14:30:00-05:00' or '2025-12-18T19:30:00Z')
 *
 * @example
 * getUserTimestamp() // returns '2025-12-18T14:30:00-05:00' for a user in EST
 * getUserTimestamp() // returns '2025-12-18T19:30:00Z' for a user in UTC
 */
export function getUserTimestamp(): ISO8601Timestamp {
	const now = new Date();
	const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	// Format with timezone offset using date-fns-tz
	return formatInTimeZone(now, userTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
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
export function getTimezoneFromOffset(
	timestamp: ISO8601Timestamp,
	fallbackTimezone: IANATimezone = 'UTC'
): IANATimezone {
	if (timestamp.endsWith('Z')) return 'UTC';

	const match = timestamp.match(/([+-])(\d{2}):(\d{2})$/);
	if (!match) return 'UTC';

	const sign = match[1];
	const hours = parseInt(match[2]);
	const minutes = match[3];

	// For Etc/GMT timezones, signs are inverted
	const invertedSign = sign === '+' ? '-' : '+';

	// Only use Etc/GMT for whole hour offsets
	if (minutes === '00') {
		return `Etc/GMT${invertedSign}${hours}`;
	}

	return fallbackTimezone;
}
