/**
 * Centralized application configuration with runtime validation
 * Follows industry best practices for environment variable handling
 */

import {
	PUBLIC_API_BASE_URL,
	PUBLIC_API_AVAILABILITY_PATH,
	PUBLIC_API_BOOKINGS_PATH
} from '$env/static/public';

/**
 * Safely retrieves an environment variable with a default fallback
 * Handles undefined, null, empty string, or "undefined" string
 */
function getEnvVar(value: string | undefined, defaultValue: string): string {
	// Handle undefined, null, empty string, or "undefined" string
	if (!value || value === 'undefined' || value.trim() === '') {
		return defaultValue;
	}
	return value;
}

/**
 * Application configuration object
 * All API configuration is centralized here
 */
export const config = {
	/**
	 * API endpoint configuration
	 */
	api: {
		baseUrl: getEnvVar(PUBLIC_API_BASE_URL, ''),
		paths: {
			availability: getEnvVar(PUBLIC_API_AVAILABILITY_PATH, '/api/availability'),
			bookings: getEnvVar(PUBLIC_API_BOOKINGS_PATH, '/api/bookings')
		}
	},

	/**
	 * Constructs a full API URL from a path
	 * Handles both absolute and relative paths correctly
	 * 
	 * @param path - The API path (with or without leading slash)
	 * @returns Properly formatted full URL
	 * 
	 * @example
	 * // With empty baseUrl (relative paths)
	 * config.getApiUrl('/api/bookings') // => '/api/bookings'
	 * 
	 * @example
	 * // With baseUrl set
	 * config.getApiUrl('/api/bookings') // => 'https://api.example.com/api/bookings'
	 */
	getApiUrl(path: string): string {
		const baseUrl = this.api.baseUrl;
		
		// If baseUrl is empty or path is already absolute, return path as-is
		if (!baseUrl || path.startsWith('http://') || path.startsWith('https://')) {
			return path;
		}
		
		// Remove trailing slash from baseUrl and leading slash from path for clean concatenation
		const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
		const cleanPath = path.startsWith('/') ? path : `/${path}`;
		
		return `${cleanBase}${cleanPath}`;
	}
} as const;

/**
 * Runtime validation - logs configuration on first import (dev mode only)
 * Helps catch configuration issues early in development
 */
if (import.meta.env.DEV) {
	console.log('📋 API Configuration loaded:', {
		baseUrl: config.api.baseUrl || '(relative paths)',
		availabilityPath: config.api.paths.availability,
		bookingsPath: config.api.paths.bookings
	});
}
