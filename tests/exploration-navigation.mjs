import assert from 'node:assert/strict';
import {routeFromHash,routeHash,nextEntry,backTarget,backDistance} from '../dist/scripts/exploration-history.js';
import {generatePattern} from '../dist/scripts/pattern-generator.js';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {readPatternDraft} from '../dist/scripts/pattern-draft.js';

let entry={atlas:true,scene:'home',index:0,trail:[]};
for(const scene of ['world','corkboard','map','library','choose-icons','pattern-creating'])
  entry=nextEntry(entry,scene,'beijing');
entry=nextEntry(entry,'pattern-preview','beijing',{replace:true});
const preview=entry;
entry=nextEntry(entry,'community','beijing');
assert.deepEqual(backTarget(entry),{scene:'pattern-preview',cityId:'beijing'});
assert.equal(backDistance(entry,backTarget(entry)),1);
assert.equal(preview.trail.at(-1).scene,'choose-icons','completed animation must replace, not add a history step');
const library=nextEntry(preview,'library','beijing');
assert.deepEqual(backTarget(library),{scene:'map',cityId:'beijing'});
assert.equal(backDistance(library,backTarget(library)),4);
assert.deepEqual(backTarget({scene:'community',trail:[]}),{scene:'corkboard'});
assert.equal(backDistance({scene:'community',trail:[]},{scene:'corkboard'}),0,'direct visits never leave the site');
assert.deepEqual(routeFromHash('#map/taiyuan'),{scene:'map',cityId:'taiyuan'});
assert.deepEqual(routeFromHash('#map/nonexistent'),{scene:'map'});
assert.equal(routeHash({scene:'map',cityId:'beijing'}),'#map/beijing');
assert.equal(routeFromHash('#unknown').scene,'home');

// Refresh must preserve the exact composition, including manually shuffled colors.
const icons=[culturalIcons[0]],pattern=generatePattern(icons,{seed:435,colorSeed:190,colorMode:'vivid'});
pattern.selectedCity='guangzhou';
const saved={key:'guangzhou|canton-tower',pattern,colorMode:'vivid',colorSeed:190};
const storage={getItem:()=>JSON.stringify(saved)};
assert.deepEqual(readPatternDraft(storage,saved.key,icons),saved);
assert.equal(readPatternDraft(storage,'beijing|beijing-kite',icons),null);
saved.pattern.items[0].x='<script>';
assert.equal(readPatternDraft(storage,saved.key,icons),null);
assert.equal(readPatternDraft({getItem:()=>'{bad json'},'key',icons),null);
assert.equal(readPatternDraft({getItem:()=>{throw Error('Storage blocked');}},'key',icons),null);
console.log('PASS: contextual Back, direct-entry fallbacks, browser history, exact draft restoration and corrupt storage.');
