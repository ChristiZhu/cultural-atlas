import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {generatePattern,renderPatternSVG,GRAMMARS} from '../dist/scripts/pattern-generator.js';
const sharp=createRequire(import.meta.url)('sharp');
const assets=Object.fromEntries(culturalIcons.map(icon=>[icon.id,fs.readFileSync(new URL('../assets/pattern-icons/'+icon.id+'.svg',new URL('../dist/scripts/',import.meta.url)),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')]));
for(const grammar of GRAMMARS){
 const result=generatePattern([culturalIcons[0],culturalIcons[2],culturalIcons[7]],{grammar,seed:42});
 const tileSVG=renderPatternSVG(result,assets,{width:300,height:300});
 assert(!/(?:href|src)="https?:/.test(tileSVG));
 const tile=await sharp(Buffer.from(tileSVG)).ensureAlpha().raw().toBuffer();
 const repeat=await sharp(Buffer.from(renderPatternSVG(result,assets,{width:600,height:600,repeats:2}))).ensureAlpha().raw().toBuffer();
 let totalDifference=0,maxDifference=0;
 for(let y=0;y<600;y++)for(let x=0;x<600;x++)for(let c=0;c<4;c++){
  const difference=Math.abs(repeat[(y*600+x)*4+c]-tile[((y%300)*300+x%300)*4+c]);totalDifference+=difference;maxDifference=Math.max(maxDifference,difference);
 }
 assert(totalDifference/(600*600*4)<.15,`${grammar}: tile repetition differs from exported tile`);
 assert(maxDifference<35,`${grammar}: visible seam (${maxDifference})`);
}
for(const icon of culturalIcons){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" color="#222" fill="none">${assets[icon.id]}</svg>`;
 const raw=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();let ink=0,edgeInk=0;
 for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(raw[(y*100+x)*4+3]>10){ink++;if(x<2||y<2||x>97||y>97)edgeInk++;}
 assert(ink>100,`${icon.id}: empty icon`);assert.equal(edgeInk,0,`${icon.id}: accidentally clipped icon`);
}
console.log('PASS: all six exported repeat tiles match a 2×2 rendered repeat, embedded vectors are self-contained, all nine source glyphs have clear unclipped bounds.');
