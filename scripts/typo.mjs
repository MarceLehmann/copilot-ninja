/*
  Power Platform Dojo: Typografie je Sprache (14.11.2026). Gemeinsam fuer build.mjs und karten.mjs.
  Regel aus data/sprachen/<code>.json, Feld typo: { "zeichen": ":;?!", "leerzeichen": " " }.
  Franzoesisch: geschuetztes Leerzeichen vor : ; ? !, auch wo der Code Zeichen anhaengt (die Regel laeuft auf der fertigen Ausgabe).
  Nur wenn nach dem Zeichen Leerraum oder das Ende folgt: Adressen (https://), Uhrzeiten (8:30), 1:1 und Abfragen (?a=b) bleiben.
  HTML-Entitaeten (&amp;) bleiben unberuehrt.
*/
const LEER = /[  ]/;
export function typoText(text, regel) {
  if (!regel || !regel.zeichen || typeof text !== 'string') return text;
  const zeichen = regel.zeichen.replace(/[\]\\^-]/g, '\\$&');
  const re = new RegExp(`(?<!&[#a-zA-Z0-9]*)(\\S)[ \\u00a0\\u202f]?([${zeichen}])(?=\\s|$|&nbsp;|&#160;)`, 'g');
  return text.replace(re, (m, a, z) => (LEER.test(a) ? m : a + regel.leerzeichen + z));
}
// Fehlt das Leerzeichen irgendwo im Text? Fuer die Abschlusspruefung des Builds.
export function typoFehlt(text, regel) {
  return !!regel && typoText(text, regel) !== text;
}
// Attribute mit sichtbarem oder vorgelesenem Text
const TEXT_ATTRIBUTE = /\s(alt|title|aria-label|placeholder|data-erfolg|data-herkunft)="([^"]*)"/g;
const META_TEXT = /^<meta\b(?=[^>]*\s(?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description)")/i;
export function typoMarkup(markup, regel) {
  if (!regel || !regel.zeichen) return markup;
  let inSkript = false;
  return markup.split(/(<[^>]+>)/).map(teil => {
    if (teil.startsWith('<')) {
      if (/^<(script|style)\b/i.test(teil)) inSkript = !/\/>$/.test(teil);
      else if (/^<\/(script|style)/i.test(teil)) inSkript = false;
      if (teil.startsWith('<!') || teil.startsWith('</')) return teil;
      let t = teil.replace(TEXT_ATTRIBUTE, (m, n, v) => ` ${n}="${typoText(v, regel)}"`);
      if (META_TEXT.test(t)) t = t.replace(/\scontent="([^"]*)"/, (m, v) => ` content="${typoText(v, regel)}"`);
      return t;
    }
    return inSkript ? teil : typoText(teil, regel);
  }).join('');
}
// Alle Zeichenketten in einem JSON-Wert
export function typoJson(wert, regel) {
  if (!regel) return wert;
  if (typeof wert === 'string') return typoText(wert, regel);
  if (Array.isArray(wert)) return wert.map(x => typoJson(x, regel));
  if (wert && typeof wert === 'object') return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, typoJson(v, regel)]));
  return wert;
}
