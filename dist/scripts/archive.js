import { iconDisplayName } from './icon-names.js';
import { newArchiveCatalog } from './archive-entries.js';
/** A transparent fixed stage with Figma-normalized covers and two-sided pages. */
const base = './assets/archive/';
const FRAME = { width:1512, height:982, left:111, spine:756, pageWidth:645, coverLeft:433.5 };
const canton = [
  { key:'FRONT_COVER', file:'canton-front.svg', label:'Front cover' },
  { key:'SPREAD_01_02', file:'pages-01-02.svg', label:'Pages 01–02 — Identity and context' },
  { key:'SPREAD_03_04', file:'pages-03-04.svg', label:'Pages 03–04 — Architecture and structure' },
  { key:'SPREAD_05_06', file:'pages-05-06.svg', label:'Pages 05–06 — Visual and geometric study' },
  { key:'SPREAD_07_08', file:'pages-07-08.svg', label:'Pages 07–08 — Form study' },
  { key:'BACK_COVER', file:'canton-back.svg', label:'Back cover' },
];
const catalog = {
  ...newArchiveCatalog,
  canton:{title:iconDisplayName('guangzhou','Canton Tower'),pages:canton},
  porcelain:{title:iconDisplayName('guangzhou','Guangcai Porcelain'),pages:[
    {key:'FRONT_COVER',file:'porcelain-front.svg',label:'Front cover'},
    {key:'SPREAD_01_02',file:'porcelain-01-02.svg',label:'Pages 01–02 — Identity and context'},
    {key:'SPREAD_03_04',file:'porcelain-03-04.svg',label:'Pages 03–04 — Materials and making'},
    {key:'SPREAD_05_06',file:'porcelain-05-06.svg',label:'Pages 05–06 — Ornament, colour and geometry'},
    {key:'SPREAD_07_08',file:'porcelain-07-08.svg',label:'Pages 07–08 — Symbol extraction'},
    {key:'BACK_COVER',file:'porcelain-back.svg',label:'Back cover'},
  ]},
  'shrimp':{title:iconDisplayName('guangzhou','Shrimp Dumpling'),pages:[
    {key:'FRONT_COVER',file:'shrimp-front.svg',label:'Front cover'},
    {key:'SPREAD_01_02',file:'shrimp-01-02.svg',label:'Pages 01–02 — Identity and tea culture'},
    {key:'SPREAD_03_04',file:'shrimp-03-04.svg',label:'Pages 03–04 — Ingredients and making'},
    {key:'SPREAD_05_06',file:'shrimp-05-06.svg',label:'Pages 05–06 — Visual features and geometry'},
    {key:'SPREAD_07_08',file:'shrimp-07-08.svg?v=2',label:'Pages 07–08 — From observation to icon'},
    {key:'BACK_COVER',file:'shrimp-back.svg',label:'Back cover'},
  ]},
  'five-rams':{title:iconDisplayName('guangzhou','Five Rams Sculpture'),pages:[
    {key:'FRONT_COVER',file:'five-rams-front.svg',label:'Front cover'},
    {key:'SPREAD_01_02',file:'five-rams-01-02.svg',label:'Pages 01–02 — Identity and legend'},
    {key:'SPREAD_03_04',file:'five-rams-03-04.svg',label:'Pages 03–04 — Form and structure'},
    {key:'SPREAD_05_06',file:'five-rams-05-06.svg',label:'Pages 05–06 — Stone, colour and geometry'},
    {key:'SPREAD_07_08',file:'five-rams-07-08.svg',label:'Pages 07–08 — From sculpture to icon'},
    {key:'BACK_COVER',file:'five-rams-back.svg',label:'Back cover'},
  ]},
};
export const archiveIds = Object.freeze(Object.keys(catalog));
const isCover = page => page.key.endsWith('COVER');
export function createArchive(dialog,{onClose,onRestore}) {
  const backdrop=dialog.querySelector('.archive-backdrop');
  const stage=dialog.querySelector('.archive-stage');
  let art=dialog.querySelector('.archive-art');
  const hit=dialog.querySelector('.archive-hit'),cursor=dialog.querySelector('.archive-cursor');
  const previous=dialog.querySelector('[data-page="previous"]'),next=dialog.querySelector('[data-page="next"]'),cover=dialog.querySelector('[data-page="cover"]');
  const status=dialog.querySelector('.archive-status'),atlas=document.querySelector('#atlas');
  // Retain decoded image elements, not just promises, throughout the map session.
  const decoded=new Map(),preloads=new Map(),animations=new Set();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let book,index=0,busy=false,generation=0,cursorFrame,pointer,closing,opening;
  let session=new AbortController();
  const abortError=()=>new DOMException('Archive session ended','AbortError');
  function bounded(promise,ms,signal){
    return new Promise((resolve,reject)=>{
      let timer;
      const finish=(fn,value)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value);};
      const abort=()=>finish(reject,abortError());
      if(signal?.aborted){reject(abortError());return;}
      signal?.addEventListener('abort',abort,{once:true});
      timer=setTimeout(()=>finish(reject,new Error('Archive operation timed out')),ms);
      Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));
    });
  }
  function load(file){
    if(!decoded.has(file)){
      const image=new Image();image.src=base+file;image.draggable=false;
      const entry={image};
      entry.ready=bounded(image.decode(),35000).then(()=>image).catch(error=>{
        if(decoded.get(file)===entry)decoded.delete(file);
        throw error;
      });
      decoded.set(file,entry);
    }
    return decoded.get(file).ready;
  }
  function preload(id){
    if(!catalog[id])return Promise.resolve();
    if(!preloads.has(id)){
      // Limit concurrent SVG decodes: Guangcai includes large original photos.
      const files=catalog[id].pages.map(page=>page.file);
      let at=0;
      const worker=async()=>{while(at<files.length)await load(files[at++]);};
      const ready=Promise.all([worker(),worker()]).catch(error=>{preloads.delete(id);throw error;});
      preloads.set(id,ready);
    }
    return preloads.get(id);
  }
  function setBusy(value){
    busy=value;
    if(value)dialog.setAttribute('aria-busy','true');else dialog.removeAttribute('aria-busy');
    for(const button of [previous,next,cover])button.setAttribute('aria-disabled',String(value));
  }
  function cleanupTurn(){
    for(const motion of animations)motion.cancel();
    animations.clear();
    stage.querySelectorAll('.archive-sheet').forEach(el=>el.remove());
    art.style.visibility='';art.style.opacity='';
    delete dialog.dataset.motionPhase;
  }
  async function prepareSheets(ticket){
    await bounded(Promise.all([...stage.querySelectorAll('.archive-sheet img')].map(img=>img.decode())),35000,session.signal);
    if(ticket!==generation)throw abortError();
    stage.querySelectorAll('.archive-sheet').forEach(el=>el.style.visibility='');
  }
  function paint(page){
    const prepared=decoded.get(page.file).image;
    if(art!==prepared){prepared.className='archive-art';prepared.removeAttribute('style');art.replaceWith(prepared);art=prepared;}
    art.alt=`${book.title}. ${page.label}. Original Figma archive artwork.`;
    dialog.dataset.bookState=page.key;
    previous.hidden=next.hidden=isCover(page);cover.hidden=!isCover(page);
    cover.disabled=book.pages.length===1;
    cover.setAttribute('aria-label',page.key==='BACK_COVER'?'Return to front cover':'Open archive book');
    status.textContent=`${book.title} — ${page.label}`;
  }
  function image(file,start){
    const img=new Image();img.src=base+file;img.alt='';
    Object.assign(img.style,{width:FRAME.width/FRAME.pageWidth*100+'%',height:'100%',left:-start/FRAME.pageWidth*100+'%',top:'0'});
    return img;
  }
  function face(page,side,back=false){
    const el=document.createElement('div');el.className='archive-sheet-face'+(back?' archive-sheet-face--back':'')+(isCover(page)?' archive-sheet-face--cover':'');
    const start=isCover(page)?FRAME.coverLeft:side==='right'?FRAME.spine:FRAME.left;
    el.append(image(page.file,start));return el;
  }
  function sheet(page,side,position){
    const el=document.createElement('div');el.className='archive-sheet';
    el.style.left=(position??(side==='right'?FRAME.spine:side==='left'?FRAME.left:FRAME.coverLeft))/FRAME.width*100+'%';
    el.style.visibility='hidden';
    el.style.transformOrigin=side==='left'?'right center':'left center';
    el.append(face(page,side));stage.append(el);return el;
  }
  async function animate(el,frames,duration,phase,ticket){
    if(ticket!==generation)throw new DOMException('Closed','AbortError');
    dialog.dataset.motionPhase=phase;
    const motion=el.animate(frames,{duration,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
    animations.add(motion);
    try{
      await bounded(motion.finished,duration+2000,session.signal);
      if(ticket!==generation)throw abortError();
      // commitStyles can throw on detached/non-rendered SVG-backed leaves.
      // Apply the known final keyframe explicitly, then always release the effect.
      const {offset,easing,composite,...final}=frames.at(-1);
      Object.assign(el.style,final);
    }finally{motion.cancel();animations.delete(motion);}
  }

  async function turn(target){
    if(!dialog.open||!book||busy||target<0||target>=book.pages.length||target===index)return;
    const ticket=generation,old=book.pages[index],page=book.pages[target],forward=target>index;
    setBusy(true);
    try{
      await bounded(preload(book.id),35000,session.signal);if(ticket!==generation)return;
      if(reduced.matches)paint(page);
      else if(old.key==='BACK_COVER'){
        // Both cover faces use the same crop and dimensions for the full 180° flip.
        const leaf=sheet(old,'cover');leaf.style.transformOrigin='center';leaf.append(face(page,'cover',true));
        await prepareSheets(ticket);art.style.visibility='hidden';
        await animate(leaf,[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],850,'cover-flip',ticket);
        paint(page);
      }else if(old.key==='FRONT_COVER'){
        const leaf=sheet(old,'cover');
        leaf.append(face(page,'left',true));
        const right=sheet(page,'right');right.style.zIndex='0';leaf.style.zIndex='2';
        await prepareSheets(ticket);right.style.visibility='hidden';art.style.visibility='hidden';
        const shift=(FRAME.spine-FRAME.coverLeft)/FRAME.pageWidth*100;
        await animate(leaf,[{transform:'translateX(0)'},{transform:`translateX(${shift}%)`}],420,'slide-right',ticket);
        // Finish the slide first; the pivot is now exactly on the common spine.
        right.style.visibility='';
        await Promise.all([animate(leaf,[{transform:`translateX(${shift}%) rotateY(0deg)`},{transform:`translateX(${shift}%) rotateY(-180deg)`}],850,'open-cover',ticket), animate(right,[{opacity:0},{opacity:1}],500,'open-cover',ticket)]);
      }else if(isCover(page)){
        // Closing leaves turn fully before the separate return-to-center motion.
        const side=forward?'right':'left',landing=forward?FRAME.left:FRAME.spine;
        const stationary=sheet(old,forward?'left':'right');stationary.style.zIndex='1';
        const leaf=sheet(old,side);leaf.append(face(page,'cover',true));leaf.style.zIndex='2';
        const closed=sheet(page,'cover',landing);
        await prepareSheets(ticket);closed.style.visibility='hidden';art.style.visibility='hidden';
        await Promise.all([animate(leaf,[{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-180:180}deg)`}],850,'closing-turn',ticket), animate(stationary,[{opacity:1,offset:0},{opacity:1,offset:.6},{opacity:0,offset:1}],850,'closing-turn',ticket)]);
        leaf.remove();stationary.remove();
        closed.style.visibility='';
        const shift=(FRAME.coverLeft-landing)/FRAME.pageWidth*100;
        await animate(closed,[{transform:'translateX(0)'},{transform:`translateX(${shift}%)`}],420,'slide-center',ticket);
        paint(page);
      }else{
        const side=forward?'right':'left';
        const stationary=sheet(old,forward?'left':'right');stationary.style.zIndex='1';
        const leaf=sheet(old,side);leaf.style.zIndex='2';leaf.append(face(page,forward?'left':'right',true));
        await prepareSheets(ticket);
        paint(page);
        const phase=forward?'turn-forward':'turn-backward';
        await Promise.all([
          animate(leaf,[{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-180:180}deg)`}],850,phase,ticket),
          animate(art,[{opacity:0},{opacity:1}],500,phase,ticket),
          animate(stationary,[{opacity:1,offset:0},{opacity:1,offset:.6},{opacity:0,offset:1}],850,phase,ticket),
        ]);
      }
      if(ticket!==generation)return;
      index=target;paint(page);cleanupTurn();
      (isCover(page)?cover:forward?next:previous).focus({preventScroll:true});
    }catch(error){
      if(ticket===generation){paint(old);status.textContent='This page could not load. Please try again.';}
    }finally{if(ticket===generation){cleanupTurn();setBusy(false);}}
  }
  function hideCursor(){cursor.hidden=true;cancelAnimationFrame(cursorFrame);cursorFrame=null;}
  async function present(opening) {
    const frames=opening
      ? [{opacity:0,transform:'translate(-50%, calc(-50% + 12px)) scale(.98)'},{opacity:1,transform:'translate(-50%, -50%) scale(1)'}]
      : [{opacity:getComputedStyle(stage).opacity,transform:getComputedStyle(stage).transform},{opacity:0,transform:'translate(-50%, calc(-50% + 8px)) scale(.985)'}];
    if(reduced.matches){stage.style.opacity=opening?'1':'0';backdrop.style.opacity=opening?'1':'0';return;}
    const ticket=generation;
    await Promise.all([
      animate(stage,frames,400,opening?'opening':'closing',ticket),
      animate(backdrop,[{opacity:opening?0:getComputedStyle(backdrop).opacity},{opacity:opening?1:0}],400,opening?'opening':'closing',ticket),
    ]);
  }
  function close(notify=true){
    if(closing)return closing;
    generation++;session.abort();session=new AbortController();
    cleanupTurn();hideCursor();
    if(!dialog.open){setBusy(false);return opening?.then(()=>{},()=>{})??Promise.resolve();}
    setBusy(true);dialog.dataset.presentation='closing';
    closing=(async()=>{
      try{await present(false);}catch{/* Exit must work even if animation is interrupted. */}
      finally{
        cleanupTurn();dialog.close();atlas.inert=false;delete atlas.dataset.archiveOpen;
        dialog.dataset.presentation='closed';setBusy(false);closing=null;
        onRestore?.();document.querySelector('.map-viewport')?.focus({preventScroll:true});
        if(notify)onClose?.();
      }
    })();
    return closing;
  }
  dialog.addEventListener('pointermove',event=>{
    if(closing){hideCursor();return;}
    const button=event.target.closest('[data-page]');
    const kind=(button?.disabled||busy&&button)?null:button?.dataset.page==='previous'?'previous':button?'next':event.target.closest('.archive-hit')?null:'exit';
    if(!kind){hideCursor();return;}
    if(cursor.dataset.kind!==kind){cursor.dataset.kind=kind;cursor.src=base+`cursor-${kind}.svg`;}
    pointer={x:event.clientX,y:event.clientY};cursor.hidden=false;
    if(!cursorFrame)cursorFrame=requestAnimationFrame(()=>{
      cursorFrame=null;const size=64;
      const x=Math.max(size/2,Math.min(innerWidth-size/2,pointer.x));
      const y=Math.max(size/2,Math.min(innerHeight-size/2,pointer.y));
      cursor.style.transform=`translate3d(${x-size/2}px,${y-size/2}px,0) scaleX(${cursor.dataset.kind==='previous'?-1:1})`;
    });
  });
  dialog.addEventListener('pointerleave',hideCursor);
  let outsidePress=false;
  dialog.addEventListener('pointerdown',event=>{outsidePress=event.target===dialog;});
  dialog.addEventListener('click',event=>{
    if(event.target===dialog&&outsidePress)close();
    outsidePress=false;
  });
  hit.addEventListener('click',event=>event.stopPropagation());
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    hideCursor();
    if(event.key==='ArrowRight'){event.preventDefault();turn(index===book.pages.length-1?0:index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();turn(index-1);}
  });
  previous.addEventListener('click',()=>turn(index-1));next.addEventListener('click',()=>turn(index+1));
  cover.addEventListener('click',()=>turn(index===book.pages.length-1?0:1));
  return {get isOpen(){return dialog.open||!!opening;},close,preload,
    open(id){
      if(!catalog[id])return Promise.resolve(false);
      if(opening)return opening;
      const run=async()=>{
        if(closing)await closing;
        const ticket=++generation;session.abort();session=new AbortController();
        const selected=catalog[id];
        try{
          // Start the entire book immediately; keep the map until its cover is ready.
          preload(id).catch(()=>{});
          await bounded(load(selected.pages[0].file),35000,session.signal);
          if(ticket!==generation)return false;
          book={...selected,id};index=0;cleanupTurn();setBusy(true);
          stage.removeAttribute('style');backdrop.removeAttribute('style');
          paint(book.pages[0]);hideCursor();dialog.dataset.presentation='opening';
          atlas.inert=true;atlas.dataset.archiveOpen='true';dialog.showModal();
          cover.focus({preventScroll:true});
          for(const file of ['cursor-exit.svg','cursor-previous.svg','cursor-next.svg'])load(file).catch(()=>{});
          try{await present(true);}catch(error){if(ticket!==generation)return false;}
          if(ticket!==generation)return false;
          stage.style.opacity='1';stage.style.transform='translate(-50%, -50%) scale(1)';backdrop.style.opacity='1';
          delete dialog.dataset.motionPhase;setBusy(false);dialog.dataset.presentation='open';
          return true;
        }catch(error){
          if(ticket===generation){cleanupTurn();setBusy(false);if(dialog.open)await close(false);}
          if(error.name==='AbortError')return false;
          throw error;
        }
      };
      opening=run().finally(()=>{opening=null;});return opening;
    },
  };
}
