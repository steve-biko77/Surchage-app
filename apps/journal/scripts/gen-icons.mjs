// Genere les icones PWA (192x192 et 512x512) sans dependance externe :
// canvas de pixels dessine a la main + encodeur PNG minimal (zlib deflate integre a Node).
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const BLUE = [0x2c, 0x8f, 0xe0]; // --blue
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // filtre "none" (0) sur chaque ligne
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 === 0 ? 0 : (apx * abx + apy * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx, cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const r = size * 0.22; // rayon des coins arrondis
  const stroke = size * 0.075;

  // Points du "check" (proportions du canvas)
  const p1 = [size * 0.27, size * 0.53];
  const p2 = [size * 0.44, size * 0.70];
  const p3 = [size * 0.75, size * 0.32];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // fond plein (rounded-rect) : transparent uniquement dans les 4 coins hors rayon.
      let inside = true;
      const qx = x < size / 2 ? 0 : 1;
      const qy = y < size / 2 ? 0 : 1;
      const ccx = qx === 0 ? r : size - r;
      const ccy = qy === 0 ? r : size - r;
      const inCornerZone = (qx === 0 ? x < r : x > size - r) && (qy === 0 ? y < r : y > size - r);
      if (inCornerZone) {
        const d = Math.hypot(x - ccx, y - ccy);
        inside = d <= r;
      }

      let color = BLUE;
      const alpha = inside ? 255 : 0; // coins hors-rayon transparents (icone "any"), OK cote OS

      // check blanc par-dessus
      const d1 = distToSegment(x, y, p1[0], p1[1], p2[0], p2[1]);
      const d2 = distToSegment(x, y, p2[0], p2[1], p3[0], p3[1]);
      if ((d1 <= stroke / 2 || d2 <= stroke / 2) && inside) {
        color = WHITE;
      }

      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = alpha;
    }
  }
  return rgba;
}

for (const size of [192, 512]) {
  const rgba = drawIcon(size);
  const png = encodePNG(size, size, rgba);
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), png);
  console.log(`icon-${size}.png genere (${png.length} octets)`);
}
