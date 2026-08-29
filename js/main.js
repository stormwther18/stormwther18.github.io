/* Xinyi Hong: site behavior: publication filter, scroll-spy, citation modal. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initPublicationFilter();
    initScrollSpy();
    initCitationModal();
  });

  /* --- Publication tag filter -------------------------------------- */
  function initPublicationFilter() {
    var buttons = document.querySelectorAll('.pub-filter');
    var items = document.querySelectorAll('#publications .pub-item[data-tags]');
    var empty = document.querySelector('#publications .pub-empty');
    if (!buttons.length) return;

    function apply(filter) {
      buttons.forEach(function (btn) {
        var on = btn.dataset.filter === filter;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      items.forEach(function (item) {
        var tags = item.dataset.tags.split(/\s+/);
        item.hidden = filter !== 'all' && tags.indexOf(filter) === -1;
        if (!item.hidden) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () { apply(this.dataset.filter); });
    });

    var initial = document.querySelector('.pub-filter.active');
    apply(initial ? initial.dataset.filter : 'all');
  }

  /* --- Sidebar scroll-spy ------------------------------------------ */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-item[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });
    if (!sections.length) return;

    var visible = new Set();

    function highlight() {
      var current = sections.filter(function (s) { return visible.has(s.id); })[0];
      if (!current) return;
      links.forEach(function (l) { l.classList.remove('active'); });
      if (byId[current.id]) byId[current.id].classList.add('active');
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      highlight();
    }, { rootMargin: '-80px 0px -65% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* --- BibTeX modal ------------------------------------------------- */
  function initCitationModal() {
    var modal = document.getElementById('citationModal');
    if (!modal) return;

    var text = document.getElementById('citationText');
    var copyBtn = document.getElementById('copyBtn');
    var closeBtn = modal.querySelector('.modal-close');
    var citations = window.CITATIONS || {};
    var copyLabel = copyBtn ? copyBtn.textContent : '';
    var lastFocus = null;

    function open(key) {
      if (!citations[key]) return;
      lastFocus = document.activeElement;
      text.textContent = citations[key];
      modal.classList.add('show');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.classList.remove('show');
      if (copyBtn) copyBtn.textContent = copyLabel;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.querySelectorAll('.citation-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { open(this.dataset.paper); });
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) close();
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var done = function () {
          copyBtn.textContent = copyBtn.dataset.copied || 'Copied!';
          setTimeout(function () { copyBtn.textContent = copyLabel; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text.textContent).then(done, fallback);
        } else {
          fallback();
        }
        function fallback() {
          var range = document.createRange();
          range.selectNodeContents(text);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          try { document.execCommand('copy'); done(); } catch (err) { /* no-op */ }
          sel.removeAllRanges();
        }
      });
    }
  }
})();
