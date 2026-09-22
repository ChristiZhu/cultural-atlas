import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
const sources=JSON.parse(fs.readFileSync('design-sources/library/glyphs.json'));
const cells=JSON.parse(execFileSync('python3',['-c',`
import json,xml.etree.ElementTree as E
E.register_namespace('','http://www.w3.org/2000/svg')
cells=[]
for scene in ['cities','choose-icons']:
 root=E.parse('dist/assets/library/'+scene+'.svg').getroot()
 collection=next(g for g in root[0] if 'data-collection' in g.attrib)
 for card in collection:
  icon=card.get('data-library-icon') or card.get('data-icon-card')
  art=card[-1]
  cells.append({'scene':scene,'id':icon,'art':E.tostring(art,encoding='unicode')})
print(json.dumps(cells))
`],{encoding:'utf8'}));
const paths=svg=>[...svg.matchAll(/\bd="([^"]+)"/g)].map(m=>m[1]);
for(const scene of ['cities','choose-icons'])assert.equal(cells.filter(c=>c.scene===scene).length,24);
for(const cell of cells){
 const source=sources.find(s=>s.scene===cell.scene&&s.id===cell.id)||sources.find(s=>s.scene==='new'&&s.id===cell.id);
 assert.deepEqual(paths(cell.art),paths(source.svg),`${cell.id}: original Figma paths must be preserved`);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" fill="none" color="black">${cell.art}</svg>`;
 const {data,info}=await sharp(Buffer.from(svg),{density:288}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
 assert(left>0&&top>0&&right<info.width&&bottom<info.height,`${cell.id}: clipped glyph`);
 assert(Math.abs((left+right)/8-46)<.4,`${cell.id}/${cell.scene}: horizontal ink alignment`);
 assert(Math.abs((top+bottom)/8-46)<.4,`${cell.id}/${cell.scene}: vertical ink alignment`);
 if(source.scene==='new')assert.deepEqual(paths(fs.readFileSync(`dist/assets/pattern-icons/${cell.id}.svg`,'utf8')),paths(source.svg),'Pattern generation reuses the same Figma paths');
}
console.log('PASS: 24 original vector glyphs in both views, centered on actual ink within 0.4px, unclipped and identical Figma paths in new pattern assets.');
