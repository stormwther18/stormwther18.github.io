/* Repositories page: pulls the public repo list from the GitHub API at load,
   and falls back to a baked-in snapshot when the API is unreachable or the
   unauthenticated rate limit (60/hour per IP) is exhausted. */
(function () {
  'use strict';

  var LANG_COLOR = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
    CSS: '#563d7c', Jupyter: '#DA5B0B', 'Jupyter Notebook': '#DA5B0B', R: '#198CE7',
    'C++': '#f34b7d', C: '#555555', Java: '#b07219', Go: '#00ADD8', Rust: '#dea584',
    Shell: '#89e051', Cuda: '#3A4E3A', TeX: '#3D6117', Julia: '#a270ba'
  };

  var FALLBACK = [
    { name: 'HYSET', language: 'Python', stargazers_count: 5, forks_count: 2,
      pushed_at: '2026-08-07', html_url: 'https://github.com/stormwther18/HYSET',
      description: 'Tools Are Not Islands: Set-Level Tool Retrieval for LLM Agents via Query-Conditioned Hyperedge Prediction' },
    { name: 'stormwther18.github.io', language: 'HTML', stargazers_count: 0, forks_count: 0,
      pushed_at: '2026-06-23', html_url: 'https://github.com/stormwther18/stormwther18.github.io',
      description: null },
    { name: 'Enhancing-Mixed-Oil-Length-through-Graph-Representation-Learning',
      language: null, stargazers_count: 0, forks_count: 0, pushed_at: '2025-03-16',
      html_url: 'https://github.com/stormwther18/Enhancing-Mixed-Oil-Length-through-Graph-Representation-Learning',
      description: 'A graph representation learning model for predicting mixed oil length, with training and inference code.' },
    { name: 'GRAPE-Transfer-Lasso', language: null, stargazers_count: 0, forks_count: 0,
      pushed_at: '2024-09-25', html_url: 'https://github.com/stormwther18/GRAPE-Transfer-Lasso',
      description: 'Python code for GRAPE and R code for Transfer-Lasso.' }
  ];

  var grid = document.getElementById('repoGrid');
  var status = document.getElementById('repoStatus');
  if (!grid) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Octicons, inlined so the counts never depend on a glyph the visitor's
     font happens to lack (U+2442 for "fork" is widely missing). */
  var STAR = 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z';
  var FORK = 'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z';

  function stat(path, n) {
    var NS = 'http://www.w3.org/2000/svg';
    var wrap = el('span', 'repo-stat');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', path);
    svg.appendChild(p);
    wrap.appendChild(svg);
    wrap.appendChild(document.createTextNode(String(n)));
    return wrap;
  }

  function card(r) {
    var colour = LANG_COLOR[r.language] || '#c8ccd2';
    var a = el('a', 'repo-card');
    a.href = r.html_url;
    a.rel = 'noopener';
    a.style.setProperty('--repo-accent', colour);

    a.appendChild(el('div', 'repo-name', r.name));
    a.appendChild(el('p', 'repo-desc', r.description || 'No description.'));

    var meta = el('div', 'repo-meta');
    if (r.language) {
      var lang = el('span', 'repo-lang');
      var dot = el('span', 'repo-dot');
      dot.style.background = colour;
      lang.appendChild(dot);
      lang.appendChild(document.createTextNode(r.language));
      meta.appendChild(lang);
    }
    meta.appendChild(stat(STAR, r.stargazers_count));
    meta.appendChild(stat(FORK, r.forks_count));
    meta.appendChild(el('span', 'repo-date', String(r.pushed_at).slice(0, 10)));
    a.appendChild(meta);
    return a;
  }

  function render(list, note) {
    grid.textContent = '';
    list.sort(function (a, b) { return String(b.pushed_at).localeCompare(String(a.pushed_at)); })
        .forEach(function (r) { grid.appendChild(card(r)); });
    if (status) status.textContent = note || '';
  }

  render(FALLBACK, '');

  var user = window.GH_USER;
  if (!user || !window.fetch) return;

  fetch('https://api.github.com/users/' + user + '/repos?per_page=100&sort=updated', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(function (data) {
      if (!Array.isArray(data) || !data.length) return;
      render(data.filter(function (r) { return !r.fork && !r.archived; }), '');
    })
    .catch(function () {
      if (status) status.textContent = 'Live list unavailable right now; showing the last known snapshot.';
    });
})();
