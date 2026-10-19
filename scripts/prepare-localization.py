"""Compile locale-specific typography to crisp SVG paths; English art stays intact.
Edit design-sources/localization/artwork.json; authoring requires fonttools[brotli].
Each optional `layout` records Chinese role, size, region, alignment and paper angle.
"""
from pathlib import Path
import json, math, re, xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from functools import lru_cache
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
ROOT=Path(__file__).resolve().parents[1]
fonts={role:TTFont(ROOT/f'dist/assets/fonts/{name}.woff2') for role,name in {'hand':'atlas-note-sc','display':'atlas-play-sc','sans':'atlas-sans-sc'}.items()}
for f in fonts.values():f.glyphs=f.getGlyphSet();f.cmap=f.getBestCmap()
missing=set();audit=[]
CLOSING='·，。；：！？、）》」』】〕〉…,.!?;:%'
OPENING='（《「『【〔〈('
@lru_cache(maxsize=None)
def glyph_for(c,font):
 for candidate in [font,fonts['sans'],fonts['hand']]:
  if ord(c) in candidate.cmap:return candidate,candidate.cmap[ord(c)]
 missing.add(c);return font,font.cmap[ord('?')]
@lru_cache(maxsize=None)
def glyph_outline(font,glyph):
 pen=DecomposingRecordingPen(font.glyphs);font.glyphs[glyph].draw(pen);return pen

@lru_cache(maxsize=50000)
def width(s,font):
 return sum((f['hmtx'][g][0]/f['head'].unitsPerEm) for f,g in (glyph_for(c,font) for c in s))
def wrap_text(text,font,size,limit):
 lines=[]
 for paragraph in text.splitlines():
  tokens=re.findall(r'[A-Za-z0-9#][A-Za-z0-9#.:/–—_-]*|.',paragraph)
  current=[];part=[]
  for token in tokens:
   if current and width(''.join(current)+token,font)*size>limit and token not in CLOSING:
    opening=[]
    while current and current[-1] in OPENING:opening.insert(0,current.pop())
    if current:part.append(''.join(current).rstrip())
    current=opening
   if current or token.strip():current.append(token)
  if current:part.append(''.join(current).rstrip())
  # Avoid one orphan character (or a character plus punctuation) on the last line.
  if len(part)>1 and len(part[-1].rstrip(CLOSING))==1 and len(part[-2])>2:
   tail=part[-2][-1]
   if re.match(r'[\u3400-\u9fff]',tail):part[-2]=part[-2][:-1];part[-1]=tail+part[-1]
  lines.extend(part or [''])
 return lines

def render(row):
 style=row.get('layout',{});zh='\n'.join(style['lines']) if style.get('lines') else row['zh'];x,y,w,h=style.get('box',row['box']);font=fonts[style.get('role','hand')]
 if row.get('vertical'):zh='\n'.join(zh.replace(' ','').replace('\n',''))
 if not zh:return '',0,[]
 angle=math.radians(style.get('rotation',0));co=math.cos(angle);si=math.sin(angle)
 # Wrap to the available Chinese region first. Rotation is fitted against
 # actual Chinese ink, not the much wider English word it replaces.
 inner_w=w;inner_h=h
 leading=style.get('lineHeight',1.42)
 size=style.get('size',min(h, max(14,row.get('size') or h)))
 while True:
  lines=wrap_text(zh,font,size,inner_w)
  if (len(lines)-1)*size*leading+size*.95<=inner_h+.01 and max(width(l,font)*size for l in lines)<=inner_w+.01:break
  size*=.975
  if size<.2:raise ValueError(row)
 center=style.get('align',row.get('align'))=='center' or any(part in row.get('file','') for part in ['-back.svg','-next.svg','-redo.svg','-save.svg','/nav-'])
 pen=SVGPathPen(None,ntos=lambda n:format(n,'.2f'))
 for li,line in enumerate(lines):
  dx=(inner_w-width(line,font)*size)/2 if center else 0
  for c in line:
   gf,glyph=glyph_for(c,font);gu=gf['head'].unitsPerEm
   glyph_outline(gf,glyph).replay(TransformPen(pen,(size/gu,0,0,-size/gu,dx,size*.88+li*size*leading)))
   dx+=gf['hmtx'][glyph][0]*size/gu
 d=pen.getCommands()
 if angle:
  rotated=SVGPathPen(None);parse_path(d,TransformPen(rotated,(co,si,-si,co,0,0)));d=rotated.getCommands()
 bounds=BoundsPen(None);parse_path(d,bounds)
 if bounds.bounds:
  bx,by,br,bb=bounds.bounds;scale=min(1,w/(br-bx),h/(bb-by));iw=(br-bx)*scale;ih=(bb-by)*scale
  out=SVGPathPen(None,ntos=lambda n:format(n,'.2f').rstrip('0').rstrip('.') if n else '0')
  # A shorter Chinese block keeps natural leading; it never stretches to fill
  # English paragraph space. Headings can opt into vertical centering.
  dx=(w-iw)/2 if center else 0;dy=(h-ih)/2 if style.get('valign')=='center' else 0
  parse_path(d,TransformPen(out,(scale,0,0,scale,x-bx*scale+dx,y-by*scale+dy)));d=out.getCommands()
 return d,size,lines

manifest={};count=0
for file in json.loads((ROOT/'design-sources/localization/artwork.json').read_text()):
 tree=ET.parse(ROOT/'dist'/file['file']);nodes=[n for n in tree.iter() if n.tag.split('}')[-1] in ['path','text']]
 entries=[];previous={}
 for row in sorted(file['entries'],key=lambda r:r['index']):
  if row['zh']==row['en'] and not row.get('restyle'):continue
  row['file']=file['file'];style=row.get('layout',{});node=nodes[row['index']];attrs={}
  prior=previous.get(row['en']);is_outline=bool(node.get('mask'))
  if is_outline and prior:
   d,size,lines=prior
   attrs={'fill':'none','stroke':node.get('fill','#383B30'),'stroke-width':round(min(.7,size*.022),3),'stroke-linejoin':'round'}
  else:d,size,lines=render(row)
  if node.get('stroke-width') and float(node.get('stroke-width'))>1:attrs['stroke-width']=min(float(node.get('stroke-width')),size*.028)
  if row.get('outline'):
   attrs.update({'fill':'none','stroke':node.get('fill','#F8D24D'),'stroke-width':round(max(.35,size*.018),3),'stroke-linejoin':'round'})
  if style.get('solid'):attrs.update(fill=style['solid'],stroke='none',**{'stroke-width':0})
  if style.get('hideOutline') and is_outline:d=''
  entries.append(dict(index=row['index'],d=d,zh=row['zh'],**({'attrs':attrs} if attrs else {})))
  previous[row['en']]=(d,size,lines);count+=1
  audit.append(dict(file=file['file'],index=row['index'],size=round(size,2),lines=lines,role=style.get('role'),rotation=style.get('rotation',0)))
 if entries:
  if '/archive/' in file['file']:
   dest=ROOT/'dist/locales/artwork-zh'/Path(file['file']).with_suffix('.json').name;dest.parent.mkdir(exist_ok=True)
   dest.write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')));manifest[file['file']]='artwork-zh/'+dest.name
  else:manifest[file['file']]=entries
(ROOT/'dist/locales/artwork-zh.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
out=ROOT/'work/localization';out.mkdir(exist_ok=True,parents=True);(out/'typography-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print(f'{count} translated vector layers in {len(manifest)} files. English artwork unchanged.')
if missing:raise ValueError('Missing font glyphs: '+''.join(sorted(missing)))
