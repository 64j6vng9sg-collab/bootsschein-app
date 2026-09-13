/*
 * Verknüpft Fragen mit einer echten Original-Abbildung aus dem amtlichen
 * Fragenkatalog (vom Nutzer als Bild-PDF bereitgestellt, siehe
 * images/see/ und images/binnen/). Ersetzt einen vorhandenen "note"-
 * Warnhinweis bzw. ein eigenes "diagram"-Referenzbild durch das
 * tatsächliche Original-Bild.
 */
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "js", "data.js");
let text = fs.readFileSync(DATA_PATH, "utf8");

// [Katalog ("See"|"Binnen"), Frage-Nr, Bildpfad]
const MAPPING = [
  ["See", 17, "images/see/017.png"],
  ["See", 18, "images/see/018.png"],
  ["See", 19, "images/see/019.png"],
  ["See", 20, "images/see/020.png"],
  ["See", 21, "images/see/021.png"],
  ["See", 22, "images/see/022.png"],
  ["See", 23, "images/see/023.png"],
  ["See", 24, "images/see/024.png"],
  ["See", 25, "images/see/025.png"],
  ["See", 26, "images/see/026.png"],
  ["See", 27, "images/see/027.png"],
  ["See", 28, "images/see/028.png"],
  ["See", 29, "images/see/029.png"],
  ["See", 30, "images/see/030.png"],
  ["See", 91, "images/see/091.png"],
  ["See", 93, "images/see/093.png"],
  ["See", 94, "images/see/094.png"],
  ["See", 133, "images/see/133.png"],
  ["See", 134, "images/see/134.png"],
  ["See", 149, "images/see/149.png"],
  ["See", 151, "images/see/151.png"],
  ["See", 154, "images/see/154.png"],
  ["See", 176, "images/see/176.png"],
  ["See", 177, "images/see/177.png"],
  ["See", 178, "images/see/178.png"],
  ["See", 179, "images/see/179.png"],
  ["See", 180, "images/see/180.png"],
  ["See", 182, "images/see/182.png"],
  ["See", 184, "images/see/184.png"],
  ["See", 186, "images/see/186.png"],
  ["See", 187, "images/see/187.png"],
  ["See", 188, "images/see/188.png"],
  ["See", 189, "images/see/189.png"],
  ["See", 191, "images/see/191.png"],
  ["See", 192, "images/see/192.png"],
  ["See", 193, "images/see/193.png"],
  ["See", 194, "images/see/194.png"],
  ["See", 260, "images/see/260.png"],
  ["See", 265, "images/see/265.png"],
  ["See", 266, "images/see/266.png"],
  ["See", 282, "images/see/282.png"],
  ["Binnen", 107, "images/binnen/107.png"],
  ["Binnen", 108, "images/binnen/108.png"],
  ["Binnen", 110, "images/binnen/110.png"],
  ["Binnen", 111, "images/binnen/111.png"],
  ["Binnen", 112, "images/binnen/112.png"],
  ["Binnen", 113, "images/binnen/113.png"],
  ["Binnen", 114, "images/binnen/114.png"],
  ["Binnen", 115, "images/binnen/115.png"],
  ["Binnen", 120, "images/binnen/120.png"],
  ["Binnen", 121, "images/binnen/121.png"],
  ["Binnen", 122, "images/binnen/122.png"],
  ["Binnen", 123, "images/binnen/123.png"],
  ["Binnen", 124, "images/binnen/124.png"],
  ["Binnen", 125, "images/binnen/125.png"],
  ["Binnen", 132, "images/binnen/132.png"],
  ["Binnen", 145, "images/binnen/145.png"],
  ["Binnen", 146, "images/binnen/146.png"],
  ["Binnen", 147, "images/binnen/147.png"],
  ["Binnen", 148, "images/binnen/148.png"],
  ["Binnen", 149, "images/binnen/149.png"],
  ["Binnen", 150, "images/binnen/150.png"],
  ["Binnen", 151, "images/binnen/151.png"],
  ["Binnen", 152, "images/binnen/152.png"],
  ["Binnen", 153, "images/binnen/153.png"],
  ["Binnen", 154, "images/binnen/154.png"],
  ["Binnen", 156, "images/binnen/156.png"],
  ["Binnen", 157, "images/binnen/157.png"],
  ["Binnen", 180, "images/binnen/180.png"],
  ["Binnen", 185, "images/binnen/185.png"],
  ["Binnen", 186, "images/binnen/186.png"],
  ["Binnen", 188, "images/binnen/188.png"],
  ["Binnen", 189, "images/binnen/189.png"],
  ["Binnen", 192, "images/binnen/192.png"],
  ["Binnen", 193, "images/binnen/193.png"],
  ["Binnen", 196, "images/binnen/196.png"],
  ["Binnen", 199, "images/binnen/199.png"],
  ["Binnen", 200, "images/binnen/200.png"],
  ["Binnen", 201, "images/binnen/201.png"],
  ["Binnen", 202, "images/binnen/202.png"],
  ["Binnen", 203, "images/binnen/203.png"],
  ["Binnen", 204, "images/binnen/204.png"],
  ["Binnen", 243, "images/binnen/243.png"],
  ["Binnen", 295, "images/binnen/295.png"],
];

const blockRe = /  Q\("(\w+)", "(\w+)",\n {4}("(?:[^"\\]|\\.)*"),\n {4}(\[[\s\S]*?\]),\n {4}(\d+), ("(?:[^"\\]|\\.)*")(,\s*\{[\s\S]*?\})?\),\n/g;

let matchCount = 0;

text = text.replace(blockRe, (full, pkg, cat, qText, optsArr, correct, sourceText, optsBlock) => {
  const m = MAPPING.find(([katalog, frage]) => {
    const tag = `SBF ${katalog}`;
    return sourceText.includes(tag) && sourceText.includes(`Frage ${frage}"`);
  });
  if (!m) return full;
  matchCount += 1;
  const [, , image] = m;
  const newOptsBlock = `, { image: ${JSON.stringify(image)} }`;
  return `  Q("${pkg}", "${cat}",\n    ${qText},\n    ${optsArr},\n    ${correct}, ${sourceText}${newOptsBlock}),\n`;
});

console.log("Ersetzte Fragen:", matchCount, "von", MAPPING.length, "erwartet");

fs.writeFileSync(DATA_PATH, text);
