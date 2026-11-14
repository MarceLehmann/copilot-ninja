/* Power Platform Dojo kompass.js: Credit-Kompass auf Technik 23. Rechnet im Browser, speichert und sendet nichts. Kein Preis pro Credit. */
(function () {
  'use strict';
  var d = document;
  var TX = window.CN_TEXTE || { meta: {}, texte: {} }, SPR = TX.meta.code || 'de';
  function T(de) { var s = TX.texte[de]; if (typeof s !== 'string') s = de; for (var i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i]); return s; }
  function el(tag, attr, text) {
    var e = d.createElement(tag);
    Object.keys(attr || {}).forEach(function (k) { if (attr[k] !== null) e.setAttribute(k, attr[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function zahl(n) { return (Math.round(n * 10) / 10).toLocaleString(TX.meta.zahl_locale || 'de-CH'); }
  function los() {
    Array.prototype.forEach.call(d.querySelectorAll('[data-kompass]'), function (box, nr) {
      var r; try { r = JSON.parse(box.getAttribute('data-raten')); } catch (e) { return; }
      if (!r || !Array.isArray(r.raten)) return;
      /* Welche Raten mit Microsoft-Copilot-Lizenz entfallen, kommt aus den Daten (rechner.lizenz_ohne_verbrauch) */
      var b = r.beispiel || {}, ohneLizenz = Array.isArray(r.lizenz_ohne_verbrauch) ? r.lizenz_ohne_verbrauch : [];
      var fs = el('fieldset', { 'class': 'rechner__eingaben' });
      fs.appendChild(el('legend', null, T("Dein Agent im Monat")));
      function zeile(id, text, wert, schritt) {
        var z = el('div', { 'class': 'rechner__zeile' });
        z.appendChild(el('label', { 'for': id }, text));
        var i = el('input', { type: 'number', id: id, min: '0', step: schritt, inputmode: 'decimal', value: String(wert) });
        z.appendChild(i); fs.appendChild(z);
        return i;
      }
      var p = 'kompass' + nr;
      var gespraeche = zeile(p + '-g', T("Gespräche pro Monat"), b.gespraeche || 0, '1');
      fs.appendChild(el('p', { 'class': 'klein' }, T("Je Gespräch im Durchschnitt:")));
      var felder = r.raten.map(function (x) {
        var schritt = x.credits < 1 ? '1' : '0.1';
        var rate = x.credits < 1 ? zahl(x.credits * 100) + T(" Credits pro 100") : x.credits + ' ' + (x.credits === 1 ? T("Credit") : T("Credits"));
        return { x: x, i: zeile(p + '-' + x.schluessel, x.name + ' (' + rate + ')', b[x.schluessel] || 0, schritt) };
      });
      var lab = el('label', { 'class': 'wahl' }), lz = el('input', { type: 'checkbox' });
      lab.appendChild(lz); lab.appendChild(el('span', null, T("Nutzer haben eine Microsoft-365-Copilot-Add-on-Lizenz")));
      fs.appendChild(lab);
      var aus = el('p', { 'class': 'rechner__resultat', role: 'status' });
      var hinweis = el('p', { 'class': 'klein' }, T("Mit Haken entfallen nur Classic Answers, Generative Answers und Tenant Graph Grounding unter den Bedingungen oben. Aktionen bleiben eingerechnet, auch Computer-Using-Agent-Aktionen."));
      hinweis.hidden = true;
      var weg = el('p', { 'class': 'klein' });
      var start = box.querySelector('p');
      var ziel = start ? start.nextSibling : box.firstChild;
      [fs, aus, hinweis, weg, el('p', { 'class': 'klein' }, T("Startwerte: ") + (b.hinweis || T("Annahme zur Veranschaulichung.")) + T(" Setz deine eigenen Zahlen ein."))].forEach(function (n) { box.insertBefore(n, ziel); });
      function rechnen() {
        var g = Math.max(0, parseFloat(gespraeche.value) || 0), je = 0, teile = [];
        felder.forEach(function (f) {
          var anzahl = Math.max(0, parseFloat(f.i.value) || 0);
          var rate = lz.checked && ohneLizenz.indexOf(f.x.schluessel) > -1 ? 0 : f.x.credits;
          if (anzahl) teile.push(zahl(anzahl) + T(" mal ") + rate);
          je += anzahl * rate;
        });
        aus.textContent = '';
        aus.appendChild(d.createTextNode(T("Grössenordnung: ")));
        aus.appendChild(el('span', { 'class': 'rechner__ergebnis' }, zahl(g * je)));
        aus.appendChild(d.createTextNode(' ' + (r.einheit || 'Copilot Credits') + T(" pro Monat.")));
        weg.textContent = T("Rechnung: ") + zahl(g) + T(" Gespräche mal ") + zahl(je) + T(" Credits je Gespräch") + (teile.length ? ' (' + teile.join(' plus ') + ')' : '') + '.';
        hinweis.hidden = !lz.checked;
      }
      fs.addEventListener('input', rechnen);
      lz.addEventListener('change', rechnen);
      rechnen();
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', los); else los();
})();
