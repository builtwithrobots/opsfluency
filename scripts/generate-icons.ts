// v1.0.0
// Generates all PWA and favicon raster assets from inline SVG using sharp.
// Run with: npx tsx scripts/generate-icons.ts
//
// Output files (all written to /public):
//   favicon.ico            32x32  -- PNG-format, served as fallback favicon
//   icon-192.png           192x192
//   icon-512.png           512x512
//   icon-maskable-192.png  192x192  maskable (icon within inner 80% safe zone)
//   icon-maskable-512.png  512x512  maskable
//   apple-touch-icon.png   180x180  opaque teal bg, no border-radius (iOS adds its own)

import sharp from 'sharp';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const PUBLIC_DIR = path.resolve(__dirname, '../public');

if (!existsSync(PUBLIC_DIR)) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Podcast icon paths (Lucide 0.469, 24x24 viewBox).
function podcastPaths(strokeColor: string, fillColor: string): string {
  return `
    <path d="M16.85 18.58a9 9 0 1 0-9.7 0"
      stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M8 14a5 5 0 1 1 8 0"
      stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="12" cy="11" r="1" fill="${fillColor}"/>
    <path d="M13 17a1 1 0 1 0-2 0l.5 4.5a0.5 0.5 0 0 0 1 0z" fill="${fillColor}"/>
  `;
}

// Standard icon: teal rounded-square badge, icon at 85% of canvas, centred.
function regularSvg(size: number): string {
  const iconPx  = size * 0.85;
  const offset  = (size - iconPx) / 2;
  const scale   = iconPx / 24;
  const rx      = Math.round(size * 0.15);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#14B8A6"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    ${podcastPaths('white', 'white')}
  </g>
</svg>`;
}

// Maskable icon: solid teal fills entire canvas (no rounded corners), icon
// centred within the inner 80% safe zone so Android adaptive masks never clip.
function maskableSvg(size: number): string {
  const safeSize   = size * 0.8;
  const safeOffset = size * 0.1;
  const scale      = safeSize / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#14B8A6"/>
  <g transform="translate(${safeOffset}, ${safeOffset}) scale(${scale})">
    ${podcastPaths('white', 'white')}
  </g>
</svg>`;
}

// Apple touch icon: opaque teal background, no border-radius (iOS applies its
// own rounded mask). Icon at 72% of canvas to leave comfortable iOS padding.
function appleTouchSvg(size: number): string {
  const iconPx  = size * 0.72;
  const offset  = (size - iconPx) / 2;
  const scale   = iconPx / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#14B8A6"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    ${podcastPaths('white', 'white')}
  </g>
</svg>`;
}

interface Job {
  filename: string;
  svg: string;
  size: number;
}

const JOBS: Job[] = [
  { filename: 'favicon.ico',             svg: regularSvg(32),     size: 32  },
  { filename: 'icon-192.png',            svg: regularSvg(192),    size: 192 },
  { filename: 'icon-512.png',            svg: regularSvg(512),    size: 512 },
  { filename: 'icon-maskable-192.png',   svg: maskableSvg(192),   size: 192 },
  { filename: 'icon-maskable-512.png',   svg: maskableSvg(512),   size: 512 },
  { filename: 'apple-touch-icon.png',    svg: appleTouchSvg(180), size: 180 },
];

async function run(): Promise<void> {
  console.log('Generating icons...\n');
  for (const job of JOBS) {
    const dest = path.join(PUBLIC_DIR, job.filename);
    await sharp(Buffer.from(job.svg))
      .resize(job.size, job.size)
      .png()
      .toFile(dest);
    console.log(`  OK  ${job.filename}  (${job.size}x${job.size})`);
  }
  console.log('\nDone.');
}

run().catch((err: Error) => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
