import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_MEETINGS_PATH } from '$env/static/private';

interface Attendee {
	email: string;
	name: string | null;
}

interface CreateBookingRequest {
	start: string; // ISO 8601 timestamp
	end: string; // ISO 8601 timestamp
	attendees: Attendee[];
}

/**
 * Proxy endpoint for creating bookings.
 * Forwards requests to external API while keeping API keys secure server-side.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = (await request.json()) as CreateBookingRequest;

		// Validate required fields
		if (!data.start || !data.end || !data.attendees || data.attendees.length === 0) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Validate attendee data
		for (const attendee of data.attendees) {
			if (!attendee.email) {
				return json({ success: false, error: 'Attendee email is required' }, { status: 400 });
			}
		}

		// Forward request to external API
		const externalApiUrl = `${EXTERNAL_API_BASE_URL}${EXTERNAL_API_MEETINGS_PATH}`;

		console.log('Forwarding booking to external API:', externalApiUrl);

		const response = await fetch(externalApiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
				// Add authentication headers here if needed:
				// 'Authorization': `Bearer ${API_KEY}`
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('External API error:', response.status, errorText);

			return json(
				{
					success: false,
					error: `External API error: ${response.status}`
				},
				{ status: response.status }
			);
		}

		const result = await response.json();

		console.log('Booking created successfully:', result);

		return json(result);
	} catch (error) {
		console.error('Booking proxy error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create booking'
			},
			{ status: 500 }
		);
	}
};
