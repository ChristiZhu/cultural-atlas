# The Cultural Atlas

Desktop implementation of two existing Figma frames:

- `01-Homepage` — node `1:1358`
- `02-board` — node `1:3`

Source: https://www.figma.com/design/UhEArSCz5IP1o8K4rDrRR5/?node-id=0-1

## Run

Serve `dist/` with any static HTTP server, e.g. `python3 -m http.server 4173 --directory dist`.
No dependencies or build step are required.

## Structure

- `dist/index.html`: semantic screen containers and the accessible window button.
- `dist/styles/main.css`: proportional desktop canvas, Figma window bounds, and crossfade.
- `dist/scripts/scenes.js`: screen definitions and shared helpers.
- `dist/scripts/app.js`: navigation, image readiness, focus, and reduced-motion handling.
- `dist/assets/`: exact original Figma SVG exports, stored locally without expiring URLs.

## Fidelity and scope

The two illustrated compositions are original Figma SVG exports, including custom lettering, texture, rotation, and shadows. Both contain real vector paths with no embedded bitmap images; lettering is outlined to preserve the original fonts. Accessible descriptions provide equivalent screen context. The 1512 × 982 coordinate system scales uniformly to cover the entire desktop viewport, with centered edge cropping when the viewport has a different aspect ratio. No black frame border or letterboxing is added. The interactive window shares that coordinate system so its hit area stays aligned at every desktop size.

Click the window, or focus it and press Enter/Space, to crossfade to the board in 600 ms. Reduced-motion preferences skip the animation. Browser Back returns to the window; reload always starts at the window. No city/map/archive interactions exist yet.

Later screens can add a semantic section and a scene definition, reusing navigation. When individual board items need animation, export their original Figma layers separately and place them in the shared Figma coordinate system. Do not alter the artwork to approximate it in CSS.
