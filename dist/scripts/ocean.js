/** A static procedural wave field, moved slowly by the compositor rather than re-rendered per frame. */
export function createOcean(surface) {
  const ns = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs = {}) => {
    const element = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  };
  for (const [index, frequency, seed] of [[0, '.009 .043', 17], [1, '.006 .028', 31]]) {
    const svg = node('svg', { width: '100%', height: '100%', 'aria-hidden': 'true', class: `ocean-ripples ocean-ripples--${index}` });
    const defs = node('defs');
    const filter = node('filter', { id: `ocean-surface-${index}`, x: '0%', y: '0%', width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' });
    filter.append(node('feTurbulence', { type: 'fractalNoise', baseFrequency: frequency, numOctaves: '2', seed, stitchTiles: 'noStitch', result: 'surface' }));
    filter.append(node('feColorMatrix', { in: 'surface', type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0' }));
    const transfer = node('feComponentTransfer');
    transfer.append(node('feFuncA', { type: 'table', tableValues: '0 0 0 0 .015 .18 .025 0 0 0 0' }));
    filter.append(transfer); defs.append(filter); svg.append(defs);
    svg.append(node('rect', { width: '100%', height: '100%', fill: 'white', filter: `url(#ocean-surface-${index})` }));
    surface.append(svg);
  }
}
