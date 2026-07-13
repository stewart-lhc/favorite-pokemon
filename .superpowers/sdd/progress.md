# Subagent-driven development progress

| Task | Status | Commit | Requirements review | Quality review |
| --- | --- | --- | --- | --- |
| 0. Baseline and ledger | Complete | plan commit | Pass | Pass |
| 1. Analytics and SPA page views | Complete | task commit | Pass | Pass |
| 2. Declaration and sharing events | Complete | task commit | Pass | Pass |
| 3. Picker and Game events | Complete | task commit | Pass | Pass |
| 4. Tally feedback | Pending | — | Pending | Pending |
| 5. Stats growth page and deep links | Pending | — | Pending | Pending |
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
