/** Static editorial example made by the same generator used in the Pattern Lab.
 * Does not touch a visitor's selection, saved patterns or community database. */
import {readFileSync,writeFileSync} from 'node:fs';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {generatePattern} from '../dist/scripts/pattern-generator.js';
import {renderArtwork} from '../dist/scripts/pattern-export.js';
const icons=['canton-tower','porcelain-3','beijing-rabbit'].map(id=>culturalIcons.find(icon=>icon.id===id));
const assets=Object.fromEntries(icons.map(icon=>[icon.id,readFileSync(new URL('../dist/'+icon.svg,import.meta.url),'utf8').replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'')]));
const pattern=generatePattern(icons,{seed:20261019,grammar:'half-drop',colorMode:'authentic'});
writeFileSync(new URL('../dist/assets/about/generated-pattern.svg',import.meta.url),renderArtwork(pattern,assets,'about-pattern'));
console.log('Generated About pattern from existing cultural icons.');
