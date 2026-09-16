/** One modal book. Its internal page state never recreates the map beneath it. */
const base = './assets/archive/';
const canton = [
  { key: 'FRONT_COVER', file: 'canton-front.svg', label: 'Front cover', box: [446,64,620,850], spine: 446 },
  { key: 'SPREAD_01_02', file: '01-02.svg', label: 'Pages 01–02 — Identity and context', box: [136,60,1290,843], spine: 781 },
  { key: 'SPREAD_03_04', file: '03-04.svg', label: 'Pages 03–04 — Architecture and structure', box: [110,100,1290,800], spine: 755 },
  { key: 'SPREAD_05_06', file: '05-06.svg', label: 'Pages 05–06 — Visual and geometric study', box: [90,42,1315,862], spine: 755 },
  { key: 'SPREAD_07_08', file: '07-08.svg', label: 'Pages 07–08 — Form study', box: [105,105,1300,802], spine: 755 },
  { key: 'BACK_COVER', file: 'canton-back.svg', label: 'Back cover', box: [446,128,620,786], spine: 1066 },
];
const catalog = {
  canton: { title: 'Canton Tower', pages: canton },
  porcelain: { title: 'Guangzhou Painted Porcelain', pages: [{ key: 'FRONT_COVER', file: 'porcelain-front.svg', label: 'Front cover', box: [446,64,620,850], spine: 446 }] },
};
export function createArchive(dialog, { onClose }) {
  const stage = dialog.querySelector('.archive-stage');
  const art = dialog.querySelector('.archive-art');
  const hit = dialog.querySelector('.archive-hit');
  const previous = dialog.querySelector('[data-page="previous"]');
  const next = dialog.querySelector('[data-page="next"]');
  const cover = dialog.querySelector('[data-page="cover"]');
  const status = dialog.querySelector('.archive-status');
  const atlas = document.querySelector('#atlas');
  const decoded = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let book, index = 0, busy = false, generation = 0, source;
  function load(page) {
    if (!decoded.has(page.file)) {
      const image = new Image(); image.src = base + page.file;
      decoded.set(page.file, image.decode().catch(error => { decoded.delete(page.file); throw error; }));
    }
    return decoded.get(page.file);
  }
  function paint(page) {
    art.src = base + page.file; art.alt = `${book.title}. ${page.label}. Original Figma archive artwork.`;
    dialog.dataset.bookState = page.key;
    const [x,y,w,h] = page.box;
    Object.entries({left:x/1512*100+'%',top:y/982*100+'%',width:w/1512*100+'%',height:h/982*100+'%'}).forEach(([k,v])=>hit.style[k]=v);
    const isCover = page.key.endsWith('COVER');
    previous.hidden = next.hidden = isCover;
    cover.hidden = !isCover;
    cover.disabled = book.pages.length === 1;
    cover.setAttribute('aria-label', page.key === 'BACK_COVER' ? 'Return to front cover' : 'Open archive book');
    const split = (page.spine-x)/w*100;
    previous.style.width=split+'%'; next.style.left=split+'%'; next.style.width=(100-split)+'%';
    status.textContent = `${book.title} — ${page.label}`;
  }
  function face(page, side, back = false) {
    const el=document.createElement('div');el.className='archive-sheet-face';
    if(back)el.classList.add('archive-sheet-face--back');
    const [x,y,w,h]=page.box;
    const left=side==='whole'?x:side==='right'?page.spine:x;
    const width=side==='whole'?w:side==='right'?x+w-page.spine:page.spine-x;
    const image=document.createElement('img');image.src=base+page.file;image.alt='';
    Object.assign(image.style,{width:1512/width*100+'%',height:982/h*100+'%',left:-left/width*100+'%',top:-y/h*100+'%'});
    el.append(image);return el;
  }
  function sheet(page, side) {
    const el = document.createElement('div'); el.className = 'archive-sheet';
    const [x,y,w,h]=page.box;
    const left=side==='whole'?x:side==='right'?page.spine:x;
    const width=side==='whole'?w:side==='right'?x+w-page.spine:page.spine-x;
    Object.assign(el.style,{left:left/1512*100+'%',top:y/982*100+'%',width:width/1512*100+'%',height:h/982*100+'%',transformOrigin:side==='left'?'right center':'left center'});
    el.append(face(page,side));stage.append(el);return el;
  }
  async function turn(target) {
    if (busy || target<0 || target>=book.pages.length || target===index) return;
    const ticket=generation; busy=true;dialog.setAttribute('aria-busy','true');
    const old=book.pages[index], page=book.pages[target];
    try {
      await load(page); if(ticket!==generation)return;
      const forward=target>index;
      if(!reduced.matches){
        let leaf, frames;
        if(old.key==='BACK_COVER'){
          leaf=sheet(old,'whole');leaf.append(face(page,'whole',true));paint(page);
          leaf.style.transformOrigin='center';
          frames=[{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)',offset:.5},{transform:'rotateY(180deg)'}];
        } else if(old.key==='FRONT_COVER'){
          leaf=sheet(old,'whole');leaf.append(face(page,'left',true));paint(page);
          // Move the closed book's spine to the spread's crease while opening it.
          const shift=(page.spine-old.spine)/old.box[2]*100;
          frames=[{transform:'translateX(0) rotateY(0deg)'},{transform:`translateX(${shift}%) rotateY(-170deg)`}];
        } else {
          leaf=sheet(old,forward?'right':'left');
          leaf.append(face(page,page.key.endsWith('COVER')?'whole':forward?'left':'right',true));
          // Keep the stationary half until the turning page crosses the spine.
          const stationary=sheet(old,forward?'left':'right');
          stationary.style.zIndex='1';leaf.style.zIndex='2';
          paint(page);
          frames=[{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-178:178}deg)`}];
          setTimeout(()=>stationary.remove(),300);
        }
        const animation=leaf.animate(frames,{duration:650,easing:'cubic-bezier(.3,.05,.25,1)',fill:'forwards'});
        await animation.finished.catch(()=>{});leaf.remove();
        if(ticket!==generation)return;
      }else paint(page);
      index=target;
      (page.key.endsWith('COVER')?cover:forward?next:previous).focus({preventScroll:true});
    }catch{status.textContent='This page could not load. Please try again.';}
    finally{if(ticket===generation){busy=false;dialog.removeAttribute('aria-busy');}}
  }
  function close(notify=true){
    if(!dialog.open)return;
    generation++;busy=false;stage.querySelectorAll('.archive-sheet').forEach(el=>el.remove());
    dialog.close();atlas.inert=false;delete atlas.dataset.archiveOpen;dialog.removeAttribute('aria-busy');
    source?.focus({preventScroll:true});if(notify)onClose?.();
  }
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  hit.addEventListener('click',event=>event.stopPropagation());
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'){event.preventDefault();turn(index===book.pages.length-1?0:index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();turn(index-1);}
  });
  previous.addEventListener('click',()=>turn(index-1));
  next.addEventListener('click',()=>turn(index+1));
  cover.addEventListener('click',()=>turn(index===book.pages.length-1?0:1));
  return { get isOpen(){return dialog.open;},close,
    async open(id,trigger){
      if(!catalog[id])return;
      const selected=catalog[id];await load(selected.pages[0]);
      book=selected;source=trigger??document.activeElement;index=0;generation++;busy=false;
      paint(book.pages[0]);atlas.inert=true;atlas.dataset.archiveOpen='true';dialog.showModal();
      (book.pages.length>1?cover:dialog).focus({preventScroll:true});
      // Preload exact pages without delaying the front cover.
      for(const page of book.pages.slice(1))load(page).catch(()=>{});
    },
  };
}
