#!/usr/bin/env node
/*
  PowerPlatformAcademy Dojo: lokales Pruefskript. Aendert keine Texte.
  node scripts/pruefen.mjs              Pruefdaten (data-geprueft, geprueft_am) und Learn-Links auflisten, Daten aelter als 90 Tage markieren
  node scripts/pruefen.mjs --links      zusaetzlich jeden Learn-Link per fetch pruefen (Status, Weiterleitung), braucht Netz
  node scripts/pruefen.mjs --kontrast   Kontrast aller Text-Farbpaare hell und dunkel, schreibt _recherche/konzept/kontrast.md
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const heute = new Date();
const tage = (iso) => Math.floor((heute - new Date(iso + 'T00:00:00')) / 864e5);

function htmlDateien(d = '') {
  const aus = [];
  for (const f of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const rel = d ? `${d}/${f.name}` : f.name;
    if (f.isDirectory()) { if (!/^(\.git|_recherche|templates|node_modules)$/.test(f.name)) aus.push(...htmlDateien(rel)); }
    else if (f.name.endsWith('.html')) aus.push(rel);
  }
  return aus;
}

if (ARGS.includes('--kontrast')) {
  const css = fs.readFileSync(path.join(ROOT, 'templates/css/site.css'), 'utf8');
  const block = (re) => { const m = css.match(re); return m ? m[1] : ''; };
  const tokens = (txt) => Object.fromEntries([...txt.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
  const hell = tokens(block(/:root \{([\s\S]*?)\n\}/));
  const dunkel = { ...hell, ...tokens(block(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/)) };
  const lum = (hex) => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const kontrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const PAARE = [
    ['ink', 'paper', 4.5, 'Fliesstext'], ['ink', 'surface', 4.5, 'Text auf Karten'], ['ink', 'surface-2', 4.5, 'Text auf Fläche 2'],
    ['ink-muted', 'paper', 4.5, 'Nebentext'], ['ink-muted', 'surface', 4.5, 'Nebentext auf Karten'], ['ink-muted', 'surface-2', 4.5, 'Nebentext auf Fläche 2'],
    ['signal', 'paper', 4.5, 'Links, Stempel'], ['signal', 'surface', 4.5, 'Stempel auf Karten'], ['signal', 'surface-2', 4.5, 'Links auf Fläche 2'],
    ['on-signal', 'signal', 4.5, 'Primärknopf'], ['on-night', 'night', 4.5, 'Nacht-Band'], ['on-night-muted', 'night', 4.5, 'Nebentext Nacht-Band'], ['signal-night', 'night', 4.5, 'Links Nacht-Band'], ['on-signal-night', 'signal-night', 4.5, 'Primärknopf Nacht-Band'],
    ['stempel-alt', 'paper', 4.5, 'Stempel fällig'], ['stempel-alt', 'surface', 4.5, 'Stempel fällig auf Karte'],
    ['part-ziel', 'surface', 4.5, 'Teil Ziel'], ['part-kontext', 'surface', 4.5, 'Teil Kontext'], ['part-quelle', 'surface', 4.5, 'Teil Quelle'], ['part-erwartung', 'surface', 4.5, 'Teil Erwartung'],
    ['zugang-frei', 'surface', 4.5, 'Badge ohne Zusatzlizenz'], ['zugang-lizenz', 'surface', 4.5, 'Badge Lizenz'], ['zugang-studio', 'surface', 4.5, 'Badge Studio'],
    ['line-strong', 'paper', 3, 'Bedienkontur'], ['line-strong', 'surface', 3, 'Bedienkontur auf Karte'], ['focus', 'paper', 3, 'Fokusrahmen']
  ];
  const zeilen = (t, name) => PAARE.map(([v, h, min, wo]) => {
    if (!t[v] || !t[h]) return `| ${name} | ${wo} | --${v} auf --${h} | fehlt | ${min}:1 | prüfen |`;
    const k = kontrast(t[v], t[h]);
    return `| ${name} | ${wo} | --${v} ${t[v]} auf --${h} ${t[h]} | ${k.toFixed(2)}:1 | ${min}:1 | ${k >= min ? 'ok' : 'ZU TIEF'} |`;
  });
  const alle = [...zeilen(hell, 'hell'), ...zeilen(dunkel, 'dunkel')];
  const md = `# Kontrastprüfung PowerPlatformAcademy Dojo\n\nErzeugt am ${heute.toISOString().slice(0, 10)} mit \`node scripts/pruefen.mjs --kontrast\` aus templates/css/site.css. Formel nach WCAG 2.2 (relative Leuchtdichte). Text mindestens 4.5:1, Bedienkonturen und grosser Text mindestens 3:1.\n\n| Modus | Wo | Paar | Kontrast | Minimum | Ergebnis |\n|---|---|---|---|---|---|\n${alle.join('\n')}\n\nGürtelfarben tragen keinen Text. Sie stehen immer mit Text daneben und mit einer Kontur in --line-strong (siehe Bedienkontur).\n`;
  fs.writeFileSync(path.join(ROOT, '_recherche/konzept/kontrast.md'), md);
  const schlecht = alle.filter(z => z.includes('ZU TIEF'));
  console.log(`kontrast.md geschrieben, ${alle.length} Paare, ${schlecht.length} zu tief`);
  schlecht.forEach(z => console.log('  ' + z));
  process.exit(schlecht.length ? 1 : 0);
}

const daten = [];
const links = new Set();
for (const rel of htmlDateien()) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const m of html.matchAll(/data-geprueft="(\d{4}-\d{2}-\d{2})"/g)) daten.push([rel, m[1]]);
  for (const m of html.matchAll(/href="(https:\/\/learn\.microsoft\.com\/[^"#]+)/g)) links.add(m[1]);
}
const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/techniken.json'), 'utf8'));
for (const t of json.techniken || []) {
  daten.push([`data/techniken.json ${t.id}`, t.geprueft_am]);
  [t.quelle_url, ...(t.weitere_quellen || []).map(q => q.url), t.rechner && t.rechner.quelle_url].filter(Boolean).forEach(u => links.add(u.split('#')[0]));
}
const alt = daten.filter(([, d]) => tage(d) > 90);
const proDatei = {};
for (const [f, d] of daten) (proDatei[f] = proDatei[f] || new Set()).add(d);
console.log('Prüfdaten:');
for (const [f, s] of Object.entries(proDatei)) console.log(`  ${f}: ${[...s].sort().join(', ')}${[...s].some(d => tage(d) > 90) ? '  ÄLTER ALS 90 TAGE' : ''}`);
console.log(`\n${daten.length} Prüfdaten, davon ${alt.length} älter als 90 Tage.`);
console.log(`${links.size} verschiedene Learn-Links.`);
if (ARGS.includes('--links')) {
  for (const u of [...links].sort()) {
    try {
      const r = await fetch(u, { redirect: 'manual' });
      const ziel = r.headers.get('location');
      console.log(`  ${r.status} ${u}${ziel ? ' -> ' + ziel : ''}`);
    } catch (e) { console.log(`  FEHLER ${u} (${e.message})`); }
  }
} else {
  [...links].sort().forEach(u => console.log('  ' + u));
}
