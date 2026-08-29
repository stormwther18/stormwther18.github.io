/* Footprint page: world map with pins + justified photo gallery + lightbox.
   Data comes from js/footprint-data.js; map paths from js/world-map.js. */
(function () {
  'use strict';

  var DATA = window.FOOTPRINT;
  var MAP  = window.WORLD_MAP;
  if (!DATA || !MAP) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- helpers ---------------------------------------------------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ISO-3166 alpha-3 -> the flag file in assets/flags/. Adding a country
     means a line here and the matching <alpha-2>.svg alongside it. */
  var FLAG = {
    CHN: 'cn', HKG: 'hk', MAC: 'mo', SGP: 'sg', MYS: 'my', THA: 'th',
    KOR: 'kr', JPN: 'jp', AUS: 'au', FIN: 'fi', ESP: 'es', GIB: 'gi',
    PRT: 'pt', MAR: 'ma'
  };
  function flag(place) {
    var code = FLAG[place.country];
    if (!code) return null;
    var img = el('img', 'fp-flag');
    img.src = 'assets/flags/' + code + '.svg';
    img.alt = '';                       // decorative: the name is right there
    img.width = 18;
    img.height = 13;
    img.loading = 'lazy';
    return img;
  }

  /* Equal Earth forward projection, matched to the generated path data. */
  var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
  var M  = Math.sqrt(3) / 2;
  function project(lat, lon) {
    var p = Math.max(-90, Math.min(90, lat)) * Math.PI / 180;
    var l = Math.max(-180, Math.min(180, lon)) * Math.PI / 180;
    var th = Math.asin(M * Math.sin(p));
    var t2 = th * th, t6 = t2 * t2 * t2, t8 = t6 * t2;
    var x = 2 * Math.sqrt(3) * l * Math.cos(th) /
            (3 * (9 * A4 * t8 + 7 * A3 * t6 + 3 * A2 * t2 + A1));
    var y = -(A1 * th + A2 * Math.pow(th, 3) + A3 * Math.pow(th, 7) + A4 * Math.pow(th, 9));
    return {
      x: (x - MAP.minx) * MAP.s / MAP.w * 100,   // percent of map width
      y: (y - MAP.miny) * MAP.s / MAP.h * 100    // percent of map height
    };
  }

  /* ---- normalise the data ----------------------------------------------- */

  // `first` orders the list but is never shown: a place you have been back to
  // several times is still one place, not one entry per trip.
  var places = (DATA.places || []).slice().sort(function (a, b) {
    return String(b.first).localeCompare(String(a.first));
  });

  // In demo mode, stops without photos get placeholder tiles so the gallery
  // layout is visible. Ratios are fixed, not random, so the page is stable.
  var DEMO_RATIOS = [[3,2],[2,3],[3,2],[4,3],[16,9],[1,1],[2,3],[3,2],[4,5]];
  var photos = [];
  places.forEach(function (pl, pi) {
    var list = pl.photos || [];
    if (!list.length && DATA.demo) {
      var n = 3 + (pi % 3);
      list = [];
      for (var i = 0; i < n; i++) {
        var r = DEMO_RATIOS[(pi * 3 + i) % DEMO_RATIOS.length];
        list.push({ src: null, w: r[0] * 100, h: r[1] * 100 });
      }
    }
    list.forEach(function (ph) {
      var when = ph.date || pl.first;
      photos.push({
        src: ph.src, w: ph.w || 3, h: ph.h || 2,
        caption: ph.caption || '',
        date: ph.date || null,
        place: pl,
        year: String(when).slice(0, 4)
      });
    });
  });

  var visited = {};
  (DATA.countries || []).forEach(function (c) { visited[c] = true; });
  places.forEach(function (p) { if (p.country) visited[p.country] = true; });

  var pins = [];
  var active = null;   // the selected place, or null

  /* ---- map -------------------------------------------------------------- */

  var svgNS = 'http://www.w3.org/2000/svg';
  var mapWrap = document.getElementById('fpMap');
  var pinLayer, tooltip;

  function buildMap() {
    if (!mapWrap) return;

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + MAP.w + ' ' + MAP.h);
    svg.setAttribute('class', 'fp-map-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'World map of places visited');

    var sea = document.createElementNS(svgNS, 'rect');
    sea.setAttribute('x', 0);
    sea.setAttribute('y', 0);
    sea.setAttribute('width', MAP.w);
    sea.setAttribute('height', MAP.h);
    sea.setAttribute('rx', 8);
    sea.setAttribute('class', 'fp-sea');
    svg.appendChild(sea);

    Object.keys(MAP.countries).forEach(function (iso) {
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', MAP.countries[iso]);
      path.setAttribute('class', visited[iso] ? 'fp-land is-visited' : 'fp-land');
      svg.appendChild(path);
    });
    mapWrap.appendChild(svg);

    pinLayer = el('div', 'fp-pins');
    mapWrap.appendChild(pinLayer);

    tooltip = el('div', 'fp-tip');
    tooltip.setAttribute('aria-hidden', 'true');
    mapWrap.appendChild(tooltip);
  }

  /* Every place keeps its own pin — nothing is ever rolled up into a count.
     Hong Kong and Macau are 1.7px apart at this scale, so pins that would
     land on top of each other are pushed apart until they are separately
     visible, and never further from the true spot than MAX_SHIFT. Where
     cities really are one point on a world map, the data merges them under a
     region name instead (Kyushu, Setouchi). */
  function placePins() {
    var mapW = mapWrap.clientWidth || 900;
    var mapH = mapW * MAP.h / MAP.w;
    var gap = mapW < 620 ? 7 : 9;     // px to keep between pin tips
    var cap = mapW < 620 ? 4 : 5;     // px a pin may be nudged

    var pts = places.map(function (pl) {
      var pt = project(pl.lat, pl.lon);
      var x = pt.x / 100 * mapW, y = pt.y / 100 * mapH;
      return { place: pl, x: x, y: y, ox: x, oy: y };
    });

    for (var it = 0; it < 60; it++) {
      var moved = false;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var a = pts[i], b = pts[j];
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.hypot(dx, dy);
          var want = gap + (a.place.base || b.place.base ? 4 : 0);
          if (d >= want) continue;
          if (d < 0.01) { dx = (j % 2 ? 1 : -1); dy = 0.6; d = Math.hypot(dx, dy); }
          var push = (want - d) / 2 * 0.55;
          a.x -= dx / d * push; a.y -= dy / d * push;
          b.x += dx / d * push; b.y += dy / d * push;
          moved = true;
        }
      }
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k], ddx = p.x - p.ox, ddy = p.y - p.oy;
        var dd = Math.hypot(ddx, ddy);
        if (dd > cap) { p.x = p.ox + ddx / dd * cap; p.y = p.oy + ddy / dd * cap; }
      }
      if (!moved) break;
    }

    pts.forEach(function (p) {
      p.left = p.x / mapW * 100;
      p.top  = p.y / mapH * 100;
    });
    return pts;
  }

  function buildPins() {
    if (!pinLayer) return;
    pinLayer.innerHTML = '';
    pins = placePins();
    // paint north to south so a southern pin overlaps a northern one, the way
    // depth reads on a real map, instead of by arbitrary date order
    pins.sort(function (a, b) { return a.top - b.top; });

    pins.forEach(function (pin, i) {
      var btn = el('button', pin.place.base ? 'fp-pin is-base' : 'fp-pin');
      btn.type = 'button';
      btn.style.left = pin.left + '%';
      btn.style.top  = pin.top + '%';
      btn.setAttribute('aria-label', pin.place.name);
      btn.setAttribute('aria-pressed', 'false');
      if (!reduceMotion) btn.style.animationDelay = Math.min(i * 24, 640) + 'ms';

      btn.appendChild(el('span', 'fp-pin-halo'));
      btn.appendChild(marker(pin.place.base));

      btn.addEventListener('mouseenter', function () { showTip(pin); });
      btn.addEventListener('focus',      function () { showTip(pin); });
      btn.addEventListener('mouseleave', hideTip);
      btn.addEventListener('blur',       hideTip);
      btn.addEventListener('click', function () {
        setFilter(active === pin.place ? null : pin.place);
      });

      pin.el = btn;
      pinLayer.appendChild(btn);
    });

    if (active) setFilter(active, true);
  }

  /* Teardrop map marker. The path is drawn tip-down so the tip sits on the
     coordinate; CSS offsets the button by exactly that much. */
  function marker(isBase) {
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'fp-pin-mark');
    svg.setAttribute('viewBox', '-2 -2 22 28');
    svg.setAttribute('aria-hidden', 'true');

    var body = document.createElementNS(svgNS, 'path');
    body.setAttribute('class', 'fp-pin-body');
    body.setAttribute('d', 'M9 0a9 9 0 0 0-9 9c0 6.75 9 15 9 15s9-8.25 9-15a9 9 0 0 0-9-9z');

    var eye;
    if (isBase) {
      // five-pointed star, outer r 4.8 / inner r 2.1, centred on the head
      eye = document.createElementNS(svgNS, 'path');
      eye.setAttribute('d', 'M9 4.2L10.23 7.3L13.57 7.52L11 9.65L11.82 12.88' +
                            'L9 11.1L6.18 12.88L7 9.65L4.43 7.52L7.77 7.3Z');
    } else {
      eye = document.createElementNS(svgNS, 'circle');
      eye.setAttribute('cx', 9);
      eye.setAttribute('cy', 9);
      eye.setAttribute('r', 3.2);
    }
    eye.setAttribute('class', 'fp-pin-eye');

    svg.appendChild(body);
    svg.appendChild(eye);
    return svg;
  }

  function showTip(pin) {
    tooltip.innerHTML = '';
    var head = el('span', 'fp-tip-head');
    var f = flag(pin.place);
    if (f) head.appendChild(f);
    head.appendChild(el('span', 'fp-tip-city', pin.place.name));
    if (pin.place.base) head.appendChild(el('span', 'fp-tip-base', 'base'));
    tooltip.appendChild(head);
    if (pin.place.note) tooltip.appendChild(el('span', 'fp-tip-note', pin.place.note));
    tooltip.style.left = pin.left + '%';
    tooltip.style.top  = pin.top + '%';
    tooltip.classList.add('is-on');
  }
  function hideTip() { if (tooltip) tooltip.classList.remove('is-on'); }

  /* ---- stats ------------------------------------------------------------ */

  function buildStats() {
    var host = document.getElementById('fpStats');
    if (!host) return;
    host.innerHTML = '';
    var shot = places.reduce(function (n, p) { return n + (p.photos || []).length; }, 0);
    [[Object.keys(visited).length, 'countries/regions'],
     [places.length, 'places'],
     [shot, 'photos']].forEach(function (s) {
      var item = el('span', 'fp-stat');
      item.appendChild(el('strong', null, String(s[0])));
      item.appendChild(el('span', null, s[1]));
      host.appendChild(item);
    });
  }

  /* ---- gallery: justified rows ------------------------------------------ */

  var grid = document.getElementById('fpGrid');
  var chip = document.getElementById('fpChip');
  var GAP  = 10;

  function visiblePhotos() {
    if (!active) return photos;
    return photos.filter(function (p) { return p.place === active; });
  }

  function targetHeight(w) {
    if (w < 520) return 150;
    if (w < 820) return 190;
    return 230;
  }

  /* Pack items into rows that fill the container edge to edge, the way a
     justified photo grid does: pick a row, then solve for the height that
     makes the row exactly as wide as the container. */
  function layout() {
    if (!grid) return;
    var W = grid.clientWidth;
    if (!W) return;
    var target = targetHeight(W);

    grid.innerHTML = '';
    var list = visiblePhotos();

    if (!list.length) {
      grid.appendChild(el('p', 'fp-empty',
        active ? 'No photos from here yet.' : 'Photos coming soon.'));
      return;
    }

    var years = [], byYear = {};
    list.forEach(function (p) {
      if (!byYear[p.year]) { byYear[p.year] = []; years.push(p.year); }
      byYear[p.year].push(p);
    });

    var index = 0;   // running index into `list`, for the lightbox
    years.forEach(function (y) {
      var head = el('div', 'fp-year');
      head.appendChild(el('span', 'fp-year-num', y));
      head.appendChild(el('span', 'fp-year-rule'));
      head.appendChild(el('span', 'fp-year-count',
        byYear[y].length + (byYear[y].length === 1 ? ' photo' : ' photos')));
      grid.appendChild(head);

      var rows = [], row = [], sumAR = 0;
      byYear[y].forEach(function (p) {
        var ar = p.w / p.h;
        row.push(p); sumAR += ar;
        if (sumAR * target + GAP * (row.length - 1) >= W) {
          rows.push({ items: row, ar: sumAR }); row = []; sumAR = 0;
        }
      });
      if (row.length) rows.push({ items: row, ar: sumAR, last: true });

      rows.forEach(function (r) {
        var fit = (W - GAP * (r.items.length - 1)) / r.ar;
        // A last row is stretched flush only when that stays a sane size —
        // otherwise one wide photo would fill the screen, and a half-empty
        // row of portraits would leave a hole on the right.
        var h = fit;
        if (r.last) {
          var flush = r.items.length > 1 && fit <= target * 2;
          h = flush ? fit : Math.min(fit, target);
        }
        var rowEl = el('div', 'fp-row');
        r.items.forEach(function (p) { rowEl.appendChild(tile(p, h, index++)); });
        grid.appendChild(rowEl);
      });
    });
  }

  function tile(p, h, i) {
    var fig = el('figure', 'fp-tile');
    fig.style.height = Math.round(h) + 'px';
    fig.style.width  = Math.round(h * (p.w / p.h)) + 'px';

    if (p.src) {
      var img = el('img');
      img.src = p.src;
      img.alt = p.caption || p.place.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      fig.appendChild(img);
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');
      fig.addEventListener('click', function () { openBox(i); });
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBox(i); }
      });
    } else {
      fig.classList.add('is-empty');
      fig.appendChild(el('span', 'fp-tile-ph', p.place.name));
    }

    var cap = el('figcaption', 'fp-tile-cap');
    var tf = flag(p.place);
    if (tf) cap.appendChild(tf);
    cap.appendChild(el('span', 'fp-tile-city', p.place.name));
    fig.appendChild(cap);
    return fig;
  }

  /* ---- filter ----------------------------------------------------------- */

  function setFilter(pl, quiet) {
    active = pl || null;
    pins.forEach(function (pin) {
      if (!pin.el) return;
      pin.el.classList.toggle('is-active', pin.place === active);
      pin.el.setAttribute('aria-pressed', pin.place === active ? 'true' : 'false');
    });
    if (mapWrap) mapWrap.classList.toggle('has-filter', !!active);

    chip.innerHTML = '';
    if (active) {
      var b = el('button', 'fp-chip');
      b.type = 'button';
      var cf = flag(active);
      if (cf) b.appendChild(cf);
      b.appendChild(el('span', 'fp-chip-city', active.name));
      if (active.note) b.appendChild(el('span', 'fp-chip-note', active.note));
      b.appendChild(el('span', 'fp-chip-x', '×'));
      b.setAttribute('aria-label', 'Clear this filter');
      b.addEventListener('click', function () { setFilter(null); });
      chip.appendChild(b);
      if (active.intro) chip.appendChild(el('p', 'fp-intro', active.intro));
    }
    if (!quiet) layout();
  }

  /* ---- lightbox --------------------------------------------------------- */

  var box, boxImg, boxCap, boxIdx = 0, boxList = [];

  function buildBox() {
    box = el('div', 'fp-box');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.hidden = true;

    var close = el('button', 'fp-box-btn fp-box-close', '×');
    close.type = 'button'; close.setAttribute('aria-label', 'Close');
    var prev = el('button', 'fp-box-btn fp-box-prev', '‹');
    prev.type = 'button'; prev.setAttribute('aria-label', 'Previous photo');
    var next = el('button', 'fp-box-btn fp-box-next', '›');
    next.type = 'button'; next.setAttribute('aria-label', 'Next photo');

    var stage = el('div', 'fp-box-stage');
    boxImg = el('img', 'fp-box-img');
    boxCap = el('div', 'fp-box-cap');
    stage.appendChild(boxImg);
    stage.appendChild(boxCap);

    box.appendChild(stage);
    box.appendChild(close);
    box.appendChild(prev);
    box.appendChild(next);
    document.body.appendChild(box);

    close.addEventListener('click', closeBox);
    prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === stage) closeBox();
    });

    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
      x0 = null;
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }

  function openBox(i) {
    var shown = visiblePhotos();
    boxList = shown.filter(function (p) { return p.src; });
    if (!boxList.length) return;
    boxIdx = Math.max(0, boxList.indexOf(shown[i]));
    box.hidden = false;
    document.body.classList.add('fp-locked');
    renderBox();
  }
  function closeBox() {
    box.hidden = true;
    document.body.classList.remove('fp-locked');
  }
  function step(d) {
    if (!boxList.length) return;
    boxIdx = (boxIdx + d + boxList.length) % boxList.length;
    renderBox();
  }
  function renderBox() {
    var p = boxList[boxIdx];
    boxImg.src = p.src;
    boxImg.alt = p.caption || p.place.name;
    boxCap.innerHTML = '';
    var bf = flag(p.place);
    if (bf) boxCap.appendChild(bf);
    boxCap.appendChild(el('span', 'fp-box-city', p.place.name));
    if (p.year) boxCap.appendChild(el('span', 'fp-box-when', p.year));
    if (p.caption || p.place.note) {
      boxCap.appendChild(el('span', 'fp-box-note', p.caption || p.place.note));
    }
    boxCap.appendChild(el('span', 'fp-box-count', (boxIdx + 1) + ' / ' + boxList.length));
  }

  /* ---- boot ------------------------------------------------------------- */

  buildMap();
  buildPins();
  buildStats();
  buildBox();
  layout();

  if (DATA.demo) {
    var banner = document.getElementById('fpDemo');
    if (banner) banner.hidden = false;
  }

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { buildPins(); layout(); }, 140);
  });
  if (window.ResizeObserver && grid) {
    var lastW = grid.clientWidth;
    new ResizeObserver(function () {
      if (grid.clientWidth !== lastW) { lastW = grid.clientWidth; layout(); }
    }).observe(grid);
  }
})();
