import { patternMetadata } from './pattern-metadata.js';
/** Shared cultural sources and ordered selection: primary, secondary, accent. */
export const MAX_SELECTED_ICONS=3;
export const culturalIcons = Object.freeze([
  { id:'canton-tower', label:'Canton Tower', city:'guangzhou' },
  ...Array.from({length:6},(_,i)=>({id:`porcelain-${i+1}`,label:`Guangzhou Painted Porcelain motif ${i+1}`,city:'guangzhou'})),
  { id:'har-gow', label:'Har Gow', city:'guangzhou' },
  { id:'five-rams', label:'Five Rams sculpture motif', city:'guangzhou' },
].map(icon=>Object.freeze({...icon,...patternMetadata(icon.id)})));
export const cities = Object.freeze([
  {id:'all',label:'ALL',x:86,w:133},
  {id:'guangzhou',label:'Guangzhou',x:217,w:236},
  {id:'beijing',label:'Beijing',x:464,w:179},
  {id:'shanghai',label:'Shanghai',x:649,w:192},
  {id:'dehong',label:'Dehong',x:841,w:161.5},
  {id:'shanxi',label:'Shanxi',x:1009,w:159.5},
].map(Object.freeze));
export function createLibraryState() {
  let selectedCity='all',selectedIcons=[];
  const listeners=new Set();
  const availableIcons=()=>culturalIcons.filter(icon=>selectedCity==='all'||icon.city===selectedCity);
  const snapshot=()=>({selectedCity,selectedIcons:[...selectedIcons],availableIcons:availableIcons()});
  const notify=()=>listeners.forEach(listener=>listener(snapshot()));
  return {
    getState:snapshot,
    setCity(city) {
      if(city===selectedCity||!cities.some(item=>item.id===city))return;
      selectedCity=city;
      const available=new Set(availableIcons().map(icon=>icon.id));
      selectedIcons=selectedIcons.filter(id=>available.has(id));
      notify();
    },
    toggleIcon(id) {
      if(!availableIcons().some(icon=>icon.id===id))return false;
      if(!selectedIcons.includes(id)&&selectedIcons.length>=MAX_SELECTED_ICONS)return false;
      selectedIcons=selectedIcons.includes(id)?selectedIcons.filter(item=>item!==id):[...selectedIcons,id];
      notify();return true;
    },
    subscribe(listener) {listeners.add(listener);return()=>listeners.delete(listener);},
  };
}
export const libraryState=createLibraryState();
