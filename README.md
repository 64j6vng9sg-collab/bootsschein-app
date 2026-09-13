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

Zusätzlich gilt eine Frage als **sicher gelernt** (Badge/Prozentanzeige),
sobald sie **zweimal in Folge** richtig beantwortet wurde. Eine falsch
beantwortete Frage aus dem Wiederholungsstapel fällt sofort in den
Falsch-Stapel zurück und muss dort erneut zweimal hintereinander richtig
beantwortet werden, bevor sie wieder in den Wiederholungsstapel wechselt.

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
Booten o. Ä.), die im Katalog nur als Grafik existiert. Ein direktes
Übernehmen dieser amtlichen Originalgrafiken ist in dieser Umgebung
technisch nicht möglich (kein Bild- oder Seitenabruf aus dem Internet,
ausschließlich textbasierte Recherche). Für **51 dieser Fragen** wurde
stattdessen, nach gezielter Recherche zur jeweiligen Frage, ein **eigenes
Referenzdiagramm** ergänzt – kein Nachbau der amtlichen Abbildung, sondern
eine selbst erstellte, nach den einschlägigen Vorschriften korrekte
Darstellung:

- 28 Diagramme zur Lichter- und Signalkörperführung nach KVR/BinSchStrO
  (manövrierunfähig, manövrierbehindert, Grundsitzer, fischend, Anker,
  Gefahrgut-Blaulichter u. Ä.).
- 23 weitere Diagramme aus einer zweiten Recherche-Runde: IALA-Betonnung
  und Kardinalzeichen (Tag- und Kennungs-/Blitzfolgenbild für Nord/Ost/
  Süd/West, Vorzugsfahrwasser-, Mittelfahrwasser- und Einzelgefahren-
  Tonnen), Notsignale nach Internationalem Signalbuch/KVR Anlage IV
  (Flagge „Lima", Flaggen „November-Charlie", Flagge mit Ball), Schall-
  signale, die sich aus dem eigenen, bereits wortlautgetreuen Katalogtext
  desselben Fragenpakets ableiten lassen (z. B. Frage 162 anhand der
  Definition in Frage 163), sowie zwei CEVNI/BinSchStrO-Verkehrszeichen
  (Durchfahrtsverbot, vorgeschriebene Fahrtrichtung), deren Form/Farbe
  über mehrere unabhängige Quellen übereinstimmend bestätigt werden
  konnte.

Die verbleibenden **91 Fragen** (v. a. Tafelzeichen-Grafiken an Brücken/
Wehren, konkrete Lichterkombinationen von Schub-/Schlepp-/Fährverbänden
und mehrdeutige Mehrboot-Skizzen, bei denen die Recherche keine
hinreichend präzise, quellenfeste Bestätigung des genauen Aussehens
ergab) sind weiterhin mit einem ⚠️-Warnhinweis gekennzeichnet. Die
Erkennung erfolgt heuristisch (Textmuster wie „folgende/diese/
nachstehende Lichter/Tafelzeichen/…“), ist also nicht zu 100 % präzise —
vereinzelt kann eine eigentlich selbsterklärende Frage unnötig markiert
sein (in dieser Runde bei 4 Fragen korrigiert, siehe
`scripts/attach-diagrams.js`-Kommentar).

Nicht enthalten sind die praktischen Navigationsaufgaben des
SBF-See-Katalogs (Frage 286–300): Das ist Kartenarbeit auf einer
amtlichen Übungskarte (D49) und lässt sich nicht sinnvoll als
Multiple-Choice abbilden.

**Vor der echten Prüfung ersetzt diese App nicht das Durcharbeiten der
verbleibenden 91 bild-basierten Fragen (Original-Abbildung ansehen) und
der Navigationsaufgaben mit der amtlichen Übungskarte.**

### Fragenbank erweitern

Neue Fragen werden in `js/data.js` über den Helfer `Q(pkg, category, frage,
optionen[4], korrekterIndex, quelle, { diagram, note })` ergänzt. `pkg` ist
eine der IDs aus `PACKAGES` (`basis`, `see`, `binnen`, `segeln`), `category`
einer der Schlüssel aus `CATEGORIES`. Rohtexte und die Parser/Generator-
Skripte, mit denen `js/data.js` aus dem amtlichen Katalogtext erzeugt
wurde, liegen unter `sources/fragenkatalog-see/` und
`sources/fragenkatalog-binnen/` sowie `scripts/parse-katalog*.js` und
`scripts/generate-data-js*.js` – nützlich, falls z. B. die verbleibenden
91 bild-basierten Fragen später mit den amtlichen Abbildungen ergänzt
werden sollen. `scripts/attach-diagrams.js` dokumentiert, wie die 51
Referenzdiagramme mit den jeweiligen Fragen verknüpft wurden, und lässt
sich um weitere Zuordnungen erweitern.
