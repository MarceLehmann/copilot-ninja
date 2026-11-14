/* Power Platform Dojo sprache.js: synchron im head, nur auf der deutschen Startseite und auf 404. Keine Cookies, keine Anfragen.
   Sprachen ausser Deutsch stehen im Attribut data-sprachen des Skripts (der Build setzt sie aus data/sprachen/).
   Startseite: gespeicherte Wahl (localStorage cn-sprache) gilt. Ohne Wahl entscheidet die erste Sprache in navigator.languages,
   die das Dojo hat (Deutsch bleibt hier); hat das Dojo keine davon, Englisch. Die Wahl wird gemerkt. Crawler werden nie weitergeleitet.
   404: Adressen unter <code>/ zeigen die 404-Seite dieser Sprache. */
(function (w, d) {
  var h = d.documentElement, s = d.currentScript, root = s && s.src ? s.src.replace(/assets\/js\/sprache\.js.*$/, '') : '';
  if (!root || /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|mediapartners|preview/i.test(navigator.userAgent || '')) return;
  var codes = ((s && s.getAttribute('data-sprachen')) || 'en').split(/\s+/).filter(Boolean);
  var ls = null; try { ls = w.localStorage; } catch (e) { ls = null; }
  function lies() { try { return ls ? ls.getItem('cn-sprache') : null; } catch (e) { return null; } }
  function merke(v) { try { if (ls) ls.setItem('cn-sprache', v); } catch (e) { /* ohne Speicher keine Wahl */ } }
  var basis = root.replace(/^https?:\/\/[^\/]+/, '');
  var seite = h.getAttribute('data-seite'), deutsch = /^de/i.test(h.getAttribute('lang') || '');
  var i;
  if (seite === '404') {
    if (deutsch) for (i = 0; i < codes.length; i++) if (w.location.pathname.indexOf(basis + codes[i] + '/') === 0) { w.location.replace(root + codes[i] + '/404.html'); return; }
    return;
  }
  if (seite !== 'start' || !deutsch) return;
  var wahl = lies();
  if (wahl === 'de') return;
  if (!wahl) {
    var l = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (i = 0; i < l.length && !wahl; i++) {
      var c = String(l[i] || '').slice(0, 2).toLowerCase();
      if (c === 'de') return;
      if (codes.indexOf(c) > -1) wahl = c;
    }
    wahl = wahl || (codes.indexOf('en') > -1 ? 'en' : codes[0]);
    merke(wahl);
  }
  if (codes.indexOf(wahl) < 0) return;
  w.location.replace(root + wahl + '/' + w.location.search + w.location.hash);
})(window, document);
