# Task 02 brief: declaration and sharing events

## Objective

Track successful declarations and observable sharing outcomes at their true success boundaries without leaking personal or high-cardinality data.

## Required behavior

### `declaration_submit_success`

- Fire exactly once only after `createBackendDeclaration` resolves successfully.
- Do not fire on validation failure, duplicate-device guard, or backend rejection.
- Send only: `pokemon_id`, `pokemon_slug`, `mode`, `language`, `source_page`, `fan_count`, `revealed_count`.
- Never send trainer name, reason, declaration ID, or the declaration object.

### `share_card_download`

- Fire only after the browser download initiation helper completes without throwing.
- Send only: Pokémon ID/slug, mode, language, card format, art style, shiny state, source page.
- Treat the event as download initiation, not proof that a user saved the file.

### `share_link_click`

- Native share: fire only after `navigator.share` resolves; `AbortError` and rejection are not success.
- Clipboard share: fire only after `navigator.clipboard.writeText` resolves; rejection is not success.
- Platform anchors: fire on explicit click intent with a platform value; do not label it as completed sharing.
- Send only explicit Pokémon context, language/mode, method, platform, and source page.

## TDD evidence required

1. Add focused failing tests for declaration success/failure before production changes.
2. Add focused failing tests for download/native/copy/platform behavior before production changes.
3. Implement the minimum event calls at existing success boundaries.
4. Run focused GREEN, full `npm test`, `npm run lint`, `npx tsc -b`, and `git diff --check`.
5. Record RED/GREEN evidence and self-review in `.superpowers/sdd/progress.md`.

## Scope

- Modify `src/App.tsx`, `src/App.test.tsx`, `src/lib/analytics.ts`, and `src/lib/analytics.test.ts` as needed.
- Update `.superpowers/sdd/progress.md`.
- Do not implement Picker, Game, Tally, Stats, metadata, or static SEO changes.
- Do not commit; the root agent will run independent requirements and quality reviews first.
