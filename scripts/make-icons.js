/*
 * Erzeugt die App-Icons (PNG) ohne externe Abhängigkeiten.
 * Motiv: eigenständig gezeichneter, minimalistischer Anker auf
 * dunkelblauem Grund (kein Fremdbild).
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
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

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// --- Zeichnung: distanzbasiertes Vektor-Icon, supersampled für weiche Kanten ---
function dist2seg(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
  const cx = ax + t * abx, cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const SS = 4; // supersampling factor
  const hi = size * SS;
  const buf = Buffer.alloc(size * size * 4);

  const bg1 = [11, 31, 58]; // dunkles Marineblau
  const bg2 = [15, 63, 122];
  const fg = [244, 239, 230]; // Papier-Weiß

  // Anker-Geometrie in Einheitenraum [0..100]
  const cx = 50, cy = 50;
  const ringR = 12, ringCY = 24;
  const shaftTop = 36, shaftBottom = 78;
  const armY = 66, armHalf = 20, armDrop = 12;
  const strokeW = 7;

  function ankerDist(x, y) {
    let d = Infinity;
    // Ring
    const rd = Math.abs(Math.hypot(x - cx, y - ringCY) - ringR);
    d = Math.min(d, rd);
    // Schaft
    d = Math.min(d, dist2seg(x, y, cx, shaftTop + ringR - 2, cx, shaftBottom));
    // Querbalken (Steg oben)
    d = Math.min(d, dist2seg(x, y, cx - 14, shaftTop + 6, cx + 14, shaftTop + 6));
    // Arme unten (geschwungen, als zwei Segmente angenähert)
    d = Math.min(d, dist2seg(x, y, cx, shaftBottom, cx - armHalf, armY));
    d = Math.min(d, dist2seg(x, y, cx - armHalf, armY, cx - armHalf + 8, armY + armDrop));
    d = Math.min(d, dist2seg(x, y, cx, shaftBottom, cx + armHalf, armY));
    d = Math.min(d, dist2seg(x, y, cx + armHalf, armY, cx + armHalf - 8, armY + armDrop));
    return d;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const u = (px / size) * 100;
          const v = (py / size) * 100;
          const grad = v / 100;
          let cr = bg1[0] + (bg2[0] - bg1[0]) * grad;
          let cg = bg1[1] + (bg2[1] - bg1[1]) * grad;
          let cb = bg1[2] + (bg2[2] - bg1[2]) * grad;
          const d = ankerDist(u, v);
          const edge = (strokeW / 2 * size) / 100 / SS; // approx AA width in supersample units
          const inside = d - strokeW / 2;
          const mix = Math.max(0, Math.min(1, 0.5 - inside));
          cr = cr + (fg[0] - cr) * mix;
          cg = cg + (fg[1] - cg) * mix;
          cb = cb + (fg[2] - cb) * mix;
          r += cr; g += cg; b += cb; count++;
        }
      }
      const idx = (y * size + x) * 4;
      buf[idx] = Math.round(r / count);
      buf[idx + 1] = Math.round(g / count);
      buf[idx + 2] = Math.round(b / count);
      buf[idx + 3] = 255;
    }
  }
  return buf;
}

const outDir = path.join(__dirname, "..", "icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

[180, 192, 512].forEach((size) => {
  const rgba = drawIcon(size);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log("written", size);
});
