# PowerPlatformAcademy Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio

Statische Website (HTML, CSS, JavaScript) mit 25 Techniken und 5 Grundformen für Microsoft Copilot Chat und Copilot Studio, geordnet vom weissen bis zum schwarzen Gürtel. Jede Technik nennt ihre Quellen bei Microsoft Learn und den Stand (`geprueft_am`, auch als `dateModified` im JSON-LD). Prüfstempel gibt es nur noch einmal oben auf `/gratis/`, ohne Alterung (Review 15.10.2026). Feld `suchbegriffe` je Technik speist die Suche (Strg+K).

Unabhängige Website von Marcel Lehmann (Handelsname KMUpower). Sie hat keine Verbindung zu Microsoft und wird von Microsoft weder betrieben noch unterstützt.

## Seiten

| Pfad | Inhalt |
|---|---|
| `/` | Startseite: Hero, Gratis-Check, Vier Momente mit Technik des Tages (nur ohne Zusatzlizenz), Gürtelpfad, Trainer |
| `/techniken/` | alle Techniken nach Gürtel, mit Filter |
| `/techniken/<slug>/` | eine Technik: Vorher und Nachher, Prompt zum Ausfüllen und Kopieren, Grenzen, Quelle |
| `/1/` bis `/25/` | Kurzadressen, leiten auf die Technik mit dieser Nummer |
| `/heute/` | Technik des Tages |
| `/gratis/` | Was in Microsoft Copilot Chat ohne Zusatzlizenz enthalten ist, mit Gratis-Check |
| `/dojo/` | eigener Fortschritt, bleibt im Browser |
| `/dojo/test/` | Selbsttest mit sieben Fragen |
| `/dojo/guertel/<farbe>/` | Gürtelseiten für geteilte Karten |
| `/ueber/`, `/impressum/`, `/datenschutz/` | Methode, Anbieter, Datenschutz |
| `/vorlagen/` | Weiterleitung der früheren Vorlagen-Seite |

## Sprachen (16.10.2026)

Deutsch liegt unter `/`, Englisch unter `/en/` mit derselben Ordnerstruktur (`/en/techniken/<slug>/`, `/en/gratis/`, `/en/1/` bis `/en/25/` usw.).

- Texte der Techniken: `data/techniken.en.json` legt die englischen Textfelder über die Einträge aus `data/techniken.json` (gleiche id). Struktur, Freigabe, Quellen-URLs und Daten kommen immer aus der deutschen Datei. Der Build prüft gleich viele Listeneinträge und die Regeln (keine Gedankenstriche, keine Emojis, keine «»).
- Vorlagen: `templates/en/` und `templates/partials/en/`. Seiten von Hand: `en/gratis/`, `en/dojo/`, `en/dojo/test/`, `en/ueber/`, `en/impressum/`, `en/datenschutz/` (Anker und IDs wie deutsch). `en/dojo/selbsttest.json` ist der englische Fragenpool. `karten.mjs` erzeugt Karten, Gürtelseiten und Fragenliste für beide Sprachen.
- Daten für Skripte je Sprache: `assets/data/` und `assets/data/en/`, Karten `assets/img/karten/en/`, OG-Bild `og-image-en.png`, Feed `en/feed.xml`, Kalender `en/kalender/montag.ics`.
- Sprachwahl: Umschalter DE/EN im Kopf jeder Seite, verlinkt auf die Entsprechung und merkt die Wahl in `localStorage` (`cn-sprache`). `assets/js/sprache.js` läuft nur auf der deutschen Startseite: ohne gespeicherte Wahl und ohne Deutsch in `navigator.languages` leitet es einmal auf `en/` weiter und merkt `en`. Crawler werden nicht weitergeleitet. Auf 404 zeigt es für Adressen unter `/en/` die englische 404-Seite.
- Jede Seite trägt `hreflang` (de, en, x-default auf Deutsch) und ein eigenes Canonical, die Sitemap enthält beide Sprachen mit `xhtml:link`.
- Fortschritt, Profil und Selbsttest gelten sprachübergreifend (gleicher Speicher `cn-dojo-v1`).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `data/techniken.json` | einzige Inhaltsquelle der Techniken |
| `templates/` | Seitenvorlagen, Partials (Kopf, Fuss, Figur Tusch, Stempel) und CSS-Quellen |
| `scripts/build.mjs` | erzeugt Start, Technik-Wand, Technik-Seiten, Kurzadressen, Sitemap, Feed, `llms.txt`, Kalenderdatei und füllt die Rahmen der Seiten von Hand |
| `scripts/links.mjs` | prüft alle internen Links unter `/copilot-ninja/` und unter einer eigenen Domain, dazu die Sitemap |
| `scripts/pruefen.mjs` | listet Prüfdaten und Learn-Links, prüft Kontraste |
| `scripts/karten.mjs` | erzeugt die Vorschaubilder je Technik und Gürtel (braucht ein lokales Chrome) |
| `gratis/`, `dojo/`, `ueber/`, `impressum/`, `datenschutz/` | Seiten von Hand mit Rahmen-Markern, die der Build füllt |
| `assets/` | erzeugtes CSS, Skripte, Daten für Suche und Technik des Tages, Bilder |

Node 18 oder neuer, keine Abhängigkeiten. Nach jeder Änderung an Daten oder Vorlagen:

```
node scripts/build.mjs --vorschau      Vorschau mit allen Einträgen, nicht freigegebene Seiten mit noindex
node scripts/build.mjs --produktion    nur freigegebene Einträge
node scripts/links.mjs                 interne Links unter beiden Basen prüfen
node scripts/links.mjs --livegang      zusätzlich Abbruch, solange Vorschau-Seiten im Ordner liegen
```

## Vor jedem Push

Der Ordner enthält nach `--vorschau` Seiten mit Banner «Interne Vorschau» und `noindex`. Diese dürfen nicht veröffentlicht werden.

1. `node scripts/karten.mjs --produktion`, dann `node scripts/build.mjs --produktion`
2. `node scripts/links.mjs --livegang`
3. Erst dann pushen. Der Git-Hook `scripts/pre-push` macht Schritt 2 automatisch und bricht den Push ab, solange ein Vorschau-Build im Ordner liegt. Einrichten auf einem neuen Rechner: `cp scripts/pre-push .git/hooks/pre-push`.

## Checkliste Domainwechsel (Pflicht)

Stand 16.10.2026: live unter https://copilot.ninja/ (Datei `CNAME`, alle Einträge freigegeben, Build `--produktion`). Die frühere Basis steht in `FRUEHERE_BASEN` in `scripts/build.mjs`, der Build schreibt feste Adressen in den Seiten von Hand darauf um. `robots.txt` (Content-Signal, eigene Gruppen für Such- und KI-Crawler), `llms.txt` und `llms-full.txt` erzeugt der Build. IndexNow: Schlüsseldatei `877ee17afb57b50738142a71bd40922c.txt` an der Wurzel, Workflow `.github/workflows/indexnow.yml` nach jedem Pages-Deploy und täglich.

1. In `scripts/build.mjs` `BASE_URL` auf die neue Adresse setzen, zum Beispiel `https://copilot.ninja/`. `links.mjs` und `karten.mjs` lesen den Wert von dort.
2. `node scripts/karten.mjs --produktion` und `node scripts/build.mjs --produktion --og-png`. Das erneuert `404.html` (Pfade ab der Basis), Canonical, `og:url`, Sitemap, `robots.txt`, Feed, `llms.txt`, JSON-LD und die Herkunftszeile in den Kopiertexten.
3. `node scripts/links.mjs --livegang`.
4. `404.html` unter der neuen Domain mit einer erfundenen Adresse aufrufen und prüfen, dass CSS und Skripte laden.
5. Sitemap in der Google Search Console und den Bing Webmaster Tools für die neue Domain einreichen. Unter `marcelehmann.github.io/copilot-ninja/` wirkt `robots.txt` nicht, weil Crawler sie nur an der Wurzel eines Hosts lesen.

## Was GitHub Pages zusätzlich ausliefert

Pages veröffentlicht den ganzen Branch, also auch `templates/`, `scripts/`, `data/` und dieses README. `robots.txt` sperrt diese Ordner für Crawler, sobald die Seite an der Wurzel einer eigenen Domain liegt. Wer die Rohdateien gar nicht ausliefern will, stellt Pages auf einen Ordner oder Branch nur mit den erzeugten Dateien um (offener Entscheid, siehe `_recherche/konzept/Korrekturprotokoll.md`).

## Schrift

Die Titelschrift liegt unter `assets/fonts/` (Barlow Semi Condensed, SIL Open Font License 1.1, Herkunft in `assets/fonts/LIESMICH.txt`). Sie wird selbst ausgeliefert, nichts kommt von fremden Servern.

Alle Links sind relativ, die Seite läuft unter einem Unterpfad und unter einer eigenen Domain. Ausnahme ist `404.html`: GitHub Pages liefert sie in jeder Tiefe aus, darum nutzt sie Pfade ab der Basis aus `BASE_URL` in `scripts/build.mjs`. Beim Wechsel auf eine eigene Domain wird `BASE_URL` angepasst und neu gebaut.

Die Seite selbst trackt nicht und setzt keine Cookies. Einzige Anfrage an einen fremden Server ist die anonyme Zugriffszählung mit GoatCounter: `assets/js/count.js` selbst gehostet, Endpunkt https://copilot-ninja.goatcounter.com/count, in der CSP (`templates/partials/head.html`) unter connect-src und img-src freigegeben. Fortschritt und Einstellungen bleiben im Browser (siehe Datenschutz). Links zur Academy und zu kmupower.com tragen einen Herkunftsparameter (utm_source=copilot.ninja), den die Zielseite nach ihrer eigenen Datenschutzerklärung auswertet.

Lokal ansehen: im Ordner `python -m http.server 8000` und `http://localhost:8000/` öffnen. Für den Unterpfad den Server im Elternordner starten und `http://localhost:8000/copilot-ninja/` öffnen.

Fehler oder veraltete Aussagen bitte an die Adresse im Impressum melden.
