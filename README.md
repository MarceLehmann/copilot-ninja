# KMUpower: Vorlagen für Microsoft Copilot

Kleine statische Seite (reines HTML, CSS und JavaScript, kein Build-Schritt) mit Vorlagen für Agent-Instruktionen in Copilot Studio und Prompts für Microsoft Copilot. Jede Aussage hat eine Quelle bei Microsoft Learn und ein Prüfdatum.

Unabhängige Website von Marcel Lehmann (Handelsname KMUpower). Sie hat keine Verbindung zu Microsoft und wird von Microsoft weder betrieben noch unterstützt.

Stand der Prüfung: 13.10.2026.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | Start mit Stufenmodell |
| `vorlagen/` | Prompts und Agent-Instruktionen zum Kopieren |
| `gratis/` | Übersicht "Was ist gratis, was kostet", je Zeile Quelle und Stand |
| `ueber/`, `impressum/`, `datenschutz/` | Autor, Impressum, Datenschutz |
| `assets/` | Gestaltung und Skript (Dunkelmodus, Kopieren) |

Alle Links sind relativ. Es gibt kein Tracking und keine Cookies.

Lokal ansehen: im Ordner `python -m http.server 8000` und `http://localhost:8000/` öffnen.

Fehler oder veraltete Aussagen bitte an die Adresse im Impressum melden.
