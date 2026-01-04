# Meeting booking page

A modern booking link page built with SvelteKit 2 and Svelte 5, demonstrating best practices for creating a professional meeting scheduling interface. Designed with attention to usability across devices to create an easy-to-use experience on desktop, tablet, and mobile. Works seamlessly with timezone support for organisations and prospects across different timezones.

## Table of Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Best practices demonstrated](#best-practices-demonstrated)
  - [Component architecture](#component-architecture)
  - [State management](#state-management)
  - [Data flow](#data-flow)
  - [Form handling](#form-handling)
  - [Responsive design](#responsive-design)
  - [Performance](#performance)
  - [Accessibility](#accessibility)
- [Design decisions and trade-offs](#design-decisions-and-trade-offs)
  - [Showing the condensed calendar](#showing-the-condensed-calendar)
  - [Timezone handling limitations](#timezone-handling-limitations)
  - [Why simulate the API endpoint?](#why-simulate-the-api-endpoint)
- [What I'd improve with more time](#what-id-improve-with-more-time)
  - [Full timezone support](#full-timezone-support)
  - [Testing](#testing)
  - [Nice-to-have features](#nice-to-have-features)
  - [Developer experience](#developer-experience)
- [Building for production](#building-for-production)
- [Deployment](#deployment)
- [Environment variables](#environment-variables)
- [License](#license)

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

## Design decisions and trade-offs

### Usability and design principles before creative design

Given the time constraints, I prioritised building a reliable, functional page that delivers a great user experience across mobile and desktop. The focus was on typography (font legibility), solid layout principles, and a few thoughtful UX enhancements. Without brand guidelines and additional time, creative took a back seat to usability—design aesthetics are subjective, but good UX is measurable.

### Showing the condensed calendar

On mobile, when you scroll down and the full calendar moves out of view, a condensed week view appears. I used an Intersection Observer to detect this rather than scroll position calculations. It's a bit more complex than showing it always, but significantly improves the mobile experience by keeping date selection visible.

### Timezone select input

I've included a select input for the user (prespect) to toggle between their time and the organisations timezone. I've left this as static for the demo but have inclided a function to hide it when both prospect and organisations timezone is equal.

### Timezone handling limitations

The current implementation derives IANA timezones from UTC offsets (like `Etc/GMT+5`). This works fine for offset-based systems but doesn't handle daylight saving time. A full IANA timezone database would be more accurate but requires backend support to properly map timezones.

### Why simulate the API endpoint?

The `/api/bookings/+server.ts` route currently simulates the booking creation. In production, this would proxy to your actual API. Having this layer gives us a place to add authentication, validation, or rate limiting later without changing the frontend code.

## What I'd improve with more time

### Full timezone support

The timezone handling could be much better with:

- Proper daylight saving time support
- Timezone search/filtering (typing "London" finds GMT)
- Display timezone abbreviations alongside UTC offsets
- Better handling of edge cases like half-hour offsets

### Testing

Testing setup includes:

- **Unit tests** for utilities (timezone, availability) with Vitest
- **Component tests** for interactive components using Testing Library
- **E2E tests** with [Stagehand](https://github.com/browserbase/stagehand) for full user flow testing

#### Running Tests

```bash
# Run unit and component tests
pnpm test:run

# Run e2e tests (no API key required)
pnpm test:e2e

# Run e2e tests in UI mode
pnpm test:e2e:ui

# Run with automated dev server
./scripts/run-e2e-tests.sh
```

**E2E Testing Setup**: E2E tests run in standard mode by default (no API key required). For AI-powered mode using natural language actions, an API key is needed (Google Gemini recommended - free tier available). See [E2E Testing README](./src/tests/e2e/README.md) for setup instructions.

Future improvements:

- Integration tests for the full booking flow
- Accessibility tests with axe-core

### Nice-to-have features

If this were a real product, I'd add:

- Multiple attendees per meeting
- Meeting notes or agenda field
- Calendar integration (Google Calendar, Outlook)
- Ability to cancel or reschedule bookings

### Developer experience

To make the codebase easier to work with:

- Storybook for component documentation
- Pre-commit hooks to catch issues early
- Conventional commits for better changelog generation
- More comprehensive JSDoc comments

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
