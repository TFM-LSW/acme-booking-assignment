<script lang="ts">
	import CalendarDayButton from './CalendarDayButton.svelte';
	import {
		format,
		startOfMonth,
		endOfMonth,
		eachDayOfInterval,
		getDay,
		isSameDay,
		isBefore,
		startOfDay
	} from 'date-fns';

	/**
	 * Calendar component props
	 */
	interface Props {
		/** The month to display (first day of month) */
		currentMonth: Date;
		/** Set of dates (YYYY-MM-DD) that have availability */
		datesWithAvailability: Set<string>;
		/** Currently selected date in YYYY-MM-DD format, or null */
		selectedDate: string | null;
		/** Callback when a date is selected */
		onDateSelect: (date: string) => void;
	}

	let { currentMonth, datesWithAvailability, selectedDate, onDateSelect }: Props = $props();

	/** Today's date in YYYY-MM-DD format for highlighting */
	let today = $derived(format(new Date(), 'yyyy-MM-dd'));

	/**
	 * Generates the calendar grid for the current month.
	 * Includes padding cells for previous month to align the first day correctly.
	 *
	 * Returns array of day objects with:
	 * - date: YYYY-MM-DD string
	 * - day: Day number (1-31)
	 * - isCurrentMonth: Whether this is a current month day or padding
	 * - hasAvailability: Whether this date has availability slots
	 * - isToday: Whether this is today's date
	 * - isPast: Whether this date is in the past
	 */
	let calendarDays = $derived.by(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);
		const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
		const startingDayOfWeek = getDay(monthStart); // 0 = Sunday, 6 = Saturday
		const todayStart = startOfDay(new Date());

		const days: Array<{
			date: string;
			day: number;
			isCurrentMonth: boolean;
			hasAvailability: boolean;
			isToday: boolean;
			isPast: boolean;
		}> = [];

		// Add empty padding cells for days before the month starts
		for (let i = 0; i < startingDayOfWeek; i++) {
			days.push({
				date: '',
				day: 0,
				isCurrentMonth: false,
				hasAvailability: false,
				isToday: false,
				isPast: false
			});
		}

		// Add all days of the current month
		for (const dayDate of monthDays) {
			const dateStr = format(dayDate, 'yyyy-MM-dd');
			const dayStart = startOfDay(dayDate);
			days.push({
				date: dateStr,
				day: dayDate.getDate(),
				isCurrentMonth: true,
				hasAvailability: datesWithAvailability.has(dateStr),
				isToday: isSameDay(dayDate, new Date()),
				isPast: dayStart < todayStart
			});
		}

		return days;
	});

	/**
	 * Handles date selection. Only allows selecting dates with availability and not in the past.
	 */
	function selectDate(dateStr: string, hasAvailability: boolean, isPast: boolean) {
		if (hasAvailability && !isPast) {
			onDateSelect(dateStr);
		}
	}
</script>

<div class="rounded-b-lg border border-t-0 p-4">
	<!-- Weekday Headers -->
	<div class="mb-2 grid grid-cols-7 gap-1 text-center text-sm font-medium">
		<div>Sun</div>
		<div>Mon</div>
		<div>Tue</div>
		<div>Wed</div>
		<div>Thu</div>
		<div>Fri</div>
		<div>Sat</div>
	</div>

	<!-- Calendar Days -->
	<div class="grid grid-cols-7 gap-1">
		{#each calendarDays as day}
			{#if day.isCurrentMonth}
				<CalendarDayButton
					dateStr={day.date}
					label={day.day}
					isSelected={selectedDate === day.date}
					hasAvailability={day.hasAvailability}
					isPast={day.isPast}
					isToday={day.isToday}
					onSelect={(date) => selectDate(date, day.hasAvailability, day.isPast)}
					variant="full"
				/>
			{:else}
				<div class="aspect-square p-2"></div>
			{/if}
		{/each}
	</div>
</div>
