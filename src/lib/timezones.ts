export interface Timezone {
	value: string;
	label: string;
}

export interface TimezoneGroup {
	group: string;
	options: Timezone[];
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = [
	{
		group: 'Europe',
		options: [
			{ value: 'Europe/London', label: 'London' },
			{ value: 'Europe/Dublin', label: 'Dublin' },
			{ value: 'Europe/Lisbon', label: 'Lisbon' },
			{ value: 'Europe/Paris', label: 'Paris' },
			{ value: 'Europe/Amsterdam', label: 'Amsterdam' },
			{ value: 'Europe/Brussels', label: 'Brussels' },
			{ value: 'Europe/Berlin', label: 'Berlin' },
			{ value: 'Europe/Zurich', label: 'Zurich' },
			{ value: 'Europe/Madrid', label: 'Madrid' },
			{ value: 'Europe/Rome', label: 'Rome' },
			{ value: 'Europe/Stockholm', label: 'Stockholm' },
			{ value: 'Europe/Athens', label: 'Athens' },
			{ value: 'Europe/Istanbul', label: 'Istanbul' }
		]
	},
	{
		group: 'Africa',
		options: [
			{ value: 'Africa/Johannesburg', label: 'Johannesburg' },
			{ value: 'Africa/Lagos', label: 'Lagos' }
		]
	},
	{
		group: 'Americas',
		options: [
			{ value: 'America/New_York', label: 'New York' },
			{ value: 'America/Chicago', label: 'Chicago' },
			{ value: 'America/Denver', label: 'Denver' },
			{ value: 'America/Los_Angeles', label: 'Los Angeles' },
			{ value: 'America/Toronto', label: 'Toronto' },
			{ value: 'America/Vancouver', label: 'Vancouver' },
			{ value: 'America/Mexico_City', label: 'Mexico City' },
			{ value: 'America/Sao_Paulo', label: 'São Paulo' },
			{ value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' }
		]
	},
	{
		group: 'Asia',
		options: [
			{ value: 'Asia/Dubai', label: 'Dubai' },
			{ value: 'Asia/Kolkata', label: 'India (Kolkata)' },
			{ value: 'Asia/Singapore', label: 'Singapore' },
			{ value: 'Asia/Hong_Kong', label: 'Hong Kong' },
			{ value: 'Asia/Shanghai', label: 'Shanghai' },
			{ value: 'Asia/Tokyo', label: 'Tokyo' }
		]
	},
	{
		group: 'Australia & Pacific',
		options: [
			{ value: 'Australia/Sydney', label: 'Sydney' },
			{ value: 'Australia/Melbourne', label: 'Melbourne' },
			{ value: 'Australia/Perth', label: 'Perth' },
			{ value: 'Pacific/Auckland', label: 'Auckland' }
		]
	}
];

// Flatten all timezones for easier lookup
export const ALL_TIMEZONES: Timezone[] = TIMEZONE_GROUPS.flatMap((group) => group.options);

export function detectUserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return 'America/New_York';
	}
}

export function findClosestTimezone(detectedTz: string): string {
	// If detected timezone is in our list, use it
	if (ALL_TIMEZONES.some((tz) => tz.value === detectedTz)) {
		return detectedTz;
	}

	// Otherwise, return the first timezone (default fallback)
	return ALL_TIMEZONES[0].value;
}

export function getTimezoneLabel(timezoneValue: string): string {
	const timezone = ALL_TIMEZONES.find((tz) => tz.value === timezoneValue);
	return timezone ? timezone.label : timezoneValue;
}
