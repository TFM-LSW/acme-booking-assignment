import { format, setMinutes, setSeconds, setHours, addMinutes, isBefore } from 'date-fns';

/**
 * Availability slot interface
 */
export interface AvailabilitySlot {
	start: string;
	end: string;
}

/**
 * Time slot interface with Date objects
 */
export interface TimeSlot {
	start: Date;
	end: Date;
}

/**
 * Generates a set of dates (in YYYY-MM-DD format) that have at least one availability slot.
 * Used to highlight available dates in a calendar.
 *
 * @param availability - Array of availability slots with ISO 8601 timestamp strings
 * @returns Set of date strings in YYYY-MM-DD format
 *
 * @example
 * const slots = [
 *   { start: '2025-12-16T09:00:00Z', end: '2025-12-16T17:00:00Z' },
 *   { start: '2025-12-17T09:00:00Z', end: '2025-12-17T17:00:00Z' }
 * ];
 * getDatesWithAvailability(slots) // Set { '2025-12-16', '2025-12-17' }
 */
export function getDatesWithAvailability(availability: AvailabilitySlot[]): Set<string> {
	const dates = new Set<string>();
	for (const slot of availability) {
		const date = new Date(slot.start);
		dates.add(format(date, 'yyyy-MM-dd'));
	}
	return dates;
}

/**
 * Rounds a time to the nearest slot boundary (00 or 30 minutes).
 *
 * @param date - Date to round
 * @returns Rounded date at :00 or :30 boundary with seconds set to 0
 *
 * @example
 * roundToNearestSlotBoundary(new Date('2025-12-16T09:15:00')) // 2025-12-16T09:30:00
 * roundToNearestSlotBoundary(new Date('2025-12-16T09:45:00')) // 2025-12-16T10:00:00
 * roundToNearestSlotBoundary(new Date('2025-12-16T09:00:00')) // 2025-12-16T09:00:00
 */
export function roundToNearestSlotBoundary(date: Date): Date {
	const minutes = date.getMinutes();
	let rounded = new Date(date);

	if (minutes > 0 && minutes < 30) {
		// Round up to :30
		rounded = setSeconds(setMinutes(rounded, 30), 0);
	} else if (minutes > 30) {
		// Round up to next hour
		rounded = setSeconds(setMinutes(setHours(rounded, rounded.getHours() + 1), 0), 0);
	} else {
		// Already on boundary, just clear seconds
		rounded = setSeconds(rounded, 0);
	}

	return rounded;
}

/**
 * Generates 30-minute time slots from availability blocks for a specific date.
 * Slots are aligned to :00 or :30 minute boundaries.
 *
 * @param availability - Array of availability slots with ISO 8601 timestamp strings
 * @param selectedDate - Date string in YYYY-MM-DD format
 * @returns Array of 30-minute time slots with start and end Date objects
 *
 * @example
 * const slots = [
 *   { start: '2025-12-16T09:15:00Z', end: '2025-12-16T11:00:00Z' }
 * ];
 * generateThirtyMinuteSlots(slots, '2025-12-16')
 * // Returns: [
 * //   { start: Date(9:30), end: Date(10:00) },
 * //   { start: Date(10:00), end: Date(10:30) },
 * //   { start: Date(10:30), end: Date(11:00) }
 * // ]
 */
export function generateThirtyMinuteSlots(
	availability: AvailabilitySlot[],
	selectedDate: string
): TimeSlot[] {
	if (!selectedDate) return [];

	// Get all availability blocks for the selected date
	const daySlots = availability.filter((slot) => {
		return format(new Date(slot.start), 'yyyy-MM-dd') === selectedDate;
	});

	const thirtyMinSlots: TimeSlot[] = [];

	for (const block of daySlots) {
		const startTime = new Date(block.start);
		const endTime = new Date(block.end);

		// Round start time to next :00 or :30 boundary
		let currentTime = roundToNearestSlotBoundary(startTime);

		// Generate 30-minute slots on hour and half-hour boundaries
		while (currentTime < endTime) {
			const slotEnd = addMinutes(currentTime, 30);
			if (!isBefore(endTime, slotEnd)) {
				thirtyMinSlots.push({
					start: new Date(currentTime),
					end: slotEnd
				});
			}
			currentTime = slotEnd;
		}
	}

	return thirtyMinSlots;
}
