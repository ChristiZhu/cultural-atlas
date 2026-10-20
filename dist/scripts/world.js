import {getLanguage,t} from './i18n.js';

/** Local public-domain geometry; interaction stays within the existing scene router. */
export function createWorld({navigate}) {
  const scene=document.querySelector('#world'),svg=scene.querySelector('.world-map');
  const layer=svg.querySelector('.world-countries'),picker=scene.querySelector('#world-country');
  const name=scene.querySelector('.world-country-name'),availability=scene.querySelector('.world-availability');
  const explore=scene.querySelector('.world-explore');
  let countries=[],selected='CHN',ready;
  const label=country=>country.id==='CHN'?t('China'):(getLanguage()==='zh'?country.zh:country.name);
  function select(id) {
    selected=id;
    const country=countries.find(c=>c.id===id);if(!country)return;
    name.textContent=label(country);availability.textContent=t(id==='CHN'?'Ready to explore':'Coming Soon');
    explore.hidden=id!=='CHN';picker.value=id;
    layer.querySelectorAll('[data-country]').forEach(path=>{
      path.dataset.selected=String(path.dataset.country===id);
      path.setAttribute('aria-pressed',String(path.dataset.country===id));
      path.setAttribute('tabindex',path.dataset.country===id?'0':'-1');
    });
  }
  function localize(){
    picker.replaceChildren(...[...countries].sort((a,b)=>label(a).localeCompare(label(b),getLanguage())).map(c=>{
      const option=document.createElement('option');option.value=c.id;option.textContent=label(c);return option;
    }));
    layer.querySelectorAll('[data-country]').forEach(path=>{
      const country=countries.find(c=>c.id===path.dataset.country);
      path.setAttribute('aria-label',`${label(country)} — ${t(country.id==='CHN'?'Explore':'Coming Soon')}`);
    });
    select(selected);
  }
  function activate(id){select(id);if(id==='CHN')void navigate('corkboard');}
  layer.addEventListener('pointerover',event=>{const id=event.target.dataset.country;if(id)select(id);});
  layer.addEventListener('focusin',event=>{const id=event.target.dataset.country;if(id)select(id);});
  layer.addEventListener('click',event=>{const id=event.target.dataset.country;if(id)activate(id);});
  layer.addEventListener('keydown',event=>{
    const id=event.target.dataset.country;if(!id)return;
    if(['Enter',' '].includes(event.key)){event.preventDefault();activate(id);}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)){
      event.preventDefault();
      const step=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
      const next=event.key==='Home'?'CHN':countries[(countries.findIndex(c=>c.id===id)+step+countries.length)%countries.length].id;
      select(next);layer.querySelector(`[data-country="${next}"]`).focus();
    }
  });
  picker.addEventListener('change',()=>select(picker.value));
  explore.addEventListener('click',()=>navigate('corkboard'));
  window.addEventListener('atlas:language',localize);
  return {prepare(){
    if(!ready)ready=(async()=>{
      const response=await fetch(new URL('../assets/world/countries.json',import.meta.url));
      if(!response.ok)throw new Error('World map unavailable');
      countries=await response.json();
      for(const country of countries){
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d',country.d);path.dataset.country=country.id;path.dataset.color=country.color;
        path.setAttribute('role','button');path.setAttribute('tabindex','-1');
        layer.append(path);
      }
      localize();
    })().catch(error=>{ready=null;layer.replaceChildren();throw error;});
    return ready;
  }};
}
