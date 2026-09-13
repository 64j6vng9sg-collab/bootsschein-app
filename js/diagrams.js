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
};

if (typeof module !== "undefined") module.exports = { DIAGRAMS };
