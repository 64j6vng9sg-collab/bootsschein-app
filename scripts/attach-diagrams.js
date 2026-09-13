/*
 * Verknüpft ausgewählte, bislang mit einem Bild-Hinweis markierte Fragen
 * mit einem eigenen Referenzdiagramm (js/diagrams.js) und entfernt den
 * "note"-Hinweis, da die Frage damit ohne die (fehlende) amtliche
 * Abbildung eigenständig nachvollzogen werden kann.
 */
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "js", "data.js");
let text = fs.readFileSync(DATA_PATH, "utf8");

// [Katalog ("See"|"Binnen"), Frage-Nr, Diagramm-Schlüssel]
const MAPPING = [
  ["See", 92, "navLightsMotorLarge"],
  ["See", 96, "dayDiamond"],
  ["See", 97, "lightsNUC"],
  ["See", 98, "lightsRAM"],
  ["See", 99, "dayBallsTwo"],
  ["See", 102, "lightsRAMBasic"],
  ["See", 103, "lightsRAM"],
  ["See", 104, "dayBallDiamondBall"],
  ["See", 105, "lightsAgroundSmall"],
  ["See", 106, "dayBallsThree"],
  ["See", 107, "dayBallsThree"],
  ["See", 108, "dayCylinder"],
  ["See", 109, "dayCylinder"],
  ["See", 110, "lightsTrawling"],
  ["See", 111, "lightsFishingNonTrawl"],
  ["See", 112, "dayConesTouching"],
  ["See", 114, "lightsAnchorSingle"],
  ["See", 115, "lightsAnchorDouble"],
  ["See", 148, "dayDiamondsObstructed"],
  ["See", 150, "lightsGreenPairClear"],
  ["Binnen", 126, "lightsBlueOne"],
  ["Binnen", 127, "lightsBlueOne"],
  ["Binnen", 128, "lightsBlueTwo"],
  ["Binnen", 129, "lightsBlueTwo"],
  ["Binnen", 130, "lightsBlueThree"],
  ["Binnen", 131, "lightsBlueThree"],
  ["Binnen", 194, "lightsSingleWhiteBinnen"],
  ["Binnen", 195, "lightsBicolorTopp"],

  // --- Zweite Recherche-Runde (IALA-Betonnung/Kardinalzeichen, Notzeichen
  // nach Internationalem Signalbuch/KVR Anlage IV, Schallsignale, CEVNI-
  // Verkehrszeichen) ---
  ["See", 16, "soundFiveShort"],
  ["See", 140, "soundFiveShort"],
  ["See", 162, "soundGeneralAlarm"],
  ["See", 185, "flagLima"],
  ["See", 190, "buoySafeWater"],
  ["See", 195, "buoyPreferredStarboard"],
  ["See", 196, "buoyPreferredPort"],
  ["See", 200, "cardinalNorth"],
  ["See", 201, "cardinalEast"],
  ["See", 202, "cardinalSouth"],
  ["See", 203, "cardinalWest"],
  ["See", 204, "cardinalLightNorth"],
  ["See", 205, "cardinalLightEast"],
  ["See", 206, "cardinalLightSouth"],
  ["See", 207, "cardinalLightWest"],
  ["See", 208, "buoyIsolatedDanger"],
  ["See", 284, "flagsNC"],
  ["See", 285, "flagSquareBall"],
  ["Binnen", 116, "tafelNoEntry"],
  ["Binnen", 171, "blueBoardLight"],
  ["Binnen", 172, "blueBoardLight"],
  ["Binnen", 198, "gebotArrow"],
  ["Binnen", 244, "tafelNoEntry"],
];

// Ein Q(...)-Aufruf, wie er von generate-data-js(.js|-binnen.js) erzeugt wird.
const blockRe = /  Q\("(\w+)", "(\w+)",\n {4}("(?:[^"\\]|\\.)*"),\n {4}(\[[\s\S]*?\]),\n {4}(\d+), ("(?:[^"\\]|\\.)*")(,\s*\{[\s\S]*?\})?\),\n/g;

let matchCount = 0;
let notFound = [];

text = text.replace(blockRe, (full, pkg, cat, qText, optsArr, correct, sourceText, optsBlock) => {
  const m = MAPPING.find(([katalog, frage]) => {
    const tag = `SBF ${katalog}`;
    return sourceText.includes(tag) && sourceText.includes(`Frage ${frage}"`);
  });
  if (!m) return full;
  matchCount += 1;
  const [, , diagram] = m;
  const newOptsBlock = `, { diagram: ${JSON.stringify(diagram)} }`;
  return `  Q("${pkg}", "${cat}",\n    ${qText},\n    ${optsArr},\n    ${correct}, ${sourceText}${newOptsBlock}),\n`;
});

console.log("Ersetzte Fragen:", matchCount, "von", MAPPING.length, "erwartet");

fs.writeFileSync(DATA_PATH, text);
