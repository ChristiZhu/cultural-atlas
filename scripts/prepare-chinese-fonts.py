"""Create self-hosted Chinese font subsets for this site's reviewed vocabulary.
Place official Xiaolai-Regular.ttf and ZCOOLKuaiLe-Regular.ttf plus OFL texts in
work/localization/fonts/ as xiaolai.ttf/zcool.ttf and <name>-OFL.txt first.
Re-run when adding translations, before prepare-localization.py.
"""
from pathlib import Path
import json
from fontTools.ttLib import TTFont
from fontTools import subset
ROOT=Path(__file__).resolve().parents[1]
text=''.join(path.read_text() for path in (ROOT/'dist/locales').glob('*zh.js'))
for file in json.loads((ROOT/'design-sources/localization/artwork.json').read_text()):
 for row in file['entries']:text+=row['zh']
characters=set(map(ord,text))|set(range(32,256))|set(range(0x2000,0x2070))|set(range(0x2190,0x2200))|set(range(0x3000,0x3040))|set(range(0xff00,0xffef))
for source,name in [('xiaolai','atlas-note-sc'),('zcool','atlas-play-sc')]:
 font=TTFont(ROOT/f'work/localization/fonts/{source}.ttf')
 options=subset.Options();options.layout_features=['*'];options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*']
 compiler=subset.Subsetter(options=options);compiler.populate(unicodes=characters);compiler.subset(font)
 font.flavor='woff2';font.save(ROOT/f'dist/assets/fonts/{name}.woff2')
 (ROOT/f'dist/assets/fonts/{name}-OFL.txt').write_bytes((ROOT/f'work/localization/fonts/{source}-OFL.txt').read_bytes())
 print(name,len(font.getBestCmap()),'glyphs')
