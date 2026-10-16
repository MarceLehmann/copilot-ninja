/* PowerPlatformAcademy Dojo dojo-seiten.js: nur auf /dojo/ und /dojo/test/. Mein Dojo, Profil, Loeschen, Guertelkarte,
   Technik beitragen, Selbsttest. Braucht dojo.js (window.CNDojo). Nichts wird gesendet. */
(function () {
  'use strict';
  var d = document, w = window, h = d.documentElement, D = w.CNDojo;
  if (!D) return;
  var el = D.el, alle = D.alle, NAMEN = D.NAMEN, FARBEN = D.FARBEN, ROOT = D.root, BASIS = D.basis || ROOT, EN = !!D.en, LP = D.lp || '';
  var T = D.T || function (de) { return de; };
  var PFLICHT = T('Selbsteinschätzung auf einer unabhängigen Website. Kein Zertifikat.', 'Self-assessment on an independent website. Not a certificate.');
  var BELT = ['#FBFAF5', '#E2B100', '#E36A00', '#2E8B57', '#2F6FB5', '#7A4A2B', '#111111'];
  function landeseite(n) { return BASIS + 'dojo/guertel/' + FARBEN[n - 1] + '/'; }
  function akk(n) { return EN ? NAMEN[n - 1] : NAMEN[n - 1].replace(/er Gürtel$/, 'en Gürtel'); }

  /* Tusch aus der Kopfzeile in Platzhalter klonen, damit er den Guertel der Person traegt */
  function tuschKlonen() {
    var vorlage = d.querySelector('.kopf .marke .tusch');
    alle('[data-tusch-klon]').forEach(function (p) {
      if (!vorlage || p.querySelector('.tusch')) return;
      var t = vorlage.cloneNode(true);
      t.className = 'tusch tusch--' + p.getAttribute('data-tusch-klon');
      p.appendChild(t);
    });
  }

  /* Karte (1200 x 630) im Browser zeichnen: Startpunkt oder Dojo-Guertel */
  function umbrechen(ctx, text, breite) {
    var woerter = text.split(' '), zeilen = [], z = '';
    woerter.forEach(function (wort) {
      var probe = z ? z + ' ' + wort : wort;
      if (ctx.measureText(probe).width > breite && z) { zeilen.push(z); z = wort; } else z = probe;
    });
    if (z) zeilen.push(z);
    return zeilen;
  }
  function tuschBild(n) {
    var svg = d.querySelector('.kopf .tusch__svg');
    if (!svg || !w.XMLSerializer) return Promise.resolve(null);
    var c = svg.cloneNode(true);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    var st = d.createElementNS('http://www.w3.org/2000/svg', 'style');
    st.textContent = '.t-koerper,.t-hand{fill:#15171B}.t-gesicht{fill:#F4EFE6}.t-augen{fill:none;stroke:#15171B;stroke-width:3.6;stroke-linecap:round}.t-band,.t-pinsel-spitze{fill:#B4301A}' +
      '.t-guertel,.t-guertel-enden{fill:' + BELT[n - 1] + ';stroke:#8A7F6C;stroke-width:1.2;stroke-linejoin:round}.t-pinsel-stiel{fill:none;stroke:#15171B;stroke-width:3;stroke-linecap:round}.t-rolle,.t-strich{display:none}';
    c.insertBefore(st, c.firstChild);
    var url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: 'image/svg+xml' }));
    return new Promise(function (ok) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { ok(null); };
      img.src = url;
    });
  }
  var SCHRIFT = '"Bahnschrift", "Avenir Next Condensed", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif';
  function zeichnen(canvas, art, n, name, mitTusch) {
    var ctx = canvas.getContext('2d');
    canvas.width = 1200; canvas.height = 630;
    ctx.fillStyle = '#F4EFE6'; ctx.fillRect(0, 0, 1200, 630);
    for (var i = 0; i < 7; i++) {
      ctx.fillStyle = BELT[i];
      ctx.fillRect(Math.floor(i * 1200 / 7), i === n - 1 ? 586 : 606, Math.ceil(1200 / 7) + 1, i === n - 1 ? 44 : 24);
    }
    ctx.fillStyle = '#8A7F6C'; ctx.fillRect(0, 605, 1200, 1.5);
    ctx.strokeStyle = '#8A7F6C'; ctx.lineWidth = 2; ctx.strokeRect(Math.floor((n - 1) * 1200 / 7) + 1, 587, Math.ceil(1200 / 7) - 1, 43);
    ctx.fillStyle = '#15171B'; ctx.font = '600 34px ' + SCHRIFT; ctx.fillText('PowerPlatformAcademy Dojo', 80, 88);
    var wmB = ctx.measureText('PowerPlatformAcademy Dojo').width;
    ctx.fillStyle = '#B4301A'; ctx.font = '700 24px ' + SCHRIFT; ctx.fillText('COPILOT', 80 + wmB + 14, 88);
    ctx.fillStyle = '#4E525B'; ctx.font = '400 34px ' + SCHRIFT; ctx.textBaseline = 'alphabetic';
    var y = 176;
    ctx.fillText(art === 'start' ? T('Mein Startpunkt im Dojo', 'My starting point in the Dojo') : T('Mein Dojo-Gürtel', 'My Dojo belt'), 80, y);
    if (name) { y += 46; ctx.fillStyle = '#15171B'; ctx.font = '600 34px ' + SCHRIFT; ctx.fillText(umbrechen(ctx, name, 700)[0], 80, y); }
    var gross = 58;
    y += 74; ctx.fillStyle = '#15171B'; ctx.font = '700 ' + gross + 'px ' + SCHRIFT; ctx.fillText(NAMEN[n - 1], 80, y);
    var bx = 80, by = y + 22;
    ctx.fillStyle = BELT[n - 1]; ctx.strokeStyle = '#8A7F6C'; ctx.lineWidth = 3;
    ctx.fillRect(bx, by, 560, 26); ctx.strokeRect(bx, by, 560, 26);
    ctx.fillRect(bx + 250, by - 10, 46, 46); ctx.strokeRect(bx + 250, by - 10, 46, 46);
    ctx.fillStyle = '#15171B'; ctx.font = '400 ' + gross + 'px ' + SCHRIFT;
    var zeilen = umbrechen(ctx, PFLICHT, 760), zy = by + 98;
    zeilen.forEach(function (z) { ctx.fillText(z, 80, zy); zy += gross + 6; });
    ctx.fillStyle = '#4E525B'; ctx.font = '400 22px system-ui, "Segoe UI", sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(landeseite(n).replace(/^https?:\/\//, '').replace(/\/$/, ''), 1120, 572);
    ctx.textAlign = 'left';
    if (mitTusch) ctx.drawImage(mitTusch, 905, 120, 210, 280);
  }
  function karteBauen(box, art, n) {
    box.textContent = '';
    box.hidden = false;
    var id = 'karte-name-' + art;
    var feld = el('div', { 'class': 'schmiede__feld' });
    feld.appendChild(el('label', { 'for': id }, T('Dein Name auf der Karte (freiwillig)', 'Your name on the card (optional)')));
    var inp = el('input', { id: id, type: 'text', autocomplete: 'name', maxlength: '40', 'aria-describedby': id + '-h' });
    feld.appendChild(inp);
    feld.appendChild(el('small', { id: id + '-h' }, T('Der Name wird nur in dieses Bild gezeichnet und nirgends gespeichert.', 'The name is only drawn into this image and stored nowhere.')));
    box.appendChild(feld);
    var titel = (art === 'start' ? T('Mein Startpunkt im Dojo: ', 'My starting point in the Dojo: ') : T('Mein Dojo-Gürtel: ', 'My Dojo belt: ')) + NAMEN[n - 1] + '. ' + PFLICHT;
    var cv = el('canvas', { width: '1200', height: '630', role: 'img', 'aria-label': T('Vorschau der Karte. ', 'Card preview. ') + titel });
    box.appendChild(cv);
    var reihe = el('div', { 'class': 'knopf-reihe' });
    var laden = el('button', { type: 'button', 'class': 'knopf knopf--primaer' }, T('Bild herunterladen', 'Download image'));
    var url = landeseite(n);
    var li = el('a', { 'class': 'knopf', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), rel: 'noopener' }, T('Auf LinkedIn teilen', 'Share on LinkedIn'));
    var textK = el('button', { type: 'button', 'class': 'knopf' }, T('Text für deinen Post kopieren', 'Copy text for your post'));
    reihe.appendChild(laden); reihe.appendChild(li); reihe.appendChild(textK);
    if (navigator.share) {
      var sys = el('button', { type: 'button', 'class': 'knopf' }, T('Teilen', 'Share'));
      sys.addEventListener('click', function () { navigator.share({ title: titel, url: url }).catch(function () {}); });
      reihe.appendChild(sys);
    }
    box.appendChild(reihe);
    box.appendChild(el('p', { 'class': 'klein', role: 'status' }));
    var bild = null;
    function neu() { zeichnen(cv, art, n, inp.value.trim(), bild); }
    tuschBild(n).then(function (img) {
      bild = img; neu();
      try { cv.toDataURL(); } catch (e) { bild = null; neu(); }
    });
    neu();
    inp.addEventListener('input', neu);
    laden.addEventListener('click', function () {
      cv.toBlob(function (b) {
        if (!b) return;
        var u = URL.createObjectURL(b), a = el('a', { href: u, download: 'dojo-' + (art === 'start' ? T('startpunkt-', 'starting-point-') : T('guertel-', 'belt-')) + FARBEN[n - 1] + (EN ? '-en' : '') + '.png' });
        d.body.appendChild(a); a.click(); d.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        D.ansage(T('Bild gespeichert.', 'Image saved.'));
      }, 'image/png');
    });
    textK.addEventListener('click', function () {
      var t = EN ? (art === 'start' ? 'My starting point in the PowerPlatformAcademy Dojo: ' + NAMEN[n - 1] + '. Seven questions, each followed by the answer with a source.' : 'In the PowerPlatformAcademy Dojo I have practiced all techniques up to the ' + akk(n) + '.') + ' Self-assessment, not a certificate. ' + url
        : (art === 'start' ? 'Mein Startpunkt im PowerPlatformAcademy Dojo: ' + NAMEN[n - 1] + '. Sieben Fragen, nach jeder die Auflösung mit Quelle.' : 'Im PowerPlatformAcademy Dojo habe ich alle Techniken bis zum ' + akk(n) + ' geübt.') + ' Selbsteinschätzung, kein Zertifikat. ' + url;
      var status = box.querySelector('[role="status"]');
      (w.CN && w.CN.kopierText ? w.CN.kopierText(t) : Promise.reject()).then(function () { status.textContent = T('Text kopiert. Füg ihn in deinen Post ein.', 'Text copied. Paste it into your post.'); }, function () { status.textContent = t; });
    });
  }

  /* Mein Dojo */
  function meinDojo() {
    var seite = d.querySelector('[data-mein-dojo]');
    if (!seite) return;
    tuschKlonen();
    /* Abschnitte mit data-nur-js und data-ohne-js schaltet das CSS ueber html.js, schon vor dem ersten Rendern */
    /* Haken in der Liste */
    alle('.dojo-liste li[data-technik]').forEach(function (li) {
      var id = li.getAttribute('data-technik'), a = li.querySelector('a');
      var lab = el('label', { 'class': 'dojo-haken' });
      var cb = el('input', { type: 'checkbox', 'data-geuebt-toggle': id });
      lab.appendChild(cb);
      lab.appendChild(d.createTextNode(T(' geübt', ' practiced')));
      lab.appendChild(el('span', { 'class': 'sr-only' }, ': ' + (a ? a.textContent : id)));
      li.appendChild(lab);
      cb.addEventListener('change', function () { D.markieren(id, cb.checked, li.closest('.dojo-liste__guertel')); });
    });
    d.addEventListener('cn:stand', function (e) { stand(e.detail.s, e.detail.st); });
    D.aktualisieren();
    profil(); loeschen(); beitragen();
  }
  var karteFuer = 0;
  function stand(s, st) {
    alle('[data-geuebt-toggle]').forEach(function (cb) { cb.checked = !!s.geuebt[cb.getAttribute('data-geuebt-toggle')]; });
    var leer = !st.geuebt && !s.selbsttest;
    h.classList.toggle('hat-dojo', !leer);
    alle('[data-dojo-leer]').forEach(function (x) { x.hidden = !leer; });
    alle('[data-dojo-voll]').forEach(function (x) { x.hidden = leer; });
    var z = function (k, v) { alle('[data-zahl="' + k + '"]').forEach(function (x) { x.textContent = v; }); };
    z('guertel', NAMEN[st.guertel - 1] + (st.alle && st.guertel === 7 ? T(', alle geübt', ', all practiced') : ''));
    z('geuebt', st.liste ? st.geuebt + T(' von ', ' of ') + st.gesamt : String(Object.keys(s.geuebt).length));
    z('tage', String(st.tage)); alle('[data-tage-wort]').forEach(function (x) { x.textContent = st.tage === 1 ? T('Trainingstag', 'training day') : T('Trainingstage', 'training days'); });
    z('start', s.selbsttest ? NAMEN[s.selbsttest.startguertel - 1] : T('noch offen', 'still open'));
    alle('[data-geschafft]').forEach(function (x) { x.hidden = !st.alle; });
    /* Guertelkarte nur fuer vollstaendig geuebte Guertel */
    var fertig = st.pro.filter(function (p) { return p.komplett; });
    var box = d.querySelector('[data-guertelkarte]'), hinweis = d.querySelector('[data-guertelkarte-leer]'), wahl = d.querySelector('[data-guertelkarte-wahl]');
    if (!box) return;
    if (hinweis) hinweis.hidden = !!fertig.length;
    if (wahl) {
      wahl.hidden = fertig.length < 2;
      var sel = wahl.querySelector('select');
      var werte = fertig.map(function (p) { return String(p.n); }).join(',');
      if (sel && sel.getAttribute('data-werte') !== werte) {
        sel.setAttribute('data-werte', werte); sel.textContent = '';
        fertig.forEach(function (p) { sel.appendChild(el('option', { value: p.n }, NAMEN[p.n - 1])); });
        sel.value = fertig.length ? String(fertig[fertig.length - 1].n) : '';
        if (!sel.getAttribute('data-cn')) { sel.setAttribute('data-cn', '1'); sel.addEventListener('change', function () { karteFuer = +sel.value; karteBauen(box, 'guertel', karteFuer); }); }
      }
    }
    if (!fertig.length) { box.hidden = true; box.textContent = ''; karteFuer = 0; return; }
    var hoechster = fertig[fertig.length - 1].n;
    if (!karteFuer || !fertig.some(function (p) { return p.n === karteFuer; })) { karteFuer = hoechster; karteBauen(box, 'guertel', karteFuer); }
  }
  function profil() {
    var f = d.querySelector('[data-profil]');
    if (!f) return;
    var s = D.lesen();
    alle('input[data-profil-feld]', f).forEach(function (i) { i.value = s.profil[i.getAttribute('data-profil-feld')] || ''; });
    var status = f.querySelector('[data-profil-status]');
    f.querySelector('[data-profil-speichern]').addEventListener('click', function () {
      var s2 = D.lesen();
      alle('input[data-profil-feld]', f).forEach(function (i) { s2.profil[i.getAttribute('data-profil-feld')] = i.value.trim().slice(0, 80); });
      var ok = D.schreiben(s2);
      status.textContent = ok ? T('Gespeichert. Ab jetzt sind diese Felder in jeder Technik vorausgefüllt.', 'Saved. From now on these fields are prefilled in every technique.') : T('Dein Browser lässt kein Speichern zu. Die Felder bleiben leer.', 'Your browser does not allow saving. The fields stay empty.');
      D.ansage(status.textContent);
    });
  }
  function loeschen() {
    var b = d.querySelector('[data-alles-loeschen]');
    if (!b) return;
    var status = d.querySelector('[data-loeschen-status]'), zurueck = d.querySelector('[data-rueckgaengig]'), timer = null, alt = null;
    var KEYS = ['cn-theme', 'cn-bewegung', 'cn-sprache', D.KEY];
    b.addEventListener('click', function () {
      alt = {};
      KEYS.forEach(function (k) { try { alt[k] = w.localStorage.getItem(k); w.localStorage.removeItem(k); } catch (e) { alt[k] = null; } });
      alt.theme = h.getAttribute('data-theme'); alt.bewegung = h.getAttribute('data-bewegung');
      h.removeAttribute('data-theme'); h.removeAttribute('data-bewegung');
      alle('input[data-profil-feld]').forEach(function (i) { i.value = ''; });
      D.aktualisieren();
      status.textContent = T('Alles gelöscht: Fortschritt, Profil, Selbsttest, Theme, Bewegung und Sprachwahl. Rückgängig ist während 10 Sekunden möglich.', 'Everything deleted: progress, profile, self-test, theme, motion and language choice. You can undo this for 10 seconds.');
      zurueck.hidden = false; zurueck.focus();
      D.ansage(status.textContent);
      clearTimeout(timer);
      timer = setTimeout(function () { zurueck.hidden = true; alt = null; status.textContent = T('Alles gelöscht.', 'Everything deleted.'); }, 10000);
    });
    zurueck.addEventListener('click', function () {
      if (!alt) return;
      KEYS.forEach(function (k) { try { if (alt[k] !== null) w.localStorage.setItem(k, alt[k]); } catch (e) {} });
      if (alt.theme) h.setAttribute('data-theme', alt.theme);
      if (alt.bewegung) h.setAttribute('data-bewegung', alt.bewegung);
      alt = null; clearTimeout(timer);
      zurueck.hidden = true;
      var s = D.lesen();
      alle('input[data-profil-feld]').forEach(function (i) { i.value = s.profil[i.getAttribute('data-profil-feld')] || ''; });
      D.aktualisieren();
      status.textContent = T('Wiederhergestellt.', 'Restored.');
      D.ansage(status.textContent); b.focus();
    });
  }
  /* Technik beitragen: Mail im eigenen Mailprogramm vorbereiten, nichts wird von hier gesendet */
  function beitragen() {
    var f = d.querySelector('[data-beitragen]');
    if (!f) return;
    var knopf = f.querySelector('[data-beitrag-mail]'), kopie = f.querySelector('[data-beitrag-kopie]'), status = f.querySelector('[data-beitrag-status]');
    function text() {
      var v = function (n) { var x = f.querySelector('[name="' + n + '"]'); return x ? x.value.trim() : ''; };
      var nennung = f.querySelector('[name="nennung"]:checked');
      if (EN) return ['Title of the technique:', v('titel'), '', 'Problem it solves:', v('problem'), '', 'Prompt or guide:', v('prompt'), '', 'Limits:', v('grenzen'), '',
        'Source on Microsoft Learn:', v('quelle'), '', 'May I name you as the sender? ' + (nennung ? nennung.value : '(yes or no)'), '',
        'No customer, personal or company data in the prompt.'].join('\n');
      return ['Titel der Technik:', v('titel'), '', 'Problem, das sie löst:', v('problem'), '', 'Prompt oder Anleitung:', v('prompt'), '', 'Grenzen:', v('grenzen'), '',
        'Quelle bei Microsoft Learn:', v('quelle'), '', 'Darf ich dich als Absender nennen? ' + (nennung ? nennung.value : '(ja oder nein)'), '',
        'Keine Kunden-, Personen- oder Firmendaten im Prompt.'].join('\n');
    }
    knopf.addEventListener('click', function () {
      var body = text();
      if (body.length > 1800) { status.textContent = T('Der Text ist lang für einen Mail-Link. Kopier ihn lieber und füg ihn selbst in eine Mail an marcel.lehmann@kmupower.com ein.', 'The text is long for a mail link. Better copy it and paste it into an email to marcel.lehmann@kmupower.com yourself.'); D.ansage(status.textContent); return; }
      w.location.href = 'mailto:marcel.lehmann@kmupower.com?subject=' + encodeURIComponent(T('Technik für das Dojo', 'Technique for the Dojo')) + '&body=' + encodeURIComponent(body);
      status.textContent = T('Dein Mailprogramm öffnet sich mit dem Text. Gesendet wird erst, wenn du dort auf Senden klickst.', 'Your mail program opens with the text. Nothing is sent until you click Send there.');
    });
    kopie.addEventListener('click', function () {
      w.CN.kopierText(text()).then(function () { status.textContent = T('Text kopiert. Füg ihn in eine Mail an marcel.lehmann@kmupower.com ein.', 'Text copied. Paste it into an email to marcel.lehmann@kmupower.com.'); }, function () { status.textContent = T('Kopieren hat nicht funktioniert.', 'Copying did not work.'); });
    });
  }

  /* Selbsttest */
  function mischen(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function selbsttest() {
    var box = d.querySelector('[data-test]');
    if (!box) return;
    tuschKlonen();
    /* Die statische Fragenliste bleibt stehen, bis jemand den Test startet. So springt beim Laden nichts. */
    var startKnopf = d.querySelector('[data-test-start]'), wartet = false;
    if (startKnopf) startKnopf.addEventListener('click', function () { wartet = true; startKnopf.setAttribute('aria-disabled', 'true'); });
    Promise.all([D.json(LP + 'dojo/selbsttest.json'), D.liste()]).then(function (r) {
      var pool = r[0], L = r[1];
      if (!pool || !pool.fragen) { if (startKnopf) { startKnopf.parentNode.hidden = true; } return; }
      var frei = {};
      (L || []).forEach(function (t) { frei[t.id] = t; });
      var heute = D.heuteIso();
      function gueltig(f) {
        if (f.klasse === 'fakt') return D.tage(f.geprueft_am, heute) <= 120;
        return f.technik ? !!frei[f.technik] : true;
      }
      var runde, pos, antworten, ohne;
      function neu() {
        runde = []; ohne = []; pos = 0; antworten = [];
        for (var n = 1; n <= 7; n++) {
          var g = pool.fragen.filter(function (f) { return f.guertel === n && gueltig(f); });
          if (g.length) runde.push(g[Math.floor(Math.random() * g.length)]); else ohne.push(n);
        }
        alle('[data-test-statisch]').forEach(function (x) { x.hidden = true; });
        box.hidden = false;
        frage();
      }
      function quelleHtml(f, ziel) {
        var p = el('p', { 'class': 'klein' });
        if (f.quelle) {
          p.appendChild(d.createTextNode(T('Quelle: ', 'Source: ')));
          p.appendChild(el('a', { href: f.quelle.url, rel: 'noopener' }, f.quelle.titel));
          p.appendChild(d.createTextNode(T(', Stand ', ', as of ') + D.datumCH(f.geprueft_am) + '.'));
        } else if (f.technik && frei[f.technik]) {
          var t = frei[f.technik];
          p.appendChild(d.createTextNode(T('Mehr dazu: ', 'More on this: ')));
          p.appendChild(el('a', { href: D.technikUrl(t) }, T('Technik ', 'Technique ') + t.nr + ', ' + t.titel));
          p.appendChild(d.createTextNode('.'));
        }
        ziel.appendChild(p);
      }
      function band() {
        var b = el('div', { 'class': 'fortschritt__band', 'aria-hidden': 'true' });
        runde.forEach(function (f, i) { b.appendChild(el('span', { 'class': i < antworten.length ? 'is-voll' : null, 'data-guertel-nr': f.guertel })); });
        return b;
      }
      function frage() {
        var f = runde[pos];
        box.textContent = '';
        var kopf = el('h2', { 'class': 'label test__fortschritt', tabindex: '-1' }, T('Frage ', 'Question ') + (pos + 1) + T(' von ', ' of ') + runde.length + ', ' + NAMEN[f.guertel - 1]);
        box.appendChild(kopf);
        box.appendChild(band());
        var pk = el('p'); pk.appendChild(el('span', { 'class': 'knoten', 'data-guertel-nr': f.guertel }, NAMEN[f.guertel - 1])); box.appendChild(pk);
        var fs = el('fieldset', { 'class': 'test__frage', 'aria-labelledby': 'frage-text' });
        fs.appendChild(el('p', { 'class': 'test__text', id: 'frage-text' }, f.frage));
        var wahlen = el('div', { 'class': 'wahlen' });
        mischen(f.antworten.map(function (a, i) { return { a: a, i: i }; })).forEach(function (o, k) {
          var lab = el('label', { 'class': 'wahl' });
          var inp = el('input', { type: 'radio', name: 'antwort', value: o.i, id: 'a' + k });
          lab.appendChild(inp); lab.appendChild(el('span', null, o.a)); wahlen.appendChild(lab);
        });
        fs.appendChild(wahlen);
        var fehler = el('p', { 'class': 'test__fehler', id: 'test-fehler', role: 'alert' }); fehler.hidden = true;
        fs.appendChild(fehler);
        var pr = el('p'), knopf = el('button', { type: 'button', 'class': 'knopf knopf--primaer' }, T('Antwort prüfen', 'Check answer'));
        pr.appendChild(knopf); fs.appendChild(pr);
        var auf = el('div', { 'class': 'test__aufloesung', tabindex: '-1' }); auf.hidden = true;
        fs.appendChild(auf);
        box.appendChild(fs);
        if (pos > 0) kopf.focus();
        knopf.addEventListener('click', function () {
          var gew = fs.querySelector('input:checked');
          if (!gew) { fehler.hidden = false; fehler.textContent = T('Wähl zuerst eine Antwort.', 'Choose an answer first.'); alle('input', fs).forEach(function (i) { i.setAttribute('aria-describedby', 'test-fehler'); }); return; }
          fehler.hidden = true;
          var richtig = +gew.value === f.richtig;
          antworten.push({ guertel: f.guertel, richtig: richtig });
          alle('input', fs).forEach(function (i) { i.disabled = true; });
          auf.hidden = false;
          auf.classList.add(richtig ? 'is-richtig' : 'is-falsch');
          var p1 = el('p'); p1.appendChild(el('strong', null, richtig ? T('Richtig.', 'Correct.') : T('Daneben. Richtig ist: ', 'Not quite. The correct answer is: ') + f.antworten[f.richtig]));
          auf.appendChild(p1);
          auf.appendChild(el('p', null, f.aufloesung));
          quelleHtml(f, auf);
          var weiter = el('button', { type: 'button', 'class': 'knopf knopf--primaer' }, pos + 1 < runde.length ? T('Nächste Frage', 'Next question') : T('Zum Ergebnis', 'To the result'));
          var pw = el('p'); pw.appendChild(weiter); auf.appendChild(pw);
          pr.hidden = true;
          auf.focus();
          weiter.addEventListener('click', function () { pos++; if (pos < runde.length) frage(); else ergebnis(); });
        });
      }
      function ergebnis() {
        var falsch = antworten.filter(function (a) { return !a.richtig; })[0];
        var n = falsch ? falsch.guertel : 7;
        var s = D.lesen();
        s.selbsttest = { startguertel: n, datum: heute };
        var st = D.stand(s, L);
        s.guertel = st.guertel;
        var gespeichert = D.schreiben(s);
        D.zeigen(s, st);
        box.textContent = '';
        var erg = el('section', { 'class': 'test__ergebnis', tabindex: '-1', 'aria-labelledby': 'ergebnis-titel' });
        erg.appendChild(el('span', { 'class': 'label' }, T('Dein Startpunkt', 'Your starting point')));
        var h2 = el('h2', { id: 'ergebnis-titel' }); h2.appendChild(el('span', { 'class': 'knoten knoten--gross', 'data-guertel-nr': n }, NAMEN[n - 1])); erg.appendChild(h2);
        erg.appendChild(el('p', { 'class': 'lead' }, (pool.startpunkt && pool.startpunkt[falsch ? n : 'alle']) || NAMEN[n - 1] + '.'));
        var richtigZahl = antworten.filter(function (a) { return a.richtig; }).length;
        erg.appendChild(el('p', null, richtigZahl + T(' von ', ' of ') + antworten.length + T(' richtig. ', ' correct. ') + (falsch ? T('Dein Startpunkt ist der erste Gürtel, bei dem du danebenlagst.', 'Your starting point is the first belt where you missed.') : T('Alle richtig, darum startest du beim schwarzen Gürtel.', 'All correct, so you start at the black belt.'))));
        if (ohne.length) erg.appendChild(el('p', { 'class': 'klein' }, ohne.map(function (g) { return T('Für den ' + akk(g) + ' gibt es zurzeit keine geprüfte Frage.', 'There is currently no checked question for the ' + akk(g) + '.'); }).join(' ') + T(' Der Startpunkt rechnet mit den übrigen Gürteln.', ' The starting point uses the other belts.')));
        erg.appendChild(el('p', { 'class': 'meldung' }, PFLICHT + T(' Den Gürtel selbst trägst du erst, wenn du seine Techniken als geübt markiert hast.', ' You only wear the belt itself once you have marked its techniques as practiced.')));
        var start = (L || []).filter(function (t) { return t.guertel === n; }).sort(function (a, b) { return a.nr - b.nr; }).slice(0, 3);
        erg.appendChild(el('h3', null, T('Deine Start-Techniken', 'Your starting techniques')));
        if (start.length) {
          var ul = el('ul', { 'class': 'pfad__liste' });
          start.forEach(function (t) {
            var li = el('li', { 'class': 'karte-kompakt', 'data-technik': t.id, 'data-guertel-nr': t.guertel });
            li.appendChild(el('span', { 'class': 'karte-kompakt__nr' }, D.nr2(t.nr)));
            li.appendChild(el('a', { 'class': 'karte-kompakt__link', href: D.technikUrl(t) }, t.titel));
            if (t.klartitel) li.appendChild(el('span', { 'class': 'klein' }, t.klartitel));
            ul.appendChild(li);
          });
          erg.appendChild(ul);
        } else {
          var pn = el('p', null, T('Die Techniken dieses Gürtels sind noch nicht freigegeben. Sie erscheinen, sobald Marcel sie gegen die Dokumentation geprüft hat. ', 'The techniques of this belt are not released yet. They appear as soon as Marcel has checked them against the documentation. '));
          pn.appendChild(el('a', { href: BASIS + 'techniken/' }, T('Zur Technik-Wand', 'To the technique wall'))); erg.appendChild(pn);
        }
        erg.appendChild(el('h3', null, T('Deine Startpunkt-Karte', 'Your starting point card')));
        var karte = el('div', { 'class': 'guertelkarte' }); erg.appendChild(karte);
        var pl = el('p', { 'class': 'knopf-reihe' });
        pl.appendChild(el('a', { 'class': 'knopf', href: BASIS + 'dojo/' }, T('Mein Dojo öffnen', 'Open My Dojo')));
        var nochmal = el('button', { type: 'button', 'class': 'knopf knopf--leise' }, T('Test neu starten', 'Restart the test'));
        pl.appendChild(nochmal);
        var statisch = d.querySelector('[data-test-statisch]');
        if (statisch) {
          var zeig = el('button', { type: 'button', 'class': 'knopf knopf--leise' }, T('Alle Fragen mit Auflösung ansehen', 'See all questions with answers'));
          pl.appendChild(zeig);
          zeig.addEventListener('click', function () { statisch.hidden = false; var k = statisch.querySelector('h2'); if (k) { k.setAttribute('tabindex', '-1'); k.focus(); } });
        }
        erg.appendChild(pl);
        if (!gespeichert) erg.appendChild(el('p', { 'class': 'klein' }, T('Dein Browser speichert nichts. Das Ergebnis gilt nur auf dieser Seite.', 'Your browser does not store anything. The result only applies on this page.')));
        box.appendChild(erg);
        karteBauen(karte, 'start', n);
        erg.focus();
        D.ansage(T('Dein Startpunkt: ', 'Your starting point: ') + NAMEN[n - 1] + '.');
        nochmal.addEventListener('click', neu);
      }
      function starten() { startKnopf.parentNode.hidden = true; neu(); box.querySelector('h2').focus(); }
      if (startKnopf) {
        startKnopf.removeAttribute('aria-disabled');
        startKnopf.addEventListener('click', starten);
        if (wartet) starten();
      } else neu();
    });
  }

  function los() { meinDojo(); selbsttest(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', los); else los();
})();
