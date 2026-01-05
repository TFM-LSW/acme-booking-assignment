<script lang="ts">
	import Calendar from '$lib/components/calendar/Calendar.svelte';
	import CondensedCalendar from '$lib/components/calendar/CondensedCalendar.svelte';
	import Footer from '$lib/components/ui/Footer.svelte';
	import TimeSlotsList from '$lib/components/bookings/TimeSlotsList.svelte';
	import BookingDrawer from '$lib/components/bookings/BookingDrawer.svelte';
	import type { PageData } from './$types';
	import {
		format,
		parseISO,
		addMonths,
		subMonths,
		startOfMonth,
		lastDayOfMonth,
		isAfter
	} from 'date-fns';
	import { formatInTimeZone } from 'date-fns-tz';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { detectUserTimezone } from '$lib/timezones';
	import {
		parseOffsetFromTimestamp,
		shouldShowTimezoneSelector,
		getTimezoneFromOffset,
		getUserTimestamp
	} from '$lib/utils/timezone';
	import { getDatesWithAvailability, generateThirtyMinuteSlots } from '$lib/utils/availability';
	import { intersectionObserver } from '$lib/utils/actions';
	import { createBooking } from '$lib/api/bookings';

	let { data = $bindable() }: { data: PageData } = $props();

	/**
	 * Currently selected date in YYYY-MM-DD format.
	 * Null when no date is selected.
	 */
	let selectedDate = $state<string | null>(null);

	/**
	 * Whether the meeting drawer is open
	 */
	let drawerOpen = $state(false);

	/**
	 * Currently selected time slot for meeting
	 */
	let selectedSlot = $state<{ start: Date; end: Date } | null>(null);

	/**
	 * Confirmed meeting details after successful booking
	 */
	let confirmedMeeting = $state<{
		name: string;
		email: string;
		start: Date;
		end: Date;
	} | null>(null);

	/**
	 * User's detected IANA timezone from browser (e.g., 'America/New_York').
	 * Populated on mount via Intl.DateTimeFormat API.
	 */
	let detectedTimezone = $state('');

	/**
	 * Currently selected timezone for displaying time slots.
	 * Set to either the user's local timezone (detectedTimezone) or the organization's
	 * timezone (orgTimezone) based on dropdown selection. Used by formatInTimeZone.
	 */
	let selectedTimezone = $state('');

	// Initialize timezone detection on mount
	$effect(() => {
		if (!detectedTimezone) {
			detectedTimezone = detectUserTimezone();
			// Default to user's local timezone
			if (!selectedTimezone) {
				selectedTimezone = detectedTimezone;
			}
		}
	});

	/**
	 * Gets the UTC offset string for the user's local timezone.
	 * Extracts offset from the current timestamp in the user's timezone.
	 * @returns Formatted offset string (e.g., "UTC-8", "UTC+1", "UTC+0", "UTC+5:30")
	 */
	let localTimezoneOffset = $derived(parseOffsetFromTimestamp(getUserTimestamp()));

	/**
	 * Gets the UTC offset for organization timezone by parsing availability data timestamps.
	 * Handles both Z-format (UTC) and offset-format ISO 8601 timestamps.
	 * @returns Formatted offset string (e.g., "UTC+0", "UTC-5", "UTC+5:30")
	 */
	let orgTimezoneOffset = $derived.by(() => {
		if (data.availability.length === 0) return 'UTC+0';
		return parseOffsetFromTimestamp(data.availability[0].start);
	});

	/**
	 * Organization's timezone identifier derived from the UTC offset in availability timestamps.
	 * Converts the offset to an Etc/GMT IANA timezone for use with formatInTimeZone.
	 *
	 * Uses the first availability timestamp to determine the organization's timezone.
	 * For whole-hour offsets (e.g., -05:00), returns Etc/GMT identifier (e.g., Etc/GMT+5).
	 * For fractional offsets (e.g., +05:30), falls back to user's detected timezone.
	 *
	 * @example
	 * // Timestamp: "2025-12-16T09:00:00-05:00" → returns "Etc/GMT+5"
	 * // Timestamp: "2025-12-16T09:00:00Z" → returns "UTC"
	 */
	let orgTimezone = $derived.by(() => {
		if (data.availability.length === 0) return 'UTC';
		return getTimezoneFromOffset(data.availability[0].start, detectedTimezone);
	});

	/**
	 * Whether the full calendar is visible in the viewport.
	 * Controls when to show the condensed mobile week view.
	 */
	let isCalendarVisible = $state(true);

	/**
	 * The month currently being displayed in the calendar.
	 * Derived from URL search params (start date) or defaults to current month.
	 * Uses date-fns startOfMonth() to ensure consistent first-of-month dates.
	 */
	let currentMonth = $derived.by(() => {
		const startParam = $page.url.searchParams.get('start');

		if (startParam) {
			// Parse YYYY-MM-DD format and get start of month
			return startOfMonth(parseISO(startParam));
		}
		return startOfMonth(new Date());
	});

	/** Whether any availability data exists for the current month */
	let hasAvailability = $derived(data.availability.length > 0);

	/** Whether an error occurred loading availability data */
	let hasError = $derived(!!data.error);

	/**
	 * Whether the previous month button should be shown.
	 * Only shows when viewing a future month (not current or past months).
	 * Uses date-fns isAfter() to compare with current month start.
	 */
	let canGoPrevious = $derived(isAfter(currentMonth, startOfMonth(new Date())));

	/**
	 * Set of all dates (YYYY-MM-DD format) that have at least one availability slot.
	 * Used to highlight available dates in the calendar.
	 */
	let datesWithAvailability = $derived(getDatesWithAvailability(data.availability));

	/**
	 * The date of the confirmed booking in YYYY-MM-DD format.
	 * Used to highlight the booked day in the calendar.
	 */
	let bookedDate = $derived(confirmedMeeting ? format(confirmedMeeting.start, 'yyyy-MM-dd') : null);

	/**
	 * Array of 30-minute time slots for the currently selected date.
	 * Slots are aligned to :00 or :30 minute boundaries.
	 */
	let selectedDateSlots = $derived(
		generateThirtyMinuteSlots(data.availability, selectedDate ?? '')
	);

	/**
	 * Formats a YYYY-MM-DD date string as a human-readable string.
	 * @param dateStr - Date string in YYYY-MM-DD format
	 * @returns Formatted date string (e.g., "Wednesday 17th")
	 */
	function formatSelectedDate(dateStr: string): string {
		return format(parseISO(dateStr), 'EEEE do');
	}

	/**
	 * Handles date selection from the calendar component.
	 * @param date - Selected date in YYYY-MM-DD format
	 */
	function handleDateSelect(date: string) {
		selectedDate = date;
	}

	/**
	 * Handles time slot selection and opens the meeting drawer.
	 * @param slot - Selected time slot with start and end dates
	 */
	function handleSlotClick(slot: { start: Date; end: Date }) {
		selectedSlot = slot;
		drawerOpen = true;
	}

	/**
	 * Closes the meeting drawer.
	 */
	function handleCloseDrawer() {
		drawerOpen = false;
		// Optional: clear selected slot after closing
		// selectedSlot = null;
	}

	/**
	 * Handles meeting submission from the drawer.
	 * Creates a booking request with attendee information and time slot.
	 * @param data - Meeting form data containing name, email, and time slot
	 */
	async function handleMeetingSubmit(data: {
		name: string;
		email: string;
		start: Date;
		end: Date;
	}) {
		await createBooking({
			attendees: [
				{
					name: data.name,
					email: data.email
				}
			],
			start: data.start.toISOString(),
			end: data.end.toISOString()
		});

		// Store confirmed meeting details
		confirmedMeeting = {
			name: data.name,
			email: data.email,
			start: data.start,
			end: data.end
		};

		// Clear selected date to hide slot list
		selectedDate = null;
	}

	/**
	 * Navigates to the previous or next month.
	 * Updates URL params which triggers a new data fetch via the load function.
	 * Uses date-fns startOfMonth and lastDayOfMonth for accurate date range calculation.
	 *
	 * @param direction - 'prev' for previous month, 'next' for next month
	 */
	async function changeMonth(direction: 'prev' | 'next') {
		const newMonth = direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
		selectedDate = null; // Clear selection when changing months

		// Calculate first and last day of the new month
		const startDate = format(startOfMonth(newMonth), 'yyyy-MM-dd');
		const endDate = format(lastDayOfMonth(newMonth), 'yyyy-MM-dd');

		// Navigate with start/end parameters to fetch new month's availability data
		await goto(`/bookings?start=${startDate}&end=${endDate}`);
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mx-auto max-w-4xl">
		<div class="text-muted-foreground font-heading mb-8">
			<strong>ACME Industries Ltd</strong>
		</div>

		<div class="mb-8 grid gap-8 md:grid-cols-3">
			<div class="md:col-span-2">
				<h1 class="mb-4 text-4xl font-bold">Book time with the ACME team</h1>
				<p class="text-muted-foreground">
					Choose a time that works for you and book instantly. No emails, no waiting. We’ll use the
					call to learn about your goals, answer questions and decide what happens next.
				</p>
			</div>

			<!-- Confirmed Meeting Card -->
			{#if confirmedMeeting}
				<div class="md:col-span-1">
					<div class="bg-accent border-border rounded-lg border p-4">
						<div class="mb-3 flex items-start gap-2">
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
							</div>
							<div class="flex-1">
								<h3 class="text-foreground text-sm font-semibold">Meeting scheduled</h3>
								<p class="text-muted-foreground mt-1 text-xs">with ACME representative</p>
							</div>
						</div>
						<div class="border-border mt-3 border-t pt-3">
							<p class="text-foreground text-sm font-medium">
								{formatInTimeZone(confirmedMeeting.start, selectedTimezone, 'h:mm a').toLowerCase()}
								-
								{formatInTimeZone(confirmedMeeting.end, selectedTimezone, 'h:mm a').toLowerCase()}
							</p>
							<p class="text-muted-foreground mt-1 text-xs">
								{formatInTimeZone(confirmedMeeting.start, selectedTimezone, 'EEEE, MMMM d, yyyy')}
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Error State -->
		{#if hasError}
			<div class="border-destructive/50 bg-destructive/10 mb-6 rounded-lg border p-6">
				<h2 class="text-destructive mb-2 text-lg font-semibold">Error Loading Availability</h2>
				<p class="text-destructive/90 text-sm">{data.error}</p>
			</div>
		{/if}

		<!-- Empty State -->
		{#if !hasAvailability && !hasError}
			<div class="border-border bg-muted/50 rounded-lg border-2 border-dashed p-12 text-center">
				<p class="text-muted-foreground text-xl">No availability found</p>
				<p class="text-muted-foreground mt-2 text-sm">Please check back later</p>
			</div>
		{/if}

		<!-- Calendar and Time Slots -->
		{#if hasAvailability}
			<div class="grid gap-8 md:grid-cols-2">
				<!-- Calendar Column -->
				<div
					class="md:sticky md:top-8 md:self-start"
					use:intersectionObserver={{
						onIntersect: (isIntersecting) => (isCalendarVisible = isIntersecting),
						threshold: 0.1,
						rootMargin: '-50px 0px 0px 0px'
					}}
				>
					<div class="mb-0 flex items-center justify-between rounded-t-lg border border-b-0 p-4">
						{#if canGoPrevious}
							<button
								onclick={() => changeMonth('prev')}
								class="text-muted-foreground hover:text-foreground inline-flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors"
								aria-label="Previous month"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="15 18 9 12 15 6"></polyline>
								</svg>
							</button>
						{:else}
							<div class="size-10"></div>
						{/if}
						<h2 class="text-xl font-semibold">
							{format(currentMonth, 'MMMM yyyy')}
						</h2>
						<button
							onclick={() => changeMonth('next')}
							class="text-muted-foreground hover:text-foreground inline-flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors"
							aria-label="Next month"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="9 18 15 12 9 6"></polyline>
							</svg>
						</button>
					</div>

					<Calendar
						{currentMonth}
						{datesWithAvailability}
						{selectedDate}
						{bookedDate}
						onDateSelect={handleDateSelect}
					/>
				</div>

				<!-- Time Slots Column -->
				<div>
					{#if selectedDate}
						<!-- Condensed Week Calendar for Mobile (Sticky) - Only show when full calendar is out of view -->
						{#if !isCalendarVisible}
							<CondensedCalendar
								{selectedDate}
								{datesWithAvailability}
								{bookedDate}
								onDateSelect={handleDateSelect}
							/>
						{/if}

						<div
							class="bg-background mt-4 mb-4 hidden items-center justify-center self-start md:flex"
						>
							<h2 class="text-md font-semibold">
								{formatSelectedDate(selectedDate)} (30 mins)
							</h2>
						</div>

						{#if data.availability[0] && shouldShowTimezoneSelector(getUserTimestamp(), data.availability[0].start)}
							<div class="mb-4">
								<select
									id="timezone-select"
									bind:value={selectedTimezone}
									class="border-input bg-background ring-offset-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
								>
									<option value="" disabled>Timezone</option>
									<option value={detectedTimezone}>
										My local time {localTimezoneOffset ? `(${localTimezoneOffset})` : ''}
									</option>
									<option value={orgTimezone}>ACME local time ({orgTimezoneOffset})</option>
								</select>
							</div>
						{/if}
						<TimeSlotsList
							slots={selectedDateSlots}
							{selectedTimezone}
							onSlotClick={handleSlotClick}
						/>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<BookingDrawer
	open={drawerOpen}
	slot={selectedSlot}
	timezone={selectedTimezone}
	timezoneOffset={selectedTimezone === detectedTimezone ? localTimezoneOffset : orgTimezoneOffset}
	localTimezone={detectedTimezone}
	isLocalTimezone={selectedTimezone === detectedTimezone}
	onClose={handleCloseDrawer}
	onSubmit={handleMeetingSubmit}
/>

<Footer />
