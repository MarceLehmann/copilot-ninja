/* KMUpower Dojo gratis.js: Gratis-Check auf /gratis/, Ergebnis per Hash teilbar, eingeklappte Zeilen per Hash oeffnen,
   Begruessung bei ?von=gratis. Alle Saetze stehen im HTML (template#check-saetze), hier wird nur ausgewaehlt. Nichts wird gesendet. */
(function () {
  'use strict';
  var d = document, w = window;
  var CN = w.CN || {};
  var ROOT = CN.root || (function () { var s = d.querySelector('script[src*="assets/js/gratis.js"]'); return s ? s.src.replace(/assets\/js\/gratis\.js.*$/, '') : ''; })();
  var alle = function (sel, el) { return Array.prototype.slice.call((el || d).querySelectorAll(sel)); };

  /* Sprungmarken in eingeklappten Bereichen oeffnen */
  function zielOeffnen() {
    var h = w.location.hash.slice(1);
    if (!h || h.indexOf('=') > -1) return;
    var ziel;
    try { ziel = d.getElementById(decodeURIComponent(h)); } catch (e) { return; }
    if (!ziel) return;
    var det = ziel.tagName === 'DETAILS' ? ziel : ziel.closest('details');
    var offen = false;
    while (det) { if (!det.open) { det.open = true; offen = true; } det = det.parentElement && det.parentElement.closest('details'); }
    if (offen) ziel.scrollIntoView();
  }

  function begruessung() {
    if (!/[?&]von=gratis(&|$)/.test(w.location.search)) return;
    alle('[data-von-gratis]').forEach(function (m) { m.hidden = false; });
  }

  function check(box) {
    var form = box.querySelector('[data-check-form]');
    var erg = box.querySelector('[data-check-ergebnis]');
    var tpl = d.getElementById('check-saetze');
    if (!form || !erg || !tpl) return;
    alle('[data-check-ohne-js]', box).forEach(function (m) { m.hidden = true; });
    form.hidden = false;
    var status = erg.querySelector('[data-check-status]');
    var fragenNachKonto = alle('[data-frage]:not([data-frage="konto"])', form);
    var suche = null;

    function wert(name) { var e = form.querySelector('input[name="' + name + '"]:checked'); return e ? e.value : ''; }
    function vorhaben() { return alle('input[name="vorhaben"]:checked', form).map(function (e) { return e.value; }); }
    function satz(id) { return tpl.content.querySelector('[data-satz="' + id + '"]'); }

    function privatModus() {
      var privat = wert('konto') === 'k2';
      fragenNachKonto.forEach(function (f) { f.hidden = privat; });
    }

    function hashAus() {
      var teile = [];
      ['konto', 'abo', 'schild'].forEach(function (n) { var v = wert(n); if (v) teile.push(v); });
      var v = vorhaben().map(function (x) { return x.slice(1); }).join('');
      if (v && wert('konto') !== 'k2') teile.push('v' + v);
      return teile.length ? '#check=' + teile.join('-') : '#check';
    }

    function hashLesen() {
      var m = /^#check=([a-z0-9-]+)$/.exec(w.location.hash);
      if (!m) return false;
      form.reset();
      var gesetzt = false;
      m[1].split('-').forEach(function (t) {
        var k = /^(k[1-3]|a(?:10|[1-9])|s[1-3])$/.test(t) ? t : null;
        if (k) {
          var e = form.querySelector('input[value="' + k + '"]');
          if (e) { e.checked = true; gesetzt = true; }
        } else if (/^v[1-6]+$/.test(t)) {
          t.slice(1).split('').forEach(function (n) { var e = form.querySelector('input[name="vorhaben"][value="v' + n + '"]'); if (e) { e.checked = true; gesetzt = true; } });
        }
      });
      return gesetzt;
    }

    function technikenLaden() {
      if (!suche) suche = fetch(ROOT + 'assets/data/suche.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      return suche;
    }

    function zeigen(fokus) {
      var ids = [], gruppen = {};
      alle('[data-check-gruppe]', erg).forEach(function (g) {
        gruppen[g.getAttribute('data-check-gruppe')] = g;
        g.hidden = true;
        g.querySelector('[data-liste]').textContent = '';
      });
      function setze(id) {
        var s = satz(id);
        if (!s) return;
        var g = gruppen[s.getAttribute('data-gruppe')];
        if (!g) return;
        g.querySelector('[data-liste]').appendChild(s.cloneNode(true));
        g.hidden = false;
        (s.getAttribute('data-techniken') || '').split(' ').forEach(function (t) { if (t && ids.indexOf(t) < 0) ids.push(t); });
      }
      var konto = wert('konto');
      if (konto) setze(konto);
      if (konto !== 'k2') {
        var abo = wert('abo');
        if (abo === 'a9') setze('a-anderes');
        else if (abo === 'a10') setze('a-weiss');
        else if (abo) setze('a-liste');
        var schild = wert('schild');
        if (schild) setze(schild);
        setze('s-immer');
        vorhaben().forEach(setze);
      }
      var tg = gruppen.techniken;
      erg.hidden = false;
      if (konto !== 'k2' && tg) {
        technikenLaden().then(function (j) {
          var liste = tg.querySelector('[data-liste]'), eintraege = (j && j.eintraege) || [];
          liste.textContent = '';
          ids.forEach(function (id) {
            var t = eintraege.filter(function (x) { return x.id === id; })[0];
            if (!t) return;
            var li = d.createElement('li'), a = d.createElement('a');
            a.href = ROOT + 'techniken/' + t.slug + '/';
            a.textContent = (t.nr ? 'Nr. ' + t.nr + ' ' : '') + t.titel;
            li.appendChild(a);
            if (t.klartitel && t.klartitel !== t.titel) li.appendChild(d.createTextNode(': ' + t.klartitel));
            liste.appendChild(li);
          });
          if (!liste.children.length) {
            var li = d.createElement('li'), a = d.createElement('a');
            a.href = ROOT + 'techniken/';
            a.textContent = 'Alle Techniken nach Gürtel';
            li.appendChild(a);
            liste.appendChild(li);
          }
          tg.hidden = false;
        });
      }
      if (fokus) {
        erg.focus({ preventScroll: true });
        erg.scrollIntoView({ block: 'start', behavior: CN.bewegung && CN.bewegung() ? 'smooth' : 'auto' });
      }
    }

    form.addEventListener('change', function (e) { if (e.target.name === 'konto') privatModus(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!wert('konto') && !wert('abo') && !wert('schild') && !vorhaben().length) {
        if (status) status.textContent = '';
        var erste = form.querySelector('input');
        if (erste) erste.focus();
        return;
      }
      try { history.replaceState(null, '', hashAus()); } catch (err) { /* file:// */ }
      zeigen(true);
    });

    var teilen = erg.querySelector('[data-check-teilen]');
    if (teilen) teilen.addEventListener('click', function () {
      var url = w.location.href.split('#')[0] + hashAus();
      var fertig = function (ok) { if (status) status.textContent = ok ? 'Link kopiert. Wer ihn öffnet, sieht dieses Ergebnis.' : 'Kopieren ging nicht. Markier die Adresse oben im Browser.'; };
      if (CN.kopierText) CN.kopierText(url).then(function () { fertig(true); d.dispatchEvent(new CustomEvent('cn:kopiert', { detail: { id: 'gratis-check' } })); }, function () { fertig(false); });
      else fertig(false);
    });

    var neu = erg.querySelector('[data-check-neu]');
    if (neu) neu.addEventListener('click', function () {
      form.reset();
      privatModus();
      erg.hidden = true;
      if (status) status.textContent = '';
      try { history.replaceState(null, '', '#check'); } catch (err) { /* file:// */ }
      var erste = form.querySelector('input');
      if (erste) erste.focus();
    });

    if (hashLesen()) { privatModus(); zeigen(true); }
    w.addEventListener('hashchange', function () { if (hashLesen()) { privatModus(); zeigen(true); } });
  }

  /* Auf dem Handy die langen Listen einklappen, ausser die Sprungmarke zeigt hinein (Korrektur 15.10.2026) */
  function mobilEinklappen() {
    if (!w.matchMedia || !w.matchMedia('(max-width: 59.99rem)').matches) return;
    var h = w.location.hash.slice(1), ziel = null;
    try { ziel = h && h.indexOf('=') < 0 ? d.getElementById(decodeURIComponent(h)) : null; } catch (e) { ziel = null; }
    alle('details[data-mobil-zu]').forEach(function (det) { if (!ziel || !det.contains(ziel)) det.open = false; });
  }

  function los() {
    mobilEinklappen();
    begruessung();
    alle('[data-gratis-check="seite"]').forEach(check);
    zielOeffnen();
    w.addEventListener('hashchange', zielOeffnen);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', los); else los();
})();
