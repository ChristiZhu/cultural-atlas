import assert from 'node:assert/strict';
import {culturalIcons,createLibraryState,MAX_SELECTED_ICONS} from '../dist/scripts/library-state.js?v=20260922-library-final';

const state=createLibraryState();
const counts={guangzhou:10,beijing:3,shanghai:5,taiyuan:2,dehong:4};
assert.equal(state.getState().availableIcons.length,24);
assert.equal(new Set(culturalIcons.map(icon=>icon.id)).size,24);
for(const [city,count] of Object.entries(counts)){
 state.setCity(city);
 let snapshot=state.getState();
 assert.equal(snapshot.selectedCity,city);
 assert.equal(snapshot.availableIcons.length,count);
 assert(snapshot.availableIcons.every(icon=>icon.city===city&&icon.category&&icon.svg));
 assert.deepEqual(snapshot.selectedIcons,[],'Changing to a different city clears foreign selections');
 assert.equal(state.toggleIcon(culturalIcons.find(icon=>icon.city!==city).id),false);
 for(const icon of snapshot.availableIcons.slice(0,3))assert.equal(state.toggleIcon(icon.id),true);
 const selected=state.getState().selectedIcons;
 assert.equal(selected.length,Math.min(MAX_SELECTED_ICONS,count));
 if(count>3)assert.equal(state.toggleIcon(snapshot.availableIcons[3].id),false);
 state.setCity(city);
 assert.deepEqual(state.getState().selectedIcons,selected,'Reentering the same city retains ordered selection');
 state.getState().selectedIcons.pop();
 assert.deepEqual(state.getState().selectedIcons,selected,'Snapshots cannot mutate shared selection');
 assert.equal(state.toggleIcon(selected[0]),true);
 assert.deepEqual(state.getState().selectedIcons,selected.slice(1));
}
state.setCity('shanxi');assert.equal(state.getState().selectedCity,'taiyuan');
state.toggleIcon('youmian');state.setCity('all');
assert.equal(state.getState().availableIcons.length,24);
assert.deepEqual(state.getState().selectedIcons,['youmian'],'ALL retains still-available icons');
state.setCity('unknown');assert.equal(state.getState().selectedCity,'all');
console.log('PASS: all five city collections, stable identities, synchronized city and ordered selection, selection cap, deselection and ALL.');
