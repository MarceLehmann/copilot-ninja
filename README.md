# PowerPlatformAcademy Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio

Statische Website (HTML, CSS, JavaScript) mit 25 Techniken und 5 Grundformen für Microsoft Copilot Chat und Copilot Studio, geordnet vom weissen bis zum schwarzen Gürtel. Jede Technik nennt ihre Quellen bei Microsoft Learn und den Stand (`geprueft_am`, auch als `dateModified` im JSON-LD). Prüfstempel gibt es nur noch einmal oben auf `/gratis/`, ohne Alterung (Review 15.10.2026). Feld `suchbegriffe` je Technik speist die Suche (Strg+K).

Unabhängige Website von Marcel Lehmann (Handelsname KMUpower). Sie hat keine Verbindung zu Microsoft und wird von Microsoft weder betrieben noch unterstützt.

## Seiten

Aufbau, Stil und Menge pro Seite wie die Schwesterseite powerautomate.ninja (Umbau 16.10.2026): gleiche Kopfzeile (Techniken, Gürtelprüfung, Lizenz-Check, Mein Dojo, Menü auf allen Breiten), gleiche Startseite in fünf Blöcken, gleiche Fusszeile. Eigener Farbton: leicht violett (`--paper #F3EFF7`, Akzent `--site #6B3FA0`, dunkel `#100D16` und `#C6A6F0`), powerautomate.ninja leicht blau. Tusch ist die Figur beider Dojos.

| Pfad | Inhalt |
|---|---|
| `/` | Startseite: Hero (Welcher Copilot-Gürtel bist du?, Tusch), Lizenz-Check Frage 1, Technik des Tages, Gürtelweg, Absender |
| `/techniken/` | alle Techniken nach Gürtel, Filter, die vier Momente als kurze Liste |
| `/techniken/<slug>/` | eine Technik: Metazeile, Vorher, Prompt (Felder «Für dich anpassen» eingeklappt), Grenzen, Quelle |
| `/1/` bis `/25/` | Kurzadressen, leiten auf die Technik mit dieser Nummer |
| `/pruefung/` | Gürtelprüfung (Selbsttest, sieben Fragen), `/pruefung/fragen/` alle Fragen mit Auflösung |
| `/gratis/` | Lizenz-Check: Was in Microsoft Copilot Chat ohne Zusatzlizenz enthalten ist |
| `/gratis/nachschlagen/` | Mythen, Stufen, jede Bedingung im Wortlaut, FAQ, Prüfprotokoll |
| `/dojo/` | eigener Fortschritt, bleibt im Browser; `/dojo/profil/` Profil und Technik beitragen |
| `/vier-wochen/` | Vier-Wochen-Pfad zum Selbstlernen |
| `/heute/` | Technik des Tages |
| `/dojo/guertel/<farbe>/` | Gürtelseiten für geteilte Karten |
| `/ueber/`, `/impressum/`, `/datenschutz/` | Methode, Anbieter, Datenschutz |
| `/dojo/test/`, `/vorlagen/` | Weiterleitungen alter Adressen (`UMZUEGE` in `scripts/build.mjs`) |

Umgezogene Anker (`/gratis/#faq`, `/dojo/#beitragen`, `/techniken/#vier-wochen`) leitet `core.js` über `data-anker-umzug` am `main`-Element auf die Unterseite weiter.
## Sprachen (16.10.2026)

Deutsch liegt unter `/`, Englisch unter `/en/` mit derselben Ordnerstruktur (`/en/techniken/<slug>/`, `/en/gratis/`, `/en/1/` bis `/en/25/` usw.).

- Texte der Techniken: `data/techniken.en.json` legt die englischen Textfelder über die Einträge aus `data/techniken.json` (gleiche id). Struktur, Freigabe, Quellen-URLs und Daten kommen immer aus der deutschen Datei. Der Build prüft gleich viele Listeneinträge und die Regeln (keine Gedankenstriche, keine Emojis, keine «»).
- Vorlagen: `templates/en/` und `templates/partials/en/`. Seiten von Hand: `en/gratis/`, `en/dojo/`, `en/pruefung/`, `en/pruefung/fragen/`, `en/gratis/nachschlagen/`, `en/dojo/profil/`, `en/ueber/`, `en/impressum/`, `en/datenschutz/` (Anker und IDs wie deutsch). `en/dojo/selbsttest.json` ist der englische Fragenpool. `karten.mjs` erzeugt Karten, Gürtelseiten und Fragenliste für beide Sprachen.
- Daten für Skripte je Sprache: `assets/data/` und `assets/data/en/`, Karten `assets/img/karten/en/`, OG-Bild `og-image-en.png`, Feed `en/feed.xml`, Kalender `en/kalender/montag.ics`.
- Sprachwahl: Umschalter DE/EN im Kopf jeder Seite, verlinkt auf die Entsprechung und merkt die Wahl in `localStorage` (`cn-sprache`). `assets/js/sprache.js` läuft nur auf der deutschen Startseite: ohne gespeicherte Wahl und ohne Deutsch in `navigator.languages` leitet es einmal auf `en/` weiter und merkt `en`. Crawler werden nicht weitergeleitet. Auf 404 zeigt es für Adressen unter `/en/` die englische 404-Seite.
- Jede Seite trägt `hreflang` (de, en, x-default auf Deutsch) und ein eigenes Canonical, die Sitemap enthält beide Sprachen mit `xhtml:link`.
- Fortschritt, Profil und Selbsttest gelten sprachübergreifend (gleicher Speicher `cn-dojo-v1`).

## Kurszeile und Kursstatus (UX-Review 17.10.2026, Paket 1)

Eine Kurszeile zur Academy in der gemeinsamen Dojo-Vorlage, gleicher Satzbau in beiden Dojos: Technik-Seiten unter «Nächste Technik», Ende von `/vier-wochen/`, Ergebnis der Gürtelprüfung und «Alle Techniken geübt» in Mein Dojo. Quelle ist `kursZeile()` in `scripts/build.mjs`. Skripte holen die Zeile aus `<template data-kurs-vorlage>` im Fuss (`kursZeile()` in `assets/js/dojo.js`), damit der Status nur an einer Stelle steht.

`KURS_STATUS` in `scripts/build.mjs` folgt der Kursseite der Academy: `warteliste` (Stand 17.10.2026: «Auf die Warteliste», «Neue Termine folgen in Kürze») oder `termine`, sobald Termine buchbar sind. In powerautomate.ninja heisst das Feld `kurs_status` in `site.config.json`. Beide gleich halten.

Klickziele mindestens 24 px (WCAG 2.5.8): Regeln unter `.krumen a` in `templates/css/site.css`. Das Vorher-Zitat unter «Der Schnitt» bleibt nach dem Pinselstrich sichtbar.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `data/techniken.json` | einzige Inhaltsquelle der Techniken |
| `templates/` | Seitenvorlagen, Partials (Kopf, Fuss, Figur Tusch, Stempel) und CSS-Quellen |
| `scripts/build.mjs` | erzeugt Start, Technik-Wand, Technik-Seiten, Kurzadressen, Sitemap, Feed, `llms.txt`, Kalenderdatei und füllt die Rahmen der Seiten von Hand |
| `scripts/links.mjs` | prüft alle internen Links unter `/copilot-ninja/` und unter einer eigenen Domain, dazu die Sitemap |
| `scripts/pruefen.mjs` | listet Prüfdaten und Learn-Links, prüft Kontraste |
| `scripts/karten.mjs` | erzeugt die Vorschaubilder je Technik und Gürtel (braucht ein lokales Chrome) |
| `gratis/`, `gratis/nachschlagen/`, `pruefung/`, `pruefung/fragen/`, `dojo/`, `dojo/profil/`, `ueber/`, `impressum/`, `datenschutz/` | Seiten von Hand mit Rahmen-Markern, die der Build füllt |
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

Die Seite setzt keine Cookies und erstellt keine Profile. Aufrufe werden ohne Cookies gezählt, gespeichert werden nur Summen ohne Personenbezug (GoatCounter): `assets/js/count.js` selbst gehostet, Endpunkt https://copilot-ninja.goatcounter.com/count, in der CSP (`templates/partials/head.html`) unter connect-src und img-src freigegeben. Fortschritt und Einstellungen bleiben im Browser (siehe Datenschutz). Links zur Academy und zu kmupower.com tragen einen Herkunftsparameter (utm_source=copilot.ninja), den die Zielseite nach ihrer eigenen Datenschutzerklärung auswertet.

Lokal ansehen: im Ordner `python -m http.server 8000` und `http://localhost:8000/` öffnen. Für den Unterpfad den Server im Elternordner starten und `http://localhost:8000/copilot-ninja/` öffnen.

Fehler oder veraltete Aussagen bitte an die Adresse im Impressum melden.
