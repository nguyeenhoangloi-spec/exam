import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const desktopDir = resolve(import.meta.dirname, '..');
const assetsDir = join(desktopDir, 'assets');
mkdirSync(assetsDir, { recursive: true });

/**
 * Pure Node.js PNG Creator
 */
function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rawData = Buffer.alloc((width * bytesPerPixel + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * bytesPerPixel + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = deflateSync(rawData, { level: 9 });

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCrc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

// CRC32 table & calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function calculateCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * High-Quality Draw Function for Exam Management (Graduation Cap on Royal Blue Squircle)
 */
function drawExamIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Squircle SDF (Signed Distance Function)
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  const cornerRadius = 0.12;

  const qx = Math.abs(cx) - (0.42 - cornerRadius);
  const qy = Math.abs(cy) - (0.42 - cornerRadius);
  const dist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cornerRadius;

  const pixelSize = 1 / w;
  const squircleAlpha = Math.max(0, Math.min(1, -dist / pixelSize));

  if (squircleAlpha <= 0) {
    return [0, 0, 0, 0];
  }

  // Base background gradient: #2563EB (37, 99, 235) to #1D4ED8 (29, 78, 216)
  const gradT = ny;
  let bgR = Math.round(37 * (1 - gradT) + 29 * gradT);
  let bgG = Math.round(99 * (1 - gradT) + 78 * gradT);
  let bgB = Math.round(235 * (1 - gradT) + 216 * gradT);

  // Subtle top specular highlight
  if (ny < 0.3) {
    const spec = Math.max(0, (0.3 - ny) / 0.3) * 0.15;
    bgR = Math.min(255, Math.round(bgR + 255 * spec));
    bgG = Math.min(255, Math.round(bgG + 255 * spec));
    bgB = Math.min(255, Math.round(bgB + 255 * spec));
  }

  // 2. Draw Graduation Cap
  const pTop = { x: 0.5, y: 0.28 };
  const pLeft = { x: 0.20, y: 0.41 };
  const pRight = { x: 0.80, y: 0.41 };
  const pBottom = { x: 0.5, y: 0.54 };

  function pointInTriangle(pt, p1, p2, p3) {
    const d1 = (pt.x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (pt.y - p2.y);
    const d2 = (pt.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (pt.y - p3.y);
    const d3 = (pt.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (pt.y - p1.y);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  const inTopTri = pointInTriangle({ x: nx, y: ny }, pTop, pLeft, pRight);
  const inBottomTri = pointInTriangle({ x: nx, y: ny }, pLeft, pRight, pBottom);
  const inDiamond = inTopTri || inBottomTri;

  // Skullcap
  let inSkullcap = false;
  if (ny >= 0.48 && ny <= 0.68 && nx >= 0.33 && nx <= 0.67) {
    const cupW = 0.17 * (1 - (ny - 0.48) * 0.3);
    const distCenter = Math.abs(nx - 0.5);
    if (distCenter <= cupW && (ny <= 0.62 || Math.hypot(distCenter / cupW, (ny - 0.60) / 0.08) <= 1.0)) {
      inSkullcap = true;
    }
  }

  // Tassel
  let inTassel = false;
  if (nx >= 0.50 && nx <= 0.79) {
    const cordY = 0.41 + (nx - 0.50) * 0.14;
    if (Math.abs(ny - cordY) <= 0.012) {
      inTassel = true;
    }
  }
  if (Math.abs(nx - 0.78) <= 0.012 && ny >= 0.45 && ny <= 0.62) {
    inTassel = true;
  }
  if (Math.abs(nx - 0.78) <= 0.024 && ny >= 0.62 && ny <= 0.70) {
    inTassel = true;
  }
  if (Math.hypot(nx - 0.5, ny - 0.41) <= 0.028) {
    inTassel = true;
  }

  let finalR = bgR;
  let finalG = bgG;
  let finalB = bgB;
  let finalA = Math.round(squircleAlpha * 255);

  if (inDiamond || inSkullcap || inTassel) {
    let fgR = 255;
    let fgG = 255;
    let fgB = 255;

    if (inSkullcap && !inDiamond) {
      fgR = 238;
      fgG = 242;
      fgB = 255;
    }

    finalR = fgR;
    finalG = fgG;
    finalB = fgB;
  }

  return [finalR, finalG, finalB, finalA];
}

/**
 * Windows ICO File Builder (Contains embedded PNGs for multi-resolution)
 */
function createIco(pngBuffers) {
  const numImages = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = Icon (.ico)
  header.writeUInt16LE(numImages, 4); // Number of images

  const dirSize = 16 * numImages;
  let currentOffset = 6 + dirSize;

  const dirEntries = [];
  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Palette color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel (32-bit RGBA)
    entry.writeUInt32LE(buffer.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data

    dirEntries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((p) => p.buffer),
  ]);
}

// 1. Generate 512x512 Master PNG
console.log('[+] Generating 512x512 master icon.png...');
const icon512 = createPng(512, 512, drawExamIcon);
writeFileSync(join(assetsDir, 'icon.png'), icon512);
writeFileSync(join(assetsDir, 'logo.png'), icon512);

// 2. Generate multi-resolution PNGs for ICO (256, 128, 64, 48, 32, 16)
console.log('[+] Generating multi-resolution icon.ico for Windows...');
const sizes = [256, 128, 64, 48, 32, 16];
const iconBuffers = sizes.map((s) => ({
  width: s,
  height: s,
  buffer: createPng(s, s, drawExamIcon),
}));

const icoBuffer = createIco(iconBuffers);
writeFileSync(join(assetsDir, 'icon.ico'), icoBuffer);

console.log('[✓] Assets created successfully in desktop/assets:');
console.log('    - desktop/assets/icon.png (512x512)');
console.log('    - desktop/assets/logo.png (512x512)');
console.log('    - desktop/assets/icon.ico (256, 128, 64, 48, 32, 16)');
