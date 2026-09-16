/** Add later screens here as they are implemented. Artwork and behavior stay separate. */
export const scenes = Object.freeze({
  home: { elementId: 'home', title: 'The Cultural Atlas', background: '#fff7cd' },
  corkboard: { elementId: 'corkboard', title: 'Corkboard — The Cultural Atlas', background: '#f4ebd9' },
  map: { elementId: 'guangzhou', title: 'Guangzhou — The Cultural Atlas', background: '#84c9e1' },
  library: { elementId: 'icon-library', title: 'Icon Library — The Cultural Atlas', background: '#ffeff9' },
  'choose-icons': { elementId: 'choose-icons', title: 'Choose Icons — The Cultural Atlas', background: '#84c9e1' },
  'pattern-creating': { elementId: 'pattern-creating', title: 'Creating — The Cultural Atlas', background: '#84c9e1' },
  'pattern-preview': { elementId: 'pattern-preview', title: 'Preview — The Cultural Atlas', background: '#ffeff9' },
  'pattern-save': { elementId: 'pattern-save', title: 'Save — The Cultural Atlas', background: '#ffeff9' },
  'pattern-saved': { elementId: 'pattern-preview', title: 'Saved — The Cultural Atlas', background: '#ffeff9' },
});

export async function prepareScene(element) {
  await Promise.all([
    ...[...element.querySelectorAll('img')].map(image => image.decode()),
    ...[...element.querySelectorAll('[data-svg-src]')].map(async container => {
      if (!container.firstElementChild) container.replaceChildren(await loadArtwork(container.dataset.svgSrc));
    }),
  ]);
}

export function showScene(element, visible) {
  element.classList.toggle('scene--active', visible);
  element.inert = !visible;
  element.setAttribute('aria-hidden', String(!visible));
}

/** Load trusted, checked-in Figma vectors as live layers for interaction. */
export async function loadArtwork(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Artwork could not load');
  const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  if (parsed.querySelector('parsererror')) throw new Error('Invalid artwork');
  const svg = document.importNode(parsed.documentElement, true);
  svg.classList.add('art-canvas');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}
