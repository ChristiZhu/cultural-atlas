import assert from 'node:assert/strict';
import {createWindowEntrance,ENTRANCE_TIMING as timing,windowProjectionFrames} from '../dist/scripts/window-entrance.js';

// Inspect the projected rotation across its edge, where the old two easings stopped.
const closed=windowProjectionFrames('closed'),open=windowProjectionFrames('open');
const width=frame=>Number(frame.transform.match(/scale\(([^,]+)/)[1]);
const signed=closed.map((frame,i)=>width(frame)-width(open[i]));
assert.equal(signed[0],1);assert.equal(signed.at(-1),-1);
for(let i=1;i<signed.length;i++)assert(signed[i]<signed[i-1],'Rotation must advance at every sample');
const before=signed[59]-signed[60],after=signed[60]-signed[61];
assert(before>.02&&Math.abs(before-after)<1e-10,'No midpoint stall or velocity restart');
assert(timing.open>=1000&&timing.open<=1500);
assert(timing.opened-timing.open>=1500&&timing.opened-timing.open<=2000);
assert(timing.fade-timing.opened>=400,'The fully open window must remain visible');
assert(timing.end>=3500&&timing.end<=4500);

let clock=0;const motions=[];
class Element {
 constructor(dataset={}){this.dataset=dataset;this.style={};this.attributes={};this.classList={add(){}};this.nodes={};}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];if(k==='style')this.style={};}
 querySelector(s){return this.nodes[s];}
 querySelectorAll(s){return this.nodes[s]??[];}
 insertBefore(){}
 animate(frames,options){
  let finish,reject;const animation={element:this,frames,options,end:clock+options.delay+options.duration,
   finished:new Promise((resolve,fail)=>{finish=resolve;reject=fail;}),finish:()=>finish(),cancel:()=>reject(new DOMException('Cancelled','AbortError'))};
  motions.push(animation);return animation;
 }
}
const art=new Element();
for(const name of ['curtain','closed-pane','open-pane'])art.nodes[`[data-motion="${name}"]`]=['left','right'].map(side=>new Element({side}));
for(const name of ['recess','curtain-closed','curtain-open','shadow','hinges'])art.nodes[`[data-motion="${name}"]`]=[new Element()];
art.nodes['[data-stem],[data-flower]']=[new Element({stem:'0',pivot:'1210 796'}),new Element({flower:'0',pivot:'1210 796'})];
art.nodes['[data-leaf]']=[new Element()];
art.nodes['[style]']=Object.values(art.nodes).flat();
globalThis.fetch=async()=>({ok:true,text:async()=>'<svg/>'});
globalThis.DOMParser=class{parseFromString(){return {querySelector:()=>null,documentElement:art};}};
globalThis.document={importNode:node=>node};
globalThis.matchMedia=()=>({matches:false});
const home=new Element(),trigger=new Element(),incoming=new Element();
home.nodes['.scene__art']=new Element();incoming.inert=true;
const entrance=createWindowEntrance(home,trigger);
const settle=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
async function advance(time){clock=time;for(const m of motions)if(m.end<=time)m.finish();await settle();}
await entrance.prepare();assert.equal(motions.length,0,'No autoplay');
let commits=0;const commit=()=>{commits++;incoming.inert=false;};
const run=entrance.enter({ready:Promise.resolve(),commit,incoming});
assert.equal(run,entrance.enter({ready:Promise.resolve(),commit,incoming}),'Repeated clicks do not restart');
await settle();
const leaves=motions.filter(m=>m.element.dataset.side&&m.frames.length===121);
assert.equal(leaves.length,4);
for(const leaf of leaves){assert.equal(leaf.options.delay,1300);assert.equal(leaf.options.duration,1800);assert.equal(leaf.options.easing,'cubic-bezier(.42,0,.58,1)');}
await advance(3100);assert.equal(commits,0);assert(incoming.inert);
await advance(3600);assert.equal(home.dataset.entrance,'ENTERING');assert(incoming.inert);
await advance(4199);assert.equal(commits,0);
await advance(4200);await run;assert.equal(commits,1);
entrance.reset();assert.equal(home.dataset.entrance,'CLOSED');assert.equal(home.nodes['.scene__art'].hidden,false);assert('hidden' in art.attributes);

let release;incoming.inert=true;
const delayed=entrance.enter({ready:new Promise(r=>release=r),commit,incoming});await settle();
await advance(8400);assert.equal(commits,1);assert(incoming.inert,'Board must wait for assets');
release();await settle();await advance(9000);await delayed;assert.equal(commits,2,'A return visit can replay');
const interrupted=entrance.enter({ready:Promise.resolve(),commit,incoming});interrupted.catch(()=>{});await settle();await entrance.cancel();
assert.equal(commits,2);assert.equal(home.dataset.entrance,'CLOSED');
console.log('PASS: wind first, 1.8s continuous opening, 4.2s entrance, delayed assets, click lock, replay and cancellation.');
