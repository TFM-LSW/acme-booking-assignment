<script lang="ts">
	import { formatTime } from '$lib/utils/date-format';

	interface TimeSlot {
		start: Date;
		end: Date;
	}

	interface Props {
		/**
		 * Array of time slots to display
		 */
		slots: TimeSlot[];
		/**
		 * IANA timezone identifier for formatting times (e.g., 'America/New_York', 'UTC')
		 */
		selectedTimezone: string;
		/**
		 * Callback fired when a time slot is clicked
		 */
		onSlotClick?: (slot: TimeSlot) => void;
	}

	let { slots, selectedTimezone, onSlotClick }: Props = $props();

	function handleSlotClick(slot: TimeSlot) {
		onSlotClick?.(slot);
	}
</script>

{#if slots.length > 0}
	<div class="space-y-3">
		{#each slots as slot}
			<button
				type="button"
				onclick={() => handleSlotClick(slot)}
				class="border-border hover:border-primary hover:bg-accent bg-background flex w-full cursor-pointer items-center justify-between rounded-lg border p-2 transition-all"
			>
				<div class="flex-1 text-center">
					<p class="text-foreground text-lg font-semibold">
						{formatTime(slot.start, selectedTimezone)}
					</p>
				</div>
			</button>
		{/each}
	</div>
{:else}
	<p class="text-muted-foreground text-center text-sm">
		No 30-minute slots available for this date
	</p>
{/if}
