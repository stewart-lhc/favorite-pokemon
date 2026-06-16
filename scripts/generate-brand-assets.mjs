import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const brandDir = join(publicDir, 'brand');
const sourceLogoPath = join(publicDir, 'pokemon_heart_logo_transparent_with_shadow.png');

const colors = {
  ink: '#0e1731',
  ink2: '#172348',
  white: '#ffffff',
};

const socialSources = [
  {
    title: 'Favmon OG image',
    desc: 'Favmon open graph preview image.',
    source: 'og-image-1200x630.png',
    output: 'og-image.png',
    brandOutput: 'og-image.svg',
    width: 1200,
    height: 630,
  },
  {
    title: 'Favmon Twitter card',
    desc: 'Favmon Twitter card preview image.',
    source: 'twitter-card-1200x675.png',
    output: 'twitter-card.png',
    brandOutput: 'twitter-card.svg',
    width: 1200,
    height: 675,
  },
  {
    title: 'Favmon social banner',
    desc: 'Favmon wide social banner.',
    source: 'social-banner-1600x900.png',
    output: 'social-banner.png',
    brandOutput: 'social-banner.svg',
    width: 1600,
    height: 900,
  },
  {
    title: 'Favmon square social banner',
    desc: 'Favmon square social banner.',
    source: 'social-banner-square-1080x1080.png',
    output: 'social-banner-square.png',
    brandOutput: 'social-banner-square.svg',
    width: 1080,
    height: 1080,
  },
  {
    title: 'Favmon X banner',
    desc: 'Favmon X profile banner.',
    source: 'social-banner-x-1500x500.png',
    output: 'social-banner-x.png',
    brandOutput: 'social-banner-x.svg',
    width: 1500,
    height: 500,
  },
];

async function imageDataUri(path) {
  const buffer = await readFile(path);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function logoImageSvg({ size = 512, logoHref, title = 'Favmon brand mark' } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Favmon capture-ball heart logo.</desc>
  <image href="${logoHref}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

function maskIconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="#000000" d="M256 48a208 208 0 1 0 0 416 208 208 0 0 0 0-416Zm0 132c43 0 79 25 95 61h111v30H351c-16 36-52 61-95 61s-79-25-95-61H50v-30h111c16-36 52-61 95-61Zm0 44c-15-23-55-12-55 18 0 31 32 51 55 68 23-17 55-37 55-68 0-30-40-41-55-18Z"/>
</svg>`;
}

function backgroundGlyphSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="34" fill="none" stroke="${colors.ink}" stroke-width="8"/>
  <path d="M15 45h66" stroke="${colors.ink}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="48" cy="48" r="14" fill="${colors.ink}"/>
</svg>`;
}

function logoLockupSvg({ logoHref }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 1200 320" role="img" aria-labelledby="title desc">
  <title id="title">Favmon logo</title>
  <desc id="desc">Horizontal Favmon logo lockup with the capture-ball heart mark.</desc>
  <rect width="1200" height="320" rx="36" fill="${colors.white}"/>
  <image href="${logoHref}" x="48" y="34" width="252" height="252" preserveAspectRatio="xMidYMid meet"/>
  <text x="338" y="164" fill="${colors.ink}" font-family="Segoe UI, Arial, sans-serif" font-size="106" font-weight="900">Favmon</text>
  <text x="346" y="220" fill="${colors.ink2}" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="750">Every Pokémon is Someone's Favorite</text>
</svg>`;
}

function imageWrapperSvg({ title, desc, href, width, height }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${desc}</desc>
  <image href="${href}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

async function resizeLogo(outputPath, size) {
  await sharp(sourceLogoPath)
    .resize(size, size, { fit: 'contain', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function copySocialAsset(asset) {
  const sourcePath = join(publicDir, asset.source);
  const outputPath = join(publicDir, asset.output);
  const metadata = await sharp(sourcePath).metadata();

  if (metadata.width === asset.width && metadata.height === asset.height) {
    await copyFile(sourcePath, outputPath);
  } else {
    await sharp(sourcePath)
      .resize(asset.width, asset.height, { fit: 'cover', position: 'center' })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
  }

  const href = await imageDataUri(outputPath);
  const svg = imageWrapperSvg({
    title: asset.title,
    desc: asset.desc,
    href,
    width: asset.width,
    height: asset.height,
  });

  await writeFile(join(brandDir, asset.brandOutput), svg);
}

async function main() {
  await mkdir(brandDir, { recursive: true });

  const logoHref = await imageDataUri(sourceLogoPath);
  const mark = logoImageSvg({ logoHref });
  const favicon = logoImageSvg({ size: 64, logoHref, title: 'Favmon favicon' });

  await Promise.all([
    writeFile(join(publicDir, 'icon.svg'), mark),
    writeFile(join(publicDir, 'favicon.svg'), favicon),
    writeFile(join(publicDir, 'mask-icon.svg'), maskIconSvg()),
    writeFile(join(brandDir, 'brand-mark.svg'), mark),
    writeFile(join(brandDir, 'logo-lockup.svg'), logoLockupSvg({ logoHref })),
    writeFile(join(brandDir, 'background-glyph.svg'), backgroundGlyphSvg()),
  ]);

  await Promise.all([
    resizeLogo(join(publicDir, 'favicon-16x16.png'), 16),
    resizeLogo(join(publicDir, 'favicon-32x32.png'), 32),
    resizeLogo(join(publicDir, 'apple-touch-icon.png'), 180),
    resizeLogo(join(publicDir, 'icon-192x192.png'), 192),
    resizeLogo(join(publicDir, 'icon-512x512.png'), 512),
    resizeLogo(join(publicDir, 'pokeball.png'), 512),
    ...socialSources.map(copySocialAsset),
  ]);

  console.log('Generated Favmon logo, favicon, PWA, and social assets from source PNGs.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
