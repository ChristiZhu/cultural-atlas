import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createArchive } from '../dist/scripts/archive.js';

const motions = [], loads = [];
let decodeHook=()=>Promise.resolve(),motionHook=()=>Promise.resolve();
class Element {
  constructor() { this.style = {}; this.dataset = {}; this.children = []; this.events = {}; this.attributes = {}; }
  addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
  emit(type, event = {}) { for (const fn of this.events[type] ?? []) fn({ preventDefault() {}, ...event }); }
  setAttribute(k, v) { this.attributes[k] = v; }
  removeAttribute(k) { delete this.attributes[k]; if (k === 'style') this.style = {}; }
  replaceWith(child) { if(this.parent){const at=this.parent.children.indexOf(this);this.parent.children[at]=child;child.parent=this.parent;} }
  append(child) { child.parent = this; this.children.push(child); }
  remove() { this.parent.children = this.parent.children.filter(c => c !== this); }
  querySelector(selector) { return this.nodes[selector]; }
  querySelectorAll(selector) {
    if(selector==='.archive-sheet')return this.children.filter(c=>c.className==='archive-sheet');
    if(selector==='.archive-sheet img')return this.querySelectorAll('.archive-sheet').flatMap(s=>s.children.flatMap(f=>f.children));
    return [];
  }
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  animate(frames, options) {
    motions.push({ frames, options, className: this.className });
    return { finished: motionHook(this,frames,options), cancel() {}, commitStyles() { throw new Error('commitStyles unsupported'); } };
  }
}
const atlas = new Element(), viewport = new Element();
globalThis.document = { createElement: () => new Element(), querySelector: s => s === '#atlas' ? atlas : viewport };
globalThis.Image = class extends Element {
  decode() { loads.push(this.src); assert(fs.existsSync(new URL('../dist/' + this.src, import.meta.url))); return decodeHook(this); }
};
globalThis.matchMedia = () => ({ matches: false });
globalThis.getComputedStyle = () => ({ opacity: '1', transform: 'none' });
globalThis.cancelAnimationFrame = () => {};
const settle = async () => { for (let i = 0; i < 150; i++) await Promise.resolve(); };

for (const book of ['canton', 'porcelain', 'shrimp', 'five-rams']) {
  const dialog = new Element();
  dialog.nodes = Object.fromEntries(['.archive-backdrop', '.archive-stage', '.archive-art', '.archive-hit', '.archive-cursor',
    '[data-page="previous"]', '[data-page="next"]', '[data-page="cover"]', '.archive-status'].map(s => [s, new Element()]));
  const stage = dialog.nodes['.archive-stage'];
  stage.append(dialog.nodes['.archive-art']);
  let restored = 0, closed = 0;
  const archive = createArchive(dialog, { onRestore: () => restored++, onClose: () => closed++ });
  await archive.open(book);
  assert.equal(dialog.dataset.bookState, 'FRONT_COVER');
  assert.equal(atlas.inert, true);
  const keys = ['SPREAD_01_02', 'SPREAD_03_04', 'SPREAD_05_06', 'SPREAD_07_08', 'BACK_COVER', 'FRONT_COVER'];
  for (const expected of keys) {
    dialog.emit('keydown', { key: 'ArrowRight' }); await settle();
    assert.equal(dialog.dataset.bookState, expected, `${book} page sequence`);
    assert.equal(stage.querySelectorAll('.archive-sheet').length, 0, 'Turning leaves must be removed after each turn');
    assert.equal(stage.style.width, undefined, 'Page turns must never resize the stage');
    assert.equal(stage.style.height, undefined, 'Page turns must never resize the stage');
    assert.equal(atlas.inert, true);
  }
  dialog.emit('keydown', { key: 'ArrowRight' }); await settle();
  dialog.emit('keydown', { key: 'ArrowRight' }); await settle();
  dialog.emit('keydown', { key: 'ArrowLeft' }); await settle();
  assert.equal(dialog.dataset.bookState, 'SPREAD_01_02');
  await archive.close();
  assert.equal(dialog.open, false); assert.equal(atlas.inert, false);
  assert.equal(restored, 1); assert.equal(closed, 1);
}
assert(motions.some(m => m.options.duration === 420 && m.frames.at(-1).transform?.startsWith('translateX')));
assert(motions.some(m => m.options.duration === 850 && m.frames.at(-1).transform === 'rotateY(180deg)'));
assert.equal(new Set(loads.filter(s => /porcelain.*svg$/.test(s))).size, 6);
const fit = JSON.parse(fs.readFileSync(new URL('../dist/assets/archive/guangcai-fit.json', import.meta.url)));
for (const page of fit) {
  assert.deepEqual(page.stage, [1512, 982]);
  if (page.sourceSpine !== null) assert(Math.abs(page.sourceSpine * page.scale + page.translate[0] - 756) < 1e-6);
}
console.log('PASS: all four archives use all six states, forward/back/closed-cover transitions, fixed stage, shared spine, and restore background interaction on exit.');

// Failure/lifecycle regression cases use the real engine and controlled async work.
function harness(){
  const dialog=new Element();
  dialog.nodes=Object.fromEntries(['.archive-backdrop','.archive-stage','.archive-art','.archive-hit','.archive-cursor',
    '[data-page="previous"]','[data-page="next"]','[data-page="cover"]','.archive-status'].map(s=>[s,new Element()]));
  const stage=dialog.nodes['.archive-stage'];stage.append(dialog.nodes['.archive-art']);
  return {dialog,stage,archive:createArchive(dialog,{}),
    key:key=>dialog.emit('keydown',{key}),
    stable:expected=>{
      assert.equal(dialog.dataset.bookState,expected);
      assert.equal(dialog.attributes['aria-busy'],undefined,'Interaction lock released');
      assert.equal(stage.querySelectorAll('.archive-sheet').length,0,'No invisible leaf interceptors');
      const art=stage.children.find(e=>e.className==='archive-art');
      assert.notEqual(art.style.visibility,'hidden','Stable art restored');
      assert.notEqual(art.style.opacity,'0','Stable art remains visible');
    }};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const h=harness();
for(const id of ['porcelain','shrimp','five-rams','canton','shrimp','five-rams','porcelain','canton']){
  await h.archive.open(id);
  for(const key of ['ArrowRight','ArrowRight','ArrowRight','ArrowLeft','ArrowLeft']){h.key(key);await settle();}
  h.stable('SPREAD_01_02');await h.archive.close();
  assert.equal(atlas.inert,false);
}
await h.archive.open('porcelain');
for(let n=0;n<20;n++)h.key(n%2?'ArrowLeft':'ArrowRight');
await settle();h.stable('SPREAD_01_02');
// Cancelled or hung effects restore the last complete page and unlock retry.
motionHook=()=>Promise.reject(new DOMException('Interrupted','AbortError'));
h.key('ArrowRight');await settle();h.stable('SPREAD_01_02');
motionHook=()=>Promise.resolve();h.key('ArrowRight');await settle();h.stable('SPREAD_03_04');
// Actual leaf-image decoding is checked before hiding any stable artwork.
let failed=false;
decodeHook=img=>{if(img.parent&&!failed){failed=true;return Promise.reject(new Error('Leaf decode failed'));}return Promise.resolve();};
h.key('ArrowRight');await settle();h.stable('SPREAD_03_04');
decodeHook=()=>Promise.resolve();h.key('ArrowRight');await settle();h.stable('SPREAD_05_06');
// Close while page animation never completes: reopen is immediately functional.
const hanging=deferred();motionHook=()=>hanging.promise;
h.key('ArrowRight');await settle();motionHook=()=>Promise.resolve();
await h.archive.close();await h.archive.open('porcelain');h.key('ArrowRight');await settle();h.stable('SPREAD_01_02');
hanging.resolve();await settle();h.stable('SPREAD_01_02');await h.archive.close();
// Cold/slow load: preserve cover, wait for ALL assets before first turn.
const slow=deferred();decodeHook=img=>img.src.endsWith('porcelain-03-04.svg')?slow.promise:Promise.resolve();
const cold=harness();await cold.archive.open('porcelain');cold.key('ArrowRight');await settle();
assert.equal(cold.dialog.dataset.bookState,'FRONT_COVER');assert.equal(cold.stage.querySelectorAll('.archive-sheet').length,0);
slow.resolve();decodeHook=()=>Promise.resolve();await settle();cold.stable('SPREAD_01_02');
cold.key('ArrowRight');await settle();cold.stable('SPREAD_03_04');await cold.archive.close();
// Failed initial download can be retried without a stale preload promise.
let downloadFail=true;decodeHook=img=>downloadFail&&img.src.endsWith('porcelain-03-04.svg')?Promise.reject(new Error('Offline')):Promise.resolve();
const offline=harness();await offline.archive.open('porcelain');offline.key('ArrowRight');await settle();offline.stable('FRONT_COVER');
downloadFail=false;offline.key('ArrowRight');await settle();offline.stable('SPREAD_01_02');await offline.archive.close();
// Close before cover download resolves: stale opening cannot remount the dialog.
const late=deferred();decodeHook=img=>img.src.endsWith('porcelain-front.svg')?late.promise:Promise.resolve();
const pending=harness(),opening=pending.archive.open('porcelain');
await pending.archive.close();late.resolve();assert.equal(await opening,false);assert(!pending.dialog.open);
decodeHook=()=>Promise.resolve();await pending.archive.open('canton');pending.key('ArrowRight');await settle();pending.stable('SPREAD_01_02');await pending.archive.close();
// Completion watchdog for a browser that never settles animation.finished.
const originalTimer=globalThis.setTimeout;
globalThis.setTimeout=(callback,ms)=>originalTimer(callback,ms<5000?1:ms);
await h.archive.open('porcelain');motionHook=()=>new Promise(()=>{});
h.key('ArrowRight');await new Promise(resolve=>originalTimer(resolve,20));await settle();h.stable('FRONT_COVER');
motionHook=()=>Promise.resolve();globalThis.setTimeout=originalTimer;
h.key('ArrowRight');await settle();h.stable('SPREAD_01_02');await h.archive.close();
console.log('PASS: repeat open/close, cross-archive switching, rapid input, cancelled/hung effects, failed leaf decode, cold delayed assets, failed download retry, and stale opening cancellation.');
