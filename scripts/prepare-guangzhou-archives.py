"""Extract original Figma archive content into the existing fixed, transparent stage.

Source exports retain text outlines, original photo data/crops and decorations.
Only frame background/map/navigation are removed; each book receives one uniform
scale across its pages, with the original fold aligned to the shared x=756 axis.
"""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)
ET.register_namespace('xlink','http://www.w3.org/1999/xlink')
source=Path('design-sources/archives')
dest=Path('dist/assets/archive')
suffixes=['front','01-02','03-04','05-06','07-08','back']
books=[('shrimp','835',[2,6,10,14,18,22],645/635),('five-rams','868',[2,15,28,41,54,67],645/625)]
def refs(e):
 text=ET.tostring(e,encoding='unicode')
 return set(re.findall(r'url\(#([^)]*)\)',text)+re.findall(r'href="#([^"]+)"',text))
fits=[]
for name,prefix,nodes,scale in books:
 for i,node in enumerate(nodes):
  root=ET.parse(source/f'{prefix}-{node}.svg').getroot()
  frame=root.find(f'{{{NS}}}g');defs=root.find(f'{{{NS}}}defs')
  # The first four frame children are background, map silhouette and nav labels.
  assert frame[0].tag.endswith('rect') and frame[1].get('id','').startswith('Vector ')
  assert frame[2].get('id','').startswith('ICON LIBRARY') and frame[3].get('id')=='HOME'
  cover=i in (0,5)
  if name=='shrimp':
   center_x=754.5 if cover else 756
   center_y=517.5 if cover else 507
  else:
   center_x=(759.0525 if i==5 else 756)
   center_y=520
  tx=756-center_x*scale;ty=512.524627685-center_y*scale
  wrapper=ET.Element(f'{{{NS}}}g',{'data-figma-node':f'{prefix}:{node}',
   'transform':f'translate({tx:.9f} {ty:.9f}) scale({scale:.12f})'})
  wrapper.extend(list(frame)[4:])
  needed=refs(wrapper)
  while True:
   additional=set().union(*(refs(e) for e in defs if e.get('id') in needed))
   if additional<=needed:break
   needed|=additional
  for e in list(defs):
   if e.get('id') not in needed:defs.remove(e)
  root[:]=[wrapper,defs]
  filename=f'{name}-{suffixes[i]}.svg'
  ET.ElementTree(root).write(dest/filename,encoding='unicode')
  fits.append({'node':f'{prefix}:{node}','file':filename,'scale':scale,'translate':[tx,ty],
   'sourceSpine':None if cover else 756,'stage':[1512,982]})
(dest/'new-guangzhou-fit.json').write_text(json.dumps(fits,indent=2)+'\n')
print(f'Prepared {len(fits)} original vector archive pages')
