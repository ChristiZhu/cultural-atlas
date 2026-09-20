# The Cultural Atlas

Desktop implementation of the existing [Figma design](https://www.figma.com/design/UhEArSCz5IP1o8K4rDrRR5/?node-id=0-1).

## Run

Serve `dist/` with any static HTTP server, e.g. `python3 -m http.server 4173 --directory dist`.
No dependencies or build step are required.

## Screens and interactions

- Homepage (`1:1358`): click the window to enter the city board (`1:3`). Reload starts here.
- Board: each original paired city card opens its own map (Guangzhou, Beijing, Shanghai, Dehong, or Taiyuan; the original board label remains Shanxi). The whole original vector group lifts 8 design pixels over 300 ms on hover and gently scales down on press, without a blue flash.
- Guangzhou map: Frame 03 (`1:10306`) and Frame 04 (`1:10463`) share one SVG map, six markers, and independent panel/filter state. Collapse and expand the information panel with the edge control. Its original vector fill provides light pink hover/pressed feedback without extending outside its shape.
- Food, Architecture, and Craft each show their two matching markers. Only one filter can be selected. Clicking it again restores all six markers. The selection persists through panel toggles and navigation. All three outlines use a consistent 1.5px non-scaling vector stroke with smooth joins. Selected buttons change only their background to `#84C9E1` and stroke to `#206EB8`; the extra expanded-panel status text is removed. The compact header stays FILTER; there is no separate current-category label.
- Home returns to the board. Icon Library opens Frame 07 (`1:2238`), whose Home and Map links return to the board and map respectively. The library now filters the original nine Guangzhou icons by city and carries the filter and icon-selection state through the Figma flow.
- The main map and all six symbols share one zoom/pan transform. Wheel and trackpad zoom range from 65% to 400%; dragging pans. The original compact Guangzhou overview shows a live rectangle calculated from the inverse camera transform. The ocean keeps its #84C9E1 blue base with two irregular procedural SVG ripple fields moving slowly on the compositor. The SVG viewBox extends to the entire browser viewport; the old Figma frame clip is removed so panned artwork paints all the way to either edge.
- All six cultural markers retain the original Frame 03 dimensions, relative proportions and geographic positions. Each icon lifts slightly on hover and shows the latest Frame 06 (`1:2104`) blue name card. The shared SVG text component centers yellow lettering with a dark outer stroke, measures longer names and wraps when necessary. Cards render at 80% of their former size, with a clear gap above the hovered icon that accounts for the icon’s lift and map zoom. They remain visible over the icon/card and fade after leaving. Their hit area excludes the transparent export margins so they cannot obstruct icon clicks. Escape or dragging closes the card; filtering out its item also closes it.
- Clicking Canton Tower or Guangcai Porcelain opens its completed front cover (`1:9511` or `1:9587`) in a native modal dialog over the exact current map. Clicking the other four markers does nothing. The old Go to Front Cover button is removed; no placeholder cultural pages exist. Background navigation and all map interactions are inert while the dialog is open. Exit clears the marker label/selection and restores focus to the map region; only deliberate pointer movement can show a label again. The map is dimmed, its ocean animation paused, and its camera/filter/panel state retained. Click outside the book, press Escape or use browser Back to close it.
- Frame 04's Specific Location overview and Filter Info are docked together at the lower-left viewport edge, independent of map pan/zoom. One original outlined Cultural Atlas logo is shared by the map and subsequent screens at the upper-left viewport edge; it is hidden on the window and city board.
- Top-right navigation retains the original vector lettering at 75% of its former visible size, with at least 44px-high click targets.
- Navigation provides underline hover/focus and pressed feedback. Buttons support keyboard activation. Browser history, focus management, and reduced-motion preferences are supported.


## Archive book

- A single reusable `archive.js` controller holds front cover, four spreads, and back cover states inside one dialog. Canton Tower uses the original Figma frames `1:8213`, `1:7236`, `1:8068`, `1:8359` and `1:10235`.
- Click the front cover to open; right and left page hit areas turn forward/backward. The exact Figma `69:7`, `69:8`, and `69:54` interaction icons follow the pointer as Next, Previous and Exit. They do not receive pointer events. Click the back cover to flip back to the front without closing the dialog.
- The transparent outer stage stays fixed. Figma source covers use a 645 × 825.05 paper silhouette; all four spreads use 1290 × 825.05 paper at the same top edge and a shared central spine. Each page retains its original kraft artwork; no extra board remains behind the closed book. Covers slide to the right page before a 650 ms opening turn. Final closing turns finish before the separate 360 ms slide to center; back-to-front flips take 700 ms. Ordinary turns animate only a fixed-size two-sided sheet. Animations run sequentially using transforms, with decoded artwork preloaded. Reduced-motion users get immediate state changes.
- Original vector page exports retain outlined lettering and the photographs embedded in Figma. The archive frames’ own backdrop, map silhouette and navigation were removed so the live map remains behind the book. The Figma source paper geometry is normalized and re-exported as complete vector sheets, including each spread’s original colors and texture. The covers scale uniformly to the matching single-page dimensions. Only the page being turned moves; opening reveals the right page beneath the cover, and closing clears the spread before the centered-cover slide.
- Porcelain currently has its original cover only. No unrelated interior pages or placeholder content have been added.
- Compact fixed +/− buttons share the existing map camera, 65–400% zoom limits and smooth zoom animation. The collapse/expand controls are vertically centered without changing their horizontal placement.

## Structure

- `dist/index.html`: semantic screen containers, navigation and accessible controls.
- `dist/styles/main.css`: full viewport surface, shared proportional artwork sizing and screen crossfade.
- `dist/styles/map.css`: map states, aligned hit areas, filter and navigation feedback.
- `dist/scripts/scenes.js`: screen definitions, trusted vector loading and shared helpers.
- `dist/scripts/app.js`: navigation, asset readiness, focus, history and reduced-motion handling.
- `dist/scripts/guangzhou.js`: map category/panel/selection state, live overview projection, marker layers and the two allowed cover destinations.
- `dist/scripts/map-camera.js`: bounded zoom, pan gestures, keyboard navigation, reset animation and the shared world transform.
- `dist/scripts/name-card.js`: shared outlined hover labels, text fitting, pointer retention and fade timing.
- `dist/scripts/ocean.js`: procedural SVG ocean texture layers; CSS controls their slow motion.
- `dist/assets/`: original Figma SVG exports stored locally, with outlined original lettering. Map/intro artwork is vector; archive photographs retain their source images. Covers live in `assets/covers/`; the dynamic callout uses the latest original card silhouette and Ugly Dave font.
- `dist/assets/map/guangzhou.svg`: original map geometry and symbols from Frame 03, with its panel and Frame 04 compact controls tagged for interaction. `data-category` and `data-item` identify each symbol; the map itself is never duplicated or replaced on state changes.

## Visual fidelity

Original SVG paths preserve the illustrated composition, custom lettering, textures, rotations and shadows. Navigation labels also use original Figma outlines. Accessible controls and descriptions accompany the artwork.

The screen surface occupies the full browser viewport. A shared 1512 × 982 coordinate system initially fits all artwork uniformly without cropping or stretching. User-controlled map zoom and pan then move the map and its symbols within the viewport together. Main compositions remain centered, while map panel layers and their controls dock to the far left and navigation docks to the right. The same scaling and viewport-edge rules can be reused by later frames. Extra viewport space extends the original frame edge color: homepage `#fff7cd`, board `#f4ebd9`, map `#84c9e1`, and library `#ffeff9`. No black border is added. All hit areas share the artwork coordinate system.

Later screens can add a semantic section and scene definition using the shared navigation. Additional map items can use the existing category/item attributes without creating additional map pages.

## Validation

Locally checked in Chrome after the interaction refinements: card-group lift/press without blue feedback; exact filter background/stroke and unchanged lettering; no extra expanded status text, with the original collapsed filter-info status preserved; contained pink edge controls; full viewport and left docking at 1512 × 982, 1920 × 1080, 2560 × 1440 and 1440 × 1080; both board entry targets; all six markers and all three filters; toggle-to-all-items; filter persistence through collapse, expansion and library navigation; Home/Map links; keyboard activation; browser Back; reduced motion; no cropping at 1512 × 982 and 1920 × 1080; no browser errors. Screenshots were compared with the Figma artwork, including settled collapsed states.

### Map exploration verification

Chrome desktop checks cover actual painted content near both viewport edges, 1512 × 982 through 2560 × 1440 viewport sizing, pointer zoom and drag, fixed minimap positioning, hover retention/dismissal and text bounds for all six names, direct navigation to both cover screens, no-op clicks for unfinished destinations, preserved category and panel state, browser Back, keyboard navigation and reduced motion. Archive checks additionally cover every spread, both turn directions, back-to-front reset, inert background, outside/Escape/history closing, and unchanged camera/filter state. No browser errors were observed. Keyboard: focus the map and use arrow keys to pan, +/- to zoom, 0 to reset; Enter/Space opens a completed cover. In the archive, arrow keys turn pages and Escape closes the modal.

The Icon Library navigation keeps its original button styling and size, with a 36-design-pixel horizontal gap. Refinement checks assert invariant transparent stage and spread hit-area bounds through all animation phases, opening/closing phase order, Figma cursor direction and placement, clean archive exit, deliberate rehover and reduced-motion behavior.


## Icon library and Figma showcase flow

- Frame 07 (`1:2238`) uses the current original vector tray, city tabs, text, nine Guangzhou icons and empty slots. ALL and Guangzhou share those nine icons. Beijing, Shanghai, Dehong and Shanxi have empty collections; no new cultural artwork is invented. The Figma label is Shanxi, so the site retains that spelling.
- Only one city is active, using the original `#206EB8` fill and white lettering; inactive tabs retain `#A4D4E5` and black lettering. Collection changes use a short 320 ms slide/fade, cancel safely on fast clicks, and respect reduced motion.
- Frame 08 (`1:2437`) carries the same available set into the original 92-unit card positions. The ninth source icon is carried from 07 into the corresponding ninth slot. Cards toggle independently: default pink and dark artwork, light-blue hover, exact blue/white selected treatment. No selection cap or generation requirement is imposed in this step. Blank Figma grid slots remain decoration, never selectable placeholders.
- `library-state.js` owns `selectedCity` and `selectedIcons`, publishes snapshots, and validates icon membership. ALL/Guangzhou transitions retain selections; changing to an empty city removes unavailable selections. State persists through application navigation and browser Back/Forward, without duplicating screens for combinations of selected icons.
- The existing navigation controller also connects 08 → 09 Creating → 10 Preview → 11 Save → 12 Saved. These later screens display the supplied Figma example; no pattern-generation algorithm runs. Redo replays the example, Back returns to selection, and Save downloads the checked-in Figma pattern SVG before showing confirmation. Confirmation Exit returns to Save; Home returns to the city board. Global Map/Home navigation remains shared with the existing site.
- `icon-library.js` binds semantic HTML buttons to the tagged original Figma SVG layers. `library.css` changes only interaction states and respects the existing uniform desktop scaling. No duplicate routing system or external dependencies were added.

Library verification covers all cities, empty sets, rapid filter changes, exact active colors, hover vs selected states, toggling and multi-select, city/selection persistence through routes and history, Next/Back/Redo/Save and the actual example download, global navigation, wide desktop fit, reduced motion, and browser errors.

## Shared city maps

`city-map.js` owns the shared panel, filter, hover and map-camera behavior. `city-data.js` supplies each city’s assets, map bounds, minimap projection and available archives. One camera and one set of surface listeners are reused; each city’s zoom, pan, filter and collapse state is saved independently. Navigation history records the city, and the shared library’s Map link returns to it.

Additional original Figma frames: Beijing `181:5`, Shanghai `189:5`, Dehong `194:5` (the supplied duplicate Shanghai link was resolved from the file), Taiyuan `194:150`. Each has six untouched vector marker drawings, preserving its original size and position. `scripts/prepare-cities.py` derives the live assets from `design-sources/cities/`, reuses the corrected Guangzhou filter/backward controls, and fits each complete city into the existing minimap without stretching. The map markers remain distinct from the library’s original nine pattern glyphs; no new archive designs or pattern glyphs are invented.

Validation: `node tests/city-map.mjs` checks city switching, exact camera restoration, one listener set, wheel zoom, wide viewport coverage, vector-only markers and minimap aspect ratios. Desktop UI checks covered all five board routes, filtering and deselection, map/library return, collapsed-state restoration, wheel and drag, name cards, and both existing Guangzhou archives.
