# Task 01 brief: Analytics foundation and SPA page views

## Objective

Create the typed, failure-safe GA4 adapter and make initial/SPA route page views reliable without double-counting the first page.

## Required behavior

- `trackEvent` and `trackPageView` no-op safely when `window.gtag` is unavailable.
- `trackPageView` sends explicit page location, path, title, language, and route type.
- GA4 automatic page view is disabled in `index.html`.
- The React app sends exactly one initial page view and one additional page view for each canonical SPA navigation.
- Pokémon/declaration detail routes receive stable route types without sending IDs as custom high-cardinality dimensions.
- No trainer name, declaration reason, feedback content, Tally submission ID, declaration ID, or Picker board is sent.

## TDD evidence required

1. Add focused tests and run them before implementation; record the relevant RED failure.
2. Implement the minimum production behavior.
3. Run focused tests to GREEN, then run the full suite and lint.
4. Summarize changed files, RED output, GREEN output, and self-review findings.

## Scope

- Create `src/lib/analytics.ts` and `src/lib/analytics.test.ts`.
- Modify `src/vite-env.d.ts`, `index.html`, `src/App.tsx`, and `src/App.test.tsx` only as needed.
- Update `.superpowers/sdd/progress.md` status/evidence, but do not mark reviews passed.
- Do not implement business events from Tasks 2–4.
- Do not commit; the root agent will run reviews first.
