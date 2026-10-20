import assert from 'node:assert/strict';
import {createWorld} from '../dist/scripts/world.js';

class Element {
  constructor(){this.dataset={};this.attributes={};this.children=[];this.listeners={};this.hidden=false;this.value='';}
  setAttribute(k,v){this.attributes[k]=v;}
  append(el){this.children.push(el);}
  replaceChildren(...els){this.children=els;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  fire(type,target=this,extra={}){this.listeners[type]?.({target,preventDefault(){},...extra});}
  querySelectorAll(){return this.children;}
  querySelector(selector){return this.children.find(el=>selector.includes(`"${el.dataset.country}"`));}
  focus(){this.focused=true;}
}
const scene=new Element(),layer=new Element(),svg=new Element();
const fields=Object.fromEntries(['#world-country','.world-country-name','.world-availability','.world-explore','.world-description','.world-pin'].map(key=>[key,new Element()]));
scene.querySelector=selector=>selector==='.world-map'?svg:fields[selector];
svg.querySelector=()=>layer;
globalThis.document={querySelector:()=>scene,createElement:()=>new Element(),createElementNS:()=>new Element()};
globalThis.window={addEventListener(){}};
globalThis.fetch=async()=>({ok:true,json:async()=>[
  {id:'CHN',name:'China',zh:'中国',d:'M0,0L10,0L10,10Z'},
  {id:'JPN',name:'Japan',zh:'日本',d:'M20,0L30,0L30,10Z'},
]});
const navigations=[],world=createWorld({navigate:scene=>navigations.push(scene)});
await world.prepare();
const selected=()=>layer.children.filter(el=>el.dataset.selected==='true').map(el=>el.dataset.country);
const [china,japan]=layer.children,explore=fields['.world-explore'],pin=fields['.world-pin'];
assert.deepEqual(selected(),[]);assert.equal(explore.hidden,true);
layer.fire('pointerover',china);layer.fire('focusin',china);
assert.deepEqual(selected(),[],'hover and focus never select a destination');
layer.fire('click',china);
assert.deepEqual(selected(),['CHN']);assert.equal(explore.hidden,false);assert.deepEqual(navigations,[]);
explore.fire('click');assert.deepEqual(navigations,['corkboard']);
layer.fire('click',japan);
assert.deepEqual(selected(),['JPN']);assert.equal(fields['.world-availability'].textContent,'Coming Soon');
assert.equal(explore.hidden,true);explore.fire('click');assert.equal(navigations.length,1);
scene.fire('keydown',scene,{key:'Escape'});assert.deepEqual(selected(),[]);
pin.fire('keydown',pin,{key:'Enter'});assert.deepEqual(selected(),['CHN']);assert.equal(navigations.length,1);
layer.fire('keydown',china,{key:'ArrowRight'});assert.deepEqual(selected(),['CHN']);
layer.fire('keydown',japan,{key:' '});assert.deepEqual(selected(),['JPN']);
fields['#world-country'].value='';fields['#world-country'].fire('change');assert.deepEqual(selected(),[]);
console.log('PASS: empty initial state, independent hover/focus, single selection, pin/keyboard, Escape, and Explore-only navigation.');
