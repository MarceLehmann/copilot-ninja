/* PowerPlatformAcademy Dojo core.js. Kein Tracking, keine fremden Anfragen. Schnittstelle fuer dojo.js und gratis.js: window.CN */
(function () {
  'use strict';
  var d = document, w = window, h = d.documentElement;
  var skript = d.currentScript;
  var ROOT = skript && skript.src ? skript.src.replace(/assets\/js\/core\.js.*$/, '') : '';
  /* Sprache der Seite: Deutsch unter /, Englisch unter /en/ (gleiche Struktur). Assets liegen gemeinsam unter ROOT. */
  var EN = /^en/i.test(h.getAttribute('lang') || '');
  var BASIS = ROOT + (EN ? 'en/' : '');
  function T(de, en) { return EN ? en : de; }
  var MQ_RUHE = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function alle(sel, wurzel) { return Array.prototype.slice.call((wurzel || d).querySelectorAll(sel)); }
  function speicher(k, v) {
    try {
      if (v === undefined) return w.localStorage.getItem(k);
      if (v === null) w.localStorage.removeItem(k); else w.localStorage.setItem(k, v);
    } catch (e) { return null; }
    return v;
  }
  function dojo() { try { return JSON.parse(speicher('cn-dojo-v1') || 'null') || {}; } catch (e) { return {}; } }
  function bewegung() { return h.getAttribute('data-bewegung') !== 'aus' && !MQ_RUHE.matches; }
  function senden(name, detail) { d.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  var live;
  function ansage(text) {
    live = live || d.getElementById('kopier-status');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 40);
  }
  function attrWert(s) { return String(s).replace(/["\\]/g, '\\$&'); }
  function falle(e, box) {
    var f = alle('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', box)
      .filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  /* Theme */
  function theme() {
    var knoepfe = alle('[data-theme-toggle]');
    function aktuell() {
      var t = h.getAttribute('data-theme');
      if (t === 'light' || t === 'dark') return t;
      return w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function sync() { knoepfe.forEach(function (k) { k.setAttribute('aria-pressed', String(aktuell() === 'dark')); k.hidden = false; }); }
    knoepfe.forEach(function (k) {
      k.addEventListener('click', function () {
        var n = aktuell() === 'dark' ? 'light' : 'dark';
        h.setAttribute('data-theme', n);
        speicher('cn-theme', n);
        sync();
      });
    });
    sync();
  }

  /* Bewegung aus */
  function bewegungSchalter() {
    alle('[data-bewegung-toggle]').forEach(function (k) {
      function sync() { k.setAttribute('aria-pressed', String(h.getAttribute('data-bewegung') === 'aus')); }
      k.hidden = false;
      sync();
      k.addEventListener('click', function () {
        if (h.getAttribute('data-bewegung') !== 'aus') {
          h.setAttribute('data-bewegung', 'aus'); h.classList.remove('anim'); speicher('cn-bewegung', 'aus');
        } else {
          h.removeAttribute('data-bewegung'); speicher('cn-bewegung', null);
          if (bewegung()) h.classList.add('anim');
        }
        sync();
        ansage(h.getAttribute('data-bewegung') === 'aus' ? T('Bewegung ist aus.', 'Motion is off.') : T('Bewegung ist an.', 'Motion is on.'));
      });
    });
  }

  /* Navigation: aktueller Punkt, Mobil-Menue, Kopfzeile */
  var NAV = { wand: 'techniken', technik: 'techniken', heute: 'techniken', gratis: 'gratis', dojo: 'dojo', test: 'dojo', guertel: 'dojo', ueber: 'ueber' };
  function navigation() {
    var seite = h.getAttribute('data-seite'), ziel = NAV[seite];
    if (ziel) alle('[data-nav="' + ziel + '"]').forEach(function (a) {
      if (!a.hasAttribute('aria-current')) a.setAttribute('aria-current', /^(wand|gratis|dojo|ueber)$/.test(seite) ? 'page' : 'true');
    });
    var knopf = d.querySelector('[data-menue-knopf]');
    var menue = knopf && d.getElementById(knopf.getAttribute('aria-controls'));
    if (knopf && menue) {
      var zu = menue.querySelector('[data-menue-zu]');
      var taste = function (e) {
        if (e.key === 'Escape') { schliessen(); return; }
        if (e.key === 'Tab') falle(e, menue);
      };
      var oeffnen = function () {
        menue.hidden = false;
        knopf.setAttribute('aria-expanded', 'true');
        d.body.style.overflow = 'hidden';
        (menue.querySelector('a, button') || menue).focus();
        d.addEventListener('keydown', taste);
      };
      var schliessen = function (ohneFokus) {
        menue.hidden = true;
        knopf.setAttribute('aria-expanded', 'false');
        d.body.style.overflow = '';
        d.removeEventListener('keydown', taste);
        if (ohneFokus !== true) knopf.focus();
      };
      knopf.addEventListener('click', oeffnen);
      if (zu) zu.addEventListener('click', schliessen);
      menue.addEventListener('click', function (e) { if (e.target.closest('a')) schliessen(true); });
    }
    var kopf = d.querySelector('.kopf'), letzt = w.scrollY, plan = false;
    if (kopf) w.addEventListener('scroll', function () {
      if (plan) return;
      plan = true;
      w.requestAnimationFrame(function () {
        var y = w.scrollY;
        if (Math.abs(y - letzt) > 4) { kopf.classList.toggle('kopf--eingeklappt', y > 120 && y > letzt); letzt = y; }
        plan = false;
      });
    }, { passive: true });
  }

  /* Suche (Ninja-Sprung), Strg+K oder Cmd+K */
  function suche() {
    var dlg = d.getElementById('suche');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var feld = dlg.querySelector('input'), liste = dlg.querySelector('[role="listbox"]'), leer = dlg.querySelector('.suche__leer');
    var daten = null, aktiv = -1, zuletzt = null;
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function zeigen(q) {
      liste.textContent = ''; aktiv = -1; feld.removeAttribute('aria-activedescendant');
      if (!daten) return;
      var n = norm(q).trim();
      /* Jedes Wort muss vorkommen, in Titel, Klartitel, Moment oder Suchbegriffen (Excel, Offerte, Protokoll ...) */
      var woerter = n ? n.split(/\s+/) : [];
      var treffer = daten.filter(function (t) {
        var heu = norm([t.nr, t.titel, t.klartitel, t.moment, t.s].join(' '));
        return woerter.every(function (x) { return heu.indexOf(x) > -1; });
      }).slice(0, 12);
      treffer.forEach(function (t, i) {
        var li = d.createElement('li'), a = d.createElement('a'), nr = d.createElement('span'), ti = d.createElement('span'), kl = d.createElement('small');
        li.id = 'suche-t' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
        a.href = BASIS + 'techniken/' + t.slug + '/'; a.tabIndex = -1;
        nr.className = 'karte-kompakt__nr'; nr.textContent = t.nr ? ('0' + t.nr).slice(-2) : String(t.id).toUpperCase();
        ti.textContent = t.titel; kl.textContent = t.klartitel;
        a.appendChild(nr); a.appendChild(ti); a.appendChild(kl); li.appendChild(a); liste.appendChild(li);
      });
      leer.hidden = treffer.length > 0;
      feld.setAttribute('aria-expanded', String(treffer.length > 0));
    }
    function auf() {
      zuletzt = d.activeElement;
      dlg.showModal();
      feld.value = '';
      zeigen('');
      feld.focus();
      if (!daten) {
        fetch(ROOT + 'assets/data/' + (EN ? 'en/' : '') + 'suche.json').then(function (r) { return r.json(); })
          .then(function (j) { daten = j.eintraege || []; zeigen(feld.value); })
          .catch(function () { daten = []; zeigen(feld.value); });
      }
    }
    alle('[data-suche-auf]').forEach(function (k) { k.hidden = false; k.addEventListener('click', auf); });
    d.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (dlg.open) dlg.close(); else auf();
      }
    });
    dlg.addEventListener('close', function () { if (zuletzt && zuletzt.focus) zuletzt.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    alle('[data-suche-zu]', dlg).forEach(function (k) { k.addEventListener('click', function () { dlg.close(); }); });
    feld.addEventListener('input', function () { zeigen(feld.value); });
    feld.addEventListener('keydown', function (e) {
      var opt = alle('[role="option"]', liste);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!opt.length) return;
        aktiv = (aktiv + (e.key === 'ArrowDown' ? 1 : -1) + opt.length) % opt.length;
        opt.forEach(function (o, i) { o.setAttribute('aria-selected', String(i === aktiv)); });
        feld.setAttribute('aria-activedescendant', opt[aktiv].id);
        opt[aktiv].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        var ziel = opt[aktiv > -1 ? aktiv : 0];
        if (ziel) { e.preventDefault(); w.location.href = ziel.querySelector('a').href; }
      }
    });
  }

  /* Kopieren und Weitergeben */
  function notfall(text) {
    var t = d.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.className = 'sr-only';
    d.body.appendChild(t); t.select();
    var ok = false;
    try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
    d.body.removeChild(t);
    return ok;
  }
  function kopierText(text) {
    if (navigator.clipboard && w.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { if (!notfall(text)) throw new Error('kopieren'); });
    }
    return notfall(text) ? Promise.resolve() : Promise.reject(new Error('kopieren'));
  }
  function kopieren(wurzel) {
    alle('[data-kopieren], [data-weitergeben]', wurzel).forEach(function (k) {
      if (k.getAttribute('data-cn') === '1') return;
      k.setAttribute('data-cn', '1');
      k.hidden = false;
      k.addEventListener('click', function () {
        var weiter = k.hasAttribute('data-weitergeben');
        var ziel = d.getElementById(k.getAttribute(weiter ? 'data-weitergeben' : 'data-kopieren'));
        if (!ziel) return;
        var text = ziel.textContent.replace(/^\s+|\s+$/g, '');
        if (weiter && k.getAttribute('data-herkunft')) text += '\n\n' + k.getAttribute('data-herkunft');
        var box = k.closest('[data-rolle]') || k.parentNode;
        var status = box.querySelector('.rolle__status');
        var alt = k.getAttribute('data-label') || k.textContent;
        k.setAttribute('data-label', alt);
        kopierText(text).then(function () {
          var satz = weiter ? T('Mit Herkunft kopiert. Passt in einen Teams-Chat.', 'Copied with its origin. Fits into a Teams chat.') : (k.getAttribute('data-erfolg') || T('Kopiert. Jetzt in Microsoft Copilot Chat einfügen.', 'Copied. Now paste it into Microsoft Copilot Chat.'));
          k.textContent = T('Kopiert', 'Copied');
          k.classList.add('is-ok');
          if (status) status.textContent = satz;
          ansage(satz);
          var tr = k.closest('[data-technik]');
          senden('cn:kopiert', { id: tr ? tr.getAttribute('data-technik') : ziel.id, weitergeben: weiter });
          clearTimeout(k._cnT);
          k._cnT = setTimeout(function () { k.textContent = alt; k.classList.remove('is-ok'); }, 2000);
        }, function () {
          var f = T('Kopieren hat nicht funktioniert. Markiere den Text und kopiere ihn mit Strg+C.', 'Copying did not work. Select the text and copy it with Ctrl+C.');
          if (status) status.textContent = f;
          ansage(f);
        });
      });
    });
  }

  /* Profilfelder: gespeichert unter den deutschen Namen, die englischen Platzhalter lesen dieselben Werte */
  var PROFIL_EN = { 'Company name': 'Firmenname', 'Role': 'Funktion', 'Industry': 'Branche' };

  /* Schmiede: Platzhalter werden zu Feldern, Profilwerte vorausgefuellt. Speichert nichts. */
  function schmiede(wurzel) {
    var profil = dojo().profil || {};
    alle('[data-schmiede]', wurzel).forEach(function (box) {
      if (box.getAttribute('data-cn') === '1') return;
      box.setAttribute('data-cn', '1');
      alle('.schmiede', box).forEach(function (s) { s.hidden = false; });
      alle('[data-ph-feld]', box).forEach(function (f) {
        var name = f.getAttribute('data-ph-feld');
        function setzen() {
          var v = f.value.trim();
          alle('.ph[data-ph="' + attrWert(name) + '"]', box).forEach(function (sp) {
            if (!sp.hasAttribute('data-leer')) sp.setAttribute('data-leer', sp.textContent);
            sp.textContent = v || sp.getAttribute('data-leer');
            sp.classList.toggle('is-gefuellt', !!v);
          });
        }
        var pk = PROFIL_EN[name] || name;
        if (!f.value && typeof profil[pk] === 'string' && profil[pk]) f.value = profil[pk];
        f.addEventListener('input', setzen);
        if (f.value) setzen();
      });
    });
  }

  /* Der Schnitt */
  function schnitt() {
    alle('[data-schnitt]').forEach(function (k) {
      if (!bewegung()) return;
      var zeile = k.classList.contains('schnitt--zeile');
      var um = k.querySelector('.schnitt__umschalter');
      function druecken(welche) { if (um) alle('button', um).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-zeige') === welche)); }); }
      k.classList.add('is-js');
      if (!zeile) {
        var v = k.querySelector('.schnitt__vorher');
        if (v) ['a', 'b'].forEach(function (x) {
          var c = v.cloneNode(true);
          c.className = 'schnitt__vorher schnitt__haelfte schnitt__haelfte--' + x;
          c.setAttribute('aria-hidden', 'true');
          c.removeAttribute('id');
          v.parentNode.appendChild(c);
        });
        druecken('vorher');
      }
      function lauf() {
        if (k.classList.contains('is-geschnitten')) return;
        k.classList.add('is-geschnitten');
        druecken('nachher');
      }
      if (um) alle('button', um).forEach(function (b) {
        b.addEventListener('click', function () {
          var vor = b.getAttribute('data-zeige') === 'vorher';
          k.classList.add('is-geschnitten');
          k.classList.toggle('zeigt-vorher', vor);
          druecken(vor ? 'vorher' : 'nachher');
        });
      });
      if ('IntersectionObserver' in w) {
        var io = new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { io.disconnect(); setTimeout(lauf, zeile ? 250 : 900); }
        }, { threshold: 0.4 });
        io.observe(k);
      } else lauf();
    });
  }

  /* Filter der Technik-Wand, mit FLIP */
  function filter() {
    var box = d.querySelector('[data-filter]');
    if (!box) return;
    box.hidden = false;
    var wand = d.querySelector('[data-filter-ziel]');
    var karten = alle('.karte', wand), zaehler = box.querySelector('[data-filter-zaehler]'), leer = d.querySelector('[data-filter-leer]');
    function anwenden(animiert) {
      var aktiv = {};
      alle('.chip[aria-pressed="true"]', box).forEach(function (c) { (aktiv[c.getAttribute('data-f')] = aktiv[c.getAttribute('data-f')] || []).push(c.getAttribute('data-v')); });
      var geuebt = dojo().geuebt || {};
      var vorher = animiert && bewegung() ? karten.map(function (k) { return k.getBoundingClientRect(); }) : null;
      var n = 0;
      karten.forEach(function (k) {
        var ok = Object.keys(aktiv).every(function (f) {
          if (f === 'stand') return aktiv[f].indexOf(geuebt[k.getAttribute('data-technik')] ? 'geuebt' : 'offen') > -1;
          var werte = (k.getAttribute('data-' + f) || '').split(' ');
          return aktiv[f].some(function (v) { return werte.indexOf(v) > -1; });
        });
        k.hidden = !ok;
        if (ok) n++;
      });
      alle('.guertel-abschnitt', wand).forEach(function (s) {
        var mit = alle('.karte', s);
        if (mit.length) s.hidden = !mit.some(function (k) { return !k.hidden; });
      });
      alle('.schwelle', wand).forEach(function (s) { s.hidden = Object.keys(aktiv).length > 0; });
      if (zaehler) zaehler.textContent = T('zeigt ' + n + ' von ' + karten.length, 'showing ' + n + ' of ' + karten.length);
      if (leer) leer.hidden = n > 0;
      if (vorher) karten.forEach(function (k, i) {
        var a = vorher[i];
        if (k.hidden || !a.width) return;
        var b = k.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
        if (!dx && !dy) return;
        k.style.transition = 'none';
        k.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        w.requestAnimationFrame(function () {
          w.requestAnimationFrame(function () {
            k.style.transition = 'transform 250ms cubic-bezier(.22,1,.36,1)';
            k.style.transform = '';
            setTimeout(function () { k.style.transition = ''; }, 300);
          });
        });
      });
    }
    alle('.chip[data-f]', box).forEach(function (c) {
      c.addEventListener('click', function () { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); anwenden(true); });
    });
    alle('[data-filter-reset]').forEach(function (r) {
      r.addEventListener('click', function () {
        alle('.chip[aria-pressed="true"]', box).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        anwenden(true);
        var erste = box.querySelector('.chip');
        if (erste && r.closest('[data-filter-leer]')) erste.focus();
      });
    });
    try {
      new URLSearchParams(w.location.search).forEach(function (v, f) {
        var c = box.querySelector('.chip[data-f="' + attrWert(f) + '"][data-v="' + attrWert(v) + '"]');
        if (c) c.setAttribute('aria-pressed', 'true');
      });
    } catch (e) { /* kein Startfilter */ }
    anwenden(false);
    d.addEventListener('cn:geuebt', function () { anwenden(false); });
  }

  /* Tusch: Blinzeln, Verbeugung nach dem Kopieren */
  function tusch() {
    d.addEventListener('cn:kopiert', function () {
      if (!bewegung()) return;
      alle('[data-tusch]').forEach(function (t) {
        t.classList.add('is-verbeugt');
        setTimeout(function () { t.classList.remove('is-verbeugt'); }, 260);
      });
    });
    if (!bewegung()) return;
    var start = Date.now();
    alle('[data-tusch]').forEach(function (t) {
      var sichtbar = !('IntersectionObserver' in w);
      if (!sichtbar) new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; }).observe(t);
      (function plane() {
        setTimeout(function () {
          if (Date.now() - start > 60000 || !bewegung()) return;
          if (sichtbar && !d.hidden) {
            t.classList.add('is-blinzeln');
            setTimeout(function () { t.classList.remove('is-blinzeln'); }, 140);
          }
          plane();
        }, 6000 + Math.random() * 5000);
      })();
    });
  }

  /* Teilen ueber das Systemmenue, mobile Aktionsleiste */
  function teilen() {
    alle('[data-teilen-system]').forEach(function (k) {
      if (!navigator.share) return;
      k.hidden = false;
      k.addEventListener('click', function () {
        navigator.share({ title: d.title, url: k.getAttribute('data-url') || w.location.href }).catch(function () { /* abgebrochen */ });
      });
    });
    /* LinkedIn: der Link fuellt den Post vor. Rueckfall, falls LinkedIn (z. B. die App) den Text nicht uebernimmt: derselbe Text liegt in der Zwischenablage */
    alle('[data-linkedin-text]').forEach(function (a) {
      a.addEventListener('click', function () {
        var ziel = d.getElementById(a.getAttribute('data-linkedin-text'));
        if (!ziel) return;
        var status = a.parentNode.querySelector('.rolle__status');
        kopierText(ziel.textContent.replace(/^\s+|\s+$/g, '')).then(function () {
          var satz = T('Text kopiert. Fehlt er bei LinkedIn, füg ihn dort ein.', 'Text copied. If LinkedIn does not show it, paste it there.');
          if (status) status.textContent = satz;
          ansage(satz);
        }, function () { /* LinkedIn oeffnet trotzdem */ });
      });
    });
    alle('[data-drucken]').forEach(function (k) { k.hidden = false; k.addEventListener('click', function () { w.print(); }); });
    var l = d.querySelector('.leiste-unten'), f = d.querySelector('.fuss');
    if (l && f && 'IntersectionObserver' in w) new IntersectionObserver(function (es) { l.classList.toggle('is-weg', es[0].isIntersecting); }).observe(f);
  }

  /* Sprachwahl im Kopf: Wahl merken (localStorage cn-sprache), damit die Startseite danach nicht mehr selbst umleitet */
  function sprachwahl() {
    alle('[data-sprache-wahl]').forEach(function (a) {
      a.addEventListener('click', function () { speicher('cn-sprache', a.getAttribute('data-sprache-wahl')); });
    });
  }

  w.CN = {
    root: ROOT, basis: BASIS, en: EN, T: T,
    bewegung: bewegung,
    ansage: ansage,
    dojo: dojo,
    speicher: speicher,
    kopierText: kopierText,
    binden: function (el) { kopieren(el); schmiede(el); }
  };

  function los() {
    sprachwahl(); theme(); bewegungSchalter(); navigation(); suche(); kopieren(); schmiede(); schnitt(); filter(); tusch(); teilen();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', los); else los();
})();
