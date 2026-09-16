/** Unit harness for generation lifecycle; no real browser or application state is inspected. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {libraryState} from '../dist/scripts/library-state.js';
const animations=[];
class Element {
 constructor(){this.children=[];this.dataset={};this.attributes={};this.style={setProperty:(key,value)=>this.style[key]=value};this.clientWidth=1920;this.clientHeight=1080;}
 querySelector(selector){return elements.get(selector);}
 querySelectorAll(){return [];}
 replaceChildren(...children){this.children=children;}
 append(element){this.children.push(element);}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 getBoundingClientRect(){return {x:400,y:200,left:400,top:200,right:1500,bottom:830,width:1100,height:630};}
 animate(frames,options){let resolve,reject;const motion={frames,options,finished:new Promise((res,rej)=>{resolve=res;reject=rej;}),finish(){resolve();},cancel(){reject(new DOMException('Cancelled','AbortError'));}};animations.push(motion);return motion;}
 click(){if(this.download)downloads.push(this.download);}
 remove(){}
}
const elements=new Map();for(const selector of ['#pattern-creating','.floating-field','.library-art','.generated-pattern','#pattern-preview','#pattern-save','#pattern-saved','.selected-source-icons','.motif-preview','#pattern-preview .pattern-announcement','#status'])elements.set(selector,new Element());
for(const scene of ['pattern-creating','pattern-preview','pattern-save','pattern-saved'])elements.set(`#${scene} .generated-pattern`,new Element());
elements.set('#pattern-creating .generated-pattern',elements.get('.generated-pattern'));
const downloads=[],navigations=[];let reduce=false;
globalThis.document={querySelector:s=>elements.get(s),createElement:()=>new Element(),body:new Element()};
globalThis.matchMedia=()=>({get matches(){return reduce;}});
globalThis.Image=class extends Element{};
globalThis.DOMParser=class{parseFromString(source){return {querySelector:()=>null,documentElement:{children:[{xml:source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}]}};}};
globalThis.XMLSerializer=class{serializeToString(child){return child.xml;}};
globalThis.fetch=async url=>({ok:true,text:async()=>fs.readFileSync(new URL('../dist/'+url.slice(2),import.meta.url),'utf8')});
const originalSetTimeout=globalThis.setTimeout;globalThis.setTimeout=(callback,ms)=>{const timer=originalSetTimeout(callback,ms);timer.unref();return timer;};
const {createPatternWorkflow}=await import('../dist/scripts/pattern-workflow.js');
const workflow=createPatternWorkflow({navigate:async(...args)=>navigations.push(args)});
await assert.rejects(()=>workflow.prepare('pattern-creating'),/Choose at least/);
libraryState.toggleIcon('canton-tower');libraryState.toggleIcon('porcelain-1');libraryState.toggleIcon('har-gow');
await workflow.prepare('pattern-creating',{regenerate:true});const first=workflow.getResult();
assert.deepEqual(first.selectedIcons,['canton-tower','porcelain-1','har-gow']);assert.equal(first.palette.mode,'authentic');
const active=workflow.enter('pattern-creating');assert.equal(elements.get('.floating-field').children.length,16);
assert(animations.some(a=>a.frames.some(f=>f.transform?.includes('rotate('))));assert(animations.some(a=>a.options.duration===8200));
workflow.leave();await active;assert.equal(navigations.length,0,'Leaving must cancel automatic result navigation');
assert.equal(elements.get('.floating-field').children.length,0);
await workflow.prepare('pattern-creating',{regenerate:true});assert.notEqual(workflow.getResult().grammar,first.grammar);assert.deepEqual(workflow.getResult().selectedIcons,first.selectedIcons);
const second=workflow.getResult();await workflow.prepare('pattern-save');assert.strictEqual(workflow.getResult(),second,'Saving must reuse exactly the previewed result');
reduce=true;await workflow.enter('pattern-creating');assert.equal(navigations.at(-1)[0],'pattern-preview');assert.equal(navigations.at(-1)[1].patternContinuation,true);
workflow.save();assert.equal(navigations.at(-1)[0],'pattern-saved');assert.match(downloads.at(-1),new RegExp(`${second.grammar}-${second.seed}\\.svg$`));
console.log('PASS: selection handoff, 16 animated symbols, motion cancellation, regeneration without selection changes, reduced motion, preview/save identity and generated SVG download.');
