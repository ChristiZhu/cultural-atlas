"""Group original Figma vectors for motion; never redraw the illustration."""
from pathlib import Path
from copy import deepcopy
import re
import xml.etree.ElementTree as E
NS='http://www.w3.org/2000/svg';Q='{'+NS+'}'
E.register_namespace('',NS)
root=E.parse('dist/assets/homepage.svg').getroot()
opened=E.parse('design-sources/homepage-open.svg').getroot()
# Prefix the imported definition references to avoid collisions in the live SVG.
for e in opened.iter():
 if e.get('id'): e.set('id','open-'+e.get('id'))
 for k,v in list(e.attrib.items()):
  e.set(k,re.sub(r'url\(#([^)]*)\)',r'url(#open-\1)',v))
frame=next(e for e in root.iter() if e.get('id')=='Frame 3')
defs=root.find(Q+'defs')
for e in opened.find(Q+'defs'): defs.append(deepcopy(e))
for side,x,w in [('left',0,713),('right',713,799)]:
 clip=E.SubElement(defs,Q+'clipPath',{'id':'window-split-'+side})
 E.SubElement(clip,Q+'rect',{'x':str(x),'y':'0','width':str(w),'height':'982'})
def group(attrs): return E.Element(Q+'g',attrs)
def split(nodes,kind):
 result=[]
 for side in ['left','right']:
  outer=group({'data-motion':kind,'data-side':side})
  inner=E.SubElement(outer,Q+'g',{'clip-path':'url(#window-split-'+side+')'})
  for node in nodes:
   copy=deepcopy(node);copy.set('id',node.get('id')+'-'+kind+'-'+side);inner.append(copy)
  result.append(outer)
 return result
paths=list(frame);byid={e.get('id'):e for e in paths}
findopen=lambda name:deepcopy(next(e for e in opened.iter() if e.get('id')=='open-'+name))
recess=findopen('Window-recess');recess.set('data-motion','recess');recess.set('opacity','0')
curtain=group({'data-motion':'curtain-closed'})
for g in split([byid['Vector_'+str(i)] for i in range(16,20)],'curtain'):curtain.append(g)
open_curtain=findopen('Sheer-curtains');open_curtain.set('data-motion','curtain-open');open_curtain.set('opacity','0')
children=list(open_curtain);open_curtain[:]=split(children,'curtain')
frame[:]=paths[:5]+[recess]+split(paths[5:11],'closed-pane')+[curtain,open_curtain]+split(paths[15:21],'closed-pane')+paths[21:]
for name,kind,side in [('Cast-shadows','shadow',''),('Left-open-casement','open-pane','left'),('Right-open-casement','open-pane','right'),('Hinges','hinges','')]:
 g=findopen(name);g.set('data-motion',kind)
 if side:g.set('data-side',side)
 g.set('opacity','0');frame.append(g)
flowers=next(e for e in root.iter() if e.get('id')=='03 / Cut-paper daisies & terracotta pot')
for i,node in enumerate(list(flowers)):
 n=int(node.get('id').split('_')[-1])
 if 35<=n<=51: node.set('data-stem',str(n-35))
 if 52<=n<=54: node.set('data-leaf',str(n-52))
heads=[]
for i in range(17):
 g=group({'data-flower':str(i)})
 for n in range(55+i*8,63+i*8):
  node=next(e for e in flowers if e.get('id')=='Vector_'+str(n))
  idx=list(flowers).index(node);flowers.remove(node);g.append(node)
  if n==55+i*8: flowers.insert(idx,g)
 stems=next(e for e in flowers if e.get('data-stem')==str(i))
 x=re.search(r'M([\d.]+)',stems.get('d')).group(1)
 g.set('data-pivot',x+' 796');stems.set('data-pivot',x+' 796')
Path('dist/assets/homepage-motion.svg').write_text(E.tostring(root,encoding='unicode'))
print('Prepared original closed/open panels, layered curtains, 17 stems and flower heads.')
