# The Cultural Atlas

Desktop implementation of the existing [Figma design](https://www.figma.com/design/UhEArSCz5IP1o8K4rDrRR5/?node-id=0-1).

## Run

Serve `dist/` with any static HTTP server, e.g. `python3 -m http.server 4173 --directory dist`.
No dependencies or build step are required.

## Screens and interactions

- Homepage (`1:1358`): click the window to enter the city board (`1:3`). Reload starts here.
- Board: click the Guangzhou lettering or its landmark card to open the Guangzhou map. The whole original vector group lifts 8 design pixels over 300 ms on hover and gently scales down on press, without a blue flash.
- Guangzhou map: Frame 03 (`1:10306`) and Frame 04 (`1:10463`) share one SVG map, six markers, and independent panel/filter state. Collapse and expand the information panel with the edge control. Its original vector fill provides light pink hover/pressed feedback without extending outside its shape.
- Food, Architecture, and Craft each show their two matching markers. Only one filter can be selected. Clicking it again restores all six markers. The selection persists through panel toggles and navigation. Selected buttons change only their background to `#84C9E1` and stroke to `#206EB8`; no separate filter-status text is displayed.
- Home returns to the board. Icon Library opens Frame 07 (`1:2238`), whose Home and Map links return to the board and map respectively. Other library functionality is outside this step.
- Navigation provides underline hover/focus and pressed feedback. Buttons support keyboard activation. Browser history, focus management, and reduced-motion preferences are supported.

## Structure

- `dist/index.html`: semantic screen containers, navigation and accessible controls.
- `dist/styles/main.css`: full viewport surface, shared proportional artwork sizing and screen crossfade.
- `dist/styles/map.css`: map states, aligned hit areas, filter and navigation feedback.
- `dist/scripts/scenes.js`: screen definitions, trusted vector loading and shared helpers.
- `dist/scripts/app.js`: navigation, asset readiness, focus, history and reduced-motion handling.
- `dist/scripts/guangzhou.js`: one map controller owning category and panel state.
- `dist/assets/`: original Figma SVG exports stored locally, with outlined original lettering.
- `dist/assets/map/guangzhou.svg`: original map geometry and symbols from Frame 03, with its panel and Frame 04 compact controls tagged for interaction. `data-category` and `data-item` identify each symbol; the map itself is never duplicated or replaced on state changes.

## Visual fidelity

Original SVG paths preserve the illustrated composition, custom lettering, textures, rotations and shadows. Navigation labels also use original Figma outlines. Accessible controls and descriptions accompany the artwork.

The screen surface occupies the full browser viewport. A shared 1512 × 982 coordinate system scales all artwork uniformly without cropping or stretching. Main compositions remain centered, while map panel layers and their controls dock to the far left and navigation docks to the right. The same scaling and viewport-edge rules can be reused by later frames. Extra viewport space extends the original frame edge color: homepage `#fff7cd`, board `#f4ebd9`, map `#84c9e1`, and library `#ffeff9`. No black border is added. All hit areas share the artwork coordinate system.

Later screens can add a semantic section and scene definition using the shared navigation. Additional map items can use the existing category/item attributes without creating additional map pages.

## Validation

Locally checked in Chrome after the interaction refinements: card-group lift/press without blue feedback; exact filter background/stroke and unchanged lettering; no status text; contained pink edge controls; full viewport and left docking at 1512 × 982, 1920 × 1080, 2560 × 1440 and 1440 × 1080; both board entry targets; all six markers and all three filters; toggle-to-all-items; filter persistence through collapse, expansion and library navigation; Home/Map links; keyboard activation; browser Back; reduced motion; no cropping at 1512 × 982 and 1920 × 1080; no browser errors. Screenshots were compared with the Figma artwork, including settled collapsed states.
