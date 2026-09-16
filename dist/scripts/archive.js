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
  canton:{title:'Canton Tower',pages:canton},
  porcelain:{title:'Guangzhou Painted Porcelain',pages:[{key:'FRONT_COVER',file:'porcelain-front.svg',label:'Front cover'}]},
};
const isCover = page => page.key.endsWith('COVER');
export function createArchive(dialog,{onClose,onRestore}) {
  const backdrop=dialog.querySelector('.archive-backdrop');
  const stage=dialog.querySelector('.archive-stage'),art=dialog.querySelector('.archive-art');
  const hit=dialog.querySelector('.archive-hit'),cursor=dialog.querySelector('.archive-cursor');
  const previous=dialog.querySelector('[data-page="previous"]'),next=dialog.querySelector('[data-page="next"]'),cover=dialog.querySelector('[data-page="cover"]');
  const status=dialog.querySelector('.archive-status'),atlas=document.querySelector('#atlas');
  const decoded=new Map(),animations=new Set();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let book,index=0,busy=false,generation=0,cursorFrame,pointer,closing;
  function load(file){
    if(!decoded.has(file)){
      const image=new Image();image.src=base+file;
      decoded.set(file,image.decode().catch(error=>{decoded.delete(file);throw error;}));
    }
    return decoded.get(file);
  }
  function paint(page){
    art.src=base+page.file;art.alt=`${book.title}. ${page.label}. Original Figma archive artwork.`;
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
    const el=document.createElement('div');el.className='archive-sheet-face'+(back?' archive-sheet-face--back':'');
    const start=isCover(page)?FRAME.coverLeft:side==='right'?FRAME.spine:FRAME.left;
    el.append(image(page.file,start));return el;
  }
  function sheet(page,side,position){
    const el=document.createElement('div');el.className='archive-sheet';
    el.style.left=(position??(side==='right'?FRAME.spine:side==='left'?FRAME.left:FRAME.coverLeft))/FRAME.width*100+'%';
    el.style.transformOrigin=side==='left'?'right center':'left center';
    el.append(face(page,side));stage.append(el);return el;
  }
  async function animate(el,frames,duration,phase,ticket){
    if(ticket!==generation)throw new DOMException('Closed','AbortError');
    dialog.dataset.motionPhase=phase;
    const motion=el.animate(frames,{duration,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
    animations.add(motion);
    try{await motion.finished;motion.commitStyles();motion.cancel();}finally{animations.delete(motion);}
    if(ticket!==generation)throw new DOMException('Closed','AbortError');
  }
  async function turn(target){
    if(busy||target<0||target>=book.pages.length||target===index)return;
    const ticket=generation,old=book.pages[index],page=book.pages[target],forward=target>index;
    busy=true;dialog.setAttribute('aria-busy','true');
    try{
      await load(page.file);if(ticket!==generation)return;
      if(reduced.matches)paint(page);
      else if(old.key==='BACK_COVER'){
        // Both cover faces use the same crop and dimensions for the full 180° flip.
        const leaf=sheet(old,'cover');leaf.style.transformOrigin='center';leaf.append(face(page,'cover',true));
        art.style.visibility='hidden';
        await animate(leaf,[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],850,'cover-flip',ticket);
        paint(page);
      }else if(old.key==='FRONT_COVER'){
        const leaf=sheet(old,'cover');art.style.visibility='hidden';
        const shift=(FRAME.spine-FRAME.coverLeft)/FRAME.pageWidth*100;
        await animate(leaf,[{transform:'translateX(0)'},{transform:`translateX(${shift}%)`}],420,'slide-right',ticket);
        // Finish the slide first; the pivot is now exactly on the common spine.
        leaf.append(face(page,'left',true));paint(page);
        const right=sheet(page,'right');right.style.zIndex='0';leaf.style.zIndex='2';
        await Promise.all([animate(leaf,[{transform:`translateX(${shift}%) rotateY(0deg)`},{transform:`translateX(${shift}%) rotateY(-180deg)`}],850,'open-cover',ticket), animate(right,[{opacity:0},{opacity:1}],500,'open-cover',ticket)]);
      }else if(isCover(page)){
        // Closing leaves turn fully before the separate return-to-center motion.
        const side=forward?'right':'left',landing=forward?FRAME.left:FRAME.spine;
        const stationary=sheet(old,forward?'left':'right');stationary.style.zIndex='1';
        const leaf=sheet(old,side);leaf.append(face(page,'cover',true));leaf.style.zIndex='2';
        art.style.visibility='hidden';
        await Promise.all([animate(leaf,[{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-180:180}deg)`}],850,'closing-turn',ticket), animate(stationary,[{opacity:1,offset:0},{opacity:1,offset:.6},{opacity:0,offset:1}],850,'closing-turn',ticket)]);
        leaf.remove();stationary.remove();
        const closed=sheet(page,'cover',landing);
        const shift=(FRAME.coverLeft-landing)/FRAME.pageWidth*100;
        await animate(closed,[{transform:'translateX(0)'},{transform:`translateX(${shift}%)`}],420,'slide-center',ticket);
        paint(page);
      }else{
        const side=forward?'right':'left';
        const stationary=sheet(old,forward?'left':'right');stationary.style.zIndex='1';
        const leaf=sheet(old,side);leaf.style.zIndex='2';leaf.append(face(page,forward?'left':'right',true));
        paint(page);
        const phase=forward?'turn-forward':'turn-backward';
        await Promise.all([
          animate(leaf,[{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-180:180}deg)`}],850,phase,ticket),
          animate(art,[{opacity:0},{opacity:1}],500,phase,ticket),
          animate(stationary,[{opacity:1,offset:0},{opacity:1,offset:.6},{opacity:0,offset:1}],850,phase,ticket),
        ]);
      }
      if(ticket!==generation)return;
      index=target;art.style.visibility='';stage.querySelectorAll('.archive-sheet').forEach(el=>el.remove());
      (isCover(page)?cover:forward?next:previous).focus({preventScroll:true});
    }catch(error){if(ticket===generation&&error.name!=='AbortError')status.textContent='This page could not load. Please try again.';}
    finally{if(ticket===generation){busy=false;delete dialog.dataset.motionPhase;dialog.removeAttribute('aria-busy');}}
  }
  function hideCursor(){cursor.hidden=true;cancelAnimationFrame(cursorFrame);cursorFrame=null;}
  async function present(opening) {
    const frames=opening
      ? [{opacity:0,transform:'translate(-50%, calc(-50% + 12px)) scale(.98)'},{opacity:1,transform:'translate(-50%, -50%) scale(1)'}]
      : [{opacity:getComputedStyle(stage).opacity,transform:getComputedStyle(stage).transform},{opacity:0,transform:'translate(-50%, calc(-50% + 8px)) scale(.985)'}];
    if(reduced.matches){stage.style.opacity=opening?'1':'0';backdrop.style.opacity=opening?'1':'0';return;}
    const motions=[stage.animate(frames,{duration:400,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'}),backdrop.animate([{opacity:opening?0:getComputedStyle(backdrop).opacity},{opacity:opening?1:0}],{duration:400,easing:'ease-in-out',fill:'forwards'})];
    motions.forEach(m=>animations.add(m));
    await Promise.all(motions.map(async m=>{try{await m.finished;m.commitStyles();m.cancel();}catch(error){if(error.name!=='AbortError')throw error;}finally{animations.delete(m);}}));
  }
  function close(notify=true){
    if(closing)return closing;
    if(!dialog.open)return Promise.resolve();
    generation++;busy=true;hideCursor();dialog.dataset.presentation='closing';
    for(const motion of animations){try{motion.commitStyles();}catch{}motion.cancel();}animations.clear();
    closing=(async()=>{
      await present(false);
      dialog.close();stage.querySelectorAll('.archive-sheet').forEach(el=>el.remove());art.style.visibility='';art.style.opacity='';
      atlas.inert=false;delete atlas.dataset.archiveOpen;delete dialog.dataset.motionPhase;dialog.removeAttribute('aria-busy');
      onRestore?.();document.querySelector('.map-viewport').focus({preventScroll:true});
      busy=false;closing=null;if(notify)onClose?.();
    })();
    return closing;
  }
  dialog.addEventListener('pointermove',event=>{
    if(closing){hideCursor();return;}
    const button=event.target.closest('[data-page]');
    const kind=button?.disabled?null:button?.dataset.page==='previous'?'previous':button?'next':event.target.closest('.archive-hit')?null:'exit';
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
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  hit.addEventListener('click',event=>event.stopPropagation());
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    hideCursor();
    if(event.key==='ArrowRight'){event.preventDefault();turn(index===book.pages.length-1?0:index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();turn(index-1);}
  });
  previous.addEventListener('click',()=>turn(index-1));next.addEventListener('click',()=>turn(index+1));
  cover.addEventListener('click',()=>turn(index===book.pages.length-1?0:1));
  return {get isOpen(){return dialog.open;},close,
    async open(id){
      if(!catalog[id])return;
      const selected=catalog[id];await Promise.all([selected.pages[0].file,'cursor-exit.svg','cursor-previous.svg','cursor-next.svg'].map(load));
      book=selected;index=0;const ticket=++generation;busy=true;stage.removeAttribute('style');art.style.opacity='';paint(book.pages[0]);hideCursor();dialog.dataset.presentation='opening';
      atlas.inert=true;atlas.dataset.archiveOpen='true';dialog.showModal();
      (book.pages.length>1?cover:dialog).focus({preventScroll:true});
      for(const page of book.pages.slice(1))load(page.file).catch(()=>{});
      await present(true);if(ticket!==generation)return false;
      busy=false;dialog.dataset.presentation='open';return true;
    },
  };
}
