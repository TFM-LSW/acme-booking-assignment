# Meeting booking page

A modern booking link page built with SvelteKit 2 and Svelte 5, demonstrating best practices for creating a professional meeting scheduling interface. Designed with attention to usability across devices to create an easy-to-use experience on desktop, tablet, and mobile. Works seamlessly with timezone support for organisations and prospects across different timezones.

## Features

- **Calendar-based scheduling**: Interactive monthly calendar with availability highlighting
- **Timezone support**: Automatic timezone detection with manual selection options
- **Responsive design**: Mobile-first design with adaptive layouts (drawer on mobile, sidebar on desktop)
- **Real-time validation**: Email validation with instant feedback
- **Confirmation flow**: Success states with meeting details display
- **Service layer architecture**: Proper separation of concerns (UI → API client → API route → External API)

## Tech stack

- **SvelteKit 2.49.1** with **Svelte 5** (runes: $state, $derived, $effect, snippets)
- **Tailwind CSS v4** for styling
- **date-fns** and **date-fns-tz** for date manipulation and timezone handling
- **TypeScript** for type safety

## Project structure

```
src/
├── lib/
│   ├── api/
│   │   └── bookings.ts          # API client for booking operations
│   ├── components/
│   │   ├── bookings/
│   │   │   ├── BookingDrawer.svelte    # Meeting confirmation drawer
│   │   │   └── TimeSlotsList.svelte    # Time slot selection
│   │   ├── calendar/
│   │   │   ├── Calendar.svelte         # Full monthly calendar
│   │   │   ├── CalendarDayButton.svelte # Calendar day cell component
│   │   │   └── CondensedCalendar.svelte # Mobile week view
│   │   └── ui/
│   │       ├── Drawer.svelte           # Reusable drawer component
│   │       └── Footer.svelte           # App footer
│   ├── utils/
│   │   ├── actions.ts           # Svelte actions (intersection observer)
│   │   ├── availability.ts      # Availability slot calculations
│   │   ├── breakpoints.ts       # Tailwind breakpoint utilities
│   │   └── timezone.ts          # Timezone helpers
│   └── timezones.ts             # Timezone detection
└── routes/
    ├── +layout.svelte           # Root layout with CSS imports
    ├── +page.svelte             # Root page (redirects to /bookings)
    ├── layout.css               # Global styles and Tailwind directives
    ├── bookings/
    │   ├── +page.svelte         # Main booking page
    │   ├── +page.ts             # Client-side data loading
    │   └── availability-sample.json # Sample availability data
    └── api/
        └── bookings/
            └── +server.ts       # API endpoint for creating meetings
```

## Getting started

1. **Install dependencies**:

```sh
pnpm install
```

2. **Set up environment variables**:

```sh
cp .env.example .env
```

Edit `.env` and configure your API endpoints:

```
PUBLIC_API_BASE_URL=https://your-api-domain.com
PUBLIC_API_AVAILABILITY_PATH=/api/availability
PUBLIC_API_MEETINGS_PATH=/api/meetings
```

3. **Start development server**:

```sh
pnpm dev
```

4. **Open browser**:
   Navigate to http://localhost:5173 (automatically redirects to `/bookings`)

## Best practices demonstrated

### Component architecture

- **Reusable components**: Generic `Drawer` component with snippet-based content injection
- **Separation of concerns**: UI components separate from business logic
- **Props interface**: Strongly-typed component props with JSDoc comments

### State management

- **Svelte 5 runes**: Modern reactive state with `$state`, `$derived`, `$effect`
- **Derived values**: Computed state with `$derived` and `$derived.by()`
- **Effect cleanup**: Proper cleanup in `$effect` for subscriptions

### Data flow

- **Service layer**: API client abstracts fetch logic from components
- **Client-side loading**: SvelteKit `+page.ts` for data fetching with URL params
- **API routes**: SvelteKit endpoints for backend operations
- **TypeScript interfaces**: Type-safe data structures across all layers

### Form handling

- **Real-time validation**: Email validation as user types
- **Visual feedback**: Error states with border colours and messages
- **Disabled states**: Button disabled until form is valid
- **Loading states**: UI feedback during async operations

### Responsive design

- **Mobile-first**: Bottom drawer on mobile, side panel on desktop
- **Breakpoint utilities**: Centralised Tailwind breakpoint management
- **matchMedia API**: JavaScript-based responsive detection
- **Conditional components**: Different layouts for different screen sizes
- **Adaptive navigation**: Condensed week view appears when full calendar scrolls out of view
- **Smart viewport detection**: Intersection Observer API tracks calendar visibility efficiently

### Performance

- **Optimised reactivity**: Derived state prevents unnecessary component re-renders

### Accessibility

- **Semantic HTML**: Proper use of form elements and buttons
- **ARIA labels**: Dialog roles and aria-labelledby for screen readers
- **Keyboard support**: Escape key to close drawer
- **Focus indicators**: Visible focus rings on interactive elements

## Building for production

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

## Deployment

This app uses the default SvelteKit adapter. For deployment to specific platforms:

- **Vercel/Netlify**: Works out of the box
- **Node.js**: Use `@sveltejs/adapter-node`
- **Static**: Use `@sveltejs/adapter-static` (note: requires API route adjustments)

See [SvelteKit adapters](https://svelte.dev/docs/kit/adapters) for more options.

## Environment variables

- `PUBLIC_API_BASE_URL`: Base URL for the booking API
- `PUBLIC_API_AVAILABILITY_PATH`: Path to the availability endpoint
- `PUBLIC_API_MEETINGS_PATH`: Path to the meetings endpoint

Variables with `PUBLIC_` prefix are accessible in client-side code.

## License

MIT
