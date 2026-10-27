# vigiltechassets

The home of every VigilTech brand asset: logos, app icons, wallpapers, the Vigil Sans typeface and the Golden Gate design system.

**Free software.** Code and artwork are under the GNU GPL v3 (`LICENSE`); the Vigil Sans typeface is under the SIL OFL 1.1. VigilTech makes Christian technology, Catholic at its core: see BRAND.md.

Open **[index.html](index.html)** (any static server, or double-click) for the brand portal, and read **[BRAND.md](BRAND.md)** for the rules.

```
logos/        mark, app-icon, glyph, lockup, pixel, social, wallpaper (night + dawn)   (PNG + SVG)
icons/        vigiltech.icns, vigiltech.ico, favicons, apple-touch-icon
fonts/        Vigil Sans Regular + Bold (TTF, WOFF2), source (build_font.py), OFL.txt
css/          goldengate.css (design system), vigilsans.css (@font-face)
source/       editable AltStack Sprite documents (.asprite.json)
sounds/       chime, bells, a Dorian chant-style piece, interface sounds (WAV)
tokens.json   colour, radii, type tokens
tools/        build.js, hd.js, svg.js, site.js, art.js + the Sprite engine modules used to export
```

Use from a website:

```html
<link rel="stylesheet" href="https://raw.githack.com/danecohn/vigiltechassets/main/css/vigilsans.css">
<link rel="stylesheet" href="https://raw.githack.com/danecohn/vigiltechassets/main/css/goldengate.css">
<body class="cs">…</body>
```
(or copy `css/`, `fonts/` and `logos/` into your project).

Licences: code and tooling GPL-3.0-only (see LICENSE; `tools/sprite/` is AltStack Sprite, GPL-3.0). Vigil Sans: SIL Open Font License 1.1 (`fonts/OFL.txt`). The VigilTech name and logos are VigilTech's marks: use them to refer to VigilTech and its products, not to suggest endorsement.
