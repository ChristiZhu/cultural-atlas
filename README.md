# The Cultural Atlas

Desktop implementation of the existing [Figma design](https://www.figma.com/design/UhEArSCz5IP1o8K4rDrRR5/?node-id=0-1).

## Run

Serve `dist/` with any static HTTP server, e.g. `python3 -m http.server 4173 --directory dist`.
No dependencies or build step are required.

## Screens and interactions

- Homepage (`1:1358`): click the window to enter the city board (`1:3`). Reload starts here.
- Board: click the Guangzhou lettering or its landmark card to open the Guangzhou map. The whole original vector group lifts 8 design pixels over 300 ms on hover and gently scales down on press, without a blue flash.
- Guangzhou map: Frame 03 (`1:10306`) and Frame 04 (`1:10463`) share one SVG map, six markers, and independent panel/filter state. Collapse and expand the information panel with the edge control. Its original vector fill provides light pink hover/pressed feedback without extending outside its shape.
- Food, Architecture, and Craft each show their two matching markers. Only one filter can be selected. Clicking it again restores all six markers. The selection persists through panel toggles and navigation. All three outlines use a consistent 1.5px non-scaling vector stroke with smooth joins. Selected buttons change only their background to `#84C9E1` and stroke to `#206EB8`; the extra expanded-panel status text is removed. The original compact filter-info label still displays ALL, FOOD, ARCHITECTURE or CRAFT while collapsed.
- Home returns to the board. Icon Library opens Frame 07 (`1:2238`), whose Home and Map links return to the board and map respectively. Other library functionality is outside this step.
- The main map and all six symbols share one zoom/pan transform. Wheel and trackpad zoom range from 65% to 400%; dragging pans. The original compact Guangzhou overview shows a live rectangle calculated from the inverse camera transform. The ocean keeps its blue base with slow, subtle light movement.
- Each icon lifts, scales slightly and glows on hover. Clicking focuses it and displays the original Frame 06 (`1:2104`) callout design, using only that item's existing name. Clicking the map background or pressing Escape closes the callout. Filter changes close a callout if its item becomes hidden.
- Go to Front Cover opens only the two completed designs: Canton Tower (`1:9511`) and Guangzhou Painted Porcelain (`1:9587`). Other item destinations are disabled; no placeholder cultural pages exist. Cover Home and Icon Library links reuse the existing navigation, and browser Back restores the map camera and filter.
- Top-right navigation retains the original vector lettering at 75% of its former visible size, with at least 44px-high click targets.
- Navigation provides underline hover/focus and pressed feedback. Buttons support keyboard activation. Browser history, focus management, and reduced-motion preferences are supported.

## Structure

- `dist/index.html`: semantic screen containers, navigation and accessible controls.
- `dist/styles/main.css`: full viewport surface, shared proportional artwork sizing and screen crossfade.
- `dist/styles/map.css`: map states, aligned hit areas, filter and navigation feedback.
- `dist/scripts/scenes.js`: screen definitions, trusted vector loading and shared helpers.
- `dist/scripts/app.js`: navigation, asset readiness, focus, history and reduced-motion handling.
- `dist/scripts/guangzhou.js`: map category/panel/selection state, live overview projection, marker layers and the two allowed cover destinations.
- `dist/scripts/map-camera.js`: bounded zoom, pan gestures, keyboard navigation, focus animation and the shared world transform.
- `dist/assets/`: original Figma SVG exports stored locally, with outlined original lettering and no embedded raster images. Covers live in `assets/covers/`; the dynamic callout uses the original background/arrow SVGs and original Ugly Dave font.
- `dist/assets/map/guangzhou.svg`: original map geometry and symbols from Frame 03, with its panel and Frame 04 compact controls tagged for interaction. `data-category` and `data-item` identify each symbol; the map itself is never duplicated or replaced on state changes.

## Visual fidelity

Original SVG paths preserve the illustrated composition, custom lettering, textures, rotations and shadows. Navigation labels also use original Figma outlines. Accessible controls and descriptions accompany the artwork.

The screen surface occupies the full browser viewport. A shared 1512 × 982 coordinate system initially fits all artwork uniformly without cropping or stretching. User-controlled map zoom and pan then move the map and its symbols within the viewport together. Main compositions remain centered, while map panel layers and their controls dock to the far left and navigation docks to the right. The same scaling and viewport-edge rules can be reused by later frames. Extra viewport space extends the original frame edge color: homepage `#fff7cd`, board `#f4ebd9`, map `#84c9e1`, and library `#ffeff9`. No black border is added. All hit areas share the artwork coordinate system.

Later screens can add a semantic section and scene definition using the shared navigation. Additional map items can use the existing category/item attributes without creating additional map pages.

## Validation

Locally checked in Chrome after the interaction refinements: card-group lift/press without blue feedback; exact filter background/stroke and unchanged lettering; no extra expanded status text, with the original collapsed filter-info status preserved; contained pink edge controls; full viewport and left docking at 1512 × 982, 1920 × 1080, 2560 × 1440 and 1440 × 1080; both board entry targets; all six markers and all three filters; toggle-to-all-items; filter persistence through collapse, expansion and library navigation; Home/Map links; keyboard activation; browser Back; reduced motion; no cropping at 1512 × 982 and 1920 × 1080; no browser errors. Screenshots were compared with the Figma artwork, including settled collapsed states.

### Map exploration verification

Chrome desktop checks cover pointer zoom and drag, both zoom limits, synchronized markers, minimap movement and zoom size, hover and selection for all six icons, long callout names, both original cover screens, disabled destinations for the four unfinished items, preserved filters/panel state, browser Back, smaller navigation, viewport resizing and reduced motion. Keyboard: focus the map and use arrow keys to pan, +/- to zoom, 0 to reset; Enter/Space selects a focused icon and Escape closes its callout. No browser errors were observed.
