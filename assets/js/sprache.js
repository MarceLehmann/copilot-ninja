/* KMUpower Dojo sprache.js: synchron im head, nur auf der deutschen Startseite und auf 404. Keine Cookies, keine Anfragen.
   Startseite: gespeicherte Wahl (localStorage cn-sprache) gilt. Ohne Wahl und ohne Deutsch in navigator.languages einmal auf en/
   weiterleiten und die Wahl merken. Crawler werden nie weitergeleitet. 404: Adressen unter en/ zeigen die englische 404-Seite. */
(function (w, d) {
  var h = d.documentElement, s = d.currentScript, root = s && s.src ? s.src.replace(/assets\/js\/sprache\.js.*$/, '') : '';
  if (!root || /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|mediapartners|preview/i.test(navigator.userAgent || '')) return;
  var ls = null; try { ls = w.localStorage; } catch (e) { ls = null; }
  function lies() { try { return ls ? ls.getItem('cn-sprache') : null; } catch (e) { return null; } }
  function merke(v) { try { if (ls) ls.setItem('cn-sprache', v); } catch (e) { /* ohne Speicher keine Wahl */ } }
  var basis = root.replace(/^https?:\/\/[^\/]+/, '');
  var seite = h.getAttribute('data-seite'), en = /^en/i.test(h.getAttribute('lang') || '');
  if (seite === '404') {
    if (!en && w.location.pathname.indexOf(basis + 'en/') === 0) w.location.replace(root + 'en/404.html');
    return;
  }
  if (seite !== 'start' || en) return;
  var wahl = lies();
  if (wahl === 'de') return;
  if (!wahl) {
    var l = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < l.length; i++) if (/^de\b/i.test(l[i] || '')) return;
    merke('en');
  } else if (wahl !== 'en') return;
  w.location.replace(root + 'en/' + w.location.search + w.location.hash);
})(window, document);
