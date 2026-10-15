#!/usr/bin/env node
/*
  KMUpower Dojo: Generator und Validierung. Node 18 oder neuer, keine Abhaengigkeiten.

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
const BASE_URL = 'https://marcelehmann.github.io/copilot-ninja/';
const KURZ_BASIS = BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const KONTAKT = 'marcel.lehmann@kmupower.com';
const RECHT_STAND = '2026-10-15';
// Produktnamen wie Microsoft Learn sie am 13.10.2026 schreibt.
const PRODUKTNAMEN = {
  'copilot-chat': 'Microsoft Copilot Chat',
  'microsoft-copilot': 'Microsoft Copilot',
  'agent-builder': 'Agent Builder',
  'copilot-studio': 'Copilot Studio',
  'power-automate': 'Power Automate'
};
// Marken in der Fusszeile (Absatz 2). Die Grundliste ist der freigegebene Bestand, ergaenzt wird, was auf der Seite vorkommt.
const MARKEN_BASIS = ['Bing', 'Entra', 'Excel', 'Microsoft 365', 'Microsoft Copilot', 'Microsoft Copilot Chat', 'Microsoft Graph', 'Microsoft Learn', 'Microsoft Teams', 'OneNote', 'Outlook', 'PowerPoint', 'SharePoint', 'Word', 'Work IQ'];
const MARKEN_KANDIDATEN = ['Agent Builder', 'Azure', 'Dataverse', 'Microsoft Purview', 'Power BI', 'Power Pages', 'Microsoft Dataverse', 'Microsoft Edge', 'Windows'];
const QUELLE_AUSNAHMEN = ['https://www.powerplatformacademy.online/'];
const UTM = (stelle) => `utm_source=copilot.ninja&utm_medium=referral&utm_campaign=dojo&utm_content=${stelle}`;
const KURS_URL = (stelle) => `https://www.powerplatformacademy.online/kurse/copilot-expert?${UTM(stelle)}`;
const NEWSLETTER_URL = (stelle) => `https://kmupower.com/newsletter?${UTM(stelle)}`;
const ACADEMY_URL = (stelle) => `https://www.powerplatformacademy.online/?${UTM(stelle)}`;
const LEARN_TESTVERSION = 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-licensing-subscriptions';
const LEARN_PROMPTS = 'https://learn.microsoft.com/en-us/training/modules/write-effective-prompts-do-more-prompting/';
const GENERATOR = '<meta name="generator" content="KMUpower Dojo build">';

const GUERTEL_STANDARD = [
  { nr: 1, farbe: 'weiss', name: 'Weisser Gürtel', kurz: 'Weiss' },
  { nr: 2, farbe: 'gelb', name: 'Gelber Gürtel', kurz: 'Gelb' },
  { nr: 3, farbe: 'orange', name: 'Oranger Gürtel', kurz: 'Orange' },
  { nr: 4, farbe: 'gruen', name: 'Grüner Gürtel', kurz: 'Grün' },
  { nr: 5, farbe: 'blau', name: 'Blauer Gürtel', kurz: 'Blau' },
  { nr: 6, farbe: 'braun', name: 'Brauner Gürtel', kurz: 'Braun' },
  { nr: 7, farbe: 'schwarz', name: 'Schwarzer Gürtel', kurz: 'Schwarz' }
];
const ANKER = { weiss: 'weisser-guertel', gelb: 'gelber-guertel', orange: 'oranger-guertel', gruen: 'gruener-guertel', blau: 'blauer-guertel', braun: 'brauner-guertel', schwarz: 'schwarzer-guertel' };
const ART = {
  pinselstrich: { name: 'Pinselstrich', wort: 'Prompt', knopf: 'Prompt kopieren', rolle: 'Prompt zum Kopieren', erfolg: 'Kopiert. Jetzt in Microsoft Copilot Chat einfügen.', icon: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M2 11c5-1 9-6 18-8"/></svg>' },
  schriftrolle: { name: 'Schriftrolle', wort: 'Agent-Anweisung', knopf: 'Anweisung kopieren', rolle: 'Agent-Anweisung zum Kopieren', erfolg: 'Kopiert. Jetzt in die Anweisungen deines Agents einfügen.', icon: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M4 2h14v10H4zM4 2a2 2 0 0 0 0 10M18 2a2 2 0 0 1 0 10"/></svg>' },
  kata: { name: 'Kata', wort: 'Anleitung', knopf: 'Text kopieren', rolle: 'Text zum Kopieren', erfolg: 'Kopiert. Jetzt in Microsoft Copilot Chat einfügen.', icon: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M1 7h20"/><circle cx="4" cy="7" r="2"/><circle cx="11" cy="7" r="2"/><circle cx="18" cy="7" r="2"/></svg>' }
};
const ZUGANG = {
  'ohne-zl': { klasse: 'frei', kurz: 'Ohne Zusatzlizenz', anker: 'chat-ohne-zusatzlizenz', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2l2 2 4-4.4"/></svg>' },
  'agent-builder': { klasse: 'builder', kurz: 'Agent Builder, ohne Zusatzlizenz', anker: 'agent-builder', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2l2 2 4-4.4"/></svg>' },
  'lizenz': { klasse: 'lizenz', kurz: 'Mit Lizenz', anker: 'organisationsdaten', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="5.5" cy="8" r="3"/><path d="M8.5 8H15M12.5 8v2.5M14.5 8v2"/></svg>' },
  'studio': { klasse: 'studio', kurz: 'Copilot Studio', anker: 'studio-testversion', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 3h12v10H2zM2 6h12"/></svg>' },
  'rechner': { klasse: 'rechner', kurz: 'Rechner', anker: 'studio-verbrauch', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 1.5h10v13H3zM5 4h6M5.5 8h1M9.5 8h1M5.5 11h1M9.5 11h1"/></svg>' }
};
const ICONS = {
  suche: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
  zufall: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>',
  sonne: '<svg class="icon-sonne" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  mond: '<svg class="icon-mond" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  menue: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h12"/></svg>',
  zu: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19"/></svg>'
};
// Vier-Wochen-Pfad (Konzept 7.3): je Ergebnis die Technik, aus der es stammt.
const WOCHEN = [
  { nr: 1, guertel: [1, 2], ergebnisse: [['t01', 'die Fragen, die du vor einem wichtigen Text selbst beantworten musst'], ['t05', 'die Einwände deines Empfängers, solange du sie noch beheben kannst'], ['t06', 'eine Liste der Abweichungen zwischen Entwurf und Quelle'], ['t07', 'die Gründe, an denen dein Projekt scheitern könnte']] },
  { nr: 2, guertel: [3], ergebnisse: [['t09', 'einen Offertenvergleich mit dem Kleingedruckten in einer Tabelle'], ['t10', 'eine Fristenliste für deine Kalendereinträge'], ['t11', 'deinen Schreibstil-Steckbrief'], ['t13', 'ein Quiz mit Fundstellen zu einem Reglement']] },
  { nr: 3, guertel: [4, 5], ergebnisse: [['t14', 'einen eigenen Agent aus deinem besten Chat'], ['t17', 'eine Prüftabelle zu seinen Anweisungen'], ['t18', '20 Testfragen mit der Liste «nicht geregelt»'], ['t19', 'einen Schutzbaustein für jede Instruktion']] },
  { nr: 4, guertel: [6, 7], ergebnisse: [['t22', 'eine Vorlage, mit der du echte Fälle anonymisiert weitergibst'], ['t23', 'eine Schätzung, in welcher Grössenordnung dein Agent Copilot Credits verbraucht'], ['t24', 'ein Betriebsblatt mit Abschaltkriterien und verantwortlicher Person'], ['t25', 'einen Ablauf für den monatlichen Check']] }
];
const MOMENTE = [['t01', 'Ich weiss nicht, was ich fragen soll.'], ['t11', 'Die Antwort klingt nach Prospekt.'], ['t09', 'Drei Offerten, keine Zeit.'], ['t18', 'Der Agent erfindet Dinge.']];
const ALTE_ANKER = ['notizen-zu-protokoll', 'antwort-auf-kundenmail', 'tabelle-pruefen', 'agent-interne-anleitungen', 'agent-anfragen-sortieren'];
// Budgets in KB. Korrektur 15.10.2026: site.css 40 auf 46 (Schrift, Fokus, Hero, kompakter Pfad), core.js 20 auf 22,
// dojo-seiten.js und dojo-extra.js neu gedeckelt, Schriftdateien gedeckelt. Ueber 120 Prozent bricht der Build ab.
const BUDGET = { 'assets/css/site.css': 46, 'assets/css/technik.css': 6, 'assets/css/dojo.css': 6, 'assets/css/gratis.css': 8, 'assets/js/theme-init.js': 1, 'assets/js/core.js': 22, 'assets/js/dojo.js': 20, 'assets/js/dojo-seiten.js': 28, 'assets/js/dojo-extra.js': 9, 'assets/js/gratis.js': 9, 'assets/js/kompass.js': 5, 'assets/data/suche.json': 10, 'assets/fonts/dojo-display-600.woff2': 25, 'assets/fonts/dojo-display-700.woff2': 25, 'index.html': 60, 'templates/partials/tusch.svg': 4 };

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
function datumCH(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; }
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
function partial(name) {
  if (!partialCache[name]) {
    const datei = ['html', 'svg'].map(e => `templates/partials/${name}.${e}`).find(gibtEs);
    if (!datei) { fehler(`Partial fehlt: templates/partials/${name}`); return ''; }
    partialCache[name] = lies(datei).replace(/\s+$/, '');
  }
  return partialCache[name];
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

/* Wortmarke als Pfade (keine Schrift) */
const GLYPHEN = {
  K: [9, 'M1 0V14M8 0L1.5 7.5M3.6 5.6L8.5 14'], M: [11, 'M1 14V0L5.5 9L10 0V14'], U: [9, 'M1 0V10.5A3.5 3.5 0 0 0 8 10.5V0'],
  p: [8, 'M1 18V4M1 7.5A3 3 0 0 1 7 7.5V10.5A3 3 0 0 1 1 10.5'], o: [8, 'M1 7.5A3 3 0 0 1 7 7.5V10.5A3 3 0 0 1 1 10.5Z'],
  w: [11, 'M1 4L3.2 14L5.5 6.5L7.8 14L10 4'], e: [8, 'M1.2 9H7V7.5A3 3 0 0 0 1 7.5V10.5A3 3 0 0 0 4 13.5H7'],
  r: [6.5, 'M1 14V4M1 8A4 4 0 0 1 5 4H6'], D: [9.5, 'M1 0H4A4.5 4.5 0 0 1 8.5 4.5V9.5A4.5 4.5 0 0 1 4 14H1Z'],
  // j als Kleinbuchstabe: Stamm ab x-Hoehe, Punkt deutlich getrennt (eckige Linienenden ragen 1.15 ueber), Unterlaenge unter das o
  j: [2.4, 'M1.2 4.8V15.5A2.5 2.5 0 0 1 -1.3 18M1.2 .6V.7'], ' ': [3.5, '']
};
function wortmarkePfad(text) {
  let x = 0; const teile = [];
  for (const z of text) {
    const [b, d] = GLYPHEN[z];
    if (d) teile.push(d.replace(/([MLHVAZ])([^MLHVAZ]*)/g, (m, c, args) => {
      if (c === 'Z') return 'Z';
      const n = args.trim().split(/[\s,]+/).map(Number);
      if (c === 'H') return 'H' + r1(n[0] + x);
      if (c === 'V') return 'V' + n[0];
      if (c === 'A') return `A${n[0]} ${n[1]} ${n[2]} ${n[3]} ${n[4]} ${r1(n[5] + x)} ${n[6]}`;
      return c + r1(n[0] + x) + ' ' + n[1];
    }));
    x += b + 1.6;
  }
  return { d: teile.join(''), breite: r1(x - 1.6) };
}
function r1(n) { return Math.round(n * 10) / 10; }
const WM = wortmarkePfad('KMUpower Dojo');
function wortmarke(srText = '') {
  return `<svg class="marke__wort" viewBox="-1.5 -1.5 ${r1(WM.breite + 3)} 21" width="${Math.round((WM.breite + 3) * 1.3)}" height="27" aria-hidden="true" focusable="false"><path d="${WM.d}"/></svg>${srText ? `<span class="sr-only">${srText}</span>` : ''}`;
}

/* Tusch */
function tusch(pose, extra = '') {
  return `<span class="tusch tusch--${pose}${extra ? ' ' + extra : ''}" data-tusch aria-hidden="true">${partial('tusch')}</span>`;
}

/* Daten laden */
let daten;
try { daten = JSON.parse(lies('data/techniken.json')); }
catch (e) { console.error(`data/techniken.json ist nicht lesbar: ${e.message}`); process.exit(1); }
const GUERTEL = GUERTEL_STANDARD.map(g => ({ ...g, leitwort: '', kannst_du: '', erreicht_satz: '', ...((daten.guertel || []).find(x => x.nr === g.nr) || {}) }));
GUERTEL.forEach(g => { g.anker = ANKER[g.farbe] || `guertel-${g.nr}`; if (!g.kurz) g.kurz = GUERTEL_STANDARD[g.nr - 1].kurz; });
const gName = (n) => (GUERTEL[n - 1] || {}).name || `Gürtel ${n}`;
const ALLE = Array.isArray(daten.techniken) ? daten.techniken : [];

/* Validierung */
const PFLICHT = ['id', 'slug', 'titel', 'guertel', 'werkzeug', 'zielgruppe', 'problem', 'technik_text', 'so_nutzt_du_es', 'das_darfst_du_erwarten', 'grenzen', 'quelle_url', 'quelle_titel', 'geprueft_am', 'dauer_min', 'teilen_text'];
const VERBOTEN = [[/[\u2013\u2014]/, 'Gedankenstrich'], [/\u00df/, 'Eszett'], [/\p{Extended_Pictographic}/u, 'Emoji'], [/getestet/i, '«getestet»'], [/garantiert/i, '«garantiert»'], [/offiziell/i, '«offiziell»'], [/zertifiziert/i, '«zertifiziert»'], [/\bM365\b/i, '«M365»'], [/copilot[\s-]ninja/i, '«Copilot-Ninja»']];
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
  texteVon(daten.guertel || [], 'guertel', []).forEach(([p, t]) => VERBOTEN.forEach(([re, w]) => re.test(t) && fehler(`${p}: enthält ${w}`)));
  for (const t of ALLE) {
    const wo = t.id || '(ohne id)';
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
validiere();

/* Auswahl je Modus */
const istFrei = (t) => istIso(t.freigabe) && (!t.offen_pruefen || !t.offen_pruefen.length);
const DABEI = MODUS === 'produktion' ? ALLE.filter(istFrei) : ALLE.slice();
if (MODUS === 'produktion') ALLE.filter(t => !istFrei(t)).forEach(t => warnung(`Produktion: ${t.id} ausgelassen (${!istIso(t.freigabe) ? 'keine Freigabe' : 'offen_pruefen nicht leer'})`));
// Der Pruefstempel nennt das Datum der Lesung gegen Learn. Liest Marcel bei der Freigabe selbst nach, gehoert sein Datum in geprueft_am.
if (MODUS === 'produktion') ALLE.filter(t => istFrei(t) && istIso(t.geprueft_am) && t.freigabe > t.geprueft_am).forEach(t => warnung(`Produktion: ${t.id} freigegeben am ${t.freigabe}, geprueft_am ${t.geprueft_am}. Hast du die Quellen bei der Freigabe gelesen, setz geprueft_am auf dieses Datum.`));
const sortiert = DABEI.slice().sort((a, b) => a.guertel - b.guertel || (a.typ === b.typ ? (a.nr || 0) - (b.nr || 0) || a.id.localeCompare(b.id) : a.typ === 'grundform' ? -1 : 1));
const TECHNIKEN = sortiert.filter(t => t.typ === 'technik');
const GRUNDFORMEN = sortiert.filter(t => t.typ === 'grundform');
const NACH_ID = Object.fromEntries(DABEI.map(t => [t.id, t]));
const ALLE_NACH_ID = Object.fromEntries(ALLE.map(t => [t.id, t]));
const ANZAHL = MODUS === 'produktion' ? TECHNIKEN.length : 25;
const STAND = DABEI.map(t => t.geprueft_am).filter(istIso).sort().pop() || daten.stand || DATUM;
const VORSCHAU = MODUS !== 'produktion';
const ohneFreigabe = (liste) => VORSCHAU && liste.some(t => t && !istFrei(t));
const neuGrenze = (() => { const d = new Date(DATUM + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 30); return d.toISOString().slice(0, 10); })();
const alleNeu = DABEI.length && DABEI.filter(t => t.datum_publiziert >= neuGrenze).length > DABEI.length / 2;
const urlTechnik = (t) => `${BASE_URL}techniken/${t.slug}/`;
const nrLabel = (t) => t.typ === 'technik' ? pad2(t.nr) : t.id.toUpperCase();
const frist = (t) => t.klasse === 'zeitlos' ? 400 : 120;
const mailtoBeitrag = 'mailto:' + KONTAKT + '?subject=' + encodeURIComponent('Technik für das Dojo') + '&body=' + encodeURIComponent('Titel der Technik:\n\nProblem, das sie löst:\n\nPrompt oder Anleitung:\n\nGrenzen:\n\nQuelle bei Microsoft Learn:\n\nDarf ich dich als Absender nennen? (ja oder nein)\n\nBitte keine Kunden-, Personen- oder Firmendaten im Prompt.');

/* Gratis-Anker */
let gratisIds = null;
if (gibtEs('gratis/index.html')) gratisIds = new Set([...lies('gratis/index.html').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
for (const t of DABEI) {
  const anker = t.zugang_anker || (ZUGANG[t.zugang] || {}).anker;
  if (!anker) continue;
  if (!gratisIds || !gratisIds.has(anker)) (LOCKER ? warnung : fehler)(`${t.id}: Anker #${anker} fehlt in gratis/index.html`);
}

/* Bausteine */
function zugangBadge(t, r, kurz = false) {
  const z = ZUGANG[t.zugang]; if (!z) return '';
  const anker = t.zugang_anker || z.anker;
  const text = kurz ? z.kurz : (t.zugang_text || z.kurz);
  return `<a class="zugang zugang--${z.klasse}" href="${r}gratis/#${esc(anker)}">${z.icon}${esc(text)}</a>`;
}
function artBadge(t) { const a = ART[t.art]; return a ? `<span class="art art--${t.art}">${a.icon}${a.name}</span>` : ''; }
function knoten(n, text, extra = '') { return `<span class="knoten${extra}" data-guertel-nr="${n}">${esc(text)}</span>`; }
function stempel(datum, fristTage, ziel, klasse = '') {
  return render(partial('stempel'), { stempel_klasse: klasse ? ' ' + klasse : '', stempel_ziel: ziel, stempel_datum: datum, stempel_frist: fristTage, stempel_datum_ch: datumCH(datum) }, 'stempel');
}
function phSpan(name, hinweis) {
  const zeige = hinweis ? (/^z\.\s?B\./.test(hinweis) ? `[${name}, ${hinweis}]` : `[${name}, z. B. ${hinweis}]`) : `[${name}]`;
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
const TEILE = { Ziel: 'ziel', Kontext: 'kontext', Quelle: 'quelle', Erwartung: 'erwartung' };
function textMitTeilen(text, hinweise) {
  return text.split(/(\n[ \t]*\n)/).map((absatz, i) => {
    if (i % 2) return absatz;
    const m = absatz.match(/^(Ziel|Kontext|Quelle|Erwartung):/);
    if (!m) return textHtml(absatz, hinweise);
    return `<mark class="teil teil--${TEILE[m[1]]}"><span class="teil__label">${m[1]}:</span>${textHtml(absatz.slice(m[0].length), hinweise)}</mark>`;
  }).join('');
}
function herkunft(t) {
  const adresse = t.typ === 'technik' ? `${KURZ_BASIS}/${t.nr}` : urlTechnik(t);
  return `Technik aus dem KMUpower Dojo: ${adresse}\nEntwurf, geprüft gegen die Dokumentation am ${datumCH(t.geprueft_am)}`;
}
function schmiedeHtml(t, praefixId, ebene = 'h3') {
  const felder = Object.entries(t._felder || {});
  if (!felder.length) return '';
  const profil = felder.some(([n]) => ['Firmenname', 'Funktion', 'Branche'].includes(n));
  const lang = /(text|notizen|inhalt|entwurf|mail|anweisungen?|verlauf|reglement|offerten?|liste|fall|chat)$/i;
  const html = felder.map(([name, hinweis], i) => {
    const id = `${praefixId}-f${i + 1}`;
    const breit = lang.test(name) || hinweis.length > 40;
    const feld = breit
      ? `<textarea id="${id}" data-ph-feld="${esc(name)}" rows="4"${hinweis ? ` aria-describedby="${id}-h"` : ''}></textarea>`
      : `<input id="${id}" type="text" data-ph-feld="${esc(name)}" autocomplete="off"${hinweis ? ` aria-describedby="${id}-h"` : ''}>`;
    return `<div class="schmiede__feld${breit ? ' schmiede__feld--breit' : ''}"><label for="${id}">${esc(name)}</label>${feld}${hinweis ? `<small id="${id}-h">${esc(/^z\.\s?B\./.test(hinweis) ? hinweis : 'z. B. ' + hinweis)}</small>` : ''}</div>`;
  }).join('\n');
  return `<div class="schmiede" data-nur-js>
<div class="schmiede__kopf"><${ebene}>Für dich anpassen</${ebene}><p class="schmiede__hinweis">Nichts verlässt deinen Browser.${profil ? ' Firmenname, Funktion und Branche kommen aus deinem Profil unter Mein Dojo.' : ''}</p></div>
${html}
</div>`;
}
function rolleHtml(t, preId, titel, text, mitTeilen, erfolg, knopfText) {
  const inhalt = mitTeilen ? textMitTeilen(text, t._felder) : textHtml(text, t._felder);
  return `<div class="rolle" data-rolle>
<div class="rolle__kopf"><p class="rolle__titel">${esc(titel)}</p></div>
<pre class="code" id="${preId}">${inhalt}</pre>
<div class="rolle__knoepfe"><button type="button" class="knopf knopf--primaer knopf--klein" data-kopieren="${preId}" data-erfolg="${esc(erfolg)}" data-nur-js>${esc(knopfText)}</button><button type="button" class="knopf knopf--klein" data-weitergeben="${preId}" data-herkunft="${esc(herkunft(t)).replace(/\n/g, '&#10;')}" data-nur-js>Weitergeben</button><p class="rolle__status" role="status"></p></div>
</div>`;
}
function rollenFuer(t, praefixId) {
  const a = ART[t.art] || ART.pinselstrich;
  const haupt = rolleHtml(t, praefixId, a.rolle, t.technik_text, t.art !== 'kata' || /^(Ziel|Kontext):/m.test(t.technik_text), a.erfolg, a.knopf);
  const zusatz = (t.zusatz_texte || []).map((z, i) => rolleHtml(t, `${praefixId}-${i + 2}`, z.titel || `Schritt ${i + 2}`, z.text || '', /^(Ziel|Kontext):/m.test(z.text || ''), ART.kata.erfolg, 'Text kopieren')).join('\n');
  return haupt + (zusatz ? '\n' + zusatz : '');
}
function karte(t, r, mitNutzen = true) {
  const kurzAdresse = t.typ === 'technik' ? `${KURZ_BASIS}/${t.nr}` : '';
  const neu = !alleNeu && t.datum_publiziert >= neuGrenze ? ' karte--neu' : '';
  return `<li class="karte${t.typ === 'grundform' ? ' karte--grundform' : ''}${neu}" data-technik="${t.id}" data-guertel-nr="${t.guertel}" data-zugang="${esc(t.zugang || '')}" data-art="${esc(t.art || '')}" data-werkzeug="${esc((t.werkzeug || []).join(' '))}">
<div class="karte__oben"><span class="karte__nr">${t.typ === 'technik' ? pad2(t.nr) : 'Grundform ' + t.id.toUpperCase()}</span>${neu ? '<span class="tag">Neu</span>' : ''}</div>
<h3 class="karte__titel"><a href="${r}techniken/${t.slug}/">${esc(t.titel)}</a></h3>
${t.titel !== t.klartitel && t.klartitel ? `<p class="karte__klartitel">${esc(t.klartitel)}</p>` : ''}
${mitNutzen && t.nutzen ? `<p class="karte__nutzen">${esc(t.nutzen)}</p>` : ''}
<div class="karte__meta">${zugangBadge(t, r, true)}${artBadge(t)}<span>ca. ${t.dauer_min} Min.</span><span class="karte__status" data-status hidden></span>${kurzAdresse ? `<span class="karte__kurz nur-druck">${kurzAdresse}</span>` : ''}</div>
</li>`;
}
function kompakt(t, r) {
  return `<li class="karte-kompakt" data-technik="${t.id}" data-guertel-nr="${t.guertel}"><span class="karte-kompakt__nr">${nrLabel(t)}</span><a class="karte-kompakt__link" href="${r}techniken/${t.slug}/">${esc(t.titel)}</a>${t.klartitel && t.klartitel !== t.titel ? `<span class="klein">${esc(t.klartitel)}</span>` : ''}${zugangBadge(t, r, true)}</li>`;
}
const NOCH_NICHT = 'Noch nicht freigegeben. Erscheint, sobald Marcel die Techniken gegen die Dokumentation geprüft hat.';
// Die Schwelle erscheint nur, wenn im Build Agent-Techniken (ab Gruen) stehen. Sonst folgte dem Kurshinweis nur
// «Noch nicht freigegeben», und der Agent-Teil saehe aus wie hinter dem Kurs versteckt (Konzept 7.2).
const MIT_AGENTS = DABEI.some(t => t.guertel >= 4);
// Kursname laut Academy ab 15.10.2026 (Entscheid Marcel: Disclaimer reicht), URL bleibt copilot-expert
const KURS_NAME = 'Copilot Ninja in 4 Wochen';
const KURS_EIGEN = 'Der Kurs hat einen eigenen Lehrplan und folgt nicht den Gürteln dieser Seite.';
function schwelleHtml(ebene = 'h3', extra = '') {
  if (!MIT_AGENTS) return '';
  return `<aside class="schwelle${extra}" aria-labelledby="schwelle-titel">
<span class="label">Die Schwelle</span>
<${ebene} id="schwelle-titel">Ab hier baust du Agents.</${ebene}>
<p>In der Testversion von Copilot Studio kannst du einen Agent erstellen und im Testchat prüfen, aber nicht veröffentlichen (<a href="${LEARN_TESTVERSION}" rel="noopener">Microsoft Learn</a>, Stand 13.10.2026). Alle Agent-Techniken stehen hier frei, ohne Anmeldung.</p>
<p class="klein">Wer lieber mit Begleitung übt: Die Power Platform Academy führt den Live-Kurs «${KURS_NAME}», Termine offen, Vormerken unverbindlich. ${KURS_EIGEN} <a href="${esc(KURS_URL('schwelle'))}" rel="noopener">Zur Kursseite</a></p>
</aside>`;
}
// Startseite: kompakter Pfad (Korrektur 15.10.2026). Je Guertel Leitwort, «Was du danach kannst», Anzahl und ein Beispiel.
// Die volle Liste steht nur auf /techniken/.
function guertelpfadHtml(r) {
  const stufe = (g) => {
    const drin = sortiert.filter(t => t.guertel === g.nr);
    const tk = drin.filter(t => t.typ === 'technik');
    const bsp = tk[0] || drin[0];
    const anzahl = tk.length ? `${tk.length} ${tk.length === 1 ? 'Technik' : 'Techniken'}` : `${drin.length} ${drin.length === 1 ? 'Grundform' : 'Grundformen'}`;
    return `<li class="pfad__stufe" data-guertel-nr="${g.nr}" id="pfad-${g.farbe}">
<span class="pfad__linie" aria-hidden="true"></span><span class="pfad__punkt" aria-hidden="true"></span>
<h3><span class="pfad__leitwort">Stufe ${g.nr}${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span>${esc(g.name)}</h3>
${g.kannst_du ? `<p class="pfad__kannst">${esc(g.kannst_du)}</p>` : ''}
${drin.length ? `<p class="pfad__meta"><a href="${r}techniken/#${g.anker}">${anzahl}</a> <span>Zum Beispiel <a href="${r}techniken/${bsp.slug}/">${bsp.typ === 'technik' ? pad2(bsp.nr) + ' ' : ''}${esc(bsp.titel)}</a></span></p>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
<p class="fortschritt__text" data-fortschritt="${g.nr}" hidden></p>
</li>`;
  };
  return `<ol class="pfad pfad--kompakt">${GUERTEL.slice(0, 3).map(stufe).join('\n')}</ol>
${schwelleHtml()}
<ol class="pfad pfad--kompakt" start="4">${GUERTEL.slice(3).map(stufe).join('\n')}</ol>`;
}
function vierWochenHtml(r, ebene) {
  const sub = ebene === 'h2' ? 'h3' : 'h4';
  let fehltWoche = false;
  const wochen = WOCHEN.map(w => {
    const liste = w.ergebnisse.filter(([id]) => NACH_ID[id]).map(([id, text]) => { const t = NACH_ID[id]; return `<li>${esc(text)} (<a href="${r}techniken/${t.slug}/">Nr. ${t.nr}</a>)</li>`; });
    if (!liste.length) fehltWoche = true;
    return `<li class="woche"><span class="woche__nr" aria-hidden="true">${w.nr}</span>
<${sub}>Woche ${w.nr}</${sub}>
<div class="woche__guertel">${w.guertel.map(n => knoten(n, GUERTEL[n - 1].kurz)).join('')}</div>
${liste.length ? `<p>Wenn du die Techniken dieser Woche übst, hast du danach in der Hand:</p><ul class="woche__ergebnis">${liste.join('')}</ul>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
</li>`;
  }).join('\n');
  // Eigene ID (vorher doppelt «h-pfad» auf der Startseite). Der Kalenderknopf steht im HTML, damit beim Laden nichts springt.
  return `<div class="vier-wochen" id="vier-wochen">
<span class="label">Vier-Wochen-Pfad zum Selbstlernen</span>
<${ebene} id="h-vier-wochen"${ebene === 'h3' ? ' class="h2-gross"' : ''}>In vier Wochen durch alle Gürtel</${ebene}>
<p class="lead">Ein freier Plan, ohne Anmeldung und ohne Kurs. Jede Woche ein oder zwei Gürtel.</p>
<ol class="wochen">${wochen}</ol>
${fehltWoche ? '' : '<p class="pfad-schluss">Nach vier Wochen hast du einen eigenen Agent mit Testfragen, Schutzbaustein, Credit-Schätzung und Betriebsblatt.</p>'}
<p class="klein">Was du dafür brauchst, zeigt der Zugang auf jeder Technik.</p>
<p class="knopf-reihe nicht-drucken"><button type="button" class="knopf" data-wochen-ics data-nur-js>Vier Wochen in den Kalender, ab nächstem Montag</button></p>
</div>`;
}
function heuteTechnik() {
  const folge = (daten.tag_reihenfolge || []).filter(id => NACH_ID[id] && NACH_ID[id].typ === 'technik');
  if (!folge.length) return null;
  const start = istIso(daten.tag_start) ? daten.tag_start : DATUM;
  const n = ((tageZwischen(start, DATUM) % folge.length) + folge.length) % folge.length;
  return NACH_ID[folge[n]];
}
function heuteHtml(t, r, ebene) {
  if (!t) return `<div class="naechster"><p>${NOCH_NICHT}</p><p><a href="${r}techniken/">Zur Technik-Wand</a></p></div>`;
  return `<article class="karte--gross rolle-gross" data-technik="${t.id}" data-guertel-nr="${t.guertel}" data-schmiede>
<div class="heute__kopf"><span class="heute__nr" aria-hidden="true">${pad2(t.nr)}</span><div>
<${ebene} class="heute__titel">${esc(t.titel)}<small>Nr. ${t.nr}: ${esc(t.klartitel)}</small></${ebene}>
<ul class="metazeile"><li>${knoten(t.guertel, gName(t.guertel))}</li><li>${zugangBadge(t, r)}</li><li><span>Ausprobieren: ca. ${t.dauer_min} Min.</span></li></ul>
</div></div>
<p class="abschnitt__problem">${esc(t.problem)}</p>
${schmiedeHtml(t, 'heute', ebene === 'h2' ? 'h3' : 'h4')}
${rolleHtml(t, 'heute-text', (ART[t.art] || ART.pinselstrich).rolle, t.technik_text, true, (ART[t.art] || ART.pinselstrich).erfolg, (ART[t.art] || ART.pinselstrich).knopf)}
<p><a class="knopf knopf--leise" href="${r}techniken/${t.slug}/">Ganze Technik mit Anleitung, Grenzen und Quelle</a></p>
</article>`;
}
function filterHtml() {
  const werkzeuge = [...new Set(DABEI.flatMap(t => t.werkzeug || []))].filter(w => PRODUKTNAMEN[w]);
  const zugaenge = Object.keys(ZUGANG).filter(z => DABEI.some(t => t.zugang === z));
  const arten = Object.keys(ART).filter(a => DABEI.some(t => t.art === a));
  const chip = (f, v, text, k = '') => `<button type="button" class="chip" data-f="${f}" data-v="${esc(v)}" aria-pressed="false">${k}${esc(text)}</button>`;
  return `<div class="filter nicht-drucken" data-filter data-nur-js>
<fieldset><legend>Gürtel</legend><div class="chips">${GUERTEL.map(g => chip('guertel-nr', g.nr, g.kurz, `<span class="knoten" data-guertel-nr="${g.nr}" aria-hidden="true"></span>`)).join('')}</div></fieldset>
<fieldset><legend>Werkzeug</legend><div class="chips">${werkzeuge.map(w => chip('werkzeug', w, PRODUKTNAMEN[w])).join('')}</div></fieldset>
<fieldset><legend>Zugang</legend><div class="chips">${zugaenge.map(z => chip('zugang', z, ZUGANG[z].kurz)).join('')}</div></fieldset>
<fieldset><legend>Art</legend><div class="chips">${arten.map(a => chip('art', a, `${ART[a].name} (${ART[a].wort})`)).join('')}</div></fieldset>
<fieldset><legend>Dein Stand</legend><div class="chips">${chip('stand', 'offen', 'Noch offen')}${chip('stand', 'geuebt', 'Geübt')}</div></fieldset>
<div class="filter__fuss"><p class="filter__zaehler" data-filter-zaehler role="status" aria-live="polite"></p><button type="button" class="knopf knopf--leise knopf--klein" data-filter-reset>Filter zurücksetzen</button></div>
</div>`;
}
function wandAbschnitte(r) {
  return GUERTEL.map(g => {
    const gf = GRUNDFORMEN.filter(t => t.guertel === g.nr), tk = TECHNIKEN.filter(t => t.guertel === g.nr);
    const teil = `<section class="guertel-abschnitt sektion--eng" id="${g.anker}" aria-labelledby="h-${g.anker}" data-guertel-nr="${g.nr}">
<h2 id="h-${g.anker}"><span class="pfad__leitwort">Stufe ${g.nr}${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span>${knoten(g.nr, g.name, ' knoten--gross')}</h2>
${g.kannst_du ? `<p class="prose">Was du danach kannst: ${esc(g.kannst_du)}</p>` : ''}
${gf.length ? `<p class="label">Aufwärmen</p><ul class="karten">${gf.map(t => karte(t, r)).join('\n')}</ul>` : ''}
${tk.length ? `${gf.length ? '<p class="label">Techniken</p>' : ''}<ul class="karten">${tk.map(t => karte(t, r)).join('\n')}</ul>` : (gf.length ? '' : `<p class="pfad__offen">${NOCH_NICHT}</p>`)}
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
  return `    <section class="abschnitt" aria-labelledby="h-rechner">
      <h2 id="h-rechner">Der Kompass</h2>
      <div class="rechner" data-kompass data-raten="${esc(JSON.stringify(r))}">
        <p>Raten laut Microsoft in ${esc(r.einheit || 'Copilot Credits')}: ${(r.raten || []).map(x => `${esc(x.name)} ${x.credits}`).join(', ')}.</p>
        <p>Rechenbeispiel: ${b.gespraeche} Gespräche im Monat mit je ${b.generativ} Generative Answers und ${b.aktion} Agent Action ergeben ${b.gespraeche} mal ${jeGespraech}, also <span class="rechner__ergebnis">${summe.toLocaleString('de-CH')}</span> Copilot Credits. ${esc(b.hinweis || '')}</p>
        <ul class="arrow-list">${(r.regeln || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${r.lizenz_hinweis ? `<p>${esc(r.lizenz_hinweis)}</p>` : ''}
        <p class="klein">Quelle: ${[{ url: r.quelle_url, titel: r.quelle_titel }, ...(r.weitere_quellen || [])].map(q => `<a href="${esc(q.url)}" rel="noopener">${esc(q.titel)}</a>`).join(', ')}, Stand ${datumCH(r.geprueft_am)}. Kein Preis pro Credit, Preise findest du bei Microsoft.</p>
      </div>
    </section>
`;
}
function schnittKarte(t) {
  if (!t) return '';
  return `<div class="schnitt" id="schnitt-karte" data-schnitt data-technik="${t.id}">
<div class="schnitt__fuss"><span class="label">Der Schnitt</span><div class="schnitt__umschalter" role="group" aria-label="Ansicht"><button type="button" data-zeige="vorher" aria-pressed="false">Vorher</button><button type="button" data-zeige="nachher" aria-pressed="true">Nachher</button></div></div>
<div class="schnitt__buehne">
<div class="schnitt__vorher"><span class="label">Vorher</span><p class="schnitt__zitat">«${esc(t.vorher)}»</p></div>
<div class="schnitt__nachher"><span class="label">Nachher</span><pre class="code" id="schnitt-text">${textMitTeilen(t.technik_text, t._felder)}</pre></div>
<svg class="schnitt__strich" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M3 66C28 58 58 44 97 30"/></svg>
</div>
<ul class="teile-legende" aria-label="Die vier Teile eines wirksamen Prompts"><li class="teil--ziel">Ziel</li><li class="teil--kontext">Kontext</li><li class="teil--quelle">Quelle</li><li class="teil--erwartung">Erwartung</li></ul>
<div class="schnitt__fuss" data-rolle><button type="button" class="knopf knopf--primaer knopf--klein" data-kopieren="schnitt-text" data-nur-js>Prompt kopieren</button><p class="rolle__status" role="status"></p></div>
<p class="schnitt__hinweis">Beispiel. Die Antwort kann je nach Lizenz und Daten anders ausfallen. Die vier Teile nennt das Lernmodul <a href="${LEARN_PROMPTS}" rel="noopener">«Write effective prompts»</a> bei Microsoft Learn, Stand 15.10.2026.</p>
</div>`;
}
// Mobiler Haken direkt unter der H1 (Korrektur 15.10.2026): Tusch, der schwache Prompt mit Pinselstrich, die vier Teile.
// Auf breiten Bildschirmen steht daneben die ganze Schnitt-Karte, dort ist der Haken ausgeblendet.
function schnittHaken(t) {
  if (!t || !t.vorher) return '';
  return `        <a class="haken" href="#schnitt-karte">
          ${tusch('zeigen', 'tusch--zeichnen')}
          <span class="haken__text"><span class="haken__vorher">«${esc(t.vorher)}»<svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 13C30 9 66 7 99 8"/></svg></span><span class="haken__nachher">Daraus werden vier Teile: <b class="teil--ziel">Ziel</b>, <b class="teil--kontext">Kontext</b>, <b class="teil--quelle">Quelle</b>, <b class="teil--erwartung">Erwartung</b>.</span></span>
        </a>`;
}

/* Seitenrahmen */
const MARKEN = (() => {
  const texte = [];
  for (const d of ['gratis/index.html', 'ueber/index.html']) if (gibtEs(d)) texte.push(lies(d));
  texte.push(JSON.stringify(DABEI));
  const alles = texte.join('\n');
  const dazu = MARKEN_KANDIDATEN.filter(m => alles.includes(m));
  return [...new Set([...MARKEN_BASIS, ...dazu])].sort((a, b) => a.localeCompare(b, 'de'));
})();
function markenText() { return MARKEN.slice(0, -1).join(', ') + ' und ' + MARKEN[MARKEN.length - 1]; }
const NAV_ZIEL = { wand: 'techniken', technik: 'techniken', heute: 'techniken', gratis: 'gratis', dojo: 'dojo', test: 'dojo', guertel: 'dojo', ueber: 'ueber' };
function rahmenKontext(r, seite, extra = {}) {
  const ziel = NAV_ZIEL[seite];
  const cur = (n) => ziel === n ? (/^(wand|gratis|dojo|ueber)$/.test(seite) ? ' aria-current="page"' : ' aria-current="true"') : '';
  const cssExtra = seite === 'gratis' ? `<link rel="stylesheet" href="${r}assets/css/gratis.css">\n` : /^(dojo|test|guertel)$/.test(seite) ? `<link rel="stylesheet" href="${r}assets/css/dojo.css">\n` : seite === 'technik' ? `<link rel="stylesheet" href="${r}assets/css/technik.css">\n` : '';
  return {
    r, css_extra: cssExtra, js_extra: '', vorschau_banner: '',
    tusch_marke: tusch('ruhe'), tusch_fuss: tusch('ruhe'), wortmarke: wortmarke(),
    icon_suche: ICONS.suche, icon_zufall: ICONS.zufall, icon_sonne: ICONS.sonne, icon_mond: ICONS.mond, icon_menue: ICONS.menue, icon_zu: ICONS.zu,
    cur_techniken: cur('techniken'), cur_gratis: cur('gratis'), cur_dojo: cur('dojo'), cur_ueber: cur('ueber'),
    mailto_beitrag: mailtoBeitrag, markenliste: markenText(),
    newsletter_footer: NEWSLETTER_URL('footer'), academy_footer: ACADEMY_URL('footer'),
    ...extra
  };
}
function metaHtml(p) {
  const zeilen = [GENERATOR, `<title>${esc(p.titel)}</title>`, `<meta name="description" content="${esc(p.beschreibung)}">`];
  if (p.noindex) zeilen.push('<meta name="robots" content="noindex">');
  if (p.canonical) zeilen.push(`<link rel="canonical" href="${p.canonical}">`);
  const bild = p.ogBild || `${BASE_URL}og-image.png`;
  zeilen.push(
    `<meta property="og:type" content="${p.ogTyp || 'website'}">`, '<meta property="og:site_name" content="KMUpower Dojo">', '<meta property="og:locale" content="de_CH">',
    `<meta property="og:title" content="${esc(p.ogTitel || p.titel)}">`, `<meta property="og:description" content="${esc(p.ogBeschreibung || p.beschreibung)}">`);
  if (p.canonical) zeilen.push(`<meta property="og:url" content="${p.canonical}">`);
  zeilen.push(`<meta property="og:image" content="${bild}">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(p.ogAlt || 'KMUpower Dojo: Übung schlägt Hype.')}">`, '<meta name="twitter:card" content="summary_large_image">');
  if (p.jsonld) zeilen.push(jsonLd({ '@context': 'https://schema.org', '@graph': p.jsonld }));
  return zeilen.join('\n');
}
const LD_WEBSITE = { '@type': 'WebSite', '@id': `${BASE_URL}#website`, name: 'KMUpower Dojo', url: BASE_URL, inLanguage: 'de-CH', description: 'Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio mit Quelle und Prüfdatum. Unabhängige Website ohne Verbindung zu Microsoft.', publisher: { '@id': 'https://kmupower.com/#organization' } };
const LD_ORG = { '@type': 'Organization', '@id': 'https://kmupower.com/#organization', name: 'KMUpower', legalName: 'Marcel Lehmann (Handelsname KMUpower)', url: 'https://kmupower.com/', founder: { '@type': 'Person', name: 'Marcel Lehmann' } };
const LD_AUTOR = { '@type': 'Person', name: 'Marcel Lehmann', url: 'https://kmupower.com/', worksFor: { '@id': 'https://kmupower.com/#organization' } };
function ldKrumen(teile) { return { '@type': 'BreadcrumbList', itemListElement: teile.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) }; }
function seite(rel, p) {
  // 404 liegt in jeder Tiefe: Pfade ab der Wurzel der Basis. Volle URLs waeren auf einer eigenen Domain fremde Herkunft (CSP «self»)
  const r = p.absolut ? new URL(BASE_URL).pathname : praefix(rel);
  const ctx = rahmenKontext(r, p.seite, p.ctx || {});
  if (p.banner && !TESTPHASE) ctx.vorschau_banner = '<p class="vorschau-banner">Interne Vorschau, nicht veröffentlichen.</p>\n';
  if (p.jsExtra) ctx.js_extra = p.jsExtra.map(s => `<script src="${r}${s}" defer></script>\n`).join('');
  const kopf = render(partial('head'), ctx, 'head');
  const haupt = render(lies(`templates/${p.template}`), { ...ctx, ...p.daten }, p.template);
  const html = `<!doctype html>
<html lang="de-CH" data-seite="${p.seite}">
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

/* Seiten erzeugen */
function baueStart() {
  const heute = heuteTechnik();
  const g1 = NACH_ID.g1;
  const ohneZl = TECHNIKEN.filter(t => t.zugang === 'ohne-zl' || t.zugang === 'agent-builder').length;
  const bilanz = TECHNIKEN.length
    ? `${ohneZl === TECHNIKEN.length ? 'Alle ' + ohneZl : ohneZl + ' der ' + TECHNIKEN.length} Techniken laufen ohne Zusatzlizenz, wenn dein Abo Copilot Chat enthält. <a href="techniken/?zugang=ohne-zl&amp;zugang=agent-builder">Diese Techniken zeigen</a>`
    : 'Viele Techniken laufen in Microsoft Copilot Chat. Ob Copilot Chat in deinem Abo ohne Zusatzlizenz enthalten ist, zeigt der Gratis-Check.';
  const momente = MOMENTE.filter(([id]) => NACH_ID[id]).map(([id, satz]) => { const t = NACH_ID[id]; return `<li class="moment"><blockquote><p>«${esc(satz)}»</p></blockquote><a href="techniken/${t.slug}/"><span>Technik ${pad2(t.nr)}</span> ${esc(t.titel)}</a></li>`; });
  const momenteHtml = momente.length ? `  <section class="sektion" aria-labelledby="h-momente">
    <div class="wrap">
      <div class="sektion__kopf"><span class="label">Vier Momente</span><h2 id="h-momente">Wann brauchst du es?</h2></div>
      <ul class="momente">${momente.join('\n')}</ul>
    </div>
  </section>` : '';
  const erste = TECHNIKEN[0] || sortiert[0];
  const auf = [heute, g1, ...momente.map((_, i) => NACH_ID[MOMENTE[i][0]]), ...TECHNIKEN];
  seite('index.html', {
    seite: 'start', template: 'start.html',
    titel: 'KMUpower Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio',
    beschreibung: `${ANZAHL} Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio, vom weissen bis zum schwarzen Gürtel. Jede mit Quelle bei Microsoft Learn und Prüfdatum.`,
    ogTitel: 'KMUpower Dojo: Übung schlägt Hype.',
    canonical: BASE_URL, banner: ohneFreigabe(auf.filter(Boolean)),
    jsonld: [LD_WEBSITE, LD_ORG],
    jsExtra: ['assets/js/gratis.js'],
    daten: {
      anzahl: ANZAHL, build_datum: DATUM,
      erste_technik_url: erste ? `techniken/${erste.slug}/` : 'techniken/',
      tusch_hero: tusch('ruhe', 'tusch--zeichnen'), tusch_dojo: tusch('ruhe'), tusch_zeigen: tusch('zeigen'), tusch_seite: tusch('lesend'),
      schnitt_haken: schnittHaken(g1),
      schnitt_karte: schnittKarte(g1) || `<div class="schnitt"><p>${NOCH_NICHT}</p></div>`,
      stempel_hero: stempel(STAND, 120, 'ueber/#methode', 'stempel--gross'),
      heute_inhalt: heuteHtml(heute, '', 'h3'),
      momente: momenteHtml, guertelpfad: guertelpfadHtml(''), bilanz_satz: bilanz,
      kurs_trainer: KURS_URL('start-trainer'), newsletter_trainer: NEWSLETTER_URL('start-trainer')
    }
  });
}
function baueWand() {
  const r = '../';
  seite('techniken/index.html', {
    seite: 'wand', template: 'wand.html',
    titel: 'Prompts für Microsoft Copilot Chat und Copilot Studio mit Quelle | KMUpower Dojo',
    beschreibung: `${ANZAHL} Ninja-Techniken und ${GRUNDFORMEN.length || 5} Grundformen für Microsoft Copilot Chat und Copilot Studio, nach Gürtel geordnet. Jede mit Quelle bei Microsoft Learn und Prüfdatum.`,
    canonical: `${BASE_URL}techniken/`, banner: ohneFreigabe(DABEI),
    jsonld: [LD_WEBSITE, LD_ORG, { '@type': 'CollectionPage', '@id': `${BASE_URL}techniken/#seite`, name: `${ANZAHL} Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio`, url: `${BASE_URL}techniken/`, inLanguage: 'de-CH', isPartOf: { '@id': `${BASE_URL}#website` }, mainEntity: { '@type': 'ItemList', itemListElement: sortiert.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: urlTechnik(t), name: `${t.titel}: ${t.klartitel}` })) } },
      ldKrumen([['Start', BASE_URL], ['Techniken', `${BASE_URL}techniken/`]])],
    daten: {
      anzahl: ANZAHL, anzahl_grundformen: (GRUNDFORMEN.length || 5) === 1 ? 'eine Grundform' : `${GRUNDFORMEN.length || 5} Grundformen`, stand_ch: datumCH(STAND), kurz_basis: KURZ_BASIS,
      // Sprungleiter als Textanker mit Anzahl, bewusst anders gestaltet als die Filter-Chips (Korrektur 15.10.2026)
      guertel_sprung: GUERTEL.map(g => { const n = DABEI.filter(t => t.guertel === g.nr).length; return `<li data-guertel-nr="${g.nr}"><a href="#${g.anker}"><span class="leiter__band" aria-hidden="true"></span><span class="leiter__name">${esc(g.name)}</span><span class="leiter__zahl">${n ? n + (n === 1 ? ' Eintrag' : ' Einträge') : 'offen'}</span></a></li>`; }).join(''),
      filter: filterHtml(), abschnitte: wandAbschnitte(r), tusch_sitzen: tusch('sitzen'), vier_wochen: vierWochenHtml(r, 'h2')
    }
  });
}
function baueTechnik(t, i) {
  const r = '../../';
  const a = ART[t.art] || ART.pinselstrich;
  const g = GUERTEL[t.guertel - 1];
  const produkt = PRODUKTNAMEN[(t.werkzeug || [])[0]] || 'Microsoft Copilot Chat';
  let titel = `${t.klartitel}: ${a.wort} mit Quelle | KMUpower Dojo`;
  if (titel.length > 65) titel = `${t.klartitel} | KMUpower Dojo`;
  let beschreibung = `${t.klartitel}. ${a.wort} für ${produkt} zum Kopieren, mit Quelle bei Microsoft Learn und Prüfdatum.${t.moment ? ' ' + t.moment.replace(/[.!?]?$/, '.') : ''}`;
  if (beschreibung.length > 160) beschreibung = `${t.klartitel}. ${a.wort} für ${produkt} zum Kopieren, mit Quelle bei Microsoft Learn und Prüfdatum.`;
  if (beschreibung.length > 160) warnung(`${t.id}: Meta-Description über 160 Zeichen`);
  const vor = sortiert[i - 1], nach = sortiert[i + 1];
  const kartenBild = `assets/img/karten/${t.slug}.png`;
  const bildDa = gibtEs(kartenBild);
  if (!bildDa) warnung(`${t.id}: Vorschaubild ${kartenBild} fehlt (DOJO, karten.mjs), Seite nutzt og-image.png`);
  const liste = (ids) => (ids || []).map(id => NACH_ID[id]).filter(Boolean);
  const kommt = liste(t.kommt_aus), weiter = liste(t.weiter_mit);
  const kette = (kommt.length || weiter.length) ? `    <section class="abschnitt" aria-labelledby="h-kette">
      <h2 id="h-kette">${t.kombo ? 'Kombo: ' + esc(t.kombo) : 'Kombo'}</h2>
      <div class="kette">
        ${kommt.length ? `<div><p class="label">Kommt aus</p><ul class="pfad__liste">${kommt.map(x => kompakt(x, r)).join('')}</ul></div>` : ''}
        ${weiter.length ? `<div><p class="label">Weiter mit</p><ul class="pfad__liste">${weiter.map(x => kompakt(x, r)).join('')}</ul></div>` : ''}
      </div>
    </section>
` : t.kombo ? `    <p class="klein">Gehört zur Kombo «${esc(t.kombo)}».</p>
` : '';
  // Kurs-Satz je Guertelgruppe (Korrektur 15.10.2026): Gruen und Blau bauen den ersten Agent, Braun und Schwarz fuehren ihn ein
  const kursFrage = t.guertel <= 5 ? 'Du willst deinen ersten Agent mit Begleitung bauen?' : 'Du willst Agents mit Begleitung im eigenen Betrieb einführen?';
  const kurs = t.guertel >= 4 ? `    <p class="kurs-satz">${kursFrage} Die Power Platform Academy führt den Live-Kurs «${KURS_NAME}», Termine offen. ${KURS_EIGEN} Die Kursseite empfiehlt eine Lizenz für Microsoft Copilot, nicht zwingend (Kursseite, Stand 15.10.2026). <a href="${esc(KURS_URL(t.typ === 'technik' ? 'technik-' + t.nr : 'technik-' + t.id))}" rel="noopener">Kursseite ansehen</a></p>
` : '';
  const blaettern = [vor ? `<a href="${r}techniken/${vor.slug}/" rel="prev"><span>Vorherige Technik</span>${nrLabel(vor)} ${esc(vor.titel)}</a>` : `<a href="${r}techniken/"><span>Zurück</span>Zur Technik-Wand</a>`,
    nach ? `<a href="${r}techniken/${nach.slug}/" rel="next"><span>Nächste Technik</span>${nrLabel(nach)} ${esc(nach.titel)}</a>` : `<a href="${r}techniken/"><span>Geschafft</span>Zur Technik-Wand</a>`].join('\n');
  const url = urlTechnik(t);
  seite(`techniken/${t.slug}/index.html`, {
    seite: 'technik', template: 'technik.html', titel, beschreibung,
    ogTitel: `${t.titel}: ${t.klartitel}`, ogBeschreibung: t.nutzen || beschreibung, ogTyp: 'article',
    ogBild: bildDa ? `${BASE_URL}${kartenBild}` : null, ogAlt: `${t.typ === 'technik' ? 'Technik ' + pad2(t.nr) : 'Grundform'}: ${t.titel}`,
    canonical: url, banner: VORSCHAU && !istFrei(t),
    jsExtra: t.rechner ? ['assets/js/kompass.js'] : null,
    jsonld: [LD_WEBSITE, LD_ORG, {
      '@type': 'TechArticle', '@id': `${url}#technik`, headline: `${t.titel}: ${t.klartitel}`, name: t.titel, url, inLanguage: 'de-CH',
      description: t.nutzen || beschreibung, author: LD_AUTOR, publisher: { '@id': 'https://kmupower.com/#organization' },
      datePublished: t.datum_publiziert || t.geprueft_am, dateModified: t.geprueft_am,
      citation: [t.quelle_url, ...(t.weitere_quellen || []).map(q => q.url)], isPartOf: { '@id': `${BASE_URL}techniken/#seite` }
    }, ldKrumen([['Start', BASE_URL], ['Techniken', `${BASE_URL}techniken/`], [t.titel, url]])],
    daten: {
      id: t.id, guertel: t.guertel, guertel_name: g.name, guertel_anker: g.anker,
      nr_label: t.typ === 'technik' ? `Nr. ${pad2(t.nr)}` : `Grundform ${t.id.toUpperCase()}`,
      nr_gross: t.typ === 'technik' ? pad2(t.nr) : `Grundform ${t.id.toUpperCase()}`, nr_klasse: t.typ === 'technik' ? '' : ' tk__nr--wort',
      titel: t.titel, klartitel: t.klartitel || '', moment: t.moment || '', problem: t.problem, dauer_min: t.dauer_min,
      art_badge: artBadge(t), zugang_badge: zugangBadge(t, r), zugang_text: t.zugang_text || (ZUGANG[t.zugang] || {}).kurz || '',
      stempel: stempel(t.geprueft_am, frist(t), '#quelle'),
      schnitt_zeile: t.vorher ? `      <div class="schnitt schnitt--zeile" data-schnitt><p class="label">Vorher</p><div class="schnitt__vorher"><p class="schnitt__zitat">«${esc(t.vorher)}»</p><svg class="schnitt__strich" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 13C30 9 66 7 99 8"/></svg></div></div>` : '',
      schmiede: schmiedeHtml(t, 'technik'), rollen: rollenFuer(t, 'prompt'), rechner: rechnerHtml(t),
      so_nutzt: (t.so_nutzt_du_es || []).map(s => `<li>${esc(s)}</li>`).join(''),
      erwarten: (t.das_darfst_du_erwarten || []).map(s => `<li>${esc(s)}</li>`).join(''),
      probe: t.probe ? `    <section class="abschnitt" aria-labelledby="h-probe">
      <h2 id="h-probe">Die Probe</h2>
      <p class="probe">${esc(t.probe)}</p>
    </section>
` : '',
      grenzen: (t.grenzen || []).map(s => `<li>${esc(s)}</li>`).join(''),
      meister: t.meister_variante ? `    <section class="abschnitt" aria-labelledby="h-meister"><h2 id="h-meister">Meister-Variante</h2><details class="einklapp" data-meister><summary>Verschärfung anzeigen</summary><pre class="code">${textHtml(t.meister_variante, t._felder)}</pre></details></section>
` : '',
      praxis: t.praxis_notiz ? `    <section class="abschnitt" aria-labelledby="h-praxis"><h2 id="h-praxis">Aus der Praxis</h2><p class="praxis">${esc(t.praxis_notiz)}</p></section>
` : '',
      quellen: [`<li><a href="${esc(t.quelle_url)}" rel="noopener">${esc(t.quelle_titel)}</a></li>`, ...(t.weitere_quellen || []).map(q => `<li><a href="${esc(q.url)}" rel="noopener">${esc(q.titel)}</a></li>`)].join(''),
      geprueft_am: t.geprueft_am, geprueft_ch: datumCH(t.geprueft_am), frist: frist(t),
      naechste_pruefung_ch: datumCH(daten.naechste_pruefung || ''),
      ausgefuehrt: istIso(t.ausgefuehrt_am) ? `      <p class="pruefstatus">Einmal ausgeführt in Microsoft Copilot Chat am ${datumCH(t.ausgefuehrt_am)}. Ergebnisse können abweichen.</p>` : '',
      // LinkedIn: feed/?shareActive=true&text= fuellt den Post vor (share-offsite kann keinen Text). Rueckfall: core.js kopiert denselben Text
      linkedin_url: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${t.teilen_text}\n\n${url}`)}`, url,
      bild_link: bildDa ? `        <a class="knopf knopf--klein" href="${r}${kartenBild}" download>Bild herunterladen</a>` : '',
      teilen_text: `${t.teilen_text}\n\n${url}`, kette, kurs, blaettern,
      haupt_pre: 'prompt', kopier_label: a.knopf, naechste_url: nach ? `${r}techniken/${nach.slug}/` : `${r}techniken/`, naechste_label: nach ? 'Nächste Technik' : 'Zur Technik-Wand'
    }
  });
}
function baueHeute() {
  const t = heuteTechnik();
  seite('heute/index.html', {
    seite: 'heute', template: 'heute.html', titel: 'Technik des Tages | KMUpower Dojo',
    beschreibung: 'Jeden Tag eine Technik aus dem KMUpower Dojo, für alle am selben Tag dieselbe.', noindex: true, canonical: null,
    banner: t ? ohneFreigabe([t]) : false,
    daten: { build_datum: DATUM, heute_inhalt: heuteHtml(t, '../', 'h2') }
  });
}
function bauePflichtseiten() {
  // Kurzadressen 1 bis 25
  for (let n = 1; n <= 25; n++) {
    const t = TECHNIKEN.find(x => x.nr === n);
    const roh = ALLE.find(x => x.nr === n);
    const g = roh ? GUERTEL[roh.guertel - 1] : null;
    const ziel = t ? `../techniken/${t.slug}/` : g ? `../techniken/#${g.anker}` : '../techniken/';
    schreibe(`${n}/index.html`, render(lies('templates/kurzadresse.html'), {
      titel: t ? `${t.titel}: ${t.klartitel} | KMUpower Dojo` : `Technik ${n} | KMUpower Dojo`,
      canonical: t ? urlTechnik(t) : `${BASE_URL}techniken/`, ziel,
      linktext: t ? `Technik ${pad2(n)}: ${t.titel}` : `Technik ${n} ist noch nicht freigegeben. Zur Technik-Wand`
    }, 'kurzadresse'));
  }
  // Weiterleitung /vorlagen/
  const ziele = ALTE_ANKER.filter(s => DABEI.some(t => t.slug === s));
  schreibe('vorlagen/index.html', render(lies('templates/weiterleitung-vorlagen.html'), { ziele_json: esc(JSON.stringify(ziele)), canonical: `${BASE_URL}techniken/` }, 'weiterleitung'));
  // 404
  seite('404.html', {
    seite: '404', template: '404.html', absolut: true, titel: 'Seite nicht gefunden | KMUpower Dojo',
    beschreibung: 'Diese Seite gibt es nicht. Zu den Techniken, zur Suche oder zur Startseite.', noindex: true,
    daten: { tusch_spaehen: tusch('spaehen'), kurz_basis: KURZ_BASIS }
  });
}

/* Seiten von Hand: Rahmen-Marker fuellen */
const HAND_SEITEN = () => {
  const liste = ['ueber/index.html', 'impressum/index.html', 'datenschutz/index.html', 'gratis/index.html', 'dojo/index.html', 'dojo/test/index.html'];
  if (gibtEs('dojo/guertel')) for (const f of fs.readdirSync(path.join(ROOT, 'dojo/guertel'))) if (gibtEs(`dojo/guertel/${f}/index.html`)) liste.push(`dojo/guertel/${f}/index.html`);
  return liste;
};
const EIGENE_HAND = ['ueber/index.html', 'impressum/index.html', 'datenschutz/index.html'];
function ersetzeMarker(html, name, inhalt, datei) {
  const re = new RegExp(`(<!-- RAHMEN:${name} -->)[\\s\\S]*?(<!-- /RAHMEN:${name} -->)`);
  if (!re.test(html)) { (EIGENE_HAND.includes(datei) || !LOCKER ? fehler : warnung)(`${datei}: Marker RAHMEN:${name} fehlt`); return null; }
  return html.replace(re, (_, a, b) => `${a}\n${inhalt}\n${b}`);
}
function fuelleHandseiten() {
  for (const datei of HAND_SEITEN()) {
    if (!gibtEs(datei)) { if (EIGENE_HAND.includes(datei)) fehler(`${datei} fehlt`); else warnung(`${datei} fehlt noch (anderer Agent)`); continue; }
    let html = lies(datei);
    const seiteName = (html.match(/<html[^>]*data-seite="([^"]+)"/) || [])[1] || 'recht';
    if (!/<!-- RAHMEN:HEAD -->/.test(html)) { (EIGENE_HAND.includes(datei) || !LOCKER ? fehler : warnung)(`${datei}: keine Rahmen-Marker, Seite bleibt unverändert`); continue; }
    const r = praefix(datei);
    const ctx = rahmenKontext(r, seiteName);
    let neu = html;
    for (const [name, tpl] of [['HEAD', 'head'], ['KOPF', 'kopf'], ['FUSS', 'fuss']]) {
      const ersetzt = ersetzeMarker(neu, name, render(partial(tpl), ctx, tpl), datei);
      if (ersetzt !== null) neu = ersetzt;
    }
    // Testphase: Handseiten bekommen noindex im HEAD-Marker (wird bei jedem Lauf neu gesetzt, ohne --testphase faellt es weg)
    if (TESTPHASE && !/name="robots" content="[^"]*noindex/.test(neu)) neu = neu.replace('<!-- /RAHMEN:HEAD -->', '<meta name="robots" content="noindex">\n<meta name="dojo-build" content="testphase">\n<!-- /RAHMEN:HEAD -->');
    if (datei === 'gratis/index.html') {
      const liste = TECHNIKEN.filter(t => t.zugang === 'ohne-zl' || t.zugang === 'agent-builder');
      const inhalt = liste.length ? `<ul class="pfad__liste">${liste.map(t => kompakt(t, r)).join('')}</ul>\n<p><a class="knopf" href="${r}techniken/?zugang=ohne-zl&amp;zugang=agent-builder">Alle Techniken ohne Zusatzlizenz auf der Technik-Wand</a></p>` : `<p>${NOCH_NICHT}</p>`;
      const x = ersetzeMarker(neu, 'GRATIS-TECHNIKEN', inhalt, datei); if (x !== null) neu = x;
    }
    if (datei === 'dojo/index.html') {
      const inhalt = `<div class="dojo-liste">${GUERTEL.map(g => {
        const drin = sortiert.filter(t => t.guertel === g.nr && t.typ === 'technik');
        return `<section class="dojo-liste__guertel" data-guertel-nr="${g.nr}" aria-labelledby="dl-${g.farbe}">
<h3 id="dl-${g.farbe}">${knoten(g.nr, g.name)}<span class="klein">Stufe ${g.nr}${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span></h3>
<div class="fortschritt" data-fortschritt="${g.nr}"><p class="fortschritt__text">${drin.length} ${drin.length === 1 ? 'Technik' : 'Techniken'}</p></div>
${drin.length ? `<ul>${drin.map(t => `<li data-technik="${t.id}" data-guertel-nr="${g.nr}"><a href="${r}techniken/${t.slug}/">${pad2(t.nr)} ${esc(t.titel)}</a><span class="dojo-liste__status" data-status>offen</span></li>`).join('')}</ul>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
</section>`;
      }).join('\n')}</div>`;
      const x = ersetzeMarker(neu, 'DOJO-LISTE', inhalt, datei); if (x !== null) neu = x;
    }
    if (neu !== html) schreibe(datei, neu);
  }
}

/* Daten fuer Skripte, Sitemap, Feed, llms.txt, Kalender, robots */
function baueDaten() {
  const suche = { erzeugt: DATUM, eintraege: sortiert.map(t => ({ id: t.id, nr: t.nr, titel: t.titel, klartitel: t.klartitel, guertel: t.guertel, slug: t.slug, moment: t.moment || '' })) };
  schreibe('assets/data/suche.json', JSON.stringify(suche));
  const folge = (daten.tag_reihenfolge || []).filter(id => NACH_ID[id] && NACH_ID[id].typ === 'technik');
  for (let i = 1; i < folge.length; i++) if (NACH_ID[folge[i]].guertel === NACH_ID[folge[i - 1]].guertel) warnung(`tag.json: ${folge[i - 1]} und ${folge[i]} haben denselben Gürtel an zwei Tagen hintereinander`);
  const tag = {
    start: istIso(daten.tag_start) ? daten.tag_start : DATUM,
    formel: 'Index = (Tage seit start nach lokalem Datum) modulo Anzahl, positiv gerechnet',
    reihenfolge: folge,
    eintraege: Object.fromEntries(folge.map(id => { const t = NACH_ID[id]; return [id, { nr: t.nr, slug: t.slug, titel: t.titel, klartitel: t.klartitel, guertel: t.guertel, zugang: t.zugang, zugang_text: t.zugang_text || '', nutzen: t.nutzen || '', dauer_min: t.dauer_min }]; }))
  };
  schreibe('assets/data/tag.json', JSON.stringify(tag));
  const maxGeprueft = (html) => [...html.matchAll(/data-geprueft="(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop();
  const url = (pfad, lastmod) => `  <url><loc>${BASE_URL}${pfad}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const eintraege = [url('', STAND), url('techniken/', STAND), ...sortiert.map(t => url(`techniken/${t.slug}/`, t.geprueft_am))];
  if (gibtEs('gratis/index.html')) eintraege.push(url('gratis/', maxGeprueft(lies('gratis/index.html')) || daten.stand));
  if (gibtEs('dojo/test/index.html')) eintraege.push(url('dojo/test/', gibtEs('dojo/selbsttest.json') ? (() => { try { const j = JSON.parse(lies('dojo/selbsttest.json')); return [...JSON.stringify(j).matchAll(/"geprueft_am":"(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop(); } catch { return null; } })() : null));
  eintraege.push(url('ueber/', RECHT_STAND), url('impressum/', RECHT_STAND), url('datenschutz/', RECHT_STAND));
  schreibe('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${eintraege.join('\n')}\n</urlset>\n`);
  // Gilt erst an der Wurzel einer eigenen Domain. Unter github.io/copilot-ninja/ liest kein Crawler diese Datei (Korrektur 15.10.2026).
  const basisPfad = new URL(BASE_URL).pathname;
  schreibe('robots.txt', `User-agent: *\nAllow: /\nDisallow: ${basisPfad}templates/\nDisallow: ${basisPfad}scripts/\nDisallow: ${basisPfad}data/\n\nSitemap: ${BASE_URL}sitemap.xml\n`);
  const xml = (s) => esc(s).replace(/'/g, '&apos;');
  const feed = sortiert.slice().sort((a, b) => (b.datum_publiziert || '').localeCompare(a.datum_publiziert || '')).map(t => `  <entry>
    <title>${xml(t.typ === 'technik' ? `Technik ${pad2(t.nr)}: ${t.titel}` : `Grundform: ${t.titel}`)}</title>
    <id>${urlTechnik(t)}</id>
    <link href="${urlTechnik(t)}"/>
    <published>${t.datum_publiziert || t.geprueft_am}T00:00:00Z</published>
    <updated>${t.geprueft_am}T00:00:00Z</updated>
    <summary>${xml(`${t.klartitel}. ${t.nutzen || ''}`.trim())}</summary>
  </entry>`);
  schreibe('feed.xml', `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="de-CH">
  <title>KMUpower Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio</title>
  <subtitle>Unabhängige Website von Marcel Lehmann. Keine Verbindung zu Microsoft.</subtitle>
  <id>${BASE_URL}</id>
  <link href="${BASE_URL}"/>
  <link rel="self" href="${BASE_URL}feed.xml"/>
  <updated>${STAND}T00:00:00Z</updated>
  <author><name>Marcel Lehmann</name><uri>https://kmupower.com/</uri></author>
${feed.join('\n')}
</feed>
`);
  const llms = [`# KMUpower Dojo`, '', `> Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio, auf Deutsch, vom weissen bis zum schwarzen Gürtel. Jede Technik ist ein Entwurf, geprüft gegen die Dokumentation bei Microsoft Learn, mit Prüfdatum und Grenzen. Unabhängige Website von Marcel Lehmann (KMUpower), keine Verbindung zu Microsoft.`, '',
    '## Seiten', '', `- [Technik-Wand](${BASE_URL}techniken/): alle Techniken nach Gürtel, mit Zugang (ohne Zusatzlizenz, Lizenz, Copilot Studio)`, `- [Ist Microsoft Copilot gratis?](${BASE_URL}gratis/): was ohne Zusatzlizenz geht, mit Quelle und Prüfdatum je Aussage`, `- [Über das Dojo](${BASE_URL}ueber/): Methode, Prüfrhythmus, was die Seite nicht ist`, '',
    '## Techniken', '', ...TECHNIKEN.map(t => `- [Nr. ${t.nr} ${t.titel}: ${t.klartitel}](${urlTechnik(t)}): ${t.nutzen || ''} Geprüft am ${datumCH(t.geprueft_am)}.`),
    ...(GRUNDFORMEN.length ? ['', '## Grundformen', '', ...GRUNDFORMEN.map(t => `- [${t.titel}](${urlTechnik(t)}): geprüft am ${datumCH(t.geprueft_am)}.`)] : []), ''];
  schreibe('llms.txt', llms.join('\n'));
  const montag = (() => { let d = new Date((istIso(daten.tag_start) ? daten.tag_start : DATUM) + 'T00:00:00Z'); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); })();
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KMUpower//Dojo//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', 'UID:dojo-montag-technik-des-tages@kmupower.com',
    `DTSTAMP:${DATUM.replace(/-/g, '')}T000000Z`, `DTSTART:${montag}T083000`, 'DURATION:PT15M', 'RRULE:FREQ=WEEKLY;BYDAY=MO', 'SUMMARY:Dojo: Technik des Tages',
    `DESCRIPTION:15 Minuten üben. Die Technik des Tages steht unter ${BASE_URL}heute/`, `URL:${BASE_URL}heute/`, 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR'];
  schreibe('kalender/montag.ics', ics.map(falte).join('\r\n') + '\r\n');
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
    schreibe(`assets/css/${f}.css`, `/* KMUpower Dojo. Quelle: ${q} (nicht hier bearbeiten, node scripts/build.mjs erzeugt diese Datei) */\n${minifiziere(css)}\n`);
  }
}

/* Statische Bilder: Favicon, Tusch-SVG, OG-Bild */
const FARBEN_HELL = { '.t-koerper': 'fill:#15171B', '.t-gesicht': 'fill:#F4EFE6', '.t-augen': 'fill:none;stroke:#15171B;stroke-width:3.6;stroke-linecap:round', '.t-band,.t-pinsel-spitze': 'fill:#B4301A', '.t-guertel,.t-guertel-enden': 'fill:#FBFAF5;stroke:#8A7F6C;stroke-width:1.2;stroke-linejoin:round', '.t-pinsel-stiel': 'fill:none;stroke:#15171B;stroke-width:3;stroke-linecap:round', '.t-hand': 'fill:#15171B', '.t-rolle,.t-strich': 'display:none' };
function tuschDatei(farben = FARBEN_HELL, guertelFarbe = '#FBFAF5') {
  const style = Object.entries(farben).map(([k, v]) => `${k}{${v.replace('#FBFAF5', guertelFarbe)}}`).join('');
  return partial('tusch').replace('<svg class="tusch__svg"', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ' role="img" aria-label="Tusch, die Figur des KMUpower Dojo"').replace('<g class="t-figur">', `<title>Tusch</title><style>${style}</style><g class="t-figur">`);
}
function baueBilder() {
  schreibe('assets/img/tusch.svg', tuschDatei() + '\n');
  schreibe('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 -4 96 96"><rect x="20" y="-4" width="96" height="96" rx="16" fill="#F4EFE6"/><path fill="#B4301A" d="M89 27l21-8-2 8-17 6zM90 34h22l-3 6-18-2z"/><path fill="#15171B" d="M24 152l2.6-20 .4-20q1-28 3-50c1-26 14-48 36-53l18-3q-4 8 4 18c6 10 7 28 5 46q4 34 7 82z"/><path fill="#F4EFE6" d="M31 38l62-5 1 13-63 5z"/><path fill="none" stroke="#15171B" stroke-width="4.2" stroke-linecap="round" d="M46 44.6h9M68 42.4h9"/></svg>
`);
  const belts = ['#FBFAF5', '#E2B100', '#E36A00', '#2E8B57', '#2F6FB5', '#7A4A2B', '#111111'];
  const tuschGross = tuschDatei().replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>Tusch<\/title>/, '');
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F4EFE6"/>
${belts.map((c, i) => `<rect x="${i * (1200 / 7)}" y="606" width="${1200 / 7 + 1}" height="24" fill="${c}"/>`).join('')}
<rect x="0" y="605" width="1200" height="1.5" fill="#8A7F6C"/>
<g transform="translate(80 86) scale(1.9)" fill="none" stroke="#15171B" stroke-width="2.3" stroke-linecap="square"><path d="${WM.d}"/></g>
<text x="76" y="300" font-family="Bahnschrift, 'Avenir Next Condensed', 'Arial Narrow', sans-serif" font-stretch="condensed" font-weight="600" font-size="112" letter-spacing="-2" fill="#15171B">Übung schlägt</text>
<text x="76" y="410" font-family="Bahnschrift, 'Avenir Next Condensed', 'Arial Narrow', sans-serif" font-stretch="condensed" font-weight="600" font-size="112" letter-spacing="-2" fill="#15171B">Hype.</text>
<path d="M80 322C160 312 250 308 352 314" fill="none" stroke="#B4301A" stroke-width="12" stroke-linecap="round"/>
<text x="80" y="500" font-family="'Segoe UI', system-ui, sans-serif" font-size="34" fill="#4E525B">Ninja-Techniken mit Quelle und Prüfdatum.</text>
<text x="80" y="546" font-family="'Segoe UI', system-ui, sans-serif" font-size="34" fill="#4E525B">Vom weissen bis zum schwarzen Gürtel.</text>
<g transform="translate(862 150) scale(2.55)">${tuschGross}</g>
<g transform="translate(560 66) rotate(-6)"><rect x="0" y="0" width="250" height="96" fill="#F4EFE6" stroke="#B4301A" stroke-width="5"/><rect x="8" y="8" width="234" height="80" fill="none" stroke="#B4301A" stroke-width="1.5"/><text x="125" y="52" text-anchor="middle" font-family="Bahnschrift, 'Arial Narrow', sans-serif" font-weight="700" font-size="40" letter-spacing="4" fill="#B4301A">GEPRÜFT</text><text x="125" y="76" text-anchor="middle" font-family="Bahnschrift, 'Arial Narrow', sans-serif" font-size="17" fill="#B4301A">gegen die Dokumentation</text></g>
</svg>
`;
  schreibe('og-image.svg', og);
  if (ARGS.includes('--og-png')) {
    const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
    if (!chrome) { warnung('--og-png: kein Chrome gefunden (CHROME=Pfad setzen)'); return; }
    const tmp = path.join(ROOT, '_recherche', 'og-render.html');
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body><img src="../og-image.svg" width="1200" height="630" alt=""></body></html>`);
    try {
      execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--screenshot=${path.join(ROOT, 'og-image.png')}`, '--window-size=1200,630', 'file:///' + tmp.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 });
      geschrieben.push('og-image.png');
    } catch (e) { warnung(`--og-png: Chrome-Aufruf fehlgeschlagen (${e.message})`); }
    fs.rmSync(tmp, { force: true });
  }
}

/* Alte, nicht mehr erzeugte Technik-Seiten entfernen (nur Seiten mit Generator-Marke) */
function aufraeumen() {
  const dir = path.join(ROOT, 'techniken');
  if (!fs.existsSync(dir)) return;
  const aktiv = new Set(sortiert.map(t => t.slug));
  for (const f of fs.readdirSync(dir)) {
    const datei = path.join(dir, f, 'index.html');
    if (aktiv.has(f) || !fs.existsSync(datei)) continue;
    if (fs.readFileSync(datei, 'utf8').includes(GENERATOR)) { fs.rmSync(path.join(dir, f), { recursive: true }); warnung(`techniken/${f}/ entfernt (nicht mehr im Build)`); }
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
  const html = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><title>Freigabeblatt KMUpower Dojo${PAKET ? ' Paket ' + PAKET : ''}</title>
<style>body{font:11pt/1.45 "Segoe UI",system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#15171B}pre{white-space:pre-wrap;background:#F4EFE6;padding:.8rem;border:1px solid #D8CFBE;font-size:9.5pt}.e{border-top:2px solid #15171B;padding-top:.6rem;margin-top:1.6rem;break-inside:avoid-page}.rot{color:#B4301A}.frei{margin-top:1rem;font-weight:600}h2 small{font-weight:400;color:#4E525B}@media print{body{margin:0}.e{break-before:page}}</style></head><body>
<h1>Freigabeblatt KMUpower Dojo${PAKET ? ', Paket ' + PAKET : ''}</h1>
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
  const ohneH1 = ['vorlagen/index.html', ...Array.from({ length: 25 }, (_, i) => `${i + 1}/index.html`)];
  for (const rel of allesHtml()) {
    const html = lies(rel);
    const fremd = !geschrieben.includes(rel) && !EIGENE_HAND.includes(rel);
    const melde = fremd && LOCKER ? warnung : fehler;
    const wo = `Prüfung ${rel}`;
    if (rel !== '404.html' && /\s(href|src)="\/(?!\/)/.test(html)) melde(`${wo}: absoluter Pfad mit «/»`);
    for (const m of html.matchAll(/<(script|link)\b[^>]*>/g)) {
      const tag = m[0]; const u = (tag.match(/\s(?:src|href)="([^"]+)"/) || [])[1];
      if (!u || /rel="(canonical|alternate)"/.test(tag)) continue;
      if (/^http:\/\//.test(u) || (/^(https?:)?\/\//.test(u) && !u.startsWith(BASE_URL))) melde(`${wo}: fremde Quelle in <${m[1]}> ${u}`);
    }
    if (/<[a-z][^>]*\sstyle=/i.test(html)) melde(`${wo}: style-Attribut`);
    if (/<[a-z][^>]*\son[a-z]+=/i.test(html)) melde(`${wo}: on…-Attribut`);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if (!/\ssrc=/.test(m[1]) && !/application\/ld\+json/.test(m[1]) && m[2].trim()) melde(`${wo}: Inline-Skript`);
    if (!/<html[^>]*lang="de-CH"/.test(html)) melde(`${wo}: lang="de-CH" fehlt`);
    // Doppelte IDs je Seite (Korrektur 15.10.2026, vorher h-pfad doppelt auf der Startseite). Inhalte in <template> zaehlen nicht.
    const sichtbar = html.replace(/<template[\s\S]*?<\/template>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    const gesehen = new Set();
    for (const m of sichtbar.matchAll(/\sid="([^"]+)"/g)) { if (gesehen.has(m[1])) melde(`${wo}: id «${m[1]}» doppelt`); gesehen.add(m[1]); }
    if (!/<title>[^<]+<\/title>/.test(html)) melde(`${wo}: <title> fehlt`);
    if (!/Content-Security-Policy/.test(html)) melde(`${wo}: CSP fehlt`);
    if (!/name="robots" content="noindex"/.test(html) && !/rel="canonical"/.test(html)) melde(`${wo}: canonical fehlt`);
    if (!ohneH1.includes(rel)) { const n = (html.match(/<h1[\s>]/g) || []).length; if (n !== 1) melde(`${wo}: ${n} statt genau ein <h1>`); }
    if (/assets\/(style\.css|app\.js)/.test(html)) (fremd ? warnung : fehler)(`${wo}: verweist noch auf assets/style.css oder assets/app.js`);
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    if (/[\u2013\u2014]/.test(text)) melde(`${wo}: Gedankenstrich im Text`);
    if (/\u00df/.test(text)) melde(`${wo}: Eszett im Text`);
    if (/\p{Extended_Pictographic}/u.test(text)) melde(`${wo}: Emoji im Text`);
    if (/copilot[\s-]ninja/i.test(html.replace(/https?:\/\/[^\s"'<>]+/g, '').replace(/\s(href|src)="\/[^"]*"/g, '').replace(/copilot-ninja-theme/g, '').split(KURS_NAME).join('').split(KURZ_BASIS).join(''))) melde(`${wo}: «Copilot-Ninja» als Name`);
  }
  for (const [datei, kb] of Object.entries(BUDGET)) {
    if (!gibtEs(datei)) continue;
    const gr = fs.statSync(path.join(ROOT, datei)).size / 1024;
    if (gr > kb * 1.2) fehler(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt ${kb} KB (mehr als 20 Prozent darüber)`);
    else if (gr > kb) warnung(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt ${kb} KB`);
  }
  for (const t of sortiert) {
    const datei = `techniken/${t.slug}/index.html`;
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
    baueStart();
    baueWand();
    sortiert.forEach((t, i) => baueTechnik(t, i));
    baueHeute();
    bauePflichtseiten();
    fuelleHandseiten();
    baueDaten();
    aufraeumen();
  }
  abschluss();
}

console.log(`\nKMUpower Dojo Build, Modus ${MODUS}${LOCKER ? ' (locker)' : ''}, Datum ${DATUM}`);
console.log(`Einträge: ${ALLE.length} in den Daten, ${DABEI.length} im Build (${TECHNIKEN.length} Techniken, ${GRUNDFORMEN.length} Grundformen)`);
if (geschrieben.length) {
  const seiten = geschrieben.filter(f => f.endsWith('.html'));
  console.log(`Geschrieben: ${geschrieben.length} Dateien, davon ${seiten.length} HTML-Seiten`);
  for (const f of ['index.html', 'techniken/index.html', 'assets/css/site.css', 'assets/js/core.js']) if (gibtEs(f)) console.log(`  ${f}: ${(fs.statSync(path.join(ROOT, f)).size / 1024).toFixed(1)} KB`);
}
if (warnListe.length) { console.log(`\nWarnungen (${warnListe.length}):`); warnListe.forEach(w => console.log('  - ' + w)); }
if (fehlerListe.length) { console.log(`\nFehler (${fehlerListe.length}):`); fehlerListe.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('\nOK');
