const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "sources", "fragenkatalog-binnen");
const parsed = JSON.parse(fs.readFileSync(path.join(SRC, "katalog-binnen-parsed.json"), "utf8"));

function category(text) {
  const t = text.toLowerCase();
  const words = t.match(/[a-zäöüß]+/g) || [];
  const wordSet = new Set(words);
  const hasWord = (...ws) => ws.some((w) => wordSet.has(w));
  const hasSub = (...ws) => ws.some((w) => t.includes(w));
  if (hasWord("wetter", "wind", "beaufort", "isobar", "sturm") || hasSub("wetterkarte", "wetterbericht", "luftdruck", "unsichtigem wetter"))
    return "wetter";
  if (hasSub("rettung", "feuerlöscher", "notsignal", "seenot", "notsituation", "gekentert", "kenterung", "notruder", "ruderbruch", "sicherheitsleine", "sicherheitsgurt", "abfäll", "fäkalien", "anstrich"))
    return "sicherheit";
  if (hasSub("licht", "laterne", "schallsignal", "kurzen ton", "langen ton", "töne", "flagge", "wimpel", "signalkörper", "sichtzeichen", "tafelzeichen", "schifffahrtszeichen", "tagbezeichnung"))
    return "signale";
  if (hasSub("seemeile", "peilung", "kompass", "seekarte", "koppelort", "tide", "ebbe", "flut", "gezeiten", "fahrwasser", "fahrrinne", "tonne", "betonnung", "bergfahrt", "talfahrt", "hochwassermarke", "wasserstand", "brücke", "schleuse", "kanal", "schwert", "trimm", "krängung", "wind", "kurs", "amwind", "vorwind", "halbwind", "raumschot", "wende", "halse", "segel", "jolle", "kimmkiel", "kielyacht"))
    return "navigation";
  if (hasSub("verordnung", "gesetz", "vorschrift", "fahrerlaubnis", "sportbootführerschein", "verantwortlich", "sorgfaltspflicht", "binnenschifffahrtsstraßen-ordnung", "kennzeichen", "register", "funkzeugnis", "landesgewässer"))
    return "recht";
  return "verhalten";
}

function hasImageRef(q) {
  const dets = /\b(folgend\w*|nachstehend\w*|dies(?:e|es|er|em|en)?)\s+(\S+)/gi;
  const nounHints = ["zeichen", "bezeichnung", "licht", "laterne", "signal", "tonne", "flagge", "wimpel", "tafel"];
  let m;
  while ((m = dets.exec(q))) {
    const word = m[2].toLowerCase();
    if (nounHints.some((h) => word.includes(h))) return true;
  }
  return (
    /\([A-ZÄÖÜ][^)]*\)\s*$/.test(q) ||
    /^welches fahrzeug (führt|muss)/i.test(q) ||
    /^was ist das für ein fahrzeug/i.test(q) ||
    /gegenüber diesem fahrzeug/i.test(q) ||
    /\(skizze/i.test(q) ||
    /eingezeichnet\w*/i.test(q)
  );
}

function cleanQuestionText(q) {
  return q
    .replace(/\s*\(Skizze[^)]*\)/gi, "")
    .replace(/\s*\([A-ZÄÖÜ][^)]*\)\s*$/, "")
    .trim();
}

let out = "";
for (const item of parsed) {
  const pkg = item.num <= 253 ? "binnen" : "segeln";
  const cat = category(item.question + " " + item.options.a);
  const note = hasImageRef(item.question)
    ? "Original bezieht sich auf eine Abbildung (Licht-/Signalbild, Tafelzeichen, Skizze o. Ä.) im amtlichen Katalog, die hier nicht reproduziert werden kann."
    : null;
  const cleanQuestion = cleanQuestionText(item.question);
  out += `  Q("${pkg}", "${cat}",\n`;
  out += `    ${JSON.stringify(cleanQuestion)},\n`;
  out += `    [${JSON.stringify(item.options.a)}, ${JSON.stringify(item.options.b)}, ${JSON.stringify(item.options.c)}, ${JSON.stringify(item.options.d)}],\n`;
  out += `    0, "Amtlicher Fragen- und Antwortenkatalog SBF Binnen (ELWIS, Stand 01.08.2023), Frage ${item.num}"`;
  if (note) out += `, { note: ${JSON.stringify(note)} }`;
  out += `),\n`;
}

fs.writeFileSync(path.join(SRC, "generated-binnen-segeln-block.js"), out);
console.log("Zeilen geschrieben, Länge:", out.length);
console.log("Anzahl Fragen:", parsed.length);
