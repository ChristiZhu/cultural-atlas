"""Center original Figma vectors in shared cells; preserve all source paths."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ROOT = Path(__file__).resolve().parents[1]
sources = json.loads((ROOT / 'design-sources/library/glyphs.json').read_text())
bounds = json.loads((ROOT / 'design-sources/library/ink-bounds.json').read_text())
sources = {(s['scene'], s['id']): s for s in sources}
order = [s['id'] for s in sources.values() if s['scene'] == 'cities'] + [s['id'] for s in sources.values() if s['scene'] == 'new']

def element(tag, **attrs):
    return ET.Element(f'{{{NS}}}{tag}', {k: str(v) for k, v in attrs.items()})

def glyph(scene, icon, center=46, normalize=False):
    source = sources.get((scene, icon), sources.get(('new', icon)))
    art = ET.fromstring(source['svg'])
    x, y, w, h = bounds[f"{source['scene']}:{icon}"]
    scale = 92 / max(w, h) if normalize else min(1, 84 / max(w, h))
    wrapper = element('g', transform=f'translate({center} {center}) scale({scale}) translate({-x-w/2} {-y-h/2})')
    for child in art:
        for part in child.iter():
            for attr in list(part.attrib):
                if attr == 'id' or attr.startswith('data-') or attr == 'color':
                    del part.attrib[attr]
            if scene == 'choose-icons' or normalize:
                for attr in ['fill', 'stroke']:
                    if part.get(attr) and part.get(attr).lower() not in ['none', 'white', '#fff', '#ffffff']:
                        part.set(attr, 'currentColor')
                    elif source['scene'] == 'new' and not normalize and part.get(attr, '').lower() in ['white', '#fff', '#ffffff']:
                        part.set(attr, 'var(--icon-cutout, white)')
        wrapper.append(child)
    return wrapper

for scene, rows, start_x, start_y, fill in [('cities', 3, 150, 368, '#CFE8FF'), ('choose-icons', 4, 144, 259, '#FFD0ED')]:
    path = ROOT / f'dist/assets/library/{scene}.svg'
    tree = ET.parse(path)
    root = tree.getroot()[0]
    grid = next(g for g in root if g.get('id') == f'{scene}-6')
    grid.clear(); grid.set('id', f'{scene}-6')
    for row in range(rows):
        for column in range(11):
            grid.append(element('rect', x=start_x+112.8*column, y=start_y+121.5*row, width=92, height=92, fill=fill))
    collection = next(g for g in root if 'data-collection' in g.attrib)
    collection.clear(); collection.set('data-collection', '')
    for index, icon in enumerate(order):
        card = element('g', transform=f'translate({start_x+112.8*(index%11)} {start_y+121.5*(index//11)})')
        card.set('data-library-icon' if scene == 'cities' else 'data-icon-card', icon)
        if scene == 'choose-icons':
            cell = element('rect', width=92, height=92, fill=fill)
            cell.set('data-icon-background', ''); card.append(cell)
        art = glyph(scene, icon)
        art.set('data-icon-position', '')
        if scene == 'choose-icons': art.set('data-icon-art', '')
        card.append(art); collection.append(card)
    for tab in root:
        if tab.get('data-city-art') == 'shanxi': tab.set('data-city-art', 'taiyuan')
        if tab.get('data-city-art') == 'guangzhou': tab.set('transform', 'translate(7 0)')
    tree.write(path, encoding='unicode')

for (scene, icon), source in sources.items():
    if scene != 'new': continue
    svg = element('svg', viewBox='0 0 100 100', fill='none')
    svg.append(glyph('choose-icons', icon, center=50, normalize=True))
    ET.ElementTree(svg).write(ROOT / f'dist/assets/pattern-icons/{icon}.svg', encoding='unicode')
