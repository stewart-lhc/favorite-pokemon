# Task 04 brief: contextual Tally feedback

## Objective

Add resilient, accessible Tally feedback entry points across the whole SPA and on declaration success, with a strict context allowlist and reliable GA4 open/submit events.

## Verified integration facts

- Existing editor URL: `https://tally.so/forms/Y5yydd/edit`; verified Form ID is `Y5yydd`.
- Production code must read `VITE_TALLY_FEEDBACK_FORM_ID`; do not hard-code an authenticated editor URL.
- Tally widget script: `https://tally.so/widgets/embed.js`.
- `Tally.openPopup(formId, options)` supports `hiddenFields`, `onOpen`, and `onSubmit`.
- The `onSubmit` payload contains submission metadata and full answers; the application must ignore the payload completely.

## Required behavior

### Adapter

- Create a single-flight Tally script loader; concurrent/repeated calls insert at most one script.
- Reuse an already available `window.Tally` or existing loaded script.
- On script error or missing `window.Tally`, reject safely and permit a later retry; never block product behavior.
- Accept only these hidden field keys: `page`, `route_type`, `pokemon_slug`, `language`, `mode`, `referrer`, `utm_source`.
- Do not accept/pass arbitrary objects, form answers, board/query data, submission ID, or callback payload.

### Entry points

- Global floating feedback button renders after main content and outside Footer conditions so Game/Explore are covered.
- Declaration success panel includes a contextual feedback CTA.
- Missing/blank Form ID means neither entry point renders and no script is inserted.
- Script loading happens on user click, not eagerly on every page.
- Loading failure shows a localized, accessible non-blocking status.

### Analytics

- `feedback_open` fires from Tally `onOpen`, not from button click.
- `feedback_submit` fires from Tally `onSubmit`, but ignores the callback payload.
- Both events contain only route type, language, mode, source page, and optional Pokémon slug.
- No feedback text, fields, respondent ID, form ID, or submission ID enters GA4.

### Context sanitization

- `page` is pathname only; no hash or query.
- `utm_source` is the single URL parameter value only.
- `referrer` is origin/hostname only, without path or query.
- `pokemon_slug` comes from the canonical route context, not arbitrary form input.

## TDD evidence required

1. Adapter tests RED before implementation: missing ID, single-flight script, existing Tally reuse, error/retry, hidden-field allowlist.
2. Component tests RED before implementation: no ID hidden, open/submit callbacks, loading failure feedback, payload ignored.
3. App tests RED before wiring: global entry appears on Game/Explore and declaration success entry receives Pokémon context.
4. Run focused GREEN, full `npm test`, `npm run lint`, `npx tsc -b`, and `git diff --check`.
5. Record RED/GREEN evidence and self-review in `.superpowers/sdd/progress.md`.

## Scope

- Create `src/lib/tally.ts`, `src/lib/tally.test.ts`.
- Create `src/components/FeedbackButton.tsx`, `src/components/FeedbackButton.test.tsx`.
- Modify `src/vite-env.d.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`, and `.superpowers/sdd/progress.md` as needed.
- Do not edit the external Tally form or hosting environment.
- Do not implement Stats, metadata, or static SEO.
- Do not commit; the root agent will run independent reviews first.
