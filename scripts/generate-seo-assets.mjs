import { mkdir, writeFile } from 'node:fs/promises';
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
const today = new Date().toISOString().slice(0, 10);

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sitemapXml() {
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

  const aiFiles = [
    { loc: `${siteBaseUrl}/llms.txt`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${siteBaseUrl}/answers.md`, changefreq: 'weekly', priority: '0.6' },
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
${[...entries, ...aiFiles].join('\n')}
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

## Important Pages

${pageLinks}
- AI answer file: ${siteBaseUrl}/answers.md
- Pricing and access: ${siteBaseUrl}/pricing.md

## Localized Entry Points

${localeLinks}

## Entity and Attribution Notes

This is an independent fan-made website. It is not affiliated with or endorsed by Nintendo or The Pokémon Company. Pokémon and related names are trademarks of Nintendo/Creatures Inc./GAME FREAK Inc.

Data sources include PokéAPI for Pokémon names, types, sprites, and official artwork URLs, plus Favmon's own Neon Postgres declaration data.
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
  await Promise.all([
    writeFile(join(publicDir, 'sitemap.xml'), sitemapXml()),
    writeFile(join(publicDir, 'robots.txt'), robotsTxt()),
    writeFile(join(publicDir, 'llms.txt'), llmsTxt()),
    writeFile(join(publicDir, 'answers.md'), answersMd()),
    writeFile(join(publicDir, 'pricing.md'), pricingMd()),
  ]);

  console.log(`Generated SEO/AEO assets for ${siteDomain}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
