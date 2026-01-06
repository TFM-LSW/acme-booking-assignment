# Copilot instructions (Svelte 5 + SvelteKit)

You are assisting in a Svelte 5 + SvelteKit codebase. Follow these rules by default.

## Operating mode

- Prefer small, safe, incremental edits.
- When uncertain, propose 2 options with trade-offs, then pick a default.
- Do not invent libraries or project conventions. Follow what exists in the repo.
- Keep changes local unless the task explicitly asks for a refactor.

## Tech stack assumptions

- Svelte 5 (runes) only.
- SvelteKit routing and data loading.
- TypeScript by default.

## Svelte 5 rules (strict)

- Use runes: `$state`, `$derived`, `$effect`.
- Avoid legacy reactivity: do not use `$:` unless the repo already does.
- Avoid `onMount` unless interacting with browser-only APIs.
- Avoid stores unless the state must be shared across routes/components.
- Prefer derived state over duplicated state.

## SvelteKit rules (strict)

- Prefer `load` for fetching and transforming data.
- Keep secrets and privileged calls on the server (`+page.server.ts`, `+server.ts`).
- Use forms and actions where appropriate, not ad-hoc fetch calls.
- Keep URL state in params/searchParams, not global state.

## Coding standards

- Optimise for “how fast can I grok this file”.
- Favour explicit naming and clear control flow.
- Avoid clever abstractions and indirection.
- Keep components focused: one main responsibility per component.

## Accessibility & UI

- Semantic HTML first.
- Keyboard interaction and focus states must work.
- Ensure labels, aria attributes, and roles are correct.
- Prefer readable typography and layout over visual flourish.

## Performance optimization principles

Follow the "Render Boundary Framework" - **move logic out of the render path**:

### Tier 1: Module-level scope (highest priority)

- Move pure utility functions outside components (formatting, transformations, constants)
- Never redefine static helpers inside render functions
- Examples: date formatters, string normalizers, lookup tables, config objects

### Tier 2: Memoize with $derived

- Use `$derived` for expensive computations that depend on reactive state
- Apply to: filtering, sorting, mapping, deriving subsets, formatting values
- Ensure dependencies are minimal and specific

### Tier 3: Stabilize event handlers

- In Svelte 5, handlers are stable unless closing over reactive state
- Extract handlers that don't need reactive closure to module scope
- Use event delegation for lists when appropriate

### Tier 4: Cache expensive operations

- Pre-compute data transformations in load functions when possible
- Cache results of array operations (filter, map, reduce) based on dependencies
- Move intersection observer configs and similar objects outside render

### Tier 5: Minimize inline template computations

- Pre-compute formatted strings in $derived blocks
- Pass formatted values to templates instead of formatting inline
- Avoid calling functions directly in templates when the result can be derived

### Code review checklist

Before committing, ask:

- Does this function need to be inside the component? (If no, move it)
- Does this value depend on props/state? (If yes, use $derived)
- Can this computation be moved to a load function? (If yes, move it server-side)
- Does this mapping/filtering run on every render? (Cache with $derived)
- Are we creating new object/array references in props? (Stabilize them)
- Is the render body clean and lightweight? (If no, refactor)

### Performance red flags

- Defining functions inside components that don't close over reactive state
- Inline array operations (sort, filter, map) in templates
- Object/array literals created inline as props
- Expensive date/time formatting in template expressions
- Loops with transformations inside render blocks

## Output expectations

When you write code:

- Include only the relevant files/patches.
- Use minimal viable code, then iterate.
- Add types at boundaries (props, load return, server handlers).
- If you add a new pattern, provide a short comment explaining why.
