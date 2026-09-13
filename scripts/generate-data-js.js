const fs = require("fs");
const path = require("path");

const SCRATCH = path.join(__dirname, "..", "sources", "fragenkatalog-see");
const parsed = JSON.parse(fs.readFileSync(path.join(SCRATCH, "katalog-see-parsed.json"), "utf8"));

function category(text) {
  const t = text.toLowerCase();
  const words = t.match(/[a-zäöüß]+/g) || [];
  const wordSet = new Set(words);
  const hasWord = (...ws) => ws.some((w) => wordSet.has(w));
  const hasSub = (...ws) => ws.some((w) => t.includes(w));
  if (hasWord("wetter", "wind", "beaufort", "isobar", "sturm", "hochdruckgebietes", "tiefdruckgebietes", "luftdruck", "wolke", "frischem") || hasSub("wetterkarte", "wetterbericht", "hochdruckgebiet", "tiefdruckgebiet"))
    return "wetter";
  if (hasSub("rettung", "feuerlöscher", "notsignal", "seenot", "flüssiggas", "brand", "überbord", "schleppleine", "treibanker", "sicherheitsleine", "sicherheitsgurt", "bilge", "tanken", "kentert", "quickstopp"))
    return "sicherheit";
  if (hasSub("licht", "laterne", "schallsignal", "kurzen ton", "langen ton", "pfeife", "glocke", "gong", "flaggensignal", "rakete", "signalkörper", "morsesignal", "sichtzeichen", "tafelzeichen", "schifffahrtszeichen"))
    return "signale";
  if (hasSub("seemeile", "peilung", "kompass", "seekarte", "koppelort", "tide", "ebbe", "flut", "gezeiten", "leuchtfeuer", "leitfeuer", "richtfeuer", "quermarkenfeuer", "tonne", "betonnung", "fahrwasser", "verkehrstrennungsgebiet", "gleichtaktfeuer", "blinkfeuer", "blitzfeuer", "funkelfeuer", "wiederkehr", "kardinal", "standlinie"))
    return "navigation";
  if (hasSub("verordnung", "gesetz", "vorschrift", "fahrerlaubnis", "verantwortlich", "sorgfaltspflicht", "kollisionsverhütungsregeln", "seeschifffahrtsstraßen-ordnung", "naturschutz", "nationalpark", "umwelt", "reinhaltung"))
    return "recht";
  return "verhalten";
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function hasImageRef(q) {
  const noun = "(Tafelzeichen|Schifffahrtszeichen|Sichtzeichen|Lichter?|Signalkörper|Flaggensignal|Zeichen|Tonne|Schallsignal)";
  return (
    /\([A-ZÄÖÜ][^)]*\)\s*$/.test(q) || // eigene Marker wie "(Abbildung)", "(Kardinalzeichen)" etc.
    new RegExp(`\\bfolgend\\w*\\s+${noun}`, "i").test(q) ||
    new RegExp(`\\bdiese[rsmn]?\\s+${noun}`, "i").test(q) ||
    /^welches fahrzeug (führt|muss)/i.test(q) ||
    /^was ist das für ein fahrzeug/i.test(q) ||
    /gegenüber diesem fahrzeug/i.test(q)
  );
}

let out = "";
for (const item of parsed) {
  const pkg = item.num <= 72 ? "basis" : "see";
  const cat = category(item.question + " " + item.options.a);
  const note = hasImageRef(item.question)
    ? "Original bezieht sich auf eine Abbildung (Licht-/Signalbild, Tafelzeichen o. Ä.) im amtlichen Katalog, die hier nicht reproduziert werden kann."
    : null;
  // Eigene Marker wie "(Abbildung)", "(Kardinalzeichen)" etc. sind keine amtliche
  // Textbestandteile, sondern nur interne Kennzeichnung -> aus dem Fragetext entfernen.
  const cleanQuestion = item.question.replace(/\s*\([A-ZÄÖÜ][^)]*\)\s*$/, "");
  out += `  Q("${pkg}", "${cat}",\n`;
  out += `    ${JSON.stringify(cleanQuestion)},\n`;
  out += `    [${JSON.stringify(item.options.a)}, ${JSON.stringify(item.options.b)}, ${JSON.stringify(item.options.c)}, ${JSON.stringify(item.options.d)}],\n`;
  out += `    0, "Amtlicher Fragen- und Antwortenkatalog SBF See (ELWIS, Stand 01.08.2023), Frage ${item.num}"`;
  if (note) out += `, { note: ${JSON.stringify(note)} }`;
  out += `),\n`;
}

fs.writeFileSync(path.join(SCRATCH, "generated-basis-see-block.js"), out);
console.log("Zeilen geschrieben, Länge:", out.length);
console.log("Anzahl Fragen:", parsed.length);
