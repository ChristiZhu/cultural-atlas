/** One language state for UI, vector artwork, and archive images. No domain IDs are translated. */
import { uiZh } from '../locales/ui-zh.js';
import {communityZh} from '../locales/community-zh.js';
import {aboutZh} from '../locales/about-zh.js';
Object.assign(uiZh,communityZh,aboutZh);
export const LANGUAGE_KEY='cultural-atlas-language';
let language='en';
try {if(globalThis.localStorage?.getItem(LANGUAGE_KEY)==='zh')language='zh';} catch {}
export const getLanguage=()=>language;
export const isChinese=()=>language==='zh';
export function t(value){
  if(language!=='zh'||typeof value!=='string')return value;
  if(uiZh[value])return uiZh[value];
  if(/^\d+ \/ 3 selected$/.test(value))return `已选 ${value.split(' ')[0]} / 3`;
  let match;
  if((match=value.match(/^(.*?) motif (\d+)$/)))return `${t(match[1])} · 纹样 ${match[2]}`;
  if((match=value.match(/^(.*?): (\d+) icons available(?:, (\d+) selected)?\.$/)))return `${t(match[1])}：${match[2]} 个图标${match[3] ? `，已选 ${match[3]} 个` : '可用'}。`;
  if((match=value.match(/^(.+) — open the map$/)))return `${t(match[1])} — 打开地图`;
  if((match=value.match(/^Map — return to (.+)$/)))return `地图 — 返回${t(match[1])}`;
  if((match=value.match(/^(.+) (cultural )?map$/)))return `${t(match[1])}文化地图`;
  if((match=value.match(/^Explore (.+)\. Scroll to zoom, drag to pan\. Keyboard: arrows to pan, plus and minus to zoom, zero to reset\.$/)))return `探索${t(match[1])}。滚动缩放，拖动平移。键盘：方向键平移，加减键缩放，0 键复位。`;
  if((match=value.match(/^Pages (.*?) — (.*)$/)))return `第 ${match[1]} 页 — ${t(match[2])}`;
  if((match=value.match(/^Pages ([0-9–—-]+)$/)))return `第 ${match[1]} 页`;
  if((match=value.match(/^(.*?) — The Cultural Atlas$/)))return `${t(match[1])} — CULTURAL ATLAS`;
  if((match=value.match(/^Your .* pattern is ready\.$/)))return '你的纹样已生成。';
  if(value.endsWith(' colors applied. Composition unchanged.'))return '配色已更新，图案结构保持不变。';
  if((match=value.match(/^(.+) pattern using (.+)$/)))return `文化纹样，使用：${match[2].split(', ').map(t).join('、')}`;
  return value;
}
const sourceRoot=new URL('../',import.meta.url);
const textSources=new WeakMap(),attributeSources=new WeakMap();
let artworkPromise,artworkData;
const localizedImages=new Map(),archiveTranslations=new Map();
const keyFor=url=>{try{return new URL(url,document.baseURI).pathname.slice(sourceRoot.pathname.length);}catch{return '';}};
async function artwork(){if(!artworkPromise)artworkPromise=fetch(new URL('../locales/artwork-zh.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Translation artwork unavailable');return r.json();}).then(data=>artworkData=data).catch(e=>{artworkPromise=null;throw e;});return artworkPromise;}
export function applyArtwork(svg,url){
  const key=keyFor(url||svg.dataset.localeSource);svg.dataset.localeSource=url||svg.dataset.localeSource;
  if(!svg.dataset.localePrepared && Array.isArray(artworkData?.[key])){
    const nodes=[...svg.querySelectorAll('path,text')];
    for(const item of artworkData[key]){
      const original=nodes[item.index];if(!original)continue;
      const ns='http://www.w3.org/2000/svg';
      const wrapper=document.createElementNS(ns,'g');wrapper.dataset.localePair='';
      original.before(wrapper);wrapper.append(original);original.dataset.localeOriginal='';
      const replacement=original.cloneNode(false);replacement.removeAttribute('id');replacement.removeAttribute('mask');replacement.removeAttribute('filter');replacement.removeAttribute('data-locale-original');
      replacement.setAttribute('d',item.d);replacement.setAttribute('aria-label',item.zh);replacement.dataset.localeChinese='';
      for(const [name,value] of Object.entries(item.attrs||{}))replacement.setAttribute(name,value);
      wrapper.append(replacement);
    }
    svg.dataset.localePrepared='true';
  }
  for(const pair of svg.querySelectorAll('[data-locale-pair]')){
    pair.querySelector('[data-locale-original]').style.display=language==='zh'?'none':'';
    pair.querySelector('[data-locale-chinese]').style.display=language==='zh'?'':'none';
  }
  return svg;
}
export async function artworkURL(url,lang=language){
  if(lang!=='zh')return url;
  let entries=(await artwork())[keyFor(url)];if(!entries)return url;
  if(typeof entries==='string'){
    const resource=entries;
    if(!archiveTranslations.has(resource))archiveTranslations.set(resource,fetch(new URL('../locales/'+resource,import.meta.url)).then(r=>{if(!r.ok)throw new Error('Archive translation unavailable');return r.json();}).catch(e=>{archiveTranslations.delete(resource);throw e;}));
    entries=await archiveTranslations.get(resource);
  }
  const key='zh:'+url;
  if(!localizedImages.has(key))localizedImages.set(key,(async()=>{
    const response=await fetch(url);if(!response.ok)throw new Error('Artwork unavailable');
    const xml=new DOMParser().parseFromString(await response.text(),'image/svg+xml');const svg=xml.documentElement;
    const nodes=[...svg.querySelectorAll('path,text')];
    for(const item of entries){const node=nodes[item.index];if(!node)throw new Error('Translation layer mismatch');node.setAttribute('d',item.d);node.removeAttribute('mask');node.removeAttribute('filter');for(const [name,value] of Object.entries(item.attrs||{}))node.setAttribute(name,value);}
    return URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
  })().catch(e=>{localizedImages.delete(key);throw e;}));
  return localizedImages.get(key);
}
function translateText(node){
  const value=node.nodeValue;const previous=textSources.get(node);
  const source=previous && (value===previous.en||value===previous.zh)?previous.en:value;
  if(!source.trim())return;
  const translated=t(source.trim());
  const result=source.replace(source.trim(),translated);
  textSources.set(node,{en:source,zh:result});
  if(node.nodeValue!==result)node.nodeValue=result;
}
export function translateDOM(root=document.body){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,metadata,[data-language],[data-user-content],.generated-pattern,.motif-preview')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  for(let n=walker.nextNode();n;n=walker.nextNode())translateText(n);
  for(const el of root.querySelectorAll('[aria-label],[title],[alt],[placeholder]')){
    let saved=attributeSources.get(el);if(!saved){saved={};attributeSources.set(el,saved);}
    for(const attr of ['aria-label','title','alt','placeholder']){if(!el.hasAttribute(attr))continue;const v=el.getAttribute(attr),old=saved[attr];const en=old&&(v===old.en||v===old.zh)?old.en:v;const zh=t(en);saved[attr]={en,zh};if(v!==zh)el.setAttribute(attr,zh);}
  }
  for(const svg of root.querySelectorAll('svg[data-locale-source]'))applyArtwork(svg);
  if(document.title) { const current=document.title; const saved=attributeSources.get(document)||{}; const en=current===saved.zh?saved.en:current; const zh=t(en);attributeSources.set(document,{en,zh});document.title=zh; }
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  for(const button of document.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===language));
}
async function translateImages(root=document){
  await Promise.all([...root.querySelectorAll('img[src]')].map(async image=>{
    if(!image.dataset.localeImage && !image.getAttribute('src').startsWith('./assets/'))return;
    const original=image.dataset.localeImage||image.getAttribute('src');
    if(!artworkData?.[keyFor(original)])return;
    image.dataset.localeImage=original;const requested=language;const src=await artworkURL(original,requested);
    if(language===requested&&image.getAttribute('src')!==src)image.src=src;
  }));
}
let change=0;
export async function setLanguage(next){
  if(!['en','zh'].includes(next))return;
  const ticket=++change;
  document.querySelectorAll('[data-language]').forEach(b=>b.disabled=true);
  try{
    if(next==='zh')await Promise.all([artwork(),document.fonts.load('24px "Atlas Hand SC"'),document.fonts.load('23px "Atlas Display SC"'),document.fonts.load('18px "Atlas Sans SC"')]);
    if(ticket!==change)return;
    language=next;try{localStorage.setItem(LANGUAGE_KEY,next);}catch{}
    translateDOM();await translateImages();
    window.dispatchEvent(new CustomEvent('atlas:language',{detail:{language}}));
  }finally{if(ticket===change)document.querySelectorAll('[data-language]').forEach(b=>b.disabled=false);}
}
export async function initLocalization(){
  await artwork();
  translateDOM();await translateImages();
  let scheduled=false;
  const observer=new MutationObserver(records=>{
    if(records.every(r=>r.type==='attributes'&&r.attributeName==='style'))return;
    if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;observer.disconnect();translateDOM();void translateImages();observe();});}
  });
  const observe=()=>observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt','placeholder']});observe();
}
