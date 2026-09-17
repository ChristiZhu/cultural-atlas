import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createArchive } from '../dist/scripts/archive.js';

const motions = [], loads = [];
class Element {
  constructor() { this.style = {}; this.dataset = {}; this.children = []; this.events = {}; this.attributes = {}; }
  addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
  emit(type, event = {}) { for (const fn of this.events[type] ?? []) fn({ preventDefault() {}, ...event }); }
  setAttribute(k, v) { this.attributes[k] = v; }
  removeAttribute(k) { delete this.attributes[k]; if (k === 'style') this.style = {}; }
  append(child) { child.parent = this; this.children.push(child); }
  remove() { this.parent.children = this.parent.children.filter(c => c !== this); }
  querySelector(selector) { return this.nodes[selector]; }
  querySelectorAll(selector) { return this.children.filter(c => selector === '.archive-sheet' && c.className === 'archive-sheet'); }
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  animate(frames, options) {
    motions.push({ frames, options, className: this.className });
    return { finished: Promise.resolve(), cancel() {}, commitStyles() {} };
  }
}
const atlas = new Element(), viewport = new Element();
globalThis.document = { createElement: () => new Element(), querySelector: s => s === '#atlas' ? atlas : viewport };
globalThis.Image = class extends Element {
  decode() { loads.push(this.src); assert(fs.existsSync(new URL('../dist/' + this.src, import.meta.url))); return Promise.resolve(); }
};
globalThis.matchMedia = () => ({ matches: false });
globalThis.getComputedStyle = () => ({ opacity: '1', transform: 'none' });
globalThis.cancelAnimationFrame = () => {};
const settle = async () => { for (let i = 0; i < 60; i++) await Promise.resolve(); };

for (const book of ['canton', 'porcelain']) {
  const dialog = new Element();
  dialog.nodes = Object.fromEntries(['.archive-backdrop', '.archive-stage', '.archive-art', '.archive-hit', '.archive-cursor',
    '[data-page="previous"]', '[data-page="next"]', '[data-page="cover"]', '.archive-status'].map(s => [s, new Element()]));
  const stage = dialog.nodes['.archive-stage'];
  let restored = 0, closed = 0;
  const archive = createArchive(dialog, { onRestore: () => restored++, onClose: () => closed++ });
  await archive.open(book);
  assert.equal(dialog.dataset.bookState, 'FRONT_COVER');
  assert.equal(atlas.inert, true);
  const keys = ['SPREAD_01_02', 'SPREAD_03_04', 'SPREAD_05_06', 'SPREAD_07_08', 'BACK_COVER', 'FRONT_COVER'];
  for (const expected of keys) {
    dialog.emit('keydown', { key: 'ArrowRight' }); await settle();
    assert.equal(dialog.dataset.bookState, expected, `${book} page sequence`);
    assert.equal(stage.children.length, 0, 'Turning leaves must be removed after each turn');
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
console.log('PASS: both archives use all six states, forward/back/closed-cover transitions, fixed stage, shared spine, and restore background interaction on exit.');
