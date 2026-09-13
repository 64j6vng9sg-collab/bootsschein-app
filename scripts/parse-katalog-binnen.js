/*
 * Parst die Binnen-Rohtext-Dateien (Spezifische Fragen Binnen 73-253,
 * Spezifische Fragen Segeln 254-300) in strukturierte JSON-Fragen.
 * Antwort "a" ist laut Katalog-Anmerkung immer die richtige.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "sources", "fragenkatalog-binnen");
const files = [
  "katalog-binnen-raw-73-150.txt",
  "katalog-binnen-raw-151-220.txt",
  "katalog-binnen-raw-221-300.txt",
];

const text = files.map((f) => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

const questions = [];
let current = null;
const qStart = /^(\d{1,3})\.\s+(.*)$/;
const optStart = /^([abcd])\.\s+(.*)$/;

for (const line of lines) {
  const qm = line.match(qStart);
  const om = line.match(optStart);
  if (qm && !current) {
    current = { num: parseInt(qm[1], 10), question: qm[2], options: {} };
  } else if (qm && current && Object.keys(current.options).length >= 4) {
    questions.push(current);
    current = { num: parseInt(qm[1], 10), question: qm[2], options: {} };
  } else if (om && current) {
    current.options[om[1]] = om[2];
  } else if (current) {
    const keys = ["a", "b", "c", "d"];
    const lastOpt = keys.filter((k) => current.options[k] !== undefined).pop();
    if (lastOpt) current.options[lastOpt] += " " + line;
    else current.question += " " + line;
  }
}
if (current) questions.push(current);

const missing = questions.filter((q) => !q.options.a || !q.options.b || !q.options.c || !q.options.d);
const nums = questions.map((q) => q.num);
const expected = [];
for (let i = 73; i <= 300; i++) expected.push(i);
const missingNums = expected.filter((n) => !nums.includes(n));
const dupNums = nums.filter((n, i) => nums.indexOf(n) !== i);

console.log("Geparste Fragen:", questions.length);
console.log("Fragen mit fehlenden Optionen:", missing.map((q) => q.num));
console.log("Fehlende Nummern 73-300:", missingNums);
console.log("Doppelte Nummern:", [...new Set(dupNums)]);

fs.writeFileSync(
  path.join(SRC, "katalog-binnen-parsed.json"),
  JSON.stringify(questions.sort((a, b) => a.num - b.num), null, 2)
);
console.log("Geschrieben:", path.join(SRC, "katalog-binnen-parsed.json"));
