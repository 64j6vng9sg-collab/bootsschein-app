/*
 * Selbst erstellte, schematische Illustrationen (reines Inline-SVG, Linien-Stil).
 * Keine Fremdbilder – rein geometrisch erzeugte Schaubilder zu Lichtern,
 * Tonnen, Knoten und Wetter/Wind. Farbcode entspricht den amtlichen
 * Bedeutungen (Backbord = rot, Steuerbord = grün, Kardinalzeichen = gelb/schwarz).
 */

const INK = "#152238";
const PAPER = "#F4EFE6";
const WHITE = "#FFFFFF";
const BLUE = "#2A5CC9";
const RED = "#C63A2E";
const GREEN = "#1E8F5F";
const AMBER = "#E0A527";
const MUTE = "#8A95A6";

function svgWrap(inner, viewBox = "0 0 240 240") {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${inner}</svg>`;
}

/*
 * Generischer Baustein für Lichter- und Signalkörper-Schaubilder:
 * eine senkrechte Stange mit gestapelten Formen (Lichtern oder
 * Tagsignalkörpern), optional ergänzt um Seitenlichter (rot/grün)
 * und/oder ein Hecklicht am Fuß der Stange. Die Formen und deren
 * Bedeutung (Farbe, Anzahl, Anordnung) stammen aus den einschlägigen
 * KVR-/BinSchStrO-Regeln zur Signalführung des jeweils genannten
 * Fahrzeugtyps – nicht aus der (hier nicht vorliegenden) amtlichen
 * Abbildung selbst.
 */
function shapeMark(shape, cx, cy, color) {
  const r = 14;
  const stroke = color === WHITE ? INK : "none";
  switch (shape) {
    case "light":
      return `<circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="${color}" stroke="${stroke}" stroke-width="2"/>
              <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 4" opacity="0.55"/>`;
    case "ball":
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
    case "cone-up":
      return `<path d="M${cx - r} ${cy + r} L${cx + r} ${cy + r} L${cx} ${cy - r} Z" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
    case "cone-down":
      return `<path d="M${cx - r} ${cy - r} L${cx + r} ${cy - r} L${cx} ${cy + r} Z" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
    case "cylinder":
      return `<rect x="${cx - r}" y="${cy - r * 0.7}" width="${r * 2}" height="${r * 1.4}" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
    case "diamond":
      return `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${color}" stroke="${INK}" stroke-width="2"/>`;
    default:
      return "";
  }
}

function signalStack(items, caption, opts = {}) {
  const spacing = items.length > 2 ? 34 : 40;
  const topY = 54;
  const lastY = topY + (items.length - 1) * spacing;
  const sideY = lastY + 26;
  const sternY = opts.sideLights ? sideY + 26 : lastY + 26;
  const poleBottom = opts.sternLight ? sternY : opts.sideLights ? sideY : lastY + 18;
  let inner = `<line x1="120" y1="${topY - 16}" x2="120" y2="${poleBottom}" stroke="${INK}" stroke-width="4"/>`;
  items.forEach((it, i) => {
    inner += shapeMark(it.shape, 120, topY + i * spacing, it.color);
  });
  if (opts.sideLights) {
    inner += `${shapeMark("light", 92, sideY, RED)}${shapeMark("light", 148, sideY, GREEN)}`;
  }
  if (opts.sternLight) {
    inner += shapeMark("light", 120, sternY, WHITE);
  }
  inner += `<text x="120" y="228" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">${caption}</text>`;
  return svgWrap(inner);
}

const DIAGRAMS = {
  navLightsMotor: svgWrap(`
    <ellipse cx="120" cy="150" rx="46" ry="18" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M74 150 Q120 100 166 150" fill="none" stroke="${INK}" stroke-width="3"/>
    <circle cx="120" cy="96" r="5" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <path d="M120 96 L120 60" stroke="${INK}" stroke-width="2"/>
    <path d="M120 60 A60 60 0 0 1 172 91" fill="none" stroke="${PAPER}" stroke-width="10"/>
    <path d="M120 60 A60 60 0 0 1 172 91" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="2 4"/>
    <path d="M74 150 L120 96" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
    <path d="M74 150 A85 85 0 0 1 120 40" fill="none" stroke="${RED}" stroke-width="6" opacity="0.85"/>
    <path d="M166 150 L120 96" stroke="${GREEN}" stroke-width="4" stroke-linecap="round"/>
    <path d="M166 150 A85 85 0 0 0 120 40" fill="none" stroke="${GREEN}" stroke-width="6" opacity="0.85"/>
    <circle cx="120" cy="150" r="4" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <path d="M120 150 A46 46 0 0 1 74 150" fill="none" stroke="${INK}" stroke-width="6" opacity="0.85"/>
    <path d="M120 150 A46 46 0 0 0 166 150" fill="none" stroke="${INK}" stroke-width="6" opacity="0.85"/>
    <text x="120" y="200" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Topp • Seitenlichter • Heck</text>
  `),
  navLightsSail: svgWrap(`
    <path d="M120 60 L86 168 L154 168 Z" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M120 60 L120 168" stroke="${INK}" stroke-width="2"/>
    <circle cx="120" cy="168" r="4" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <path d="M86 168 L120 96" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
    <path d="M86 168 A78 78 0 0 1 120 55" fill="none" stroke="${RED}" stroke-width="6" opacity="0.85"/>
    <path d="M154 168 L120 96" stroke="${GREEN}" stroke-width="4" stroke-linecap="round"/>
    <path d="M154 168 A78 78 0 0 0 120 55" fill="none" stroke="${GREEN}" stroke-width="6" opacity="0.85"/>
    <path d="M120 168 A24 24 0 0 1 96 168" fill="none" stroke="${INK}" stroke-width="6" opacity="0.85"/>
    <path d="M120 168 A24 24 0 0 0 144 168" fill="none" stroke="${INK}" stroke-width="6" opacity="0.85"/>
    <text x="120" y="200" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">kein Topplicht, nur Seiten- &amp; Hecklicht</text>
  `),
  navLightsSmallCraft: svgWrap(`
    <ellipse cx="120" cy="150" rx="40" ry="16" fill="none" stroke="${INK}" stroke-width="3"/>
    <circle cx="120" cy="104" r="7" fill="${PAPER}" stroke="${AMBER}" stroke-width="4"/>
    <circle cx="120" cy="104" r="26" fill="none" stroke="${AMBER}" stroke-width="3" stroke-dasharray="4 5"/>
    <path d="M120 104 L120 78" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="196" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Rundumlicht (Fahrzeuge unter 7 m / geringe Fahrt)</text>
  `),
  buoyStarboard: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <path d="M92 200 L148 200" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M96 130 L144 130 L120 60 Z" fill="${GREEN}" stroke="${INK}" stroke-width="3"/>
    <path d="M108 60 L132 60 L120 38 Z" fill="${GREEN}" stroke="${INK}" stroke-width="3"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Steuerbordtonne – grün, spitzes Topzeichen</text>
  `),
  buoyPort: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <path d="M92 200 L148 200" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <rect x="96" y="90" width="48" height="40" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <rect x="106" y="55" width="28" height="24" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Backbordtonne – rot, stumpfes Topzeichen</text>
  `),
  cardinalNorth: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <rect x="94" y="110" width="52" height="60" fill="${AMBER}" stroke="${INK}" stroke-width="3"/>
    <rect x="94" y="70" width="52" height="40" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <path d="M96 66 L144 66 L120 34 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <path d="M96 34 L144 34 L120 6 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Kardinalzeichen Nord – beide Kegel Spitze oben</text>
  `),
  cardinalSouth: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <rect x="94" y="110" width="52" height="60" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <rect x="94" y="70" width="52" height="40" fill="${AMBER}" stroke="${INK}" stroke-width="3"/>
    <path d="M96 74 L144 74 L120 106 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <path d="M96 42 L144 42 L120 74 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Kardinalzeichen Süd – beide Kegel Spitze unten</text>
  `),
  knotBowline: svgWrap(`
    <path d="M50 190 C40 150 60 120 90 120" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M90 120 C130 120 130 90 100 82 C78 76 70 96 90 100 C104 103 108 90 100 84"
          fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M100 84 C112 78 120 60 108 46" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="90" cy="120" r="34" fill="none" stroke="${MUTE}" stroke-width="2" stroke-dasharray="3 5"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Palstek – feste, nicht zuziehbare Schlaufe</text>
  `),
  knotFigureEight: svgWrap(`
    <path d="M60 190 L60 130 C60 100 150 130 110 150 C70 170 60 130 100 110 C140 90 150 60 150 40"
          fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Achtknoten – Stopperknoten am Leinenende</text>
  `),
  knotCloveHitch: svgWrap(`
    <rect x="104" y="30" width="32" height="180" fill="none" stroke="${MUTE}" stroke-width="3"/>
    <path d="M50 70 L104 55 M104 55 L136 70 M136 70 L190 55" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M50 150 L104 135 M104 135 L136 150 M136 150 L190 135" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <text x="120" y="222" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Webleinstek – Belegen an Pfahl/Poller</text>
  `),
  windPointOfSail: svgWrap(`
    <path d="M120 120 L120 20" stroke="${MUTE}" stroke-width="3" marker-end="url(#arrow)"/>
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="${MUTE}"/></marker></defs>
    <path d="M120 165 L92 205 L120 195 L148 205 Z" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M120 195 L120 125" stroke="${INK}" stroke-width="2"/>
    <path d="M120 130 L70 110" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>
    <path d="M120 130 L170 110" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>
    <text x="120" y="228" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Wind von vorn – Steuerbord- (grün) vs. Backbordbug (rot)</text>
  `),
  beaufort: svgWrap(`
    ${[1,2,3,4,5,6,7,8,9].map((v,i)=>`<rect x="${30+i*22}" y="${190-v*16}" width="14" height="${v*16}" fill="${i<4?GREEN:i<7?AMBER:RED}" opacity="0.85"/>`).join("")}
    <line x1="20" y1="190" x2="220" y2="190" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="215" text-anchor="middle" font-size="13" fill="${MUTE}" font-family="inherit">Beaufort-Skala – Windstärke 1 bis 9+</text>
  `, "0 0 240 230"),

  // --- Eigene Referenzdiagramme zu benannten Lichter-/Signalkörper-
  // Vorschriften (KVR bzw. BinSchStrO), für Fragen, deren amtliche
  // Abbildung hier nicht vorliegt. Zeigt die regelkonforme Signalführung
  // des in der Antwort genannten Fahrzeugtyps – keine Nachbildung der
  // Original-Abbildung, sondern ein eigenständig erstelltes Lehrbild.
  navLightsMotorLarge: signalStack(
    [{ shape: "light", color: WHITE }, { shape: "light", color: WHITE }],
    "2 Topplichter (vorn niedriger, achtern höher) + Seiten- u. Hecklicht (≥ 50 m)",
    { sideLights: true, sternLight: true }
  ),
  lightsNUC: signalStack(
    [{ shape: "light", color: RED }, { shape: "light", color: RED }],
    "Manövrierunfähig: mind. 2 rote Rundumlichter (bei Fahrt durchs Wasser zusätzlich Seiten-/Hecklicht)"
  ),
  lightsRAM: signalStack(
    [{ shape: "light", color: RED }, { shape: "light", color: WHITE }, { shape: "light", color: RED }],
    "Manövrierbehindert, mit Fahrt durchs Wasser: rot-weiß-rot + Seiten-/Hecklicht",
    { sideLights: true, sternLight: true }
  ),
  lightsRAMBasic: signalStack(
    [{ shape: "light", color: RED }, { shape: "light", color: WHITE }, { shape: "light", color: RED }],
    "Manövrierbehindert: rot-weiß-rot senkrecht übereinander"
  ),
  dayBallsTwo: signalStack(
    [{ shape: "ball", color: INK }, { shape: "ball", color: INK }],
    "Tagsignal manövrierunfähig: 2 schwarze Bälle übereinander"
  ),
  dayBallDiamondBall: signalStack(
    [{ shape: "ball", color: INK }, { shape: "diamond", color: INK }, { shape: "ball", color: INK }],
    "Tagsignal manövrierbehindert: Ball-Rhombus-Ball"
  ),
  dayDiamond: signalStack(
    [{ shape: "diamond", color: INK }],
    "Schwarzer Rhombus – Schleppverband mit mehr als 200 m Länge"
  ),
  lightsAgroundSmall: signalStack(
    [{ shape: "light", color: RED }, { shape: "light", color: RED }],
    "Grundsitzer < 50 m: 2 rote Rundumlichter (zusätzlich Ankerlicht(er))"
  ),
  dayBallsThree: signalStack(
    [{ shape: "ball", color: INK }, { shape: "ball", color: INK }, { shape: "ball", color: INK }],
    "Tagsignal Grundsitzer: 3 schwarze Bälle senkrecht übereinander"
  ),
  dayCylinder: signalStack(
    [{ shape: "cylinder", color: INK }],
    "Tagsignal tiefgangbehindertes Fahrzeug: schwarzer Zylinder"
  ),
  lightsTrawling: signalStack(
    [{ shape: "light", color: GREEN }, { shape: "light", color: WHITE }],
    "Fischen mit Schleppnetz (Trawler): grün über weiß"
  ),
  lightsFishingNonTrawl: signalStack(
    [{ shape: "light", color: RED }, { shape: "light", color: WHITE }],
    "Fischen ohne Schleppnetz: rot über weiß"
  ),
  dayConesTouching: signalStack(
    [{ shape: "cone-down", color: INK }, { shape: "cone-up", color: INK }],
    "Tagsignal fischendes Fahrzeug: zwei Kegel, Spitze gegen Spitze"
  ),
  lightsAnchorSingle: signalStack(
    [{ shape: "light", color: WHITE }],
    "Ankerlieger < 50 m: ein weißes Rundumlicht"
  ),
  lightsAnchorDouble: signalStack(
    [{ shape: "light", color: WHITE }, { shape: "light", color: WHITE }],
    "Ankerlieger ≥ 100 m: je ein weißes Rundumlicht vorn und achtern"
  ),
  dayDiamondsObstructed: signalStack(
    [{ shape: "diamond", color: INK }, { shape: "diamond", color: INK }],
    "Tagsignal an der gesperrten Seite von Bagger-/Arbeitsfahrzeugen: 2 schwarze Rhomben übereinander"
  ),
  lightsGreenPairClear: signalStack(
    [{ shape: "light", color: GREEN }, { shape: "light", color: GREEN }],
    "Nachtsignal an der freien, sicheren Vorbeifahrtseite: 2 grüne Rundumlichter übereinander"
  ),
  lightsBlueOne: signalStack(
    [{ shape: "light", color: BLUE }],
    "Ein blaues Licht – brennbare Stoffe geladen (Mindestabstand 10 m)"
  ),
  lightsBlueTwo: signalStack(
    [{ shape: "light", color: BLUE }, { shape: "light", color: BLUE }],
    "Zwei blaue Lichter – gesundheitsschädliche Stoffe geladen (Mindestabstand 50 m)"
  ),
  lightsBlueThree: signalStack(
    [{ shape: "light", color: BLUE }, { shape: "light", color: BLUE }, { shape: "light", color: BLUE }],
    "Drei blaue Lichter – explosive Stoffe geladen (Mindestabstand 100 m)"
  ),
  lightsSingleWhiteBinnen: signalStack(
    [{ shape: "light", color: WHITE }],
    "Nur ein weißes Rundumlicht: Kleinfahrzeug ohne Maschinenantrieb"
  ),
  lightsBicolorTopp: svgWrap(`
    <line x1="120" y1="200" x2="120" y2="60" stroke="${INK}" stroke-width="4"/>
    <circle cx="120" cy="60" r="10" fill="${WHITE}" stroke="${INK}" stroke-width="2"/>
    <path d="M92 150 A28 28 0 0 1 120 122 L120 150 Z" fill="${RED}" stroke="${INK}" stroke-width="2"/>
    <path d="M148 150 A28 28 0 0 0 120 122 L120 150 Z" fill="${GREEN}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="228" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Topplicht + zweifarbige Seitenlaterne: Kleinfahrzeug mit Maschinenantrieb</text>
  `),

  // --- Zweite Recherche-Runde: IALA-Betonnung/Kardinalzeichen, Notzeichen
  // nach Internationalem Signalbuch/KVR Anlage IV und Schallsignal-Muster,
  // die sich aus unabhängigem Vorschriftenwissen bzw. aus dem eigenen,
  // bereits wortlautgetreuen Katalogtext derselben Fragenpakete ableiten
  // lassen (z. B. Frage 162 anhand der wortlautgetreuen Definition in
  // Frage 163). Auch hier: eigenständig erstellte Lehrbilder, keine
  // Nachbildung der amtlichen Originalgrafik.
  buoySafeWater: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <path d="M92 200 L148 200" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <rect x="96" y="130" width="48" height="70" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <rect x="96" y="130" width="48" height="17.5" fill="${WHITE}" stroke="${INK}" stroke-width="1"/>
    <rect x="96" y="165" width="48" height="17.5" fill="${WHITE}" stroke="${INK}" stroke-width="1"/>
    <circle cx="120" cy="106" r="20" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <text x="120" y="222" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Mittelfahrwassertonne – rot-weiß gestreift, runde Kugel als Topzeichen</text>
  `),
  buoyPreferredStarboard: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <path d="M92 200 L148 200" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M96 130 L144 130 L120 60 Z" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <rect x="96" y="88" width="48" height="20" fill="${GREEN}" stroke="${INK}" stroke-width="2"/>
    <rect x="106" y="58" width="28" height="22" fill="${RED}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Vorzugsfahrwasser Steuerbord – rot mit grünem Band, roter Zylinder</text>
  `),
  buoyPreferredPort: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <path d="M92 200 L148 200" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <rect x="96" y="90" width="48" height="40" fill="${GREEN}" stroke="${INK}" stroke-width="3"/>
    <rect x="96" y="106" width="48" height="16" fill="${RED}" stroke="${INK}" stroke-width="2"/>
    <path d="M108 55 L132 55 L120 33 Z" fill="${GREEN}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Vorzugsfahrwasser Backbord – grün mit rotem Band, grüner Kegel</text>
  `),
  buoyIsolatedDanger: svgWrap(`
    <path d="M120 200 L120 130" stroke="${INK}" stroke-width="4"/>
    <path d="M92 200 L148 200" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <rect x="96" y="150" width="48" height="50" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <rect x="96" y="130" width="48" height="20" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <rect x="96" y="150" width="48" height="20" fill="${INK}" stroke="${INK}" stroke-width="1"/>
    <circle cx="120" cy="106" r="16" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <circle cx="120" cy="76" r="16" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Einzelgefahrenstelle – schwarz mit rotem Band, 2 schwarze Kugeln übereinander</text>
  `),
  cardinalEast: svgWrap(`
    <path d="M120 200 L120 170" stroke="${INK}" stroke-width="4"/>
    <rect x="94" y="137" width="52" height="33" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <rect x="94" y="103" width="52" height="34" fill="${AMBER}" stroke="${INK}" stroke-width="3"/>
    <rect x="94" y="70" width="52" height="33" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <path d="M96 50 L144 50 L120 26 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <path d="M96 50 L144 50 L120 74 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Kardinalzeichen Ost – schwarz-gelb-schwarz, Kegel Basis gegen Basis</text>
  `),
  cardinalWest: svgWrap(`
    <path d="M120 200 L120 170" stroke="${INK}" stroke-width="4"/>
    <rect x="94" y="137" width="52" height="33" fill="${AMBER}" stroke="${INK}" stroke-width="3"/>
    <rect x="94" y="103" width="52" height="34" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <rect x="94" y="70" width="52" height="33" fill="${AMBER}" stroke="${INK}" stroke-width="3"/>
    <path d="M96 26 L144 26 L120 50 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <path d="M96 74 L144 74 L120 50 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Kardinalzeichen West – gelb-schwarz-gelb, Kegel Spitze gegen Spitze</text>
  `),
  cardinalLightNorth: svgWrap(`
    <line x1="30" y1="120" x2="210" y2="120" stroke="${MUTE}" stroke-width="2"/>
    ${Array.from({ length: 13 }).map((_, i) => `<circle cx="${30 + i * 15}" cy="120" r="5" fill="${AMBER}"/>`).join("")}
    <text x="120" y="150" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Nord: ununterbrochenes Schnell-/Funkelblitzen (Kennung Q bzw. VQ)</text>
  `),
  cardinalLightEast: svgWrap(`
    <line x1="30" y1="120" x2="210" y2="120" stroke="${MUTE}" stroke-width="2" opacity="0.4"/>
    <circle cx="55" cy="120" r="5" fill="${AMBER}"/><circle cx="70" cy="120" r="5" fill="${AMBER}"/><circle cx="85" cy="120" r="5" fill="${AMBER}"/>
    <circle cx="155" cy="120" r="5" fill="${AMBER}" opacity="0.45"/><circle cx="170" cy="120" r="5" fill="${AMBER}" opacity="0.45"/><circle cx="185" cy="120" r="5" fill="${AMBER}" opacity="0.45"/>
    <text x="120" y="150" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Ost: Gruppe von 3 Blitzen, danach Dunkelpause (Kennung Q(3)/VQ(3))</text>
  `),
  cardinalLightSouth: svgWrap(`
    <line x1="30" y1="120" x2="210" y2="120" stroke="${MUTE}" stroke-width="2" opacity="0.4"/>
    <circle cx="45" cy="120" r="5" fill="${AMBER}"/><circle cx="58" cy="120" r="5" fill="${AMBER}"/><circle cx="71" cy="120" r="5" fill="${AMBER}"/>
    <circle cx="84" cy="120" r="5" fill="${AMBER}"/><circle cx="97" cy="120" r="5" fill="${AMBER}"/><circle cx="110" cy="120" r="5" fill="${AMBER}"/>
    <rect x="128" y="115" width="18" height="10" fill="${AMBER}"/>
    <text x="120" y="150" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Süd: Gruppe von 6 Blitzen + 1 langer Blitz (Kennung Q(6)+LFl/VQ(6)+LFl)</text>
  `),
  cardinalLightWest: svgWrap(`
    <line x1="30" y1="120" x2="210" y2="120" stroke="${MUTE}" stroke-width="2" opacity="0.4"/>
    ${[40,53,66,79,92,105,118,131,144].map((x)=>`<circle cx="${x}" cy="120" r="5" fill="${AMBER}"/>`).join("")}
    <text x="120" y="150" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">West: Gruppe von 9 Blitzen, danach Dunkelpause (Kennung Q(9)/VQ(9))</text>
  `),
  flagLima: svgWrap(`
    <line x1="60" y1="200" x2="60" y2="40" stroke="${INK}" stroke-width="4"/>
    <rect x="60" y="50" width="80" height="26" fill="${AMBER}" stroke="${INK}" stroke-width="2"/>
    <rect x="140" y="50" width="80" height="26" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <rect x="60" y="76" width="80" height="26" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <rect x="140" y="76" width="80" height="26" fill="${AMBER}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Flagge „Lima" – gelb/schwarz kariert: „Sofort stoppen!"</text>
  `),
  flagsNC: svgWrap(`
    <line x1="50" y1="200" x2="50" y2="36" stroke="${INK}" stroke-width="4"/>
    <rect x="50" y="42" width="60" height="20" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>
    <rect x="110" y="42" width="60" height="20" fill="${WHITE}" stroke="${INK}" stroke-width="2"/>
    <rect x="50" y="62" width="60" height="20" fill="${WHITE}" stroke="${INK}" stroke-width="2"/>
    <rect x="110" y="62" width="60" height="20" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>
    <line x1="150" y1="200" x2="150" y2="86" stroke="${INK}" stroke-width="3" opacity="0"/>
    <g transform="translate(0,92)">
      <rect x="50" y="0" width="120" height="10" fill="${BLUE}" stroke="${INK}" stroke-width="1"/>
      <rect x="50" y="10" width="120" height="10" fill="${WHITE}" stroke="${INK}" stroke-width="1"/>
      <rect x="50" y="20" width="120" height="10" fill="${RED}" stroke="${INK}" stroke-width="1"/>
      <rect x="50" y="30" width="120" height="10" fill="${WHITE}" stroke="${INK}" stroke-width="1"/>
      <rect x="50" y="40" width="120" height="10" fill="${BLUE}" stroke="${INK}" stroke-width="1"/>
    </g>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Flaggen „November-Charlie" (N über C gesetzt) – Seenotsignal</text>
  `),
  flagSquareBall: svgWrap(`
    <line x1="120" y1="200" x2="120" y2="36" stroke="${INK}" stroke-width="4"/>
    <rect x="120" y="46" width="70" height="46" fill="${AMBER}" stroke="${INK}" stroke-width="2"/>
    <circle cx="120" cy="120" r="16" fill="${INK}" stroke="${INK}" stroke-width="2"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Notsignal: eine viereckige Flagge mit einem Ball darunter (oder darüber)</text>
  `),
  soundFiveShort: svgWrap(`
    <line x1="20" y1="130" x2="220" y2="130" stroke="${MUTE}" stroke-width="2"/>
    ${[30,58,86,114,142].map((x)=>`<rect x="${x}" y="108" width="12" height="22" fill="${AMBER}" stroke="${INK}" stroke-width="1"/>`).join("")}
    <text x="120" y="160" text-anchor="middle" font-size="12" fill="${MUTE}" font-family="inherit">Mindestens 5 kurze Töne hintereinander – Warn-/Zweifelsignal</text>
  `),
  soundGeneralAlarm: svgWrap(`
    <line x1="15" y1="130" x2="225" y2="130" stroke="${MUTE}" stroke-width="2"/>
    <rect x="24" y="108" width="34" height="22" fill="${AMBER}" stroke="${INK}" stroke-width="1"/>
    ${[66,80,94,108].map((x)=>`<rect x="${x}" y="112" width="8" height="18" fill="${AMBER}" stroke="${INK}" stroke-width="1"/>`).join("")}
    <rect x="134" y="108" width="34" height="22" fill="${AMBER}" stroke="${INK}" stroke-width="1"/>
    ${[176,190,204,218].map((x)=>`<rect x="${x}" y="112" width="8" height="18" fill="${AMBER}" stroke="${INK}" stroke-width="1"/>`).join("")}
    <text x="120" y="160" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Allgemeines Gefahr- und Warnsignal: 2× (1 langer + 4 kurze Töne)</text>
  `),
  tafelNoEntry: svgWrap(`
    <rect x="60" y="60" width="120" height="90" fill="${RED}" stroke="${INK}" stroke-width="3"/>
    <rect x="60" y="96" width="120" height="18" fill="${WHITE}" stroke="${INK}" stroke-width="1"/>
    <line x1="120" y1="150" x2="120" y2="200" stroke="${INK}" stroke-width="4"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Zeichen A.1 – rote Tafel mit weißem Querbalken: Durchfahrt verboten, Schifffahrt gesperrt</text>
  `),
  gebotArrow: svgWrap(`
    <circle cx="120" cy="105" r="60" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
    <path d="M120 60 L120 140 M120 60 L100 84 M120 60 L140 84" fill="none" stroke="${WHITE}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="120" y1="165" x2="120" y2="200" stroke="${INK}" stroke-width="4"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Zeichen B.1 – blaue Scheibe mit weißem Pfeil: vorgeschriebene Fahrtrichtung</text>
  `),
  blueBoardLight: svgWrap(`
    <line x1="120" y1="200" x2="120" y2="90" stroke="${INK}" stroke-width="4"/>
    <rect x="76" y="90" width="88" height="46" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>
    <circle cx="120" cy="113" r="10" fill="${WHITE}" stroke="${INK}" stroke-width="2"/>
    <circle cx="120" cy="113" r="17" fill="none" stroke="${WHITE}" stroke-width="2" stroke-dasharray="3 4" opacity="0.8"/>
    <text x="120" y="222" text-anchor="middle" font-size="11" fill="${MUTE}" font-family="inherit">Blaue Tafel mit weißem Funkellicht – Begegnung an Steuerbord</text>
  `),
};

if (typeof module !== "undefined") module.exports = { DIAGRAMS };
