import assert from 'node:assert/strict';
import {culturalIcons,createLibraryState} from '../dist/scripts/library-state.js?v=20260922-library-final';
import {generatePattern,GRAMMARS,renderPatternSVG,wrappedItems,TILE_SIZE} from '../dist/scripts/pattern-generator.js';
const stats={};let count=0;
for(const grammar of GRAMMARS)for(let i=0;i<culturalIcons.length;i++)for(const size of [1,2,3])for(let seed=1;seed<=12;seed++){
 const icons=Array.from({length:size},(_,j)=>culturalIcons[(i+j)%culturalIcons.length]);
 const result=generatePattern(icons,{grammar,seed});assert(result.quality.valid);assert.equal(result.grammar,grammar);
 assert.deepEqual(result.selectedIcons,icons.map(x=>x.id));assert(new Set(['background','primary','secondary','accent','accent2','detail'].map(role=>result.palette[role])).size<=6);
 assert.deepEqual(generatePattern(icons,{grammar,seed}),result);
 stats[grammar]=(stats[grammar]||0)+1;count++;
 const wrapped=wrappedItems(result);assert.equal(wrapped.length,result.items.length*9);
 for(const item of result.items){assert(wrapped.some(p=>p.id===item.id&&p.x===item.x-TILE_SIZE&&p.y===item.y));assert(wrapped.some(p=>p.id===item.id&&p.x===item.x&&p.y===item.y+TILE_SIZE));}
}
for(let seed=0;seed<200;seed++){
 const icons=[culturalIcons[seed%culturalIcons.length],culturalIcons[(seed+1)%culturalIcons.length],culturalIcons[(seed+2)%culturalIcons.length]];
 const a=generatePattern(icons,{seed,first:true}),b=generatePattern(icons,{seed:seed+1,previousGrammar:a.grammar});
 assert.equal(a.palette.mode,'harmonious');assert.notEqual(a.grammar,b.grammar);assert.deepEqual(a.selectedIcons,b.selectedIcons);
}
assert.throws(()=>generatePattern([]),RangeError);
const state=createLibraryState();for(const icon of culturalIcons)state.toggleIcon(icon.id);assert.equal(state.getState().selectedIcons.length,3);state.toggleIcon(culturalIcons[0].id);assert.equal(state.getState().selectedIcons.length,2);state.setCity('beijing');assert.equal(state.getState().selectedIcons.length,0);
const r=generatePattern([culturalIcons[0]],{seed:42});const svg=renderPatternSVG(r,{'canton-tower':'<g/>'});assert(svg.includes('patternUnits="userSpaceOnUse"'));assert(!svg.includes('undefined'));assert(!svg.includes('NaN'));
console.log(`PASS ${count} grammar/icon/count/seed combinations; 200 regeneration transitions; deterministic output, palette, hierarchy, periodic wrapping and selection bounds.`,stats);
