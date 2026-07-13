# Subagent-driven development progress

| Task | Status | Commit | Requirements review | Quality review |
| --- | --- | --- | --- | --- |
| 0. Baseline and ledger | Complete | plan commit | Pass | Pass |
| 1. Analytics and SPA page views | Complete | task commit | Pass | Pass |
| 2. Declaration and sharing events | Pending | — | Pending | Pending |
| 3. Picker and Game events | Pending | — | Pending | Pending |
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
