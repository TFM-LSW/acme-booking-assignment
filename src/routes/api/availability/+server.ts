import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_AVAILABILITY_PATH } from '$env/static/private';

// Runtime validation of required environment variables
if (!EXTERNAL_API_BASE_URL || !EXTERNAL_API_AVAILABILITY_PATH) {
	throw new Error(
		'Missing required environment variables: EXTERNAL_API_BASE_URL and/or EXTERNAL_API_AVAILABILITY_PATH. ' +
		'Please check your .env file.'
	);
}

/**
 * Proxy endpoint for fetching availability data.
 * Forwards requests to external API while keeping API URLs secure server-side.
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Forward query parameters (start, end dates)
		const queryParams = url.searchParams.toString();
		const externalApiUrl = `${EXTERNAL_API_BASE_URL}${EXTERNAL_API_AVAILABILITY_PATH}${queryParams ? `?${queryParams}` : ''}`;

		console.log('Forwarding availability request to external API:', externalApiUrl);

		const response = await fetch(externalApiUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
				// Add authentication headers here if needed:
				// 'Authorization': `Bearer ${API_KEY}`
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('External API error:', response.status, errorText);

			return json(
				{
					error: `External API error: ${response.status}`
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Availability proxy error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch availability'
			},
			{ status: 500 }
		);
	}
};
