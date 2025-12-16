<script lang="ts">
	import { formatInTimeZone } from 'date-fns-tz';
	import Drawer from '$lib/components/ui/Drawer.svelte';

	interface TimeSlot {
		start: Date;
		end: Date;
	}

	interface MeetingFormData {
		name: string;
		email: string;
		start: Date;
		end: Date;
	}

	interface Props {
		/**
		 * Whether the drawer is open
		 */
		open: boolean;
		/**
		 * Selected time slot for meeting
		 */
		slot: TimeSlot | null;
		/**
		 * Timezone identifier for displaying the selected time
		 */
		timezone: string;
		/**
		 * Formatted timezone offset for display (e.g., "UTC-5")
		 */
		timezoneOffset: string;
		/**
		 * User's local timezone for showing conversion helper
		 */
		localTimezone: string;
		/**
		 * Whether the selected timezone is the user's local timezone
		 */
		isLocalTimezone: boolean;
		/**
		 * Callback to close the drawer
		 */
		onClose: () => void;
		/**
		 * Callback when meeting is submitted
		 */
		onSubmit: (data: MeetingFormData) => Promise<void>;
	}

	let {
		open,
		slot,
		timezone,
		timezoneOffset,
		localTimezone,
		isLocalTimezone,
		onClose,
		onSubmit
	}: Props = $props();

	/**
	 * Form state
	 */
	let name = $state('');
	let email = $state('');
	let emailError = $state('');
	let isSubmitting = $state(false);
	let isConfirmed = $state(false);

	/**
	 * Validate email format
	 */
	function validateEmail(emailValue: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(emailValue);
	}

	/**
	 * Check if form is valid
	 */
	let isFormValid = $derived(name.trim() !== '' && email.trim() !== '' && emailError === '');

	/**
	 * Reset form when drawer closes
	 */
	$effect(() => {
		if (!open) {
			name = '';
			email = '';
			emailError = '';
			isSubmitting = false;
			isConfirmed = false;
		}
	});

	/**
	 * Handle email input changes
	 */
	function handleEmailChange(e: Event) {
		const target = e.target as HTMLInputElement;
		email = target.value;

		if (email.trim() === '') {
			emailError = '';
		} else if (!validateEmail(email)) {
			emailError = 'Please enter a valid email address';
		} else {
			emailError = '';
		}
	}

	/**
	 * Handle form submission
	 */
	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!slot) return;

		isSubmitting = true;

		try {
			await onSubmit({
				name,
				email,
				start: slot.start,
				end: slot.end
			});
			isConfirmed = true;
		} catch (error) {
			console.error('Failed to submit meeting:', error);
			// TODO: Show error message
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * Format time in the user's selected timezone
	 */
	function formatSelectedTime(date: Date): string {
		return formatInTimeZone(date, timezone, 'h:mm a').toLowerCase();
	}

	/**
	 * Format date in the user's selected timezone
	 */
	function formatSelectedDate(date: Date): string {
		return formatInTimeZone(date, timezone, 'EEEE, MMMM d, yyyy');
	}

	/**
	 * Format time in user's local timezone (for conversion helper)
	 */
	function formatLocalTime(date: Date): string {
		return formatInTimeZone(date, localTimezone, 'h:mm a').toLowerCase();
	}
</script>

<Drawer {open} title="Confirm meeting" {onClose}>
	{#snippet children()}
		{#if slot}
			<!-- Selected Time Card -->
			<div class="bg-accent border-border mb-6 rounded-lg border p-4">
				<div class="mb-4">
					<p class="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
						Selected Time
					</p>
					<p class="text-3xl font-semibold">
						{formatSelectedTime(slot.start)} - {formatSelectedTime(slot.end)}
					</p>
					<p class="text-foreground mt-2 text-base">
						{formatSelectedDate(slot.start)}
					</p>
					<p class="text-muted-foreground mt-1 text-sm">
						{timezoneOffset}
					</p>

					{#if !isLocalTimezone}
						<!-- Timezone conversion helper -->
						<div class="bg-background/50 mt-4 flex items-start gap-2 rounded-md p-3">
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
								class="text-muted-foreground mt-0.5 shrink-0"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
							<div class="flex-1">
								<p class="text-muted-foreground text-xs font-medium">In your local time</p>
								<p class="text-foreground text-sm font-semibold">
									{formatLocalTime(slot.start)} - {formatLocalTime(slot.end)}
								</p>
							</div>
						</div>
					{/if}
				</div>

				<button
					type="button"
					onclick={onClose}
					class="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
				>
					Change time
				</button>
			</div>

			{#if !isConfirmed}
				<!-- Meeting Form -->
				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label for="name" class="mb-2 block text-sm font-medium">
							Name <span class="text-destructive">*</span>
						</label>
						<input
							type="text"
							id="name"
							bind:value={name}
							required
							class="border-input bg-background ring-offset-background focus:ring-ring placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
							placeholder="Enter your full name"
						/>
					</div>

					<div>
						<label for="email" class="mb-2 block text-sm font-medium">
							Email <span class="text-destructive">*</span>
						</label>
						<input
							type="email"
							id="email"
							value={email}
							oninput={handleEmailChange}
							required
							class="border-input bg-background ring-offset-background focus:ring-ring placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
							class:border-destructive={emailError}
							class:focus:ring-destructive={emailError}
							placeholder="Enter your email address"
						/>
						{#if emailError}
							<p class="text-destructive mt-1 text-xs">{emailError}</p>
						{/if}
					</div>

					<div class="bg-muted rounded-lg p-4">
						<p class="text-muted-foreground text-xs">
							By confirming this meeting, you'll receive a calendar invite and confirmation email.
						</p>
					</div>
				</form>
			{:else}
				<!-- Success Confirmation -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</div>
					<h3 class="text-foreground mb-2 text-xl font-semibold">Meeting confirmed!</h3>
					<p class="text-muted-foreground text-sm">
						A calendar invite and confirmation have been sent to <strong>{email}</strong>.
					</p>
				</div>
			{/if}
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if slot}
			{#if !isConfirmed}
				<button
					type="submit"
					onclick={handleSubmit}
					disabled={isSubmitting || !isFormValid}
					class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground w-full rounded-md px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
				>
					{isSubmitting ? 'Confirming...' : 'Confirm meeting'}
				</button>
			{:else}
				<button
					type="button"
					onclick={onClose}
					class="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-3 text-sm font-semibold transition-colors"
				>
					Done
				</button>
			{/if}
		{/if}
	{/snippet}
</Drawer>
