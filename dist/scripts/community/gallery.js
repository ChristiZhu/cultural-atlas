import {communityRequest,previewURL} from './api.js';
import {getLanguage} from '../i18n.js';
import {cities,cityLabel,element,action,image,credit,sources,bindDialog} from './content.js';
export function createGallery({navigate}){
  const scene=document.querySelector('#community'),grid=scene.querySelector('.community-grid'),filters=scene.querySelector('.community-filters');
  const status=scene.querySelector('.community-status'),empty=scene.querySelector('.community-empty'),retry=scene.querySelector('[data-community-retry]'),more=scene.querySelector('[data-community-more]');
  const dialog=document.querySelector('#community-detail'),content=dialog.querySelector('.community-detail-content'),openDialog=bindDialog(dialog);
  let filter='*',cursor=null,loaded=false,busy=false,revision=0,detailRequest,detailId=null;
  const choices=[{id:'*',label:'All Patterns'},...cities.map(city=>({id:city.id,label:cityLabel(city.id)}))];
  function selection(){for(const button of filters.children)button.setAttribute('aria-pressed',String(button.dataset.communityCity===filter));}
  for(const city of choices){const button=action(city.label,()=>{filter=city.id;selection();void load();});button.dataset.communityCity=city.id;filters.append(button);}selection();
  function card(entry){
    const button=action('',()=>void showDetail(entry.id),'community-card');button.dataset.entry=entry.id;
    const preview=image(previewURL(entry.id));preview.loading='lazy';preview.addEventListener('error',()=>{preview.hidden=true;button.prepend(element('p','','Preview unavailable'));},{once:true});
    button.append(preview,credit(entry.creatorName),element('span','community-city',cityLabel(entry.citySelection)));return button;
  }
  async function load({append=false}={}){
    if(append&&busy)return;const ticket=++revision;busy=true;loaded=false;more.disabled=true;retry.hidden=true;empty.hidden=true;grid.setAttribute('aria-busy','true');status.textContent='Loading patterns…';
    if(!append){grid.replaceChildren();cursor=null;more.hidden=true;}
    try{
      const query=new URLSearchParams({city:filter});if(append&&cursor)query.set('before',cursor);
      const page=await communityRequest('patterns?'+query);if(ticket!==revision)return;
      grid.append(...page.items.map(card));cursor=page.nextCursor;more.hidden=!cursor;loaded=true;status.textContent='';
      if(!grid.children.length){if(filter==='*')empty.hidden=false;else status.textContent='No patterns have been shared for this city yet.';}
    }catch{if(ticket===revision){status.textContent='The community could not be reached. Please try again.';retry.hidden=false;}}
    finally{if(ticket===revision){busy=false;more.disabled=false;grid.setAttribute('aria-busy','false');}}
  }
  async function showDetail(id){
    detailId=id;
    detailRequest?.abort();const controller=new AbortController();detailRequest=controller;
    content.replaceChildren(element('p','','Loading patterns…'));if(!dialog.open)openDialog();
    try{
      const entry=await communityRequest(`patterns/${encodeURIComponent(id)}?lang=${getLanguage()}`,{signal:controller.signal});
      if(controller.signal.aborted||!dialog.open)return;
      const layout=element('div','community-detail-layout'),description=element('div');
      description.append(credit(entry.creatorName),sources(entry.citySelection,entry.iconsUsed,async(city,archive)=>{dialog.close();await navigate('map',{cityId:city});await navigate(archive);}));
      if(entry.reflection){
        const reflection=element('p','community-reflection',entry.reflection);reflection.dataset.userContent='';reflection.lang=entry.reflectionLanguage==='zh'?'zh-CN':'en';
        description.append(element('h3','','Thoughts Behind Your Pattern'),reflection);
        if(entry.translationStatus==='translated'){
          let original=false;const noteStatus=element('span','','Translated');const toggle=action('Show Original',()=>{
            original=!original;reflection.textContent=original?entry.reflectionOriginal:entry.reflection;
            reflection.lang=(original?entry.sourceLanguage:entry.reflectionLanguage)==='zh'?'zh-CN':'en';
            toggle.textContent=original?'Show Translation':'Show Original';
            noteStatus.textContent=original?'Original':'Translated';
          },'community-translation-toggle');
          const note=element('div','community-translation-note');note.append(noteStatus,toggle);description.append(note);
        }else if(entry.translationStatus==='unavailable')description.append(element('p','community-translation-note','Translation is temporarily unavailable. Showing the original.'));
      }
      layout.append(image(previewURL(entry.id)),description);content.replaceChildren(layout);
    }catch(error){if(!controller.signal.aborted)content.replaceChildren(element('p','',error.message==='This pattern is no longer available.'?error.message:'The community could not be reached. Please try again.'),action('Try Again',()=>void showDetail(id)));}
  }
  dialog.addEventListener('close',()=>{if(!dialog.open){detailRequest?.abort();detailId=null;}});
  window.addEventListener('atlas:language',()=>{if(dialog.open&&detailId)void showDetail(detailId);});
  more.addEventListener('click',()=>void load({append:true}));retry.addEventListener('click',()=>void load());scene.querySelector('[data-community-refresh]').addEventListener('click',()=>void load());
  return {enter:()=>{if(!loaded)void load();},showDetail,reset:()=>{filter='*';selection();loaded=false;},close:()=>dialog.close()};
}
