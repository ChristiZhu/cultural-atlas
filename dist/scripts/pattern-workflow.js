import { culturalIcons, libraryState } from './library-state.js';
import { generatePattern, renderPatternSVG, TILE_SIZE } from './pattern-generator.js';
import { renderArtwork, exportArtworkPNG } from './pattern-export.js';
import {COLOR_ROLES, paletteSwatches, palettesDiffer, recolorPattern} from './pattern-colors.js';
import { prepareScene } from './scenes.js';

const imageSVG=(body,color)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" color="${color}">${body}</svg>`;
const dataURL=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
export function createPatternWorkflow({navigate}) {
  const creating=document.querySelector('#pattern-creating'),field=creating.querySelector('.floating-field');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),assets={},pending=new Map(),motions=new Set();
  let colorMode='harmonious',colorSeed=0;
  const colorPanel=document.querySelector('.color-controls');
  let currentDisplayedPattern=null,pendingGeneratedPattern=null,selectionKey='',run=0,state='idle',exporting=false;
  const currentIcons=()=>libraryState.getState().selectedIcons.map(id=>culturalIcons.find(icon=>icon.id===id));
  async function loadIcon(icon) {
    if(assets[icon.id])return;
    if(!pending.has(icon.id))pending.set(icon.id,(async()=>{
      const response=await fetch(icon.svg);if(!response.ok)throw new Error('An icon could not load.');
      const source=await response.text();
      const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
      if(parsed.querySelector('parsererror'))throw new Error('An icon could not load.');
      assets[icon.id]=[...parsed.documentElement.children].map(child=>new XMLSerializer().serializeToString(child)).join('');
    })().catch(error=>{pending.delete(icon.id);throw error;}));
    await pending.get(icon.id);
  }
  function renderResult() {
    const result=currentDisplayedPattern;
    for(const scene of ['pattern-preview','pattern-save']) {
      const container=document.querySelector(`#${scene} .generated-pattern`);
      container.innerHTML=renderArtwork(result,assets,scene);
      container.dataset.grammar=result.grammar;container.dataset.seed=result.seed;
      container.setAttribute('aria-label',`${result.grammar.replaceAll('-',' ')} pattern using ${currentIcons().map(icon=>icon.label).join(', ')}`);
    }
    const previews=document.querySelector('.selected-source-icons');previews.replaceChildren();
    currentIcons().forEach(icon=>{
      const img=new Image();img.src=dataURL(imageSVG(assets[icon.id].replaceAll('="white"','="#206EB8"'),'#FFFFFF'));img.alt=icon.label;previews.append(img);
    });
    const tile=document.querySelector('.motif-preview');tile.style.setProperty('--selected-count',currentIcons().length);
    tile.innerHTML=renderPatternSVG(result,assets,{width:92,height:92,prefix:'motif-preview'});
    syncColorControls();
    document.querySelector('#pattern-preview .pattern-announcement').textContent=`Your ${result.grammar.replaceAll('-',' ')} pattern is ready.`;
  }
  function syncColorControls(){
    if(!colorPanel||!currentDisplayedPattern)return;
    const palette=currentDisplayedPattern.palette;
    colorPanel.querySelectorAll('[data-color-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.colorMode===palette.mode)));
    const swatches=colorPanel.querySelector('.palette-swatches');
    swatches.replaceChildren(...paletteSwatches(palette).map(color=>{
      const swatch=document.createElement('span');swatch.className='palette-swatch';swatch.style.backgroundColor=color;swatch.title=color;swatch.setAttribute('aria-label',color);return swatch;
    }));
    swatches.setAttribute('aria-label',`${palette.name}: ${paletteSwatches(palette).join(', ')}`);
  }
  function recolor(mode=colorMode,shuffle=false){
    if(!canShowResult()||state!=='ready')return;
    if(!shuffle&&mode===colorMode)return;
    colorMode=mode;if(shuffle)colorSeed++;
    const previous=currentDisplayedPattern.palette;
    let next=recolorPattern(currentDisplayedPattern,currentIcons(),colorMode,colorSeed);
    // A shuffle always gives a visibly different set, even after palette reduction.
    for(let attempt=0;shuffle&&!palettesDiffer(next.palette,previous)&&attempt<24;attempt++)next=recolorPattern(currentDisplayedPattern,currentIcons(),colorMode,++colorSeed);
    if(shuffle&&!palettesDiffer(next.palette,previous)){
      const roles=COLOR_ROLES.slice(1),colors=roles.map(role=>next.palette[role]);
      next.palette={...next.palette,...Object.fromEntries(roles.map((role,i)=>[role,colors[(i+1)%colors.length]]))};
    }
    currentDisplayedPattern=next;
    for(const selector of ['#pattern-preview .generated-pattern','#pattern-save .generated-pattern','.motif-preview']){
      const container=document.querySelector(selector);
      container.querySelectorAll('[data-color-role]').forEach(node=>node.setAttribute(node.dataset.colorAttribute,next.palette[node.dataset.colorRole]));
      const metadata=container.querySelector('metadata');
      if(metadata){const data=JSON.parse(metadata.textContent);metadata.textContent=JSON.stringify({...data,colorMode,palette:next.palette});}
    }
    syncColorControls();
    if(colorPanel)colorPanel.querySelector('.color-announcement').textContent=`${next.palette.name} colors applied. Composition unchanged.`;
  }
  colorPanel?.querySelectorAll('[data-color-mode]').forEach(button=>button.addEventListener('click',()=>recolor(button.dataset.colorMode)));
  colorPanel?.querySelector('#shuffle-colors').addEventListener('click',()=>recolor(colorMode,true));
  function canShowResult() {
    return !!currentDisplayedPattern&&selectionKey===currentIcons().map(icon=>icon.id).join('|');
  }
  async function prepare(scene) {
    if(scene!=='pattern-creating')return;
    const icons=currentIcons();if(!icons.length)throw new Error('Choose at least one icon first.');
    // Only assets are prepared offscreen. A new result is never rendered here.
    await Promise.all(icons.map(loadIcon));
    field.replaceChildren();creating.dataset.phase='ready';
    creating.style.backgroundColor='';creating.querySelector('.generated-pattern').replaceChildren();
  }
  function play(element,keyframes,options) {
    const motion=element.animate(keyframes,{fill:'both',easing:'cubic-bezier(.4,0,.2,1)',...options});motions.add(motion);
    // Auxiliary motions are cancelled when Home/Map or browser history interrupts creation.
    motion.finished.catch(()=>{});
    return motion;
  }
  function stop() {
    run++;for(const motion of motions)motion.cancel();motions.clear();
    pendingGeneratedPattern=null;state=currentDisplayedPattern?'ready':'idle';
    field.replaceChildren();creating.removeAttribute('data-phase');
  }
  const transform=(x,y,size,rotation=0,sx=1,sy=1)=>`translate(${x-50}px,${y-50}px) rotate(${rotation}deg) scale(${size/100*sx},${size/100*sy})`;
  async function animatePhase(symbols,phase,duration,frames) {
    creating.dataset.phase=phase;
    const batch=symbols.map((symbol,i)=>play(symbol.img,frames(symbol,i),{duration}));
    await Promise.all(batch.map(motion=>motion.finished));
    for(const motion of batch){motion.commitStyles();motion.cancel();motions.delete(motion);}
  }
  async function enter(scene) {
    if(scene!=='pattern-creating'||state==='creating')return;
    const ticket=++run,icons=currentIcons(),key=icons.map(icon=>icon.id).join('|');
    state='creating';pendingGeneratedPattern=null;
    const w=creating.clientWidth,h=creating.clientHeight;
    const symbols=Array.from({length:16},(_,i)=>{
      const icon=icons[i%icons.length],size=Math.min(w*.075,h*.12)*(i%icons.length===0?1:.8);
      const x=w*(.12+(i%4)*.25),y=h*(.25+Math.floor(i/4)*.17),angle=i%3===0?45:0;
      const img=new Image();img.src=dataURL(imageSVG(assets[icon.id],icon.naturalPalette.colors[0]));img.alt='';img.className='floating-symbol';field.append(img);
      return {img,id:icon.id,size,x,y,angle};
    });
    const live=()=>ticket===run;
    try {
      // Start exploration on the visible Creating screen before computing its pending result.
      const exploration=animatePhase(symbols,'exploration',reduced.matches?650:3000,(s,i)=>reduced.matches
        ? [{opacity:.5,transform:transform(s.x,s.y,s.size)},{opacity:1,transform:transform(s.x,s.y,s.size)}]
        : [{opacity:0,transform:transform(s.x,s.y+18,s.size*.9,s.angle)},{offset:.25,opacity:1,transform:transform(s.x,s.y,s.size,s.angle)},{opacity:1,transform:transform(s.x+(i%2?18:-18),s.y+(i%3?12:-16),s.size*1.04,s.angle)}]);
      // Observe cancellation immediately while assets/geometry are being prepared.
      exploration.catch(()=>{});
      const generation=(async()=>{
        await new Promise(requestAnimationFrame);if(!live())return;
        const entropy=new Uint32Array(1);crypto.getRandomValues(entropy);
        if(key!==selectionKey){colorMode='harmonious';colorSeed=entropy[0];}
        const result=generatePattern(icons,{seed:entropy[0],colorMode,colorSeed,previousGrammar:key===selectionKey?currentDisplayedPattern?.grammar:null,first:!currentDisplayedPattern||key!==selectionKey});
        if(live())pendingGeneratedPattern=result;
        await prepareScene(document.querySelector('#pattern-preview'));
      })();
      await Promise.all([exploration,generation]);if(!live())return;
      const pending=pendingGeneratedPattern;
      if(!reduced.matches) {
        const arm=Math.min(w,h)*.085;
        for(let i=0;i<symbols.length;i++){
          const s=symbols[i],group=Math.floor(i/4);s.angle=[0,90,180,-90][i%4];
          const cx=w*(group%2?.7:.3),cy=h*(group<2?.4:.73);
          s.groupX=cx+Math.sin(s.angle*Math.PI/180)*arm;s.groupY=cy-Math.cos(s.angle*Math.PI/180)*arm;
        }
        await animatePhase(symbols,'motif',2200,s=>[{transform:s.img.style.transform},{transform:transform(s.groupX,s.groupY,s.size*.75,s.angle)}]);
        if(!live())return;
        const rect=creating.querySelector('.generated-pattern').getBoundingClientRect(),unit=rect.width/(TILE_SIZE*3),targets=[];
        for(let row=0;row<2;row++)for(let col=0;col<3;col++)for(const item of pending.items){
          const x=rect.x+(item.x+col*TILE_SIZE)*unit,y=rect.y+(item.y+row*TILE_SIZE)*unit;
          if(x>rect.left+20&&x<rect.right-20&&y>rect.top+20&&y<rect.bottom-20)targets.push({...item,x,y,size:item.size*unit});
        }
        const used=new Set();
        await animatePhase(symbols,'convergence',2400,(s,i)=>{
          const target=targets.find(t=>t.id===s.id&&!used.has(t))||targets.find(t=>t.id===s.id)||targets[i%targets.length];used.add(target);
          const endAngle=s.angle+((target.angle-s.angle+540)%360)-180;
          return [{transform:s.img.style.transform,opacity:1},{transform:transform(target.x,target.y,target.size,endAngle,target.flipX?-1:1,target.flipY?-1:1),opacity:.8}];
        });
      }
      if(!live())return;
      // The only commit point: publish after all Creating phases have completed.
      currentDisplayedPattern=pending;selectionKey=key;pendingGeneratedPattern=null;state='ready';
      renderResult();creating.dataset.phase='complete';
      await navigate('pattern-preview',{replaceHistory:true,patternContinuation:true});
    } catch(error) {
      if(live()&&error.name!=='AbortError'){
        stop();document.querySelector('#icon-selection-hint').textContent='Please try again — your selection is saved.';
        await navigate('choose-icons',{replaceHistory:true});
      }
    }
  }
  async function save() {
    if(!currentDisplayedPattern||exporting)return;
    const result=currentDisplayedPattern,ticket=run,button=document.querySelector('#save-pattern');
    exporting=true;button.disabled=true;button.setAttribute('aria-busy','true');
    document.querySelector('#export-status').textContent='';
    try {
      const {blob}=await exportArtworkPNG(result,assets);
      if(ticket!==run)return;
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`cultural-atlas-${result.grammar}-${result.seed}.png`;
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      await navigate('pattern-saved');
    } catch(error) {
      document.querySelector('#export-status').textContent='The download could not be prepared. Please try Save again.';
    } finally {exporting=false;button.disabled=false;button.removeAttribute('aria-busy');}
  }
  return {prepare,enter,leave:stop,save,canShowResult,recolor,getResult:()=>currentDisplayedPattern,getState:()=>({state,currentDisplayedPattern,pendingGeneratedPattern})};
}
