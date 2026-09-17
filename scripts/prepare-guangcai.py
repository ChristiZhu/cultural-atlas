"""Fit original Figma SVG exports to the existing transparent archive stage.

Usage: python3 scripts/prepare-guangcai.py <directory containing 1-NNNN.svg>
Only the surrounding static map/navigation is removed. A single uniform transform
preserves every path, photograph, text outline, and internal layout in each book.
Paper and crease coordinates were read from the supplied Figma nodes.
"""
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
SOURCE = Path(sys.argv[1])
DEST = Path('dist/assets/archive')
# id, filename, paper bounds, crease x, complete rendered content bounds
PAGES = [
    ('9587', 'porcelain-front.svg', (433.5, 100, 645, 825.049255371), None, (421.85, 29.0394, 677.833, 921.4285)),
    ('9825', 'porcelain-01-02.svg', (133.6924, 128.0071, 1248.4918, 773.4217), 754.7833, (76, 79, 1362.9746, 875)),
    ('7396', 'porcelain-03-04.svg', (92.4795, 152.5156, 1331.5205, 755.4674), 751.1162, (87, 40, 1337, 910.8721)),
    ('7624', 'porcelain-05-06.svg', (151, 148, 1212, 740), 685, (111, 91, 1290, 811)),
    ('8808', 'porcelain-07-08.svg', (113.1152, 103, 1281.541, 782.459), 762.6504, (105.7129, 91, 1306.918, 809.2622)),
    ('9954', 'porcelain-back.svg', (453, 128, 609, 779), None, (439, 61, 640, 870)),
]

def refs(element):
    text = ET.tostring(element, encoding='unicode')
    return set(re.findall(r'url\(#([^)]*)\)', text) + re.findall(r'href="#([^"]+)"', text))

fits = []
for node, filename, paper, crease, bounds in PAGES:
    root = ET.parse(SOURCE / f'1-{node}.svg').getroot()
    frame = next(e for e in root if e.tag == f'{{{NS}}}g')
    book = next(e for e in frame if e.tag == f'{{{NS}}}g')
    defs = next(e for e in root if e.tag == f'{{{NS}}}defs')
    x, y, w, h = paper
    original_crease = crease
    if node == '7624':
        # User-authorized fold correction only: leave every paper/photo/text
        # coordinate unchanged and move the existing crease to the book centre.
        crease = x + w / 2
        backing = next(e for e in book if 'full kraft backing' in e.get('id', ''))
        shade = next(e for e in backing if e.get('id') == 'Vector_3')
        fold = next(e for e in backing if e.get('id') == 'Vector_4')
        for element in (shade, fold):
            element.set('transform', f'translate({crease - original_crease} 0)')
        backing.remove(fold)
        book.append(fold)  # The same crease continues across overlapping paper.
    bx, by, bw, bh = bounds
    if crease is None:
        scale = min(645 / w, 825.049255371 / h)
        tx = 756 - (x + w / 2) * scale
    else:
        # Keep the original asymmetric composition, but align its real crease
        # with the same pivot used by every cover and turning leaf.
        scale = min(645 / max(crease - bx, bx + bw - crease), 825.049255371 / h,
                    (512.524627685 - 24) / (y + h / 2 - by),
                    (958 - 512.524627685) / (by + bh - y - h / 2))
        tx = 756 - crease * scale
    ty = 512.524627685 - (y + h / 2) * scale
    wrapper = ET.Element(f'{{{NS}}}g', {'data-figma-node': f'1:{node}',
        'transform': f'translate({tx:.9f} {ty:.9f}) scale({scale:.12f})'})
    wrapper.append(book)
    needed = refs(book)
    while True:
        additional = set().union(*(refs(e) for e in defs if e.get('id') in needed))
        if additional <= needed:
            break
        needed |= additional
    for e in list(defs):
        if e.get('id') not in needed:
            defs.remove(e)
    root[:] = [wrapper, defs]
    ET.ElementTree(root).write(DEST / filename, encoding='unicode')
    fits.append({'node': f'1:{node}', 'file': filename, 'scale': scale,
                 'translate': [tx, ty], 'sourceBounds': bounds, 'sourceSpine': crease, 'originalSpine': original_crease,
                 'stage': [1512, 982]})
    print(filename, 'uniform scale', round(scale, 6))
(DEST / 'guangcai-fit.json').write_text(json.dumps(fits, indent=2) + '\n')
