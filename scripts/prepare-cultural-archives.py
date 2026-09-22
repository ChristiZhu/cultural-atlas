"""Fit the supplied eight books into the existing archive engine's SVG stage.

Retain original paths, photo data, crops, paper proportions and decoration.
Only the Figma frame's background/map/navigation are removed. One uniform
scale per book and one shared transform for its four spreads prevent jumps.
Run from the repository root after downloading the listed source SVGs.
"""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
SOURCE = Path('design-sources/archives')
DEST = Path('dist/assets/archive')
SUFFIXES = ['front', '01-02', '03-04', '05-06', '07-08', 'back']
STAGE_CENTER_Y = 512.524627685

# Geometry measured from the original Figma paper and crease layers.
# (uniform scale, closed-cover center, open-spread center/spine)
KRAFT = (645 / 635, (754.5, 517.5), (756, 507))
NOTEBOOK = (645 / 653, (754.5, 517.5), (757, 510))
LINEN = (1, (756, 489), (756, 491))
FITS = {
    'eight-treasure-duck': KRAFT,
    'jinshan-painting': KRAFT,
    'lvdagun': KRAFT,
    'beijing-kite': NOTEBOOK,
    'youmian': LINEN,
    'bamboo-rice': NOTEBOOK,
    'paper-cutting': LINEN,
    'jingpo-brocade': (645 / 648, (756, 490), (756, 506.5)),
}

def refs(element):
    text = ET.tostring(element, encoding='unicode')
    return set(re.findall(r'url\(#([^)]*)\)', text) + re.findall(r'href="#([^"]+)"', text))

def content(frame):
    """Remove only verified frame chrome, regardless of its stacking order."""
    result = []
    for index, child in enumerate(frame):
        name = child.get('id', '')
        if index == 0 and child.tag == f'{{{NS}}}rect' and not name:
            continue
        if name in ('Vector 593', 'Vector 584', 'HOME', 'Archive navigation',
                    'Cultural atlas / mauve background silhouette') or name.startswith('ICON LIBRARY'):
            continue
        result.append(child)
    assert result and len(result) < len(frame), 'Unrecognized source frame'
    return result

def prepare(node, filename, scale, center, cover):
    root = ET.parse(SOURCE / f'{node.replace(":", "-")}.svg').getroot()
    assert root.get('viewBox') == '0 0 1512 982'
    frame = root.find(f'{{{NS}}}g')
    defs = root.find(f'{{{NS}}}defs')
    tx, ty = 756 - center[0] * scale, STAGE_CENTER_Y - center[1] * scale
    wrapper = ET.Element(f'{{{NS}}}g', {
        'data-figma-node': node,
        'transform': f'translate({tx:.9f} {ty:.9f}) scale({scale:.12f})',
    })
    wrapper.extend(content(frame))
    needed = refs(wrapper)
    while True:
        additional = set().union(*(refs(e) for e in defs if e.get('id') in needed))
        if additional <= needed:
            break
        needed |= additional
    for element in list(defs):
        if element.get('id') not in needed:
            defs.remove(element)
    root[:] = [wrapper, defs]
    ET.ElementTree(root).write(DEST / filename, encoding='unicode')
    return {'node': node, 'file': filename, 'scale': scale, 'translate': [tx, ty],
            'sourceSpine': None if cover else center[0], 'stage': [1512, 982]}

def main():
    fits = []
    for book in json.loads((SOURCE / 'cultural-archives.json').read_text()):
        scale, cover_center, spread_center = FITS[book['id']]
        for index, node in enumerate(book['nodes']):
            cover = index in (0, 5)
            fits.append(prepare(node, f'{book["id"]}-{SUFFIXES[index]}.svg', scale,
                                cover_center if cover else spread_center, cover))
    (DEST / 'cultural-archives-fit.json').write_text(json.dumps(fits, indent=2) + '\n')
    # The linked Har Gow node is its last interior spread, not the back cover.
    # Its previous fitting transform and all five other pages remain unchanged.
    prepare('835:18', 'shrimp-07-08.svg', KRAFT[0], KRAFT[2], False)
    print(f'Prepared {len(fits)} new archive pages and only Har Gow 07–08.')

if __name__ == '__main__':
    main()
