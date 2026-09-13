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

Alle 513 Fragen sind **wortlaut- und nummerngetreu amtlich**, übernommen
aus den Fragen- und Antwortenkatalogen der Wasserstraßen- und
Schifffahrtsverwaltung des Bundes (ELWIS, Stand 01.08.2023):

| Paket | Fragen | Amtliche Herkunft |
|---|---|---|
| Basisfragen | 72 | Fragenkatalog SBF See/Binnen, Frage 1–72 (laut Katalog identisch für See & Binnen, hier nur einmal geführt) |
| Seespezifische Fragen | 213 | Fragenkatalog SBF See, Frage 73–285 |
| Binnenspezifische Fragen | 181 | Fragenkatalog SBF Binnen, Frage 73–253 |
| Spezifische Fragen Segeln | 47 | Fragenkatalog SBF Binnen, Frage 254–300 |

Bei 141 der 513 Fragen bezieht sich das Original zusätzlich auf eine
Abbildung (Lichterbild, Tafelzeichen, Flaggensignal, Skizze mit mehreren
Booten o. Ä.), die im Katalog nur als Grafik existiert und hier nicht
reproduziert werden kann; diese Fragen sind in der App mit einem
⚠️-Warnhinweis gekennzeichnet. Die Erkennung erfolgt heuristisch
(Textmuster wie „folgende/diese/nachstehende Lichter/Tafelzeichen/…“),
ist also nicht zu 100 % präzise — vereinzelt kann eine eigentlich
selbsterklärende Frage unnötig markiert sein.

Nicht enthalten sind die praktischen Navigationsaufgaben des
SBF-See-Katalogs (Frage 286–300): Das ist Kartenarbeit auf einer
amtlichen Übungskarte (D49) und lässt sich nicht sinnvoll als
Multiple-Choice abbilden.

**Vor der echten Prüfung ersetzt diese App nicht das Durcharbeiten der
141 bild-basierten Fragen (Original-Abbildung ansehen) und der
Navigationsaufgaben mit der amtlichen Übungskarte.**

### Fragenbank erweitern

Neue Fragen werden in `js/data.js` über den Helfer `Q(pkg, category, frage,
optionen[4], korrekterIndex, quelle, { diagram, note })` ergänzt. `pkg` ist
eine der IDs aus `PACKAGES` (`basis`, `see`, `binnen`, `segeln`), `category`
einer der Schlüssel aus `CATEGORIES`. Rohtexte und die Parser/Generator-
Skripte, mit denen `js/data.js` aus dem amtlichen Katalogtext erzeugt
wurde, liegen unter `sources/fragenkatalog-see/` und
`sources/fragenkatalog-binnen/` sowie `scripts/parse-katalog*.js` und
`scripts/generate-data-js*.js` – nützlich, falls z. B. die 141
bild-basierten Fragen später mit den amtlichen Abbildungen ergänzt
werden sollen.
