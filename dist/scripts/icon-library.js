import { cities, culturalIcons, libraryState } from './library-state.js';

export function createIconLibrary({navigate}) {
  const library=document.querySelector('#icon-library'),chooser=document.querySelector('#choose-icons');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paintedCity=libraryState.getState().selectedCity,change=0,animation,previewTimer;
  function button(label,styles) {
    const el=document.createElement('button');el.type='button';el.className='art-button';
    el.setAttribute('aria-label',label);el.style.cssText=styles;return el;
  }
  for(const city of cities) {
    const el=button(city.label,`--x:${city.x};--y:239;--w:${city.w};--h:52`);
    el.dataset.city=city.id;el.classList.add('city-button');el.setAttribute('aria-controls','city-collection');
    el.addEventListener('click',()=>libraryState.setCity(city.id));library.querySelector('.city-controls').append(el);
  }
  const xs=[144,256,368,480,592,700,812,924,1042];
  for(const [index,icon] of culturalIcons.entries()) {
    const el=button(icon.label,`--x:${xs[index]};--y:259;--w:92;--h:92`);
    el.dataset.icon=icon.id;el.classList.add('icon-button');
    el.addEventListener('click',()=>libraryState.toggleIcon(icon.id));
    const feedback=active=>chooser.querySelector(`[data-icon-card="${icon.id}"]`)?.setAttribute('data-hover',String(active));
    el.addEventListener('pointerenter',()=>feedback(true));el.addEventListener('pointerleave',()=>feedback(false));
    el.addEventListener('focus',()=>feedback(true));el.addEventListener('blur',()=>feedback(false));
    chooser.querySelector('.icon-controls').append(el);
  }
  document.querySelectorAll('.flow-button').forEach(el=>{
    const feedback=state=>el.closest('.scene').querySelector(`[data-flow-art="${el.dataset.flow}"]`)?.setAttribute('data-feedback',state);
    el.addEventListener('pointerenter',()=>feedback('hover'));el.addEventListener('pointerleave',()=>feedback(''));
    el.addEventListener('pointerdown',()=>feedback('pressed'));el.addEventListener('pointerup',()=>feedback('hover'));
    el.addEventListener('focus',()=>feedback('hover'));el.addEventListener('blur',()=>feedback(''));
  });
  function paintIcons(scene,state) {
    const available=new Set(state.availableIcons.map(icon=>icon.id));
    scene.querySelectorAll('[data-library-icon]').forEach(el=>el.style.display=available.has(el.dataset.libraryIcon)?'':'none');
    scene.querySelectorAll('[data-icon-card]').forEach(el=>{
      el.style.display=available.has(el.dataset.iconCard)?'':'none';
      el.dataset.selected=String(state.selectedIcons.includes(el.dataset.iconCard));
    });
    scene.querySelectorAll('[data-icon]').forEach(el=>{
      el.hidden=!available.has(el.dataset.icon);el.setAttribute('aria-pressed',String(state.selectedIcons.includes(el.dataset.icon)));
    });
    scene.dataset.city=state.selectedCity;
  }
  function paintControls(state) {
    library.querySelectorAll('[data-city]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.city===state.selectedCity)));
    library.querySelectorAll('[data-city-art]').forEach(el=>el.dataset.active=String(el.dataset.cityArt===state.selectedCity));
    const city=cities.find(city=>city.id===state.selectedCity).label;
    library.querySelector('.collection-status').textContent=`${city}: ${state.availableIcons.length} icons available.`;
    chooser.querySelector('.collection-status').textContent=`${city}: ${state.availableIcons.length} icons available, ${state.selectedIcons.length} selected.`;
  }
  async function update(state) {
    paintControls(state);paintIcons(chooser,state);
    const layer=library.querySelector('[data-collection]');
    const cityChanged=paintedCity!==state.selectedCity;paintedCity=state.selectedCity;
    if(!cityChanged||!layer||!library.classList.contains('scene--active')||reduced.matches) {
      change++;animation?.cancel();paintIcons(library,state);return;
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
  document.querySelector('#save-pattern').addEventListener('click',()=>{
    // Download the existing Figma example. This does not compose or generate a pattern.
    const link=document.createElement('a');link.href='./assets/library/figma-pattern-example.svg';
    link.download='canton-tower-figma-example.svg';document.body.append(link);link.click();link.remove();
    navigate('pattern-saved');
  });
  document.querySelector('#pattern-saved').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();navigate('pattern-save');}
  });
  return {
    prepare() {
      change++;animation?.cancel();library.removeAttribute('aria-busy');
      const state=libraryState.getState();paintedCity=state.selectedCity;
      paintControls(state);paintIcons(library,state);paintIcons(chooser,state);
    },
    enter(scene) {
      clearTimeout(previewTimer);
      if(scene==='pattern-creating')previewTimer=setTimeout(()=>navigate('pattern-preview',{replaceHistory:true}),reduced.matches?100:1200);
    },
    leave(){clearTimeout(previewTimer);},
    getSelection:()=>libraryState.getState(),
  };
}
