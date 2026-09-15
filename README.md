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
- `dist/assets/`: exact original Figma PNG exports, stored locally without expiring URLs.

## Fidelity and scope

The two static illustrated compositions are original Figma exports, including custom lettering, texture, rotation, and shadows. They remain at their original 1512 × 982 aspect ratio, fitting within the desktop viewport without cropping or stretching. Surrounding space uses the homepage paper color. Lettering is embedded in the artwork rather than substituted with fallback fonts; accessible descriptions provide equivalent screen context. Raster exports have a native resolution of 1512 × 982.

Click the window, or focus it and press Enter/Space, to crossfade to the board in 600 ms. Reduced-motion preferences skip the animation. Browser Back returns to the window; reload always starts at the window. No city/map/archive interactions exist yet.

Later screens can add a semantic section and a scene definition, reusing navigation. When individual board items need animation, export their original Figma layers separately and place them in the shared Figma coordinate system. Do not alter the artwork to approximate it in CSS.
