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

## Output expectations

When you write code:

- Include only the relevant files/patches.
- Use minimal viable code, then iterate.
- Add types at boundaries (props, load return, server handlers).
- If you add a new pattern, provide a short comment explaining why.
