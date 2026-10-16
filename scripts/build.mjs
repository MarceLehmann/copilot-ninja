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
// Domainwechsel: nur BASE_URL umstellen. Die bisherige Basis bleibt in FRUEHERE_BASEN, damit der Build
// feste Adressen in den Seiten von Hand (canonical, og:url, JSON-LD) auf die neue Basis umschreibt.
const BASE_URL = 'https://copilot.ninja/';
const FRUEHERE_BASEN = ['https://marcelehmann.github.io/copilot-ninja/'].filter(b => b !== BASE_URL);
// Sprachen (16.10.2026): Deutsch unter /, Englisch unter /en/ mit gleicher Ordnerstruktur.
const SPRACHEN = ['de', 'en'];
let L = 'de';
const istEN = () => L === 'en';
const LP = () => (L === 'en' ? 'en/' : '');
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

const GUERTEL_NAMEN = {
  de: [['Weisser Gürtel', 'Weiss'], ['Gelber Gürtel', 'Gelb'], ['Oranger Gürtel', 'Orange'], ['Grüner Gürtel', 'Grün'], ['Blauer Gürtel', 'Blau'], ['Brauner Gürtel', 'Braun'], ['Schwarzer Gürtel', 'Schwarz']],
  en: [['White belt', 'White'], ['Yellow belt', 'Yellow'], ['Orange belt', 'Orange'], ['Green belt', 'Green'], ['Blue belt', 'Blue'], ['Brown belt', 'Brown'], ['Black belt', 'Black']]
};
const FARBEN = ['weiss', 'gelb', 'orange', 'gruen', 'blau', 'braun', 'schwarz'];
const guertelStandard = () => FARBEN.map((farbe, i) => ({ nr: i + 1, farbe, name: GUERTEL_NAMEN[L][i][0], kurz: GUERTEL_NAMEN[L][i][1] }));
const ANKER = { weiss: 'weisser-guertel', gelb: 'gelber-guertel', orange: 'oranger-guertel', gruen: 'gruener-guertel', blau: 'blauer-guertel', braun: 'brauner-guertel', schwarz: 'schwarzer-guertel' };
const ART_ICONS = {
  pinselstrich: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M2 11c5-1 9-6 18-8"/></svg>',
  schriftrolle: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M4 2h14v10H4zM4 2a2 2 0 0 0 0 10M18 2a2 2 0 0 1 0 10"/></svg>',
  kata: '<svg viewBox="0 0 22 14" aria-hidden="true" focusable="false"><path d="M1 7h20"/><circle cx="4" cy="7" r="2"/><circle cx="11" cy="7" r="2"/><circle cx="18" cy="7" r="2"/></svg>'
};
const ART_TEXT = {
  de: {
    pinselstrich: { name: 'Pinselstrich', wort: 'Prompt', knopf: 'Prompt kopieren', rolle: 'Prompt zum Kopieren', erfolg: 'Kopiert. Jetzt in Microsoft Copilot Chat einfügen.' },
    schriftrolle: { name: 'Schriftrolle', wort: 'Agent-Anweisung', knopf: 'Anweisung kopieren', rolle: 'Agent-Anweisung zum Kopieren', erfolg: 'Kopiert. Jetzt in die Anweisungen deines Agents einfügen.' },
    kata: { name: 'Kata', wort: 'Anleitung', knopf: 'Text kopieren', rolle: 'Text zum Kopieren', erfolg: 'Kopiert. Jetzt in Microsoft Copilot Chat einfügen.' }
  },
  en: {
    pinselstrich: { name: 'Brushstroke', wort: 'Prompt', knopf: 'Copy prompt', rolle: 'Prompt to copy', erfolg: 'Copied. Now paste it into Microsoft Copilot Chat.' },
    schriftrolle: { name: 'Scroll', wort: 'Agent instruction', knopf: 'Copy instruction', rolle: 'Agent instruction to copy', erfolg: 'Copied. Now paste it into your agent’s instructions.' },
    kata: { name: 'Kata', wort: 'Guide', knopf: 'Copy text', rolle: 'Text to copy', erfolg: 'Copied. Now paste it into Microsoft Copilot Chat.' }
  }
};
const artFuer = () => Object.fromEntries(Object.keys(ART_ICONS).map(k => [k, { ...ART_TEXT[L][k], icon: ART_ICONS[k] }]));
let ART = artFuer();
const ZUGANG_BASIS = {
  'ohne-zl': { klasse: 'frei', anker: 'chat-ohne-zusatzlizenz', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2l2 2 4-4.4"/></svg>' },
  'agent-builder': { klasse: 'builder', anker: 'agent-builder', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2l2 2 4-4.4"/></svg>' },
  'lizenz': { klasse: 'lizenz', anker: 'organisationsdaten', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="5.5" cy="8" r="3"/><path d="M8.5 8H15M12.5 8v2.5M14.5 8v2"/></svg>' },
  'studio': { klasse: 'studio', anker: 'studio-testversion', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 3h12v10H2zM2 6h12"/></svg>' },
  'rechner': { klasse: 'rechner', anker: 'studio-verbrauch', icon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 1.5h10v13H3zM5 4h6M5.5 8h1M9.5 8h1M5.5 11h1M9.5 11h1"/></svg>' }
};
const ZUGANG_KURZ = {
  de: { 'ohne-zl': 'Ohne Zusatzlizenz', 'agent-builder': 'Agent Builder, ohne Zusatzlizenz', 'lizenz': 'Mit Lizenz', 'studio': 'Copilot Studio', 'rechner': 'Rechner' },
  en: { 'ohne-zl': 'No add-on license', 'agent-builder': 'Agent Builder, no add-on license', 'lizenz': 'With license', 'studio': 'Copilot Studio', 'rechner': 'Calculator' }
};
const zugangFuer = () => Object.fromEntries(Object.entries(ZUGANG_BASIS).map(([k, v]) => [k, { ...v, kurz: ZUGANG_KURZ[L][k] }]));
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
const WOCHEN_TEXT = {
  de: [
    { nr: 1, guertel: [1, 2], ergebnisse: [['t01', 'die Fragen, die du vor einem wichtigen Text selbst beantworten musst'], ['t05', 'die Einwände deines Empfängers, solange du sie noch beheben kannst'], ['t06', 'eine Liste der Abweichungen zwischen Entwurf und Quelle'], ['t07', 'die Gründe, an denen dein Projekt scheitern könnte']] },
    { nr: 2, guertel: [3], ergebnisse: [['t09', 'einen Offertenvergleich mit dem Kleingedruckten in einer Tabelle'], ['t10', 'eine Fristenliste für deine Kalendereinträge'], ['t11', 'deinen Schreibstil-Steckbrief'], ['t13', 'ein Quiz mit Fundstellen zu einem Reglement']] },
    { nr: 3, guertel: [4, 5], ergebnisse: [['t14', 'einen eigenen Agent aus deinem besten Chat'], ['t17', 'eine Prüftabelle zu seinen Anweisungen'], ['t18', '20 Testfragen mit der Liste «nicht geregelt»'], ['t19', 'einen Schutzbaustein für jede Instruktion']] },
    { nr: 4, guertel: [6, 7], ergebnisse: [['t22', 'eine Vorlage, mit der du echte Fälle anonymisiert weitergibst'], ['t23', 'eine Schätzung, in welcher Grössenordnung dein Agent Copilot Credits verbraucht'], ['t24', 'ein Betriebsblatt mit Abschaltkriterien und verantwortlicher Person'], ['t25', 'einen Ablauf für den monatlichen Check']] }
  ],
  en: [
    { nr: 1, guertel: [1, 2], ergebnisse: [['t01', 'the questions you have to answer yourself before an important text'], ['t05', 'your recipient’s objections, while you can still fix them'], ['t06', 'a list of differences between draft and source'], ['t07', 'the reasons your project could fail']] },
    { nr: 2, guertel: [3], ergebnisse: [['t09', 'a comparison of quotes with the fine print in one table'], ['t10', 'a list of deadlines for your calendar entries'], ['t11', 'your writing style profile'], ['t13', 'a quiz on a policy, with references']] },
    { nr: 3, guertel: [4, 5], ergebnisse: [['t14', 'your own agent built from your best chat'], ['t17', 'a review table for its instructions'], ['t18', '20 test questions with the list “not covered”'], ['t19', 'a safeguard block for every instruction']] },
    { nr: 4, guertel: [6, 7], ergebnisse: [['t22', 'a template to pass on real cases anonymized'], ['t23', 'an estimate of the order of magnitude of Copilot Credits your agent uses'], ['t24', 'an operations sheet with shutdown criteria and a responsible person'], ['t25', 'a routine for the monthly check']] }
  ]
};
const MOMENTE_TEXT = {
  de: [['t01', 'Ich weiss nicht, was ich fragen soll.'], ['t11', 'Die Antwort klingt nach Prospekt.'], ['t09', 'Drei Offerten, keine Zeit.'], ['t18', 'Der Agent erfindet Dinge.']],
  en: [['t01', 'I don’t know what to ask.'], ['t11', 'The answer sounds like a brochure.'], ['t09', 'Three quotes, no time.'], ['t18', 'The agent makes things up.']]
};
let WOCHEN = WOCHEN_TEXT.de;
let MOMENTE = MOMENTE_TEXT.de;
const ALTE_ANKER = ['notizen-zu-protokoll', 'antwort-auf-kundenmail', 'tabelle-pruefen', 'agent-interne-anleitungen', 'agent-anfragen-sortieren'];
// Zweisprachigkeit 16.10.2026: dojo.js 20 auf 23 und dojo-seiten.js 28 auf 32 (englische Texte direkt im Skript, kein Nachladen), sprache.js neu 2.
// Budgets in KB. Korrektur 15.10.2026: site.css 40 auf 46 (Schrift, Fokus, Hero, kompakter Pfad), core.js 20 auf 22,
// dojo-seiten.js und dojo-extra.js neu gedeckelt, Schriftdateien gedeckelt. Ueber 120 Prozent bricht der Build ab.
// Review 15.10.2026: site.css 46 auf 49 (Startseite mit Gratis-Check, Pfadzeilen, kompakter Technik des Tages),
// gratis.js 9 auf 11 (Urteil im Ergebnis, Vorauswahl von der Startseite). Die Startseite selbst ist um ein Viertel kleiner.
const BUDGET = { 'assets/css/site.css': 49, 'assets/css/technik.css': 6, 'assets/css/dojo.css': 6, 'assets/css/gratis.css': 8, 'assets/js/theme-init.js': 1, 'assets/js/core.js': 22, 'assets/js/dojo.js': 23, 'assets/js/dojo-seiten.js': 32, 'assets/js/dojo-extra.js': 9, 'assets/js/gratis.js': 11, 'assets/js/kompass.js': 5, 'assets/data/suche.json': 10, 'assets/fonts/dojo-display-600.woff2': 25, 'assets/fonts/dojo-display-700.woff2': 25, 'index.html': 60, 'en/index.html': 60, 'assets/data/en/suche.json': 10, 'assets/js/sprache.js': 2, 'templates/partials/tusch.svg': 4 };

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
const MONATE_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Datum in der Sprache des laufenden Durchgangs: 15.10.2026 oder October 15, 2026
function datumCH(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return istEN() ? `${MONATE_EN[+m - 1]} ${+d}, ${y}` : `${d}.${m}.${y}`; }
const T = (de, en) => (istEN() ? en : de);
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
// Englisch: templates/partials/en/<name> bzw. templates/en/<datei>, falls vorhanden, sonst die gemeinsame Fassung
function partial(name) {
  const key = `${L}:${name}`;
  if (!partialCache[key]) {
    const datei = [...(L === 'en' ? ['html', 'svg'].map(e => `templates/partials/en/${name}.${e}`) : []), ...['html', 'svg'].map(e => `templates/partials/${name}.${e}`)].find(gibtEs);
    if (!datei) { fehler(`Partial fehlt: templates/partials/${name}`); return ''; }
    partialCache[key] = lies(datei).replace(/\s+$/, '');
  }
  return partialCache[key];
}
function vorlage(datei) {
  if (L === 'en') { if (gibtEs(`templates/en/${datei}`)) return lies(`templates/en/${datei}`); fehler(`templates/en/${datei} fehlt`); }
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

/* Daten laden. Englisch: data/techniken.en.json legt Textfelder ueber die deutschen Eintraege (gleiche id, gleiche Struktur). */
let daten, datenEN;
try { daten = JSON.parse(lies('data/techniken.json')); }
catch (e) { console.error(`data/techniken.json ist nicht lesbar: ${e.message}`); process.exit(1); }
try { datenEN = JSON.parse(lies('data/techniken.en.json')); }
catch (e) { console.error(`data/techniken.en.json ist nicht lesbar: ${e.message}`); process.exit(1); }
function guertelListe() {
  const quelle = L === 'en' ? datenEN.guertel : daten.guertel;
  const g = guertelStandard().map(s => ({ ...s, leitwort: '', kannst_du: '', erreicht_satz: '', ...((quelle || []).find(x => x.nr === s.nr) || {}) }));
  g.forEach(x => { x.anker = ANKER[x.farbe] || `guertel-${x.nr}`; if (!x.kurz) x.kurz = GUERTEL_NAMEN[L][x.nr - 1][1]; });
  return g;
}
let GUERTEL = guertelListe();
const gName = (n) => (GUERTEL[n - 1] || {}).name || T(`Gürtel ${n}`, `Belt ${n}`);
const ALLE_DE = Array.isArray(daten.techniken) ? daten.techniken : [];
// Englische Eintraege: Struktur und Metadaten aus dem deutschen Eintrag, Texte aus techniken.en.json
const ALLE_EN = ALLE_DE.map(t => {
  const en = (datenEN.techniken || {})[t.id];
  if (!en) { fehlerListe.push(`${t.id}: Übersetzung fehlt in data/techniken.en.json`); return { ...t }; }
  const aus = { ...t, ...en };
  if (t.rechner) {
    const r = en.rechner || {};
    aus.rechner = { ...t.rechner, ...r, beispiel: { ...t.rechner.beispiel, ...(r.beispiel || {}) },
      raten: t.rechner.raten.map(x => ({ ...x, ...((r.raten || []).find(y => y.schluessel === x.schluessel) || {}) })) };
  }
  for (const k of ['so_nutzt_du_es', 'das_darfst_du_erwarten', 'grenzen', 'zielgruppe', 'zusatz_texte']) if (Array.isArray(t[k]) && (!Array.isArray(aus[k]) || aus[k].length !== t[k].length)) fehlerListe.push(`${t.id}: englisches Feld ${k} hat nicht gleich viele Einträge`);
  return aus;
});
let ALLE = ALLE_DE;

/* Validierung */
const PFLICHT = ['id', 'slug', 'titel', 'guertel', 'werkzeug', 'zielgruppe', 'problem', 'technik_text', 'so_nutzt_du_es', 'das_darfst_du_erwarten', 'grenzen', 'quelle_url', 'quelle_titel', 'geprueft_am', 'dauer_min', 'teilen_text'];
const VERBOTEN_DE = [[/[\u2013\u2014]/, 'Gedankenstrich'], [/\u00df/, 'Eszett'], [/\p{Extended_Pictographic}/u, 'Emoji'], [/getestet/i, '«getestet»'], [/garantiert/i, '«garantiert»'], [/offiziell/i, '«offiziell»'], [/zertifiziert/i, '«zertifiziert»'], [/\bM365\b/i, '«M365»'], [/copilot[\s-]ninja/i, '«Copilot-Ninja»']];
// Englisch: gleiche Regeln sinngemaess, dazu keine deutschen Anfuehrungszeichen
const VERBOTEN_EN = [[/[\u2013\u2014]/, 'Gedankenstrich'], [/\u00df/, 'Eszett'], [/\p{Extended_Pictographic}/u, 'Emoji'], [/[\u00ab\u00bb]/, '«»'], [/\btested\b/i, '«tested»'], [/guarantee/i, '«guarantee»'], [/\bofficial/i, '«official»'], [/\bcertified\b/i, '«certified»'], [/\bM365\b/i, '«M365»'], [/copilot[\s-]ninja/i, '«Copilot-Ninja»']];
let VERBOTEN = VERBOTEN_DE;
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
  texteVon((istEN() ? datenEN : daten).guertel || [], `${L}:guertel`, []).forEach(([p, t]) => VERBOTEN.forEach(([re, w]) => re.test(t) && fehler(`${p}: enthält ${w}`)));
  for (const t of ALLE) {
    const wo = (istEN() ? 'en:' : '') + (t.id || '(ohne id)');
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
L = 'en'; ALLE = ALLE_EN; VERBOTEN = VERBOTEN_EN; validiere();
L = 'de'; ALLE = ALLE_DE; VERBOTEN = VERBOTEN_DE;

/* Auswahl je Modus und Sprache. setzeSprache('de'|'en') stellt alle Listen auf die Sprache des Durchgangs. */
const istFrei = (t) => istIso(t.freigabe) && (!t.offen_pruefen || !t.offen_pruefen.length);
const VORSCHAU = MODUS !== 'produktion';
const ohneFreigabe = (liste) => VORSCHAU && liste.some(t => t && !istFrei(t));
const neuGrenze = (() => { const d = new Date(DATUM + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 30); return d.toISOString().slice(0, 10); })();
let DABEI, sortiert, TECHNIKEN, GRUNDFORMEN, NACH_ID, ALLE_NACH_ID, ANZAHL, STAND, alleNeu, mailtoBeitrag, BASE_L;
function setzeSprache(l) {
  L = l;
  ALLE = l === 'en' ? ALLE_EN : ALLE_DE;
  VERBOTEN = l === 'en' ? VERBOTEN_EN : VERBOTEN_DE;
  ART = artFuer(); ZUGANG = zugangFuer(); GUERTEL = guertelListe();
  WOCHEN = WOCHEN_TEXT[l]; MOMENTE = MOMENTE_TEXT[l];
  BASE_L = BASE_URL + LP();
  DABEI = MODUS === 'produktion' ? ALLE.filter(istFrei) : ALLE.slice();
  sortiert = DABEI.slice().sort((a, b) => a.guertel - b.guertel || (a.typ === b.typ ? (a.nr || 0) - (b.nr || 0) || a.id.localeCompare(b.id) : a.typ === 'grundform' ? -1 : 1));
  TECHNIKEN = sortiert.filter(t => t.typ === 'technik');
  GRUNDFORMEN = sortiert.filter(t => t.typ === 'grundform');
  NACH_ID = Object.fromEntries(DABEI.map(t => [t.id, t]));
  ALLE_NACH_ID = Object.fromEntries(ALLE.map(t => [t.id, t]));
  ANZAHL = MODUS === 'produktion' ? TECHNIKEN.length : 25;
  STAND = DABEI.map(t => t.geprueft_am).filter(istIso).sort().pop() || daten.stand || DATUM;
  alleNeu = DABEI.length && DABEI.filter(t => t.datum_publiziert >= neuGrenze).length > DABEI.length / 2;
  mailtoBeitrag = l === 'en'
    ? 'mailto:' + KONTAKT + '?subject=' + encodeURIComponent('Technique for the Dojo') + '&body=' + encodeURIComponent('Title of the technique:\n\nProblem it solves:\n\nPrompt or guide:\n\nLimits:\n\nSource on Microsoft Learn:\n\nMay I name you as the sender? (yes or no)\n\nPlease no customer, personal or company data in the prompt.')
    : 'mailto:' + KONTAKT + '?subject=' + encodeURIComponent('Technik für das Dojo') + '&body=' + encodeURIComponent('Titel der Technik:\n\nProblem, das sie löst:\n\nPrompt oder Anleitung:\n\nGrenzen:\n\nQuelle bei Microsoft Learn:\n\nDarf ich dich als Absender nennen? (ja oder nein)\n\nBitte keine Kunden-, Personen- oder Firmendaten im Prompt.');
}
setzeSprache('de');
if (MODUS === 'produktion') ALLE.filter(t => !istFrei(t)).forEach(t => warnung(`Produktion: ${t.id} ausgelassen (${!istIso(t.freigabe) ? 'keine Freigabe' : 'offen_pruefen nicht leer'})`));
// Der Pruefstempel nennt das Datum der Lesung gegen Learn. Liest Marcel bei der Freigabe selbst nach, gehoert sein Datum in geprueft_am.
if (MODUS === 'produktion') ALLE.filter(t => istFrei(t) && istIso(t.geprueft_am) && t.freigabe > t.geprueft_am).forEach(t => warnung(`Produktion: ${t.id} freigegeben am ${t.freigabe}, geprueft_am ${t.geprueft_am}. Hast du die Quellen bei der Freigabe gelesen, setz geprueft_am auf dieses Datum.`));
const urlTechnik = (t) => `${BASE_L}techniken/${t.slug}/`;
const nrLabel = (t) => t.typ === 'technik' ? pad2(t.nr) : t.id.toUpperCase();

/* Gratis-Anker (beide Sprachen haben dieselben Anker) */
for (const datei of ['gratis/index.html', 'en/gratis/index.html']) {
  const ids = gibtEs(datei) ? new Set([...lies(datei).matchAll(/\sid="([^"]+)"/g)].map(m => m[1])) : null;
  if (!ids && datei.startsWith('en/')) { fehler(`${datei} fehlt`); continue; }
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
  return `<a class="zugang zugang--${z.klasse}" href="${r}gratis/#${esc(anker)}">${z.icon}${esc(text)}</a>`;
}
function artBadge(t) { const a = ART[t.art]; return a ? `<span class="art art--${t.art}">${a.icon}${a.name}</span>` : ''; }
function knoten(n, text, extra = '') { return `<span class="knoten${extra}" data-guertel-nr="${n}">${esc(text)}</span>`; }
function phSpan(name, hinweis) {
  const zeige = hinweis ? (/^(z\.\s?B\.|e\.g\.)/.test(hinweis) ? `[${name}, ${hinweis}]` : `[${name}, ${T('z. B.', 'e.g.')} ${hinweis}]`) : `[${name}]`;
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
const TEILE = { Ziel: 'ziel', Kontext: 'kontext', Quelle: 'quelle', Erwartung: 'erwartung', Goal: 'ziel', Context: 'kontext', Source: 'quelle', Expectations: 'erwartung', Expectation: 'erwartung' };
const TEIL_START = /^(Ziel|Kontext|Goal|Context):/m;
function textMitTeilen(text, hinweise) {
  return text.split(/(\n[ \t]*\n)/).map((absatz, i) => {
    if (i % 2) return absatz;
    const m = absatz.match(/^(Ziel|Kontext|Quelle|Erwartung|Goal|Context|Source|Expectations|Expectation):/);
    if (!m) return textHtml(absatz, hinweise);
    return `<mark class="teil teil--${TEILE[m[1]]}"><span class="teil__label">${m[1]}:</span>${textHtml(absatz.slice(m[0].length), hinweise)}</mark>`;
  }).join('');
}
function herkunft(t) {
  const adresse = t.typ === 'technik' ? `${KURZ_BASIS}/${LP()}${t.nr}` : urlTechnik(t);
  return T(`Technik aus dem KMUpower Dojo: ${adresse}\nQuelle: Microsoft Learn, Stand ${datumCH(t.geprueft_am)}`, `Technique from the KMUpower Dojo: ${adresse}\nSource: Microsoft Learn, as of ${datumCH(t.geprueft_am)}`);
}
function schmiedeHtml(t, praefixId, ebene = 'h3') {
  const felder = Object.entries(t._felder || {});
  if (!felder.length) return '';
  const profil = felder.some(([n]) => ['Firmenname', 'Funktion', 'Branche', 'Company name', 'Role', 'Industry'].includes(n));
  const lang = /(text|notizen|inhalt|entwurf|mail|anweisungen?|verlauf|reglement|offerten?|liste|fall|chat|notes|content|draft|instructions?|history|policy|quotes?|list|case|transcript)$/i;
  const html = felder.map(([name, hinweis], i) => {
    const id = `${praefixId}-f${i + 1}`;
    const breit = lang.test(name) || hinweis.length > 40;
    const feld = breit
      ? `<textarea id="${id}" data-ph-feld="${esc(name)}" rows="4"${hinweis ? ` aria-describedby="${id}-h"` : ''}></textarea>`
      : `<input id="${id}" type="text" data-ph-feld="${esc(name)}" autocomplete="off"${hinweis ? ` aria-describedby="${id}-h"` : ''}>`;
    return `<div class="schmiede__feld${breit ? ' schmiede__feld--breit' : ''}"><label for="${id}">${esc(name)}</label>${feld}${hinweis ? `<small id="${id}-h">${esc(/^(z\.\s?B\.|e\.g\.)/.test(hinweis) ? hinweis : T('z. B. ', 'e.g. ') + hinweis)}</small>` : ''}</div>`;
  }).join('\n');
  return `<div class="schmiede" data-nur-js>
<div class="schmiede__kopf"><${ebene}>${T('Für dich anpassen', 'Make it yours')}</${ebene}><p class="schmiede__hinweis">${T('Nichts verlässt deinen Browser.', 'Nothing leaves your browser.')}${profil ? T(' Firmenname, Funktion und Branche kommen aus deinem Profil unter Mein Dojo.', ' Company name, role and industry come from your profile in My Dojo.') : ''}</p></div>
${html}
</div>`;
}
function rolleHtml(t, preId, titel, text, mitTeilen, erfolg, knopfText) {
  const inhalt = mitTeilen ? textMitTeilen(text, t._felder) : textHtml(text, t._felder);
  return `<div class="rolle" data-rolle>
<div class="rolle__kopf"><p class="rolle__titel">${esc(titel)}</p></div>
<pre class="code" id="${preId}">${inhalt}</pre>
<div class="rolle__knoepfe"><button type="button" class="knopf knopf--primaer knopf--klein" data-kopieren="${preId}" data-erfolg="${esc(erfolg)}" data-nur-js>${esc(knopfText)}</button><button type="button" class="knopf knopf--klein" data-weitergeben="${preId}" data-herkunft="${esc(herkunft(t)).replace(/\n/g, '&#10;')}" data-nur-js>${T('Weitergeben', 'Pass it on')}</button><p class="rolle__status" role="status"></p></div>
</div>`;
}
function rollenFuer(t, praefixId) {
  const a = ART[t.art] || ART.pinselstrich;
  const haupt = rolleHtml(t, praefixId, a.rolle, t.technik_text, t.art !== 'kata' || TEIL_START.test(t.technik_text), a.erfolg, a.knopf);
  const zusatz = (t.zusatz_texte || []).map((z, i) => rolleHtml(t, `${praefixId}-${i + 2}`, z.titel || T(`Schritt ${i + 2}`, `Step ${i + 2}`), z.text || '', TEIL_START.test(z.text || ''), ART.kata.erfolg, ART.kata.knopf)).join('\n');
  return haupt + (zusatz ? '\n' + zusatz : '');
}
function karte(t, r, mitNutzen = true) {
  const kurzAdresse = t.typ === 'technik' ? `${KURZ_BASIS}/${LP()}${t.nr}` : '';
  const neu = !alleNeu && t.datum_publiziert >= neuGrenze ? ' karte--neu' : '';
  return `<li class="karte${t.typ === 'grundform' ? ' karte--grundform' : ''}${neu}" data-technik="${t.id}" data-guertel-nr="${t.guertel}" data-zugang="${esc(t.zugang || '')}" data-art="${esc(t.art || '')}" data-werkzeug="${esc((t.werkzeug || []).join(' '))}">
<div class="karte__oben"><span class="karte__nr">${t.typ === 'technik' ? pad2(t.nr) : T('Grundform ', 'Basic form ') + t.id.toUpperCase()}</span>${neu ? `<span class="tag">${T('Neu', 'New')}</span>` : ''}</div>
<h3 class="karte__titel"><a href="${r}techniken/${t.slug}/">${esc(t.titel)}</a></h3>
${t.titel !== t.klartitel && t.klartitel ? `<p class="karte__klartitel">${esc(t.klartitel)}</p>` : ''}
${mitNutzen && t.nutzen ? `<p class="karte__nutzen">${esc(t.nutzen)}</p>` : ''}
<div class="karte__meta">${zugangBadge(t, r, true)}${artBadge(t)}<span>${T(`ca. ${t.dauer_min} Min.`, `approx. ${t.dauer_min} min`)}</span><span class="karte__status" data-status hidden></span>${kurzAdresse ? `<span class="karte__kurz nur-druck">${kurzAdresse}</span>` : ''}</div>
</li>`;
}
function kompakt(t, r) {
  return `<li class="karte-kompakt" data-technik="${t.id}" data-guertel-nr="${t.guertel}"><span class="karte-kompakt__nr">${nrLabel(t)}</span><a class="karte-kompakt__link" href="${r}techniken/${t.slug}/">${esc(t.titel)}</a>${t.klartitel && t.klartitel !== t.titel ? `<span class="klein">${esc(t.klartitel)}</span>` : ''}${zugangBadge(t, r, true)}</li>`;
}
const NOCH_NICHT_TEXT = { de: 'Noch nicht freigegeben. Erscheint, sobald Marcel die Techniken gegen die Dokumentation geprüft hat.', en: 'Not released yet. Appears as soon as Marcel has checked the techniques against the documentation.' };
let NOCH_NICHT = NOCH_NICHT_TEXT.de;
// Die Schwelle erscheint nur, wenn im Build Agent-Techniken (ab Gruen) stehen. Sonst folgte dem Kurshinweis nur
// «Noch nicht freigegeben», und der Agent-Teil saehe aus wie hinter dem Kurs versteckt (Konzept 7.2).
const MIT_AGENTS = DABEI.some(t => t.guertel >= 4);
// Kursname laut Academy ab 15.10.2026 (Entscheid Marcel: Disclaimer reicht), URL bleibt copilot-expert. Der Kurs ist deutsch.
const KURS_NAME = 'Copilot Ninja in 4 Wochen';
const kursEigen = () => T('Der Kurs hat einen eigenen Lehrplan und folgt nicht den Gürteln dieser Seite.', 'The course has its own curriculum and does not follow the belts of this site.');
function schwelleHtml(ebene = 'h3', extra = '') {
  if (!MIT_AGENTS) return '';
  if (istEN()) return `<aside class="schwelle${extra}" aria-labelledby="schwelle-titel">
<span class="label">The threshold</span>
<${ebene} id="schwelle-titel">From here on you build agents.</${ebene}>
<p>In the Copilot Studio trial you can create an agent and check it in the test chat, but not publish it (<a href="${LEARN_TESTVERSION}" rel="noopener">Microsoft Learn</a>, as of October 13, 2026). All agent techniques are free here, no sign-up.</p>
<p class="klein">If you prefer to practice with guidance: the Power Platform Academy runs the live course “${KURS_NAME}” (in German), dates open, registering interest is non-binding. ${kursEigen()} <a href="${esc(KURS_URL('schwelle'))}" rel="noopener">To the course page</a></p>
</aside>`;
  return `<aside class="schwelle${extra}" aria-labelledby="schwelle-titel">
<span class="label">Die Schwelle</span>
<${ebene} id="schwelle-titel">Ab hier baust du Agents.</${ebene}>
<p>In der Testversion von Copilot Studio kannst du einen Agent erstellen und im Testchat prüfen, aber nicht veröffentlichen (<a href="${LEARN_TESTVERSION}" rel="noopener">Microsoft Learn</a>, Stand 13.10.2026). Alle Agent-Techniken stehen hier frei, ohne Anmeldung.</p>
<p class="klein">Wer lieber mit Begleitung übt: Die Power Platform Academy führt den Live-Kurs «${KURS_NAME}», Termine offen, Vormerken unverbindlich. ${kursEigen()} <a href="${esc(KURS_URL('schwelle'))}" rel="noopener">Zur Kursseite</a></p>
</aside>`;
}
// Startseite: Guertelpfad als sieben Zeilen (Review 15.10.2026, Kapitel 5): Farbe, Name, Anzahl, ein Beispiel.
// Die Schwelle ist nur eine Markierung zwischen Orange und Gruen. Die volle Liste steht auf /techniken/.
function guertelpfadHtml(r) {
  const zeile = (g) => {
    const drin = sortiert.filter(t => t.guertel === g.nr);
    const tk = drin.filter(t => t.typ === 'technik');
    const bsp = tk[0] || drin[0];
    const anzahl = tk.length ? `${tk.length} ${tk.length === 1 ? T('Technik', 'technique') : T('Techniken', 'techniques')}` : `${drin.length} ${drin.length === 1 ? T('Grundform', 'basic form') : T('Grundformen', 'basic forms')}`;
    return `<li class="pfadzeile" data-guertel-nr="${g.nr}" id="pfad-${g.farbe}"><span class="pfadzeile__band" aria-hidden="true"></span><a class="pfadzeile__name" href="${r}techniken/#${g.anker}">${esc(g.name)}</a><span class="pfadzeile__zahl">${drin.length ? anzahl : T('offen', 'open')}</span>${bsp ? `<a class="pfadzeile__bsp" href="${r}techniken/${bsp.slug}/">${bsp.typ === 'technik' ? pad2(bsp.nr) + ' ' : ''}${esc(bsp.titel)}</a>` : ''}<p class="fortschritt__text pfadzeile__stand" data-fortschritt="${g.nr}" hidden></p></li>`;
  };
  const marke = MIT_AGENTS ? T(`<p class="pfadzeilen__schwelle"><strong>Die Schwelle.</strong> Ab hier baust du Agents. Die <a href="${LEARN_TESTVERSION}" rel="noopener">Testversion von Copilot Studio</a> reicht zum Üben.</p>\n`, `<p class="pfadzeilen__schwelle"><strong>The threshold.</strong> From here on you build agents. The <a href="${LEARN_TESTVERSION}" rel="noopener">Copilot Studio trial</a> is enough to practice.</p>\n`) : '';
  return `<ol class="pfadzeilen">${GUERTEL.slice(0, 3).map(zeile).join('\n')}</ol>
${marke}<ol class="pfadzeilen" start="4">${GUERTEL.slice(3).map(zeile).join('\n')}</ol>`;
}
function vierWochenHtml(r, ebene) {
  const sub = ebene === 'h2' ? 'h3' : 'h4';
  let fehltWoche = false;
  const wochen = WOCHEN.map(w => {
    const liste = w.ergebnisse.filter(([id]) => NACH_ID[id]).map(([id, text]) => { const t = NACH_ID[id]; return `<li>${esc(text)} (<a href="${r}techniken/${t.slug}/">${T('Nr.', 'No.')} ${t.nr}</a>)</li>`; });
    if (!liste.length) fehltWoche = true;
    return `<li class="woche"><span class="woche__nr" aria-hidden="true">${w.nr}</span>
<${sub}>${T('Woche', 'Week')} ${w.nr}</${sub}>
<div class="woche__guertel">${w.guertel.map(n => knoten(n, GUERTEL[n - 1].kurz)).join('')}</div>
${liste.length ? `<p>${T('Wenn du die Techniken dieser Woche übst, hast du danach in der Hand:', 'If you practice this week’s techniques, afterwards you have:')}</p><ul class="woche__ergebnis">${liste.join('')}</ul>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
</li>`;
  }).join('\n');
  // Eigene ID (vorher doppelt «h-pfad» auf der Startseite). Der Kalenderknopf steht im HTML, damit beim Laden nichts springt.
  if (istEN()) return `<div class="vier-wochen" id="vier-wochen">
<span class="label">Four-week path for self-study</span>
<${ebene} id="h-vier-wochen"${ebene === 'h3' ? ' class="h2-gross"' : ''}>Through all belts in four weeks</${ebene}>
<p class="lead">A free plan, no sign-up and no course. One or two belts each week.</p>
<ol class="wochen">${wochen}</ol>
${fehltWoche ? '' : '<p class="pfad-schluss">After four weeks you have your own agent with test questions, safeguard block, credit estimate and operations sheet.</p>'}
<p class="klein">What you need for it is shown in the access line of every technique.</p>
<p class="knopf-reihe nicht-drucken"><button type="button" class="knopf" data-wochen-ics data-nur-js>Four weeks into your calendar, starting next Monday</button></p>
</div>`;
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
// Startseite: Rotation nur ueber Techniken ohne Zusatzlizenz vom weissen bis zum orangen Guertel (Review 15.10.2026, H6).
// Gleiche Regel in dojo.js (heuteKompakt). /heute/ behaelt die volle Rotation.
const FUER_START = (t) => t && t.zugang === 'ohne-zl' && t.guertel <= 3;
function heuteTechnik(nurStart = false) {
  const folge = (daten.tag_reihenfolge || []).filter(id => NACH_ID[id] && NACH_ID[id].typ === 'technik' && (!nurStart || FUER_START(NACH_ID[id])));
  if (!folge.length) return null;
  const start = istIso(daten.tag_start) ? daten.tag_start : DATUM;
  const n = ((tageZwischen(start, DATUM) % folge.length) + folge.length) % folge.length;
  return NACH_ID[folge[n]];
}
function heuteHtml(t, r, ebene) {
  if (!t) return `<div class="naechster"><p>${NOCH_NICHT}</p><p><a href="${r}techniken/">${T('Zur Technik-Wand', 'To the technique wall')}</a></p></div>`;
  return `<article class="karte--gross rolle-gross" data-technik="${t.id}" data-guertel-nr="${t.guertel}" data-schmiede>
<div class="heute__kopf"><span class="heute__nr" aria-hidden="true">${pad2(t.nr)}</span><div>
<${ebene} class="heute__titel">${esc(t.titel)}<small>${T('Nr.', 'No.')} ${t.nr}: ${esc(t.klartitel)}</small></${ebene}>
<ul class="metazeile"><li>${knoten(t.guertel, gName(t.guertel))}</li><li>${zugangBadge(t, r)}</li><li><span>${T(`Ausprobieren: ca. ${t.dauer_min} Min.`, `Try it: approx. ${t.dauer_min} min`)}</span></li></ul>
</div></div>
<p class="abschnitt__problem">${esc(t.problem)}</p>
${schmiedeHtml(t, 'heute', ebene === 'h2' ? 'h3' : 'h4')}
${rolleHtml(t, 'heute-text', (ART[t.art] || ART.pinselstrich).rolle, t.technik_text, true, (ART[t.art] || ART.pinselstrich).erfolg, (ART[t.art] || ART.pinselstrich).knopf)}
<p><a class="knopf knopf--leise" href="${r}techniken/${t.slug}/">${T('Ganze Technik mit Anleitung, Grenzen und Quelle', 'Full technique with guide, limits and source')}</a></p>
</article>`;
}
// Kompakte Karte der Technik des Tages auf der Startseite, ohne Formular. dojo.js tauscht die Felder nach lokalem Datum.
function heuteKompaktHtml(t) {
  if (!t) return `<p>${NOCH_NICHT}</p>`;
  return `<article class="tdk" data-heute-kompakt data-technik="${t.id}" data-guertel-nr="${t.guertel}">
<span class="tdk__nr" aria-hidden="true">${pad2(t.nr)}</span>
<div class="tdk__inhalt">
<h3 class="tdk__titel"><a href="techniken/${t.slug}/">${esc(t.titel)}</a><small>${T('Nr.', 'No.')} ${t.nr}: ${esc(t.klartitel)}</small></h3>
<p class="tdk__problem">${esc(t.problem)}</p>
<ul class="metazeile"><li>${knoten(t.guertel, gName(t.guertel))}</li><li>${zugangBadge(t, '', true)}</li></ul>
<p><a class="knopf knopf--primaer knopf--klein tdk__knopf" href="techniken/${t.slug}/">${T('Technik öffnen', 'Open technique')}</a></p>
</div>
</article>`;
}
function filterHtml() {
  const werkzeuge = [...new Set(DABEI.flatMap(t => t.werkzeug || []))].filter(w => PRODUKTNAMEN[w]);
  const zugaenge = Object.keys(ZUGANG).filter(z => DABEI.some(t => t.zugang === z));
  const arten = Object.keys(ART).filter(a => DABEI.some(t => t.art === a));
  const chip = (f, v, text, k = '') => `<button type="button" class="chip" data-f="${f}" data-v="${esc(v)}" aria-pressed="false">${k}${esc(text)}</button>`;
  return `<div class="filter nicht-drucken" data-filter data-nur-js>
<fieldset><legend>${T('Gürtel', 'Belt')}</legend><div class="chips">${GUERTEL.map(g => chip('guertel-nr', g.nr, g.kurz, `<span class="knoten" data-guertel-nr="${g.nr}" aria-hidden="true"></span>`)).join('')}</div></fieldset>
<fieldset><legend>${T('Werkzeug', 'Tool')}</legend><div class="chips">${werkzeuge.map(w => chip('werkzeug', w, PRODUKTNAMEN[w])).join('')}</div></fieldset>
<fieldset><legend>${T('Zugang', 'Access')}</legend><div class="chips">${zugaenge.map(z => chip('zugang', z, ZUGANG[z].kurz)).join('')}</div></fieldset>
<fieldset><legend>${T('Art', 'Type')}</legend><div class="chips">${arten.map(a => chip('art', a, `${ART[a].name} (${ART[a].wort})`)).join('')}</div></fieldset>
<fieldset><legend>${T('Dein Stand', 'Your status')}</legend><div class="chips">${chip('stand', 'offen', T('Noch offen', 'Still open'))}${chip('stand', 'geuebt', T('Geübt', 'Practiced'))}</div></fieldset>
<div class="filter__fuss"><p class="filter__zaehler" data-filter-zaehler role="status" aria-live="polite"></p><button type="button" class="knopf knopf--leise knopf--klein" data-filter-reset>${T('Filter zurücksetzen', 'Reset filters')}</button></div>
</div>`;
}
function wandAbschnitte(r) {
  return GUERTEL.map(g => {
    const gf = GRUNDFORMEN.filter(t => t.guertel === g.nr), tk = TECHNIKEN.filter(t => t.guertel === g.nr);
    const teil = `<section class="guertel-abschnitt sektion--eng" id="${g.anker}" aria-labelledby="h-${g.anker}" data-guertel-nr="${g.nr}">
<h2 id="h-${g.anker}"><span class="pfad__leitwort">${T('Stufe', 'Level')} ${g.nr}${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span>${knoten(g.nr, g.name, ' knoten--gross')}</h2>
${g.kannst_du ? `<p class="prose">${T('Was du danach kannst:', 'What you can do afterwards:')} ${esc(g.kannst_du)}</p>` : ''}
${gf.length ? `<p class="label">${T('Aufwärmen', 'Warm-up')}</p><ul class="karten">${gf.map(t => karte(t, r)).join('\n')}</ul>` : ''}
${tk.length ? `${gf.length ? `<p class="label">${T('Techniken', 'Techniques')}</p>` : ''}<ul class="karten">${tk.map(t => karte(t, r)).join('\n')}</ul>` : (gf.length ? '' : `<p class="pfad__offen">${NOCH_NICHT}</p>`)}
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
  if (istEN()) return `    <section class="abschnitt" aria-labelledby="h-rechner">
      <h2 id="h-rechner">The compass</h2>
      <div class="rechner" data-kompass data-raten="${esc(JSON.stringify(r))}">
        <p>Rates according to Microsoft in ${esc(r.einheit || 'Copilot Credits')}: ${(r.raten || []).map(x => `${esc(x.name)} ${x.credits}`).join(', ')}.</p>
        <p>Example: ${b.gespraeche} conversations per month with ${b.generativ} Generative Answers and ${b.aktion} Agent Action each give ${b.gespraeche} times ${jeGespraech}, so <span class="rechner__ergebnis">${summe.toLocaleString('en-US')}</span> Copilot Credits. ${esc(b.hinweis || '')}</p>
        <ul class="arrow-list">${(r.regeln || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${r.lizenz_hinweis ? `<p>${esc(r.lizenz_hinweis)}</p>` : ''}
        <p class="klein">Source: ${quellen}, as of ${datumCH(r.geprueft_am)}. No price per credit; you find prices at Microsoft.</p>
      </div>
    </section>
`;
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
  if (istEN()) return `<div class="schnitt" id="schnitt-karte" data-schnitt data-technik="${t.id}">
<div class="schnitt__fuss"><span class="label">The cut</span><div class="schnitt__umschalter" role="group" aria-label="View"><button type="button" data-zeige="vorher" aria-pressed="false">Before</button><button type="button" data-zeige="nachher" aria-pressed="true">After</button></div></div>
<div class="schnitt__buehne">
<div class="schnitt__vorher"><span class="label">Before</span><p class="schnitt__zitat">“${esc(t.vorher)}”</p></div>
<div class="schnitt__nachher"><span class="label">After</span><pre class="code" id="schnitt-text">${textMitTeilen(t.technik_text, t._felder)}</pre></div>
<svg class="schnitt__strich" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M3 66C28 58 58 44 97 30"/></svg>
</div>
<ul class="teile-legende" aria-label="The four parts of an effective prompt"><li class="teil--ziel">Goal</li><li class="teil--kontext">Context</li><li class="teil--quelle">Source</li><li class="teil--erwartung">Expectations</li></ul>
<div class="schnitt__fuss" data-rolle><button type="button" class="knopf knopf--primaer knopf--klein" data-kopieren="schnitt-text" data-erfolg="${esc(ART.pinselstrich.erfolg)}" data-nur-js>Copy prompt</button><p class="rolle__status" role="status"></p></div>
<p class="schnitt__hinweis">Example. The answer can differ depending on license and data. The four parts come from the learning module <a href="${LEARN_PROMPTS}" rel="noopener">“Write effective prompts”</a> on Microsoft Learn, as of October 15, 2026.</p>
</div>`;
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
          <span class="haken__text"><span class="haken__vorher">${T('«', '“')}${esc(t.vorher)}${T('»', '”')}<svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 13C30 9 66 7 99 8"/></svg></span><span class="haken__nachher">${T('Daraus werden vier Teile: <b class="teil--ziel">Ziel</b>, <b class="teil--kontext">Kontext</b>, <b class="teil--quelle">Quelle</b>, <b class="teil--erwartung">Erwartung</b>.', 'It becomes four parts: <b class="teil--ziel">Goal</b>, <b class="teil--kontext">Context</b>, <b class="teil--quelle">Source</b>, <b class="teil--erwartung">Expectations</b>.')}</span></span>
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
function markenText() { return MARKEN.slice(0, -1).join(', ') + T(' und ', ' and ') + MARKEN[MARKEN.length - 1]; }
const NAV_ZIEL = { wand: 'techniken', technik: 'techniken', heute: 'techniken', gratis: 'gratis', dojo: 'dojo', test: 'dojo', guertel: 'dojo', ueber: 'ueber' };
// Pfad einer Seite relativ zur Sprachwurzel: 'en/techniken/x/index.html' und 'techniken/x/index.html' ergeben 'techniken/x/'
function seitenPfad(rel) { return rel.replace(/^en\//, '').replace(/index\.html$/, '').replace(/^404\.html$/, ''); }
// ra: Weg zur Wurzel (Assets, gemeinsam), r: Weg zur Sprachwurzel (Seiten). Auf Deutsch sind beide gleich.
function wege(rel, absolut) {
  if (absolut) { const b = new URL(BASE_URL).pathname; return { ra: b, r: b + LP() }; }
  const ra = praefix(rel);
  return { ra, r: istEN() ? ra.slice(3) : ra };
}
function sprachKontext(rel, absolut, mitAlternates) {
  const pfad = absolut ? '' : seitenPfad(rel);
  const { ra } = wege(rel, absolut);
  const ziel = istEN() ? `${ra}${pfad}` : `${ra}en/${pfad}`;
  const link = istEN()
    ? `<a class="sprachwahl" href="${ziel || './'}" hreflang="de" lang="de-CH" data-sprache-wahl="de" aria-label="Deutsche Version dieser Seite">DE</a>`
    : `<a class="sprachwahl" href="${ziel}" hreflang="en" lang="en" data-sprache-wahl="en" aria-label="English version of this page">EN</a>`;
  const alternates = mitAlternates ? [`<link rel="alternate" hreflang="de" href="${BASE_URL}${pfad}">`, `<link rel="alternate" hreflang="en" href="${BASE_URL}en/${pfad}">`, `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${pfad}">`].join('\n') + '\n' : '';
  return { sprachwahl: link, alternates };
}
function rahmenKontext(rel, seite, extra = {}, absolut = false) {
  const { r, ra } = wege(rel, absolut);
  const ziel = NAV_ZIEL[seite];
  const cur = (n) => ziel === n ? (/^(wand|gratis|dojo|ueber)$/.test(seite) ? ' aria-current="page"' : ' aria-current="true"') : '';
  const cssExtra = seite === 'gratis' ? `<link rel="stylesheet" href="${ra}assets/css/gratis.css">\n` : /^(dojo|test|guertel)$/.test(seite) ? `<link rel="stylesheet" href="${ra}assets/css/dojo.css">\n` : seite === 'technik' ? `<link rel="stylesheet" href="${ra}assets/css/technik.css">\n` : '';
  // Sprachweiche nur auf der deutschen Startseite und auf 404 (nur im Browser, Suchmaschinen sehen keine Weiterleitung)
  const weiche = (!istEN() && seite === 'start') || seite === '404' ? `<script src="${ra}assets/js/sprache.js"></script>\n` : '';
  return {
    r, ra, feed_titel: T('KMUpower Dojo: neue Techniken', 'KMUpower Dojo: new techniques'), css_extra: cssExtra, js_extra: '', vorschau_banner: '', sprach_weiche: weiche,
    ...sprachKontext(rel, absolut, seite !== '404'),
    tusch_marke: tusch('ruhe'), tusch_fuss: tusch('ruhe'), wortmarke: wortmarke(),
    icon_suche: ICONS.suche, icon_zufall: ICONS.zufall, icon_sonne: ICONS.sonne, icon_mond: ICONS.mond, icon_menue: ICONS.menue, icon_zu: ICONS.zu,
    cur_techniken: cur('techniken'), cur_gratis: cur('gratis'), cur_dojo: cur('dojo'), cur_ueber: cur('ueber'),
    mailto_beitrag: mailtoBeitrag, markenliste: markenText(),
    newsletter_footer: NEWSLETTER_URL('footer'), academy_footer: ACADEMY_URL('footer'),
    ...extra
  };
}
const HTML_LANG = () => T('de-CH', 'en');
function metaHtml(p) {
  const zeilen = [GENERATOR, `<title>${esc(p.titel)}</title>`, `<meta name="description" content="${esc(p.beschreibung)}">`];
  if (p.noindex) zeilen.push('<meta name="robots" content="noindex">');
  if (p.canonical) zeilen.push(`<link rel="canonical" href="${p.canonical}">`);
  const bild = p.ogBild || `${BASE_URL}${T('og-image.png', 'og-image-en.png')}`;
  zeilen.push(
    `<meta property="og:type" content="${p.ogTyp || 'website'}">`, '<meta property="og:site_name" content="KMUpower Dojo">', `<meta property="og:locale" content="${T('de_CH', 'en_US')}">`,
    `<meta property="og:title" content="${esc(p.ogTitel || p.titel)}">`, `<meta property="og:description" content="${esc(p.ogBeschreibung || p.beschreibung)}">`);
  if (p.canonical) zeilen.push(`<meta property="og:url" content="${p.canonical}">`);
  zeilen.push(`<meta property="og:image" content="${bild}">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(p.ogAlt || T('KMUpower Dojo: Übung schlägt Hype.', 'KMUpower Dojo: Practice beats hype.'))}">`, '<meta name="twitter:card" content="summary_large_image">');
  if (p.jsonld) zeilen.push(jsonLd({ '@context': 'https://schema.org', '@graph': p.jsonld }));
  return zeilen.join('\n');
}
const ldWebsite = () => ({ '@type': 'WebSite', '@id': `${BASE_L}#website`, name: 'KMUpower Dojo', url: BASE_L, inLanguage: HTML_LANG(), description: T('Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio mit Quelle und Prüfdatum. Unabhängige Website ohne Verbindung zu Microsoft.', 'Ninja techniques for Microsoft Copilot Chat and Copilot Studio with sources and review dates. Independent website, not affiliated with Microsoft.'), publisher: { '@id': 'https://kmupower.com/#organization' } });
const LD_ORG = { '@type': 'Organization', '@id': 'https://kmupower.com/#organization', name: 'KMUpower', legalName: 'Marcel Lehmann (Handelsname KMUpower)', url: 'https://kmupower.com/', founder: { '@type': 'Person', name: 'Marcel Lehmann' } };
const LD_AUTOR = { '@type': 'Person', name: 'Marcel Lehmann', url: 'https://kmupower.com/', worksFor: { '@id': 'https://kmupower.com/#organization' } };
function ldKrumen(teile) { return { '@type': 'BreadcrumbList', itemListElement: teile.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) }; }
function seite(rel, p) {
  // 404 liegt in jeder Tiefe: Pfade ab der Wurzel der Basis. Volle URLs waeren auf einer eigenen Domain fremde Herkunft (CSP «self»)
  rel = LP() + rel;
  const ctx = rahmenKontext(rel, p.seite, p.ctx || {}, !!p.absolut);
  if (p.banner && !TESTPHASE) ctx.vorschau_banner = `<p class="vorschau-banner">${T('Interne Vorschau, nicht veröffentlichen.', 'Internal preview, do not publish.')}</p>\n`;
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
/* Seiten erzeugen. Jede Funktion baut die Seite in der Sprache des laufenden Durchgangs (seite() setzt en/ davor). */
function baueStart() {
  const heute = heuteTechnik(true);
  const g1 = NACH_ID.g1;
  // Zahl aus den Daten (Review 15.10.2026, H4): Agent Builder zaehlt mit, weil er ohne Zusatzlizenz laeuft
  const ohneZl = TECHNIKEN.filter(t => t.zugang === 'ohne-zl' || t.zugang === 'agent-builder').length;
  const bilanz = TECHNIKEN.length
    ? T(`          <p class="gcheck__zahl"><strong>${ohneZl === TECHNIKEN.length ? 'Alle ' + ohneZl : ohneZl + ' von ' + TECHNIKEN.length}</strong> Techniken laufen ohne Zusatzlizenz, wenn dein Abo Microsoft Copilot Chat enthält. <a href="techniken/?zugang=ohne-zl&amp;zugang=agent-builder">Diese Techniken zeigen</a></p>`,
      `          <p class="gcheck__zahl"><strong>${ohneZl === TECHNIKEN.length ? 'All ' + ohneZl : ohneZl + ' of ' + TECHNIKEN.length}</strong> techniques run without an add-on license if your subscription includes Microsoft Copilot Chat. <a href="techniken/?zugang=ohne-zl&amp;zugang=agent-builder">Show these techniques</a></p>`)
    : T('          <p class="gcheck__zahl">Viele Techniken laufen in Microsoft Copilot Chat. Ob Copilot Chat in deinem Abo ohne Zusatzlizenz enthalten ist, zeigt der Gratis-Check.</p>', '          <p class="gcheck__zahl">Many techniques run in Microsoft Copilot Chat. Whether Copilot Chat is included in your subscription without an add-on license is shown by the free check.</p>');
  const momente = MOMENTE.filter(([id]) => NACH_ID[id]).map(([id, satz]) => { const t = NACH_ID[id]; return `<li class="moment"><blockquote><p>${T('«', '“')}${esc(satz)}${T('»', '”')}</p></blockquote><a href="techniken/${t.slug}/"><span>${T('Technik', 'Technique')} ${pad2(t.nr)}</span> ${esc(t.titel)}</a></li>`; });
  const momenteHtml = momente.length ? `      <ul class="momente momente--start">${momente.join('\n')}</ul>` : '';
  const erste = TECHNIKEN[0] || sortiert[0];
  const auf = [heute, g1, ...momente.map((_, i) => NACH_ID[MOMENTE[i][0]]), ...TECHNIKEN];
  seite('index.html', {
    seite: 'start', template: 'start.html',
    titel: T('KMUpower Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio', 'KMUpower Dojo: Ninja techniques for Microsoft Copilot Chat and Copilot Studio'),
    beschreibung: T(`${ANZAHL} Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio, vom weissen bis zum schwarzen Gürtel. Jede mit Quelle bei Microsoft Learn und Prüfdatum.`, `${ANZAHL} ninja techniques for Microsoft Copilot Chat and Copilot Studio, from white belt to black belt. Each with a source on Microsoft Learn and a review date.`),
    ogTitel: T('KMUpower Dojo: Übung schlägt Hype.', 'KMUpower Dojo: Practice beats hype.'),
    canonical: BASE_L, banner: ohneFreigabe(auf.filter(Boolean)),
    jsonld: [ldWebsite(), LD_ORG],
    daten: {
      anzahl: ANZAHL,
      erste_technik_url: erste ? `techniken/${erste.slug}/` : 'techniken/',
      tusch_hero: tusch('ruhe', 'tusch--zeichnen'), tusch_zeigen: tusch('zeigen'),
      schnitt_haken: schnittHaken(g1),
      schnitt_karte: schnittKarte(g1) || `<div class="schnitt"><p>${NOCH_NICHT}</p></div>`,
      heute_karte: heuteKompaktHtml(heute),
      momente: momenteHtml, guertelpfad: guertelpfadHtml(''), bilanz,
      kurs_trainer: KURS_URL('start-trainer'), newsletter_trainer: NEWSLETTER_URL('start-trainer')
    }
  });
}
function baueWand() {
  const r = '../';
  const krumen = ldKrumen([[T('Start', 'Home'), BASE_L], [T('Techniken', 'Techniques'), `${BASE_L}techniken/`]]);
  seite('techniken/index.html', {
    seite: 'wand', template: 'wand.html',
    titel: T('Prompts für Microsoft Copilot Chat und Copilot Studio mit Quelle | KMUpower Dojo', 'Prompts for Microsoft Copilot Chat and Copilot Studio with sources | KMUpower Dojo'),
    beschreibung: T(`${ANZAHL} Ninja-Techniken und ${GRUNDFORMEN.length || 5} Grundformen für Microsoft Copilot Chat und Copilot Studio, nach Gürtel geordnet. Jede mit Quelle bei Microsoft Learn und Prüfdatum.`, `${ANZAHL} ninja techniques and ${GRUNDFORMEN.length || 5} basic forms for Microsoft Copilot Chat and Copilot Studio, ordered by belt. Each with a source on Microsoft Learn and a review date.`),
    canonical: `${BASE_L}techniken/`, banner: ohneFreigabe(DABEI),
    jsonld: [ldWebsite(), LD_ORG, { '@type': 'CollectionPage', '@id': `${BASE_L}techniken/#seite`, name: T(`${ANZAHL} Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio`, `${ANZAHL} ninja techniques for Microsoft Copilot Chat and Copilot Studio`), url: `${BASE_L}techniken/`, inLanguage: HTML_LANG(), isPartOf: { '@id': `${BASE_L}#website` }, mainEntity: { '@type': 'ItemList', itemListElement: sortiert.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: urlTechnik(t), name: `${t.titel}: ${t.klartitel}` })) } }, krumen],
    daten: {
      anzahl: ANZAHL, anzahl_grundformen: (GRUNDFORMEN.length || 5) === 1 ? T('eine Grundform', 'one basic form') : `${GRUNDFORMEN.length || 5} ${T('Grundformen', 'basic forms')}`, stand_ch: datumCH(STAND), kurz_basis: KURZ_BASIS + (istEN() ? '/en' : ''),
      // Sprungleiter als Textanker mit Anzahl, bewusst anders gestaltet als die Filter-Chips (Korrektur 15.10.2026)
      guertel_sprung: GUERTEL.map(g => { const n = DABEI.filter(t => t.guertel === g.nr).length; return `<li data-guertel-nr="${g.nr}"><a href="#${g.anker}"><span class="leiter__band" aria-hidden="true"></span><span class="leiter__name">${esc(g.name)}</span><span class="leiter__zahl">${n ? n + (n === 1 ? T(' Eintrag', ' entry') : T(' Einträge', ' entries')) : T('offen', 'open')}</span></a></li>`; }).join(''),
      filter: filterHtml(), abschnitte: wandAbschnitte(r), tusch_sitzen: tusch('sitzen'), vier_wochen: vierWochenHtml(r, 'h2')
    }
  });
}
function baueTechnik(t, i) {
  const r = '../../';
  const ra = r + (istEN() ? '../' : '');
  const a = ART[t.art] || ART.pinselstrich;
  const g = GUERTEL[t.guertel - 1];
  const produkt = PRODUKTNAMEN[(t.werkzeug || [])[0]] || 'Microsoft Copilot Chat';
  let titel = T(`${t.klartitel}: ${a.wort} mit Quelle | KMUpower Dojo`, `${t.klartitel}: ${a.wort} with source | KMUpower Dojo`);
  if (titel.length > 65) titel = `${t.klartitel} | KMUpower Dojo`;
  const satz = T(`${a.wort} für ${produkt} zum Kopieren, mit Quelle bei Microsoft Learn und Prüfdatum.`, `${a.wort} for ${produkt} to copy, with a source on Microsoft Learn and a review date.`);
  let beschreibung = `${t.klartitel}. ${satz}${t.moment ? ' ' + t.moment.replace(/[.!?]?$/, '.') : ''}`;
  if (beschreibung.length > 160) beschreibung = `${t.klartitel}. ${satz}`;
  if (beschreibung.length > 160) warnung(`${L}:${t.id}: Meta-Description über 160 Zeichen`);
  const vor = sortiert[i - 1], nach = sortiert[i + 1];
  // Karten je Sprache: assets/img/karten/<slug>.png (deutsch) und assets/img/karten/en/<slug>.png
  const kartenBild = `assets/img/karten/${LP()}${t.slug}.png`;
  const bildDa = gibtEs(kartenBild);
  if (!bildDa) warnung(`${t.id}: Vorschaubild ${kartenBild} fehlt (DOJO, karten.mjs), Seite nutzt og-image.png`);
  const liste = (ids) => (ids || []).map(id => NACH_ID[id]).filter(Boolean);
  const kommt = liste(t.kommt_aus), weiter = liste(t.weiter_mit);
  const kette = (kommt.length || weiter.length) ? `    <section class="abschnitt" aria-labelledby="h-kette">
      <h2 id="h-kette">${t.kombo ? T('Kombo: ', 'Combo: ') + esc(t.kombo) : T('Kombo', 'Combo')}</h2>
      <div class="kette">
        ${kommt.length ? `<div><p class="label">${T('Kommt aus', 'Comes from')}</p><ul class="pfad__liste">${kommt.map(x => kompakt(x, r)).join('')}</ul></div>` : ''}
        ${weiter.length ? `<div><p class="label">${T('Weiter mit', 'Continue with')}</p><ul class="pfad__liste">${weiter.map(x => kompakt(x, r)).join('')}</ul></div>` : ''}
      </div>
    </section>
` : t.kombo ? `    <p class="klein">${T(`Gehört zur Kombo «${esc(t.kombo)}».`, `Part of the combo “${esc(t.kombo)}”.`)}</p>
` : '';
  // Eine dezente Kurszeile auf jeder Technik-Seite nach «Als geübt markieren» (Review 15.10.2026, H9), kein Banner
  const kursLink = esc(KURS_URL(t.typ === 'technik' ? 'technik-' + t.nr : 'technik-' + t.id));
  const kurs = T(`      <p class="kurs-zeile">Lieber mit Begleitung üben? <a href="${kursLink}" rel="noopener">Live-Kurs «${KURS_NAME}» an der Power Platform Academy</a></p>`,
    `      <p class="kurs-zeile">Prefer to practice with guidance? <a href="${kursLink}" rel="noopener">Live course “${KURS_NAME}” (in German) at the Power Platform Academy</a></p>`);
  const alleQuellen = [{ url: t.quelle_url, titel: t.quelle_titel }, ...(t.weitere_quellen || [])];
  const blaettern = [vor ? `<a href="${r}techniken/${vor.slug}/" rel="prev"><span>${T('Vorherige Technik', 'Previous technique')}</span>${nrLabel(vor)} ${esc(vor.titel)}</a>` : `<a href="${r}techniken/"><span>${T('Zurück', 'Back')}</span>${T('Zur Technik-Wand', 'To the technique wall')}</a>`,
    nach ? `<a href="${r}techniken/${nach.slug}/" rel="next"><span>${T('Nächste Technik', 'Next technique')}</span>${nrLabel(nach)} ${esc(nach.titel)}</a>` : `<a href="${r}techniken/"><span>${T('Geschafft', 'Done')}</span>${T('Zur Technik-Wand', 'To the technique wall')}</a>`].join('\n');
  const url = urlTechnik(t);
  seite(`techniken/${t.slug}/index.html`, {
    seite: 'technik', template: 'technik.html', titel, beschreibung,
    ogTitel: `${t.titel}: ${t.klartitel}`, ogBeschreibung: t.nutzen || beschreibung, ogTyp: 'article',
    ogBild: bildDa ? `${BASE_URL}${kartenBild}` : null, ogAlt: `${t.typ === 'technik' ? T('Technik ', 'Technique ') + pad2(t.nr) : T('Grundform', 'Basic form')}: ${t.titel}`,
    canonical: url, banner: VORSCHAU && !istFrei(t),
    jsExtra: t.rechner ? ['assets/js/kompass.js'] : null,
    jsonld: [ldWebsite(), LD_ORG, {
      '@type': 'TechArticle', '@id': `${url}#technik`, headline: `${t.titel}: ${t.klartitel}`, name: t.titel, url, inLanguage: HTML_LANG(),
      description: t.nutzen || beschreibung, author: LD_AUTOR, publisher: { '@id': 'https://kmupower.com/#organization' },
      datePublished: t.datum_publiziert || t.geprueft_am, dateModified: t.geprueft_am,
      citation: [t.quelle_url, ...(t.weitere_quellen || []).map(q => q.url)], isPartOf: { '@id': `${BASE_L}techniken/#seite` }
    }, ldKrumen([[T('Start', 'Home'), BASE_L], [T('Techniken', 'Techniques'), `${BASE_L}techniken/`], [t.titel, url]])],
    daten: {
      id: t.id, guertel: t.guertel, guertel_name: g.name, guertel_anker: g.anker,
      nr_label: t.typ === 'technik' ? `${T('Nr.', 'No.')} ${pad2(t.nr)}` : `${T('Grundform', 'Basic form')} ${t.id.toUpperCase()}`,
      nr_gross: t.typ === 'technik' ? pad2(t.nr) : `${T('Grundform', 'Basic form')} ${t.id.toUpperCase()}`, nr_klasse: t.typ === 'technik' ? '' : ' tk__nr--wort',
      titel: t.titel, klartitel: t.klartitel || '', moment: t.moment || '', problem: t.problem, dauer_min: t.dauer_min,
      art_badge: artBadge(t), zugang_badge: zugangBadge(t, r), zugang_text: t.zugang_text || (ZUGANG[t.zugang] || {}).kurz || '',
      schnitt_zeile: t.vorher ? `      <div class="schnitt schnitt--zeile" data-schnitt><p class="label">${T('Vorher', 'Before')}</p><div class="schnitt__vorher"><p class="schnitt__zitat">${T('«', '“')}${esc(t.vorher)}${T('»', '”')}</p><svg class="schnitt__strich" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 13C30 9 66 7 99 8"/></svg></div></div>` : '',
      schmiede: schmiedeHtml(t, 'technik'), rollen: rollenFuer(t, 'prompt'), rechner: rechnerHtml(t),
      so_nutzt: (t.so_nutzt_du_es || []).map(s => `<li>${esc(s)}</li>`).join(''),
      erwarten: (t.das_darfst_du_erwarten || []).map(s => `<li>${esc(s)}</li>`).join(''),
      probe: t.probe ? `    <section class="abschnitt" aria-labelledby="h-probe">
      <h2 id="h-probe">${T('Die Probe', 'The check')}</h2>
      <p class="probe">${esc(t.probe)}</p>
    </section>
` : '',
      grenzen: (t.grenzen || []).map(s => `<li>${esc(s)}</li>`).join(''),
      meister: t.meister_variante ? `    <section class="abschnitt" aria-labelledby="h-meister"><h2 id="h-meister">${T('Meister-Variante', 'Master variant')}</h2><details class="einklapp" data-meister><summary>${T('Verschärfung anzeigen', 'Show the harder version')}</summary><pre class="code">${textHtml(t.meister_variante, t._felder)}</pre></details></section>
` : '',
      praxis: t.praxis_notiz ? `    <section class="abschnitt" aria-labelledby="h-praxis"><h2 id="h-praxis">${T('Aus der Praxis', 'From practice')}</h2><p class="praxis">${esc(t.praxis_notiz)}</p></section>
` : '',
      // Quellen als eine Zeile (Review 15.10.2026, H1): Links zu Microsoft Learn und «Stand». Kein Pruefstempel, kein Termin.
      quellen: `${alleQuellen.some(q => q.url.startsWith('https://learn.microsoft.com/')) && !alleQuellen.some(q => /^Microsoft Learn/.test(q.titel)) ? 'Microsoft Learn: ' : ''}${alleQuellen.map(q => `<a href="${esc(q.url)}" rel="noopener">${esc(q.titel)}</a>`).join(', ')}. ${T('Stand', 'As of')} <time datetime="${t.geprueft_am}">${datumCH(t.geprueft_am)}</time>.`,
      ausgefuehrt: istIso(t.ausgefuehrt_am) ? T(`      <p class="pruefstatus">Einmal ausgeführt in Microsoft Copilot Chat am ${datumCH(t.ausgefuehrt_am)}. Ergebnisse können abweichen.</p>`, `      <p class="pruefstatus">Run once in Microsoft Copilot Chat on ${datumCH(t.ausgefuehrt_am)}. Results can differ.</p>`) : '',
      // LinkedIn: feed/?shareActive=true&text= fuellt den Post vor (share-offsite kann keinen Text). Rueckfall: core.js kopiert denselben Text
      linkedin_url: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${t.teilen_text}\n\n${url}`)}`, url,
      bild_link: bildDa ? `        <a class="knopf knopf--klein" href="${ra}${kartenBild}" download>${T('Bild herunterladen', 'Download image')}</a>` : '',
      teilen_text: `${t.teilen_text}\n\n${url}`, kette, kurs, blaettern,
      haupt_pre: 'prompt', kopier_label: a.knopf, kopier_erfolg: a.erfolg, naechste_url: nach ? `${r}techniken/${nach.slug}/` : `${r}techniken/`, naechste_label: nach ? T('Nächste Technik', 'Next technique') : T('Zur Technik-Wand', 'To the technique wall')
    }
  });
}
function baueHeute() {
  const t = heuteTechnik();
  seite('heute/index.html', {
    seite: 'heute', template: 'heute.html', titel: T('Technik des Tages | KMUpower Dojo', 'Technique of the day | KMUpower Dojo'),
    beschreibung: T('Jeden Tag eine Technik aus dem KMUpower Dojo, für alle am selben Tag dieselbe.', 'One technique from the KMUpower Dojo every day, the same for everyone on the same day.'), noindex: true, canonical: null,
    banner: t ? ohneFreigabe([t]) : false,
    daten: { build_datum: DATUM, heute_inhalt: heuteHtml(t, '../', 'h2') }
  });
}
function bauePflichtseiten() {
  // Kurzadressen 1 bis 25, auf Englisch unter /en/1/ bis /en/25/
  for (let n = 1; n <= 25; n++) {
    const t = TECHNIKEN.find(x => x.nr === n);
    const roh = ALLE.find(x => x.nr === n);
    const g = roh ? GUERTEL[roh.guertel - 1] : null;
    const ziel = t ? `../techniken/${t.slug}/` : g ? `../techniken/#${g.anker}` : '../techniken/';
    schreibe(`${LP()}${n}/index.html`, render(lies('templates/kurzadresse.html'), {
      lang: HTML_LANG(), ra: praefix(`${LP()}${n}/index.html`),
      titel: t ? `${t.titel}: ${t.klartitel} | KMUpower Dojo` : `${T('Technik', 'Technique')} ${n} | KMUpower Dojo`,
      canonical: t ? urlTechnik(t) : `${BASE_L}techniken/`, ziel,
      linktext: t ? `${T('Technik', 'Technique')} ${pad2(n)}: ${t.titel}` : T(`Technik ${n} ist noch nicht freigegeben. Zur Technik-Wand`, `Technique ${n} is not released yet. To the technique wall`),
      hinweis: T('Unabhängige Website von Marcel Lehmann. Keine Verbindung zu Microsoft.', 'Independent website by Marcel Lehmann. Not affiliated with Microsoft.')
    }, 'kurzadresse'));
  }
  // Weiterleitung /vorlagen/ (nur deutsch, alte Adresse)
  if (!istEN()) {
    const ziele = ALTE_ANKER.filter(s => DABEI.some(t => t.slug === s));
    schreibe('vorlagen/index.html', render(lies('templates/weiterleitung-vorlagen.html'), { ziele_json: esc(JSON.stringify(ziele)), canonical: `${BASE_URL}techniken/` }, 'weiterleitung'));
  }
  // 404: GitHub Pages liefert nur die 404.html der Wurzel aus. sprache.js leitet dort Adressen unter /en/ auf en/404.html weiter.
  seite('404.html', {
    seite: '404', template: '404.html', absolut: true, titel: T('Seite nicht gefunden | KMUpower Dojo', 'Page not found | KMUpower Dojo'),
    beschreibung: T('Diese Seite gibt es nicht. Zu den Techniken, zur Suche oder zur Startseite.', 'This page does not exist. Go to the techniques, the search or the home page.'), noindex: true,
    daten: { tusch_spaehen: tusch('spaehen'), kurz_basis: KURZ_BASIS + (istEN() ? '/en' : '') }
  });
}

/* Seiten von Hand: Rahmen-Marker fuellen. Englische Fassungen liegen unter en/ mit derselben Struktur. */
const HAND_SEITEN = () => {
  const liste = ['ueber/index.html', 'impressum/index.html', 'datenschutz/index.html', 'gratis/index.html', 'dojo/index.html', 'dojo/test/index.html'];
  const g = `${LP()}dojo/guertel`;
  const aus = liste.map(d => LP() + d);
  if (gibtEs(g)) for (const f of fs.readdirSync(path.join(ROOT, g))) if (gibtEs(`${g}/${f}/index.html`)) aus.push(`${g}/${f}/index.html`);
  return aus;
};
const EIGENE_HAND = ['ueber/index.html', 'impressum/index.html', 'datenschutz/index.html', 'en/ueber/index.html', 'en/impressum/index.html', 'en/datenschutz/index.html'];
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
      const inhalt = liste.length ? `<ul class="pfad__liste">${liste.map(t => kompakt(t, r)).join('')}</ul>\n<p><a class="knopf" href="${r}techniken/?zugang=ohne-zl&amp;zugang=agent-builder">${T('Alle Techniken ohne Zusatzlizenz auf der Technik-Wand', 'All techniques without an add-on license on the technique wall')}</a></p>` : `<p>${NOCH_NICHT}</p>`;
      const x = ersetzeMarker(neu, 'GRATIS-TECHNIKEN', inhalt, datei); if (x !== null) neu = x;
    }
    if (datei === `${LP()}dojo/index.html`) {
      const inhalt = `<div class="dojo-liste">${GUERTEL.map(g => {
        const drin = sortiert.filter(t => t.guertel === g.nr && t.typ === 'technik');
        return `<section class="dojo-liste__guertel" data-guertel-nr="${g.nr}" aria-labelledby="dl-${g.farbe}">
<h3 id="dl-${g.farbe}">${knoten(g.nr, g.name)}<span class="klein">${T('Stufe', 'Level')} ${g.nr}${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span></h3>
<div class="fortschritt" data-fortschritt="${g.nr}"><p class="fortschritt__text">${drin.length} ${drin.length === 1 ? T('Technik', 'technique') : T('Techniken', 'techniques')}</p></div>
${drin.length ? `<ul>${drin.map(t => `<li data-technik="${t.id}" data-guertel-nr="${g.nr}"><a href="${r}techniken/${t.slug}/">${pad2(t.nr)} ${esc(t.titel)}</a><span class="dojo-liste__status" data-status>${T('offen', 'open')}</span></li>`).join('')}</ul>` : `<p class="pfad__offen">${NOCH_NICHT}</p>`}
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
  if (!istEN()) for (let i = 1; i < folge.length; i++) if (NACH_ID[folge[i]].guertel === NACH_ID[folge[i - 1]].guertel) warnung(`tag.json: ${folge[i - 1]} und ${folge[i]} haben denselben Gürtel an zwei Tagen hintereinander`);
  const tag = {
    start: istIso(daten.tag_start) ? daten.tag_start : DATUM,
    formel: 'Index = (Tage seit start nach lokalem Datum) modulo Anzahl, positiv gerechnet',
    reihenfolge: folge,
    eintraege: Object.fromEntries(folge.map(id => { const t = NACH_ID[id]; return [id, { nr: t.nr, slug: t.slug, titel: t.titel, klartitel: t.klartitel, guertel: t.guertel, zugang: t.zugang, zugang_text: t.zugang_text || '', nutzen: t.nutzen || '', problem: FUER_START(t) ? t.problem : '', dauer_min: t.dauer_min }]; }))
  };
  schreibe(`assets/data/${LP()}tag.json`, JSON.stringify(tag));
  const xml = (s) => esc(s).replace(/'/g, '&apos;');
  const feed = sortiert.slice().sort((a, b) => (b.datum_publiziert || '').localeCompare(a.datum_publiziert || '')).map(t => `  <entry>
    <title>${xml(t.typ === 'technik' ? `${T('Technik', 'Technique')} ${pad2(t.nr)}: ${t.titel}` : `${T('Grundform', 'Basic form')}: ${t.titel}`)}</title>
    <id>${urlTechnik(t)}</id>
    <link href="${urlTechnik(t)}"/>
    <published>${t.datum_publiziert || t.geprueft_am}T00:00:00Z</published>
    <updated>${t.geprueft_am}T00:00:00Z</updated>
    <summary>${xml(`${t.klartitel}. ${t.nutzen || ''}`.trim())}</summary>
  </entry>`);
  schreibe(`${LP()}feed.xml`, `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${HTML_LANG()}">
  <title>${T('KMUpower Dojo: Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio', 'KMUpower Dojo: Ninja techniques for Microsoft Copilot Chat and Copilot Studio')}</title>
  <subtitle>${T('Unabhängige Website von Marcel Lehmann. Keine Verbindung zu Microsoft.', 'Independent website by Marcel Lehmann. Not affiliated with Microsoft.')}</subtitle>
  <id>${BASE_L}</id>
  <link href="${BASE_L}"/>
  <link rel="self" href="${BASE_L}feed.xml"/>
  <updated>${STAND}T00:00:00Z</updated>
  <author><name>Marcel Lehmann</name><uri>https://kmupower.com/</uri></author>
${feed.join('\n')}
</feed>
`);
  const montag = (() => { let d = new Date((istIso(daten.tag_start) ? daten.tag_start : DATUM) + 'T00:00:00Z'); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); })();
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//KMUpower//Dojo//${T('DE', 'EN')}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:dojo-montag-technik-des-tages${T('', '-en')}@kmupower.com`,
    `DTSTAMP:${DATUM.replace(/-/g, '')}T000000Z`, `DTSTART:${montag}T083000`, 'DURATION:PT15M', 'RRULE:FREQ=WEEKLY;BYDAY=MO', T('SUMMARY:Dojo: Technik des Tages', 'SUMMARY:Dojo: Technique of the day'),
    T(`DESCRIPTION:15 Minuten üben. Die Technik des Tages steht unter ${BASE_L}heute/`, `DESCRIPTION:Practice for 15 minutes. The technique of the day is at ${BASE_L}heute/`), `URL:${BASE_L}heute/`, 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR'];
  schreibe(`${LP()}kalender/montag.ics`, ics.map(falte).join('\r\n') + '\r\n');
}
/* Sitemap mit beiden Sprachen und hreflang, robots.txt, llms.txt (nach beiden Durchgaengen) */
function baueGemeinsam() {
  setzeSprache('de');
  const maxGeprueft = (html) => [...html.matchAll(/data-geprueft="(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop();
  const pfade = [['', STAND], ['techniken/', STAND], ...sortiert.map(t => [`techniken/${t.slug}/`, t.geprueft_am])];
  if (gibtEs('gratis/index.html')) pfade.push(['gratis/', maxGeprueft(lies('gratis/index.html')) || daten.stand]);
  if (gibtEs('dojo/test/index.html')) pfade.push(['dojo/test/', gibtEs('dojo/selbsttest.json') ? (() => { try { const j = JSON.parse(lies('dojo/selbsttest.json')); return [...JSON.stringify(j).matchAll(/"geprueft_am":"(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort().pop(); } catch { return null; } })() : null]);
  pfade.push(['ueber/', RECHT_STAND], ['impressum/', RECHT_STAND], ['datenschutz/', RECHT_STAND]);
  const alt = (pfad) => `<xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}${pfad}"/><xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}en/${pfad}"/><xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${pfad}"/>`;
  const eintraege = [];
  for (const [pfad, lastmod] of pfade) for (const sp of ['', 'en/']) eintraege.push(`  <url><loc>${BASE_URL}${sp}${pfad}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${alt(pfad)}</url>`);
  schreibe('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${eintraege.join('\n')}\n</urlset>\n`);
  // robots.txt nach dem Muster von powerplatformtip.com (16.10.2026): Suchmaschinen und KI-Crawler ausdruecklich erlaubt,
  // Content-Signal in jeder Gruppe (RFC 9309: ein Crawler liest nur die Gruppe mit seinem Namen). Gilt nur an der Wurzel einer Domain.
  const basisPfad = new URL(BASE_URL).pathname;
  const signal = 'Content-Signal: search=yes, ai-train=yes, ai-retrieval=yes';
  const sperren = ['templates/', 'scripts/', 'data/', '.github/'].map(p => `Disallow: ${basisPfad}${p}`).join('\n');
  const bots = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot', 'Applebot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'CCBot', 'cohere-ai', 'Meta-ExternalAgent', 'MistralAI-User'];
  schreibe('robots.txt', [
    '# KMUpower Dojo (copilot.ninja). Suchmaschinen und KI-Assistenten sind willkommen: bitte mit Quelle zitieren.',
    '# Inhalte auf Deutsch unter /, auf Englisch unter /en/. Kurzfassung fuer KI: /llms.txt, Volltext: /llms-full.txt',
    '', 'User-agent: *', 'Allow: /', signal, sperren, '',
    ...bots.flatMap(b => [`User-agent: ${b}`, 'Allow: /', signal, sperren, '']),
    `Sitemap: ${BASE_URL}sitemap.xml`, ''].join('\n'));
  // llms.txt: Orientierung fuer KI-Assistenten, beide Sprachen. llms-full.txt: alle Techniken mit Prompt, Grenzen und Quellen.
  const deListe = TECHNIKEN.map(t => `- [Nr. ${t.nr} ${t.titel}: ${t.klartitel}](${urlTechnik(t)}): ${t.nutzen || ''} Stand ${datumCH(t.geprueft_am)}.`);
  const deGrund = GRUNDFORMEN.map(t => `- [${t.titel}](${urlTechnik(t)}): Stand ${datumCH(t.geprueft_am)}.`);
  const deVoll = sortiert.map(t => volltext(t));
  setzeSprache('en');
  const enListe = TECHNIKEN.map(t => `- [No. ${t.nr} ${t.titel}: ${t.klartitel}](${urlTechnik(t)}): ${t.nutzen || ''} As of ${datumCH(t.geprueft_am)}.`);
  const enGrund = GRUNDFORMEN.map(t => `- [${t.titel}](${urlTechnik(t)}): As of ${datumCH(t.geprueft_am)}.`);
  const enVoll = sortiert.map(t => volltext(t));
  setzeSprache('de');
  const kopf = [`# KMUpower Dojo`, '',
    `> Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio, auf Deutsch und Englisch, vom weissen bis zum schwarzen Gürtel. Jede Technik nennt ihre Quellen bei Microsoft Learn, den Stand und ihre Grenzen. Unabhängige Website von Marcel Lehmann (KMUpower), keine Verbindung zu Microsoft.`, '',
    'Kurzfakten:', '',
    `- Website: KMUpower Dojo (${BASE_URL}), Englisch unter ${BASE_URL}en/`,
    '- Autor: Marcel Lehmann, Microsoft Business Applications MVP, Schweiz (Handelsname KMUpower, https://kmupower.com/)',
    `- Inhalt: ${TECHNIKEN.length} Techniken und ${GRUNDFORMEN.length} Grundformen für Microsoft Copilot Chat, Agent Builder und Copilot Studio, je mit Prompt zum Kopieren, Grenzen und Quellen bei Microsoft Learn`,
    '- Kosten: gratis, ohne Anmeldung, ohne Cookies',
    '- Kontakt: marcel.lehmann@kmupower.com', ''];
  const llms = [...kopf,
    '## Seiten', '', `- [Technik-Wand](${BASE_URL}techniken/): alle Techniken nach Gürtel, mit Zugang (ohne Zusatzlizenz, Lizenz, Copilot Studio)`, `- [Ist Microsoft Copilot gratis?](${BASE_URL}gratis/): was ohne Zusatzlizenz geht, mit Quelle und Prüfdatum je Aussage`, `- [Welcher Gürtel bist du?](${BASE_URL}dojo/test/): Selbsttest mit sieben Fragen`, `- [Über das Dojo](${BASE_URL}ueber/): Methode, Dojo-Regeln, was die Seite nicht ist`, `- [Volltext aller Techniken](${BASE_URL}llms-full.txt): Prompts, Grenzen und Quellen in beiden Sprachen`, '',
    '## Techniken', '', ...deListe, ...(deGrund.length ? ['', '## Grundformen', '', ...deGrund] : []), '',
    '## English', '', `- [Technique wall](${BASE_URL}en/techniken/): all techniques by belt`, `- [Is Microsoft Copilot free?](${BASE_URL}en/gratis/): what works without an add-on license, with source and review date for each statement`, `- [Which belt are you?](${BASE_URL}en/dojo/test/): self-test with seven questions`, `- [About the Dojo](${BASE_URL}en/ueber/): method, Dojo rules, what the site is not`, '',
    '### Techniques', '', ...enListe, ...(enGrund.length ? ['', '### Basic forms', '', ...enGrund] : []), ''];
  schreibe('llms.txt', llms.join('\n'));
  schreibe('llms-full.txt', [...kopf, '# Deutsch', '', ...deVoll, '# English', '', ...enVoll].join('\n'));
}
// Eine Technik als Klartext fuer llms-full.txt, in der Sprache des Durchgangs
function volltext(t) {
  const q = [{ url: t.quelle_url, titel: t.quelle_titel }, ...(t.weitere_quellen || [])];
  const zeilen = [`## ${t.typ === 'technik' ? `${T('Nr.', 'No.')} ${t.nr} ` : ''}${t.titel}: ${t.klartitel}`, '', `URL: ${urlTechnik(t)}`,
    `${T('Gürtel', 'Belt')}: ${gName(t.guertel)}. ${T('Zugang', 'Access')}: ${t.zugang_text || (ZUGANG[t.zugang] || {}).kurz || ''}. ${T('Stand', 'As of')} ${datumCH(t.geprueft_am)}.`, '',
    `${T('Problem', 'Problem')}: ${t.problem}`, '', `${T('Nutzen', 'Benefit')}: ${t.nutzen || ''}`, '',
    `${(ART[t.art] || ART.pinselstrich).rolle}:`, '', '```', t.technik_text.replace(/\{([^{}|]*)(?:\|[^{}]*)?\}/g, '[$1]'), '```', ''];
  (t.zusatz_texte || []).forEach(z => zeilen.push(`${z.titel}:`, '', '```', (z.text || '').replace(/\{([^{}|]*)(?:\|[^{}]*)?\}/g, '[$1]'), '```', ''));
  zeilen.push(`${T('So nutzt du es', 'How to use it')}:`, ...(t.so_nutzt_du_es || []).map((s, i) => `${i + 1}. ${s}`), '',
    `${T('Grenzen', 'Limits')}:`, ...(t.grenzen || []).map(s => `- ${s}`), '',
    `${T('Quellen', 'Sources')}: ${q.map(x => `${x.titel} (${x.url})`).join('; ')}`, '');
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
  // Englisches OG-Bild: gleiche Gestaltung, englische Zeilen
  const ogEn = og.replace('>Übung schlägt<', '>Practice beats<').replace('>Hype.<', '>hype.<').replace('Ninja-Techniken mit Quelle und Prüfdatum.', 'Ninja techniques with sources and review dates.')
    .replace('Vom weissen bis zum schwarzen Gürtel.', 'From white belt to black belt.').replace('>GEPRÜFT<', '>CHECKED<').replace('gegen die Dokumentation', 'against the documentation');
  schreibe('og-image-en.svg', ogEn);
  if (ARGS.includes('--og-png')) {
    const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
    if (!chrome) { warnung('--og-png: kein Chrome gefunden (CHROME=Pfad setzen)'); return; }
    for (const name of ['og-image', 'og-image-en']) {
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
  const ohneH1 = ['vorlagen/index.html', ...Array.from({ length: 25 }, (_, i) => `${i + 1}/index.html`), ...Array.from({ length: 25 }, (_, i) => `en/${i + 1}/index.html`)];
  for (const rel of allesHtml()) {
    const html = lies(rel);
    const fremd = !geschrieben.includes(rel) && !EIGENE_HAND.includes(rel);
    const melde = fremd && LOCKER ? warnung : fehler;
    const wo = `Prüfung ${rel}`;
    if (rel !== '404.html' && rel !== 'en/404.html' && /\s(href|src)="\/(?!\/)/.test(html)) melde(`${wo}: absoluter Pfad mit «/»`);
    for (const m of html.matchAll(/<(script|link)\b[^>]*>/g)) {
      const tag = m[0]; const u = (tag.match(/\s(?:src|href)="([^"]+)"/) || [])[1];
      if (!u || /rel="(canonical|alternate)"/.test(tag)) continue;
      if (/^http:\/\//.test(u) || (/^(https?:)?\/\//.test(u) && !u.startsWith(BASE_URL))) melde(`${wo}: fremde Quelle in <${m[1]}> ${u}`);
    }
    if (/<[a-z][^>]*\sstyle=/i.test(html)) melde(`${wo}: style-Attribut`);
    if (/<[a-z][^>]*\son[a-z]+=/i.test(html)) melde(`${wo}: on…-Attribut`);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) if (!/\ssrc=/.test(m[1]) && !/application\/ld\+json/.test(m[1]) && m[2].trim()) melde(`${wo}: Inline-Skript`);
    const sollLang = rel.startsWith('en/') ? 'en' : 'de-CH';
    if (!new RegExp(`<html[^>]*lang="${sollLang}"`).test(html)) melde(`${wo}: lang="${sollLang}" fehlt`);
    // Englisch: keine deutschen Anfuehrungszeichen im sichtbaren Text, Umschalter DE/EN auf jeder Seite mit Rahmen
    if (rel.startsWith('en/') && /[«»]/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!-- RAHMEN:HEAD -->[\s\S]*?<!-- \/RAHMEN:HEAD -->/, ''))) melde(`${wo}: «» im englischen Text`);
    if (/<!-- RAHMEN:KOPF -->/.test(html) && !/data-sprache-wahl=/.test(html)) melde(`${wo}: Sprachumschalter fehlt`);
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
    if (/copilot[\s-]ninja/i.test(html.replace(/https?(:|%3A)(\/|%2F)(\/|%2F)[^\s"'<>]+/g, '').replace(/\s(href|src)="\/[^"]*"/g, '').replace(/copilot-ninja-theme/g, '').split(KURS_NAME).join('').split(KURZ_BASIS).join(''))) melde(`${wo}: «Copilot-Ninja» als Name`);
  }
  for (const [datei, kb] of Object.entries(BUDGET)) {
    if (!gibtEs(datei)) continue;
    const gr = fs.statSync(path.join(ROOT, datei)).size / 1024;
    if (gr > kb * 1.2) fehler(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt ${kb} KB (mehr als 20 Prozent darüber)`);
    else if (gr > kb) warnung(`Budget: ${datei} ${gr.toFixed(1)} KB, erlaubt ${kb} KB`);
  }
  for (const t of sortiert) for (const datei of [`techniken/${t.slug}/index.html`, `en/techniken/${t.slug}/index.html`]) {
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
      NOCH_NICHT = NOCH_NICHT_TEXT[sp];
      baueStart();
      baueWand();
      sortiert.forEach((t, i) => baueTechnik(t, i));
      baueHeute();
      bauePflichtseiten();
      fuelleHandseiten();
      baueDaten();
      aufraeumen();
    }
    baueGemeinsam();
  }
  setzeSprache('de');
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
