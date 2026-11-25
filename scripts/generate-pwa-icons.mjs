import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const paper = [246, 239, 228, 255];
const cover = [140, 59, 44, 255];
const spine = [92, 42, 34, 255];
const page = [255, 248, 238, 255];
const line = [214, 186, 158, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function png(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function fillRoundRect(pixels, size, x, y, w, h, radius, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      const dx = px < x + radius ? x + radius - px : px >= x + w - radius ? px - (x + w - radius - 1) : 0;
      const dy = py < y + radius ? y + radius - py : py >= y + h - radius ? py - (y + h - radius - 1) : 0;
      if (dx * dx + dy * dy <= radius * radius) setPixel(pixels, size, px, py, color);
    }
  }
}

function drawHeart(pixels, size, cx, cy, scale, color) {
  const half = scale / 2;
  for (let y = -half; y <= half; y += 1) {
    for (let x = -half; x <= half; x += 1) {
      const xx = x / (half * 0.9);
      const yy = -y / (half * 0.9) + 0.35;
      const a = xx * xx + yy * yy - 1;
      if (a * a * a - xx * xx * yy * yy * yy <= 0) {
        setPixel(pixels, size, Math.round(cx + x), Math.round(cy + y), color);
      }
    }
  }
}

function render(size, marginRatio) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = paper[0];
    pixels[i + 1] = paper[1];
    pixels[i + 2] = paper[2];
    pixels[i + 3] = 255;
  }
  const margin = Math.round(size * marginRatio);
  const x = margin;
  const y = margin + Math.round(size * 0.02);
  const w = size - margin * 2;
  const h = size - margin * 2 - Math.round(size * 0.04);
  const radius = Math.round(size * 0.08);
  fillRoundRect(pixels, size, x, y, w, h, radius, cover);
  const spineWidth = Math.round(w * 0.16);
  fillRoundRect(pixels, size, x + Math.round(w * 0.12), y + Math.round(h * 0.08), w - Math.round(w * 0.2), h - Math.round(h * 0.16), Math.round(radius * 0.6), page);
  fillRoundRect(pixels, size, x + Math.round(w * 0.08), y + Math.round(h * 0.08), spineWidth, h - Math.round(h * 0.16), Math.round(radius * 0.4), spine);
  const lineLeft = x + Math.round(w * 0.38);
  const lineWidth = Math.round(w * 0.38);
  for (let index = 0; index < 3; index += 1) {
    const lineY = y + Math.round(h * (0.58 + index * 0.08));
    fillRoundRect(pixels, size, lineLeft, lineY, lineWidth, Math.max(2, Math.round(size * 0.015)), 2, line);
  }
  drawHeart(pixels, size, x + w * 0.58, y + h * 0.34, size * 0.2, cover);
  return png(size, size, pixels);
}

mkdirSync(join(root, "public"), { recursive: true });
mkdirSync(join(root, "src/app"), { recursive: true });
const files = [
  ["public/icon-192.png", 192, 0.12],
  ["public/icon-512.png", 512, 0.12],
  ["public/icon-512-maskable.png", 512, 0.22],
  ["public/apple-touch-icon.png", 180, 0.12],
  ["src/app/icon.png", 512, 0.12],
  ["src/app/apple-icon.png", 180, 0.12],
];
for (const [file, size, margin] of files) {
  writeFileSync(join(root, file), render(size, margin));
  console.log("wrote", file);
}
