import assert from 'node:assert/strict';
import fs from 'node:fs';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {generatePattern,renderPatternSVG} from '../dist/scripts/pattern-generator.js';
import {generatePalette,paletteSwatches,COLOR_MODES,COLOR_ROLES,contrast,recolorPattern,CURATED_PALETTES} from '../dist/scripts/pattern-colors.js';
const stats={};
for(const mode of COLOR_MODES)for(let n=1;n<=3;n++)for(let i=0;i<culturalIcons.length;i++)for(let seed=0;seed<40;seed++){
 const icons=Array.from({length:n},(_,j)=>culturalIcons[(i+j*4)%9]);
 const palette=generatePalette({icons,colorMode:mode,seed}),swatches=paletteSwatches(palette);
 assert.deepEqual(palette,generatePalette({icons,colorMode:mode,seed}));
 assert(swatches.length>=(mode==='vivid'?5:4)&&swatches.length<=(mode==='authentic'?5:6),`${mode} color count ${swatches.length}`);
 for(const role of COLOR_ROLES.slice(1))assert(contrast(palette[role],palette.background)>=3,`${mode}/${role} low contrast`);
 if(mode==='authentic')for(const icon of icons)assert(icon.naturalPalette.colors.some(c=>swatches.includes(c)),'Authentic must retain a color from each cultural source');
 if(mode==='surprise')assert(CURATED_PALETTES.some(p=>p.name===palette.name));
 stats[mode]=(stats[mode]||0)+1;
}
const icons=[culturalIcons[0],culturalIcons[1],culturalIcons[7]],base=generatePattern(icons,{seed:42});
const assets=Object.fromEntries(icons.map(icon=>[icon.id,fs.readFileSync(new URL('../dist/assets/pattern-icons/'+icon.id+'.svg',import.meta.url),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')]));
const geometry=JSON.stringify(base.items);
let variants=new Set();
for(const mode of COLOR_MODES)for(let seed=0;seed<5;seed++){
 const result=recolorPattern(base,icons,mode,seed);assert.strictEqual(result.items,base.items);assert.equal(JSON.stringify(result.items),geometry);
 assert.equal(result.grammar,base.grammar);assert.equal(result.spacing,base.spacing);assert.strictEqual(result.selectedIcons,base.selectedIcons);
 const svg=renderPatternSVG(result,assets);assert(!svg.includes('undefined'));assert(!svg.includes('NaN'));
 const painted=[...svg.matchAll(/data-color-role="[^"]+" data-color-attribute="color" color="([^"]+)"/g)].map(m=>m[1]);
 for(const swatch of paletteSwatches(result.palette))assert(swatch===result.palette.background||painted.includes(swatch),'Swatches must describe colors actually rendered');
 variants.add(paletteSwatches(result.palette).join());
}
assert(variants.size>=16,'Modes and shuffles should be visibly distinct');
assert.deepEqual(generatePattern(icons,{seed:42,colorMode:'vivid'}).items,base.items,'Color mode never changes seeded geometry');
console.log('PASS:',stats,'source fidelity, contrast, distinct palettes, exact geometry identity and actual paint swatches.');
