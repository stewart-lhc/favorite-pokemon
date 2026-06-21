import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  alternatesForRoute,
  brandName,
  buildStructuredData,
  faqFor,
  kofiUrl,
  localeOptions,
  ogImageUrl,
  ogLocaleFor,
  routes,
  seoFor,
  siteBaseUrl,
  siteDomain,
  siteName,
  twitterImageUrl,
} from './seo-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const distDir = join(root, 'dist');
const indexPath = join(distDir, 'index.html');
const pokemonDataPath = join(publicDir, 'data', 'pokemon.json');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function upsertHeadTag(html, tag, matcher) {
  if (matcher.test(html)) {
    return html.replace(matcher, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertMeta(html, attributeName, attributeValue, content) {
  const matcher = new RegExp(`<meta\\b(?=[^>]*\\b${attributeName}="${escapeRegex(attributeValue)}")[^>]*>`, 'i');
  const tag = `<meta ${attributeName}="${attributeValue}" content="${escapeHtml(content)}" />`;
  return upsertHeadTag(html, tag, matcher);
}

function upsertHttpEquiv(html, attributeValue, content) {
  const matcher = new RegExp(`<meta\\b(?=[^>]*\\bhttp-equiv="${escapeRegex(attributeValue)}")[^>]*>`, 'i');
  const tag = `<meta http-equiv="${attributeValue}" content="${escapeHtml(content)}" />`;
  return upsertHeadTag(html, tag, matcher);
}

function upsertCanonical(html, href) {
  const matcher = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return upsertHeadTag(html, tag, matcher);
}

function syncAlternates(html, route) {
  const alternates = alternatesForRoute(route)
    .map((alternate) => `    <link rel="alternate" hreflang="${escapeHtml(alternate.hreflang)}" href="${escapeHtml(alternate.href)}" />`)
    .join('\n');
  const withoutAlternates = html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '');
  return withoutAlternates.replace(/(\s*<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>)/i, `$1\n${alternates}`);
}

function syncStructuredData(html, route, language) {
  const json = JSON.stringify(buildStructuredData(route, language), null, 8).replace(/</g, '\\u003c');
  const script = `<script id="structured-data" type="application/ld+json">\n        ${json.split('\n').join('\n        ')}\n    </script>`;
  const matcher = /<script(?:\s+id="structured-data")?\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;
  return upsertHeadTag(html, script, matcher);
}

function removeAlternates(html) {
  return html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '');
}

function pokemonSeo(row) {
  const name = formatPokemonName(row.name ?? row.slug);
  const number = `#${String(row.id).padStart(3, '0')}`;
  const generation = generationLabelForPokemon(row.id);
  const types = Array.isArray(row.types) && row.types.length > 0 ? row.types.map(formatPokemonName).join(', ') : 'Unknown type';
  return {
    name,
    number,
    generation,
    types,
    canonicalUrl: `${siteBaseUrl}/pokemon/${row.slug}`,
    title: `${name} Pokémon stats | Favmon`,
    socialTitle: `${name} community Pokémon page | Favmon`,
    description: `Explore ${name}: ${number}, ${generation}, ${types}, fan count, rank, latest declarations, and a preselected Favmon declaration link.`,
  };
}

function pokemonFaq(row) {
  const seo = pokemonSeo(row);
  return [
    [
      `What is the Favmon page for ${seo.name}?`,
      `${seo.name}'s Favmon page is the canonical community profile for ${seo.number}. It combines National Dex data, type and generation facts, live fan counts, ranking context, recent trainer declarations, and links to declare ${seo.name} as a favorite or least favorite Pokémon.`,
    ],
    [
      `Where does ${seo.name}'s Favmon page get its data?`,
      `Favmon uses PokéAPI-derived National Dex data for ${seo.name}'s name, type, sprite, and official artwork. Community fan counts, ranks, and declarations come from Favmon's own Neon Postgres database and update as trainers submit declarations.`,
    ],
    [
      `Can I declare ${seo.name} on Favmon?`,
      `Yes. The ${seo.name} page links directly to the Favmon trainer terminal with ${seo.name} preselected, so visitors can add their trainer name, choose favorite or least-favorite mode, and submit a declaration with a reason.`,
    ],
  ];
}

function buildPokemonStructuredData(row) {
  const seo = pokemonSeo(row);
  const organizationId = `${siteBaseUrl}/#organization`;
  const websiteId = `${siteBaseUrl}/#website`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: brandName,
        alternateName: siteName,
        url: siteBaseUrl,
        logo: `${siteBaseUrl}/icon-512x512.png`,
        sameAs: [kofiUrl],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteBaseUrl,
        name: brandName,
        alternateName: siteName,
        description: seoFor('/', 'en').description,
        inLanguage: localeOptions.map((option) => option.code),
        publisher: { '@id': organizationId },
        isAccessibleForFree: true,
      },
      {
        '@type': 'WebPage',
        '@id': `${seo.canonicalUrl}#webpage`,
        url: seo.canonicalUrl,
        name: seo.socialTitle,
        description: seo.description,
        inLanguage: 'en',
        isPartOf: { '@id': websiteId },
        publisher: { '@id': organizationId },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${siteBaseUrl}/pokemon/artwork/${row.id}.webp`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${seo.canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: brandName,
            item: siteBaseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Community Pokedex',
            item: `${siteBaseUrl}/pokedex`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: seo.name,
            item: seo.canonicalUrl,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${seo.canonicalUrl}#faq`,
        inLanguage: 'en',
        mainEntity: pokemonFaq(row).map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      },
    ],
  };
}

function syncPokemonStructuredData(html, row) {
  const json = JSON.stringify(buildPokemonStructuredData(row), null, 8).replace(/</g, '\\u003c');
  const script = `<script id="structured-data" type="application/ld+json">\n        ${json.split('\n').join('\n        ')}\n    </script>`;
  const matcher = /<script(?:\s+id="structured-data")?\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;
  return upsertHeadTag(html, script, matcher);
}

function renderCrawlableFallback(route, language) {
  const seo = seoFor(route, language);
  const pageLinks = routes
    .map((entry) => `          <li><a href="${escapeHtml(`${siteBaseUrl}${localizedPathFor(entry.path, language)}`)}">${escapeHtml(entry.label)}</a></li>`)
    .join('\n');
  const faqItems =
    route === '/'
      ? `\n        <section aria-labelledby="seo-fallback-faq-heading">\n          <h2 id="seo-fallback-faq-heading">Frequently Asked Questions</h2>\n${faqFor(language)
          .map(
            ([question, answer]) => `          <article>\n            <h3>${escapeHtml(question)}</h3>\n            <p>${escapeHtml(answer)}</p>\n          </article>`,
          )
          .join('\n')}\n        </section>`
      : '';

  return `<main class="seo-fallback" aria-label="${escapeHtml(seo.socialTitle)}">
        <h1>${escapeHtml(seo.socialTitle)}</h1>
        <p>${escapeHtml(seo.description)}</p>
        <nav aria-label="${escapeHtml(`${brandName} pages`)}">
          <ul>
${pageLinks}
          </ul>
        </nav>${faqItems}
      </main>`;
}

function syncCrawlableFallback(html, route, language) {
  const fallback = `<div id="root">\n      ${renderCrawlableFallback(route, language)}\n    </div>`;
  return html.replace(/<div\s+id="root"\s*><\/div>/i, fallback);
}

function renderPokemonFallback(row) {
  const seo = pokemonSeo(row);
  const faq = pokemonFaq(row)
    .map(
      ([question, answer]) => `          <article>
            <h2>${escapeHtml(question)}</h2>
            <p>${escapeHtml(answer)}</p>
          </article>`,
    )
    .join('\n');

  return `<main class="seo-fallback" aria-label="${escapeHtml(seo.socialTitle)}">
        <h1>${escapeHtml(`${seo.name} Pokémon stats, fans, and community rank`)}</h1>
        <p>${escapeHtml(seo.description)}</p>
        <ul>
          <li>National Dex: ${escapeHtml(seo.number)}</li>
          <li>Generation: ${escapeHtml(seo.generation)}</li>
          <li>Types: ${escapeHtml(seo.types)}</li>
        </ul>
        <section aria-labelledby="pokemon-answer-heading">
          <h2 id="pokemon-answer-heading">${escapeHtml(`${seo.name} quick answers`)}</h2>
${faq}
        </section>
        <nav aria-label="${escapeHtml(`${seo.name} Favmon actions`)}">
          <ul>
            <li><a href="${escapeHtml(`${siteBaseUrl}/?pokemon=${row.slug}#trainer-terminal`)}">Declare ${escapeHtml(seo.name)}</a></li>
            <li><a href="${escapeHtml(`${siteBaseUrl}/pokedex`)}">Community Pokedex</a></li>
            <li><a href="${escapeHtml(`${siteBaseUrl}/stats`)}">Pokemon fan rankings</a></li>
          </ul>
        </nav>
      </main>`;
}

function syncPokemonFallback(html, row) {
  const fallback = `<div id="root">\n      ${renderPokemonFallback(row)}\n    </div>`;
  return html.replace(/<div\s+id="root"\s*><\/div>/i, fallback);
}

function renderHtml(template, route, language) {
  const seo = seoFor(route, language);
  const canonicalUrl = `${siteBaseUrl}${localizedPathFor(route, language)}`;
  let html = template;
  html = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${escapeHtml(language)}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', seo.description);
  html = upsertMeta(html, 'name', 'application-name', 'Favmon');
  html = upsertMeta(html, 'name', 'apple-mobile-web-app-title', 'Favmon');
  html = upsertMeta(html, 'name', 'author', 'Mixel');
  html = upsertMeta(html, 'name', 'creator', 'Mixel');
  html = upsertMeta(html, 'name', 'publisher', 'Favmon');
  html = upsertHttpEquiv(html, 'content-language', language);
  html = upsertCanonical(html, canonicalUrl);
  html = syncAlternates(html, route);
  html = upsertMeta(html, 'property', 'og:site_name', 'Favmon');
  html = upsertMeta(html, 'property', 'og:locale', ogLocaleFor(language));
  html = upsertMeta(html, 'property', 'og:url', canonicalUrl);
  html = upsertMeta(html, 'property', 'og:title', seo.socialTitle);
  html = upsertMeta(html, 'property', 'og:description', seo.description);
  html = upsertMeta(html, 'property', 'og:image', ogImageUrl);
  html = upsertMeta(html, 'property', 'og:image:secure_url', ogImageUrl);
  html = upsertMeta(html, 'name', 'twitter:domain', siteDomain);
  html = upsertMeta(html, 'name', 'twitter:url', canonicalUrl);
  html = upsertMeta(html, 'name', 'twitter:title', seo.socialTitle);
  html = upsertMeta(html, 'name', 'twitter:description', seo.description);
  html = upsertMeta(html, 'name', 'twitter:image', twitterImageUrl);
  html = syncStructuredData(html, route, language);
  html = syncCrawlableFallback(html, route, language);
  return html;
}

function renderPokemonHtml(template, row) {
  const seo = pokemonSeo(row);
  let html = template;
  html = html.replace(/<html\s+lang="[^"]*"/i, '<html lang="en"');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', seo.description);
  html = upsertMeta(html, 'name', 'application-name', 'Favmon');
  html = upsertMeta(html, 'name', 'apple-mobile-web-app-title', 'Favmon');
  html = upsertMeta(html, 'name', 'author', 'Mixel');
  html = upsertMeta(html, 'name', 'creator', 'Mixel');
  html = upsertMeta(html, 'name', 'publisher', 'Favmon');
  html = upsertHttpEquiv(html, 'content-language', 'en');
  html = upsertCanonical(html, seo.canonicalUrl);
  html = removeAlternates(html);
  html = upsertMeta(html, 'property', 'og:site_name', 'Favmon');
  html = upsertMeta(html, 'property', 'og:locale', 'en_US');
  html = upsertMeta(html, 'property', 'og:url', seo.canonicalUrl);
  html = upsertMeta(html, 'property', 'og:title', seo.socialTitle);
  html = upsertMeta(html, 'property', 'og:description', seo.description);
  html = upsertMeta(html, 'property', 'og:image', `${siteBaseUrl}/pokemon/artwork/${row.id}.webp`);
  html = upsertMeta(html, 'property', 'og:image:secure_url', `${siteBaseUrl}/pokemon/artwork/${row.id}.webp`);
  html = upsertMeta(html, 'property', 'og:image:alt', `${seo.name} official Pokémon artwork`);
  html = upsertMeta(html, 'name', 'twitter:domain', siteDomain);
  html = upsertMeta(html, 'name', 'twitter:url', seo.canonicalUrl);
  html = upsertMeta(html, 'name', 'twitter:title', seo.socialTitle);
  html = upsertMeta(html, 'name', 'twitter:description', seo.description);
  html = upsertMeta(html, 'name', 'twitter:image', `${siteBaseUrl}/pokemon/artwork/${row.id}.webp`);
  html = upsertMeta(html, 'name', 'twitter:image:alt', `${seo.name} official Pokémon artwork`);
  html = syncPokemonStructuredData(html, row);
  html = syncPokemonFallback(html, row);
  return html;
}

function localizedPathFor(route, language) {
  const prefix = localeOptions.find((option) => option.code === language)?.prefix ?? '';
  return `${prefix}${route === '/' ? '' : route}` || '/';
}

function seoOutputPath(route, language) {
  const locale = localeOptions.find((option) => option.code === language);
  const prefix = locale?.prefix.replace(/^\//, '') ?? '';
  const segment = route === '/' ? 'index' : route.replace(/^\//, '');
  if (!prefix) {
    return join(distDir, '_seo', `${segment}.html`);
  }
  return join(distDir, '_seo', prefix, `${segment}.html`);
}

function pokemonSeoOutputPath(segment) {
  return join(distDir, '_seo', 'pokemon', `${segment}.html`);
}

async function writeRouteHtml(path, html) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html);
}

async function main() {
  const template = await readFile(indexPath, 'utf8');
  const pokemonRows = await loadPokemonRows();
  await writeFile(indexPath, renderHtml(template, '/', 'en'));

  const writes = [];
  for (const route of routes) {
    for (const locale of localeOptions) {
      writes.push(writeRouteHtml(seoOutputPath(route.path, locale.code), renderHtml(template, route.path, locale.code)));
    }
  }
  for (const pokemon of pokemonRows) {
    const html = renderPokemonHtml(template, pokemon);
    writes.push(writeRouteHtml(pokemonSeoOutputPath(pokemon.slug), html));
    writes.push(writeRouteHtml(pokemonSeoOutputPath(String(pokemon.id)), html));
  }
  await Promise.all(writes);
  console.log(`Generated ${writes.length} prerendered SEO route documents, including ${pokemonRows.length} Pokemon detail pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
