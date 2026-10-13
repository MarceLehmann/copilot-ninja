/* copilot.ninja: Theme-Umschalter und Kopieren. Kein Tracking, keine externen Requests. */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'copilot-ninja-theme';

  function readTheme() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveTheme(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* ohne Speicher weiterarbeiten */ }
  }

  // Frueh setzen, damit die Seite nicht aufblitzt.
  var saved = readTheme();
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  }

  function effectiveTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') { return set; }
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return dark ? 'dark' : 'light';
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {
    // Theme-Umschalter
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    function syncToggles() {
      var dark = effectiveTheme() === 'dark';
      for (var i = 0; i < toggles.length; i++) {
        toggles[i].setAttribute('aria-pressed', dark ? 'true' : 'false');
      }
    }
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].hidden = false;
      toggles[t].addEventListener('click', function () {
        var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        saveTheme(next);
        syncToggles();
      });
    }
    syncToggles();

    // Kopieren
    var status = document.getElementById('copy-status');
    var timers = new WeakMap();

    function say(message) {
      if (!status) { return; }
      status.textContent = '';
      window.setTimeout(function () { status.textContent = message; }, 30);
    }

    function fallbackCopy(text) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '0';
      area.style.left = '0';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      return ok;
    }

    function flash(button, label, message) {
      var original = button.getAttribute('data-label') || button.textContent;
      button.setAttribute('data-label', original);
      button.textContent = label;
      say(message);
      var old = timers.get(button);
      if (old) { window.clearTimeout(old); }
      timers.set(button, window.setTimeout(function () {
        button.textContent = original;
      }, 2000));
    }

    var buttons = document.querySelectorAll('[data-copy-target]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.hidden = false;
      button.addEventListener('click', function () {
        var target = document.getElementById(button.getAttribute('data-copy-target'));
        if (!target) { return; }
        var text = target.textContent.replace(/^\s+|\s+$/g, '');
        var title = button.getAttribute('data-title') || 'Vorlage';

        function done() { flash(button, 'Kopiert', title + ' kopiert.'); }
        function failed() {
          flash(button, 'Nicht möglich', 'Kopieren hat nicht funktioniert. Markiere den Text und kopiere ihn mit Strg+C.');
        }

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, function () {
            if (fallbackCopy(text)) { done(); } else { failed(); }
          });
        } else if (fallbackCopy(text)) {
          done();
        } else {
          failed();
        }
      });
    });
  });
})();
