import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const outputDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icons');
mkdirSync(outputDirectory, { recursive: true });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const isInCircle = (x, y, cx, cy, radius) => ((x - cx * scale) ** 2) + ((y - cy * scale) ** 2) <= (radius * scale) ** 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const artX = x / scale;
      const artY = y / scale;
      const outerRing = isInCircle(x, y, 220, 256, 112) && !isInCircle(x, y, 220, 256, 62);
      const stem = artX >= 270 && artX <= 326 && artY >= 128 && artY <= 368;
      const dot = isInCircle(x, y, 375, 346, 23);
      const white = outerRing || stem || dot;
      const index = (y * size + x) * 4;
      pixels[index] = white ? 255 : 66;
      pixels[index + 1] = white ? 255 : 107;
      pixels[index + 2] = white ? 255 : 80;
      pixels[index + 3] = 255;
    }
  }

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) pixels.copy(scanlines, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(path.join(outputDirectory, `icon-${size}.png`), png);
}

createIcon(192);
createIcon(512);
console.log(`Created 192px and 512px Daybook icons in ${outputDirectory}`);
