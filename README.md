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
- `js/storage.js` – Fortschritts-/Wiederholungslogik (localStorage)
- `js/app.js` – Rendering, Navigation, Fragentrainer
- `manifest.webmanifest`, `service-worker.js`, `icons/` – PWA/App-Icon (eigenes, selbst gezeichnetes Motiv)
- `scripts/make-icons.js` – generiert die PNG-App-Icons ohne externe Abhängigkeiten
- `scripts/smoke-test.js` – Playwright-Rauchtest (Dashboard → Paket → Training → Fortschritt)

## Lernlogik

- Fortschritt wird pro Frage lokal auf dem Gerät gespeichert (`localStorage`).
- Eine Frage gilt als **sicher gelernt**, sobald sie **zweimal in Folge**
  richtig beantwortet wurde.
- Wird eine Frage falsch beantwortet, landet sie automatisch im
  **Wiederholungspaket** des jeweiligen Fragenpakets, bis sie wieder
  zweimal in Folge richtig beantwortet wird.
- Auf dem Dashboard gibt es zusätzlich eine paketübergreifende
  Schnellaktion „Nur falsch beantwortete Fragen üben“.

## Stand der Fragenquelle

| Paket | Fragen | Quelle |
|---|---|---|
| Basisfragen | 72 | **Amtlich, wortlaut- & nummerngetreu** – Fragenkatalog SBF See, ELWIS, Stand 01.08.2023, Frage 1–72 (laut Katalog identisch für See & Binnen) |
| Seespezifische Fragen | 213 | **Amtlich, wortlaut- & nummerngetreu** – dieselbe Quelle, Frage 73–285 |
| Binnenspezifische Fragen | 20 | **Nicht amtlich** – eigenständig formuliert (Originaltext für Frage 73–253 des Fragenkatalogs Binnen lag nicht vor), inhaltlich an BinSchStrO orientiert und mit Vorschrift belegt |

Bei 78 der 285 amtlichen Fragen bezieht sich das Original zusätzlich auf
eine Abbildung (Lichterbild, Tafelzeichen, Flaggensignal o. Ä.), die im
Katalog nur als Grafik existiert und hier nicht reproduziert werden
kann; diese Fragen sind in der App mit einem Warnhinweis gekennzeichnet
und ohne die Abbildung nicht zuverlässig lösbar.

Nicht enthalten sind die praktischen Navigationsaufgaben des amtlichen
Katalogs (Frage 286–300): Das ist Kartenarbeit auf einer amtlichen
Übungskarte (D49) und lässt sich nicht sinnvoll als Multiple-Choice
abbilden.

**Vor der echten Prüfung ersetzt diese App nicht das Durcharbeiten des
amtlichen Fragenkatalogs**, insbesondere nicht für die 78 bild-basierten
Fragen und die Binnen-spezifischen Themen.

### Fragenbank erweitern / vervollständigen

Neue Fragen werden in `js/data.js` über den Helfer `Q(pkg, category, frage,
optionen[4], korrekterIndex, quelle, { diagram, note })` ergänzt. `pkg` ist
eine der IDs aus `PACKAGES` (`basis`, `see`, `binnen`), `category` einer
der Schlüssel aus `CATEGORIES`. Am dringendsten fehlt der amtliche
Originaltext des Fragenkatalogs Binnen (Spezifische Fragen Binnen, Frage
73–253) sowie die 78 Abbildungen zu den bild-basierten Fragen – sobald
diese vorliegen, lassen sich beide nach demselben Muster einpflegen wie
die bereits verbatim übernommenen Pakete (siehe `scripts/parse-katalog.js`
und `scripts/generate-data-js.js` für das verwendete Vorgehen).
