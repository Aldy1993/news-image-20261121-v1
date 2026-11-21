// news-image-20261121: check the front-page PNG and hand it to the harness.
//
// Reads entry.png sitting next to this file, confirms it really is a PNG,
// that it fits the 1 MiB size cap and the 1024x1024 pixel cap, then places an
// exact copy at $MAKEFUN_OUTPUT_DIR/entry.png (default /output) and proves
// the copy matches the original byte for byte.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024;
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message: string): never {
  throw new Error(`entry check failed: ${message}`);
}

function pngDimensions(buf: Buffer): { width: number; height: number } {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("not a PNG (bad signature)");
  }
  if (buf.toString("ascii", 12, 16) !== "IHDR" || buf.readUInt32BE(8) !== 13) {
    fail("first chunk is not a 13-byte IHDR");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
const bytes = readFileSync(sourcePath);

if (bytes.length > MAX_BYTES) {
  fail(`entry.png is ${bytes.length} bytes, over the ${MAX_BYTES} byte limit`);
}
const { width, height } = pngDimensions(bytes);
if (width > MAX_SIDE || height > MAX_SIDE) {
  fail(`entry.png is ${width}x${height}, over the ${MAX_SIDE}x${MAX_SIDE} limit`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.png");
writeFileSync(outPath, bytes);

const written = readFileSync(outPath);
if (!written.equals(bytes)) {
  fail("output copy differs from entry.png");
}
console.log(`ok: entry.png ${width}x${height}, ${bytes.length} bytes -> ${outPath}`);
