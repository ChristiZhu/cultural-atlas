import assert from 'node:assert/strict';
import { createMapCamera } from '../dist/scripts/map-camera.js';
import { cities } from '../dist/scripts/city-data.js';
import { readFileSync } from 'node:fs';

globalThis.matchMedia = () => ({ matches: true });
let resizeCount = 0;
globalThis.ResizeObserver = class { constructor(callback) { this.callback=callback; resizeCount++; } observe() {} };
const handlers = new Map();
const surface = { dataset:{}, clientHeight:982,
  getBoundingClientRect:()=>({left:0,top:0,width:1512,height:982}),
  addEventListener(type,fn) { const list=handlers.get(type)??[];list.push(fn);handlers.set(type,list); },
  hasPointerCapture:()=>false,
};
function drawing() { return { attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];} }; }
let latest;
const makeContent = city => ({svg:drawing(),world:drawing(),bounds:city.geography});
const guangzhou=makeContent(cities.guangzhou);
const camera=createMapCamera({surface,...guangzhou,getInset:()=>289,onChange:(state,visible)=>{latest={state,visible};},onSelect(){},onDismiss(){}});
camera.refresh(); camera.zoomBy(1.25);
const original=camera.getState();
for (const city of Object.values(cities)) {
  const content=makeContent(city);
  camera.setContent(content);
  assert.deepEqual(camera.getState(),{x:0,y:0,zoom:1},`${city.id}: fresh view`);
  camera.zoomBy(1.25);
  assert.equal(camera.getState().zoom,1.25);
  assert.match(content.world.attrs.transform,/scale\(1.25\)/);
  const art=readFileSync(new URL('../dist/'+city.mapAsset.replace('./',''),import.meta.url),'utf8');
  for(const category of ['food','architecture','craft'])assert.equal((art.match(new RegExp('data-category="'+category+'"','g'))??[]).length,2);
  assert.equal((art.match(/data-item=/g)??[]).length,6);
  assert(!art.includes('<image'),`${city.id}: map is vector`);
  if(city.id!=='guangzhou')assert(Math.abs(city.minimapBounds.width/city.minimapBounds.height-city.geography.width/city.geography.height)<1e-8,`${city.id}: minimap aspect`);
}
camera.setContent(guangzhou,original);
assert.deepEqual(camera.getState(),original,'restores exact prior camera');
assert.equal(resizeCount,1,'one observer for all cities');
for(const [event,list] of handlers)assert.equal(list.length,1,`one ${event} listener after all switches`);
handlers.get('wheel')[0]({preventDefault(){},deltaY:-30,deltaMode:0,ctrlKey:false,clientX:1000,clientY:500});
assert(Math.abs(camera.getState().zoom-original.zoom*Math.exp(.06))<1e-9,'wheel zoom applied exactly once');
surface.getBoundingClientRect=()=>({left:0,top:0,width:2400,height:1080});
camera.refresh();
const [x,,width]=guangzhou.svg.attrs.viewBox.split(' ').map(Number);
assert(x<0 && width>1512,'wide desktop extends SVG to browser edges');
assert(latest.visible.width>1512,'wide camera accounts for the extended viewport');
console.log('PASS: five city cameras, exact restoration, one set of listeners, wheel zoom, full-width viewport, 30 vector markers and aspect-correct minimaps.');
