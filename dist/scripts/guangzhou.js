import { loadArtwork } from './scenes.js';
import { createMapCamera } from './map-camera.js';
import { createNameCard } from './name-card.js';
import { createOcean } from './ocean.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const geography = { x: 483, y: 123, width: 617.000244, height: 820.00061 };
const destinations = Object.freeze({ 'Canton Tower': 'canton', 'Guangcai Porcelain': 'porcelain' });

/** One map, independent filter/panel state, and a camera shared by land and symbols. */
export function createGuangzhouMap(scene, { navigate }) {
  const state = { collapsed: false, category: null, selected: null };
  let ready, camera, viewportIndicator;
  createOcean(scene.querySelector('.map-ocean'));
  const markers = new Map();
  const filters = scene.querySelector('#map-filters');
  const collapse = scene.querySelector('#collapse-info');
  const expand = scene.querySelector('#expand-info');
  const itemList = scene.querySelector('#map-items');
  const status = scene.querySelector('#map-filter-status');
  const callout = scene.querySelector('#item-callout');
  const overview = scene.querySelector('#map-overview');
  const nameCard = createNameCard(callout, { onHide: () => { state.selected = null; for (const { element } of markers.values()) element.setAttribute('aria-expanded', 'false'); } });

  function updateCamera(view, visible, { rect, viewport, scale }) {
    // Invert the main camera, then project its visible area into the original mini map.
    if (viewportIndicator) {
      const mini = { x: 74, y: 803, width: 112, height: 145 };
      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
      const left = clamp((visible.x - view.x) / view.zoom, geography.x, geography.x + geography.width);
      const right = clamp((visible.x + visible.width - view.x) / view.zoom, geography.x, geography.x + geography.width);
      const top = clamp((visible.y - view.y) / view.zoom, geography.y, geography.y + geography.height);
      const bottom = clamp((visible.y + visible.height - view.y) / view.zoom, geography.y, geography.y + geography.height);
      const values = {
        x: mini.x + (left - geography.x) * mini.width / geography.width,
        y: mini.y + (top - geography.y) * mini.height / geography.height,
        width: Math.max(0, right - left) * mini.width / geography.width,
        height: Math.max(0, bottom - top) * mini.height / geography.height,
      };
      for (const [key, value] of Object.entries(values)) viewportIndicator.setAttribute(key, value);
    }
    if (!state.selected) { callout.hidden = true; return; }
    const bounds = markers.get(state.selected).bounds;
    const anchorX = rect.left - viewport.left + (view.x + (bounds.x + bounds.width / 2) * view.zoom) * scale;
    const anchorY = rect.top - viewport.top + (view.y + bounds.y * view.zoom) * scale;
    callout.hidden = anchorX < 0 || anchorX > viewport.width || anchorY < 0 || anchorY > viewport.height;
    callout.style.left = `${anchorX - 167.5 * scale * .8}px`;
    const hoverLift = (6 + bounds.height * .06) * view.zoom;
    callout.style.top = `${anchorY - (96 * .8 + 24 + hoverLift) * scale}px`;
  }

  function closeCallout() {
    state.selected = null;
    nameCard.hide();
    for (const { element } of markers.values()) element.setAttribute('aria-expanded', 'false');
  }
  function render() {
    scene.dataset.collapsed = String(state.collapsed);
    scene.dataset.category = state.category ?? 'all';
    filters.hidden = state.collapsed;
    filters.inert = state.collapsed;
    collapse.hidden = state.collapsed;
    expand.hidden = !state.collapsed;
    overview.hidden = !state.collapsed;
    status.hidden = !state.collapsed;
    status.value = (state.category ?? 'all').toUpperCase();
    scene.querySelectorAll('[data-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.category));
    });
    scene.querySelectorAll('[data-filter-art]').forEach(art => {
      art.dataset.active = String(art.dataset.filterArt === state.category);
    });
    const visibleItems = [];
    for (const [name, { element }] of markers) {
      const visible = !state.category || element.dataset.category === state.category;
      element.style.display = visible ? '' : 'none';
      if (visible) visibleItems.push(name);
      else if (state.selected === name) closeCallout();
    }
    itemList.replaceChildren(...visibleItems.map(name => {
      const item = document.createElement('li'); item.textContent = name; return item;
    }));
    camera?.refresh();
  }
  function showItem(element) {
    if (scene.querySelector('.map-viewport').dataset.dragging) return;
    state.selected = element.dataset.item;
    nameCard.show(state.selected);
    for (const { element: marker } of markers.values()) marker.setAttribute('aria-expanded', String(marker === element));
    camera?.refresh();
  }
  function activateItem(element) {
    const destination = destinations[element.dataset.item];
    if (destination) { closeCallout(); navigate(destination, { source: element }); }
  }
  scene.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCallout();
  });
  function setCollapsed(collapsed) {
    state.collapsed = collapsed; render();
    (collapsed ? expand : collapse).focus({ preventScroll: true });
  }
  collapse.addEventListener('click', () => setCollapsed(true));
  expand.addEventListener('click', () => setCollapsed(false));
  scene.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      state.category = state.category === button.dataset.filter ? null : button.dataset.filter;
      render();
    });
  });

  return {
    zoomBy(factor) { camera?.zoomBy(factor); },
    dismissCard: closeCallout,
    prepare() {
      if (!ready) ready = (async () => {
        const [svg, overviewSvg] = await Promise.all([loadArtwork('./assets/map/guangzhou.svg'), loadArtwork('./assets/map/overview.svg')]);
        scene.querySelector('.overview-art').replaceChildren(overviewSvg);
        const panelSvg = svg.cloneNode(false);
        svg.querySelectorAll('[data-panel]').forEach(panel => panelSvg.append(panel));
        // The flat ocean fill becomes the same blue CSS surface with subtle light motion.
        const original = svg.firstElementChild;
        // Figma's export clip is the original frame boundary, not the map boundary.
        // The browser-sized map viewport now provides the only outer clip.
        original.removeAttribute('clip-path');
        original.querySelector(':scope > rect')?.remove();
        const world = document.createElementNS(SVG_NS, 'g');
        world.classList.add('map-world');
        for (const child of [...original.children]) world.append(child);
        original.append(world);
        svg.removeAttribute('aria-hidden');
        svg.setAttribute('role', 'group');
        svg.setAttribute('aria-label', 'Guangzhou cultural map');
        scene.querySelector('.map-art').replaceChildren(svg);
        scene.querySelector('.panel-art').replaceChildren(panelSvg);
        for (const element of world.children) {
          if (!element.dataset.item) { element.setAttribute('aria-hidden', 'true'); continue; }
          const raw = element.getBBox();
          const markerScale = 1; // Preserve the original Frame 03 relative sizes.
          const anchor = { x: raw.x + raw.width / 2, y: raw.y + raw.height };
          const width = raw.width * markerScale, height = raw.height * markerScale;
          const x = anchor.x - width / 2, y = anchor.y - height;
          const bounds = { x, y, width, height };
          const illustration = document.createElementNS(SVG_NS, 'g');
          illustration.classList.add('marker-art');
          // Keep Figma's local shadow inside the moving artwork, so it neither
          // clips the lifted icon nor amplifies the added hover glow.
          const drawing = document.createElementNS(SVG_NS, 'g');
          const originalFilter = element.getAttribute('filter');
          if (originalFilter) { drawing.setAttribute('filter', originalFilter); element.removeAttribute('filter'); }
          while (element.firstChild) drawing.append(element.firstChild);
          const normalized = document.createElementNS(SVG_NS, 'g');
          normalized.classList.add('marker-size');
          normalized.setAttribute('transform', `translate(${anchor.x} ${anchor.y}) scale(${markerScale}) translate(${-anchor.x} ${-anchor.y})`);
          normalized.append(drawing);
          illustration.append(normalized);
          element.append(illustration);
          const hit = document.createElementNS(SVG_NS, 'rect');
          const hitWidth = Math.max(44, width + 12), hitHeight = Math.max(44, height + 12);
          for (const [key, value] of Object.entries({ x: x + (width - hitWidth) / 2, y: y + (height - hitHeight) / 2, width: hitWidth, height: hitHeight, fill: 'transparent' })) hit.setAttribute(key, value);
          hit.classList.add('marker-hit'); element.prepend(hit);
          element.classList.add('map-item');
          element.setAttribute('role', 'button'); element.setAttribute('tabindex', '0');
          element.setAttribute('aria-label', element.dataset.item);
          element.setAttribute('aria-controls', 'item-callout'); element.setAttribute('aria-expanded', 'false');
          element.addEventListener('pointerenter', () => showItem(element));
          element.addEventListener('pointerleave', () => nameCard.leave());
          element.addEventListener('focus', () => showItem(element));
          element.addEventListener('blur', () => nameCard.leave());
          element.setAttribute('aria-describedby', 'item-name-accessible');
          markers.set(element.dataset.item, { element, bounds });
        }
        viewportIndicator = overviewSvg.querySelector('[data-overview-viewport]');
        if (viewportIndicator) {
          viewportIndicator.classList.add('minimap-viewport');
          viewportIndicator.setAttribute('aria-hidden', 'true');
        }
        await document.fonts.load('25px "Ugly Dave"');
        camera = createMapCamera({ surface: scene.querySelector('.map-viewport'), svg, world, bounds: geography,
          getInset: scale => state.collapsed ? 0 : 289 * scale,
          onChange: updateCamera, onSelect: activateItem, onDismiss: closeCallout });
        render();
      })().catch(error => { ready = null; throw error; });
      return ready;
    },
  };
}
