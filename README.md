# cohnsoftassets

The home of every Cohnsoft brand asset: logos, app icons, wallpapers, the Cohn Sans typeface and the Golden Gate design system.

Open **[index.html](index.html)** (any static server, or double-click) for the brand portal, and read **[BRAND.md](BRAND.md)** for the rules.

```
logos/        mark, app-icon, glyph, lockup, pixel, social, wallpaper (night + dawn)   (PNG + SVG)
icons/        cohnsoft.icns, cohnsoft.ico, favicons, apple-touch-icon
fonts/        Cohn Sans Regular + Bold (TTF, WOFF2), source (build_font.py), OFL.txt
css/          goldengate.css (design system), cohnsans.css (@font-face)
source/       editable AltStack Sprite documents (.asprite.json)
tokens.json   colour, radii, type tokens
tools/        build.js, hd.js, svg.js, site.js, art.js + the Sprite engine modules used to export
```

Use from a website:

```html
<link rel="stylesheet" href="https://raw.githack.com/danecohn/cohnsoftassets/main/css/cohnsans.css">
<link rel="stylesheet" href="https://raw.githack.com/danecohn/cohnsoftassets/main/css/goldengate.css">
<body class="cs">…</body>
```
(or copy `css/`, `fonts/` and `logos/` into your project).

Licences: code and tooling GPL-3.0-only (see LICENSE; `tools/sprite/` is AltStack Sprite, GPL-3.0). Cohn Sans: SIL Open Font License 1.1 (`fonts/OFL.txt`). The Cohnsoft name and logos are Cohnsoft's marks: use them to refer to Cohnsoft and its products, not to suggest endorsement.
