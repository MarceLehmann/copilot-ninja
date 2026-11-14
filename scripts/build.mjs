#!/usr/bin/env node
/*
  Power Platform Dojo: Generator und Validierung. Node 18 oder neuer, keine Abhaengigkeiten.

  node scripts/build.mjs --vorschau            alle Eintraege, Banner auf Seiten ohne Freigabe (Standard)
  node scripts/build.mjs --produktion          nur Eintraege mit freigabe und leerem offen_pruefen
  node scripts/build.mjs --pruefen             nur Validierung, schreibt nichts
  node scripts/build.mjs --freigabeblatt [A|B] schreibt nur _recherche/konzept/freigabeblatt.html
  Zusatz: --locker   fehlende Marker und Anker in Seiten anderer Agenten nur als Warnung (Welle 0)
          --og-png   rendert og-image.png aus og-image.svg mit lokalem Chrome (Pfad per CHROME=...)
          --datum=JJJJ-MM-TT   Build-Datum festlegen (Standard: heute, lokale Zeit)
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Domainwechsel: nur BASE_URL umstellen. Die bisherige Basis bleibt in FRUEHERE_BASEN, damit der Build
// feste Adressen in den Seiten von Hand (canonical, og:url, JSON-LD) auf die neue Basis umschreibt.
const BASE_URL = 'https://copilot.ninja/';
const FRUEHERE_BASEN = ['https://marcelehmann.github.io/copilot-ninja/'].filter(b => b !== BASE_URL);
// Sprachen (16.10.2026 DE/EN, 14.11.2026 FR/IT): Deutsch unter /, jede weitere Sprache unter /<code>/ mit gleicher Ordnerstruktur.
// Eine Sprache ist nur Daten: data/sprachen/<code>.json (Meta, Tabellen, ui = Texte des Builds, js = Texte der Skripte, Schluessel ist
// jeweils der deutsche Text), data/techniken.<code>.json, templates/<code>/, templates/partials/<code>/ und die Seiten von Hand unter <code>/.
const SP = Object.fromEntries(fs.readdirSync(path.join(ROOT, 'data/sprachen')).filter(f => /^[a-z]{2}\.json$/.test(f))
  .map(f => { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sprachen', f), 'utf8')); return [j.code, j]; }));
const SPRACHEN = Object.keys(SP).sort((a, b) => (a === 'de' ? -1 : b === 'de' ? 1 : SP[a].reihenfolge - SP[b].reihenfolge));
const ANZEIGE = SPRACHEN.slice().sort((a, b) => SP[a].reihenfolge - SP[b].reihenfolge);
let L = 'de';
const LP = () => SP[L].pfad;
const istDE = () => L === 'de';
const KURZ_BASIS = BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const KONTAKT = 'marcel.lehmann@kmupower.com';
const RECHT_STAND = '2026-10-24';
// Produktnamen wie Microsoft Learn sie am 13.10.2026 schreibt.
const PRODUKTNAMEN = {
  'copilot-chat': 'Microsoft Copilot Chat',
  'microsoft-copilot': 'Microsoft Copilot',
  'agent-builder': 'Agent Builder',
  'copilot-studio': 'Copilot Studio',
  'power-automate': 'Power Automate'
};
// Marken im gemeinsamen Microsoft-Hinweis der Fusszeile. Die Grundliste ist der freigegebene Bestand, ergaenzt wird, was auf der Seite vorkommt.
const MARKEN_BASIS = ['Bing', 'Entra', 'Excel', 'Microsoft 365', 'Microsoft Copilot', 'Microsoft Copilot Chat', 'Microsoft Graph', 'Microsoft Learn', 'Microsoft Teams', 'OneNote', 'Outlook', 'PowerPoint', 'SharePoint', 'Word', 'Work IQ'];
const MARKEN_KANDIDATEN = ['Agent Builder', 'Azure', 'Dataverse', 'Microsoft Purview', 'Power BI', 'Power Pages', 'Microsoft Dataverse', 'Microsoft Edge', 'Windows'];
const QUELLE_AUSNAHMEN = ['https://www.powerplatformacademy.online/'];
const UTM = (stelle) => `utm_source=copilot.ninja&utm_medium=referral&utm_campaign=dojo&utm_content=${stelle}`;
const KURS_URL = (stelle) => `https://www.powerplatformacademy.online/kurse/copilot-expert?${UTM(stelle)}`;
const NEWSLETTER_URL = (stelle) => `https://kmupower.com/newsletter?${UTM(stelle)}`;
const ACADEMY_URL = (stelle) => `https://www.powerplatformacademy.online/?${UTM(stelle)}`;
// Dojo gehoert zur Power Platform Academy (Marcel 16.10.2026): eigene UTM fuer den Zugehoerigkeitssatz
const ACADEMY_DOJO_URL = (stelle) => `https://www.powerplatformacademy.online/?utm_source=copilot.ninja&utm_medium=dojo&utm_campaign=dojo&utm_content=${stelle}`;
const SITE_NAME = 'Power Platform Dojo';
const SITE_ZUSATZ = 'Copilot';
const SITE_VOLL = 'Power Platform Dojo';
const LEARN_TESTVERSION = 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-licensing-subscriptions';
const LEARN_PROMPTS = 'https://learn.microsoft.com/en-us/training/modules/write-effective-prompts-do-more-prompting/';
const GENERATOR = '<meta name="generator" content="Power Platform Dojo build">';

const FARBEN = ['weiss', 'gelb', 'orange', 'gruen', 'blau', 'braun', 'schwarz'];
const guertelStandard = () => FARBEN.map((farbe, i) => ({ nr: i + 1, farbe, name: SP[L].guertel[i][0], kurz: SP[L].guertel[i][1] }));
// Learn-Links: auf Seiten einer Sprache die Learn-Fassung dieser Sprache (data/sprachen/<code>.json, learn), ausser die Seite fehlt dort
// (data/sprachen/learn_ausnahmen.json, gepflegt mit node scripts/pruefen.mjs --learn-sprachen)
const LEARN_AUSNAHMEN = fs.existsSync(path.join(ROOT, 'data/sprachen/learn_ausnahmen.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sprachen/learn_ausnahmen.json'), 'utf8')) : {};
function learn(url) {
  const ziel = SP[L].learn || 'en-us';
  if (typeof url !== 'string' || !url.startsWith('https://learn.microsoft.com/en-us/') || ziel === 'en-us') return url;
  const neu = url.replace('/en-us/', `/${ziel}/`);
  return (LEARN_AUSNAHMEN[ziel] || []).includes(neu.split('#')[0]) ? url : neu;
}
const ANKER = { weiss: 'weisser-guertel', gelb: 'gelber-guertel', orange: 'oranger-guertel', gruen: 'gruener-guertel', blau: 'blauer-guertel', braun: 'brauner-guertel', schwarz: 'schwarzer-guertel' };
const ART_ICONS = {
  pinselstrich: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M2 11c5-1 9-6 18-8"/></svg>',
  schriftrolle: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M4 2h14v10H4zM4 2a2 2 0 0 0 0 10M18 2a2 2 0 0 1 0 10"/></svg>',
  kata: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M1 7h20"/><circle cx="4" cy="7" r="2"/><circle cx="11" cy="7" r="2"/><circle cx="18" cy="7" r="2"/></svg>'
};
// Namen und Knopftexte der Arten je Sprache: data/sprachen/<code>.json (art)
const artFuer = () => Object.fromEntries(Object.keys(ART_ICONS).map(k => [k, { ...SP[L].art[k], icon: ART_ICONS[k] }]));
let ART = artFuer();
const ZUGANG_BASIS = {
  'ohne-zl': { klasse: 'frei', anker: 'chat-ohne-zusatzlizenz', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2l2 2 4-4.4"/></svg>' },
  'agent-builder': { klasse: 'builder', anker: 'agent-builder', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2l2 2 4-4.4"/></svg>' },
  'lizenz': { klasse: 'lizenz', anker: 'organisationsdaten', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="5.5" cy="8" r="3"/><path d="M8.5 8H15M12.5 8v2.5M14.5 8v2"/></svg>' },
  'studio': { klasse: 'studio', anker: 'studio-testversion', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 3h12v10H2zM2 6h12"/></svg>' },
  'rechner': { klasse: 'rechner', anker: 'studio-verbrauch', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 1.5h10v13H3zM5 4h6M5.5 8h1M9.5 8h1M5.5 11h1M9.5 11h1"/></svg>' }
};
const zugangFuer = () => Object.fromEntries(Object.entries(ZUGANG_BASIS).map(([k, v]) => [k, { ...v, kurz: SP[L].zugang_kurz[k] }]));
let ZUGANG = zugangFuer();
const ICONS = {
  suche: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
  zufall: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>',
  sonne: '<svg class="icon-sonne" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  mond: '<svg class="icon-mond" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  menue: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h12"/></svg>',
  zu: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19"/></svg>'
};
// Vier-Wochen-Pfad (Konzept 7.3): je Ergebnis die Technik, aus der es stammt.
// Vier-Wochen-Pfad (Konzept 7.3) und die vier Momente: Texte je Sprache in data/sprachen/<code>.json (wochen, momente).
let WOCHEN = SP.de.wochen;
let MOMENTE = SP.de.momente;
// Alte Pfade, die seit dem Umbau vom 16.10.2026 weiterleiten: [alt, neu, Titel deutsch, Titel englisch]
const UMZUEGE = [['dojo/test/', 'pruefung/', 'Gürtelprüfung']];
const ALTE_ANKER = ['notizen-zu-protokoll', 'antwort-auf-kundenmail', 'tabelle-pruefen', 'agent-interne-anleitungen', 'agent-anfragen-sortieren'];
// Zweisprachigkeit 16.10.2026: dojo.js 20 auf 23 und dojo-seiten.js 28 auf 32 (englische Texte direkt im Skript, kein Nachladen), sprache.js neu 2.
// GoatCounter 24.10.2026: count.js ist lokal angepasst und sendet keinen Query-String. Die sha256 im Dateikopf gehoert zum unveraenderten Original.
// Budgets in KB. Korrektur 15.10.2026: site.css 40 auf 46 (Schrift, Fokus, Hero, kompakter Pfad), core.js 20 auf 22,
// dojo-seiten.js und dojo-extra.js neu gedeckelt, Schriftdateien gedeckelt. Ueber 120 Prozent bricht der Build ab.
// Review 15.10.2026: site.css 46 auf 49 (Startseite mit Gratis-Check, Pfadzeilen, kompakter Technik des Tages),
// gratis.js 9 auf 11 (Urteil im Ergebnis, Vorauswahl von der Startseite). Die Startseite selbst ist um ein Viertel kleiner.
const BUDGET = { 'assets/css/site.css': 49, 'assets/css/technik.css': 6, 'assets/css/dojo.css': 6, 'assets/css/gratis.css': 8, 'assets/js/theme-init.js': 1, 'assets/js/core.js': 22, 'assets/js/dojo.js': 23, 'assets/js/dojo-seiten.js': 32, 'assets/js/dojo-extra.js': 9, 'assets/js/gratis.js': 11, 'assets/js/kompass.js': 5, 'assets/data/suche.json': 10, 'assets/fonts/dojo-display-600.woff2': 25, 'assets/fonts/dojo-display-700.woff2': 25, 'index.html': 60, 'assets/js/sprache.js': 3, ...Object.fromEntries(SPRACHEN.filter(x => x !== 'de').flatMap(sp => [[`${SP[sp].pfad}index.html`, 60], [`assets/data/${SP[sp].pfad}suche.json`, 11], [`assets/js/texte/${sp}.js`, 16]])), 'assets/js/count.js': 10, 'templates/partials/tusch.svg': 4 };

/* Aufruf */
const ARGS = process.argv.slice(2);
const MODUS = ARGS.includes('--produktion') ? 'produktion' : ARGS.includes('--pruefen') ? 'pruefen' : ARGS.includes('--freigabeblatt') ? 'freigabeblatt' : 'vorschau';
const LOCKER = ARGS.includes('--locker');
// Testphase (Marcel 15.10.2026): alle Eintraege wie Vorschau, ohne Banner, dafuer jede Seite noindex. Fuer den Test unter github.io vor Freigabe und Domain.
const TESTPHASE = ARGS.includes('--testphase') && !ARGS.includes('--produktion');
const PAKET = (() => { const i = ARGS.indexOf('--freigabeblatt'); const p = i > -1 ? ARGS[i + 1] : ''; return p === 'A' || p === 'B' ? p : ''; })();
const DATUM = (ARGS.find(a => a.startsWith('--datum=')) || '').slice(8) || lokalesDatum(new Date());
const fehlerListe = [];
const warnListe = [];
const fehler = (m) => fehlerListe.push(m);
const warnung = (m) => warnListe.push(m);
const geschrieben = [];

/* Hilfen */
function lokalesDatum(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function lies(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function gibtEs(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function istIso(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().startsWith(s); }
// Datum in der Sprache des laufenden Durchgangs nach data/sprachen/<code>.json (datum, monate): 15.10.2026, October 15, 2026, 15 octobre 2026
function datumCH(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return SP[L].datum.replace('{dd}', d).replace('{mm}', m).replace('{d}', String(+d) + (+d === 1 && SP[L].erster ? SP[L].erster : '')).replace('{monat}', (SP[L].monate || [])[+m - 1] || m).replace('{y}', y);
}
// Text in der Sprache des Durchgangs. Schluessel ist der deutsche Text, {0} {1} ... werden durch die weiteren Argumente ersetzt.
const fehlendeTexte = new Set();
function T(de, ...werte) {
  let s = de;
  if (L !== 'de') { const u = SP[L].ui || {}; if (typeof u[de] === 'string') s = u[de]; else if (!fehlendeTexte.has(L + de)) { fehlendeTexte.add(L + de); fehler(`data/sprachen/${L}.json ui: Text fehlt «${de.slice(0, 80)}»`); } }
  return werte.length ? s.replace(/\{(\d+)\}/g, (m, i) => (werte[+i] !== undefined ? String(werte[+i]) : m)) : s;
}
function pad2(n) { return String(n).padStart(2, '0'); }
function tageZwischen(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
function schreibe(rel, inhalt) {
  if (MODUS === 'pruefen') return;
  const ziel = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, inhalt);
  geschrieben.push(rel.replace(/\\/g, '/'));
}
function praefix(rel) { const tiefe = rel.split('/').length - 1; return tiefe ? '../'.repeat(tiefe) : ''; }
function jsonLd(obj) { return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n</script>`; }

/* Templates: {{feld}} escaped, {{{feld}}} roh, {{> partial}}, {{#feld}}...{{/feld}}, {{^feld}}...{{/feld}} */
const partialCache = {};
// Weitere Sprachen: templates/partials/<code>/<name> bzw. templates/<code>/<datei>, falls vorhanden, sonst die gemeinsame (deutsche) Fassung
function partial(name) {
  const key = `${L}:${name}`;
  if (!partialCache[key]) {
    const datei = [...(L !== 'de' ? ['html', 'svg'].map(e => `templates/partials/${L}/${name}.${e}`) : []), ...['html', 'svg'].map(e => `templates/partials/${name}.${e}`)].find(gibtEs);
    if (!datei) { fehler(`Partial fehlt: templates/partials/${name}`); return ''; }
    partialCache[key] = lies(datei).replace(/\s+$/, '');
  }
  return partialCache[key];
}
function vorlage(datei) {
  if (L !== 'de') { if (gibtEs(`templates/${L}/${datei}`)) return lies(`templates/${L}/${datei}`); fehler(`templates/${L}/${datei} fehlt`); }
  return lies(`templates/${datei}`);
}
function render(tpl, ctx, quelle = 'Template') {
  let s = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => render(partial(n), ctx, n));
  s = s.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, n, inner) => {
    const v = ctx[n];
    if (Array.isArray(v)) return v.map(x => render(inner, { ...ctx, ...x }, quelle)).join('');
    return v ? render(inner, ctx, quelle) : '';
  });
  s = s.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, n, inner) => {
    const v = ctx[n];
    return (Array.isArray(v) ? v.length : v) ? '' : render(inner, ctx, quelle);
  });
  return s.replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, roh, feld) => {
    const n = roh || feld;
    if (!(n in ctx)) { warnung(`${quelle}: Variable «${n}» fehlt`); return ''; }
    return roh ? String(ctx[n] ?? '') : esc(ctx[n]);
  });
}

// Wortmarke als Text in der eigenen Titelschrift (16.10.2026: Name Power Platform Dojo, darunter klein Copilot)
function wortmarke(srText = '') {
  return `<span class="marke__wort"><span class="marke__name">Power Platform Dojo</span><span class="marke__zusatz">${SITE_ZUSATZ}</span></span>${srText ? `<span class="sr-only">${srText}</span>` : ''}`;
}

/* Tusch */
function tusch(pose, extra = '') {
  return `<span class="tusch tusch--${pose}${extra ? ' ' + extra : ''}" data-tusch aria-hidden="true">${partial('tusch')}</span>`;
}

/* Daten laden. Jede weitere Sprache: data/techniken.<code>.json legt Textfelder ueber die deutschen Eintraege (gleiche id, gleiche Struktur). */
let daten;
const datenSP = {};
try { daten = JSON.parse(lies('data/techniken.json')); }
catch (e) { console.error(`data/techniken.json ist nicht lesbar: ${e.message}`); process.exit(1); }
for (const sp of SPRACHEN) {
  if (sp === 'de') { datenSP.de = daten; continue; }
  try { datenSP[sp] = JSON.parse(lies(`data/techniken.${sp}.json`)); }
  catch (e) { console.error(`data/techniken.${sp}.json ist nicht lesbar: ${e.message}`); process.exit(1); }
}
function guertelListe() {
  const quelle = datenSP[L].guertel;
  const g = guertelStandard().map(s => ({ ...s, leitwort: '', kannst_du: '', erreicht_satz: '', ...((quelle || []).find(x => x.nr === s.nr) || {}) }));
  g.forEach(x => { x.anker = ANKER[x.farbe] || `guertel-${x.nr}`; if (!x.kurz) x.kurz = SP[L].guertel[x.nr - 1][1]; });
  return g;
}
let GUERTEL = guertelListe();
const gName = (n) => (GUERTEL[n - 1] || {}).name || T("Gürtel {0}", n);
const ALLE_DE = Array.isArray(daten.techniken) ? daten.techniken : [];
// Eintraege je Sprache: Struktur und Metadaten aus dem deutschen Eintrag, Texte aus techniken.<code>.json, Learn-Links in der Sprache
const ALLE_SP = { de: ALLE_DE };
for (const sp of SPRACHEN.filter(s => s !== 'de')) {
  L = sp;
  ALLE_SP[sp] = ALLE_DE.map(t => {
    const ue = (datenSP[sp].techniken || {})[t.id];
    if (!ue) { fehlerListe.push(`${t.id}: Übersetzung fehlt in data/techniken.${sp}.json`); return { ...t }; }
    const aus = { ...t, ...ue, quelle_url: learn(t.quelle_url) };
    if (Array.isArray(aus.weitere_quellen)) aus.weitere_quellen = aus.weitere_quellen.map(q => ({ ...q, url: learn(q.url) }));
    if (t.rechner) {
      const r = ue.rechner || {};
      aus.rechner = { ...t.rechner, ...r, quelle_url: learn(t.rechner.quelle_url), beispiel: { ...t.rechner.beispiel, ...(r.beispiel || {}) },
        raten: t.rechner.raten.map(x => ({ ...x, ...((r.raten || []).find(y => y.schluessel === x.schluessel) || {}) })) };
      if (Array.isArray(aus.rechner.weitere_quellen)) aus.rechner.weitere_quellen = aus.rechner.weitere_quellen.map(q => ({ ...q, url: learn(q.url) }));
    }
    for (const k of ['so_nutzt_du_es', 'das_darfst_du_erwarten', 'grenzen', 'zielgruppe', 'zusatz_texte']) if (Array.isArray(t[k]) && (!Array.isArray(aus[k]) || aus[k].length !== t[k].length)) fehlerListe.push(`${t.id}: Feld ${k} in data/techniken.${sp}.json hat nicht gleich viele Einträge`);
    return aus;
  });
}
L = 'de';
let ALLE = ALLE_DE;

/* Validierung */
const PFLICHT = ['id', 'slug', 'titel', 'guertel', 'werkzeug', 'zielgruppe', 'problem', 'technik_text', 'so_nutzt_du_es', 'das_darfst_du_erwarten', 'grenzen', 'quelle_url', 'quelle_titel', 'geprueft_am', 'dauer_min', 'teilen_text'];
// Regeln fuer alle Sprachen, dazu je Sprache verbotene Woerter aus data/sprachen/<code>.json (verboten). Englisch: keine «».
const VERBOTEN_ALLE = [[/[–—]/, 'Gedankenstrich'], [/ß/, 'Eszett'], [/\p{Extended_Pictographic}/u, 'Emoji'], [/\bM365\b/i, '«M365»'], [/copilot[\s-]ninja/i, '«Copilot-Ninja»']];
const verbotenFuer = (l) => [...VERBOTEN_ALLE, ...(SP[l].verboten || []).map(([re, wort]) => [new RegExp(re, 'iu'), wort])];
let VERBOTEN = verbotenFuer('de');
const WAFFEN = /klinge|schwert|messer|wurfstern|dolch/i;
function texteVon(wert, pfad, aus) {
  if (typeof wert === 'string') aus.push([pfad, wert]);
  else if (Array.isArray(wert)) wert.forEach((v, i) => texteVon(v, `${pfad}[${i}]`, aus));
  else if (wert && typeof wert === 'object') Object.entries(wert).forEach(([k, v]) => texteVon(v, `${pfad}.${k}`, aus));
  return aus;
}
function platzhalter(text, wo, hinweise) {
  let tiefe = 0;
  for (const z of text) { if (z === '{') tiefe++; if (z === '}') tiefe--; if (tiefe < 0 || tiefe > 1) { fehler(`${wo}: geschweifte Klammern nicht ausgeglichen`); return []; } }
  if (tiefe !== 0) { fehler(`${wo}: geschweifte Klammern nicht ausgeglichen`); return []; }
  const felder = [];
  for (const m of text.matchAll(/\{([^{}|]*)(?:\|([^{}]*))?\}/g)) {
    const name = m[1].trim(), hinweis = (m[2] || '').trim();
    if (!name) { fehler(`${wo}: leerer Platzhalter`); continue; }
    if (name.length > 40) fehler(`${wo}: Feldname über 40 Zeichen «${name}»`);
    if (name in hinweise && hinweise[name] !== hinweis && hinweis && hinweise[name]) fehler(`${wo}: Feld «${name}» hat verschiedene Hinweise`);
    if (!(name in hinweise) || (!hinweise[name] && hinweis)) hinweise[name] = hinweis;
    felder.push(name);
  }
  return felder;
}
function validiere() {
  const ids = new Set(), slugs = new Set(), nrs = new Set();
  if (!Array.isArray(daten.techniken)) fehler('data/techniken.json: «techniken» fehlt');
  for (const k of ['stand', 'naechste_pruefung', 'tag_start']) if (daten[k] && !istIso(daten[k])) fehler(`Kopf: ${k} ist kein ISO-Datum`);
  texteVon(datenSP[L].guertel || [], `${L}:guertel`, []).forEach(([p, t]) => VERBOTEN.forEach(([re, w]) => re.test(t) && fehler(`${p}: enthält ${w}`)));
  for (const t of ALLE) {
    const wo = (L !== 'de' ? L + ':' : '') + (t.id || '(ohne id)');
    for (const f of PFLICHT) {
      const v = t[f];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) fehler(`${wo}: Pflichtfeld «${f}» fehlt oder ist leer`);
    }
    if (t.id) { if (ids.has(t.id)) fehler(`${wo}: id doppelt`); ids.add(t.id); }
    if (t.id && !/^(t(0[1-9]|1\d|2[0-5])|g[1-5])$/.test(t.id)) fehler(`${wo}: id muss t01 bis t25 oder g1 bis g5 sein`);
    if (t.slug) {
      if (slugs.has(t.slug)) fehler(`${wo}: slug doppelt`); slugs.add(t.slug);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.slug)) fehler(`${wo}: slug nur [a-z0-9-]`);
      if (/copilot/i.test(t.slug)) fehler(`${wo}: slug enthält «copilot»`);
    }
    if (t.typ !== 'technik' && t.typ !== 'grundform') fehler(`${wo}: typ muss «technik» oder «grundform» sein`);
    if (t.typ === 'technik') {
      if (!Number.isInteger(t.nr) || t.nr < 1 || t.nr > 25) fehler(`${wo}: nr 1 bis 25 fehlt`);
      else { if (nrs.has(t.nr)) fehler(`${wo}: nr doppelt`); nrs.add(t.nr); }
    }
    if (!Number.isInteger(t.guertel) || t.guertel < 1 || t.guertel > 7) fehler(`${wo}: guertel 1 bis 7`);
    if (t.art && !ART[t.art]) fehler(`${wo}: art unbekannt «${t.art}»`);
    if (t.zugang && !ZUGANG[t.zugang]) fehler(`${wo}: zugang unbekannt «${t.zugang}»`);
    if (t.klasse && t.klasse !== 'zeitlos' && t.klasse !== 'produktabhaengig') fehler(`${wo}: klasse unbekannt`);
    if (Array.isArray(t.werkzeug)) t.werkzeug.forEach(w => !PRODUKTNAMEN[w] && fehler(`${wo}: werkzeug unbekannt «${w}»`));
    else if (t.werkzeug !== undefined) fehler(`${wo}: werkzeug muss eine Liste sein`);
    for (const f of ['zielgruppe', 'so_nutzt_du_es', 'das_darfst_du_erwarten', 'grenzen']) if (t[f] !== undefined && !Array.isArray(t[f])) fehler(`${wo}: ${f} muss eine Liste sein`);
    if (t.dauer_min !== undefined && !Number.isInteger(t.dauer_min)) fehler(`${wo}: dauer_min ganzzahlig`);
    if (typeof t.titel === 'string' && WAFFEN.test(t.titel)) fehler(`${wo}: Waffenwort im Titel «${t.titel}»`);
    for (const f of ['geprueft_am', 'ausgefuehrt_am', 'datum_publiziert', 'freigabe']) {
      if (t[f] === null || t[f] === undefined) continue;
      if (!istIso(t[f])) fehler(`${wo}: ${f} ist kein ISO-Datum`);
    }
    if (istIso(t.geprueft_am) && t.geprueft_am > DATUM) fehler(`${wo}: geprueft_am liegt in der Zukunft`);
    if (t.quelle_url && !t.quelle_url.startsWith('https://learn.microsoft.com/') && !QUELLE_AUSNAHMEN.some(a => t.quelle_url.startsWith(a))) fehler(`${wo}: quelle_url muss auf learn.microsoft.com zeigen`);
    texteVon(t, wo, []).forEach(([p, text]) => VERBOTEN.forEach(([re, w]) => re.test(text) && fehler(`${p}: enthält ${w}`)));
    const hinweise = {};
    if (typeof t.technik_text === 'string') platzhalter(t.technik_text, `${wo}.technik_text`, hinweise);
    (t.zusatz_texte || []).forEach((z, i) => platzhalter(z.text || '', `${wo}.zusatz_texte[${i}]`, hinweise));
    t._felder = hinweise;
    if (t.zugang_anker && !/^[a-z0-9-]+$/.test(t.zugang_anker)) fehler(`${wo}: zugang_anker ohne # angeben`);
    if (t.rechner) {
      const r = t.rechner;
      if (!Array.isArray(r.raten) || !r.raten.every(x => x.schluessel && Number.isFinite(x.credits))) fehler(`${wo}: rechner.raten unvollständig`);
      if (r.quelle_url && !r.quelle_url.startsWith('https://learn.microsoft.com/')) fehler(`${wo}: rechner.quelle_url muss auf learn.microsoft.com zeigen`);
    }
  }
  for (const t of ALLE) for (const f of ['kommt_aus', 'weiter_mit']) (t[f] || []).forEach(id => !ids.has(id) && fehler(`${t.id}: ${f} verweist auf unbekannte id «${id}»`));
  (daten.tag_reihenfolge || []).forEach(id => !ids.has(id) && fehler(`tag_reihenfolge: unbekannte id «${id}»`));
}
for (const sp of SPRACHEN) { L = sp; ALLE = ALLE_SP[sp]; VERBOTEN = verbotenFuer(sp); ART = artFuer(); ZUGANG = zugangFuer(); validiere(); }
L = 'de'; ALLE = ALLE_DE; VERBOTEN = verbotenFuer('de'); ART = artFuer(); ZUGANG = zugangFuer();

/* Auswahl je Modus und Sprache. setzeSprache(code) stellt alle Listen auf die Sprache des Durchgangs. */
const istFrei = (t) => istIso(t.freigabe) && (!t.offen_pruefen || !t.offen_pruefen.length);
const VORSCHAU = MODUS !== 'produktion';
const ohneFreigabe = (liste) => VORSCHAU && liste.some(t => t && !istFrei(t));
const neuGrenze = (() => { const d = new Date(DATUM + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 30); return d.toISOString().slice(0, 10); })();
let DABEI, sortiert, TECHNIKEN, GRUNDFORMEN, NACH_ID, ALLE_NACH_ID, ANZAHL, STAND, alleNeu, mailtoBeitrag, BASE_L;
function setzeSprache(l) {
  L = l;
  ALLE = ALLE_SP[l];
  VERBOTEN = verbotenFuer(l);
  ART = artFuer(); ZUGANG = zugangFuer(); GUERTEL = guertelListe();
  WOCHEN = SP[l].wochen; MOMENTE = SP[l].momente;
  BASE_L = BASE_URL + LP();
  DABEI = MODUS === 'produktion' ? ALLE.filter(istFrei) : ALLE.slice();
  sortiert = DABEI.slice().sort((a, b) => a.guertel - b.guertel || (a.typ === b.typ ? (a.nr || 0) - (b.nr || 0) || a.id.localeCompare(b.id) : a.typ === 'grundform' ? -1 : 1));
  TECHNIKEN = sortiert.filter(t => t.typ === 'technik');
  GRUNDFORMEN = sortiert.filter(t => t.typ === 'grundform');
  NACH_ID = Object.fromEntries(DABEI.map(t => [t.id, t]));
  ALLE_NACH_ID = Object.fromEntries(ALLE.map(t => [t.id, t]));
  ANZAHL = TECHNIKEN.length;
  STAND = DABEI.map(t => t.geprueft_am).filter(istIso).sort().pop() || daten.stand || DATUM;
  alleNeu = DABEI.length && DABEI.filter(t => t.datum_publiziert >= neuGrenze).length > DABEI.length / 2;
  mailtoBeitrag = 'mailto:' + KONTAKT + '?subject=' + encodeURIComponent(T('Technik für das Dojo')) + '&body=' + encodeURIComponent(T('Titel der Technik:\n\nProblem, das sie löst:\n\nPrompt oder Anleitung:\n\nGrenzen:\n\nQuelle bei Microsoft Learn:\n\nDarf ich dich als Absender nennen? (ja oder nein)\n\nBitte keine Kunden-, Personen- oder Firmendaten im Prompt.'));
}
setzeSprache('de');
if (MODUS === 'produktion') ALLE.filter(t => !istFrei(t)).forEach(t => warnung(`Produktion: ${t.id} ausgelassen (${!istIso(t.freigabe) ? 'keine Freigabe' : 'offen_pruefen nicht leer'})`));
// Der Pruefstempel nennt das Datum der Lesung gegen Learn. Liest Marcel bei der Freigabe selbst nach, gehoert sein Datum in geprueft_am.
if (MODUS === 'produktion') ALLE.filter(t => istFrei(t) && istIso(t.geprueft_am) && t.freigabe > t.geprueft_am).forEach(t => warnung(`Produktion: ${t.id} freigegeben am ${t.freigabe}, geprueft_am ${t.geprueft_am}. Hast du die Quellen bei der Freigabe gelesen, setz geprueft_am auf dieses Datum.`));
const urlTechnik = (t) => `${BASE_L}techniken/${t.slug}/`;
const nrLabel = (t) => t.typ === 'technik' ? pad2(t.nr) : t.id.toUpperCase();

/* Gratis-Anker (beide Sprachen haben dieselben Anker) */
// Seit 16.10.2026 stehen die Zeilen im Wortlaut auf /gratis/nachschlagen/ (Lizenz-Check kurz, Nachschlagteil als Unterseite)
for (const datei of SPRACHEN.map(sp => `${SP[sp].pfad}gratis/nachschlagen/index.html`)) {
  const ids = gibtEs(datei) ? new Set([...lies(datei).matchAll(/\sid="([^"]+)"/g)].map(m => m[1])) : null;
  if (!ids && SPRACH_PRAEFIX.test(datei)) { fehler(`${datei} fehlt`); continue; }
  for (const t of DABEI) {
    const anker = t.zugang_anker || (ZUGANG[t.zugang] || {}).anker;
    if (!anker) continue;
    if (!ids || !ids.has(anker)) (LOCKER ? warnung : fehler)(`${t.id}: Anker #${anker} fehlt in ${datei}`);
  }
}

/* Bausteine */
function zugangBadge(t, r, kurz = false) {
  const z = ZUGANG[t.zugang]; if (!z) return '';
  const anker = t.zugang_anker || z.anker;
  const text = kurz ? z.kurz : (t.zugang_text || z.kurz);
  return `<a class="zugang zugang--${z.klasse}" href="${r}gratis/nachschlagen/#${esc(anker)}">${z.icon}${esc(text)}</a>`;
}
function artBadge(t) { const a = ART[t.art]; return a ? `<span class="art art--${t.art}">${a.icon}${a.name}</span>` : ''; }
function knoten(n, text, extra = '') { return `<span class="knoten${extra}" data-guertel-nr="${n}">${esc(text)}</span>`; }
function phSpan(name, hinweis) {
  const zeige = hinweis ? (ZB_MUSTER.test(hinweis) ? `[${name}, ${hinweis}]` : `[${name}, ${T("z. B.")} ${hinweis}]`) : `[${name}]`;
  return `<span class="ph" data-ph="${esc(name)}">${esc(zeige)}</span>`;
}
function textHtml(text, hinweise = {}) {
  let aus = '', letzt = 0;
  for (const m of text.matchAll(/\{([^{}|]*)(?:\|([^{}]*))?\}/g)) {
    aus += esc(text.slice(letzt, m.index));
    const name = m[1].trim();
    aus += phSpan(name, hinweise[name] || (m[2] || '').trim());
    letzt = m.index + m[0].length;
  }
  return aus + esc(text.slice(letzt));
}
// Teile eines Prompts (Ziel, Kontext, Quelle, Erwartung) in allen Sprachen, Namen aus data/sprachen/<code>.json (teile)
const TEILE = Object.assign({}, ...SPRACHEN.map(sp => SP[sp].teile || {}));
const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TEIL_NAMEN = Object.keys(TEILE).sort((a, b) => b.length - a.length).map(reEsc).join('|');
const TEIL_START = new RegExp(`^(${Object.keys(TEILE).filter(k => /^(ziel|kontext)$/.test(TEILE[k])).map(reEsc).join('|')}):`, 'm');
const TEIL_ANFANG = new RegExp(`^(${TEIL_NAMEN}):`);
const ZB_MUSTER = new RegExp(`^(${SPRACHEN.map(sp => reEsc(SP[sp].zb).replace(/ /g, '\\s?')).join('|')})`);
// Profilfelder (Firmenname, Funktion, Branche) und lange Felder (Textfeld statt Zeile) aus allen Sprachen
const PROFIL_NAMEN = SPRACHEN.flatMap(sp => Object.keys(SP[sp].profil_felder || {}));
const LANGE_FELDER = new RegExp(SPRACHEN.map(sp => SP[sp].lange_felder).filter(Boolean).join('|'), 'i');
function textMitTeilen(text, hinweise) {
  return text.split(/(\n[ \t]*\n)/).map((absatz, i) => {
    if (i % 2) return absatz;
    const m = absatz.match(TEIL_ANFANG);
    if (!m) return textHtml(absatz, hinweise);
    return `<mark class="teil teil--${TEILE[m[1]]}"><span class="teil__label">${m[1]}:</span>${textHtml(absatz.slice(m[0].length), hinweise)}</mark>`;
  }).join('');
}
function herkunft(t) {
  const adresse = t.typ === 'technik' ? `${KURZ_BASIS}/${LP()}${t.nr}` : urlTechnik(t);
  return T("Technik aus dem Power Platform Dojo: {0}\nQuelle: Microsoft Learn, Stand {1}", adresse, datumCH(t.geprueft_am));
}
function schmiedeHtml(t, praefixId, ebene = 'h3') {
  const felder = Object.entries(t._felder || {});
  if (!felder.length) return '';
  const profil = felder.some(([n]) => PROFIL_NAMEN.includes(n));
  const lang = LANGE_FELDER;
  const html = felder.map(([name, hinweis], i) => {
    const id = `${praefixId}-f${i + 1}`;
    const breit = lang.test(name) || hinweis.length > 40;
    const feld = breit
      ? `<textarea id="${id}" data-ph-feld="${esc(name)}" rows="4"${hinweis ? ` aria-describedby="${id}-h"` : ''}></textarea>`
      : `<input id="${id}" type="text" data-ph-feld="${esc(name)}" autocomplete="off"${hinweis ? ` aria-describedby="${id}-h"` : ''}>`;
    return `<div class="schmiede__feld${breit ? ' schmiede__feld--breit' : ''}"><label for="${id}">${esc(name)}</label>${feld}${hinweis ? `<small id="${id}-h">${esc(ZB_MUSTER.test(hinweis) ? hinweis : T("z. B. ") + hinweis)}</small>` : ''}</div>`;
  }).join('\n');
  // Eingeklappt (16.10.2026, Dosierung wie powerautomate.ninja): der Prompt steht sofort da, die Felder oeffnet, wer sie braucht
  return `<details class="schmiede-klappe" data-nur-js><summary>${T("Für dich anpassen")}</summary><div class="schmiede">
<div class="schmiede__kopf"><p class="schmiede__hinweis">${T("Nichts verlässt deinen Browser.")}${profil ? T(" Firmenname, Funktion und Branche kommen aus deinem Profil unter Mein Dojo.") : ''}</p></div>
${html}
</div></details>`;
}
function rolleHtml(t, preId, titel, text, mitTeilen, erfolg, knopfText) {
  const inhalt = mitTeilen ? textMitTeilen(text, t._felder) : textHtml(text, t._felder);
  return `<div class="rolle" data-rolle>
<div class="rolle__kopf"><p class="rolle__titel">${esc(titel)}</p></div>
<pre class="code" id="${preId}">${inhalt}</pre>
<div class="rolle__knoepfe"><button type="button" class="knopf knopf--primaer knopf--klein" data-kopieren="${preId}" data-erfolg="${esc(erfolg)}" data-nur-js>${esc(knopfText)}</button><button type="button" class="knopf knopf--klein" data-weitergeben="${preId}" data-herkunft="${esc(herkunft(t)).replace(/\n/g, '&#10;')}" data-nur-js>${T("Weitergeben")}</button><p class="rolle__status" role="status"></p></div>
</div>`;
}
function rollenFuer(t, praefixId) {
  const a = ART[t.art] || ART.pinselstrich;
  const haupt = rolleHtml(t, praefixId, a.rolle, t.technik_text, t.art !== 'kata' || TEIL_START.test(t.technik_text), a.erfolg, a.knopf);
  const zusatz = (t.zusatz_texte || []).map((z, i) => rolleHtml(t, `${praefixId}-${i + 2}`, z.titel || T("Schritt {0}", i + 2), z.text || '', TEIL_START.test(z.text || ''), ART.kata.erfolg, ART.kata.knopf)).join('\n');
  return haupt + (zusatz ? '\n' + zusatz : '');
}
function karte(t, r, mitNutzen = true) {
  const kurzAdresse = t.typ === 'technik' ? `${KURZ_BASIS}/${LP()}${t.nr}` : '';
  const neu = !alleNeu && t.datum_publiziert >= neuGrenze ? ' karte--neu' : '';
  return `<li class="karte${t.typ === 'grundform' ? ' karte--grundform' : ''}${neu}" data-technik="${t.id}" data-guertel-nr="${t.guertel}" data-zugang="${esc(t.zugang || '')}" data-art="${esc(t.art || '')}" data-werkzeug="${esc((t.werkzeug || []).join(' '))}">
<div class="karte__oben"><span class="karte__nr">${t.typ === 'technik' ? pad2(t.nr) : T("Grundform ") + t.id.toUpperCase()}</span>${neu ? `<span class="tag">${T("Neu")}</span>` : ''}</div>
<h3 class="karte__titel"><a href="${r}techniken/${t.slug}/">${esc(t.titel)}</a></h3>
${t.titel !== t.klartitel && t.klartitel ? `<p class="karte__klartitel">${esc(t.klartitel)}</p>` : ''}
${mitNutzen && t.nutzen ? `<p class="karte__nutzen">${esc(t.nutzen)}</p>` : ''}
<div class="karte__meta">${zugangBadge(t, r, true)}${artBadge(t)}<span>${T("ca. {0} Min.", t.dauer_min)}</span><span class="karte__status" data-status hidden></span>${kurzAdresse ? `<span class="karte__kurz nur-druck">${kurzAdresse}</span>` : ''}</div>
</li>`;
}
function kompakt(t, r) {
  return `<li class="karte-kompakt" data-technik="${t.id}" data-guertel-nr="${t.guertel}"><span class="karte-kompakt__nr">${nrLabel(t)}</span><a class="karte-kompakt__link" href="${r}techniken/${t.slug}/">${esc(t.titel)}</a>${t.klartitel && t.klartitel !== t.titel ? `<span class="klein">${esc(t.klartitel)}</span>` : ''}${zugangBadge(t, r, true)}</li>`;
}
let NOCH_NICHT = SP.de.noch_nicht;
// Die Schwelle erscheint nur, wenn im Build Agent-Techniken (ab Gruen) stehen. Sonst folgte dem Kurshinweis nur
// «Noch nicht freigegeben», und der Agent-Teil saehe aus wie hinter dem Kurs versteckt (Konzept 7.2).
const MIT_AGENTS = DABEI.some(t => t.guertel >= 4);
// Kursname laut Academy ab 15.10.2026 (Entscheid Marcel: Disclaimer reicht), URL bleibt copilot-expert. Der Kurs ist deutsch.
const KURS_NAME = 'Copilot Ninja in 4 Wochen';
const kursEigen = () => T("Der Kurs hat einen eigenen Lehrplan und folgt nicht den Gürteln dieser Seite.");
// Kursstatus wie auf der Kursseite der Academy (17.10.2026: «Auf die Warteliste», «Neue Termine folgen in Kürze»). Steuert jede
// Kurszeile (Technik-Seiten, Vier Wochen, Schwelle, Gürtelprüfung, Mein Dojo). Sobald Termine buchbar sind: 'termine'.
// Gleiche Regel in powerautomate.ninja (site.config.json, kurs_status).
const KURS_STATUS = 'warteliste';
const kursStatusSatz = () => KURS_STATUS === 'warteliste'
  ? T("Die nächsten Termine stehen noch nicht fest, auf der Kursseite setzt du dich auf die Warteliste.")
  : T("Termine und Anmeldung findest du auf der Kursseite.");
// Kurszeile der gemeinsamen Dojo-Vorlage (UX-Review 17.10.2026, Q12): gleicher Satzbau wie powerautomate.ninja, Link mit Kursnamen
function kursZeile(stelle) {
  const link = `<a href="${esc(KURS_URL(stelle))}" rel="noopener">${T("Live-Kurs «{0}»", KURS_NAME)}</a>`;
  return `<p class="kurs-zeile" data-kurs-status="${KURS_STATUS}">${T("Lieber mit Begleitung weiter? Der {0} der Power Platform Academy läuft über vier Wochen. ", link)}${kursStatusSatz()}</p>`;
}
function schwelleHtml(ebene = 'h3', extra = '') {
  if (!MIT_AGENTS) return '';
  return `<aside class="schwelle${extra}" aria-labelledby="schwelle-titel">
<span class="label">${T('Die Schwelle')}</span>
<${ebene} id="schwelle-titel">${T('Ab hier baust du Agents.')}</${ebene}>
<p>${T('In der Testversion von Copilot Studio kannst du einen Agent erstellen und im Testchat prüfen, aber nicht veröffentlichen. Veröffentlichen geht mit Kapazität (Credits oder Pay-as-you-go) und Autorenberechtigung. ({0}, Stand {1}). Alle Agent-Techniken stehen hier frei, ohne Anmeldung.', `<a href="${learn(LEARN_TESTVERSION)}" rel="noopener">Microsoft Learn</a>`, datumCH('2026-10-13'))}</p>
<p class="klein">${T('Wer lieber mit Begleitung übt: Die Power Platform Academy führt den {0}.', `<a href="${esc(KURS_URL('schwelle'))}" rel="noopener">${T('Live-Kurs «{0}»', KURS_NAME)}</a>`)} ${kursEigen()} ${kursStatusSatz()}</p>
</aside>`;
}
// Startseite: Guertelpfad als sieben Zeilen (Review 15.10.2026, Kapitel 5): Farbe, Name, Anzahl, ein Beispiel.
// Die Schwelle ist nur eine Markierung zwischen Orange und Gruen. Die volle Liste steht auf /techniken/.
function guertelpfadHtml(r) {
  const zeile = (g) => {
    const drin = sortiert.filter(t => t.guertel === g.nr);
    const tk = drin.filter(t => t.typ === 'technik');
    const anzahl = tk.length ? (tk.length === 1 ? T("{0} Technik", 1) : T("{0} Techniken", tk.length)) : (drin.length === 1 ? T("{0} Grundform", 1) : T("{0} Grundformen", drin.length));
    // Wie powerautomate.ninja (16.10.2026): Name mit Leitwort, Anzahl, ein Satz, was du danach kannst
    return `<li class="pfadzeile" data-guertel-nr="${g.nr}" id="pfad-${g.farbe}"><span class="pfadzeile__band" aria-hidden="true"></span><a class="pfadzeile__name" href="${r}techniken/#${g.anker}">${esc(g.name)}${g.leitwort ? ': ' + esc(g.leitwort) : ''}</a><span class="pfadzeile__zahl">${drin.length ? anzahl : T("offen")}</span>${g.kannst_du ? `<p class="pfadzeile__kann">${T("Was du danach kannst:")} ${esc(g.kannst_du)}</p>` : ''}<p class="fortschritt__text pfadzeile__stand" data-fortschritt="${g.nr}" hidden></p></li>`;
  };
  const marke = MIT_AGENTS ? T("<p class=\"pfadzeilen__schwelle\"><strong>Die Schwelle.</strong> Ab hier baust du Agents. Die <a href=\"{0}\" rel=\"noopener\">Testversion von Copilot Studio</a> reicht zum Üben.</p>\n", learn(LEARN_TESTVERSION)) : '';
  return `<ol class="pfadzeilen">${GUERTEL.slice(0, 3).map(zeile).join('\n')}</ol>
${marke}<ol class="pfadzeilen" start="4">${GUERTEL.slice(3).map(zeile).join('\n')}</ol>`;
}
function vierWochenHtml(r, ebene) {
  const sub = ebene === 'h1' ? 'h2' : ebene === 'h2' ? 'h3' : 'h4';
  let fehltWoche = false;
  const wochen = WOCHEN.map(w => {
    const liste = w.ergebnisse.filter(([id]) => NACH_ID[id]).map(([id, text]) => { const t = NACH_ID[id]; return `<li>${esc(text)} (<a href="${r}techniken/${t.slug}/">${T("Nr.")} ${t.nr} ${esc(t.titel)}</a>)</li>`; });
    if (!liste.length) fehltWoche = true;
    return `<li class="woche"><span class="woche__nr" aria-hidden="true">${w.nr}</span>
<${sub}>${T("Woche")} ${w.nr}</${sub}>
<div class="woche__guertel">${w.guertel.map(n => knoten(n, GUERTEL[n - 1].kurz)).join('')}</div>
${liste.length ? `<p>${T("Wenn du die Techniken dieser Woche übst, hast du danach in der Hand:")}</p><ul class="woche__ergebnis">${liste.join('')}</ul>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
</li>`;
  }).join('\n');
  // Eigene ID (vorher doppelt «h-pfad» auf der Startseite). Der Kalenderknopf steht im HTML, damit beim Laden nichts springt.
  return `<div class="vier-wochen" id="vier-wochen">
<span class="label">${T('Vier-Wochen-Pfad zum Selbstlernen')}</span>
<${ebene} id="h-vier-wochen"${ebene === 'h3' ? ' class="h2-gross"' : ''}>${T('In vier Wochen durch alle Gürtel')}</${ebene}>
<p class="lead">${T('Ein freier Plan für {0} Grundformen und {1} Techniken. Jede Woche ein oder zwei Gürtel, ohne Anmeldung.', GRUNDFORMEN.length, ANZAHL)}</p>
<ol class="wochen">${wochen}</ol>
${fehltWoche ? '' : `<p class="pfad-schluss">${T('Nach vier Wochen hast du einen eigenen Agent mit Testfragen, Schutzbaustein, Credit-Schätzung und Betriebsblatt.')}</p>`}
<p class="klein">${T('Was du dafür brauchst, zeigt der Zugang auf jeder Technik.')}</p>
<p class="knopf-reihe nicht-drucken"><button type="button" class="knopf" data-wochen-ics data-nur-js>${T('Vier Wochen in den Kalender, ab nächstem Montag')}</button></p>
${kursZeile('vier-wochen')}
</div>`;
}
// Startseite: Rotation nur ueber Techniken ohne Zusatzlizenz vom weissen bis zum orangen Guertel (Review 15.10.2026, H6).
// Gleiche Regel in dojo.js (heuteKompakt). /heute/ nutzt dieselbe Rotation (369).
const FUER_START = (t) => t && t.zugang === 'ohne-zl' && t.guertel <= 3;
function heuteTechnik(nurStart = false) {
  const folge = (daten.tag_reihenfolge || []).filter(id => NACH_ID[id] && NACH_ID[id].typ === 'technik' && (!nurStart || FUER_START(NACH_ID[id])));
  if (!folge.length) return null;
  const start = istIso(daten.tag_start) ? daten.tag_start : DATUM;
  const n = ((tageZwischen(start, DATUM) % folge.length) + folge.length) % folge.length;
  return NACH_ID[folge[n]];
}
function heuteHtml(t, r, ebene) {
  if (!t) return `<div class="naechster"><p>${NOCH_NICHT}</p><p><a href="${r}techniken/">${T("Zur Technik-Wand")}</a></p></div>`;
  return `<article class="karte--gross rolle-gross" data-technik="${t.id}" data-guertel-nr="${t.guertel}" data-schmiede>
<div class="heute__kopf"><span class="heute__nr" aria-hidden="true">${pad2(t.nr)}</span><div>
<${ebene} class="heute__titel">${esc(t.titel)}<small>${T("Nr.")} ${t.nr}: ${esc(t.klartitel)}</small></${ebene}>
<ul class="metazeile"><li>${knoten(t.guertel, gName(t.guertel))}</li><li>${zugangBadge(t, r)}</li><li><span>${T("Ausprobieren: ca. {0} Min.", t.dauer_min)}</span></li></ul>
</div></div>
<p class="abschnitt__problem">${esc(t.problem)}</p>
${schmiedeHtml(t, 'heute', ebene === 'h2' ? 'h3' : 'h4')}
${rolleHtml(t, 'heute-text', (ART[t.art] || ART.pinselstrich).rolle, t.technik_text, true, (ART[t.art] || ART.pinselstrich).erfolg, (ART[t.art] || ART.pinselstrich).knopf)}
<p><a class="knopf knopf--leise" href="${r}techniken/${t.slug}/">${T("Ganze Technik mit Anleitung, Grenzen und Quelle")}</a></p>
</article>`;
}
// Kompakte Karte der Technik des Tages auf der Startseite, ohne Formular. dojo.js tauscht die Felder nach lokalem Datum.
function heuteKompaktHtml(t) {
  if (!t) return `<p>${NOCH_NICHT}</p>`;
  return `<article class="tdk" data-heute-kompakt data-technik="${t.id}" data-guertel-nr="${t.guertel}">
<div class="tdk__inhalt">
<h3 class="tdk__titel"><a href="techniken/${t.slug}/">${esc(t.titel)}</a><small>${esc(t.klartitel)}</small></h3>
<ul class="metazeile"><li>${knoten(t.guertel, gName(t.guertel))}</li><li>${zugangBadge(t, '', true)}</li><li class="tk__nr">${T("Nr.")} <span class="tdk__nr">${pad2(t.nr)}</span></li></ul>
<p class="tdk__problem">${esc(t.problem)}</p>
<p><a class="knopf knopf--primaer knopf--klein tdk__knopf" href="techniken/${t.slug}/">${T("Technik öffnen")}</a></p>
</div>
</article>`;
}
function filterHtml() {
  const werkzeuge = [...new Set(DABEI.flatMap(t => t.werkzeug || []))].filter(w => PRODUKTNAMEN[w]);
  const zugaenge = Object.keys(ZUGANG).filter(z => DABEI.some(t => t.zugang === z));
  const arten = Object.keys(ART).filter(a => DABEI.some(t => t.art === a));
  const chip = (f, v, text, k = '') => `<button type="button" class="chip" data-f="${f}" data-v="${esc(v)}" aria-pressed="false">${k}${esc(text)}</button>`;
  return `<div class="filter nicht-drucken" data-filter data-nur-js>
<fieldset><legend>${T("Gürtel")}</legend><div class="chips">${GUERTEL.map(g => chip('guertel-nr', g.nr, g.kurz, `<span class="knoten" data-guertel-nr="${g.nr}" aria-hidden="true"></span>`)).join('')}</div></fieldset>
<fieldset><legend>${T("Werkzeug")}</legend><div class="chips">${werkzeuge.map(w => chip('werkzeug', w, PRODUKTNAMEN[w])).join('')}</div></fieldset>
<fieldset><legend>${T("Zugang")}</legend><div class="chips">${zugaenge.map(z => chip('zugang', z, ZUGANG[z].kurz)).join('')}</div></fieldset>
<fieldset><legend>${T("Dein Stand")}</legend><div class="chips">${chip('stand', 'offen', T("Noch offen"))}${chip('stand', 'geuebt', T("Geübt"))}</div></fieldset>
<div class="filter__fuss"><p class="filter__zaehler" data-filter-zaehler role="status" aria-live="polite"></p><button type="button" class="knopf knopf--leise knopf--klein" data-filter-reset>${T("Filter zurücksetzen")}</button></div>
</div>`;
}
function wandAbschnitte(r) {
  return GUERTEL.map(g => {
    const gf = GRUNDFORMEN.filter(t => t.guertel === g.nr), tk = TECHNIKEN.filter(t => t.guertel === g.nr);
    const teil = `<section class="guertel-abschnitt sektion--eng" id="${g.anker}" aria-labelledby="h-${g.anker}" data-guertel-nr="${g.nr}">
<h2 id="h-${g.anker}">${knoten(g.nr, g.name + (g.leitwort ? ': ' + g.leitwort : ''), ' knoten--gross')}</h2>
${g.kannst_du ? `<p class="klein">${T("Was du danach kannst:")} ${esc(g.kannst_du)}</p>` : ''}
${gf.length ? `<p class="label">${T("Aufwärmen")}</p><ul class="karten">${gf.map(t => karte(t, r, false)).join('\n')}</ul>` : ''}
${tk.length ? `${gf.length ? `<p class="label">${T("Techniken")}</p>` : ''}<ul class="karten">${tk.map(t => karte(t, r, false)).join('\n')}</ul>` : (gf.length ? '' : `<p class="pfad__offen">${NOCH_NICHT}</p>`)}
</section>`;
    return g.nr === 3 ? teil + '\n' + schwelleHtml('h2', ' schwelle--frei') : teil;
  }).join('\n');
}
function rechnerHtml(t) {
  const r = t.rechner; if (!r) return '';
  const b = r.beispiel || {};
  const rate = (k) => ((r.raten || []).find(x => x.schluessel === k) || {}).credits || 0;
  const jeGespraech = (b.generativ || 0) * rate('generativ') + (b.aktion || 0) * rate('aktion');
  const summe = (b.gespraeche || 0) * jeGespraech;
  const quellen = [{ url: r.quelle_url, titel: r.quelle_titel }, ...(r.weitere_quellen || [])].map(q => `<a href="${esc(q.url)}" rel="noopener">${esc(q.titel)}</a>`).join(', ');
  return `    <section class="abschnitt" aria-labelledby="h-rechner">
      <h2 id="h-rechner">${T('Der Kompass')}</h2>
      <div class="rechner" data-kompass data-raten="${esc(JSON.stringify(r))}">
        <p>${T('Raten laut Microsoft in {0}: {1}.', esc(r.einheit || 'Copilot Credits'), (r.raten || []).map(x => `${esc(x.name)} ${x.credits}`).join(', '))}</p>
        <p>${T('Rechenbeispiel: {0} Gespräche im Monat mit je {1} Generative Answers und {2} Agent Action ergeben {0} mal {3}, also {4} Copilot Credits.', b.gespraeche, b.generativ, b.aktion, jeGespraech, `<span class="rechner__ergebnis">${summe.toLocaleString(SP[L].zahl_locale)}</span>`)} ${esc(b.hinweis || '')}</p>
        <ul class="arrow-list">${(r.regeln || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${r.lizenz_hinweis ? `<p>${esc(r.lizenz_hinweis)}</p>` : ''}
        <p class="klein">${T('Quelle: {0}, Stand {1}. Kein Preis pro Credit, Preise findest du bei Microsoft.', quellen, datumCH(r.geprueft_am))}</p>
      </div>
    </section>
`;
}

/* Seitenrahmen */
const MARKEN = (() => {
  const texte = [];
  for (const d of ['gratis/index.html', 'gratis/nachschlagen/index.html', 'ueber/index.html']) if (gibtEs(d)) texte.push(lies(d));
  texte.push(JSON.stringify(DABEI));
  const alles = texte.join('\n');
  const dazu = MARKEN_KANDIDATEN.filter(m => alles.includes(m));
  return [...new Set([...MARKEN_BASIS, ...dazu])].sort((a, b) => a.localeCompare(b, 'de'));
})();
function markenText() { return MARKEN.slice(0, -1).join(', ') + T(" und ") + MARKEN[MARKEN.length - 1]; }
// Hauptpunkte wie powerautomate.ninja (16.10.2026): Techniken, Gürtelprüfung, Lizenz-Check, Mein Dojo
const NAV_ZIEL = { wand: 'techniken', technik: 'techniken', heute: 'techniken', wochen: 'techniken', pruefung: 'pruefung', test: 'pruefung', gratis: 'gratis', dojo: 'dojo', profil: 'dojo', guertel: 'dojo' };
// Pfad einer Seite relativ zur Sprachwurzel: 'fr/techniken/x/index.html' und 'techniken/x/index.html' ergeben 'techniken/x/'
const SPRACH_PRAEFIX = new RegExp(`^(${SPRACHEN.filter(x => x !== 'de').join('|')})/`);
function seitenPfad(rel) { return rel.replace(SPRACH_PRAEFIX, '').replace(/index\.html$/, '').replace(/^404\.html$/, ''); }
// ra: Weg zur Wurzel (Assets, gemeinsam), r: Weg zur Sprachwurzel (Seiten). Auf Deutsch sind beide gleich.
function wege(rel, absolut) {
  if (absolut) { const b = new URL(BASE_URL).pathname; return { ra: b, r: b + LP() }; }
  const ra = praefix(rel);
  return { ra, r: istDE() ? ra : ra.slice(3) };
}
// Sprachwahl mit allen Sprachen (14.11.2026): aufklappbare Liste, jede Sprache verlinkt auf die Entsprechung dieser Seite.
// Reihenfolge wie powerplatformdojo.com (DE, FR, IT, EN). hreflang je Sprache, x-default ist Deutsch.
function sprachKontext(rel, absolut, mitAlternates) {
  const pfad = absolut ? '' : seitenPfad(rel);
  const { ra } = wege(rel, absolut);
  const eintraege = ANZEIGE.map(sp => {
    const href = `${ra}${SP[sp].pfad}${pfad}` || './';
    return `<li><a href="${href}" hreflang="${sp}" lang="${SP[sp].html_lang}" data-sprache-wahl="${sp}"${sp === L ? ' aria-current="true"' : ''}><span class="sprachen__kurz" aria-hidden="true">${SP[sp].kurz}</span> ${SP[sp].name}</a></li>`;
  }).join('');
  const link = `<details class="sprachen" data-sprachen><summary class="sprachwahl" aria-label="${esc(T('Sprache wählen, aktuell: {0}', SP[L].name))}">${SP[L].kurz}</summary><ul class="sprachen__liste">${eintraege}</ul></details>`;
  const alternates = mitAlternates ? [...SPRACHEN.map(sp => `<link rel="alternate" hreflang="${sp}" href="${BASE_URL}${SP[sp].pfad}${pfad}">`), `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${pfad}">`].join('\n') + '\n' : '';
  return { sprachwahl: link, alternates };
}
function rahmenKontext(rel, seite, extra = {}, absolut = false) {
  const { r, ra } = wege(rel, absolut);
  const ziel = NAV_ZIEL[seite];
  const unterseite = /(nachschlagen|fragen)\/index\.html$/.test(rel);
  const cur = (n) => ziel === n ? (/^(wand|pruefung|gratis|dojo)$/.test(seite) && !unterseite ? ' aria-current="page"' : ' aria-current="true"') : '';
  const cssExtra = seite === 'gratis' ? `<link rel="stylesheet" href="${ra}assets/css/gratis.css">\n` : /^(dojo|test|guertel|pruefung|profil)$/.test(seite) ? `<link rel="stylesheet" href="${ra}assets/css/dojo.css">\n` : seite === 'technik' ? `<link rel="stylesheet" href="${ra}assets/css/technik.css">\n` : '';
  // Sprachweiche nur auf der deutschen Startseite und auf 404 (nur im Browser, Suchmaschinen sehen keine Weiterleitung)
  const weiche = (istDE() && seite === 'start') || seite === '404' ? `<script src="${ra}assets/js/sprache.js" data-sprachen="${SPRACHEN.filter(x => x !== 'de').join(' ')}"></script>\n` : '';
  // Texte der Skripte in der Sprache der Seite (assets/js/texte/<code>.js, erzeugt aus data/sprachen/<code>.json, Feld js), vor core.js
  const texteJs = istDE() ? '' : `<script src="${ra}assets/js/texte/${L}.js" defer></script>\n`;
  return {
    r, ra, feed_titel: T("{0}: neue Techniken", SITE_VOLL), css_extra: cssExtra, js_extra: '', vorschau_banner: '', sprach_weiche: weiche, texte_js: texteJs,
    ...sprachKontext(rel, absolut, seite !== '404'),
    tusch_marke: tusch('ruhe'), tusch_fuss: tusch('ruhe'), wortmarke: wortmarke(),
    icon_suche: ICONS.suche, icon_zufall: ICONS.zufall, icon_sonne: ICONS.sonne, icon_mond: ICONS.mond, icon_menue: ICONS.menue, icon_zu: ICONS.zu,
    cur_techniken: cur('techniken'), cur_pruefung: cur('pruefung'), cur_gratis: cur('gratis'), cur_dojo: cur('dojo'),
    mailto_beitrag: mailtoBeitrag, markenliste: markenText(),
    newsletter_footer: NEWSLETTER_URL('footer'), academy_footer: ACADEMY_URL('footer'), academy_dojo: ACADEMY_DOJO_URL('footer'),
    kurs_vorlage: `<template data-kurs-vorlage>${kursZeile('vorlage')}</template>`,
    ...extra
  };
}
const HTML_LANG = () => SP[L].html_lang;
function metaHtml(p) {
  const zeilen = [GENERATOR, `<title>${esc(p.titel)}</title>`, `<meta name="description" content="${esc(p.beschreibung)}">`];
  if (p.noindex) zeilen.push('<meta name="robots" content="noindex">');
  if (p.canonical) zeilen.push(`<link rel="canonical" href="${p.canonical}">`);
  const bild = p.ogBild || `${BASE_URL}${istDE() ? 'og-image.png' : `og-image-${L}.png`}`;
  zeilen.push(
    `<meta property="og:type" content="${p.ogTyp || 'website'}">`, '<meta property="og:site_name" content="Power Platform Dojo · Copilot">', `<meta property="og:locale" content="${SP[L].og_locale}">`,
    `<meta property="og:title" content="${esc(p.ogTitel || p.titel)}">`, `<meta property="og:description" content="${esc(p.ogBeschreibung || p.beschreibung)}">`);
  if (p.canonical) zeilen.push(`<meta property="og:url" content="${p.canonical}">`);
  zeilen.push(`<meta property="og:image" content="${bild}">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(p.ogAlt || T("Power Platform Dojo: Übung schlägt Hype."))}">`, '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(p.ogTitel || p.titel)}">`, `<meta name="twitter:description" content="${esc(p.ogBeschreibung || p.beschreibung)}">`, `<meta name="twitter:image" content="${bild}">`);
  if (p.jsonld) zeilen.push(jsonLd({ '@context': 'https://schema.org', '@graph': p.jsonld }));
  return zeilen.join('\n');
}
const ldWebsite = () => ({ '@type': 'WebSite', '@id': `${BASE_L}#website`, name: SITE_VOLL, alternateName: SITE_NAME, url: BASE_L, inLanguage: HTML_LANG(), description: T("Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio mit Quelle und Prüfdatum. Unabhängige Website ohne Verbindung zu Microsoft."), publisher: { '@id': 'https://kmupower.com/#organization' } });
const LD_ORG = { '@type': 'Organization', '@id': 'https://kmupower.com/#organization', name: 'KMUpower', legalName: 'Marcel Lehmann (Handelsname KMUpower)', url: 'https://kmupower.com/', founder: { '@type': 'Person', name: 'Marcel Lehmann' } };
const LD_AUTOR = { '@type': 'Person', name: 'Marcel Lehmann', url: 'https://kmupower.com/', worksFor: { '@id': 'https://kmupower.com/#organization' } };
function ldKrumen(teile) { return { '@type': 'BreadcrumbList', itemListElement: teile.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) }; }
function seite(rel, p) {
  // 404 liegt in jeder Tiefe: Pfade ab der Wurzel der Basis. Volle URLs waeren auf einer eigenen Domain fremde Herkunft (CSP «self»)
  rel = LP() + rel;
  const ctx = rahmenKontext(rel, p.seite, p.ctx || {}, !!p.absolut);
  if (p.banner && !TESTPHASE) ctx.vorschau_banner = `<p class="vorschau-banner">${T("Interne Vorschau, nicht veröffentlichen.")}</p>\n`;
  if (p.jsExtra) ctx.js_extra = p.jsExtra.map(s => `<script src="${ctx.ra}${s}" defer></script>\n`).join('');
  const kopf = render(partial('head'), ctx, 'head');
  const haupt = render(vorlage(p.template), { ...ctx, ...p.daten }, p.template);
  const html = `<!doctype html>
<html lang="${HTML_LANG()}" data-seite="${p.seite}">
<head>
<meta charset="utf-8">
<!-- RAHMEN:HEAD -->
${kopf}
<!-- /RAHMEN:HEAD -->
${metaHtml({ ...p, noindex: TESTPHASE || p.noindex || (p.banner && MODUS !== 'produktion') })}${TESTPHASE ? '\n<meta name="dojo-build" content="testphase">' : ''}
</head>
<body>
<!-- RAHMEN:KOPF -->
${render(partial('kopf'), ctx, 'kopf')}
<!-- /RAHMEN:KOPF -->
${haupt.trim()}
<!-- RAHMEN:FUSS -->
${render(partial('fuss'), ctx, 'fuss')}
<!-- /RAHMEN:FUSS -->
</body>
</html>
`;
  schreibe(rel, html);
}
/* Seiten erzeugen. Jede Funktion baut die Seite in der Sprache des laufenden Durchgangs (seite() setzt <code>/ davor). */
function baueStart() {
  const heute = heuteTechnik(true);
  // Zahl aus den Daten (Review 15.10.2026, H4): Agent Builder zaehlt mit, weil er ohne Zusatzlizenz laeuft
  const ohneZl = TECHNIKEN.filter(t => t.zugang === 'ohne-zl' || t.zugang === 'agent-builder').length;
  // Startseite wie powerautomate.ninja (16.10.2026): Bilanz als eine Zeile unter Frage 1 des Lizenz-Checks.
  // Der Schnitt (Vorher/Nachher), die vier Momente und der Trainer-Block sind auf /techniken/ bzw. /ueber/ umgezogen.
  const bilanz = TECHNIKEN.length
    ? `      <p class="klein">${ohneZl === TECHNIKEN.length ? T('Alle {0} Techniken laufen ohne Zusatzlizenz, wenn dein Abo Microsoft Copilot Chat enthält.', ohneZl) : T('{0} von {1} Techniken laufen ohne Zusatzlizenz, wenn dein Abo Microsoft Copilot Chat enthält.', ohneZl, TECHNIKEN.length)} <a href="techniken/?zugang=ohne-zl&amp;zugang=agent-builder">${T('Alle Techniken ohne Zusatzlizenz zeigen')}</a></p>`
    : T("      <p class=\"klein\">Viele Techniken laufen in Microsoft Copilot Chat. Ob Copilot Chat in deinem Abo ohne Zusatzlizenz enthalten ist, zeigt der Lizenz-Check.</p>");
  const auf = [heute, ...TECHNIKEN];
  seite('index.html', {
    seite: 'start', template: 'start.html',
    titel: T("Copilot Chat und Studio: Techniken | Copilot Dojo"),
    beschreibung: T("Welcher Copilot-Gürtel bist du? {0} Grundformen und {1} Techniken für Copilot Chat und Studio, mit Quellen. Dazu Gürtelprüfung und Lizenz-Check.", GRUNDFORMEN.length, ANZAHL),
    ogTitel: T("Power Platform Dojo: Übung schlägt Hype."),
    canonical: BASE_L, banner: ohneFreigabe(auf.filter(Boolean)),
    jsonld: [ldWebsite(), LD_ORG],
    daten: {
      anzahl: ANZAHL,
      band: GUERTEL.map(g => `<span data-guertel-nr="${g.nr}"></span>`).join(''),
      tusch_hero: tusch('ruhe', 'tusch--zeichnen'), tusch_zeigen: tusch('zeigen'),
      heute_karte: heuteKompaktHtml(heute),
      guertelpfad: guertelpfadHtml(''), bilanz,
      kurs_trainer: KURS_URL('start')
    }
  });
}
function baueWand() {
  const r = '../';
  const krumen = ldKrumen([[T("Start"), BASE_L], [T("Techniken"), `${BASE_L}techniken/`]]);
  seite('techniken/index.html', {
    seite: 'wand', template: 'wand.html',
    titel: T("Copilot Chat und Studio: alle Techniken | Copilot Dojo"),
    beschreibung: T("{0} Grundformen und {1} Techniken für Copilot Chat und Studio, nach Gürtel geordnet. Mit Quellen und Prüfdatum.", GRUNDFORMEN.length, ANZAHL),
    canonical: `${BASE_L}techniken/`, banner: ohneFreigabe(DABEI),
    jsonld: [ldWebsite(), LD_ORG, { '@type': 'CollectionPage', '@id': `${BASE_L}techniken/#seite`, name: T("{0} Grundformen und {1} Techniken für Copilot Chat und Studio", GRUNDFORMEN.length, ANZAHL), url: `${BASE_L}techniken/`, inLanguage: HTML_LANG(), isPartOf: { '@id': `${BASE_L}#website` }, mainEntity: { '@type': 'ItemList', itemListElement: sortiert.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: urlTechnik(t), name: `${t.titel}: ${t.klartitel}` })) } }, krumen],
    daten: {
      anzahl: ANZAHL, anzahl_grundformen: (GRUNDFORMEN.length || 5) === 1 ? T("eine Grundform") : T("{0} Grundformen", GRUNDFORMEN.length || 5), stand_ch: datumCH(STAND), kurz_basis: KURZ_BASIS + (istDE() ? '' : '/' + L),
      filter: filterHtml(), abschnitte: wandAbschnitte(r), tusch_sitzen: tusch('sitzen'),
      // Die vier Momente der frueheren Startseite stehen seit 16.10.2026 hier als kurze Liste
      momente: (() => { const m = MOMENTE.filter(([id]) => NACH_ID[id]).map(([id, satz]) => { const t = NACH_ID[id]; return `<li><q>${esc(satz)}</q><a href="${r}techniken/${t.slug}/">${T("Technik")} ${pad2(t.nr)}, ${esc(t.titel)}</a></li>`; }); return m.length ? `      <p class="label">${T("Wann brauchst du es?")}</p>\n      <ul class="momente-kurz">${m.join('')}</ul>` : ''; })()
    }
  });
}
function technikTitel(t) {
return `${(SP[L].titel_kurz || {})[t.id] || t.klartitel} | Copilot Dojo`;
}

function baueTechnik(t, i) {
  const r = '../../';
  const ra = r + (istDE() ? '' : '../');
  const a = ART[t.art] || ART.pinselstrich;
  const g = GUERTEL[t.guertel - 1];
  const produkt = PRODUKTNAMEN[(t.werkzeug || [])[0]] || 'Microsoft Copilot Chat';
  const titel = technikTitel(t);
  const satz = T("{0} für {1} zum Kopieren, mit Quelle bei Microsoft Learn und Prüfdatum.", a.wort, produkt);
  let beschreibung = `${t.klartitel}. ${satz}${t.moment ? ' ' + t.moment.replace(/[.!?]?$/, '.') : ''}`;
  if (beschreibung.length > 160) beschreibung = `${t.klartitel}. ${satz}`;
  if (beschreibung.length > 165) beschreibung = `${t.klartitel}. ${T("Mit Prompt, Anleitung, Grenzen und Quelle bei Microsoft Learn.")}`;
  const vor = sortiert[i - 1], nach = sortiert[i + 1];
  // Karten je Sprache: assets/img/karten/<slug>.png (deutsch) und assets/img/karten/en/<slug>.png
  const kartenBild = `assets/img/karten/${LP()}${t.slug}.png`;
  const bildDa = gibtEs(kartenBild);
  if (!bildDa) warnung(`${t.id}: Vorschaubild ${kartenBild} fehlt (DOJO, karten.mjs), Seite nutzt og-image.png`);
  const liste = (ids) => (ids || []).map(id => NACH_ID[id]).filter(Boolean);
  const kommt = liste(t.kommt_aus), weiter = liste(t.weiter_mit);
  const kette = (kommt.length || weiter.length) ? `    <section class="abschnitt" aria-labelledby="h-kette">
      <h2 id="h-kette">${t.kombo ? T("Kombo: ") + esc(t.kombo) : T("Kombo")}</h2>
      <div class="kette">
        ${kommt.length ? `<div><p class="label">${T("Kommt aus")}</p><ul class="pfad__liste">${kommt.map(x => kompakt(x, r)).join('')}</ul></div>` : ''}
        ${weiter.length ? `<div><p class="label">${T("Weiter mit")}</p><ul class="pfad__liste">${weiter.map(x => kompakt(x, r)).join('')}</ul></div>` : ''}
      </div>
    </section>
` : t.kombo ? `    <p class="klein">${T("Gehört zur Kombo «{0}».", esc(t.kombo))}</p>
` : '';
  // Eine dezente Kurszeile auf jeder Technik-Seite, seit UX-Review 17.10.2026 (Q12) unter «Nächste Technik», kein Banner
  const kurs = kursZeile(t.typ === 'technik' ? 'technik-' + t.nr : 'technik-' + t.id);
  const alleQuellen = [{ url: t.quelle_url, titel: t.quelle_titel }, ...(t.weitere_quellen || [])];
  const blaettern = [vor ? `<a href="${r}techniken/${vor.slug}/" rel="prev"><span>${T("Vorherige Technik")}</span>${nrLabel(vor)} ${esc(vor.titel)}</a>` : `<a href="${r}techniken/"><span>${T("Zurück")}</span>${T("Zur Technik-Wand")}</a>`,
    nach ? `<a href="${r}techniken/${nach.slug}/" rel="next"><span>${T("Nächste Technik")}</span>${nrLabel(nach)} ${esc(nach.titel)}</a>` : `<a href="${r}techniken/"><span>${T("Geschafft")}</span>${T("Zur Technik-Wand")}</a>`].join('\n');
  const url = urlTechnik(t);
  seite(`techniken/${t.slug}/index.html`, {
    seite: 'technik', template: 'technik.html', titel, beschreibung,
    ogTitel: `${t.titel}: ${t.klartitel}`, ogBeschreibung: t.nutzen && t.nutzen.length <= 165 ? t.nutzen : beschreibung, ogTyp: 'article',
    ogBild: bildDa ? `${BASE_URL}${kartenBild}` : null, ogAlt: `${t.typ === 'technik' ? T("Technik ") + pad2(t.nr) : T("Grundform")}: ${t.titel}`,
    canonical: url, banner: VORSCHAU && !istFrei(t),
    jsExtra: t.rechner ? ['assets/js/kompass.js'] : null,
    jsonld: [ldWebsite(), LD_ORG, {
      '@type': 'TechArticle', '@id': `${url}#technik`, headline: `${t.titel}: ${t.klartitel}`, name: t.titel, url, inLanguage: HTML_LANG(),
      description: t.nutzen || beschreibung, author: LD_AUTOR, publisher: { '@id': 'https://kmupower.com/#organization' },
      datePublished: t.datum_publiziert || t.geprueft_am, dateModified: t.geprueft_am,
      citation: [t.quelle_url, ...(t.weitere_quellen || []).map(q => q.url)], isPartOf: { '@id': `${BASE_L}techniken/#seite` }
    }, ldKrumen([[T("Start"), BASE_L], [T("Techniken"), `${BASE_L}techniken/`], [t.titel, url]])],
    daten: {
      id: t.id, guertel: t.guertel, guertel_name: g.name, guertel_anker: g.anker,
      nr_label: t.typ === 'technik' ? `${T("Nr.")} ${pad2(t.nr)}` : `${T("Grundform")} ${t.id.toUpperCase()}`,
      nr_gross: t.typ === 'technik' ? pad2(t.nr) : `${T("Grundform")} ${t.id.toUpperCase()}`, nr_klasse: t.typ === 'technik' ? '' : ' tk__nr--wort',
      titel: t.titel, klartitel: t.klartitel || '', moment: t.moment || '', problem: t.problem, dauer_min: t.dauer_min,
      art_badge: artBadge(t), zugang_badge: zugangBadge(t, r), zugang_text: t.zugang_text || (ZUGANG[t.zugang] || {}).kurz || '',
      schnitt_zeile: t.vorher ? `      <div class="schnitt schnitt--zeile" data-schnitt><p class="label">${T("Vorher")}</p><div class="schnitt__vorher"><p class="schnitt__zitat">${T("«")}${esc(t.vorher)}${T("»")}</p><svg class="schnitt__strich" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 13C30 9 66 7 99 8"/></svg></div></div>` : '',
      schmiede: schmiedeHtml(t, 'technik'), rollen: rollenFuer(t, 'prompt'), rechner: rechnerHtml(t),
      so_nutzt: (t.so_nutzt_du_es || []).map(s => `<li>${esc(s)}</li>`).join(''),
      erwarten: (t.das_darfst_du_erwarten || []).map(s => `<li>${esc(s)}</li>`).join(''),
      probe: t.probe ? `    <section class="abschnitt" aria-labelledby="h-probe">
      <h2 id="h-probe">${T("Die Probe")}</h2>
      <p class="probe">${esc(t.probe)}</p>
    </section>
` : '',
      grenzen: (t.grenzen || []).map(s => `<li>${esc(s)}</li>`).join(''),
      meister: t.meister_variante ? `    <section class="abschnitt" aria-labelledby="h-meister"><h2 id="h-meister">${T("Meister-Variante")}</h2><details class="einklapp" data-meister><summary>${T("Verschärfung anzeigen")}</summary><pre class="code">${textHtml(t.meister_variante, t._felder)}</pre></details></section>
` : '',
      praxis: t.praxis_notiz ? `    <section class="abschnitt" aria-labelledby="h-praxis"><h2 id="h-praxis">${T("Aus der Praxis")}</h2><p class="praxis">${esc(t.praxis_notiz)}</p></section>
` : '',
      // Quellen als eine Zeile (Review 15.10.2026, H1): Links zu Microsoft Learn und «Stand». Kein Pruefstempel, kein Termin.
      quellen: `${alleQuellen.some(q => q.url.startsWith('https://learn.microsoft.com/')) && !alleQuellen.some(q => /^Microsoft Learn/.test(q.titel)) ? 'Microsoft Learn: ' : ''}${alleQuellen.map(q => `<a href="${esc(q.url)}" rel="noopener">${esc(q.titel)}</a>`).join(', ')}. ${T("Stand")} <time datetime="${t.geprueft_am}">${datumCH(t.geprueft_am)}</time>.`,
      ausgefuehrt: istIso(t.ausgefuehrt_am) ? T("      <p class=\"pruefstatus\">Einmal ausgeführt in Microsoft Copilot Chat am {0}. Ergebnisse können abweichen.</p>", datumCH(t.ausgefuehrt_am)) : '',
      // LinkedIn: feed/?shareActive=true&text= fuellt den Post vor (share-offsite kann keinen Text). Rueckfall: core.js kopiert denselben Text
      linkedin_url: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${t.teilen_text}\n\n${url}`)}`, url,
      bild_link: bildDa ? `        <a class="knopf knopf--klein" href="${ra}${kartenBild}" download>${T("Bild herunterladen")}</a>` : '',
      teilen_text: `${t.teilen_text}\n\n${url}`, kette, kurs, blaettern,
      haupt_pre: 'prompt', kopier_label: a.knopf, kopier_erfolg: a.erfolg, naechste_url: nach ? `${r}techniken/${nach.slug}/` : `${r}techniken/`, naechste_label: nach ? T("Nächste Technik") : T("Zur Technik-Wand")
    }
  });
}
function baueVierWochen() {
  seite('vier-wochen/index.html', {
    seite: 'wochen', template: 'vier-wochen.html',
    titel: T("In vier Wochen durch alle Gürtel | Copilot Dojo"),
    beschreibung: T("Ein freier Plan zum Selbstlernen mit Microsoft Copilot Chat und Copilot Studio: jede Woche ein oder zwei Gürtel, mit den Ergebnissen jeder Woche."),
    canonical: `${BASE_L}vier-wochen/`, banner: ohneFreigabe(DABEI),
    jsonld: [ldWebsite(), LD_ORG, ldKrumen([[T("Start"), BASE_L], [T("Techniken"), `${BASE_L}techniken/`], [T("Vier Wochen"), `${BASE_L}vier-wochen/`]])],
    daten: { vier_wochen: vierWochenHtml('../', 'h1') }
  });
}
function baueHeute() {
  const t = heuteTechnik(true); // dieselbe Rotation wie die Startseite (Marcel 24.10.2026, 369)
  seite('heute/index.html', {
    seite: 'heute', template: 'heute.html', titel: T("Technik des Tages | Copilot Dojo"),
    beschreibung: T("Jeden Tag eine Technik aus dem Power Platform Dojo, für alle am selben Tag dieselbe."), noindex: true, canonical: null,
    banner: t ? ohneFreigabe([t]) : false,
    daten: { build_datum: DATUM, heute_inhalt: heuteHtml(t, '../', 'h2') }
  });
}
function bauePflichtseiten() {
  // Kurzadressen 1 bis 25, in weiteren Sprachen unter /<code>/1/ bis /<code>/25/
  for (let n = 1; n <= 25; n++) {
    const t = TECHNIKEN.find(x => x.nr === n);
    const roh = ALLE.find(x => x.nr === n);
    const g = roh ? GUERTEL[roh.guertel - 1] : null;
    const ziel = t ? `../techniken/${t.slug}/` : g ? `../techniken/#${g.anker}` : '../techniken/';
    schreibe(`${LP()}${n}/index.html`, render(lies('templates/kurzadresse.html'), {
      lang: HTML_LANG(), ra: praefix(`${LP()}${n}/index.html`),
      titel: t ? technikTitel(t) : `${T("Technik")} ${n} | Copilot Dojo`,
      canonical: t ? urlTechnik(t) : `${BASE_L}techniken/`, ziel,
      linktext: t ? `${T("Technik")} ${pad2(n)}: ${t.titel}` : T("Technik {0} ist noch nicht freigegeben. Zur Technik-Wand", n),
      hinweis: T("Unabhängige Website von Marcel Lehmann. Keine Verbindung zu Microsoft.")
    }, 'kurzadresse'));
  }
  // Umgezogene Seiten (16.10.2026, Geschwister-Layout wie powerautomate.ninja): alte Adresse leitet weiter, Canonical zeigt aufs Ziel
  for (const [alt, neu, de] of UMZUEGE) {
    const rel = `${LP()}${alt}index.html`;
    const tiefe = alt.split('/').filter(Boolean).length;
    schreibe(rel, render(lies('templates/kurzadresse.html'), {
      lang: HTML_LANG(), ra: praefix(rel), titel: `${T(de)} | Copilot Dojo`, canonical: `${BASE_L}${neu}`,
      ziel: '../'.repeat(tiefe) + neu, linktext: T("Diese Seite ist umgezogen: {0}", T(de)),
      hinweis: T("Unabhängige Website von Marcel Lehmann. Keine Verbindung zu Microsoft.")
    }, 'umzug'));
  }
  // Weiterleitung /vorlagen/ (nur deutsch, alte Adresse)
  if (istDE()) {
    const ziele = ALTE_ANKER.filter(s => DABEI.some(t => t.slug === s));
    schreibe('vorlagen/index.html', render(lies('templates/weiterleitung-vorlagen.html'), { ziele_json: esc(JSON.stringify(ziele)), canonical: `${BASE_URL}techniken/` }, 'weiterleitung'));
  }
  // 404: GitHub Pages liefert nur die 404.html der Wurzel aus. sprache.js leitet dort Adressen unter /<code>/ auf <code>/404.html weiter.
  seite('404.html', {
    seite: '404', template: '404.html', absolut: true, titel: T("Seite nicht gefunden | Copilot Dojo"),
    beschreibung: T("Diese Seite gibt es nicht. Zu den Techniken, zur Suche oder zur Startseite."), noindex: true,
    daten: { tusch_spaehen: tusch('spaehen'), kurz_basis: KURZ_BASIS + (istDE() ? '' : '/' + L) }
  });
}

/* Seiten von Hand: Rahmen-Marker fuellen. Fassungen weiterer Sprachen liegen unter <code>/ mit derselben Struktur. */
const HAND_SEITEN = () => {
  const liste = ['ueber/index.html', 'impressum/index.html', 'datenschutz/index.html', 'gratis/index.html', 'gratis/nachschlagen/index.html', 'pruefung/index.html', 'pruefung/fragen/index.html', 'dojo/index.html', 'dojo/profil/index.html'];
  const g = `${LP()}dojo/guertel`;
  const aus = liste.map(d => LP() + d);
  if (gibtEs(g)) for (const f of fs.readdirSync(path.join(ROOT, g))) if (gibtEs(`${g}/${f}/index.html`)) aus.push(`${g}/${f}/index.html`);
  return aus;
};
const EIGENE_HAND = SPRACHEN.flatMap(sp => ['ueber/index.html', 'impressum/index.html', 'datenschutz/index.html'].map(d => SP[sp].pfad + d));
function ersetzeMarker(html, name, inhalt, datei) {
  const re = new RegExp(`(<!-- RAHMEN:${name} -->)[\\s\\S]*?(<!-- /RAHMEN:${name} -->)`);
  if (!re.test(html)) { (EIGENE_HAND.includes(datei) || !LOCKER ? fehler : warnung)(`${datei}: Marker RAHMEN:${name} fehlt`); return null; }
  return html.replace(re, (_, a, b) => `${a}\n${inhalt}\n${b}`);
}
function fuelleHandseiten() {
  for (const datei of HAND_SEITEN()) {
    if (!gibtEs(datei)) { fehler(`${datei} fehlt`); continue; }
    let html = lies(datei);
    const seiteName = (html.match(/<html[^>]*data-seite="([^"]+)"/) || [])[1] || 'recht';
    if (!/<!-- RAHMEN:HEAD -->/.test(html)) { (EIGENE_HAND.includes(datei) || !LOCKER ? fehler : warnung)(`${datei}: keine Rahmen-Marker, Seite bleibt unverändert`); continue; }
    const ctx = rahmenKontext(datei, seiteName);
    const r = ctx.r;
    let neu = html;
    // Feste Adressen der bisherigen Basis (canonical, og:url, JSON-LD) auf BASE_URL umschreiben (Domainwechsel)
    for (const alt of FRUEHERE_BASEN) neu = neu.split(alt).join(BASE_URL);
    for (const [name, tpl] of [['HEAD', 'head'], ['KOPF', 'kopf'], ['FUSS', 'fuss']]) {
      const ersetzt = ersetzeMarker(neu, name, render(partial(tpl), ctx, tpl), datei);
      if (ersetzt !== null) neu = ersetzt;
    }
    // Testphase: Handseiten bekommen noindex im HEAD-Marker (wird bei jedem Lauf neu gesetzt, ohne --testphase faellt es weg)
    if (TESTPHASE && !/name="robots" content="[^"]*noindex/.test(neu)) neu = neu.replace('<!-- /RAHMEN:HEAD -->', '<meta name="robots" content="noindex">\n<meta name="dojo-build" content="testphase">\n<!-- /RAHMEN:HEAD -->');
    if (datei === `${LP()}gratis/index.html`) {
      const liste = TECHNIKEN.filter(t => t.zugang === 'ohne-zl' || t.zugang === 'agent-builder');
      const inhalt = liste.length ? `<ul class="pfad__liste">${liste.map(t => kompakt(t, r)).join('')}</ul>\n<p><a class="knopf" href="${r}techniken/?zugang=ohne-zl&amp;zugang=agent-builder">${T("Alle Techniken ohne Zusatzlizenz auf der Technik-Wand")}</a></p>` : `<p>${NOCH_NICHT}</p>`;
      const x = ersetzeMarker(neu, 'GRATIS-TECHNIKEN', inhalt, datei); if (x !== null) neu = x;
    }
    if (datei === `${LP()}dojo/index.html`) {
      const inhalt = `<div class="dojo-liste">${GUERTEL.map(g => {
        const drin = sortiert.filter(t => t.guertel === g.nr && t.typ === 'technik');
        return `<section class="dojo-liste__guertel" data-guertel-nr="${g.nr}" aria-labelledby="dl-${g.farbe}">
<h3 id="dl-${g.farbe}">${knoten(g.nr, g.name)}<span class="klein">${T("Stufe")} ${g.nr}${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span></h3>
<div class="fortschritt" data-fortschritt="${g.nr}"><p class="fortschritt__text">${drin.length === 1 ? T("{0} Technik", 1) : T("{0} Techniken", drin.length)}</p></div>
${drin.length ? `<ul>${drin.map(t => `<li data-technik="${t.id}" data-guertel-nr="${g.nr}"><a href="${r}techniken/${t.slug}/">${pad2(t.nr)} ${esc(t.titel)}</a><span class="dojo-liste__status" data-status>${T("offen")}</span></li>`).join('')}</ul>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
</section>`;
      }).join('\n')}</div>`;
      const x = ersetzeMarker(neu, 'DOJO-LISTE', inhalt, datei); if (x !== null) neu = x;
    }
    if (neu !== html) schreibe(datei, neu);
    else geschrieben.push(datei);
  }
}

/* Daten fuer Skripte, Feed und Kalender je Sprache (deutsch: assets/data/, kalender/, feed.xml; englisch: assets/data/en/, en/kalender/, en/feed.xml) */
function baueDaten() {
  const suche = { erzeugt: DATUM, eintraege: sortiert.map(t => ({ id: t.id, nr: t.nr, titel: t.titel, klartitel: t.klartitel, guertel: t.guertel, slug: t.slug, moment: t.moment || '', s: (t.suchbegriffe || []).join(' ') })) };
  schreibe(`assets/data/${LP()}suche.json`, JSON.stringify(suche));
  const folge = (daten.tag_reihenfolge || []).filter(id => NACH_ID[id] && NACH_ID[id].typ === 'technik');
  if (istDE()) for (let i = 1; i < folge.length; i++) if (NACH_ID[folge[i]].guertel === NACH_ID[folge[i - 1]].guertel) warnung(`tag.json: ${folge[i - 1]} und ${folge[i]} haben denselben Gürtel an zwei Tagen hintereinander`);
  const tag = {
    start: istIso(daten.tag_start) ? daten.tag_start : DATUM,
    formel: 'Index = (Tage seit start nach lokalem Datum) modulo Anzahl, positiv gerechnet',
    reihenfolge: folge,
    eintraege: Object.fromEntries(folge.map(id => { const t = NACH_ID[id]; return [id, { nr: t.nr, slug: t.slug, titel: t.titel, klartitel: t.klartitel, guertel: t.guertel, zugang: t.zugang, zugang_text: t.zugang_text || '', nutzen: t.nutzen || '', problem: FUER_START(t) ? t.problem : '', dauer_min: t.dauer_min }]; }))
  };
  schreibe(`assets/data/${LP()}tag.json`, JSON.stringify(tag));
  const xml = (s) => esc(s).replace(/'/g, '&apos;');
  const feed = sortiert.slice().sort((a, b) => (b.datum_publiziert || '').localeCompare(a.datum_publiziert || '')).map(t => `  <entry>
    <title>${xml(t.typ === 'technik' ? `${T("Technik")} ${pad2(t.nr)}: ${t.titel}` : `${T("Grundform")}: ${t.titel}`)}</title>
    <id>${urlTechnik(t)}</id>
    <link href="${urlTechnik(t)}"/>
    <published>${t.datum_publiziert || t.geprueft_am}T00:00:00Z</published>
    <updated>${t.geprueft_am}T00:00:00Z</updated>
    <summary>${xml(`${t.klartitel}. ${t.nutzen || ''}`.trim())}</summary>
  </entry>`);
  schreibe(`${LP()}feed.xml`, `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${HTML_LANG()}">
  <title>${xml(SITE_VOLL)}</title>
  <subtitle>${T("Unabhängige Website von Marcel Lehmann. Keine Verbindung zu Microsoft.")}</subtitle>
  <id>${BASE_L}</id>
  <link href="${BASE_L}"/>
  <link rel="self" href="${BASE_L}feed.xml"/>
  <updated>${STAND}T00:00:00Z</updated>
  <author><name>Marcel Lehmann</name><uri>https://kmupower.com/</uri></author>
${feed.join('\n')}
</feed>
`);
  const montag = (() => { let d = new Date((istIso(daten.tag_start) ? daten.tag_start : DATUM) + 'T00:00:00Z'); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); })();
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//KMUpower//Dojo//${SP[L].kurz}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:dojo-montag-technik-des-tages${istDE() ? '' : '-' + L}@kmupower.com`,
    `DTSTAMP:${DATUM.replace(/-/g, '')}T000000Z`, `DTSTART:${montag}T083000`, 'DURATION:PT15M', 'RRULE:FREQ=WEEKLY;BYDAY=MO', T("SUMMARY:Dojo: Technik des Tages"),
    T("DESCRIPTION:15 Minuten üben. Die Technik des Tages steht unter {0}heute/", BASE_L), `URL:${BASE_L}heute/`, 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR'];
  schreibe(`${LP()}kalender/montag.ics`, ics.map(falte).join('\r\n') + '\r\n');
}
/* Texte der Skripte: assets/js/texte/<code>.js aus data/sprachen/<code>.json (js, dazu Meta fuer Datum, Zahlen, Gürtel) */
function baueSkriptTexte() {
  for (const sp of SPRACHEN.filter(x => x !== 'de')) {
    const j = SP[sp];
    const meta = { code: sp, pfad: j.pfad, datum: j.datum, monate: j.monate, zahl_locale: j.zahl_locale, guertel: j.guertel.map(g => g[0]), guertel_satz: j.guertel_satz || j.guertel.map(g => g[0]), guertel_kurz: j.guertel.map(g => g[1]), zahlwoerter: j.zahlwoerter || [], profil_felder: j.profil_felder || {} };
    schreibe(`assets/js/texte/${sp}.js`, `/* Power Platform Dojo: Texte der Skripte (${j.name}). Erzeugt von scripts/build.mjs aus data/sprachen/${sp}.json, nicht hier bearbeiten. */\nwindow.CN_TEXTE = ${JSON.stringify({ meta, texte: j.js || {} })};\n`);
  }
}
/* Sitemap mit allen Sprachen und hreflang, robots.txt, llms.txt (nach beiden Durchgaengen) */
function baueGemeinsam() {
  setzeSprache('de');
  const maxGeprueft = (html) => [...html.matchAll(/data-geprueft="(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop();
  const pfade = [['', STAND], ['techniken/', STAND], ...sortiert.map(t => [`techniken/${t.slug}/`, t.geprueft_am])];
  if (gibtEs('gratis/index.html')) pfade.push(['gratis/', maxGeprueft(lies('gratis/index.html')) || daten.stand]);
  if (gibtEs('gratis/nachschlagen/index.html')) pfade.push(['gratis/nachschlagen/', maxGeprueft(lies('gratis/nachschlagen/index.html')) || daten.stand]);
  pfade.push(['vier-wochen/', STAND]);
  if (gibtEs('pruefung/fragen/index.html')) pfade.push(['pruefung/fragen/', gibtEs('dojo/selbsttest.json') ? (() => { try { const j = JSON.parse(lies('dojo/selbsttest.json')); return [...JSON.stringify(j).matchAll(/"geprueft_am":"(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop(); } catch { return null; } })() : null]);
  if (gibtEs('pruefung/index.html')) pfade.push(['pruefung/', gibtEs('dojo/selbsttest.json') ? (() => { try { const j = JSON.parse(lies('dojo/selbsttest.json')); return [...JSON.stringify(j).matchAll(/"geprueft_am":"(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop(); } catch { return null; } })() : null]);
  pfade.push(['ueber/', RECHT_STAND], ['impressum/', RECHT_STAND], ['datenschutz/', RECHT_STAND]);
  const alt = (pfad) => [...SPRACHEN.map(sp => `<xhtml:link rel="alternate" hreflang="${sp}" href="${BASE_URL}${SP[sp].pfad}${pfad}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${pfad}"/>`].join('');
  const eintraege = [];
  for (const [pfad, lastmod] of pfade) for (const sp of SPRACHEN.map(x => SP[x].pfad)) eintraege.push(`  <url><loc>${BASE_URL}${sp}${pfad}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${alt(pfad)}</url>`);
  schreibe('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${eintraege.join('\n')}\n</urlset>\n`);
  // robots.txt nach dem Muster von powerplatformtip.com (16.10.2026): Suchmaschinen und KI-Crawler ausdruecklich erlaubt,
  // Content-Signal in jeder Gruppe (RFC 9309: ein Crawler liest nur die Gruppe mit seinem Namen). Gilt nur an der Wurzel einer Domain.
  const basisPfad = new URL(BASE_URL).pathname;
  const signal = 'Content-Signal: search=yes, ai-train=yes, ai-retrieval=yes';
  const sperren = ['templates/', 'scripts/', 'data/', '.github/'].map(p => `Disallow: ${basisPfad}${p}`).join('\n');
  const bots = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot', 'Applebot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'CCBot', 'cohere-ai', 'Meta-ExternalAgent', 'MistralAI-User'];
  schreibe('robots.txt', [
    '# Power Platform Dojo · Copilot (copilot.ninja). Suchmaschinen und KI-Assistenten sind willkommen: bitte mit Quelle zitieren.',
    `# Inhalte auf Deutsch unter /, ${SPRACHEN.filter(sp => sp !== 'de').map(sp => `${SP[sp].name} unter /${SP[sp].pfad}`).join(', ')}. Kurzfassung fuer KI: /llms.txt, Volltext: /llms-full.txt`,
    '', 'User-agent: *', 'Allow: /', signal, sperren, '',
    ...bots.flatMap(b => [`User-agent: ${b}`, 'Allow: /', signal, sperren, '']),
    `Sitemap: ${BASE_URL}sitemap.xml`, ''].join('\n'));
  // llms.txt: Orientierung fuer KI-Assistenten, beide Sprachen. llms-full.txt: alle Techniken mit Prompt, Grenzen und Quellen.
  // Je Sprache: Seitenliste, Techniken, Grundformen und Volltext in der Sprache des Durchgangs
  const teil = {};
  for (const sp of SPRACHEN) {
    setzeSprache(sp);
    const u = (p) => `${BASE_L}${p}`;
    teil[sp] = {
      seiten: [`- [${T('Technik-Wand')}](${u('techniken/')}): ${T('alle Techniken nach Gürtel, mit Zugang (ohne Zusatzlizenz, Lizenz, Copilot Studio)')}`, `- [${T('Ist Microsoft Copilot gratis?')}](${u('gratis/')}): ${T('Lizenz-Check in vier Fragen, was ohne Zusatzlizenz geht, mit Quelle und Prüfdatum je Aussage')}`, `- [${T('Gürtelprüfung')}](${u('pruefung/')}): ${T('Welcher Copilot-Gürtel bist du? Sieben Fragen, eine pro Gürtel')}`, `- [${T('Alle Fragen der Gürtelprüfung')}](${u('pruefung/fragen/')}): ${T('jede Frage mit Auflösung und Quelle')}`, `- [${T('Copilot ohne Zusatzlizenz: jede Bedingung mit Quelle')}](${u('gratis/nachschlagen/')}): ${T('Mythen, App-Stufen, Wortlaut der Bedingungen, häufige Fragen, Prüfprotokoll')}`, `- [${T('In vier Wochen durch alle Gürtel')}](${u('vier-wochen/')}): ${T('freier Plan zum Selbstlernen')}`, `- [${T('Über das Dojo')}](${u('ueber/')}): ${T('Methode, Dojo-Regeln, was die Seite nicht ist')}`],
      liste: TECHNIKEN.map(t => `- [${T('Nr.')} ${t.nr} ${t.titel}: ${t.klartitel}](${urlTechnik(t)}): ${t.nutzen || ''} ${T('Stand')} ${datumCH(t.geprueft_am)}.`),
      grund: GRUNDFORMEN.map(t => `- [${t.titel}](${urlTechnik(t)}): ${T('Stand')} ${datumCH(t.geprueft_am)}.`),
      voll: sortiert.map(t => volltext(t)), titelT: T('Techniken'), titelG: T('Grundformen')
    };
  }
  setzeSprache('de');
  const kopf = [`# ${SITE_VOLL}`, '',
    `> Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio, auf ${ANZEIGE.slice(0, -1).map(sp => SP[sp].name_de).join(', ')} und ${SP[ANZEIGE[ANZEIGE.length - 1]].name_de}, vom weissen bis zum schwarzen Gürtel. Jede Technik nennt ihre Quellen bei Microsoft Learn, den Stand und ihre Grenzen. Das Dojo ist eine unabhängige Community-Initiative von Marcel Lehmann. Bezahlte Kurse gibt es separat in der Power Platform Academy (https://www.powerplatformacademy.online/). Unabhängige Website von Marcel Lehmann (KMUpower), keine Verbindung zu Microsoft.`, '',
    'Kurzfakten:', '',
    `- Website: ${SITE_VOLL} (${BASE_URL}), ${SPRACHEN.filter(sp => sp !== 'de').map(sp => `${SP[sp].name} ${BASE_URL}${SP[sp].pfad}`).join(', ')}`,
    '- Weiteres Dojo: Power Platform Dojo · Power Automate (https://powerautomate.ninja/)',
    '- Autor: Marcel Lehmann, Microsoft Business Applications MVP, Schweiz (Handelsname KMUpower, https://kmupower.com/)',
    `- Inhalt: ${GRUNDFORMEN.length} Grundformen und ${TECHNIKEN.length} Techniken für Microsoft Copilot Chat, Agent Builder und Copilot Studio, je mit Prompt zum Kopieren, Grenzen und Quellen bei Microsoft Learn`,
    '- Kosten: gratis, ohne Anmeldung',
    '- Datenschutz: Keine Cookies, keine Profile. Aufrufe werden ohne Cookies gezählt, gespeichert werden nur Summen ohne Personenbezug (GoatCounter).',
    '- Privacy: No cookies, no profiles. Visits are counted without cookies; only totals without personal data are stored (GoatCounter).',
    '- Apps (Word, Excel, PowerPoint und OneNote): Copilot Chat (Basic) ohne Add-on und ohne App-Zugang; Microsoft 365 Copilot (Basic) ohne Add-on mit Standard-Zugang, bei hoher Auslastung eventuell eingeschränkt; Microsoft 365 Copilot (Premium) mit Add-on, Priority Access und vollem Umfang inklusive breiter Organisationsdaten (Graph, Work IQ). Lizenz und Tenant-Konfiguration bestimmen die Verfügbarkeit, die Bezeichnung im Produkt zeigt die Stufe. Copilot Chat in Outlook bezieht in unterstützten Szenarien auch ohne Add-on Mails, Kalender, Meetings und Chats ein. Hochgeladene oder eingefügte Inhalte und Agents mit freigegebenem Zugriff sind weitere Ausnahmen vom fehlenden breiten Organisationszugriff ohne Add-on.',
    '- App access (Word, Excel, PowerPoint and OneNote): Copilot Chat (Basic) has no add-on and no app access; Microsoft 365 Copilot (Basic) has standard app access without an add-on, possibly limited at high demand; Microsoft 365 Copilot (Premium) adds Priority Access and full functionality including broad organizational data through Graph and Work IQ with an add-on. The in-product label shows the tier; availability depends on license and tenant configuration. In supported scenarios Copilot Chat in Outlook includes emails, calendar, meetings and chats without an add-on. Uploaded or pasted content and agents with enabled access are further exceptions to the lack of broad organizational access without an add-on.',
    '- Kontakt: marcel.lehmann@kmupower.com', ''];
  const llms = [...kopf,
    '## Seiten', '', ...teil.de.seiten, `- [Volltext aller Techniken](${BASE_URL}llms-full.txt): Prompts, Grenzen und Quellen in allen Sprachen (${ANZEIGE.map(sp => SP[sp].name).join(', ')})`, '',
    '## Techniken', '', ...teil.de.liste, ...(teil.de.grund.length ? ['', '## Grundformen', '', ...teil.de.grund] : []), '',
    ...SPRACHEN.filter(sp => sp !== 'de').flatMap(sp => [`## ${SP[sp].name} (${BASE_URL}${SP[sp].pfad})`, '', ...teil[sp].seiten, '',
      `### ${teil[sp].titelT}`, '', ...teil[sp].liste, ...(teil[sp].grund.length ? ['', `### ${teil[sp].titelG}`, '', ...teil[sp].grund] : []), ''])];
  schreibe('llms.txt', llms.join('\n'));
  schreibe('llms-full.txt', [...kopf, ...SPRACHEN.flatMap(sp => [`# ${SP[sp].name}`, '', ...teil[sp].voll])].join('\n'));
}
// Eine Technik als Klartext fuer llms-full.txt, in der Sprache des Durchgangs
function volltext(t) {
  const q = [{ url: t.quelle_url, titel: t.quelle_titel }, ...(t.weitere_quellen || [])];
  const zeilen = [`## ${t.typ === 'technik' ? `${T("Nr.")} ${t.nr} ` : ''}${t.titel}: ${t.klartitel}`, '', `URL: ${urlTechnik(t)}`,
    `${T("Gürtel")}: ${gName(t.guertel)}. ${T("Zugang")}: ${t.zugang_text || (ZUGANG[t.zugang] || {}).kurz || ''}. ${T("Stand")} ${datumCH(t.geprueft_am)}.`, '',
    `${T("Problem")}: ${t.problem}`, '', `${T("Nutzen")}: ${t.nutzen || ''}`, '',
    `${(ART[t.art] || ART.pinselstrich).rolle}:`, '', '```', t.technik_text.replace(/\{([^{}|]*)(?:\|[^{}]*)?\}/g, '[$1]'), '```', ''];
  (t.zusatz_texte || []).forEach(z => zeilen.push(`${z.titel}:`, '', '```', (z.text || '').replace(/\{([^{}|]*)(?:\|[^{}]*)?\}/g, '[$1]'), '```', ''));
  zeilen.push(`${T("So nutzt du es")}:`, ...(t.so_nutzt_du_es || []).map((s, i) => `${i + 1}. ${s}`), '',
    `${T("Grenzen")}:`, ...(t.grenzen || []).map(s => `- ${s}`), '',
    `${T("Quellen")}: ${q.map(x => `${x.titel} (${x.url})`).join('; ')}`, '');
  return zeilen.join('\n');
}
function falte(zeile) {
  const b = Buffer.from(zeile, 'utf8'); if (b.length <= 75) return zeile;
  const teile = []; let rest = zeile;
  while (Buffer.byteLength(rest, 'utf8') > 74) { let n = 74; while (Buffer.byteLength(rest.slice(0, n), 'utf8') > 74) n--; teile.push(rest.slice(0, n)); rest = rest.slice(n); }
  teile.push(rest);
  return teile.join('\r\n ');
}

/* CSS aus templates/css minifizieren */
function minifiziere(css) {
  const strings = [];
  let s = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => { strings.push(m); return `\u0000${strings.length - 1}\u0000`; });
  s = s.replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}').trim();
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => strings[Number(i)]);
}
function baueCss() {
  for (const f of ['site', 'technik', 'gratis', 'dojo', 'druck']) {
    const q = `templates/css/${f}.css`;
    if (!gibtEs(q)) { fehler(`${q} fehlt`); continue; }
    const css = lies(q);
    // Erlaubt sind data:-URIs und die selbst gehosteten Schriften unter assets/fonts/
    if (/@import|url\((?!["']?(data:|\.\.\/fonts\/[\w-]+\.woff2["']?\)))/.test(css.replace(/(["'])data:[\s\S]*?\1/g, '"data:"'))) fehler(`${q}: @import oder url() ausser data: und ../fonts/*.woff2 ist nicht erlaubt`);
    schreibe(`assets/css/${f}.css`, `/* Power Platform Dojo. Quelle: ${q} (nicht hier bearbeiten, node scripts/build.mjs erzeugt diese Datei) */\n${minifiziere(css)}\n`);
  }
}

/* Statische Bilder: Favicon, Tusch-SVG, OG-Bild */
const FARBEN_HELL = { '.t-koerper': 'fill:#15171B', '.t-gesicht': 'fill:#F3EFF7', '.t-augen': 'fill:none;stroke:#15171B;stroke-width:3.6;stroke-linecap:round', '.t-band,.t-pinsel-spitze': 'fill:#B4301A', '.t-guertel,.t-guertel-enden': 'fill:#FBFAF5;stroke:#8A7F6C;stroke-width:1.2;stroke-linejoin:round', '.t-pinsel-stiel': 'fill:none;stroke:#15171B;stroke-width:3;stroke-linecap:round', '.t-hand': 'fill:#15171B', '.t-rolle,.t-strich': 'display:none' };
function tuschDatei(farben = FARBEN_HELL, guertelFarbe = '#FBFAF5') {
  const style = Object.entries(farben).map(([k, v]) => `${k}{${v.replace('#FBFAF5', guertelFarbe)}}`).join('');
  return partial('tusch').replace('<svg class="tusch__svg"', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ' role="img" aria-label="Tusch, die Figur des Power Platform Dojo"').replace('<g class="t-figur">', `<title>Tusch</title><style>${style}</style><g class="t-figur">`);
}
function baueBilder() {
  schreibe('assets/img/tusch.svg', tuschDatei() + '\n');
  schreibe('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 -4 96 96"><rect x="20" y="-4" width="96" height="96" rx="16" fill="#F3EFF7"/><path fill="#B4301A" d="M89 27l21-8-2 8-17 6zM90 34h22l-3 6-18-2z"/><path fill="#15171B" d="M24 152l2.6-20 .4-20q1-28 3-50c1-26 14-48 36-53l18-3q-4 8 4 18c6 10 7 28 5 46q4 34 7 82z"/><path fill="#F3EFF7" d="M31 38l62-5 1 13-63 5z"/><path fill="none" stroke="#15171B" stroke-width="4.2" stroke-linecap="round" d="M46 44.6h9M68 42.4h9"/></svg>
`);
  const belts = ['#FBFAF5', '#E2B100', '#E36A00', '#2E8B57', '#2F6FB5', '#7A4A2B', '#111111'];
  const tuschGross = tuschDatei().replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>Tusch<\/title>/, '');
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F3EFF7"/>
${belts.map((c, i) => `<rect x="${i * (1200 / 7)}" y="606" width="${1200 / 7 + 1}" height="24" fill="${c}"/>`).join('')}
<rect x="0" y="605" width="1200" height="1.5" fill="#8A7F6C"/>
<text x="80" y="112" font-family="Bahnschrift, 'Avenir Next Condensed', 'Arial Narrow', sans-serif" font-stretch="condensed" font-weight="600" font-size="38" fill="#15171B">Power Platform Dojo</text>
<text x="80" y="152" font-family="Bahnschrift, 'Avenir Next Condensed', 'Arial Narrow', sans-serif" font-stretch="condensed" font-weight="700" font-size="26" letter-spacing="3" fill="#B4301A">COPILOT</text>
<text x="76" y="300" font-family="Bahnschrift, 'Avenir Next Condensed', 'Arial Narrow', sans-serif" font-stretch="condensed" font-weight="600" font-size="112" letter-spacing="-2" fill="#15171B">Übung schlägt</text>
<text x="76" y="410" font-family="Bahnschrift, 'Avenir Next Condensed', 'Arial Narrow', sans-serif" font-stretch="condensed" font-weight="600" font-size="112" letter-spacing="-2" fill="#15171B">Hype.</text>
<path d="M80 322C160 312 250 308 352 314" fill="none" stroke="#B4301A" stroke-width="12" stroke-linecap="round"/>
<text x="80" y="500" font-family="'Segoe UI', system-ui, sans-serif" font-size="34" fill="#4E525B">Ninja-Techniken mit Quelle und Prüfdatum.</text>
<text x="80" y="546" font-family="'Segoe UI', system-ui, sans-serif" font-size="34" fill="#4E525B">Vom weissen bis zum schwarzen Gürtel.</text>
<g transform="translate(862 150) scale(2.55)">${tuschGross}</g>
<g transform="translate(612 70) rotate(-6)"><rect x="0" y="0" width="250" height="96" fill="#F3EFF7" stroke="#B4301A" stroke-width="5"/><rect x="8" y="8" width="234" height="80" fill="none" stroke="#B4301A" stroke-width="1.5"/><text x="125" y="52" text-anchor="middle" font-family="Bahnschrift, 'Arial Narrow', sans-serif" font-weight="700" font-size="40" letter-spacing="4" fill="#B4301A">GEPRÜFT</text><text x="125" y="76" text-anchor="middle" font-family="Bahnschrift, 'Arial Narrow', sans-serif" font-size="17" fill="#B4301A">gegen die Dokumentation</text></g>
</svg>
`;
  schreibe('og-image.svg', og);
  // OG-Bild je weitere Sprache: gleiche Gestaltung, Zeilen aus data/sprachen/<code>.json (ui), Datei og-image-<code>.svg
  const altL = L;
  for (const sp of SPRACHEN.filter(x => x !== 'de')) {
    L = sp;
    const zeilen = ['Übung schlägt', 'Hype.', 'Ninja-Techniken mit Quelle und Prüfdatum.', 'Vom weissen bis zum schwarzen Gürtel.', 'GEPRÜFT', 'gegen die Dokumentation'];
    schreibe(`og-image-${sp}.svg`, zeilen.reduce((svg, z) => svg.replace(`>${z}<`, `>${esc(T(z))}<`), og));
  }
  L = altL;
  if (ARGS.includes('--og-png')) {
    const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
    if (!chrome) { warnung('--og-png: kein Chrome gefunden (CHROME=Pfad setzen)'); return; }
    for (const name of SPRACHEN.map(sp => (sp === 'de' ? 'og-image' : `og-image-${sp}`))) {
      const tmp = path.join(ROOT, '_recherche', 'og-render.html');
      fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body><img src="../${name}.svg" width="1200" height="630" alt=""></body></html>`);
      try {
        execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--screenshot=${path.join(ROOT, name + '.png')}`, '--window-size=1200,630', 'file:///' + tmp.split(path.sep).join('/')], { stdio: 'ignore', timeout: 60000 });
        geschrieben.push(name + '.png');
      } catch (e) { warnung(`--og-png: Chrome-Aufruf fehlgeschlagen (${e.message})`); }
      fs.rmSync(tmp, { force: true });
    }
  }
}

/* Alte, nicht mehr erzeugte Technik-Seiten entfernen (nur Seiten mit Generator-Marke) */
function aufraeumen() {
  const dir = path.join(ROOT, LP() + 'techniken');
  if (!fs.existsSync(dir)) return;
  const aktiv = new Set(sortiert.map(t => t.slug));
  for (const f of fs.readdirSync(dir)) {
    const datei = path.join(dir, f, 'index.html');
    if (aktiv.has(f) || !fs.existsSync(datei)) continue;
    if (fs.readFileSync(datei, 'utf8').includes(GENERATOR)) { fs.rmSync(path.join(dir, f), { recursive: true }); warnung(`${LP()}techniken/${f}/ entfernt (nicht mehr im Build)`); }
  }
}

/* Freigabeblatt */
function baueFreigabeblatt() {
  const paket = (t) => t.guertel <= 3 ? 'A' : 'B';
  const liste = ALLE.slice().sort((a, b) => a.guertel - b.guertel || (a.nr || 0) - (b.nr || 0)).filter(t => !PAKET || paket(t) === PAKET);
  const ausfuehren = { A: ['t05', 't09', 't10', 'g1'], B: ['t18', 't19', 't23'] };
  const zeigen = PAKET ? [PAKET] : ['A', 'B'];
  const block = (t) => `<section class="e">
<h2>${t.typ === 'technik' ? 'Nr. ' + t.nr : t.id.toUpperCase()} ${esc(t.titel)} <small>${esc(t.klartitel || '')}</small></h2>
<p><b>${esc(gName(t.guertel))}</b>, Paket ${paket(t)}, Art ${esc(t.art || '')}, Klasse ${esc(t.klasse || '')}, Zugang ${esc(t.zugang || '')}: ${esc(t.zugang_text || '')}</p>
<p><b>Problem:</b> ${esc(t.problem)}</p>
<p><b>Nutzen:</b> ${esc(t.nutzen || '')}</p>
<pre>${esc(t.technik_text)}</pre>
${(t.zusatz_texte || []).map(z => `<p><b>${esc(z.titel)}</b></p><pre>${esc(z.text)}</pre>`).join('')}
<p><b>Grenzen:</b></p><ul>${(t.grenzen || []).map(g => `<li>${esc(g)}</li>`).join('')}</ul>
<p><b>Quelle:</b> <a href="${esc(t.quelle_url)}">${esc(t.quelle_titel)}</a>, gelesen am ${datumCH(t.geprueft_am)}${(t.weitere_quellen || []).map(q => `; <a href="${esc(q.url)}">${esc(q.titel)}</a>`).join('')}</p>
${(t.offen_pruefen || []).length ? `<p class="rot"><b>Offen prüfen:</b> ${t.offen_pruefen.map(esc).join('; ')}</p>` : ''}
<p class="frei">Freigegeben am ______________ &nbsp; Kürzel ______</p>
</section>`;
  const html = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><title>Freigabeblatt Power Platform Dojo${PAKET ? ' Paket ' + PAKET : ''}</title>
<style>body{font:11pt/1.45 "Segoe UI",system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#15171B}pre{white-space:pre-wrap;background:#F3EFF7;padding:.8rem;border:1px solid #D8CFBE;font-size:9.5pt}.e{border-top:2px solid #15171B;padding-top:.6rem;margin-top:1.6rem;break-inside:avoid-page}.rot{color:#B4301A}.frei{margin-top:1rem;font-weight:600}h2 small{font-weight:400;color:#4E525B}@media print{body{margin:0}.e{break-before:page}}</style></head><body>
<h1>Freigabeblatt Power Platform Dojo${PAKET ? ', Paket ' + PAKET : ''}</h1>
<p>Erzeugt am ${datumCH(DATUM)} aus data/techniken.json. Nicht veröffentlichen. Nach dem Lesen trägst du das Datum in «freigabe» ein oder nennst dem Koordinator die Nummern.</p>
<h2>Einmal selbst ausführen</h2><ul>${zeigen.map(p => `<li>Paket ${p}: ${ausfuehren[p].map(id => ALLE_NACH_ID[id] ? `${id} ${esc(ALLE_NACH_ID[id].titel)}` : id).join(', ')}</li>`).join('')}</ul>
<h2>Einträge (${liste.length})</h2><ol>${liste.map(t => `<li>${t.typ === 'technik' ? 'Nr. ' + t.nr : t.id.toUpperCase()} ${esc(t.titel)}${(t.offen_pruefen || []).length ? ' <span class="rot">(offene Punkte)</span>' : ''}</li>`).join('')}</ol>
${liste.map(block).join('\n')}
</body></html>
`;
  const ziel = path.join(ROOT, '_recherche/konzept/freigabeblatt.html');
  fs.writeFileSync(ziel, html);
  console.log(`Freigabeblatt geschrieben: _recherche/konzept/freigabeblatt.html (${liste.length} Einträge)`);
}

/* Abschlusspruefung */
function allesHtml() {
  const aus = [];
  const geh = (d) => {
    for (const f of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const rel = d ? `${d}/${f.name}` : f.name;
      if (f.isDirectory()) { if (!/^(\.git|_recherche|templates|node_modules|scripts|data)$/.test(f.name)) geh(rel); }
      else if (f.name.endsWith('.html')) aus.push(rel);
    }
  };
  geh('');
  return aus;
}
function abschluss() {
  const ohneH1 = ['vorlagen/index.html', ...SPRACHEN.flatMap(sp => [...UMZUEGE.map(([alt]) => `${SP[sp].pfad}${alt}index.html`), ...Array.from({ length: 25 }, (_, i) => `${SP[sp].pfad}${i + 1}/index.html`)])];
  for (const rel of allesHtml()) {
    const html = lies(rel);
    const fremd = !geschrieben.includes(rel) && !EIGENE_HAND.includes(rel);
    const melde = fremd && LOCKER ? warnung : fehler;
    const wo = `Prüfung ${rel}`;
    if (!/^([a-z]{2}\/)?404\.html$/.test(rel) && /\s(href|src)="\/(?!\/)/.test(html)) melde(`${wo}: absoluter Pfad mit «/»`);
    for (const m of html.matchAll(/<(script|link)\b[^>]*>/g)) {
      const tag = m[0]; const u = (tag.match(/\s(?:src|href)="([^"]+)"/) || [])[1];
      if (!u || /rel="(canonical|alternate)"/.test(tag)) continue;
      if (/^http:\/\//.test(u) || (/^(https?:)?\/\//.test(u) && !u.startsWith(BASE_URL))) melde(`${wo}: fremde Quelle in <${m[1]}> ${u}`);
    }
    if (/<[a-z][^>]*\sstyle=/i.test(html)) melde(`${wo}: style-Attribut`);
    if (/<[a-z][^>]*\son[a-z]+=/i.test(html)) melde(`${wo}: on…-Attribut`);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if (!/\ssrc=/.test(m[1]) && !/application\/ld\+json/.test(m[1]) && m[2].trim()) melde(`${wo}: Inline-Skript`);
    const spRel = (rel.match(SPRACH_PRAEFIX) || [])[1] || 'de';
    const sollLang = SP[spRel].html_lang;
    if (!new RegExp(`<html[^>]*lang="${sollLang}"`).test(html)) melde(`${wo}: lang="${sollLang}" fehlt`);
    // Englisch: keine deutschen Anfuehrungszeichen im sichtbaren Text, Umschalter DE/EN auf jeder Seite mit Rahmen
    if (SP[spRel].anfuehrung_verboten && /[«»]/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!-- RAHMEN:HEAD -->[\s\S]*?<!-- \/RAHMEN:HEAD -->/, ''))) melde(`${wo}: «» im englischen Text`);
    if (/<!-- RAHMEN:KOPF -->/.test(html) && !/data-sprache-wahl=/.test(html)) melde(`${wo}: Sprachumschalter fehlt`);
    // Doppelte IDs je Seite (Korrektur 15.10.2026, vorher h-pfad doppelt auf der Startseite). Inhalte in <template> zaehlen nicht.
    const sichtbar = html.replace(/<template[\s\S]*?<\/template>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    const gesehen = new Set();
    for (const m of sichtbar.matchAll(/\sid="([^"]+)"/g)) { if (gesehen.has(m[1])) melde(`${wo}: id «${m[1]}» doppelt`); gesehen.add(m[1]); }
    if (!/<title>[^<]+<\/title>/.test(html)) melde(`${wo}: <title> fehlt`);
    for (const m of html.matchAll(/<meta\b(?=[^>]*(?:name|property)="(?:description|og:description|twitter:description)")[^>]*content="([^"]*)"[^>]*>/g)) {
      const text = m[1].replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, "x");
      if (text.length > 165) warnung(`${wo}: Meta-Description über 165 Zeichen (${text.length})`);
    }
    if (!/Content-Security-Policy/.test(html)) melde(`${wo}: CSP fehlt`);
    if (!/name="robots" content="noindex"/.test(html) && !/rel="canonical"/.test(html)) melde(`${wo}: canonical fehlt`);
    if (!ohneH1.includes(rel)) { const n = (html.match(/<h1[\s>]/g) || []).length; if (n !== 1) melde(`${wo}: ${n} statt genau ein <h1>`); }
    if (/assets\/(style\.css|app\.js)/.test(html)) (fremd ? warnung : fehler)(`${wo}: verweist noch auf assets/style.css oder assets/app.js`);
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    if (/[\u2013\u2014]/.test(text)) melde(`${wo}: Gedankenstrich im Text`);
    if (/\u00df/.test(text)) melde(`${wo}: Eszett im Text`);
    if (/\p{Extended_Pictographic}/u.test(text)) melde(`${wo}: Emoji im Text`);
    if (/copilot[\s-]ninja/i.test(html.replace(/https?(:|%3A)(\/|%2F)(\/|%2F)[^\s"'<>]+/g, '').replace(/\s(href|src)="\/[^"]*"/g, '').replace(/copilot-ninja-theme/g, '').split(KURS_NAME).join('').split(KURZ_BASIS).join(''))) melde(`${wo}: «Copilot-Ninja» als Name`);
  }
  for (const [datei, kb] of Object.entries(BUDGET)) {
    if (!gibtEs(datei)) continue;
    const gr = fs.statSync(path.join(ROOT, datei)).size / 1024;
    if (gr > kb * 1.2) fehler(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt ${kb} KB (mehr als 20 Prozent darüber)`);
    else if (gr > kb) warnung(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt ${kb} KB`);
  }
  for (const t of sortiert) for (const datei of SPRACHEN.map(sp => `${SP[sp].pfad}techniken/${t.slug}/index.html`)) {
    if (!gibtEs(datei)) continue;
    const gr = fs.statSync(path.join(ROOT, datei)).size / 1024;
    if (gr > 48) fehler(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt 40 KB`); else if (gr > 40) warnung(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt 40 KB`);
  }
  const alt = allesHtml().filter(f => /assets\/(style\.css|app\.js)/.test(lies(f)));
  if (!alt.length && (gibtEs('assets/style.css') || gibtEs('assets/app.js'))) {
    if (MODUS !== 'pruefen') { fs.rmSync(path.join(ROOT, 'assets/style.css'), { force: true }); fs.rmSync(path.join(ROOT, 'assets/app.js'), { force: true }); warnung('assets/style.css und assets/app.js gelöscht, keine Seite verweist mehr darauf'); }
  } else if (alt.length) warnung(`assets/style.css und assets/app.js bleiben, noch verwendet von: ${alt.join(', ')}`);
  for (const js of ['assets/js/dojo.js', 'assets/js/gratis.js', 'assets/js/kompass.js']) if (!gibtEs(js)) warnung(`${js} fehlt noch (wird in den Seiten eingebunden)`);
}

/* Ablauf */
if (MODUS === 'freigabeblatt') {
  baueFreigabeblatt();
} else if (!fehlerListe.length || MODUS === 'pruefen') {
  if (MODUS !== 'pruefen') {
    baueCss();
    baueBilder();
    for (const sp of SPRACHEN) {
      setzeSprache(sp);
      NOCH_NICHT = SP[sp].noch_nicht;
      baueStart();
      baueWand();
      sortiert.forEach((t, i) => baueTechnik(t, i));
      baueHeute();
      baueVierWochen();
      bauePflichtseiten();
      fuelleHandseiten();
      baueDaten();
      aufraeumen();
    }
    baueGemeinsam();
    baueSkriptTexte();
  }
  setzeSprache('de');
  abschluss();
}

console.log(`\nPower Platform Dojo Build, Modus ${MODUS}${LOCKER ? ' (locker)' : ''}, Datum ${DATUM}`);
console.log(`Einträge: ${ALLE.length} in den Daten, ${DABEI.length} im Build (${TECHNIKEN.length} Techniken, ${GRUNDFORMEN.length} Grundformen)`);
if (geschrieben.length) {
  const seiten = geschrieben.filter(f => f.endsWith('.html'));
  console.log(`Geschrieben: ${geschrieben.length} Dateien, davon ${seiten.length} HTML-Seiten`);
  for (const f of ['index.html', 'techniken/index.html', 'assets/css/site.css', 'assets/js/core.js']) if (gibtEs(f)) console.log(`  ${f}: ${(fs.statSync(path.join(ROOT, f)).size / 1024).toFixed(1)} KB`);
}
if (warnListe.length) { console.log(`\nWarnungen (${warnListe.length}):`); warnListe.forEach(w => console.log('  - ' + w)); }
if (fehlerListe.length) { console.log(`\nFehler (${fehlerListe.length}):`); fehlerListe.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('\nOK');
