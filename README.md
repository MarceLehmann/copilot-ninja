# Power Platform Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio

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
## Sprachen (16.10.2026 DE/EN, 14.11.2026 FR/IT)

Deutsch liegt unter `/`, Englisch unter `/en/`, Französisch unter `/fr/`, Italienisch unter `/it/`, jeweils mit derselben Ordnerstruktur (`/fr/techniken/<slug>/`, `/fr/gratis/`, `/fr/1/` bis `/fr/25/` usw.). Eine weitere Sprache braucht nur Daten, keinen Code:

- `data/sprachen/<code>.json`: Meta (Pfad, `lang`, `og:locale`, Name, Datumsformat und Monate, Zahlformat, Beispiel-Präfix «z. B.», Namen der Prompt-Teile, Profilfelder, verbotene Wörter, Learn-Sprache, Dojo-Adresse), Tabellen (Gürtelnamen, Arten, Zugang, Vier-Wochen-Pfad, Momente) und die Texte: `ui` für den Build (`scripts/build.mjs`, `scripts/karten.mjs`), `js` für die Skripte im Browser. Schlüssel ist immer der deutsche Text, `{0}`, `{1}` sind Platzhalter. Fehlt ein Text, bricht der Build ab.
- `data/techniken.<code>.json` legt die Textfelder über die Einträge aus `data/techniken.json` (gleiche id). Struktur, Freigabe und Daten kommen immer aus der deutschen Datei. Learn-Links schreibt der Build auf die Sprache um (`learn` in der Sprachdatei, Ausnahmen in `data/sprachen/learn_ausnahmen.json`, falls eine Seite in der Sprache fehlt).
- Vorlagen: `templates/<code>/` und `templates/partials/<code>/`. Seiten von Hand unter `<code>/` (gratis, gratis/nachschlagen, pruefung, pruefung/fragen, dojo, dojo/profil, ueber, impressum, datenschutz), Fragenpool `<code>/dojo/selbsttest.json`.
- Der Build schreibt `assets/js/texte/<code>.js` (Texte der Skripte, vor `core.js` geladen), Daten unter `assets/data/<code>/`, Feed `<code>/feed.xml`, Kalender `<code>/kalender/montag.ics`, OG-Bild `og-image-<code>.png`. `karten.mjs` erzeugt Karten unter `assets/img/karten/<code>/`, Gürtelseiten und Fragenliste; mit `--sprachen=fr,it` nur für diese Sprachen.
- Sprachwahl: aufklappbare Liste mit allen Sprachen im Kopf jeder Seite (Reihenfolge DE, FR, IT, EN wie powerplatformdojo.com), verlinkt auf die Entsprechung und merkt die Wahl in `localStorage` (`cn-sprache`). `assets/js/sprache.js` läuft nur auf der deutschen Startseite und auf 404: ohne gespeicherte Wahl gilt die erste Sprache aus `navigator.languages`, die das Dojo hat (Deutsch bleibt), sonst Englisch. Crawler werden nicht weitergeleitet. Auf 404 zeigt es für Adressen unter `/<code>/` die 404-Seite der Sprache.
- Jede Seite trägt `hreflang` für alle Sprachen und x-default (Deutsch) und ein eigenes Canonical, die Sitemap enthält alle Sprachen mit `xhtml:link`.
- Dojo-Mentoring-Links zeigen auf die Sprachfassung von powerplatformdojo.com. Academy, Kurs und Newsletter gibt es nur auf Deutsch: Links bleiben, mit Hinweis auf die Sprache. Links auf powerautomate.ninja zeigen auf die gleiche Sprache (`/fr/`, `/it/`, Feld `powerautomate` in der Sprachdatei). Bekannte Ausnahme bis zum Merge von PR #4 in powerautomate.ninja (gleichzeitig mit PR #4 hier): `https://powerautomate.ninja/fr/` und `/it/` antworten noch mit 404. `links.mjs` prüft nur interne Links und meldet das darum nicht; die Prüfung bleibt unverändert.
- Typografie je Sprache (`typo` in der Sprachdatei, `scripts/typo.mjs`): Französisch bekommt ein geschütztes Leerzeichen vor : ; ? !, und zwar auf der fertigen Ausgabe (HTML-Text, Textattribute, JSON, Skript-Texte, Kalender, llms.txt, Karten), damit auch vom Code angehängte Zeichen stimmen. Quelltexte bleiben ohne Leerzeichen. Der Build bricht ab, wenn eine Seite die Regel verletzt.
- Vorschaubilder: Zeilen, die nicht auf die Karte passen, kürzt `karten.mjs` an der Wortgrenze mit «…» (Titel 3, Klartitel 2, Nutzen 4 Zeilen; Gürtelname, Leitwort und Unterzeile verkleinern zuerst die Schrift).
- Fortschritt, Profil und Selbsttest gelten sprachübergreifend (gleicher Speicher `cn-dojo-v1`, Profilfelder unter den deutschen Namen).

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
