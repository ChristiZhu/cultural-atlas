"""Source fidelity and geometry checks for the supplied archive exports."""
from pathlib import Path
import importlib.util
import json
import sys
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('prepare', 'scripts/prepare-cultural-archives.py')
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)
ns = '{http://www.w3.org/2000/svg}'
fits = json.loads(Path('dist/assets/archive/cultural-archives-fit.json').read_text())
fits += [row for row in json.loads(Path('dist/assets/archive/new-guangzhou-fit.json').read_text()) if row['node'] == '835:18']
assert len(fits) == 49
for page in fits:
    source = ET.parse(prepare.SOURCE / (page['node'].replace(':', '-') + '.svg')).getroot()
    result = ET.parse(prepare.DEST / page['file']).getroot()
    original = prepare.content(source.find(ns + 'g'))
    wrapper = result.find(ns + 'g')
    # Every original glyph, photo/crop, paper edge and illustration is retained.
    assert [ET.tostring(child) for child in original] == [ET.tostring(child) for child in wrapper], page['file']
    assert result.get('viewBox') == '0 0 1512 982'
    assert wrapper.get('data-figma-node') == page['node']
    ids = {element.get('id') for element in result.iter() if element.get('id')}
    assert prepare.refs(result) <= ids, f'Broken paint/image reference in {page["file"]}'
    assert all((element.get('{http://www.w3.org/1999/xlink}href') or element.get('href') or '').startswith(('data:', '#')) for element in result.iter(ns + 'image'))
    if page['sourceSpine'] is not None:
        assert abs(page['sourceSpine'] * page['scale'] + page['translate'][0] - 756) < 1e-7
for book in json.loads((prepare.SOURCE / 'cultural-archives.json').read_text()):
    pages = [page for page in fits if page['node'] in book['nodes']]
    assert [page['node'] for page in pages] == book['nodes']
    assert len({(page['scale'], tuple(page['translate'])) for page in pages[1:5]}) == 1, 'Spread geometry must not jump'
print('PASS: all 49 source artworks retained exactly; references, page order, fixed stage and stable spread transforms verified.')
