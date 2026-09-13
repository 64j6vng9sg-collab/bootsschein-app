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

## Wichtiger Hinweis zur Fragenquelle

Der Zugriff auf elwis.de (amtlicher Fragenkatalog der Prüfungsausschüsse
DSV/DMYV) sowie auf alle recherchierten Spiegelseiten war in der
Entwicklungsumgebung netzwerkseitig blockiert. Eine wortlaut- und
nummerngetreue 1:1-Übernahme des amtlichen Katalogs war daher nicht
verifizierbar möglich (siehe Kopfkommentar in `js/data.js`).

Die enthaltenen Fragen sind stattdessen **eigenständig formulierte**
Prüfungsfragen, die sich strikt an den offiziellen Themenkomplexen
orientieren (Basisfragen, Seespezifische Fragen, Binnenspezifische
Fragen, Navigation, Wetterkunde, Schifffahrtsrecht, Verhalten auf dem
Wasser) und mit der jeweils einschlägigen Rechtsquelle belegt sind
(KVR/COLREG-Regelnummern, BinSchStrO, SeeSchStrO, Sportbootführerschein-
Verordnung). Wo eine exakte Paragraphen-Nummer nicht mit Sicherheit zu
verifizieren war, wird nur der Name der Vorschrift/das Kapitel genannt,
nie eine geratene Nummer.

**Vor der echten Prüfung ersetzt diese App nicht das Durcharbeiten des
amtlichen Fragenkatalogs.**

### Fragenbank erweitern

Neue Fragen werden in `js/data.js` über den Helfer `Q(pkg, category, frage,
optionen[4], korrekterIndex, quelle, { diagram })` ergänzt. `pkg` ist eine
der IDs aus `PACKAGES` (`basis`, `see`, `binnen`, `navigation`),
`category` einer der Schlüssel aus `CATEGORIES`. Damit lässt sich die
Fragenbank bei Verfügbarkeit des amtlichen Originaltexts 1:1 auf den
vollständigen Katalog erweitern, ohne App-Logik oder Design anzufassen.
