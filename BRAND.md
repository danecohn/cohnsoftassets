# Cohnsoft brand guide

**Cohnsoft** is one company. AltStack and Artemis Softworks are now part of it. Founded by **Demetria Althea Cohn** (online: **Demie Althea Cohn**).

> Software in calm, good company, after dark.

## Identity

The mark is a white **C** that thins to two sharp points, so it also reads as a **crescent moon**, with a single four-point **star** beside it, on a **pink** tile. A pointed-arch glint of light crosses the top of the tile. It is quiet, a little gothic, and friendly. The wordmark is **cohnsoft**, lowercase, in Cohn Sans Bold: "cohn" in ink (or bone white on dark) and "soft" in Cohnsoft Pink.

| Asset | Use |
|---|---|
| **App icon** `logos/app-icon/` | Dock, launchers, stores. Has the soft margin and shadow of a desktop icon. |
| **Mark** `logos/mark/` | Favicons, avatars, small UI. Fills its canvas. Drawn natively at 16, 32, 48, 64, 128, 256, 512 and 1024 px, so small sizes stay crisp. |
| **Glyph** `logos/glyph/` | The C and star alone, in pink, white or black, for any background or one-colour print. |
| **Lockup** `logos/lockup/` | Mark + wordmark, horizontal or stacked; light and dark. The default signature. |
| **Pixel mark** `logos/pixel/` | The 64-pixel version, made in AltStack Sprite, for retro contexts and games. |
| **Social card, wallpapers** | `logos/social/`; `logos/wallpaper/` (night is the default, dawn is the light alternative). |

Every raster logo has an editable Sprite document in `source/` (`.asprite.json`) and a vector twin (`.svg`) where it matters.

**Clear space:** keep at least the height of the star free on all sides; one tile-height around the lockup is better.
**Minimum size:** mark 16 px; lockup 96 px wide; wordmark alone 64 px wide.
**Do not:** recolour the tile, stretch or rotate the mark, add outlines or extra shadows, put the lockup on busy imagery, set "soft" in another colour, or typeset "cohnsoft" in another font.

## Colour

One pink; everything else is a warm, plum-tinted neutral. See `tokens.json` and the contrast table in `index.html`.

| Name | Hex | Notes |
|---|---|---|
| **Cohnsoft Pink** (Pink 500) | `#ff0058` | The brand colour. Logo, large display type, filled controls (white text only at 18 px bold and up: 3.9:1). |
| Pink 600 | `#d6004a` | Button fills with white text (5.3:1); body-size pink text on light (5.2:1). |
| Pink 700 | `#a8003a` | Pink **text and links** on light (7.5:1). |
| Pink 400 / 300 | `#ff4d86` / `#ff7aa6` | Pink on dark surfaces (text, links, focus). |
| Pink 900 | `#3d0016` | The deep wine used for vignettes and shadows. |
| Ink / Graphite | `#17101a` / `#6b5d68` | Text and secondary text on light. |
| Bone / Paper | `#f6f1f4` / `#fffbfd` | Light background and surface. |
| Night / Night Raised | `#120a14` / `#1e1422` | Dark appearance. Night is where Cohnsoft is most at home. |

## Goth, softly

A quiet streak, not a costume. It lives in a few repeatable details:

- **Night first.** Dark, plum-black surfaces with a pink glow low in the frame; light mode is "dawn" (bone and rose), the same world a few hours later.
- **The pointed arch.** The one gothic shape: the highlight on the tile, the row of arches along the wallpaper's bottom edge, `.cs-lancet` for avatars and hero images.
- **One star.** The four-point star is the accent: a glint on the mark, tiny stars in the sky, `.cs-star` bullets. Use sparingly.
- **A crescent.** Faint, large, in wallpapers and empty states.
- **Candle-warm light and thin rims.** Highlights lean rose, edges are fine hairlines, shadows are wine, never grey.
- **Never:** skulls, bats, spikes, blackletter body text, dripping effects. Stay friendly, readable and calm. Accessibility rules beat atmosphere.

## Typeface: Cohn Sans

An original typeface drawn for Cohnsoft (`fonts/`, Regular and Bold, TTF and WOFF2, SIL OFL 1.1). The clean, open feel of a modern system sans, plus reading aids from dyslexia-friendly faces: easily confused letters look different (b d p q, I l 1, O 0), bottoms are drawn heavier so each letter sits on the line, apertures are open, spacing is generous. Nothing was traced from another typeface. Use `css/cohnsans.css`. Fall back to the system font; `data-font="system"` is a switch for people who prefer it. A display cut with a subtle gothic flourish is a possible later addition.

## Design language: Golden Gate

Software that feels at home on a Mac and travels well to Windows and Linux. Inspired by the layered, translucent look of modern macOS; no third-party artwork, fonts or marks are used.

1. **Material over decoration.** Bars and sheets are frosted glass (18 px blur, saturated) over the wallpaper; content sits on quiet surfaces.
2. **One tint.** Cohnsoft Pink marks selection, focus and the primary action. Everything else is neutral.
3. **Soft geometry.** 8 px controls, 12 px groups, 22 px sheets.
4. **Depth from light.** A lit top edge, a darker lower edge, long soft shadows. Never hard black outlines.
5. **Accessible.** 4.5:1 text, a 3 px focus ring, reduced motion and reduced transparency respected, forced-colors supported.

`css/goldengate.css` implements this (tokens, wallpaper, glass toolbar, sidebar, sheet, card, grouped list, buttons, field, segmented control, switch, badge, lancet and star helpers).

## Voice and credits

Plain, warm, specific. Say what the software does; skip hype.
Standard credit: **A product of Cohnsoft.**  Founder line: **Cohnsoft was founded by Demetria Althea Cohn.**
Product names (AltStack Mail, AltStack Game Producer, Sprite, Box, and so on) stay as product identities until renamed; Cohnsoft is the company behind them. Keep upstream and third-party notices intact: Godot, Blender, BeepBox and the like are credited by their own licences.

## Provenance

Logos are Sprite documents: AltStack Sprite's model, saved as `.asprite.json` and exported with its PNG engine. Shapes are generated procedurally (`tools/hd.js`: signed-distance geometry, so each size is drawn natively and never scaled), then opened in Sprite. Sizes beyond Sprite's 512-pixel document limit (1024 px icons, the social card, wallpapers) are drawn at full size and written with Sprite's PNG encoder. Rebuild everything: `node tools/build.js && node tools/site.js` (macOS also produces the `.icns`). The font: `PYTHONPATH=<fonttools> python3 fonts/build_font.py`.
