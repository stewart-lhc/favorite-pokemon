import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  absoluteLocalizedUrl,
  alternatesForRoute,
  brandName,
  faqFor,
  localeOptions,
  routes,
  seoFor,
  siteBaseUrl,
  siteDomain,
  siteName,
} from './seo-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const pokemonDataPath = join(publicDir, 'data', 'pokemon.json');
const today = new Date().toISOString().slice(0, 10);

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPokemonName(rawName) {
  return String(rawName)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

function generationLabelForPokemon(id) {
  if (id <= 151) return 'Gen I';
  if (id <= 251) return 'Gen II';
  if (id <= 386) return 'Gen III';
  if (id <= 493) return 'Gen IV';
  if (id <= 649) return 'Gen V';
  if (id <= 721) return 'Gen VI';
  if (id <= 809) return 'Gen VII';
  if (id <= 905) return 'Gen VIII';
  return 'Gen IX';
}

async function loadPokemonRows() {
  try {
    const payload = JSON.parse(await readFile(pokemonDataPath, 'utf8'));
    if (!Array.isArray(payload)) return [];
    return payload.filter((row) => Number.isInteger(row.id) && typeof row.slug === 'string' && row.slug);
  } catch {
    return [];
  }
}

function sitemapXml(pokemonRows) {
  const entries = [];
  for (const route of routes) {
    for (const locale of localeOptions) {
      const url = absoluteLocalizedUrl(route.path, locale.code);
      const alternates = alternatesForRoute(route.path)
        .map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(alternate.href)}" />`,
        )
        .join('\n');
      entries.push(`  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
  </url>`);
    }
  }

  const pokemonEntries = pokemonRows.map((row) => `  <url>
    <loc>${xmlEscape(`${siteBaseUrl}/pokemon/${row.slug}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);

  const aiFiles = [
    { loc: `${siteBaseUrl}/llms.txt`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${siteBaseUrl}/answers.md`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${siteBaseUrl}/pokemon-pages.md`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${siteBaseUrl}/pricing.md`, changefreq: 'monthly', priority: '0.4' },
  ].map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...entries, ...pokemonEntries, ...aiFiles].join('\n')}
</urlset>
`;
}

function robotsTxt() {
  return `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${siteBaseUrl}/sitemap.xml
`;
}

function llmsTxt() {
  const pageLinks = routes
    .map((route) => `- ${route.label}: ${absoluteLocalizedUrl(route.path, 'en')}`)
    .join('\n');
  const localeLinks = localeOptions
    .map((locale) => `- ${locale.label}: ${absoluteLocalizedUrl('/', locale.code)}`)
    .join('\n');

  return `# ${siteName}

> ${brandName} is a fan-made community Pokédex where trainers declare their favorite or least favorite Pokémon, explore live rankings, play a popularity guessing game, and download shareable trainer cards.

Canonical domain: ${siteBaseUrl}/
Last updated: ${today}

## What Favmon Offers

- Favorite and least-favorite declaration modes for National Dex Pokémon.
- Community Pokédex coverage, rankings, latest declarations, and popularity stats.
- A "Who's More Loved?" guessing game based on declaration data.
- Downloadable social cards in square, story, and X/Twitter banner formats.
- Multilingual entry points for English, Japanese, Korean, Chinese, Spanish, and French audiences.
- Canonical Pokémon detail pages at /pokemon/:slug for all 1025 National Dex Pokémon.

## Important Pages

${pageLinks}
- Pokémon detail page index: ${siteBaseUrl}/pokemon-pages.md
- Example Pokémon page: ${siteBaseUrl}/pokemon/pikachu
- AI answer file: ${siteBaseUrl}/answers.md
- Pricing and access: ${siteBaseUrl}/pricing.md

## Localized Entry Points

${localeLinks}

## Entity and Attribution Notes

This is an independent fan-made website. It is not affiliated with or endorsed by Nintendo or The Pokémon Company. Pokémon and related names are trademarks of Nintendo/Creatures Inc./GAME FREAK Inc.

Data sources include PokéAPI for Pokémon names, types, sprites, and official artwork URLs, plus Favmon's own Neon Postgres declaration data.
`;
}

function pokemonPagesMd(pokemonRows) {
  const rows = pokemonRows
    .map((row) => {
      const name = formatPokemonName(row.name ?? row.slug);
      const number = `#${String(row.id).padStart(3, '0')}`;
      const types = Array.isArray(row.types) ? row.types.join(', ') : '';
      return `| ${number} | ${name} | ${generationLabelForPokemon(row.id)} | ${types} | ${siteBaseUrl}/pokemon/${row.slug} |`;
    })
    .join('\n');

  return `# Favmon Pokémon Detail Pages

Last updated: ${today}

Favmon provides one canonical detail page for each of the 1025 National Dex Pokémon. Each page follows the URL pattern \`${siteBaseUrl}/pokemon/:slug\` and includes National Dex metadata, type, generation, community fan count, rank, recent declarations, related Pokémon, and a direct declaration link.

| Dex | Pokémon | Generation | Types | Canonical URL |
|---|---|---|---|---|
${rows}
`;
}

function answersMd() {
  const routeBlocks = routes
    .map((route) => {
      const seo = seoFor(route.path, 'en');
      return `## ${route.label}

**${seo.socialTitle}**: ${seo.description}

Canonical URL: ${absoluteLocalizedUrl(route.path, 'en')}`;
    })
    .join('\n\n');

  const faq = faqFor('en')
    .map(([question, answer]) => `### ${question}\n\n${answer}`)
    .join('\n\n');

  return `# Favmon Answers

Last updated: ${today}

## What is Favmon?

Favmon is a fan-made community Pokédex for declaring favorite and least-favorite Pokémon. It combines National Dex Pokémon data, community declarations, popularity rankings, and downloadable trainer cards in one multilingual web app.

## Does each Pokémon have a Favmon detail page?

Yes. Favmon has one canonical detail page for each of the 1025 National Dex Pokémon. The URL pattern is \`${siteBaseUrl}/pokemon/:slug\`, such as ${siteBaseUrl}/pokemon/pikachu. These pages include type, generation, fan count, rank, latest declarations, related Pokémon, and a preselected declaration link.

${routeBlocks}

## Frequently Asked Questions

${faq}

## Data Sources

- Pokémon names, types, sprites, and official artwork: PokéAPI and the public PokeAPI sprite repositories.
- Community rankings and latest declarations: Favmon's own Neon Postgres database.
- Site ownership and social links: Favmon / Mixel creator profiles linked from the footer.
`;
}

function pricingMd() {
  return `# Pricing - Favmon

Last updated: ${today}

## Free

- Price: $0/month.
- Access: Public web app at ${siteBaseUrl}/.
- Included: Favorite Pokémon declarations, least-favorite mode, community Pokédex rankings, stats, popularity game, and downloadable trainer cards.
- Account required: No account is required for browsing. Declaration submission is limited by device storage and server validation.

## Paid Plans

Favmon does not currently sell paid plans, subscriptions, or in-app purchases.
`;
}

async function main() {
  await mkdir(publicDir, { recursive: true });
  const pokemonRows = await loadPokemonRows();
  await Promise.all([
    writeFile(join(publicDir, 'sitemap.xml'), sitemapXml(pokemonRows)),
    writeFile(join(publicDir, 'robots.txt'), robotsTxt()),
    writeFile(join(publicDir, 'llms.txt'), llmsTxt()),
    writeFile(join(publicDir, 'answers.md'), answersMd()),
    writeFile(join(publicDir, 'pokemon-pages.md'), pokemonPagesMd(pokemonRows)),
    writeFile(join(publicDir, 'pricing.md'), pricingMd()),
  ]);

  console.log(`Generated SEO/AEO assets for ${siteDomain} with ${pokemonRows.length} Pokemon detail URLs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
