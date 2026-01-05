<script lang="ts">
	/**
	 * Atomic component for a calendar day button.
	 * Handles visual states for selected, available, past, today, and booked.
	 */
	interface Props {
		/** The date string (YYYY-MM-DD) */
		dateStr: string;
		/** Display label (could be day number or full date) */
		label: string | number;
		/** Optional secondary label (e.g., day of week) */
		secondaryLabel?: string;
		/** Whether this date is selected */
		isSelected: boolean;
		/** Whether this date has availability */
		hasAvailability: boolean;
		/** Whether this date is in the past */
		isPast: boolean;
		/** Whether this is today */
		isToday: boolean;
		/** Whether this date has a confirmed booking */
		isBooked?: boolean;
		/** Callback when clicked */
		onSelect: (dateStr: string) => void;
		/** Variant: full (square) or condensed (rectangular with labels) */
		variant?: 'full' | 'condensed';
	}

	let {
		dateStr,
		label,
		secondaryLabel,
		isSelected,
		hasAvailability,
		isPast,
		isToday,
		isBooked = false,
		onSelect,
		variant = 'full'
	}: Props = $props();

	/**
	 * Handles click event on the date button.
	 * Only triggers onSelect if date has availability, is not in the past, and is not booked.
	 */
	function handleClick() {
		if (hasAvailability && !isPast && !isBooked) {
			onSelect(dateStr);
		}
	}

	/** Base styling classes applied to all button states */
	let baseClasses = 'relative rounded-lg p-3 transition-all font-medium';

	/** Dynamic classes based on button state (selected, available, disabled, booked) */
	let stateClasses = $derived(
		isBooked
			? 'bg-green-50 text-green-600 border-green-200 border cursor-default font-semibold'
			: isSelected
				? 'bg-primary text-primary-foreground hover:bg-primary/90'
				: hasAvailability && !isPast
					? 'bg-accent/30 border-accent hover:bg-accent hover:border-primary cursor-pointer border'
					: 'text-muted-foreground/40 cursor-not-allowed'
	);

	/** Layout classes based on variant (full calendar vs condensed week view) */
	let variantClasses = $derived(
		variant === 'full' ? 'aspect-square text-sm' : 'flex flex-col items-center gap-0.5'
	);
</script>

<button
	onclick={handleClick}
	disabled={!hasAvailability || isPast || isBooked}
	class="{baseClasses} {stateClasses} {variantClasses}"
>
	{#if variant === 'condensed' && secondaryLabel}
		<span class="text-xs font-medium">{secondaryLabel}</span>
		<span class="text-sm font-semibold">{label}</span>
	{:else}
		{label}
	{/if}

	{#if isToday}
		<span
			class="absolute bottom-1 {variant === 'full'
				? 'left-1/2 h-1 w-1 -translate-x-1/2'
				: ''} size-1 rounded-full
			{isSelected ? 'bg-primary-foreground' : 'bg-primary'}"
		></span>
	{/if}
</button>
