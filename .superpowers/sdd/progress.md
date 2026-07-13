# Subagent-driven development progress

| Task | Status | Commit | Requirements review | Quality review |
| --- | --- | --- | --- | --- |
| 0. Baseline and ledger | Complete | plan commit | Pass | Pass |
| 1. Analytics and SPA page views | Complete | task commit | Pass | Pass |
| 2. Declaration and sharing events | Complete | task commit | Pass | Pass |
| 3. Picker and Game events | Complete | task commit | Pass | Pass |
| 4. Tally feedback | Complete | task commit | Pass | Pass |
| 5. Stats growth page and deep links | In progress | — | Pending | Pending |
| 6. Static SEO and final gates | Pending | — | Pending | Pending |

## Shared invariants

- Implementers run sequentially in `D:\GitHub\pokemon-worktrees\growth-measurement-feedback`.
- Every implementation task must show a relevant RED test before production changes.
- Core product behavior must survive missing Analytics or Tally.
- GA4 must not receive trainer name, declaration reason, feedback content, Tally submission ID, declaration ID, or full Picker board data.
- A task advances only after requirements and quality reviews pass.

## Baseline

- Branch: `codex/growth-measurement-feedback`
- Starting point: `d9a34b5`
- Approved design commit: `5ecd243`
- Baseline verification: passed on 2026-07-13
  - `npm test`: 4 files, 23 tests passed; existing jsdom Canvas warnings only
  - `npm run lint`: passed
  - `npm run build`: passed; 2,116 SEO documents generated, including 1,025 Pokémon details
  - `npm run check`: passed
  - `git diff --check`: passed before generated artifacts and documentation were staged

## Task 1 implementation evidence

- Adapter RED: `npx vitest run src/lib/analytics.test.ts` failed because `./analytics` did not exist (1 failed suite, 0 tests collected).
- SPA RED: `npx vitest run src/App.test.tsx` failed only the 3 new page-view scenarios because GA4 received 0 `page_view` calls; 11 existing tests passed.
- Focused GREEN: `npx vitest run src/lib/analytics.test.ts src/App.test.tsx -t "analytics|tracks one initial page view|uses a stable route type"` passed 6 tests (11 unrelated tests skipped).
- Initial full GREEN: `npm test` passed 5 files and 29 tests before the privacy regression test was added; existing jsdom Canvas warnings remain non-failing.
- Lint GREEN: `npm run lint` passed with no findings.
- Privacy RED: `npx vitest run src/App.test.tsx -t "removes a Picker board and hash"` failed because `page_location` exposed the complete `board` query and hash while `page_path` exposed the `board` query.
- Privacy focused GREEN: `npx vitest run src/lib/analytics.test.ts src/App.test.tsx -t "analytics|tracks one initial page view|uses a stable route type|removes a Picker board and hash"` passed 7 tests (11 unrelated tests skipped). The sanitized URLs remove `board` and hash while retaining `utm_source`.
- Final full GREEN: `npm test` passed 5 files and 30 tests after the privacy fix; `npm run lint` and `npx tsc -b` passed.
- Stability note: an existing Picker restore test fluctuated during some broader runs, then passed in isolation and in the final full suite; no Picker production code was changed.
- StrictMode RED: `npx vitest run src/App.test.tsx -t "deduplicates the StrictMode initial effect replay"` failed because the real `<StrictMode><App /></StrictMode>` entry path sent 2 identical initial `page_view` events instead of 1.
- StrictMode focused GREEN: `npx vitest run src/lib/analytics.test.ts src/App.test.tsx -t "analytics|tracks one initial page view|deduplicates the StrictMode initial effect replay|uses a stable route type|removes a Picker board and hash"` passed 8 tests (11 unrelated tests skipped). The regression test also proves `/` -> `/stats` -> `/` sends all 3 non-consecutive page views.
- StrictMode final GREEN: `npm test` passed 5 files and 31 tests; `npm run lint`, `npx tsc -b`, and `git diff --check` passed. Existing jsdom Canvas warnings remain non-failing.
- Reviews remain pending; this ledger does not mark requirements or quality review as passed.

## Task 2 implementation evidence

- Declaration RED: `npx vitest run src/App.test.tsx -t "tracks exactly one declaration success|does not track declaration success"` produced 1 relevant failure and 1 pass; the successful backend response rendered the success panel, but GA4 received 0 `declaration_submit_success` events instead of the expected single whitelisted event.
- Declaration focused GREEN: the same command passed both success and backend-rejection scenarios. The success assertion checks the exact parameter object and separately rejects trainer name, reason text, and declaration ID.
- Sharing RED: `npx vitest run src/App.test.tsx -t "tracks a card download|tracks native sharing|tracks successful clipboard"` failed all 3 scenarios because GA4 received 0 download/native/clipboard events; the underlying download/share/copy interactions remained reachable with deterministic Canvas and Image test doubles.
- Sharing focused GREEN: the same command passed 3 tests, covering download initiation, platform intent, resolved native share, aborted native share, resolved clipboard copy, and rejected clipboard copy.
- Analytics isolation RED: `npx vitest run src/lib/analytics.test.ts -t "throwing gtag"` failed because a throwing third-party `gtag` escaped the adapter and could interrupt a product action.
- Final focused GREEN: `npx vitest run src/lib/analytics.test.ts src/App.test.tsx -t "analytics|tracks exactly one declaration success|does not track declaration success|tracks a card download|tracks native sharing|tracks successful clipboard"` passed 9 tests with 16 unrelated tests skipped.
- Full GREEN: `npm test` passed 5 files and 37 tests. Existing jsdom Canvas warnings from older tests remain non-failing; the new card-interaction tests use local deterministic Canvas/Image doubles.
- Static gates: `npm run lint`, `npx tsc -b`, and `git diff --check` all passed.
- Self-review: declaration success is emitted exactly once only after the backend promise resolves; backend rejection emits none. Download is recorded after the download helper returns. Native and clipboard events are emitted only after their promises resolve; AbortError and rejected clipboard writes emit none. A non-abort native failure preserves the existing clipboard fallback and records `copy_text` only if that fallback resolves.
- Privacy review: event payloads are constructed from Pokémon ID/slug, mode, language, source page, counts, card settings, method, and platform only. No trainer name, reason, declaration ID, URL containing an ID, or declaration object is passed to Analytics.
- Semantics note: `share_card_download` means browser download initiation, and `platform_intent` means an explicit outbound click; neither claims that a file was saved or a third-party post was completed.
- Scope review: no Picker, Game, Tally, Stats, metadata, or static SEO behavior was changed. Requirements and quality reviews remain Pending for independent reviewers.

## Task 2 quality-review remediation

- Review finding: native share plus clipboard fallback failure, and direct Copy link/Copy caption rejection, previously suppressed Analytics success correctly but left the user without product feedback.
- Failure-feedback RED: `npx vitest run src/App.test.tsx -t "shows a localized failure|keeps an aborted native share silent"` produced 2 relevant failures because both rejected paths rendered no `role="status"`; the AbortError cancellation scenario passed and remained silent.
- Failure-feedback focused GREEN: `npx vitest run src/App.test.tsx -t "shows a localized failure|keeps an aborted native share silent|tracks successful clipboard shares only"` passed 4 tests with 20 unrelated tests skipped.
- All existing application locales now expose `shareFailed`: English, Spanish (including inherited regional variants), Japanese, Korean, Simplified Chinese, Traditional Chinese (including inherited Hong Kong locale), and French.
- The three rejected product-action paths reuse the existing timed `shareStatus` live region. They display localized failure copy and still send no `share_link_click`; AbortError remains silent.
- Full-suite note: two `npm test` attempts each passed 39 of 40 tests and failed only the pre-existing fluctuating `builds a picker board and restores it from an exported code` test. That Picker test passed immediately in isolation (1 passed, 23 skipped). No Picker source behavior was changed in Task 2; the same fluctuation was already recorded under Task 1.
- Remediation static gates: `npm run lint`, `npx tsc -b`, and `git diff --check` passed.
- Quality review remains Pending until the independent reviewer rechecks this remediation.

## Task 3 implementation evidence

- Picker restore reproduction: `npx vitest run src/App.test.tsx` hit the shared 15-second test timeout in the existing end-to-end Picker restore flow after 17.345 seconds. The failure was the whole-test timeout rather than a restored-slot assertion; under the same machine load, the following pre-existing declaration success test also exceeded 15 seconds. This matches the earlier full-suite failures plus immediate isolation pass recorded above and points to an unrealistically short budget for the growing integration flow, not a product race.
- Picker restore stabilization: the test now has a 30-second per-test budget. Its selection, reset, import, restored `Pikachu` slot, enabled/disabled share-button, exported URL, cleanup, and fresh-render assertions are all unchanged. No Picker production timing or restore behavior was changed. The final full suite proves the complete flow GREEN.
- Picker RED: `npx vitest run src/App.test.tsx -t "Picker.*export|rejected Picker"` failed both successful export scenarios because GA4 received 0 `picker_export` events; the rejected Clipboard scenario already passed and confirmed that failure remained untracked.
- Picker focused GREEN: the same command passed 3 tests. It covers code Clipboard success, link Clipboard success, native success, AbortError, native-to-Clipboard successful fallback, native plus Clipboard double failure, and direct code Clipboard rejection.
- Picker privacy evidence: tests assert the exact payload (`language`, `export_method`, `filled_slots`, `team_filled`, `shiny`) and reject slot IDs, Pokémon names, the shared Picker URL, and serialized picks. The implementation constructs the event from aggregate counts and settings only; no board code, query string, Pokémon name, or slot content reaches Analytics.
- Game RED: `npx vitest run src/App.test.tsx -t "completed.*Game round"` failed both deterministic Pikachu-versus-Bulbasaur scenarios because GA4 received 0 `game_round_complete` events.
- Game focused GREEN: the same command passed 2 tests. Correct selection reports streak `0 -> 1`; incorrect selection reports `0 -> 0`; both report only mode, language, result, streak values, and numeric selected/opponent IDs. Advancing the reveal animation and using Play Again do not duplicate the prior event.
- Full GREEN: `npm test` passed 5 files and all 45 tests. Existing jsdom Canvas warnings remain non-failing.
- Static gates: `npm run lint`, `npx tsc -b`, and `git diff --check` passed.
- Self-review: events are emitted at product-success or answer-judgement boundaries, never from render/effects. Picker failures and cancellations emit no success event, and a native failure records `clipboard_link` only when its actual Clipboard fallback resolves. Game answers emit once before the reveal timer; reveal and restart contain no tracking calls. No Task 4+ Tally, Stats, metadata, or static SEO behavior was changed.
- Requirements and quality reviews remain Pending for independent reviewers.

## Task 3 quality-review remediation

- Quality finding: direct Picker code Clipboard rejection and native-share plus Clipboard-fallback double failure correctly emitted no Analytics success event, but both still rendered the false-positive `Copied.` status.
- Visible-state RED: `npx vitest run src/App.test.tsx -t "actual successful Picker|rejected Picker"` failed both relevant scenarios because the rendered status was `Copied.` instead of an accurate manual-copy instruction.
- Remediation: `PickerCopy` now defines a dedicated `exportFailed` message in every independent locale object: English, Japanese, Korean, Simplified Chinese, Traditional Chinese, Hong Kong Chinese, Spanish, and French. Regional Spanish variants continue to inherit the Spanish copy.
- Product behavior: direct code failure leaves the full code in the existing text field and shows the localized manual-copy instruction. Native plus fallback failure leaves the full share URL in that field and shows the same accurate instruction. A resolved Clipboard fallback still shows `Copied.` and sends `picker_export`; `AbortError` remains silent.
- Focused GREEN: the same command passed 2 tests. Assertions prove failure states do not show `Copied.`, do show the manual-copy instruction, preserve the code/link in the field, and emit no success event; the successful fallback remains covered by the same test.
- Full GREEN: `npm test` passed 5 files and all 45 tests. Existing jsdom Canvas warnings remain non-failing.
- Remediation static gates: `npm run lint`, `npx tsc -b`, and `git diff --check` passed.
- Quality review remains Pending until the independent reviewer rechecks this remediation.

## Task 4 implementation evidence

- Adapter RED: `npx vitest run src/lib/tally.test.ts` failed before production code because `./tally` did not exist (1 failed suite, 0 tests collected).
- Adapter GREEN: the same command passed 6 tests covering blank Form ID, single-flight loading, an existing Tally API, script failure retry, missing-API retry, strict hidden-field allowlisting, and complete submit-payload isolation.
- Component RED: `npx vitest run src/components/FeedbackButton.test.tsx` failed before production code because `./FeedbackButton` did not exist (1 failed suite, 0 tests collected).
- Component GREEN: the same command passed 3 tests covering missing-ID suppression, popup callbacks and exact safe Analytics parameters, localized accessible load failure, and non-blocking adjacent product controls.
- App RED: `npx vitest run src/App.test.tsx -t "global feedback entry|contextual feedback CTA"` failed both targeted scenarios because neither the global `Feedback` button nor declaration-success `Share feedback` CTA existed.
- App GREEN: the same command passed both tests after wiring. It proves the global entry follows `<main>`, remains present on Game and Explore, passes pathname-only page plus single-value UTM and origin-only referrer context, and passes a canonical `pikachu` slug from the selected Pokémon to the declaration-success CTA.
- Focused GREEN: `npx vitest run src/lib/tally.test.ts src/components/FeedbackButton.test.tsx src/App.test.tsx -t "Tally adapter|FeedbackButton|global feedback entry|contextual feedback CTA"` passed 11 tests with 29 unrelated tests skipped.
- Full GREEN: `npm test` passed 7 files and all 56 tests. Existing jsdom Canvas warnings remain non-failing.
- Static gates: `npm run lint`, `npx tsc -b`, and `git diff --check` passed.
- Privacy self-review: production reads only `VITE_TALLY_FEEDBACK_FORM_ID`; no editor URL is present. The adapter copies only `page`, `route_type`, `pokemon_slug`, `language`, `mode`, `referrer`, and `utm_source`. Its Tally `onSubmit` wrapper accepts no application payload and invokes a zero-argument callback, so feedback answers and submission metadata cannot reach GA4.
- Resilience self-review: scripts load only after a configured entry is clicked; concurrent calls share one promise; script errors and loaded-without-API cases remove the failed script and reset the promise for retry. Missing configuration renders neither entry and inserts no script. All failures remain local to the feedback control.
- Scope review: no external Tally form/hosting, Stats, metadata, static SEO, or Task 5+ behavior was changed. Requirements and quality reviews remain Pending for independent reviewers.

## Task 4 requirements-review remediation

- Review finding: if the matching widget script already existed and its `load`/`error` event had fired before the adapter attached listeners, while `window.Tally` was absent, the single-flight promise stayed pending forever and the button remained disabled.
- Stale-script RED: `npx vitest run src/lib/tally.test.ts -t "pre-existing stale script"` failed because fake timers advanced 8,000ms while the promise remained unsettled (`expected true, received false`).
- Remediation: every script-loading attempt now has a finite 8-second timeout. Success, script error, loaded-without-API, and timeout paths all remove listeners and clear the timer. Failure removes the unusable script, rejects the current call, and resets `loadPromise` so a later click can insert a fresh script.
- Stale-script GREEN: the same targeted adapter command passed. The test proves timeout rejection, stale-script removal, new-script insertion, and successful retry.
- UI timeout coverage: a component test preloads a stale script, advances the explicit timeout, verifies the localized `role="status"` failure and re-enabled button, then proves the next click can open Tally.
- Remediation focused GREEN: `npx vitest run src/lib/tally.test.ts src/components/FeedbackButton.test.tsx src/App.test.tsx -t "Tally adapter|FeedbackButton|global feedback entry|contextual feedback CTA"` passed 13 tests with 29 unrelated tests skipped.
- Remediation full GREEN: final `npm test` passed 7 files and all 58 tests after the timer lifecycle lint refactor; existing jsdom Canvas warnings remain non-failing. `npm run lint` and `npx tsc -b` passed.
- Requirements and quality review statuses remain Pending until independent re-review.

## Task 5 implementation evidence

- Stats RED: `npx vitest run src/App.test.tsx -t "transparent community Stats|labels the Stats community sample"` failed both new scenarios because the old page exposed neither the Favmon community favorite H1 nor the least-favorite community H1. The fixture contains three positive-vote Pokémon and one zero-vote Pokémon.
- Stats focused GREEN: the same command passed 2 tests after adding `mode` to `StatsPage`, independently localized sample/mode/source/PokéAPI/refresh copy, positive-vote filtering before Top 10/Top 25 slicing, canonical localized links in Top 10/Full Ranking/Latest, and a truthful no-positive-vote state.
- Home/Explore RED: `npx vitest run src/App.test.tsx -t "home latest declaration|Explore declaration Pokémon"` failed both tests because the latest-declaration Pokémon names were plain text and no `Pikachu` link existed.
- Home/Explore focused GREEN: the same command passed 2 tests after resolving each declaration by Pokémon ID. Home links to `/pokemon/pikachu`; the Simplified Chinese Explore fixture proves the localized `/zh-cn/pokemon/pikachu` route. The links are ordinary anchors and do not replace declaration-card interactions.
- Ranking integrity self-review: `rankedPokemon` filters `votes > 0` before sorting and slicing. The full Pokédex remains the denominator for coverage, while zero-vote Pokémon cannot appear in Top 10 or Full Ranking.
- Copy/source self-review: every independent base translation object has its own community sample, favorite/least-favorite mode, Neon source, PokéAPI attribution, page-load refresh, and empty-ranking copy. Regional locale objects continue to inherit their existing base locale. No Stats copy claims a global or worldwide ranking.
- Static gates: `npx tsc -b` and `npm run lint` passed.
- Full-suite evidence: the first `npm test` run passed 58 of 62 tests across 6 of 7 files; three pre-existing App integration tests exceeded the 15-second timeout and the previously documented Picker restore test fluctuated. A serial `npm test -- --maxWorkers=1` run passed 57 of 62 tests; it again hit three pre-existing 15-second timeouts plus the Picker fluctuation, while revealing that the new home-link test needed to await the independent backend request rather than only the Pokémon request. The Task 5 test was corrected to await the link; per root-agent instruction no third full test was started. Task 5's four focused scenarios were GREEN before that test-only wait hardening.
- Scope review: no metadata, static SEO generator, sitemap, detail-page template, or new URL family was changed. Requirements and quality reviews remain Pending for independent reviewers.

## Task 5 quality-review remediation

- Quality RED: the remediation focused run failed all 5 selected scenarios. The Stats fixture still rendered `Neon Postgres`; Refresh produced only the initial `/api/data?mode=favourite` call; the failed refresh likewise made no second call; and Favorite/Least-favorite Full Ranking sections both rendered an empty table instead of the localized empty state.
- Durable copy: all seven independent base locale objects now describe ranking source as community submissions made on Favmon, without exposing the database vendor. Their refresh copy now accurately tells users to use the Refresh control; it no longer claims an automatic page-load refresh. The Stats test asserts the durable product source and rejects `Neon`/`Postgres` in the rendered page.
- Real refresh: `StatsPage` receives an async `onRefresh` callback. The control now calls `loadBackendData` for the active mode, remains disabled while pending, preserves the visible ranking during the request, replaces Stats and Latest data on success, and always releases its pending state. The fake 550ms timer was removed.
- Failure resilience: `loadBackendData` keeps its existing fail-soft default for compatibility and accepts `{ throwOnError: true }` for callers that must distinguish failure from a legitimate empty dataset. App initial loads and manual refresh use strict mode; a failed request reports the existing warning, retains the previously visible stats/declarations, and does not leave Refresh disabled.
- Empty rankings: when `rankedPokemon` is empty, Top 10 and Full Ranking both render the same localized `statsNoRankedPokemon` message. Full Ranking does not render an empty table. Separate Favorite and Least-favorite scenarios cover this behavior.
- Async test stability: Stats methodology, sample, source, refresh copy, and declaration links use `findBy*`/`waitFor` at backend-dependent boundaries. Assertions retain their original content, link, zero-filtering, and canonical requirements.
- Focused GREEN: `npx vitest run src/lib/backend.test.ts src/App.test.tsx -t "backend API client|transparent community Stats|labels the Stats community sample|reloads the current Stats mode|preserves the visible Stats data|empty state instead of an empty Full Ranking|home latest declaration|Explore declaration Pokémon"` passed 13 tests across 2 files with 31 unrelated tests skipped.
- Full-suite attempt: `npm test` passed 64 of 66 tests. The only application failure was the repeatedly documented pre-existing Picker restore fluctuation. The other failure identified a backend default-contract regression from the first strict-loader implementation; that regression was corrected with the opt-in strict option, and all 5 backend compatibility tests then passed in the focused GREEN run.
- Final full-suite retry after the backend compatibility fix again passed 64 of 66 tests. All backend and Task 5 tests passed; failures were the previously documented Picker restore fluctuation and an unrelated declaration share-card readiness wait under suite load. No Task 5 assertion failed, and no further full-suite retry was started.
- Static gates after remediation: `npm run lint`, `npx tsc -b`, and `git diff --check` passed. Quality review remains Pending for independent re-review.

## Task 5 cross-mode race remediation

- Race RED: `npx vitest run src/App.test.tsx -t "ignores a stale favorite Refresh|clears favorite rankings"` failed both new scenarios. A pending Favorite refresh completed after a successful Least-favorite load and replaced the visible 9-vote Least-favorite data with stale 99-vote Favorite data. A failed Least-favorite mode load left the prior 22-vote Favorite ranking visible under the Least-favorite heading instead of showing the 0-vote empty state.
- Shared request policy: initial/mode-effect loads and manual Refresh now call one `requestBackendData` function. Each request receives a monotonically increasing generation. Only the current generation may update stats, declarations, backend error, or loading state; stale success and failure completions are ignored.
- Mode isolation: toggling mode invalidates the current generation immediately. The new mode request clears the prior mode's stats/declarations before loading, so a failed new-mode request renders truthful empty states rather than mismatched old-mode data. Same-mode manual Refresh still preserves its current data on failure.
- Race focused GREEN: the same command passed both inverse-completion and failed-new-mode scenarios with 39 unrelated tests skipped.
- Expanded focused GREEN: `npx vitest run src/lib/backend.test.ts src/App.test.tsx -t "backend API client|transparent community Stats|labels the Stats community sample|reloads the current Stats mode|preserves the visible Stats data|ignores a stale favorite Refresh|clears favorite rankings|empty state instead of an empty Full Ranking|home latest declaration|Explore declaration Pokémon"` passed all 15 selected tests across 2 files with 31 unrelated tests skipped.
- Static gates: `npm run lint`, `npx tsc -b`, and `git diff --check` passed. Per root-agent direction, no full-suite run was started for this remediation. Quality review remains Pending for independent re-review.

## Task 5 final review status

- Requirements review: PASS. The reviewer confirmed the shared request-generation policy, cross-mode isolation, same-mode refresh preservation, transparent community sample, positive-vote filtering, empty states, and canonical detail links. The necessary `src/lib/backend.ts` compatibility option is recorded as a justified minimal scope extension.
- Quality review: PASS after the cross-mode race remediation. The reviewer confirmed that success, failure, and completion state writes are generation-guarded; mode toggles invalidate stale requests immediately; new-mode failures cannot display old-mode rankings; and the inverse-completion and failed-new-mode tests cover the reported P1 cases.
- Task status: Complete. Task 6 metadata and static SEO work remains intentionally out of scope for this commit.
