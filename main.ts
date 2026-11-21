// news-image-20261121 entry: "The World in One Day" — Saturday 21 November 2026.
// The program copies the front-page image beside it to the output directory.
// The image is a 1024x1024 PNG drawn for this day alone: 42 stories across
// 10 regions, masthead dated Saturday 21 November 2026, a numbered world map,
// a lead story on Russian missiles landing in Poland, and a Wall Street
// slump chart (S&P 500 -3.7%, into correction).
// It runs with no network and writes the same bytes on every run.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576;
const MAX_DIMENSION = 1024;

const source = new URL('./entry.png', import.meta.url);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

// Read and gate the image before writing it out, so a broken file fails loudly.
// The gates mirror the competition's own limits: at most 1 MiB, at most 1024x1024.
const bytes = readFileSync(source);
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}

// A PNG starts with its 8-byte signature; its IHDR chunk names its size.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error('entry.png is not a PNG file');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

// The copy must be byte for byte the file beside this program, not just
// the same size: read it back and compare every byte.
const copied = readFileSync(target);
if (!copied.equals(bytes)) {
  throw new Error(`wrote ${copied.length} bytes that differ from entry.png`);
}
console.log(`wrote ${target} (${bytes.length} bytes, ${width}x${height})`);
