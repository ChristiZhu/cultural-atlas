import { patternMetadata } from './pattern-metadata.js?v=20260929-taiyuan';
import { iconDisplayName } from './icon-names.js';
/** Shared cultural sources and ordered selection: primary, secondary, accent. */
export const MAX_SELECTED_ICONS=3;
export const culturalIcons = Object.freeze([
  { id:'canton-tower', label:iconDisplayName('guangzhou','Canton Tower'), city:'guangzhou', category:'architecture' },
  ...Array.from({length:6},(_,i)=>({id:`porcelain-${i+1}`,label:`${iconDisplayName('guangzhou','Guangcai Porcelain')} motif ${i+1}`,city:'guangzhou',category:'craft'})),
  { id:'har-gow', label:iconDisplayName('guangzhou','Shrimp Dumpling'), city:'guangzhou', category:'food' },
  { id:'five-rams', label:`${iconDisplayName('guangzhou','Five Rams Sculpture')} motif`, city:'guangzhou', category:'architecture' },
  { id:'porcelain-7', label:`${iconDisplayName('guangzhou','Guangcai Porcelain')} motif 7`, city:'guangzhou', category:'craft' },
  { id:'eight-treasure-duck', label:iconDisplayName('shanghai','Eight Treasure Duck'), city:'shanghai', category:'food' },
  { id:'lvdagun', label:iconDisplayName('beijing','Ludagun'), city:'beijing', category:'food' },
  { id:'beijing-kite', label:iconDisplayName('beijing','Swallow Kite'), city:'beijing', category:'craft' },
  { id:'youmian', label:iconDisplayName('taiyuan','Youmian Kaolaolao'), city:'taiyuan', category:'food' },
  { id:'paper-cutting', label:iconDisplayName('taiyuan','Paper Cutting'), city:'taiyuan', category:'craft' },
  { id:'bamboo-rice', label:iconDisplayName('dehong','Bamboo Rice'), city:'dehong', category:'food' },
  ...Array.from({length:3},(_,i)=>({id:`jingpo-${i+1}`,label:`${iconDisplayName('dehong','Jingpo Brocade')} motif ${i+1}`,city:'dehong',category:'craft'})),
  ...Array.from({length:4},(_,i)=>({id:`jinshan-${i+1}`,label:`${iconDisplayName('shanghai','Jinshan Folk Painting')} motif ${i+1}`,city:'shanghai',category:'craft'})),
  { id:'beijing-rabbit', label:iconDisplayName('beijing','Lord Rabbit'), city:'beijing', category:'craft' },
].map(icon=>Object.freeze({...icon,...patternMetadata(icon.id)})));
export const cities = Object.freeze([
  {id:'all',label:'ALL',x:86,w:133},
  {id:'guangzhou',label:'Guangzhou',x:224,w:236},
  {id:'beijing',label:'Beijing',x:464,w:179},
  {id:'shanghai',label:'Shanghai',x:649,w:192},
  {id:'dehong',label:'Dehong',x:841,w:161.5},
  // Keep the original Figma tab artwork “Taiyuan”, using the map's city ID.
  {id:'taiyuan',label:'Taiyuan',x:1009,w:159.5},
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
      if(city==='shanxi')city='taiyuan';
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
