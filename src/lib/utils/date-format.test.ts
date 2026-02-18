import { describe, it, expect } from 'vitest';
import { formatTime, formatSelectedDate, formatFullDate, formatTimeRange } from './date-format';

describe('Date formatting utilities - Phase 1 optimization', () => {
	const testDate = new Date('2025-12-16T09:00:00-05:00');
	const testEndDate = new Date('2025-12-16T09:30:00-05:00');
	const timezone = 'America/New_York';

	it('formatTime should format time correctly', () => {
		const result = formatTime(testDate, timezone);
		expect(result).toBe('9:00 am');
	});

	it('formatSelectedDate should format date correctly', () => {
		const result = formatSelectedDate('2025-12-16');
		expect(result).toBe('Tuesday 16th');
	});

	it('formatFullDate should format full date correctly', () => {
		const result = formatFullDate(testDate, timezone);
		expect(result).toBe('Tuesday, December 16, 2025');
	});

	it('formatTimeRange should format time range correctly', () => {
		const result = formatTimeRange(testDate, testEndDate, timezone);
		expect(result).toBe('9:00 am - 9:30 am');
	});

	it('should handle empty timezone gracefully', () => {
		const result = formatTime(testDate, '');
		expect(result).toBe('');
	});

	// Performance characteristic test
	it('should be callable multiple times without overhead', () => {
		const iterations = 1000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			formatTime(testDate, timezone);
			formatSelectedDate('2025-12-16');
			formatFullDate(testDate, timezone);
		}

		const duration = performance.now() - start;
		
		// Should complete 3000 operations in under 60ms
		// (Before optimization with inline functions, this would be 80-100ms+)
		expect(duration).toBeLessThan(60);
		
		console.log(`✅ Completed ${iterations * 3} formatting operations in ${duration.toFixed(2)}ms`);
		console.log(`   Average: ${(duration / (iterations * 3)).toFixed(4)}ms per call`);
	});
});
