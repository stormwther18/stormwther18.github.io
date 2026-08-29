# Personal homepage — Xinyi Hong

Plain static site: hand-written HTML + one stylesheet + one script. No build step,
no framework, no dependencies. Pushing to `main` deploys it to GitHub Pages.

## Files

```
index.html              English homepage
index_cn.html           Chinese homepage (same structure, translated)
css/style.css           all styling; design tokens live in :root at the top
js/main.js              publication filter, sidebar scroll-spy, BibTeX modal
assets/img/avatar.jpg   profile photo
assets/img/pub/*.svg    publication thumbnails (placeholders — swap for real figures)
assets/favicon.svg      favicon
```

## Editing

**Change the palette** — edit the tokens at the top of `css/style.css`. `--accent`
(`#0056b3`) is the only strong colour on the page; changing it re-themes the whole
site. The palette is white-only — there is no dark mode, by design.

**Fonts** — one family throughout: Inter for Latin, Noto Sans SC for Chinese, both
from Google Fonts and both declared in `--font-ui`. Google serves Noto Sans SC as
unicode-range subsets, so a page only downloads the ranges it actually uses.

**Add a publication** — copy an existing `<article class="pub-item">` block in both
`index.html` and `index_cn.html`. The `data-tags` attribute controls which filter
buttons show it; `all` must always be present. Add a matching entry to
`window.CITATIONS` at the bottom of the file if you want a BibTeX button, and point
`data-paper` at its key.

**Add a news item** — copy a `<article class="news-card">` block. Put `pinned` in the
class list to give it the accent-tinted treatment. Newest goes first.

**Add a section** — add a `<section id="...">` in `main`, plus a matching
`<a href="#..." class="nav-item">` in the sidebar. Scroll-spy picks it up automatically.

**Publication figures** — the three SVGs under `assets/img/pub/` are abstract
placeholders. Replace them with real figures (a 380×238-ish crop works best) and
update the `src` in both HTML files.

## Local preview

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

`.github/workflows/deploy.yml` uploads the repository root to GitHub Pages on every
push to `main`. Repository → Settings → Pages → Source must be set to
**GitHub Actions**.
