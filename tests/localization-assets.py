"""Ensure every archive face is covered and translated paths stay in text bounds."""
import json, re, xml.etree.ElementTree as ET
from pathlib import Path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'design-sources/localization/artwork.json').read_text())
manifest=json.loads((root/'dist/locales/artwork-zh.json').read_text())
archives={p.name for p in (root/'dist/assets/archive').glob('*.svg') if not p.name.startswith('cursor-')}
assert len(archives)==72
assert archives=={Path(k).name for k in manifest if '/archive/' in k}
count=0
for file in source:
 entries=manifest.get(file['file'],[])
 if isinstance(entries,str):entries=json.loads((root/'dist/locales'/entries).read_text())
 translations={e['index']:e for e in entries}
 tree=ET.parse(root/'dist'/file['file'])
 nodes=[n for n in tree.iter() if n.tag.split('}')[-1] in ['path','text']]
 assert len(translations)==len(entries),file['file']
 for row in file['entries']:
  if row['zh']==row['en'] and not row.get('restyle'):continue
  e=translations[row['index']];assert e['zh']==row['zh']
  original=nodes[row['index']];assert original.tag.endswith('path')
  if not e['d']:
   assert not row['zh'] or (row.get('layout',{}).get('hideOutline') and original.get('mask'));continue
  p=BoundsPen(None);parse_path(e['d'],p);x,y,w,h=row.get('layout',{}).get('box',row['box']);left,top,right,bottom=p.bounds
  assert left>=x-2 and top>=y-2 and right<=x+w+2 and bottom<=y+h+2,(file['file'],row['index'],row['en'])
  assert re.search('[\u4e00-\u9fff]',row['zh']),row['zh']
  count+=1
print(f'PASS: {count} translated text paths, all 72 archive faces, valid indices, unique layers and text-bound containment.')
