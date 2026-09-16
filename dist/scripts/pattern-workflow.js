import { culturalIcons, libraryState } from './library-state.js';
import { generatePattern, renderPatternSVG, TILE_SIZE } from './pattern-generator.js';
import { prepareScene } from './scenes.js';

const imageSVG=(body,color)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" color="${color}">${body}</svg>`;
const dataURL=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
export function createPatternWorkflow({navigate}) {
  const creating=document.querySelector('#pattern-creating'),field=creating.querySelector('.floating-field');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),assets={},pending=new Map(),motions=new Set();
  let result=null,selectionKey='',run=0,serial=0;
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
    for(const scene of ['pattern-creating','pattern-preview','pattern-save','pattern-saved']) {
      const container=document.querySelector(`#${scene} .generated-pattern`);
      container.innerHTML=renderPatternSVG(result,assets,{width:1014,height:581,prefix:scene,repeats:3});
      container.dataset.grammar=result.grammar;container.dataset.seed=result.seed;
      container.setAttribute('aria-label',`${result.grammar.replaceAll('-',' ')} pattern using ${currentIcons().map(icon=>icon.label).join(', ')}`);
    }
    const previews=document.querySelector('.selected-source-icons');previews.replaceChildren();
    currentIcons().forEach(icon=>{
      const img=new Image();img.src=dataURL(imageSVG(assets[icon.id].replaceAll('="white"','="#206EB8"'),'#FFFFFF'));img.alt=icon.label;previews.append(img);
    });
    const tile=document.querySelector('.motif-preview');tile.style.setProperty('--selected-count',currentIcons().length);
    tile.innerHTML=renderPatternSVG(result,assets,{width:92,height:92,prefix:'motif-preview'});
    document.querySelector('#pattern-preview .pattern-announcement').textContent=`Your ${result.grammar.replaceAll('-',' ')} pattern is ready.`;
  }
  async function prepare(scene,{regenerate=false}={}) {
    if(!scene.startsWith('pattern-'))return;
    const icons=currentIcons(),key=icons.map(icon=>icon.id).join('|');
    if(!icons.length)throw new Error('Choose at least one icon first.');
    if(!result||key!==selectionKey||regenerate) {
      await Promise.all(icons.map(loadIcon));
      const previous=result,keyChanged=key!==selectionKey;
      const entropy=new Uint32Array(1);crypto.getRandomValues(entropy);
      result=generatePattern(icons,{seed:entropy[0],previousGrammar:!keyChanged?previous?.grammar:null,first:!previous||keyChanged});
      selectionKey=key;renderResult();
    }
    if(scene==='pattern-creating') {
      await prepareScene(document.querySelector('#pattern-preview'));
      field.replaceChildren();creating.dataset.phase='exploration';
      creating.style.backgroundColor='';creating.querySelector('.generated-pattern').style.opacity='0';
    }
  }
  function play(element,keyframes,options) {
    const motion=element.animate(keyframes,{fill:'both',easing:'cubic-bezier(.4,0,.2,1)',...options});motions.add(motion);
    // Auxiliary motions are cancelled when Home/Map or browser history interrupts creation.
    motion.finished.catch(()=>{});
    return motion;
  }
  function stop() {
    run++;for(const motion of motions)motion.cancel();motions.clear();
    field.replaceChildren();creating.removeAttribute('data-phase');
  }
  async function enter(scene) {
    if(scene!=='pattern-creating')return;
    const ticket=++run,canvas=creating.querySelector('.generated-pattern');
    if(reduced.matches){canvas.style.opacity='1';creating.dataset.phase='complete';await navigate('pattern-preview',{replaceHistory:true,patternContinuation:true});return;}
    const duration=8200,w=creating.clientWidth,h=creating.clientHeight,rect=canvas.getBoundingClientRect();
    // Final positions come from the actual generated tile, including its selected grammar.
    const unit=rect.width/(TILE_SIZE*3),targets=[];
    for(let row=0;row<2;row++)for(let col=0;col<3;col++)for(const item of result.items) {
      const x=rect.x+(item.x+col*TILE_SIZE)*unit,y=rect.y+(item.y+row*TILE_SIZE)*unit;
      if(x>rect.left+30&&x<rect.right-30&&y>rect.top+30&&y<rect.bottom-30)targets.push({...item,x,y,size:item.size*unit});
    }
    // A balanced selection across the canvas; every chosen cultural icon remains represented.
    const chosen=[];
    for(const id of result.selectedIcons){const match=targets.find(item=>item.id===id);if(match)chosen.push(match);}
    for(let i=0;chosen.length<16&&i<targets.length;i++){
      const item=targets[Math.floor(i*targets.length/16)%targets.length];if(!chosen.includes(item))chosen.push(item);
    }
    chosen.forEach((target,i)=>{
      const img=new Image();img.src=dataURL(imageSVG(assets[target.id],result.palette[target.role]));img.alt='';img.className='floating-symbol';field.append(img);
      const initialSize=Math.min(w*.075,h*.12)*(target.role==='primary'?1:target.role==='secondary'?.85:.75);
      const x=w*(.12+(i%4)*.25),y=h*(.25+Math.floor(i/4)*.17);
      const group=Math.floor(i/4),arm=Math.min(w,h)*.085,angle=[0,90,180,-90][i%4];
      const groupX=w*(group%2?.7:.3),groupY=h*(group<2?.4:.73);
      const pairX=groupX+Math.sin(angle*Math.PI/180)*arm,pairY=groupY-Math.cos(angle*Math.PI/180)*arm;
      const transform=(px,py,size,rotation,sx=1,sy=1)=>`translate(${px-50}px,${py-50}px) rotate(${rotation}deg) scale(${size/100*sx},${size/100*sy})`;
      const delay=(i%4)*90;
      const startAngle=i%3===0?45:0;
      const endAngle=angle+((target.angle-angle+540)%360)-180;
      play(img,[
        {offset:0,opacity:0,transform:transform(x,y+18,initialSize*.9,startAngle)},
        {offset:.1,opacity:.95,transform:transform(x,y,initialSize,startAngle)},
        {offset:.32,opacity:.95,transform:transform(x+(i%2?18:-18),y+(i%3?12:-16),initialSize*1.04,startAngle)},
        {offset:.55,opacity:.95,transform:transform(pairX,pairY,initialSize*.75,angle)},
        {offset:.64,opacity:.95,transform:transform(pairX+(pairX-groupX)*.18,pairY+(pairY-groupY)*.18,initialSize*.8,angle)},
        {offset:.9,opacity:.95,transform:transform(target.x,target.y,target.size,endAngle,target.flipX?-1:1,target.flipY?-1:1)},
        {offset:1,opacity:0,transform:transform(target.x,target.y,target.size,endAngle,target.flipX?-1:1,target.flipY?-1:1)},
      ],{duration:duration-delay,delay});
    });
    play(canvas,[{offset:0,opacity:0},{offset:.68,opacity:0},{offset:1,opacity:1}],{duration});
    play(creating.querySelector('.library-art'),[{offset:0,opacity:1},{offset:.75,opacity:1},{offset:1,opacity:0}],{duration});
    const completion=play(creating,[{offset:0,backgroundColor:'#84C9E1'},{offset:.68,backgroundColor:'#84C9E1'},{offset:1,backgroundColor:'#FFEFF9'}],{duration});
    // Phase announcements are silent visually; the page stays a visual workspace.
    const phase=play(field,[{opacity:1},{opacity:1}],{duration:duration*.35});
    phase.finished.then(()=>{if(ticket===run)creating.dataset.phase='motif';}).catch(()=>{});
    const convergence=play(field,[{opacity:1},{opacity:1}],{duration:duration*.65});
    convergence.finished.then(()=>{if(ticket===run)creating.dataset.phase='convergence';}).catch(()=>{});
    try {
      await completion.finished;
      if(ticket!==run)return;
      creating.dataset.phase='complete';
      await navigate('pattern-preview',{replaceHistory:true,patternContinuation:true});
    } catch(error) {if(error.name!=='AbortError')document.querySelector('#status').textContent='Please try creating your pattern again.';}
  }
  function save() {
    if(!result)return;
    const svg=renderPatternSVG(result,assets,{prefix:`cultural-atlas-export-${++serial}`});
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`cultural-atlas-${result.grammar}-${result.seed}.svg`;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    navigate('pattern-saved');
  }
  return {prepare,enter,leave:stop,save,getResult:()=>result};
}
