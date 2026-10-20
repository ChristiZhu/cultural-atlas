import {getLanguage,t} from './i18n.js';

/** Local public-domain geometry; interaction stays within the existing scene router. */
export function createWorld({navigate}) {
  const scene=document.querySelector('#world'),svg=scene.querySelector('.world-map');
  const layer=svg.querySelector('.world-countries'),picker=scene.querySelector('#world-country');
  const name=scene.querySelector('.world-country-name'),availability=scene.querySelector('.world-availability');
  const explore=scene.querySelector('.world-explore'),description=scene.querySelector('.world-description'),pin=scene.querySelector('.world-pin');
  let countries=[],selected=null,focused='CHN',ready;
  const label=country=>country.id==='CHN'?t('China'):(getLanguage()==='zh'?country.zh:country.name);
  function select(id) {
    const country=countries.find(c=>c.id===id);
    selected=country?country.id:null;
    name.textContent=country?label(country):t('Select a country');
    description.textContent=t(!country?'Select a country to begin exploring.':id==='CHN'?'Explore cultural stories, cities, and creative traditions.':'More cultural stories are coming soon.');
    availability.textContent=country&&id!=='CHN'?t('Coming Soon'):'';
    explore.hidden=selected!=='CHN';picker.value=selected||'';
    pin.setAttribute('aria-pressed',String(selected==='CHN'));
    layer.querySelectorAll('[data-country]').forEach(path=>{
      path.dataset.selected=String(path.dataset.country===selected);
      path.setAttribute('aria-pressed',String(path.dataset.country===selected));
      path.setAttribute('tabindex',path.dataset.country===(selected||focused)?'0':'-1');
    });
  }
  function localize(){
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=t('Select a country');
    picker.replaceChildren(placeholder,...[...countries].sort((a,b)=>label(a).localeCompare(label(b),getLanguage())).map(c=>{
      const option=document.createElement('option');option.value=c.id;option.textContent=label(c);return option;
    }));
    layer.querySelectorAll('[data-country]').forEach(path=>{
      const country=countries.find(c=>c.id===path.dataset.country);
      path.setAttribute('aria-label',label(country));
    });
    select(selected);
  }
  layer.addEventListener('focusin',event=>{if(event.target.dataset.country)focused=event.target.dataset.country;});
  layer.addEventListener('click',event=>{const id=event.target.dataset.country;if(id)select(id);});
  layer.addEventListener('keydown',event=>{
    const id=event.target.dataset.country;if(!id)return;
    if(['Enter',' '].includes(event.key)){event.preventDefault();select(id);}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)){
      event.preventDefault();
      const step=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
      const next=event.key==='Home'?'CHN':countries[(countries.findIndex(c=>c.id===id)+step+countries.length)%countries.length].id;
      layer.querySelectorAll('[data-country]').forEach(path=>path.setAttribute('tabindex',path.dataset.country===next?'0':'-1'));
      layer.querySelector(`[data-country="${next}"]`).focus();
    }
  });
  picker.addEventListener('change',()=>select(picker.value));
  pin.addEventListener('click',()=>select('CHN'));
  pin.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();select('CHN');}});
  scene.addEventListener('keydown',event=>{if(event.key==='Escape'){select(null);}});
  explore.addEventListener('click',()=>{if(selected==='CHN')void navigate('corkboard');});
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
