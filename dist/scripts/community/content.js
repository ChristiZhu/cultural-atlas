import {cities,culturalIcons} from '../library-state.js?v=20260929-taiyuan';
import {archivesByCity} from '../archive-entries.js';
import {iconDisplayName} from '../icon-names.js';
export {cities,culturalIcons};
export const cityLabel=id=>id==='all'?'All Cities':cities.find(city=>city.id===id)?.label||'';
export function element(tag,className,text){const node=document.createElement(tag);node.className=className||'';if(text!==undefined)node.textContent=text;return node;}
export function action(text,handler,className='community-button'){const node=element('button',className,text);node.type='button';node.addEventListener('click',handler);return node;}
export function image(url){const node=element('img','community-preview');node.src=url;node.alt='Pattern preview';return node;}
export function credit(value){const node=element('span','community-credit',value||'Anonymous');if(value)node.dataset.userContent='';return node;}
export function sources(city,ids,onArchive){
  const root=element('div','community-sources'),location=element('p');location.append(element('span','','City'),document.createTextNode(': '),element('span','',cityLabel(city)));
  root.append(location,element('h3','','Icons Used'));
  const list=element('ul','community-icons');
  for(const id of ids){
    const icon=culturalIcons.find(item=>item.id===id);if(!icon)continue;
    const route=Object.entries(archivesByCity[icon.city]||{}).find(([source])=>icon.label===iconDisplayName(icon.city,source)||icon.label.startsWith(iconDisplayName(icon.city,source)+' motif'))?.[1];
    const card=route&&onArchive?action('',()=>onArchive(icon.city,route),'community-icon'):element('div','community-icon');
    const thumb=element('img');thumb.src=icon.svg;thumb.alt='';const caption=element('span');caption.append(element('span','',icon.label),element('small','',cityLabel(icon.city)));card.append(thumb,caption);
    const item=element('li');item.append(card);list.append(item);
  }
  root.append(list);return root;
}
export function bindDialog(dialog){
  let opener;
  for(const button of dialog.querySelectorAll('[data-close]'))button.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(!dialog.open&&opener?.isConnected)opener.focus({preventScroll:true});});
  return ()=>{opener=document.activeElement;dialog.showModal();dialog.scrollTop=0;};
}
