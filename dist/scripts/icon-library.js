import { cities, culturalIcons, libraryState, MAX_SELECTED_ICONS } from './library-state.js?v=20260922-library-final';

export function createIconLibrary({navigate,onSave}) {
  const library=document.querySelector('#icon-library'),chooser=document.querySelector('#choose-icons');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paintedCity=libraryState.getState().selectedCity,change=0,animation;
  function button(label,styles) {
    const el=document.createElement('button');el.type='button';el.className='art-button';
    el.setAttribute('aria-label',label);el.style.cssText=styles;return el;
  }
  for(const city of cities) {
    const el=button(city.label,`--x:${city.x};--y:239;--w:${city.w};--h:52`);
    el.dataset.city=city.id;el.classList.add('city-button');el.setAttribute('aria-controls','city-collection');
    el.addEventListener('click',()=>libraryState.setCity(city.id));library.querySelector('.city-controls').append(el);
  }
  const cellPosition=(index,isChooser)=>({x:(isChooser?144:150)+112.8*(index%11),y:(isChooser?259:368)+121.5*Math.floor(index/11)});
  for(const [index,icon] of culturalIcons.entries()) {
    const {x,y}=cellPosition(index,true);
    const el=button(icon.label,`--x:${x};--y:${y};--w:92;--h:92`);
    el.dataset.icon=icon.id;el.classList.add('icon-button');
    el.addEventListener('click',()=>{
      if(libraryState.toggleIcon(icon.id)===false)chooser.querySelector('#icon-selection-hint').textContent='Choose up to 3 icons. Deselect one to try another.';
    });
    const feedback=active=>chooser.querySelector(`[data-icon-card="${icon.id}"]`)?.setAttribute('data-hover',String(active));
    el.addEventListener('pointerenter',()=>feedback(true));el.addEventListener('pointerleave',()=>feedback(false));
    el.addEventListener('focus',()=>feedback(true));el.addEventListener('blur',()=>feedback(false));
    chooser.querySelector('.icon-controls').append(el);
  }
  document.querySelectorAll('.flow-button').forEach(el=>{
    const feedback=state=>el.closest('.scene, .viewport-layer').querySelector(`[data-flow-art="${el.dataset.flow}"]`)?.setAttribute('data-feedback',state);
    el.addEventListener('pointerenter',()=>feedback('hover'));el.addEventListener('pointerleave',()=>feedback(''));
    el.addEventListener('pointerdown',()=>feedback('pressed'));el.addEventListener('pointerup',()=>feedback('hover'));
    el.addEventListener('focus',()=>feedback('hover'));el.addEventListener('blur',()=>feedback(''));
  });
  // Source vectors are centered once during asset preparation. Both views pack
  // filtered icons into these same, evenly spaced cells without resizing glyphs.
  function paintIcons(scene,state) {
    const available=new Map(state.availableIcons.map((icon,index)=>[icon.id,index]));
    scene.querySelectorAll('[data-library-icon], [data-icon-card]').forEach(el=>{
      const id=el.dataset.libraryIcon??el.dataset.iconCard;
      el.style.display=available.has(id)?'':'none';
      if(available.has(id)){
        const {x,y}=cellPosition(available.get(id),scene===chooser);
        el.setAttribute('transform',`translate(${x} ${y})`);
      }
      el.dataset.selected=String(state.selectedIcons.includes(id));
    });
    scene.querySelectorAll('[data-icon]').forEach(el=>{
      el.hidden=!available.has(el.dataset.icon);el.setAttribute('aria-pressed',String(state.selectedIcons.includes(el.dataset.icon)));
      el.setAttribute('aria-disabled',String(state.selectedIcons.length>=MAX_SELECTED_ICONS&&!state.selectedIcons.includes(el.dataset.icon)));
      if(available.has(el.dataset.icon)){
        const {x,y}=cellPosition(available.get(el.dataset.icon),true);
        el.style.setProperty('--x',x);el.style.setProperty('--y',y);
      }
    });
    scene.dataset.city=state.selectedCity;
  }
  function paintControls(state) {
    library.querySelectorAll('[data-city]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.city===state.selectedCity)));
    library.querySelectorAll('[data-city-art]').forEach(el=>el.dataset.active=String(el.dataset.cityArt===state.selectedCity));
    chooser.querySelector('[data-flow=next]').disabled=state.selectedIcons.length===0;
    chooser.querySelector('#icon-selection-hint').textContent=state.selectedIcons.length?`${state.selectedIcons.length} / 3 selected`:'Choose 1–3 icons.';
    const city=cities.find(city=>city.id===state.selectedCity).label;
    library.querySelector('.collection-status').textContent=`${city}: ${state.availableIcons.length} icons available.`;
    chooser.querySelector('.collection-status').textContent=`${city}: ${state.availableIcons.length} icons available, ${state.selectedIcons.length} selected.`;
  }
  async function update(state) {
    paintControls(state);paintIcons(chooser,state);
    const layer=library.querySelector('[data-collection]');
    const cityChanged=paintedCity!==state.selectedCity;paintedCity=state.selectedCity;
    if(!cityChanged||!layer||!library.classList.contains('scene--active')||reduced.matches) {
      change++;animation?.cancel();library.removeAttribute('aria-busy');paintIcons(library,state);return;
    }
    const ticket=++change;animation?.cancel();library.setAttribute('aria-busy','true');
    try {
      animation=layer.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(-10px)'}],{duration:160,easing:'ease-in',fill:'forwards'});
      await animation.finished;if(ticket!==change)return;
      paintIcons(library,libraryState.getState());animation.cancel();
      animation=layer.animate([{opacity:0,transform:'translateX(10px)'},{opacity:1,transform:'translateX(0)'}],{duration:160,easing:'ease-out',fill:'forwards'});
      await animation.finished;if(ticket===change)animation.cancel();
    } catch(error) {if(error.name!=='AbortError')throw error;}
    finally {if(ticket===change)library.removeAttribute('aria-busy');}
  }
  libraryState.subscribe(update);
  document.querySelector('#save-pattern').addEventListener('click',onSave);
  document.querySelector('#save-success-layer').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();navigate('pattern-save');}
    if(event.key==='Tab') {
      const buttons=[...event.currentTarget.querySelectorAll('button')];
      const index=buttons.indexOf(document.activeElement);
      event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
    }
  });
  return {
    prepare() {
      change++;animation?.cancel();library.removeAttribute('aria-busy');
      const state=libraryState.getState();paintedCity=state.selectedCity;
      paintControls(state);paintIcons(library,state);paintIcons(chooser,state);
    },
    leave(){change++;animation?.cancel();library.removeAttribute('aria-busy');},
    getSelection:()=>libraryState.getState(),
    setCity:city=>libraryState.setCity(city),
  };
}
