#!/usr/bin/env node
/*
  KMUpower Dojo: Vorschaubilder und Dojo-Seiten aus den Daten. Node 18 oder neuer, keine Abhaengigkeiten.

  node scripts/karten.mjs                 alle Eintraege (Vorschau): SVG und PNG je Technik und je Guertel, dazu
                                          dojo/guertel.json, die sieben Guertel-Landeseiten und die Fragenliste
                                          ohne JavaScript in dojo/test/index.html
  node scripts/karten.mjs --produktion    nur freigegebene Eintraege, Karten nicht freigegebener Eintraege werden entfernt
  Zusatz: --ohne-png      nur SVG schreiben (kein Chrome noetig)
          CHROME=Pfad     Chrome oder Edge fuer die PNG-Wandlung (sonst Standardpfade)

  Chrome ist ein lokales Werkzeug, keine Abhaengigkeit der Seite. Die Seite laedt keine fremden Dienste.
  Danach node scripts/build.mjs laufen lassen: Er fuellt die Rahmen-Marker der neuen Seiten.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const PRODUKTION = ARGS.includes('--produktion');
const OHNE_PNG = ARGS.includes('--ohne-png');
const lies = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const gibtEs = (rel) => fs.existsSync(path.join(ROOT, rel));
const geschrieben = [];
const warnungen = [];
function schreibe(rel, inhalt) {
  const ziel = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  if (fs.existsSync(ziel) && fs.readFileSync(ziel, 'utf8') === inhalt) return;
  fs.writeFileSync(ziel, inhalt);
  geschrieben.push(rel);
}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad2 = (n) => String(n).padStart(2, '0');
const datumCH = (iso) => { const [y, m, d] = String(iso).split('-'); return `${d}.${m}.${y}`; };
const istIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/* Konstanten aus build.mjs (eine Quelle) */
const BUILD = lies('scripts/build.mjs');
const BASE_URL = (BUILD.match(/const BASE_URL = '([^']+)'/) || [])[1] || 'https://marcelehmann.github.io/copilot-ninja/';
const KURZ_BASIS = BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* Daten */
const daten = JSON.parse(lies('data/techniken.json'));
const STANDARD = [
  ['weiss', 'Weisser Gürtel', 'Weiss'], ['gelb', 'Gelber Gürtel', 'Gelb'], ['orange', 'Oranger Gürtel', 'Orange'], ['gruen', 'Grüner Gürtel', 'Grün'],
  ['blau', 'Blauer Gürtel', 'Blau'], ['braun', 'Brauner Gürtel', 'Braun'], ['schwarz', 'Schwarzer Gürtel', 'Schwarz']
];
const ANKER = { weiss: 'weisser-guertel', gelb: 'gelber-guertel', orange: 'oranger-guertel', gruen: 'gruener-guertel', blau: 'blauer-guertel', braun: 'brauner-guertel', schwarz: 'schwarzer-guertel' };
const BELT = ['#FBFAF5', '#E2B100', '#E36A00', '#2E8B57', '#2F6FB5', '#7A4A2B', '#111111'];
const GUERTEL = STANDARD.map(([farbe, name, kurz], i) => {
  const aus = (daten.guertel || []).find(g => g.nr === i + 1) || {};
  return { nr: i + 1, farbe, name, kurz, leitwort: aus.leitwort || '', kannst_du: aus.kannst_du || '', erreicht_satz: aus.erreicht_satz || '' };
});
const istFrei = (t) => istIso(t.freigabe) && (!t.offen_pruefen || !t.offen_pruefen.length);
const ALLE = (daten.techniken || []).filter(t => t && t.id && t.slug);
const DABEI = PRODUKTION ? ALLE.filter(istFrei) : ALLE;
const alle25Frei = ALLE.filter(t => t.typ === 'technik' && istFrei(t)).length === 25;

/* Schrift: Breite grob schaetzen (eher zu breit, damit nichts ueberlaeuft) */
function breite(text, px, fett = false) {
  let e = 0;
  for (const z of text) {
    if (' '.includes(z)) e += 0.28;
    else if ('iljtfrI.,:;!\'|«»()'.includes(z)) e += 0.32;
    else if ('mwMW'.includes(z)) e += 0.86;
    else if (/[A-ZÄÖÜ]/.test(z)) e += 0.64;
    else if (/[0-9]/.test(z)) e += 0.56;
    else e += 0.54;
  }
  return e * px * (fett ? 1.05 : 1);
}
function umbrechen(text, px, max, fett) {
  const zeilen = []; let z = '';
  for (const wort of String(text).split(/\s+/)) {
    const probe = z ? z + ' ' + wort : wort;
    if (breite(probe, px, fett) > max && z) { zeilen.push(z); z = wort; } else z = probe;
  }
  if (z) zeilen.push(z);
  return zeilen;
}
const DISPLAY = "Bahnschrift, 'Avenir Next Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif";
const BODY = "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif";
function textZeilen(zeilen, x, y, px, abstand, attr) {
  return zeilen.map((z, i) => `<text x="${x}" y="${y + i * abstand}" font-size="${px}" ${attr}>${esc(z)}</text>`).join('\n');
}

/* Bausteine aus Dateien von FUNDAMENT: Wortmarke (og-image.svg) und Tusch (assets/img/tusch.svg) */
const WORT = (() => { try { return (lies('og-image.svg').match(/scale\(1\.9\)"[^>]*><path d="([^"]+)"/) || [])[1] || ''; } catch { return ''; } })();
const TUSCH = (() => { try { return lies('assets/img/tusch.svg'); } catch { return ''; } })();
if (!WORT) warnungen.push('Wortmarke in og-image.svg nicht gefunden, Karten zeigen Text');
if (!TUSCH) warnungen.push('assets/img/tusch.svg fehlt, Karten ohne Tusch');
function wortmarke(x, y, s) {
  return WORT ? `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#15171B" stroke-width="2.3" stroke-linecap="square"><path d="${WORT}"/></g>`
    : `<text x="${x}" y="${y + 24}" font-family="${DISPLAY}" font-weight="600" font-size="30" fill="#15171B">KMUpower Dojo</text>`;
}
function tusch(x, y, hoehe, farbe) {
  if (!TUSCH) return '';
  const b = Math.round(hoehe * 0.75);
  return TUSCH.replace(/^<svg[^>]*>/, `<svg x="${x}" y="${y}" width="${b}" height="${hoehe}" viewBox="0 0 120 160">`)
    .replace(/<title>[^<]*<\/title>/, '').replace(/(\.t-guertel,\.t-guertel-enden\{fill:)#[0-9A-Fa-f]{6}/, `$1${farbe}`).trim();
}
function band(n) {
  const w = 1200 / 7;
  const teile = BELT.map((c, i) => i === n - 1
    ? `<rect x="${(i * w).toFixed(1)}" y="584" width="${(w + 1).toFixed(1)}" height="46" fill="${c}" stroke="#8A7F6C" stroke-width="2"/>`
    : `<rect x="${(i * w).toFixed(1)}" y="606" width="${(w + 1).toFixed(1)}" height="24" fill="${c}"/>`);
  return `${teile.join('')}<rect x="0" y="605" width="1200" height="1.5" fill="#8A7F6C"/>`;
}
function stempel(x, y) {
  return `<g transform="translate(${x} ${y}) rotate(-6)"><rect width="226" height="84" fill="#F4EFE6" stroke="#B4301A" stroke-width="4.5"/><rect x="7" y="7" width="212" height="70" fill="none" stroke="#B4301A" stroke-width="1.4"/><text x="113" y="45" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="34" letter-spacing="4" fill="#B4301A">GEPRÜFT</text><text x="113" y="67" text-anchor="middle" font-family="${DISPLAY}" font-size="15.5" fill="#B4301A">gegen die Dokumentation</text></g>`;
}
function rahmen(inhalt, titel) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(titel)}">
<title>${esc(titel)}</title>
<rect width="1200" height="630" fill="#F4EFE6"/>
${inhalt}
</svg>
`;
}

/* Karte je Technik: Guertelband, Nummer, Ninja-Name, Nutzen, Tusch, Adresse. Kein Datum, keine Microsoft-Marke gross. */
function technikKarte(t) {
  const g = GUERTEL[t.guertel - 1];
  const istT = t.typ === 'technik';
  const zeile1 = istT ? `TECHNIK ${pad2(t.nr)}${alle25Frei ? ' VON 25' : ''}` : `GRUNDFORM ${t.id.toUpperCase()}`;
  const adresse = istT ? `${KURZ_BASIS}/${t.nr}` : `${KURZ_BASIS}/techniken/${t.slug}/`;
  const teile = [wortmarke(80, 48, 1.45)];
  teile.push(`<rect x="80" y="122" width="58" height="22" fill="${BELT[t.guertel - 1]}" stroke="#8A7F6C" stroke-width="2"/><rect x="100" y="115" width="18" height="36" fill="${BELT[t.guertel - 1]}" stroke="#8A7F6C" stroke-width="2"/>`);
  teile.push(`<text x="156" y="142" font-family="${DISPLAY}" font-weight="700" font-size="24" letter-spacing="2.5" fill="#B4301A">${esc(zeile1)}</text>`);
  teile.push(`<text x="${156 + Math.round(breite(zeile1, 24, true) + zeile1.length * 2.5 + 22)}" y="142" font-family="${DISPLAY}" font-weight="600" font-size="24" letter-spacing="1" fill="#4E525B">${esc(g.name.toUpperCase())}</text>`);
  let y = 228;
  let px = 68, name = umbrechen(t.titel, px, 770, true);
  if (name.length > 2) { px = 56; name = umbrechen(t.titel, px, 770, true); }
  teile.push(textZeilen(name.slice(0, 3), 80, y, px, px + 4, `font-family="${DISPLAY}" font-weight="700" fill="#15171B" letter-spacing="-1"`));
  y += (name.length - 1) * (px + 4);
  if (t.klartitel && t.klartitel !== t.titel) {
    const kl = umbrechen(t.klartitel, 28, 770);
    y += 50;
    teile.push(textZeilen(kl.slice(0, 2), 80, y, 28, 36, `font-family="${BODY}" font-weight="600" fill="#4E525B"`));
    y += (Math.min(kl.length, 2) - 1) * 36;
  }
  if (t.nutzen) {
    let npx = 30, nz = umbrechen(t.nutzen, npx, 760);
    while (nz.length > 3 && npx > 22) { npx -= 2; nz = umbrechen(t.nutzen, npx, 760); }
    const abstand = Math.round(npx * 1.32);
    y += 30;
    teile.push(`<rect x="80" y="${y}" width="6" height="${(Math.min(nz.length, 4) - 1) * abstand + npx + 6}" fill="#B4301A"/>`);
    teile.push(textZeilen(nz.slice(0, 4), 104, y + npx, npx, abstand, `font-family="${BODY}" fill="#15171B"`));
    if (nz.length > 4) warnungen.push(`${t.id}: Nutzen-Satz zu lang für die Karte`);
  }
  teile.push(tusch(902, 128, 290, BELT[t.guertel - 1]));
  teile.push(stempel(880, 438));
  teile.push(`<text x="1120" y="568" text-anchor="end" font-family="${BODY}" font-size="22" fill="#4E525B">${esc(adresse)}</text>`);
  teile.push(band(t.guertel));
  return rahmen(teile.join('\n'), `${istT ? 'Technik ' + pad2(t.nr) : 'Grundform'}: ${t.titel}. ${t.nutzen || ''}`.trim());
}
/* Karte je Guertel (Landeseiten): Guertelband, Name, Leitwort, Tusch. Ohne «Mein», ohne Namen. */
function guertelKarte(g) {
  const teile = [wortmarke(80, 48, 1.45)];
  teile.push(`<text x="80" y="170" font-family="${DISPLAY}" font-weight="700" font-size="26" letter-spacing="3" fill="#B4301A">STUFE ${g.nr} VON 7</text>`);
  teile.push(`<text x="80" y="282" font-family="${DISPLAY}" font-weight="700" font-size="104" letter-spacing="-2" fill="#15171B">${esc(g.name)}</text>`);
  teile.push(`<rect x="80" y="318" width="600" height="34" fill="${BELT[g.nr - 1]}" stroke="#8A7F6C" stroke-width="3"/><rect x="352" y="304" width="56" height="62" fill="${BELT[g.nr - 1]}" stroke="#8A7F6C" stroke-width="3"/>`);
  if (g.leitwort) teile.push(`<text x="80" y="446" font-family="${DISPLAY}" font-weight="600" font-size="54" fill="#15171B">${esc(g.leitwort)}</text>`);
  teile.push(`<text x="80" y="512" font-family="${BODY}" font-size="28" fill="#4E525B">Selbsteinschätzung im KMUpower Dojo. Kein Zertifikat.</text>`);
  teile.push(tusch(880, 110, 330, BELT[g.nr - 1]));
  teile.push(`<text x="1120" y="568" text-anchor="end" font-family="${BODY}" font-size="22" fill="#4E525B">${esc(KURZ_BASIS)}</text>`);
  teile.push(band(g.nr));
  return rahmen(teile.join('\n'), `${g.name}${g.leitwort ? ', ' + g.leitwort : ''}. Selbsteinschätzung im KMUpower Dojo, kein Zertifikat.`);
}

/* PNG mit lokalem Chrome */
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => fs.existsSync(p));
let profil = null;
function png(svgRel) {
  if (OHNE_PNG) return;
  if (!CHROME) { if (!warnungen.includes('kein Chrome')) warnungen.push('kein Chrome gefunden, nur SVG geschrieben (CHROME=Pfad setzen)'); return; }
  profil = profil || fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-karten-'));
  const pngRel = svgRel.replace(/\.svg$/, '.png');
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profil}`,
      '--force-device-scale-factor=1', '--default-background-color=F4EFE6FF', `--screenshot=${path.join(ROOT, pngRel)}`, '--window-size=1200,630',
      'file:///' + path.join(ROOT, svgRel).replace(/\\/g, '/')], { stdio: 'ignore', timeout: 60000 });
    const kb = fs.statSync(path.join(ROOT, pngRel)).size / 1024;
    if (kb > 120) warnungen.push(`${pngRel}: ${kb.toFixed(0)} KB, Budget 120 KB`);
    geschrieben.push(pngRel);
  } catch (e) { warnungen.push(`${pngRel}: Chrome-Aufruf fehlgeschlagen (${e.message})`); }
}

/* Seiten von Hand: Rahmen-Bloecke aus der bestehenden Datei uebernehmen, Rest neu schreiben */
function rahmenBehalten(rel, neu) {
  if (!gibtEs(rel)) return neu;
  const alt = lies(rel);
  return neu.replace(/(<!-- RAHMEN:([A-Z-]+) -->)[\s\S]*?(<!-- \/RAHMEN:\2 -->)/g, (m, a, name, b) => {
    const t = alt.match(new RegExp(`<!-- RAHMEN:${name} -->[\\s\\S]*?<!-- /RAHMEN:${name} -->`));
    return t ? t[0] : m;
  });
}
function landeseite(g) {
  const r = '../../../';
  const bild = `${BASE_URL}assets/img/karten/guertel-${g.farbe}.png`;
  const beschreibung = `${g.name}${g.leitwort ? ', ' + g.leitwort : ''}. Selbsteinschätzung auf einer unabhängigen Website, kein Zertifikat. Mach den Test mit sieben Fragen selbst.`;
  const html = `<!doctype html>
<html lang="de-CH" data-seite="guertel">
<head>
<meta charset="utf-8">
<!-- RAHMEN:HEAD -->
<!-- /RAHMEN:HEAD -->
<title>Dojo-Gürtel: ${esc(g.kurz)} | KMUpower Dojo</title>
<meta name="description" content="${esc(beschreibung)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KMUpower Dojo">
<meta property="og:locale" content="de_CH">
<meta property="og:title" content="${esc(g.name)} im KMUpower Dojo">
<meta property="og:description" content="${esc(beschreibung)}">
<meta property="og:url" content="${BASE_URL}dojo/guertel/${g.farbe}/">
<meta property="og:image" content="${bild}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Karte: ${esc(g.name)}${g.leitwort ? ', ' + esc(g.leitwort) : ''}. Selbsteinschätzung, kein Zertifikat.">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<!-- RAHMEN:KOPF -->
<!-- /RAHMEN:KOPF -->
<main id="main" data-guertel-nr="${g.nr}">
  <div class="wrap">
    <nav class="krumen" aria-label="Brotkrumen"><ol><li><a href="${r}">Start</a></li><li><a href="../../">Mein Dojo</a></li><li><a href="./" aria-current="page">${esc(g.name)}</a></li></ol></nav>
    <section class="sektion--eng heute" aria-labelledby="h1">
      <div>
        <span class="label">Stufe ${g.nr} von 7${g.leitwort ? ', ' + esc(g.leitwort) : ''}</span>
        <h1 id="h1">${esc(g.name)}</h1>
        <p class="lead"><strong>Selbsteinschätzung auf einer unabhängigen Website. Kein Zertifikat.</strong></p>
${g.kannst_du ? `        <p>Was du nach diesem Gürtel kannst: ${esc(g.kannst_du)}</p>\n` : ''}        <p>Diese Seite gehört zu einer geteilten Karte aus dem KMUpower Dojo. Die Karte zeigt entweder den Startpunkt aus dem Selbsttest mit sieben Fragen oder einen Gürtel, dessen Techniken die Person selbst als geübt markiert hat.</p>
        <div class="knopf-reihe">
          <a class="knopf knopf--primaer" href="../../test/">Mach den Test selbst</a>
          <a class="knopf" href="${r}techniken/#${ANKER[g.farbe]}">Techniken dieses Gürtels</a>
        </div>
      </div>
      <figure class="guertelkarte">
        <img src="${r}assets/img/karten/guertel-${g.farbe}.svg" width="1200" height="630" alt="Karte: ${esc(g.name)}${g.leitwort ? ', ' + esc(g.leitwort) : ''}. Selbsteinschätzung im KMUpower Dojo, kein Zertifikat.">
      </figure>
    </section>
    <section class="sektion--eng" aria-labelledby="h-was">
      <div class="kasten">
        <h2 id="h-was">Was ist das KMUpower Dojo?</h2>
        <p>Ninja-Techniken für Microsoft Copilot Chat und Copilot Studio, vom weissen bis zum schwarzen Gürtel. Jede mit Quelle bei Microsoft Learn und Prüfdatum. Ohne Anmeldung und ohne Cookies.</p>
        <p class="knopf-reihe"><a class="knopf" href="${r}">Zur Startseite</a><a class="knopf knopf--leise" href="${r}techniken/">Alle Techniken</a></p>
      </div>
    </section>
    <nav class="sektion--eng" aria-labelledby="h-stufen">
      <h2 id="h-stufen" class="label">Alle sieben Gürtel</h2>
      <ul class="chips">${GUERTEL.map(x => `<li><a class="chip" href="../${x.farbe}/"${x.nr === g.nr ? ' aria-current="page"' : ''}><span class="knoten" data-guertel-nr="${x.nr}" aria-hidden="true"></span>${esc(x.kurz)}</a></li>`).join('')}</ul>
    </nav>
  </div>
</main>
<!-- RAHMEN:FUSS -->
<!-- /RAHMEN:FUSS -->
</body>
</html>
`;
  schreibe(`dojo/guertel/${g.farbe}/index.html`, rahmenBehalten(`dojo/guertel/${g.farbe}/index.html`, html));
}

/* Fragenliste ohne JavaScript in dojo/test/index.html (zwischen DOJO:FRAGEN-Markern) */
const TECHNIK_NAMEN = { t06: 'Das Falkenauge', t12: 'Die Fährte' };
function fragenListe() {
  const rel = 'dojo/test/index.html';
  if (!gibtEs(rel) || !gibtEs('dojo/selbsttest.json')) return;
  const pool = JSON.parse(lies('dojo/selbsttest.json'));
  const nachId = Object.fromEntries(DABEI.map(t => [t.id, t]));
  /* ohne JavaScript nur Faktenfragen und zeitlose Fragen, deren Technik zu Paket A gehoert (Guertel 1 bis 3) und im Build ist */
  const statisch = pool.fragen.filter(f => f.klasse === 'fakt' || !f.technik || (f.guertel <= 3 && (nachId[f.technik] || !PRODUKTION)));
  const li = statisch.map(f => {
    const g = GUERTEL[f.guertel - 1];
    const t = f.technik ? nachId[f.technik] : null;
    const quelle = f.quelle
      ? `<p class="klein">Quelle: <a href="${esc(f.quelle.url)}" rel="noopener">${esc(f.quelle.titel)}</a>, Stand ${datumCH(f.geprueft_am)}.</p>${f.klasse === 'fakt' ? `\n          <a class="stempel stempel--klein" href="${esc(f.quelle.url)}" rel="noopener" data-geprueft="${f.geprueft_am}" data-pruef-frist="120"><span class="stempel__haupt">Geprüft</span><span class="stempel__unter">gegen die Dokumentation</span><time datetime="${f.geprueft_am}">${datumCH(f.geprueft_am)}</time><span class="stempel__faellig">Prüfung fällig. Massgebend ist die verlinkte Quelle.</span></a>` : ''}`
      : f.technik ? `<p class="klein">Aus Technik ${Number(f.technik.slice(1))}, ${esc(t ? t.titel : TECHNIK_NAMEN[f.technik] || '')}.</p>` : '';
    return `      <li class="test__frage" id="frage-${f.id}"${f.klasse === 'fakt' ? ` data-geprueft="${f.geprueft_am}" data-pruef-frist="120"` : ''}>
        <p><span class="knoten" data-guertel-nr="${g.nr}">${esc(g.name)}</span></p>
        <h3>${esc(f.frage)}</h3>
        <ul class="arrow-list">${f.antworten.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
        <details class="einklapp">
          <summary>Auflösung</summary>
          <p><strong>Richtig ist: ${esc(f.antworten[f.richtig])}</strong></p>
          <p>${esc(f.aufloesung)}</p>
          ${quelle}
        </details>
      </li>`;
  }).join('\n');
  const html = lies(rel);
  const re = /(<!-- DOJO:FRAGEN -->)[\s\S]*?(<!-- \/DOJO:FRAGEN -->)/;
  if (!re.test(html)) { warnungen.push(`${rel}: Marker DOJO:FRAGEN fehlt`); return; }
  schreibe(rel, html.replace(re, `$1\n    <ol class="test">\n${li}\n    </ol>\n    $2`));
}

/* Ablauf */
fs.mkdirSync(path.join(ROOT, 'assets/img/karten'), { recursive: true });
schreibe('dojo/guertel.json', JSON.stringify({ hinweis: 'Erzeugt von scripts/karten.mjs aus data/techniken.json. Nicht von Hand bearbeiten.', guertel: GUERTEL.map(({ nr, farbe, name, kurz, leitwort, kannst_du, erreicht_satz }) => ({ nr, farbe, name, kurz, leitwort, kannst_du, erreicht_satz })) }, null, 2) + '\n');
GUERTEL.forEach(g => { if (!g.erreicht_satz) warnungen.push(`Gürtel ${g.nr}: erreicht_satz fehlt in data/techniken.json (Meldung nutzt «Was du jetzt kannst»)`); });
for (const g of GUERTEL) {
  const rel = `assets/img/karten/guertel-${g.farbe}.svg`;
  schreibe(rel, guertelKarte(g));
  png(rel);
  landeseite(g);
}
for (const t of DABEI) {
  const rel = `assets/img/karten/${t.slug}.svg`;
  schreibe(rel, technikKarte(t));
  png(rel);
}
const behalten = new Set([...DABEI.map(t => t.slug), ...GUERTEL.map(g => 'guertel-' + g.farbe)]);
for (const f of fs.readdirSync(path.join(ROOT, 'assets/img/karten'))) {
  const stamm = f.replace(/\.(svg|png)$/, '');
  if (/\.(svg|png)$/.test(f) && !behalten.has(stamm)) { fs.rmSync(path.join(ROOT, 'assets/img/karten', f)); warnungen.push(`assets/img/karten/${f} entfernt (nicht im ${PRODUKTION ? 'Produktions-' : ''}Build)`); }
}
fragenListe();
if (profil) { try { fs.rmSync(profil, { recursive: true, force: true }); } catch { /* Chrome haelt Dateien evtl. noch kurz */ } }

console.log(`KMUpower Dojo Karten, ${PRODUKTION ? 'Produktion' : 'Vorschau'}: ${DABEI.length} Einträge, 7 Gürtel`);
console.log(`Geschrieben: ${geschrieben.length} Dateien`);
if (warnungen.length) { console.log(`Warnungen (${warnungen.length}):`); warnungen.forEach(w => console.log('  - ' + w)); }
