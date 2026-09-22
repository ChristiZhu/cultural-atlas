import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iconDisplayName, iconNames } from '../dist/scripts/icon-names.js';
import { cities } from '../dist/scripts/city-data.js';
import { culturalIcons } from '../dist/scripts/library-state.js';
let matched=0,unmatched=[];
for(const city of Object.values(cities)) {
  const svg=readFileSync(new URL('../dist/'+city.mapAsset.replace('./',''),import.meta.url),'utf8');
  for(const [,subject] of svg.matchAll(/data-item="([^"]+)"/g)) {
    if(iconNames[city.id]?.[subject])matched++;else unmatched.push([city.id,subject]);
    assert(iconDisplayName(city.id,subject));
  }
  for(const icon of city.icons??[])assert.equal(icon.name,iconDisplayName(city.id,icon.sourceName));
}
assert.equal(matched,29);
assert.deepEqual(unmatched,[['dehong','Jingpo Knife']]);
const { archivesByCity } = await import('../dist/scripts/archive-entries.js');
assert.equal(archivesByCity.guangzhou['Guangcai Porcelain'],'porcelain','stable archive routing key');
assert.equal(culturalIcons.find(x=>x.id==='har-gow').label,'Har Gow (Steamed Shrimp Dumplings)');
assert.equal(culturalIcons.find(x=>x.id==='five-rams').label,'Five Rams Sculpture motif');
assert.equal(culturalIcons.length,9,'no new library glyphs');
console.log('PASS: 29 matched map names, one explicitly unmatched subject, canonical library names, and unchanged archive key and glyph count.');
