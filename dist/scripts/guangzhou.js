import { loadArtwork } from './scenes.js';
import { createMapCamera } from './map-camera.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const geography = { x: 483, y: 123, width: 617.000244, height: 820.00061 };
const destinations = Object.freeze({ 'Canton Tower': 'canton', 'Guangcai Porcelain': 'porcelain' });

/** One map, independent filter/panel state, and a camera shared by land and symbols. */
export function createGuangzhouMap(scene, { navigate }) {
  const state = { collapsed: false, category: null, selected: null };
  let ready, camera, viewportIndicator;
  const markers = new Map();
  const filters = scene.querySelector('#map-filters');
  const collapse = scene.querySelector('#collapse-info');
  const expand = scene.querySelector('#expand-info');
  const itemList = scene.querySelector('#map-items');
  const status = scene.querySelector('#map-filter-status');
  const callout = scene.querySelector('#item-callout');
  const title = scene.querySelector('#item-title');
  const coverButton = scene.querySelector('#open-front-cover');

  function updateCamera(view, visible, { rect, viewport, scale }) {
    // Invert the main camera, then project its visible area into the original mini map.
    if (viewportIndicator) {
      const mini = { x: 76, y: 46, width: 112, height: 145 };
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
    callout.style.left = `${anchorX - 167.984 * scale}px`;
    callout.style.top = `${anchorY - 113 * scale}px`;
  }

  function closeCallout(restoreFocus = false) {
    const selected = markers.get(state.selected);
    state.selected = null;
    callout.hidden = true;
    for (const { element } of markers.values()) element.setAttribute('aria-expanded', 'false');
    if (restoreFocus && selected) selected.element.focus({ preventScroll: true });
  }
  function render() {
    scene.dataset.collapsed = String(state.collapsed);
    scene.dataset.category = state.category ?? 'all';
    filters.hidden = state.collapsed;
    filters.inert = state.collapsed;
    collapse.hidden = state.collapsed;
    expand.hidden = !state.collapsed;
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
  function selectItem(element, keyboard) {
    state.selected = element.dataset.item;
    state.collapsed = true;
    const destination = destinations[state.selected];
    title.textContent = state.selected;
    callout.dataset.longTitle = String(state.selected.length > 17);
    coverButton.disabled = !destination;
    coverButton.setAttribute('aria-label', destination ? `Go to Front Cover — ${state.selected}` : `Go to Front Cover — unavailable for ${state.selected}`);
    for (const { element: marker } of markers.values()) marker.setAttribute('aria-expanded', String(marker === element));
    render();
    camera.focus(markers.get(state.selected).bounds);
    if (keyboard) (destination ? coverButton : title).focus({ preventScroll: true });
  }
  coverButton.addEventListener('click', () => {
    const destination = destinations[state.selected];
    if (destination) navigate(destination, { source: coverButton });
  });
  callout.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeCallout(true); }
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
    prepare() {
      if (!ready) ready = (async () => {
        const svg = await loadArtwork('./assets/map/guangzhou.svg');
        const panelSvg = svg.cloneNode(false);
        svg.querySelectorAll('[data-panel]').forEach(panel => panelSvg.append(panel));
        // The flat ocean fill becomes the same blue CSS surface with subtle light motion.
        const original = svg.firstElementChild;
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
          const { x, y, width, height } = element.getBBox();
          const bounds = { x, y, width, height };
          const illustration = document.createElementNS(SVG_NS, 'g');
          illustration.classList.add('marker-art');
          // Keep Figma's local shadow inside the moving artwork, so it neither
          // clips the lifted icon nor amplifies the added hover glow.
          const drawing = document.createElementNS(SVG_NS, 'g');
          const originalFilter = element.getAttribute('filter');
          if (originalFilter) { drawing.setAttribute('filter', originalFilter); element.removeAttribute('filter'); }
          while (element.firstChild) drawing.append(element.firstChild);
          illustration.append(drawing);
          element.append(illustration);
          const hit = document.createElementNS(SVG_NS, 'rect');
          const hitWidth = Math.max(44, width + 12), hitHeight = Math.max(44, height + 12);
          for (const [key, value] of Object.entries({ x: x + (width - hitWidth) / 2, y: y + (height - hitHeight) / 2, width: hitWidth, height: hitHeight, fill: 'transparent' })) hit.setAttribute(key, value);
          hit.classList.add('marker-hit'); element.prepend(hit);
          element.classList.add('map-item');
          element.setAttribute('role', 'button'); element.setAttribute('tabindex', '0');
          element.setAttribute('aria-label', element.dataset.item);
          element.setAttribute('aria-controls', 'item-callout'); element.setAttribute('aria-expanded', 'false');
          markers.set(element.dataset.item, { element, bounds });
        }
        viewportIndicator = panelSvg.querySelector('[id="compact-Rectangle 139"]');
        if (viewportIndicator) {
          viewportIndicator.classList.add('minimap-viewport');
          viewportIndicator.setAttribute('aria-hidden', 'true');
        }
        await document.fonts.load('25px "Ugly Dave"');
        camera = createMapCamera({ surface: scene.querySelector('.map-viewport'), svg, world, bounds: geography,
          getInset: scale => state.collapsed ? 0 : 289 * scale,
          onChange: updateCamera, onSelect: selectItem, onDismiss: closeCallout });
        render();
      })().catch(error => { ready = null; throw error; });
      return ready;
    },
  };
}
