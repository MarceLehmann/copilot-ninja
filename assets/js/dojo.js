/* PowerPlatformAcademy Dojo dojo.js: Fortschritt, Guertel, Technik des Tages, naechster Schritt, Zufall.
   Alles bleibt im Browser (localStorage cn-dojo-v1). Geschrieben wird nur nach einer Handlung. Kein Tracking. */
(function () {
  'use strict';
  var d = document, w = window, h = d.documentElement;
  var CN = w.CN || {};
  var ROOT = CN.root || (function () { var s = d.querySelector('script[src*="assets/js/dojo.js"]'); return s ? s.src.replace(/assets\/js\/dojo\.js.*$/, '') : ''; })();
  var KEY = 'cn-dojo-v1';
  var EN = /^en/i.test(h.getAttribute('lang') || '');
  var LP = EN ? 'en/' : '';
  var BASIS = ROOT + LP;
  function T(de, en) { return EN ? en : de; }
  var NAMEN = EN ? ['White belt', 'Yellow belt', 'Orange belt', 'Green belt', 'Blue belt', 'Brown belt', 'Black belt'] : ['Weisser Gürtel', 'Gelber Gürtel', 'Oranger Gürtel', 'Grüner Gürtel', 'Blauer Gürtel', 'Brauner Gürtel', 'Schwarzer Gürtel'];
  var FARBEN = ['weiss', 'gelb', 'orange', 'gruen', 'blau', 'braun', 'schwarz'];
  var UTM = function (s) { return 'utm_source=copilot.ninja&utm_medium=referral&utm_campaign=dojo&utm_content=' + s; };
  var KURS = function (s) { return 'https://www.powerplatformacademy.online/kurse/copilot-expert?' + UTM(s); };

  function alle(sel, wurzel) { return Array.prototype.slice.call((wurzel || d).querySelectorAll(sel)); }
  function el(tag, attr, text) {
    var e = d.createElement(tag);
    if (attr) Object.keys(attr).forEach(function (k) { if (attr[k] !== null && attr[k] !== undefined) e.setAttribute(k, attr[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function ansage(t) { if (CN.ansage) CN.ansage(t); }
  function bewegung() { return CN.bewegung ? CN.bewegung() : h.getAttribute('data-bewegung') !== 'aus'; }
  function iso(dt) { return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  function heuteIso() { return iso(new Date()); }
  function istIso(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
  function tage(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  var MONATE = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function datumCH(s) { var p = String(s).split('-'); if (p.length !== 3) return s; return EN ? MONATE[(+p[1]) - 1] + ' ' + (+p[2]) + ', ' + p[0] : p[2] + '.' + p[1] + '.' + p[0]; }
  function nr2(n) { return ('0' + n).slice(-2); }
  function fehlenNoch(n) { if (EN) return n < 1 ? '' : n === 1 ? ' One to go.' : ' ' + (['', '', 'Two', 'Three', 'Four', 'Five'][n] || n) + ' to go.'; return n < 1 ? '' : n === 1 ? ' Eine fehlt noch.' : ' ' + (['', '', 'Zwei', 'Drei', 'Vier', 'Fünf'][n] || n) + ' fehlen noch.'; }
  /* Tusch traegt den ... Guertel (deutsch im Akkusativ) */
  function traegt(n) { return EN ? 'Tusch wears the ' + NAMEN[n - 1] + '.' : 'Tusch trägt den ' + NAMEN[n - 1].replace(/er Gürtel$/, 'en Gürtel') + '.'; }

  /* Speicher */
  function normal(s) {
    s = s && typeof s === 'object' && s.v === 1 ? s : {};
    var g = {};
    if (s.geuebt && typeof s.geuebt === 'object') Object.keys(s.geuebt).forEach(function (k) { if (/^(t\d\d|g\d)$/.test(k) && istIso(s.geuebt[k])) g[k] = s.geuebt[k]; });
    var p = s.profil && typeof s.profil === 'object' ? s.profil : {};
    var st = s.selbsttest && typeof s.selbsttest === 'object' && s.selbsttest.startguertel >= 1 && s.selbsttest.startguertel <= 7 ? { startguertel: s.selbsttest.startguertel | 0, datum: istIso(s.selbsttest.datum) ? s.selbsttest.datum : '' } : null;
    return {
      v: 1, geuebt: g, guertel: s.guertel >= 1 && s.guertel <= 7 ? s.guertel | 0 : 1,
      profil: { Firmenname: String(p.Firmenname || ''), Funktion: String(p.Funktion || ''), Branche: String(p.Branche || '') },
      selbsttest: st, favoriten: Array.isArray(s.favoriten) ? s.favoriten.filter(function (x) { return typeof x === 'string'; }) : []
    };
  }
  function lesen() { var s = null; try { s = JSON.parse(w.localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; } return normal(s); }
  function schreiben(s) { try { w.localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }

  /* Daten: Techniken im Build (suche.json), Technik des Tages (tag.json), Guertel-Texte (dojo/guertel.json) */
  var cache = {};
  function json(pfad) {
    if (!cache[pfad]) cache[pfad] = fetch(ROOT + pfad).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function () { return null; });
    return cache[pfad];
  }
  function liste() { return json('assets/data/' + LP + 'suche.json').then(function (j) { return j && j.eintraege ? j.eintraege.filter(function (t) { return t.nr; }) : null; }); }

  /* Stand berechnen: k = lueckenlos vollstaendig geuebte Guertel von unten */
  function stand(s, L) {
    var pro = [], k = 0, frei = true, gesamt = 0, geuebt = 0, tageSet = {};
    Object.keys(s.geuebt).forEach(function (id) { tageSet[s.geuebt[id]] = 1; });
    for (var n = 1; n <= 7; n++) {
      var drin = (L || []).filter(function (t) { return t.guertel === n; });
      var fertig = drin.filter(function (t) { return s.geuebt[t.id]; }).length;
      var komplett = drin.length > 0 && fertig === drin.length;
      pro.push({ n: n, total: drin.length, fertig: fertig, komplett: komplett, liste: drin });
      if (frei && komplett) k++; else frei = false;
      gesamt += drin.length; geuebt += fertig;
    }
    var start = s.selbsttest ? s.selbsttest.startguertel : 1;
    var alleGeuebt = !!L && gesamt > 0 && geuebt === gesamt;
    return {
      pro: pro, k: k, alle: alleGeuebt, gesamt: gesamt, geuebt: geuebt, tage: Object.keys(tageSet).length,
      guertel: L ? Math.min(7, Math.max(k + 1, start)) : Math.max(s.guertel, start), liste: L
    };
  }

  /* Anzeige */
  function guertelName(st) { return NAMEN[st.guertel - 1] + (st.alle && st.guertel === 7 ? T(', alle geübt', ', all practiced') : ''); }
  function zeigen(s, st) {
    if (st.guertel > 1 || s.selbsttest || Object.keys(s.geuebt).length) h.setAttribute('data-guertel', st.guertel); else h.removeAttribute('data-guertel');
    alle('[data-guertelknoten]').forEach(function (k) {
      var t = k.querySelector('.knoten__text');
      if (t) t.textContent = guertelName(st);
      k.setAttribute('aria-label', T('Mein Dojo, ', 'My Dojo, ') + guertelName(st));
    });
    alle('.karte[data-technik], .karte-kompakt[data-technik], .dojo-liste li[data-technik]').forEach(function (k) {
      var id = k.getAttribute('data-technik'), dat = s.geuebt[id];
      k.classList.toggle('is-geuebt', !!dat);
      var stt = k.querySelector('[data-status]');
      if (stt) {
        if (k.classList.contains('karte')) { stt.hidden = !dat; stt.textContent = dat ? T('Geübt', 'Practiced') : ''; }
        else stt.textContent = dat ? T('geübt am ', 'practiced on ') + datumCH(dat) : T('offen', 'open');
      } else if (k.classList.contains('karte-kompakt')) {
        var m = k.querySelector('[data-dojo-mark]');
        if (dat && !m) k.appendChild(el('span', { 'class': 'klein', 'data-dojo-mark': '' }, T('geübt', 'practiced')));
        if (!dat && m) m.parentNode.removeChild(m);
      }
    });
    alle('[data-fortschritt]').forEach(function (f) {
      var p = st.pro[(f.getAttribute('data-fortschritt') | 0) - 1];
      if (!p || !st.liste) return;
      var text = p.total ? p.fertig + T(' von ', ' of ') + p.total + T(' geübt', ' practiced') : '';
      if (f.tagName === 'P') { f.textContent = text; f.hidden = !p.fertig; return; }
      var tx = f.querySelector('.fortschritt__text');
      if (tx && p.total) tx.textContent = EN ? p.fertig + ' of ' + p.total + (p.total === 1 ? ' technique practiced' : ' techniques practiced') + (p.komplett ? '. Belt complete.' : '.') : p.fertig + ' von ' + p.total + (p.total === 1 ? ' Technik geübt' : ' Techniken geübt') + (p.komplett ? '. Gürtel komplett.' : '.');
      var band = f.querySelector('.fortschritt__band');
      if (!band && p.total) { band = el('div', { 'class': 'fortschritt__band', 'data-guertel-nr': p.n, 'aria-hidden': 'true' }); f.insertBefore(band, f.firstChild); }
      if (band) {
        band.textContent = '';
        for (var i = 0; i < p.total; i++) band.appendChild(el('span', i < p.fertig ? { 'class': 'is-voll' } : null));
      }
    });
    alle('[data-dojo-stand]').forEach(function (p) {
      if (!st.liste || (!st.geuebt && !s.selbsttest)) return;
      var g = st.pro[st.guertel - 1];
      p.textContent = st.alle ? T('Alle ' + st.gesamt + ' Techniken geübt. Tusch trägt den schwarzen Gürtel.', 'All ' + st.gesamt + ' techniques practiced. Tusch wears the black belt.')
        : g.total ? g.fertig + T(' von ', ' of ') + g.total + T(' Techniken deines Gürtels geübt.', ' techniques of your belt practiced.') + fehlenNoch(g.total - g.fertig) + ' ' + traegt(st.guertel)
        : traegt(st.guertel);
    });
    alle('[data-geuebt-knopf]').forEach(function (b) { knopfZeigen(b, s); });
    naechster(s, st);
    var ev; try { ev = new CustomEvent('cn:stand', { detail: { s: s, st: st } }); } catch (e) { return; }
    d.dispatchEvent(ev);
  }

  /* Naechster Schritt: erste ungeuebte Technik im getragenen Guertel, sonst darueber, sonst darunter */
  function naechsteTechnik(s, st) {
    if (!st.liste) return null;
    var reihe = st.pro.slice(st.guertel - 1).concat(st.pro.slice(0, st.guertel - 1));
    for (var i = 0; i < reihe.length; i++) {
      var t = reihe[i].liste.filter(function (x) { return !s.geuebt[x.id]; }).sort(function (a, b) { return a.nr - b.nr; })[0];
      if (t) return t;
    }
    return null;
  }
  function technikUrl(t) { return BASIS + 'techniken/' + t.slug + '/'; }
  function naechster(s, st) {
    var boxen = alle('[data-naechster-schritt]');
    if (!boxen.length || !st.liste || (!st.geuebt && !s.selbsttest)) return;
    var t = naechsteTechnik(s, st), g = st.pro[st.guertel - 1];
    boxen.forEach(function (box) {
      var kopf = box.querySelector('h2, h3, h4');
      var ebene = kopf ? kopf.tagName.toLowerCase() : 'h3';
      box.textContent = '';
      box.appendChild(el(ebene, null, st.alle ? T('Alle Techniken geübt', 'All techniques practiced') : T('Dein nächster Schritt', 'Your next step')));
      if (st.alle) {
        box.appendChild(el('p', null, T('Du hast jede Technik im Dojo als geübt markiert. Wenn du Agents mit Begleitung im eigenen Betrieb einführen willst: Die Power Platform Academy führt den Live-Kurs «Copilot Ninja in 4 Wochen», Termine offen. Der Kurs hat einen eigenen Lehrplan.', 'You have marked every technique in the Dojo as practiced. If you want to introduce agents in your own business with guidance: the Power Platform Academy runs the live course “Copilot Ninja in 4 Wochen” (in German), dates open. The course has its own curriculum.')));
        var pa = el('p'); pa.appendChild(el('a', { href: KURS('naechster-schritt'), rel: 'noopener' }, T('Zur Kursseite', 'To the course page'))); box.appendChild(pa);
        return;
      }
      var pk = el('p'); pk.appendChild(el('span', { 'class': 'knoten', 'data-guertel-nr': st.guertel }, NAMEN[st.guertel - 1])); box.appendChild(pk);
      if (g.total) box.appendChild(el('p', { 'class': 'fortschritt__text' }, g.fertig + T(' von ', ' of ') + g.total + T(' Techniken deines Gürtels geübt.', ' techniques of your belt practiced.') + fehlenNoch(g.total - g.fertig)));
      if (t) {
        var p = el('p'), a = el('a', { 'class': 'knopf knopf--primaer', href: technikUrl(t) }, nr2(t.nr) + ' ' + t.titel);
        p.appendChild(a); box.appendChild(p);
        if (t.klartitel) box.appendChild(el('p', { 'class': 'klein' }, t.klartitel));
      }
    });
  }

  /* Geuebt markieren */
  function knopfZeigen(b, s) {
    var main = d.querySelector('main[data-technik]');
    var id = b.getAttribute('data-geuebt-knopf') || (main && main.getAttribute('data-technik'));
    if (!id) return;
    var dat = s.geuebt[id];
    b.hidden = false;
    b.textContent = dat ? T('Geübt am ', 'Practiced on ') + datumCH(dat) : T('Als geübt markieren', 'Mark as practiced');
    b.classList.toggle('is-ok', !!dat);
    if (dat) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
    var weg = b.parentNode.querySelector('[data-geuebt-weg]');
    if (dat && !weg) {
      weg = el('button', { type: 'button', 'class': 'knopf knopf--leise knopf--klein', 'data-geuebt-weg': id }, T('Markierung entfernen', 'Remove mark'));
      b.parentNode.appendChild(d.createTextNode(' '));
      b.parentNode.appendChild(weg);
      weg.addEventListener('click', function () { markieren(id, false, b); b.focus(); });
    }
    if (weg) weg.hidden = !dat;
  }
  function markieren(id, an, quelle) {
    return liste().then(function (L) {
      var s = lesen(), vorher = stand(s, L);
      if (an) s.geuebt[id] = s.geuebt[id] || heuteIso(); else delete s.geuebt[id];
      var nachher = stand(s, L);
      s.guertel = nachher.guertel;
      var ok = schreiben(s);
      zeigen(s, nachher);
      d.dispatchEvent(new CustomEvent('cn:geuebt', { detail: { id: id, geuebt: !!an } }));
      if (!ok) { ansage(T('Dein Browser speichert nichts. Die Markierung gilt nur, bis du die Seite verlässt.', 'Your browser does not store anything. The mark only lasts until you leave the page.')); return; }
      var t = (L || []).filter(function (x) { return x.id === id; })[0];
      var n = t ? t.guertel : 0;
      if (an && n && !vorher.pro[n - 1].komplett && nachher.pro[n - 1].komplett) aufstieg(n, quelle);
      else ansage(an ? T('Als geübt markiert.', 'Marked as practiced.') : T('Markierung entfernt.', 'Mark removed.'));
    });
  }
  /* Guertel-Aufstieg, Kalender und Technik des Tages (Prompt holen) stehen in dojo-extra.js, geladen bei Bedarf */
  var extraP;
  function extra() {
    if (w.CNDojo.aufstieg) return Promise.resolve(w.CNDojo);
    extraP = extraP || new Promise(function (ok) {
      var sk = el('script', { src: ROOT + 'assets/js/dojo-extra.js' });
      sk.onload = sk.onerror = function () { ok(w.CNDojo); };
      d.head.appendChild(sk);
    });
    return extraP;
  }
  function aufstieg(n, quelle) {
    d.dispatchEvent(new CustomEvent('cn:guertel', { detail: { guertel: n, erreicht: true } }));
    extra().then(function (D) { if (D.aufstieg) D.aufstieg(n, quelle); else ansage('Tusch! ' + NAMEN[n - 1] + '.'); });
  }

  /* Technik des Tages: gleiche Formel wie der Build, nach lokalem Datum */
  function heute() {
    var boxen = alle('[data-heute]');
    if (!boxen.length) return;
    json('assets/data/' + LP + 'tag.json').then(function (tag) {
      if (!tag || !tag.reihenfolge || !tag.reihenfolge.length) return;
      var f = tag.reihenfolge, n = tage(istIso(tag.start) ? tag.start : heuteIso(), heuteIso());
      var id = f[((n % f.length) + f.length) % f.length], t = tag.eintraege && tag.eintraege[id];
      if (!t) return;
      boxen.forEach(function (box) {
        var alt = box.querySelector('[data-technik]');
        if (alt && alt.getAttribute('data-technik') === id) return;
        extra().then(function (D) { if (D.heuteBauen) D.heuteBauen(box, id, t, alt); });
      });
    });
  }
  /* Startseite: kompakte Karte, Rotation nur ueber Techniken ohne Zusatzlizenz bis zum orangen Guertel (wie FUER_START im Build) */
  function heuteKompakt() {
    var karten = alle('[data-heute-kompakt]');
    if (!karten.length) return;
    json('assets/data/' + LP + 'tag.json').then(function (tag) {
      if (!tag || !tag.reihenfolge || !tag.eintraege) return;
      var f = tag.reihenfolge.filter(function (id) { var t = tag.eintraege[id]; return t && t.zugang === 'ohne-zl' && t.guertel <= 3; });
      if (!f.length) return;
      var n = tage(istIso(tag.start) ? tag.start : heuteIso(), heuteIso());
      var id = f[((n % f.length) + f.length) % f.length], t = tag.eintraege[id];
      karten.forEach(function (k) {
        if (k.getAttribute('data-technik') === id) return;
        var url = BASIS + 'techniken/' + t.slug + '/';
        k.setAttribute('data-technik', id); k.setAttribute('data-guertel-nr', t.guertel);
        var nr = k.querySelector('.tdk__nr'), a = k.querySelector('.tdk__titel a'), kl = k.querySelector('.tdk__titel small'), pr = k.querySelector('.tdk__problem'), kn = k.querySelector('.knoten'), kp = k.querySelector('.tdk__knopf');
        if (nr) nr.textContent = nr2(t.nr);
        if (a) { a.textContent = t.titel; a.href = url; }
        if (kl) kl.textContent = t.klartitel;
        if (pr) pr.textContent = t.problem || t.nutzen || '';
        if (kn) { kn.textContent = NAMEN[t.guertel - 1]; kn.setAttribute('data-guertel-nr', t.guertel); }
        if (kp) kp.href = url;
      });
    });
  }
  /* Zufallstechnik */
  function zufall() {
    alle('[data-zufall]').forEach(function (k) {
      k.hidden = false;
      k.addEventListener('click', function () {
        liste().then(function (L) {
          if (!L) { w.location.href = BASIS + 'techniken/'; return; }
          var s = lesen(), offen = L.filter(function (t) { return !s.geuebt[t.id]; });
          w.location.href = offen.length ? technikUrl(offen[Math.floor(Math.random() * offen.length)]) : BASIS + 'dojo/#geschafft';
        });
      });
    });
  }

  /* Vier-Wochen-Pfad als Kalenderdatei, Start am naechsten Montag */
  function vierWochen() {
    /* Der Knopf steht schon im HTML (data-nur-js), damit beim Laden nichts springt */
    alle('[data-wochen-ics]').forEach(function (b) {
      if (b.getAttribute('data-cn') === '1') return;
      b.setAttribute('data-cn', '1');
      b.addEventListener('click', function () {
        extra().then(function (D) { if (D.kalender) D.kalender(); });
      });
    });
  }

  /* Nach dem Kopieren auf einer Technik-Seite: naechster Schritt «Als geuebt markieren» direkt unter dem Text */
  function nachKopieren(e) {
    var main = d.querySelector('main[data-technik]');
    if (!main || !e.detail || e.detail.weitergeben) return;
    var id = main.getAttribute('data-technik');
    if (e.detail.id !== id || lesen().geuebt[id] || d.querySelector('[data-geuebt-hinweis]')) return;
    var rolle = d.querySelector('.tk-inhalt .rolle');
    if (!rolle) return;
    var p = el('p', { 'class': 'geuebt-hinweis', 'data-geuebt-hinweis': '' }, T('Ausprobiert? ', 'Tried it? '));
    var b = el('button', { type: 'button', 'class': 'knopf knopf--klein', 'data-geuebt-knopf': id }, T('Als geübt markieren', 'Mark as practiced'));
    p.appendChild(b);
    rolle.parentNode.insertBefore(p, rolle.nextSibling);
    b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') !== 'true') markieren(id, true, b); });
  }

  /* Start */
  function los() {
    d.addEventListener('cn:kopiert', nachKopieren);
    var s = lesen();
    zeigen(s, stand(s, null));
    alle('[data-geuebt-knopf]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-disabled') === 'true') { ansage(T('Schon als geübt markiert.', 'Already marked as practiced.')); return; }
        var main = d.querySelector('main[data-technik]');
        var id = b.getAttribute('data-geuebt-knopf') || (main && main.getAttribute('data-technik'));
        if (id) markieren(id, true, b);
      });
    });
    var braucht = d.querySelector('[data-naechster-schritt], [data-fortschritt], [data-dojo-stand], .dojo-liste') || s.selbsttest || Object.keys(s.geuebt).length;
    if (braucht) liste().then(function (L) { if (!L) return; var s2 = lesen(); zeigen(s2, stand(s2, L)); });
    heute(); heuteKompakt(); zufall(); vierWochen();
    w.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) liste().then(function (L) { var s3 = lesen(); zeigen(s3, stand(s3, L)); }); });
  }

  w.CNDojo = {
    root: ROOT, basis: BASIS, lp: LP, en: EN, T: T, KEY: KEY, NAMEN: NAMEN, FARBEN: FARBEN, KURS: KURS, UTM: UTM,
    lesen: lesen, schreiben: schreiben, normal: normal, liste: liste, json: json, stand: stand, zeigen: zeigen,
    markieren: markieren, heuteIso: heuteIso, isoDatum: iso, datumCH: datumCH, tage: tage, nr2: nr2,
    el: el, alle: alle, ansage: ansage, bewegung: bewegung, technikUrl: technikUrl,
    aktualisieren: function () { return liste().then(function (L) { var s = lesen(), st = stand(s, L); zeigen(s, st); return { s: s, st: st }; }); }
  };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', los); else los();
})();
