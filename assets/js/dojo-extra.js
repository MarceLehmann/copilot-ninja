/* PowerPlatformAcademy Dojo dojo-extra.js: von dojo.js erst bei Bedarf geladen. Guertel-Aufstieg mit Meldung, Kalenderdatei
   Vier-Wochen-Pfad, Technik des Tages mit Prompt von der Technik-Seite. Braucht window.CNDojo. Nichts wird gesendet. */
(function () {
  'use strict';
  var d = document, w = window, h = d.documentElement, D = w.CNDojo;
  if (!D || D.aufstieg) return;
  var el = D.el, alle = D.alle, NAMEN = D.NAMEN, ROOT = D.root, BASIS = D.basis || ROOT, EN = !!D.en;
  var T = D.T || function (de) { return de; };
  var NEWS = function (s) { return 'https://kmupower.com/newsletter?' + D.UTM(s); };
  var ANKER = ['weisser-guertel', 'gelber-guertel', 'oranger-guertel', 'gruener-guertel', 'blauer-guertel', 'brauner-guertel', 'schwarzer-guertel'];
  function guertelInfo() { return D.json((D.lp || '') + 'dojo/guertel.json').then(function (j) { return (j && j.guertel) || []; }); }
  function aufstieg(n, quelle) {
    if (D.bewegung()) {
      alle('[data-tusch]').forEach(function (t) { t.classList.add('is-aufstieg'); setTimeout(function () { t.classList.remove('is-aufstieg'); }, 600); });
      alle('[data-guertelknoten], .knoten[data-guertel-nr="' + n + '"]').forEach(function (k) { k.classList.remove('is-erreicht'); void k.offsetWidth; k.classList.add('is-erreicht'); });
    }
    guertelInfo().then(function (info) {
      var g = info.filter(function (x) { return x.nr === n; })[0] || {};
      var satz = g.erreicht_satz || (g.kannst_du ? T('Was du jetzt kannst: ', 'What you can do now: ') + g.kannst_du : '');
      var kopf = 'Tusch! ' + NAMEN[n - 1] + '.';
      var box = d.querySelector('[data-aufstieg-meldung]');
      if (!box) {
        box = el('div', { 'class': 'meldung', 'data-aufstieg-meldung': '' });
        var ort = quelle && quelle.closest ? quelle.closest('p, .dojo-liste__guertel, section') : null;
        if (ort && ort.parentNode) ort.parentNode.insertBefore(box, ort.nextSibling); else (d.querySelector('main') || d.body).appendChild(box);
      }
      box.textContent = '';
      box.hidden = false;
      var p1 = el('p'); p1.appendChild(el('strong', null, kopf)); if (satz) p1.appendChild(d.createTextNode(' ' + satz)); box.appendChild(p1);
      var p2 = el('p', null, T('Jeden Montag ein Impuls zur Power Platform und Automatisierung: ', 'An idea about the Power Platform and automation every Monday: '));
      p2.appendChild(el('a', { href: NEWS('guertel-aufstieg'), rel: 'noopener' }, T('Newsletter KMUpower Impuls', 'KMUpower Impuls newsletter (in German)')));
      p2.appendChild(d.createTextNode('.'));
      box.appendChild(p2);
      if (h.getAttribute('data-seite') !== 'dojo') {
        var p3 = el('p'); p3.appendChild(el('a', { href: BASIS + 'dojo/#guertelkarte' }, T('Gürtelkarte in Mein Dojo holen', 'Get your belt card in My Dojo'))); box.appendChild(p3);
      }
      D.ansage(kopf + (satz ? ' ' + satz : ''));
    });
  }
  function datei(name, typ, inhalt) {
    var url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
    var a = el('a', { href: url, download: name });
    d.body.appendChild(a); a.click(); d.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  var WOCHEN = [[1, 2], [3], [4, 5], [6, 7]];
  function wochenIcs(L) {
    var mo = new Date(); mo.setHours(12, 0, 0, 0);
    do { mo.setDate(mo.getDate() + 1); } while (mo.getDay() !== 1);
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KMUpower//Dojo Vier Wochen//' + (EN ? 'EN' : 'DE'), 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    WOCHEN.forEach(function (gs, i) {
      var drin = (L || []).filter(function (t) { return gs.indexOf(t.guertel) > -1; });
      if (L && !drin.length) return;
      var tag = new Date(mo); tag.setDate(mo.getDate() + 7 * i);
      var name = EN ? gs.map(function (g) { return NAMEN[g - 1].replace(/ belt$/, ''); }).join(' and ') + ' belt' : gs.map(function (g) { return NAMEN[g - 1].replace(/ Gürtel$/, ''); }).join(' und ') + ' Gürtel';
      var link = BASIS + 'techniken/#' + ANKER[gs[0] - 1];
      z.push('BEGIN:VEVENT', 'UID:dojo-woche-' + (i + 1) + '-' + D.isoDatum(mo).replace(/-/g, '') + '@kmupower.com', 'DTSTAMP:' + stamp,
        'DTSTART:' + D.isoDatum(tag).replace(/-/g, '') + 'T083000', 'DURATION:PT15M',
        'SUMMARY:' + T('Dojo Woche ', 'Dojo week ') + (i + 1) + ': ' + name,
        'DESCRIPTION:' + (drin.length ? drin.length + T(' Techniken: ', ' techniques: ') + drin.map(function (t) { return t.nr + ' ' + t.titel; }).join('\\, ') + '. ' : '') + T('Übe eine Technik pro Tag. ', 'Practice one technique per day. ') + link,
        'URL:' + link, 'TRANSP:TRANSPARENT', 'END:VEVENT');
    });
    z.push('END:VCALENDAR');
    return z.map(falten).join('\r\n') + '\r\n';
  }
  function falten(zeile) {
    var aus = [], rest = zeile, max = 36; /* Zeichen, nicht Bytes: 36 Zeichen bleiben auch mit Umlauten unter 75 Bytes */
    while (rest.length > max) { aus.push(rest.slice(0, max)); rest = rest.slice(max); }
    aus.push(rest);
    return aus.join('\r\n ');
  }
  function kalender() {
    D.liste().then(function (L) {
      datei(EN ? 'dojo-four-weeks.ics' : 'dojo-vier-wochen.ics', 'text/calendar;charset=utf-8', wochenIcs(L));
      D.ansage(T('Kalenderdatei mit den Montagsterminen erstellt.', 'Calendar file with the Monday events created.'));
    });
  }
  function heuteBauen(box, id, t, alt) {
    var titelAlt = alt && alt.querySelector('.heute__titel');
    var ebene = titelAlt ? titelAlt.tagName.toLowerCase() : 'h3';
    var url = BASIS + 'techniken/' + t.slug + '/';
    var art = el('article', { 'class': 'karte--gross rolle-gross', 'data-technik': id, 'data-guertel-nr': t.guertel, 'data-schmiede': '' });
    var kopf = el('div', { 'class': 'heute__kopf' });
    kopf.appendChild(el('span', { 'class': 'heute__nr', 'aria-hidden': 'true' }, D.nr2(t.nr)));
    var rechts = el('div'), ti = el(ebene, { 'class': 'heute__titel' }, t.titel);
    ti.appendChild(el('small', null, T('Nr. ', 'No. ') + t.nr + ': ' + t.klartitel));
    rechts.appendChild(ti);
    var meta = el('ul', { 'class': 'metazeile' });
    var li1 = el('li'); li1.appendChild(el('span', { 'class': 'knoten', 'data-guertel-nr': t.guertel }, NAMEN[t.guertel - 1])); meta.appendChild(li1);
    var liZ = el('li'); meta.appendChild(liZ);
    var li3 = el('li'); li3.appendChild(el('span', null, T('Ausprobieren: ca. ' + t.dauer_min + ' Min.', 'Try it: approx. ' + t.dauer_min + ' min'))); meta.appendChild(li3);
    rechts.appendChild(meta); kopf.appendChild(rechts); art.appendChild(kopf);
    var problem = el('p', { 'class': 'abschnitt__problem' }, t.nutzen || '');
    art.appendChild(problem);
    var platz = el('div');
    art.appendChild(platz);
    var pl = el('p'); pl.appendChild(el('a', { 'class': 'knopf knopf--leise', href: url }, T('Ganze Technik mit Anleitung, Grenzen und Quelle', 'Full technique with guide, limits and source'))); art.appendChild(pl);
    if (alt) box.replaceChild(art, alt); else box.appendChild(art);
    /* Prompt und Felder von der Technik-Seite holen (gleiche Herkunft) */
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html.replace(/<head>/i, '<head><base href="' + url + '">'), 'text/html');
      var z = doc.querySelector('.metazeile .zugang');
      if (z) { var zk = d.importNode(z, true); zk.setAttribute('href', z.href); liZ.appendChild(zk); }
      var pr = doc.querySelector('.abschnitt__problem');
      if (pr) problem.textContent = pr.textContent;
      var teile = [doc.querySelector('[data-schmiede] .schmiede'), doc.querySelector('[data-schmiede] .rolle')].filter(Boolean);
      var htmlTeile = teile.map(function (n) { return n.outerHTML; }).join('\n')
        .replace(/technik-f(\d)/g, 'heute-f$1').replace(/"prompt"/g, '"heute-text"').replace(/<h3>(Für dich anpassen|Make it yours)<\/h3>/, function (m, x) { return ebene === 'h2' ? '<h3>' + x + '</h3>' : '<h4>' + x + '</h4>'; });
      if (htmlTeile) {
        var tmp = new DOMParser().parseFromString('<div>' + htmlTeile + '</div>', 'text/html').body.firstChild;
        while (tmp.firstChild) platz.appendChild(d.adoptNode(tmp.firstChild));
      }
      if (w.CN && w.CN.binden) w.CN.binden(box);
    }).catch(function () { /* ohne Prompt: Link zur Technik bleibt */ });
  }
  D.aufstieg = aufstieg; D.kalender = kalender; D.heuteBauen = heuteBauen;
})();
