import { describe, it, expect } from 'vitest';
import { shouldShowTimezoneSelector, parseOffsetFromTimestamp, getUserTimestamp } from './timezone';

describe('shouldShowTimezoneSelector', () => {
	it('should return false when timestamps have the same offset (UTC)', () => {
		const result = shouldShowTimezoneSelector('2025-12-16T09:00:00Z', '2025-12-16T09:00:00Z');
		expect(result).toBe(false);
	});

	it('should return true when timestamps have different offsets', () => {
		const result = shouldShowTimezoneSelector('2025-12-16T09:00:00-05:00', '2025-12-16T14:00:00Z');
		expect(result).toBe(true);
	});

	it('should return false when both timestamps have the same non-UTC offset', () => {
		const result = shouldShowTimezoneSelector(
			'2025-12-16T09:00:00-05:00',
			'2025-12-16T10:00:00-05:00'
		);
		expect(result).toBe(false);
	});

	it('should return true for timestamps with different hour offsets', () => {
		const result = shouldShowTimezoneSelector(
			'2025-12-16T09:00:00+09:00',
			'2025-12-16T09:00:00-08:00'
		);
		expect(result).toBe(true);
	});

	it('should handle timestamps with half-hour offsets correctly', () => {
		const result = shouldShowTimezoneSelector('2025-12-16T09:00:00+05:30', '2025-12-16T14:00:00Z');
		expect(result).toBe(true);
	});

	it('should return false when comparing timestamps with identical half-hour offsets', () => {
		const result = shouldShowTimezoneSelector(
			'2025-12-16T09:00:00+05:30',
			'2025-12-16T10:00:00+05:30'
		);
		expect(result).toBe(false);
	});
});

describe('parseOffsetFromTimestamp', () => {
	it('should parse UTC (Z) format', () => {
		expect(parseOffsetFromTimestamp('2025-12-16T09:00:00Z')).toBe('UTC+0');
	});

	it('should parse negative whole-hour offsets', () => {
		expect(parseOffsetFromTimestamp('2025-12-16T09:00:00-05:00')).toBe('UTC-5');
	});

	it('should parse positive whole-hour offsets', () => {
		expect(parseOffsetFromTimestamp('2025-12-16T09:00:00+05:00')).toBe('UTC+5');
	});

	it('should parse half-hour offsets', () => {
		expect(parseOffsetFromTimestamp('2025-12-16T09:00:00+05:30')).toBe('UTC+05:30');
	});

	it('should parse negative half-hour offsets', () => {
		expect(parseOffsetFromTimestamp('2025-12-16T09:00:00-03:30')).toBe('UTC-03:30');
	});

	it('should handle 45-minute offsets', () => {
		expect(parseOffsetFromTimestamp('2025-12-16T09:00:00+05:45')).toBe('UTC+05:45');
	});
});

describe('getUserTimestamp', () => {
	it('should return a valid ISO 8601 timestamp with offset or Z', () => {
		const timestamp = getUserTimestamp();

		// Should match ISO 8601 format with offset or Z for UTC
		expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/);
	});

	it('should return a timestamp that can be parsed', () => {
		const timestamp = getUserTimestamp();
		const date = new Date(timestamp);

		expect(date).toBeInstanceOf(Date);
		expect(isNaN(date.getTime())).toBe(false);
	});

	it('should return a timestamp with extractable offset', () => {
		const timestamp = getUserTimestamp();
		const offset = parseOffsetFromTimestamp(timestamp);

		expect(offset).toMatch(/^UTC[+-]\d+(:30|:45)?$/);
	});
});
