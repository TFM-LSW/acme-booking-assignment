# API Configuration Documentation

## Overview

The application now uses a centralized configuration module (`src/lib/config.ts`) that follows industry-standard practices for managing environment variables and API endpoints.

## Benefits of This Approach

1. **Centralized Configuration**: All API endpoints are defined in one place
2. **Runtime Validation**: Catches missing or undefined environment variables early
3. **Type Safety**: Configuration is typed and validated at runtime
4. **Consistent URL Construction**: Single method for building API URLs
5. **Fallback Defaults**: Graceful handling of missing optional configuration
6. **Developer Experience**: Clear error messages and dev-mode logging

## Configuration Structure

```typescript
import { config } from '$lib/config';

// Access API configuration
config.api.baseUrl              // Base URL for API calls (empty for relative paths)
config.api.paths.availability   // Availability endpoint path
config.api.paths.bookings       // Bookings endpoint path

// Build full API URLs
config.getApiUrl(config.api.paths.bookings)
```

## Usage Examples

### Client-Side API Calls

```typescript
// src/lib/api/bookings.ts
import { config } from '$lib/config';

export async function createBooking(data: CreateBookingRequest) {
    const url = config.getApiUrl(config.api.paths.bookings);
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}
```

### Page Load Functions

```typescript
// src/routes/bookings/+page.ts
import { config } from '$lib/config';

export const load = async ({ fetch }) => {
    const apiUrl = `${config.getApiUrl(config.api.paths.availability)}?start=${start}&end=${end}`;
    const response = await fetch(apiUrl);
    return await response.json();
};
```

### Server-Side Endpoints

Server-side endpoints use private environment variables with runtime validation:

```typescript
// src/routes/api/availability/+server.ts
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_AVAILABILITY_PATH } from '$env/static/private';

// Runtime validation ensures env vars are defined
if (!EXTERNAL_API_BASE_URL || !EXTERNAL_API_AVAILABILITY_PATH) {
    throw new Error('Missing required environment variables. Please check your .env file.');
}
```

## Environment Variables

### Client-Side (PUBLIC_ prefix)

These are exposed to the browser:

```env
# Empty string = use relative paths (recommended for same-origin APIs)
PUBLIC_API_BASE_URL=

# API endpoint paths
PUBLIC_API_AVAILABILITY_PATH=/api/availability
PUBLIC_API_BOOKINGS_PATH=/api/bookings
```

### Server-Side (No prefix)

These are kept secure on the server:

```env
# External API configuration
EXTERNAL_API_BASE_URL=https://calendar.meetchase.ai
EXTERNAL_API_AVAILABILITY_PATH=/api/availability
EXTERNAL_API_MEETINGS_PATH=/api/meetings
```

## How It Handles Undefined Values

The configuration module safely handles various "undefined" scenarios:

1. **JavaScript `undefined`**: Falls back to default value
2. **Empty string `""`**: Treated as valid (useful for relative paths)
3. **String `"undefined"`**: Treated as undefined and falls back to default
4. **Whitespace-only strings**: Trimmed and treated as empty

## Migration Guide

### Before

```typescript
import { PUBLIC_API_BASE_URL, PUBLIC_API_BOOKINGS_PATH } from '$env/static/public';

const url = PUBLIC_API_BASE_URL 
    ? `${PUBLIC_API_BASE_URL}${PUBLIC_API_BOOKINGS_PATH}`
    : PUBLIC_API_BOOKINGS_PATH;
```

### After

```typescript
import { config } from '$lib/config';

const url = config.getApiUrl(config.api.paths.bookings);
```

## Debugging

In development mode, the configuration is logged on first import:

```
📋 API Configuration loaded: {
  baseUrl: '(relative paths)',
  availabilityPath: '/api/availability',
  bookingsPath: '/api/bookings'
}
```

This helps catch configuration issues early during development.

## Testing

The configuration works seamlessly with E2E tests. The `BASE_URL` environment variable is separate and used only for test navigation:

```bash
# Run E2E tests with custom base URL
BASE_URL=http://localhost:5173 pnpm test:e2e
```

## Error Handling

### Client-Side

If environment variables are undefined, the config module uses sensible defaults:
- `baseUrl`: Empty string (relative paths)
- `paths.availability`: `/api/availability`
- `paths.bookings`: `/api/bookings`

### Server-Side

Server endpoints throw descriptive errors if required environment variables are missing:

```
Error: Missing required environment variables: EXTERNAL_API_BASE_URL and/or EXTERNAL_API_MEETINGS_PATH. 
Please check your .env file.
```

This ensures the application fails fast with clear error messages rather than making requests to invalid URLs like `/undefinedundefined`.
