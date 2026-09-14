# SBF-Trainer – Theorie See & Binnen

Statische Web-App zur Prüfungsvorbereitung auf den Sportbootführerschein
See und Binnen (kombiniert). Kein Build-Schritt, kein Framework, kein
Backend – reines HTML/CSS/JavaScript, lauffähig direkt aus dem
Dateisystem oder von jedem statischen Webserver, optimiert für iPhone
Safari (Add-to-Homescreen/PWA-fähig).

## Starten

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

Auf dem iPhone: Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“,
für die App-artige Vollbild-Nutzung ohne Browser-Chrome.

## Struktur

- `index.html` – Grundgerüst, Topbar, PWA-Meta-Tags
- `css/styles.css` – Design (hell/dunkel automatisch nach Systemeinstellung)
- `js/data.js` – Fragenpakete, Kategorien, Fragen inkl. Quellenangabe
- `js/diagrams.js` – selbst erstellte SVG-Schaubilder (Lichter, Tonnen, Knoten, Wind, Beaufort)
- `images/see/`, `images/binnen/` – echte Original-Abbildungen aus dem amtlichen Fragenkatalog (vom Nutzer bereitgestellt), je Frage-Nummer benannt
- `js/storage.js` – Fortschritts-/Wiederholungslogik (localStorage)
- `js/app.js` – Rendering, Navigation, Fragentrainer
- `manifest.webmanifest`, `service-worker.js`, `icons/` – PWA/App-Icon (eigenes, selbst gezeichnetes Motiv)
- `scripts/make-icons.js` – generiert die PNG-App-Icons ohne externe Abhängigkeiten
- `scripts/smoke-test.js` – Playwright-Rauchtest (Dashboard → Paket → Training → Fortschritt)

## Lernlogik

Fortschritt wird pro Frage lokal auf dem Gerät gespeichert (`localStorage`).
Jede Frage befindet sich pro Fragenpaket jederzeit in genau einem von drei
nachverfolgbaren Stapeln:

- **Neu** – noch nie beantwortet.
- **Falsch beantwortet** – die letzte Antwort war falsch. Beim Üben wird
  eine erneut falsch beantwortete Frage ans Ende der laufenden Übungsrunde
  zurückgestellt statt zu verschwinden, sodass man sie in derselben Runde
  wieder vorgelegt bekommt.
- **Wiederholungsstapel** – die letzte Antwort war richtig. Fragen bleiben
  hier auch nach dem Verlassen des Falsch-Stapels sichtbar und stehen für
  gelegentliche Wiederholung bereit, statt einfach zu verschwinden.

Zusätzlich gilt eine Frage als **gelernt** (Badge/Prozentanzeige), sobald
sie **einmal richtig** beantwortet wurde. Eine falsch beantwortete Frage
aus dem Wiederholungsstapel fällt sofort in den Falsch-Stapel zurück und
gilt erst wieder als gelernt, sobald sie erneut richtig beantwortet wird.

Jedes Fragenpaket zeigt alle drei Stapel mit Anzahl und eigenem
Üben-Button. Auf dem Dashboard gibt es zusätzlich paketübergreifende
Schnellaktionen für „Falsch beantwortete üben“ und „Wiederholungsstapel
üben“.

## Stand der Fragenquelle

Alle 513 Fragen sind **wortlaut- und nummerngetreu amtlich**, übernommen
aus den Fragen- und Antwortenkatalogen der Wasserstraßen- und
Schifffahrtsverwaltung des Bundes (ELWIS, Stand 01.08.2023):

| Paket | Fragen | Amtliche Herkunft |
|---|---|---|
| Basisfragen | 72 | Fragenkatalog SBF See/Binnen, Frage 1–72 (laut Katalog identisch für See & Binnen, hier nur einmal geführt) |
| Seespezifische Fragen | 213 | Fragenkatalog SBF See, Frage 73–285 |
| Binnenspezifische Fragen | 181 | Fragenkatalog SBF Binnen, Frage 73–253 |
| Spezifische Fragen Segeln | 47 | Fragenkatalog SBF Binnen, Frage 254–300 |

Bei 142 der 513 Fragen bezieht sich das Original zusätzlich auf eine
Abbildung (Lichterbild, Tafelzeichen, Flaggensignal, Skizze mit mehreren
Booten o. Ä.), die im Katalog nur als Grafik existiert.

- **84 Fragen** zeigen die **echte amtliche Original-Abbildung**. Der
  Nutzer hat dafür die Original-PDFs mit den Abbildungsseiten des
  Fragenkatalogs (SBF See und SBF Binnen, Stand 01.08.2023) bereitgestellt;
  die Bilder wurden daraus extrahiert, der jeweiligen Frage zugeordnet und
  liegen unter `images/see/` bzw. `images/binnen/`.
- **51 Fragen** haben ein **eigenes Referenzdiagramm** (kein Nachbau der
  amtlichen Abbildung, sondern eine selbst erstellte, nach den
  einschlägigen Vorschriften korrekte Darstellung) – u. a. Lichter- und
  Signalkörperführung nach KVR/BinSchStrO, IALA-Betonnung und
  Kardinalzeichen, Notsignale nach Internationalem Signalbuch.
- Die verbleibenden **7 Fragen** (See 141; Binnen 162–167, Schallsignal-
  Tafeln) sind weiterhin mit einem ⚠️-Warnhinweis gekennzeichnet: Für sie
  fehlte die Abbildung auch in den vom Nutzer bereitgestellten PDF-Auszügen
  (die betreffende Original-Seite enthielt kein extrahierbares Bild,
  vermutlich weil sie eine Vektorgrafik statt eines Rasterbilds ist).

Die Erkennung bild-abhängiger Fragen erfolgt heuristisch (Textmuster wie
„folgende/diese/nachstehende Lichter/Tafelzeichen/…“), ist also nicht zu
100 % präzise — vereinzelt kann eine eigentlich selbsterklärende Frage
unnötig markiert sein (in einer früheren Runde bei 4 Fragen korrigiert,
siehe `scripts/attach-diagrams.js`-Kommentar).

Nicht enthalten sind die praktischen Navigationsaufgaben des
SBF-See-Katalogs (Frage 286–300): Das ist Kartenarbeit auf einer
amtlichen Übungskarte (D49) und lässt sich nicht sinnvoll als
Multiple-Choice abbilden.

**Vor der echten Prüfung ersetzt diese App nicht das Durcharbeiten der
verbleibenden 7 bild-losen Fragen (Original-Abbildung ansehen) und der
Navigationsaufgaben mit der amtlichen Übungskarte.**

### Fragenbank erweitern

Neue Fragen werden in `js/data.js` über den Helfer `Q(pkg, category, frage,
optionen[4], korrekterIndex, quelle, { image, diagram, note })` ergänzt.
`pkg` ist eine der IDs aus `PACKAGES` (`basis`, `see`, `binnen`, `segeln`),
`category` einer der Schlüssel aus `CATEGORIES`. `image` verweist auf eine
echte Original-Abbildung unter `images/see/` bzw. `images/binnen/` und hat
Vorrang vor `diagram` (eigenes SVG-Referenzbild aus `js/diagrams.js`); ist
weder `image` noch `diagram` gesetzt, zeigt die App bei vorhandenem `note`
einen Bildrahmen-Platzhalter. Rohtexte und die Parser/Generator-Skripte,
mit denen `js/data.js` aus dem amtlichen Katalogtext erzeugt wurde, liegen
unter `sources/fragenkatalog-see/` und `sources/fragenkatalog-binnen/`
sowie `scripts/parse-katalog*.js` und `scripts/generate-data-js*.js`.
`scripts/attach-diagrams.js` dokumentiert die Zuordnung der 51
Referenzdiagramme, `scripts/attach-images.js` die Zuordnung der 84 echten
Original-Abbildungen zu den jeweiligen Fragen – beide lassen sich um
weitere Einträge erweitern, sobald mehr amtliches Bildmaterial vorliegt.
