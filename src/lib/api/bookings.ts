/**
 * Booking API client
 * Handles all booking-related API calls
 */

import { config } from '$lib/config';

export interface Attendee {
	email: string;
	name: string | null;
}

export interface CreateBookingRequest {
	start: string; // ISO 8601 timestamp
	end: string; // ISO 8601 timestamp
	attendees: Attendee[];
}

export interface CreateBookingResponse {
	success: boolean;
	bookingId?: string;
	error?: string;
}

/**
 * Creates a new booking via the local server proxy
 * @param data Booking details
 * @returns Promise resolving to booking confirmation
 */
export async function createBooking(data: CreateBookingRequest): Promise<CreateBookingResponse> {
	// Call local SvelteKit server proxy using centralized config
	const url = config.getApiUrl(config.api.paths.bookings);

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Failed to create booking' }));
		throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
}
