import { loadArtwork } from './scenes.js';

/** One map, one set of symbols, and independent panel/filter state. */
export function createGuangzhouMap(scene) {
  const state = { collapsed: false, category: null };
  let ready;
  const filters = scene.querySelector('#map-filters');
  const collapse = scene.querySelector('#collapse-info');
  const expand = scene.querySelector('#expand-info');
  const itemList = scene.querySelector('#map-items');
  const status = scene.querySelector('#map-filter-status');

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
    scene.querySelectorAll('[data-item]').forEach(item => {
      const visible = !state.category || item.dataset.category === state.category;
      item.style.display = visible ? '' : 'none';
      if (visible) visibleItems.push(item.dataset.item);
    });
    itemList.replaceChildren(...visibleItems.map(name => {
      const item = document.createElement('li');
      item.textContent = name;
      return item;
    }));
  }

  function setCollapsed(collapsed) {
    state.collapsed = collapsed;
    render();
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
        // Dock the original panel groups separately; the shared map and its six
        // markers keep their original coordinates and are never duplicated.
        const panelSvg = svg.cloneNode(false);
        svg.querySelectorAll('[data-panel]').forEach(panel => panelSvg.append(panel));
        scene.querySelector('.map-art').replaceChildren(svg);
        scene.querySelector('.panel-art').replaceChildren(panelSvg);
        await document.fonts.load('23px "Ugly Dave"');
        render();
      })().catch(error => { ready = null; throw error; });
      return ready;
    },
  };
}
