# Task 05 brief: Stats growth page and canonical deep links

## Objective

Turn `/stats` into a transparent Favmon community ranking page that links authority to real Pokémon detail pages, while adding low-risk canonical deep links from recent declaration surfaces.

## Required behavior

### Community sample and mode

- `StatsPage` receives the active `mode`.
- H1 and visible explanatory copy clearly describe a Favmon community ranking, never a global/worldwide ranking.
- Visible copy distinguishes Favorite from Least-favorite mode.
- Show total declarations, number of Pokémon with at least one declaration, community sample/source, PokéAPI base-data attribution, and that data refreshes when the page loads.
- Copy must be present in every existing independent locale translation object; regional locales may inherit existing base locale behavior.

### Ranking integrity

- Build the ranked collection by filtering `votes > 0` before Top 10 and Top 25 slicing.
- Zero-vote Pokémon must not appear in ranking sections.
- Metrics may still use the full Pokédex denominator for coverage.
- Do not manufacture build-time or runtime claims beyond the actual loaded data.

### Canonical detail links

- Top 10 Pokémon labels link to `localizedPokemonPath(row.slug, language)`.
- Full Ranking Pokémon names link to the same canonical/localized route.
- Latest declarations in Stats link by Pokémon ID to the canonical slug when available.
- Latest declarations on the home page and `/explore` link to canonical/localized Pokémon detail routes.
- Links must remain crawlable anchors and must not replace existing declaration/card interactions.

### Accessibility and resilience

- Methodology/sample text uses semantic headings/paragraphs and readable responsive styles.
- Empty/no-positive-vote states do not fill rankings with zero-vote rows.
- Existing loading, mode switching, charts, pagination, and declaration flows continue to work.

## TDD evidence required

1. Add `/stats` fixture with at least 3 positive-vote rows and 1 zero-vote row; observe RED for mode/sample text, zero filtering, and canonical links.
2. Implement minimum Stats behavior and run focused GREEN.
3. Add home/Explore canonical-link tests and observe RED before wiring.
4. Implement low-risk links and run focused GREEN.
5. Run complete `npm test` GREEN, `npm run lint`, `npx tsc -b`, and `git diff --check`.
6. Record RED/GREEN evidence and self-review in `.superpowers/sdd/progress.md`.

## Scope

- Modify `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`, and `.superpowers/sdd/progress.md`.
- Do not modify metadata, `scripts/seo-config.mjs`, static fallback generation, sitemap, or detail-page template in this task.
- Do not add new URL families.
- Do not commit; the root agent will run independent reviews first.
