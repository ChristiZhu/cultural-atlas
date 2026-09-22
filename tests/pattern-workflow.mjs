/** Lifecycle harness with controlled animation completions and asset scheduling. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {palettesDiffer} from '../dist/scripts/pattern-colors.js';
import {libraryState,culturalIcons} from '../dist/scripts/library-state.js?v=20260922-library-final';
const animations=[],frames=[];
class Element {
 constructor(){this.children=[];this.dataset={};this.attributes={};this.style={setProperty:(k,v)=>this.style[k]=v};this.clientWidth=1920;this.clientHeight=1080;this.innerHTML='';}
 querySelector(s){return elements.get(s);} querySelectorAll(){return [];}
 replaceChildren(...children){this.children=children;this.innerHTML='';} append(e){this.children.push(e);}
 setAttribute(k,v){this.attributes[k]=v;} removeAttribute(k){delete this.attributes[k];}
 getBoundingClientRect(){return {x:400,y:200,left:400,top:200,right:1500,bottom:830,width:1100,height:630};}
 animate(keyframes,options){let resolve,reject;const el=this,motion={keyframes,options,settled:false,finished:new Promise((a,b)=>{resolve=a;reject=b;}),finish(){this.settled=true;resolve();},commitStyles(){Object.assign(el.style,keyframes.at(-1));},cancel(){this.settled=true;reject(new DOMException('Cancelled','AbortError'));}};animations.push(motion);return motion;}
}
const elements=new Map();for(const s of ['#pattern-creating','.floating-field','.library-art','.generated-pattern','#pattern-preview','#pattern-save','.selected-source-icons','.motif-preview','#pattern-preview .pattern-announcement','#status','#icon-selection-hint'])elements.set(s,new Element());
for(const scene of ['pattern-preview','pattern-save'])elements.set(`#${scene} .generated-pattern`,new Element());
const navigations=[];let reduce=false;
globalThis.document={querySelector:s=>elements.get(s),createElement:()=>new Element(),body:new Element()};
globalThis.matchMedia=()=>({get matches(){return reduce;}});globalThis.Image=class extends Element{};
globalThis.requestAnimationFrame=callback=>frames.push(callback);
globalThis.DOMParser=class{parseFromString(source){return {querySelector:()=>null,documentElement:{children:[{xml:source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}]}};}};
globalThis.XMLSerializer=class{serializeToString(child){return child.xml;}};
globalThis.fetch=async url=>({ok:true,text:async()=>fs.readFileSync(new URL('../dist/'+url.slice(2),import.meta.url),'utf8')});
const {createPatternWorkflow}=await import('../dist/scripts/pattern-workflow.js');
const workflow=createPatternWorkflow({navigate:async(...args)=>navigations.push(args)});
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const finishPhase=async()=>{for(const a of animations.filter(a=>!a.settled))a.finish();await flush();};
const generate=async()=>{for(const frame of frames.splice(0))frame();await flush();};
await assert.rejects(()=>workflow.prepare('pattern-creating'),/Choose at least/);
for(const id of ['canton-tower','porcelain-1','har-gow'])libraryState.toggleIcon(id);
for(let round=0;round<3;round++){
 workflow.leave();const old=workflow.getResult(),oldPreview=elements.get('#pattern-preview .generated-pattern').innerHTML;
 await workflow.prepare('pattern-creating');assert.strictEqual(workflow.getResult(),old);assert.equal(elements.get('#pattern-preview .generated-pattern').innerHTML,oldPreview);
 const running=workflow.enter('pattern-creating');assert.equal(workflow.getState().state,'creating');assert.equal(elements.get('.floating-field').children.length,16);
 assert.equal(workflow.getState().pendingGeneratedPattern,null,'Computation must wait until exploration starts');
 await generate();const pending=workflow.getState().pendingGeneratedPattern;assert(pending);assert.strictEqual(workflow.getResult(),old);
 assert.equal(elements.get('#pattern-preview .generated-pattern').innerHTML,oldPreview,'Pending result cannot leak into Preview');
 const navCount=navigations.length;
 await finishPhase();assert.equal(elements.get('#pattern-creating').dataset.phase,'motif');assert.equal(navigations.length,navCount);
 await finishPhase();assert.equal(elements.get('#pattern-creating').dataset.phase,'convergence');assert.strictEqual(workflow.getResult(),old);
 await finishPhase();await running;assert.strictEqual(workflow.getResult(),pending);assert.equal(workflow.getState().pendingGeneratedPattern,null);
 assert.equal(navigations.at(-1)[0],'pattern-preview');assert.deepEqual(pending.selectedIcons,['canton-tower','porcelain-1','har-gow']);
 if(old)assert.notEqual(pending.grammar,old.grammar);
}
const composition=workflow.getResult(),navigationCount=navigations.length,animationCount=animations.length;
const renderedBefore=elements.get('#pattern-preview .generated-pattern').innerHTML;
for(const mode of ['authentic','vivid','harmonious','surprise']){
 workflow.recolor(mode);const colored=workflow.getResult();assert.strictEqual(colored.items,composition.items);assert.equal(colored.palette.mode,mode);
 workflow.recolor(mode,true);assert(palettesDiffer(workflow.getResult().palette,colored.palette),'Shuffle must visibly change motif colors, not just the background');assert.strictEqual(workflow.getResult().items,composition.items);
 assert.equal(navigations.length,navigationCount);assert.equal(animations.length,animationCount);
 assert.equal(elements.get('#pattern-preview .generated-pattern').innerHTML,renderedBefore,'Recolor cannot replace the SVG tree');
 await workflow.prepare('pattern-save');assert.equal(workflow.getResult().palette.mode,mode,'Save must preserve the current mode');
}
workflow.leave();const displayed=workflow.getResult();await workflow.prepare('pattern-creating');const cancelled=workflow.enter('pattern-creating');await generate();workflow.leave();await cancelled;assert.strictEqual(workflow.getResult(),displayed);assert.equal(workflow.getState().pendingGeneratedPattern,null);
// Reduced motion still has a real, visible Creating interval on every request.
reduce=true;for(let i=0;i<2;i++){
 await workflow.prepare('pattern-creating');const count=navigations.length,running=workflow.enter('pattern-creating');await generate();assert.equal(navigations.length,count);
 assert(animations.filter(a=>!a.settled).every(a=>a.options.duration===650));await finishPhase();await running;assert.equal(navigations.length,count+1);workflow.leave();
}
await workflow.prepare('pattern-save');assert.equal(workflow.canShowResult(),true);libraryState.toggleIcon('har-gow');assert.equal(workflow.canShowResult(),false,'Stale selection cannot be shown through history');
// The existing workflow must load the new vectors and keep city identity through
// generation, Back, Redo, recoloring, Save and a switch to a different city.
for(const city of ['guangzhou','beijing','shanghai','taiyuan','dehong']){
 libraryState.setCity(city);
 for(const id of libraryState.getState().selectedIcons)libraryState.toggleIcon(id);
 const ids=culturalIcons.filter(icon=>icon.city===city).slice(-3).map(icon=>icon.id);
 for(const id of ids)libraryState.toggleIcon(id);
 assert.equal(workflow.canShowResult(),false);
 for(let round=0;round<2;round++){
  workflow.leave();await workflow.prepare('pattern-creating');
  const running=workflow.enter('pattern-creating');await generate();await finishPhase();await running;
  assert.equal(workflow.getResult().selectedCity,city);
  assert.deepEqual(workflow.getResult().selectedIcons,ids);
  await workflow.prepare('choose-icons');
  assert.equal(libraryState.getState().selectedCity,city);
  assert.deepEqual(libraryState.getState().selectedIcons,ids);
  assert.equal(workflow.canShowResult(),true);
  const geometry=workflow.getResult().items;
  workflow.recolor('authentic');assert.strictEqual(workflow.getResult().items,geometry);
  await workflow.prepare('pattern-save');
  assert.equal(workflow.getResult().selectedCity,city);
  assert.deepEqual(workflow.getResult().selectedIcons,ids);
 }
}
console.log('PASS: initial/Redo/Back generations all run three phases; pending results never render early; cancellation discards pending work; reduced motion preserves Creating; stale selections cannot bypass generation.');
console.log('PASS: five cities retain their selected city and source icons through generation, Back, Redo, recoloring and Save.');
