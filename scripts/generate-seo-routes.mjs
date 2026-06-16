import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  alternatesForRoute,
  brandName,
  buildStructuredData,
  faqFor,
  localeOptions,
  ogImageUrl,
  ogLocaleFor,
  routes,
  seoFor,
  siteBaseUrl,
  siteDomain,
  twitterImageUrl,
} from './seo-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const indexPath = join(distDir, 'index.html');

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

async function writeRouteHtml(path, html) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html);
}

async function main() {
  const template = await readFile(indexPath, 'utf8');
  await writeFile(indexPath, renderHtml(template, '/', 'en'));

  const writes = [];
  for (const route of routes) {
    for (const locale of localeOptions) {
      writes.push(writeRouteHtml(seoOutputPath(route.path, locale.code), renderHtml(template, route.path, locale.code)));
    }
  }
  await Promise.all(writes);
  console.log(`Generated ${writes.length} prerendered SEO route documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
