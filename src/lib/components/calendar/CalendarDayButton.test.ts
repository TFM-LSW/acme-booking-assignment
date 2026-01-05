import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import CalendarDayButton from './CalendarDayButton.svelte';

describe('CalendarDayButton', () => {
	it('renders day number correctly', () => {
		render(CalendarDayButton, {
			props: {
				dateStr: '2025-12-18',
				label: 18,
				isSelected: false,
				hasAvailability: false,
				isPast: false,
				isToday: false,
				isBooked: false,
				onSelect: () => {},
				variant: 'full'
			}
		});

		expect(screen.getByRole('button')).toHaveTextContent('18');
	});

	it('disables button when date is in the past', () => {
		render(CalendarDayButton, {
			props: {
				dateStr: '2025-12-01',
				label: 1,
				isSelected: false,
				hasAvailability: false,
				isPast: true,
				isToday: false,
				isBooked: false,
				onSelect: () => {},
				variant: 'full'
			}
		});

		expect(screen.getByRole('button')).toHaveAttribute('disabled');
	});

	it('applies selected styles when isSelected is true', () => {
		render(CalendarDayButton, {
			props: {
				dateStr: '2025-12-18',
				label: 18,
				isSelected: true,
				hasAvailability: true,
				isPast: false,
				isToday: false,
				isBooked: false,
				onSelect: () => {},
				variant: 'full'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('bg-primary');
	});

	it('applies booked styles when isBooked is true', () => {
		render(CalendarDayButton, {
			props: {
				dateStr: '2025-12-18',
				label: 18,
				isSelected: false,
				hasAvailability: true,
				isPast: false,
				isToday: false,
				isBooked: true,
				onSelect: () => {},
				variant: 'full'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('bg-green-50');
		expect(button).toHaveClass('text-green-600');
	});

	it('disables button when date is booked', () => {
		render(CalendarDayButton, {
			props: {
				dateStr: '2025-12-18',
				label: 18,
				isSelected: false,
				hasAvailability: true,
				isPast: false,
				isToday: false,
				isBooked: true,
				onSelect: () => {},
				variant: 'full'
			}
		});

		expect(screen.getByRole('button')).toHaveAttribute('disabled');
	});

	it('booked state takes precedence over selected state', () => {
		render(CalendarDayButton, {
			props: {
				dateStr: '2025-12-18',
				label: 18,
				isSelected: true,
				hasAvailability: true,
				isPast: false,
				isToday: false,
				isBooked: true,
				onSelect: () => {},
				variant: 'full'
			}
		});

		const button = screen.getByRole('button');
		// Should have booked styles, not selected styles
		expect(button).toHaveClass('bg-green-50');
		expect(button).not.toHaveClass('bg-primary');
	});
});
