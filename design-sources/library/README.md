# Icon Library vectors

Source: Figma file `UhEArSCz5IP1o8K4rDrRR5`, frame `1:2238` (07), inspected September 22, 2026. The chooser retains frame `1:2437` (08).

`glyphs.json` preserves the nine existing library and chooser glyphs and fifteen newly exported Figma SVGs, including their Figma node IDs. No paths were redrawn. The new vectors were read through Figma's SVG export API because direct asset downloads timed out.

`ink-bounds.json` records rendered ink bounds in source coordinates. The preparation script translates each glyph into the center of a 92px cell, preserves its proportions, and caps oversized artwork at 84px. Filtered icons use the same slots with no gaps. The original tab artwork says **Shanxi**; its canonical city ID is **taiyuan**, matching the city map.

To regenerate:

1. Run `node scripts/measure-library.cjs` with Sharp available in `NODE_PATH`.
2. Run `python3 scripts/prepare-library.py`.

Measurement uses temporary pixels only to find ink bounds. All shipped library, chooser, and pattern artwork remains SVG. Existing nine pattern assets stay unchanged. Newly selected silhouettes use the existing blue cell color for their negative-space details, so white selected ink stays legible.
