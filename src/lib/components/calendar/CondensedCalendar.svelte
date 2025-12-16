<script lang="ts">
	import CalendarDayButton from './CalendarDayButton.svelte';
	import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';

	/**
	 * Condensed week calendar component showing one week of dates.
	 * Used for mobile sticky header when full calendar scrolls out of view.
	 */
	interface Props {
		/** Currently selected date in YYYY-MM-DD format */
		selectedDate: string;
		/** Set of dates (YYYY-MM-DD) that have availability */
		datesWithAvailability: Set<string>;
		/** Callback when a date is selected */
		onDateSelect: (date: string) => void;
	}

	let { selectedDate, datesWithAvailability, onDateSelect }: Props = $props();

	/**
	 * Gets the week of dates containing the selected date.
	 * Returns an array of 7 dates starting from Sunday.
	 */
	let weekDays = $derived.by(() => {
		const selectedDateObj = new Date(selectedDate);
		const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 0 }); // Sunday
		const days = [];
		const today = new Date();

		for (let i = 0; i < 7; i++) {
			const day = addDays(weekStart, i);
			const dateStr = format(day, 'yyyy-MM-dd');
			const hasAvailability = datesWithAvailability.has(dateStr);
			const isSelected = isSameDay(day, selectedDateObj);
			const isPast = startOfDay(day) < startOfDay(new Date());
			const isToday = isSameDay(day, today);

			days.push({
				dateStr,
				dayOfWeek: format(day, 'EEE'),
				dayOfMonth: format(day, 'd'),
				hasAvailability,
				isSelected,
				isPast,
				isToday
			});
		}

		return days;
	});
</script>

<div class="bg-background fixed top-0 right-0 left-0 z-10 px-4 py-3 shadow-sm md:hidden">
	<div class="container mx-auto max-w-4xl">
		<div class="grid grid-cols-7 gap-2">
			{#each weekDays as day}
				<CalendarDayButton
					dateStr={day.dateStr}
					label={day.dayOfMonth}
					secondaryLabel={day.dayOfWeek}
					isSelected={day.isSelected}
					hasAvailability={day.hasAvailability}
					isPast={day.isPast}
					isToday={day.isToday}
					onSelect={onDateSelect}
					variant="condensed"
				/>
			{/each}
		</div>
	</div>
</div>
