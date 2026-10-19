# Cultural Atlas localization

The published site is still static HTML/CSS/JavaScript. There is no runtime build
step or translation service. This update is local-only; no deployment is required
to preview it.

## Content

- `dist/locales/ui-zh.js`: interface strings and consistent cultural-object names.
- `artwork.json` in this directory: reviewed English/Chinese pairs for outlined
  Figma lettering, with original file, node index, text bounds and typography role.
- `scripts/prepare-localization.py`: compile this source into Chinese SVG paths.
  Authoring prerequisite: Python `fonttools[brotli]`. Run from the project root:
  `python3 scripts/prepare-localization.py`.
- `dist/locales/artwork-zh.json`: UI vector translations and archive resource index.
- `dist/locales/artwork-zh/*.json`: translations loaded only when an archive is used.

The original English SVGs, illustrations, photographs and paper geometry are not
rewritten. Replacements fit the original text areas. Figma outside-stroke paths
become restrained Chinese outlines. Text split across separate decorative paper
letters has explicit per-layer translations. Numeric labels, archive identifiers,
coordinates, source credits, CULTURAL ATLAS and #CulturalAtlasPatterns retain their
identity. Translations reproduce the source research, including its qualifications;
localization does not independently revise historical claims.

If Figma SVGs are re-exported, review their text-node indices and bounds before
regenerating. Never infer that a node named after a city is text: it may be map
geometry. Keep source captions and headings distinct even when their parent group
has one shared text name.

## Fonts

Self-hosted fonts and accompanying OFL licenses are in `dist/assets/fonts/`:

- Xiaolai (`Atlas Hand SC` / `atlas-note-sc`): rounded handwritten notes and invitations.
- ZCOOL KuaiLe (`Atlas Display SC` / `atlas-play-sc`): playful headings, filters and navigation.
- Noto Sans SC (`Atlas Sans SC`): compact labels and navigation.
- Russo One: the new English About item matches the existing vector navigation.

Xiaolai is from [lxgw/kose-font v3.126](https://github.com/lxgw/kose-font/releases/tag/v3.126); ZCOOL KuaiLe is from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/zcoolkuaile). Both are self-hosted WOFF2 subsets with their OFL texts included. The existing Noto Sans SC font handles long paragraphs and fallback glyphs. English
fonts remain unchanged. Archive translations are compiled to paths, so image-based
page turns do not depend on font loading and remain crisp at any desktop scale.

## Behavior

`dist/scripts/i18n.js` owns one `en`/`zh` state, stored as
`cultural-atlas-language` in localStorage. Default is English, without browser-locale
inference. Switching language changes presentation only: city IDs, icon IDs,
selection, pattern seeds, palettes, download data, camera position and page-turn
state remain independent.

`dist/scripts/navigation.js` supplies both language controls, the entrance hint,
and the shared About placeholder. Replace its About handler when the designed
page becomes available. Background controls remain inert under the archive dialog.

## Verification

Serve `dist/` locally, including a `/cultural-atlas/` project-path mount. Run:

- `python3 tests/localization-assets.py` (requires fontTools).
- `node tests/localization-browser.cjs` (requires Playwright and local Chrome).

The browser test uses port 4173 by default; set `ATLAS_PREVIEW_URL` to override.
It checks language persistence and reversal, previously cached map artwork,
filter/collapse state, About, every archive face, fixed book dimensions, generation,
recoloring and an actual PNG download. Screenshots go to ignored `work/localization/`.

## Chinese optical layout

Every translated source row may have a `layout` record: `role` (`hand`, `display`,
`sans`), `size`, `lineHeight`, `box`, `align`, `valign`, `rotation`, and optional
`solid` / `hideOutline`. These are locale-only; the original English text bounds
and paths are retained. Paper angles come from the original exported paper
transforms or the original text contours. They are baked into the Chinese paths,
so runtime state changes and page turns do not change their orientation.

Chinese wrapping uses its own text, keeps closing punctuation with preceding
characters, moves opening punctuation onto the following line, and avoids a
single orphan character at a paragraph end. Paragraphs use natural leading and
never stretch to fill the English text block. The compiler writes an ignored
`work/localization/typography-audit.json` with sizes and line breaks for review.

The homepage signature and entrance hint are both 30 design units lower. This
shared placement adjustment and the smaller board language control apply to both
languages; other English artwork and typography are unchanged.

`prepare-chinese-fonts.py` reduces the two new fonts to the reviewed site
vocabulary (about 440 KB combined). Re-run it before the artwork compiler when
adding translations. Missing glyphs fall back to the local Noto Sans SC / Xiaolai
fonts; the compiler fails if no font contains a required character.

Reviewed title line breaks may use `layout.lines`. Existing Chinese Figma title
paths use `restyle: true` so they receive the Chinese typography treatment while
remaining untouched in English mode.

`node tests/typography-browser.cjs` additionally checks four desktop viewports,
all five map panels, six city selected states, solid filter ink, equal navigation
font sizes, and hidden Chinese labels after restoring English.
