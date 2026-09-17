import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transitionWorkflow,transitionSuccess} from '../dist/scripts/transitions.js';
const motions=[];
class Element {
 constructor(){this.style={};this.attributes={};}
 getAttribute(k){return this.attributes[k]??null;} setAttribute(k,v){this.attributes[k]=v;} removeAttribute(k){delete this.attributes[k];if(k==='style')this.style={};}
 animate(frames,options){let finish;const m={options,finished:new Promise(resolve=>finish=resolve),finish:()=>finish(),cancel(){}};motions.push(m);return m;}
}
globalThis.document={body:new Element()};globalThis.matchMedia=()=>({matches:false});globalThis.getComputedStyle=()=>({backgroundColor:'#84c9e1'});
let commits=0;const outgoing=new Element(),incoming=new Element();
const navigation=transitionWorkflow('#ffeff9',()=>commits++,outgoing,incoming);assert.equal(commits,1);assert.equal(motions.at(-1).options.duration,220);motions.at(-1).finish();await navigation;assert.deepEqual(outgoing.style,{});
const modal=new Element();const close=transitionSuccess(modal,false,()=>commits++);assert.equal(commits,1);assert.equal(motions.at(-1).options.duration,140);motions.at(-1).finish();await close;assert.equal(commits,2);
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert(!html.includes('id="pattern-saved"'),'Saved state must reuse the live Save, not duplicate it');
assert(!fs.readFileSync(new URL('../dist/assets/library/preview.svg',import.meta.url),'utf8').includes('preview-1324'),'Duplicate MAP artwork must be removed at source');
const {scenes}=await import('../dist/scripts/scenes.js');assert.equal(scenes['pattern-saved'].elementId,scenes['pattern-save'].elementId);
assert.match(html,/aria-label="Close save confirmation"[^>]+data-nav="pattern-save"/);
console.log('PASS: 220ms real-scene transitions clean up; modal close is 140ms and reuses live Save; duplicate MAP export layer is removed.');
