# Task 03 brief: Picker export and Game round events

## Objective

Track successful Picker exports and completed Game rounds without sending the encoded board, while restoring a reliable full-suite test gate.

## Precondition: stabilize the existing Picker restore test

The existing Picker query restore test passes in isolation but has timed out in recent full-suite runs as the suite grew. Before adding new production events:

- Reproduce the failure in the full App test file or full suite.
- Identify whether the cause is a real application race, leaked test state, or an unrealistically short asynchronous assertion timeout.
- Fix the root cause or stabilize the waiting strategy without weakening/removing the restored-slot assertions.
- Do not change Picker production behavior solely to satisfy timing.
- Record the failing and passing evidence in `.superpowers/sdd/progress.md`.

## Required behavior

### `picker_export`

- Fire after Clipboard export resolves successfully.
- Fire after native share resolves successfully.
- Do not fire on Clipboard rejection, native share rejection, or `AbortError`.
- If native share falls back to Clipboard, report the actual successful method.
- Send only: `language`, `export_method`, `filled_slots`, `team_filled`, `shiny`.
- Never send board code, query string, Pokémon names, or slot contents.

### `game_round_complete`

- Fire exactly once after each answer is judged.
- Send: `mode`, `language`, `correct`, `streak_before`, `streak_after`, `selected_pokemon_id`, `opponent_pokemon_id`.
- Correct answer reports incremented streak; incorrect answer reports unchanged streak and game-over result.
- A render, reveal animation, or restart must not duplicate the prior round event.

## TDD evidence required

1. Stabilize and prove the existing Picker restore assertion first.
2. Add Picker success/failure tests and observe RED before production changes.
3. Implement minimum Picker tracking and run focused GREEN.
4. Add deterministic Game correct/incorrect tests and observe RED before production changes.
5. Implement minimum Game tracking and run focused GREEN.
6. Run `npm test` until the complete suite passes once without selectively skipping tests, then `npm run lint`, `npx tsc -b`, and `git diff --check`.

## Scope

- Modify `src/App.tsx`, `src/App.test.tsx`, `src/lib/analytics.ts`, and `src/lib/analytics.test.ts` as needed.
- Update `.superpowers/sdd/progress.md`.
- Do not implement Tally, Stats, metadata, or static SEO.
- Do not commit; the root agent will run independent reviews first.
