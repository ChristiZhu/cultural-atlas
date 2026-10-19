import {communityRequest} from './api.js';
import {sources,bindDialog} from './content.js';
export function createSharing({onPublished}){
  const dialog=document.querySelector('#community-share'),openDialog=bindDialog(dialog),form=dialog.querySelector('form');
  const editor=dialog.querySelector('.community-share-editor'),confirmation=dialog.querySelector('.community-published');
  const status=dialog.querySelector('.community-publish-status'),submit=form.querySelector('[type=submit]'),counter=dialog.querySelector('.community-counter');
  const name=form.elements.creatorName,reflection=form.elements.reflection;
  let snapshot=null,preview=null,request=null,published=null,busy=false;
  function lock(value){for(const control of [name,reflection,submit,...dialog.querySelectorAll('[data-close]')])control.disabled=value;form.setAttribute('aria-busy',String(value));}
  function setSaved({patternData,blob}){
    if(preview)URL.revokeObjectURL(preview);preview=URL.createObjectURL(blob);snapshot=structuredClone(patternData);
    request=null;published=null;form.reset();status.textContent='';counter.textContent='0 / 300';lock(false);
    for(const image of dialog.querySelectorAll('.community-preview'))image.src=preview;
    dialog.querySelector('.community-source-info').replaceChildren(sources(snapshot.selectedCity,snapshot.selectedIcons));
    editor.hidden=false;confirmation.hidden=true;submit.textContent='Publish Pattern';
  }
  document.querySelector('#share-saved-pattern').addEventListener('click',()=>{if(snapshot)openDialog();});
  reflection.addEventListener('input',()=>{counter.textContent=`${[...reflection.value].length} / 300`;});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||published||!snapshot)return;
    if([...name.value].length>60||[...reflection.value].length>300){status.textContent='Please shorten your name or reflection.';return;}
    if(!request)request={requestId:crypto.randomUUID(),consent:true,creatorName:name.value.trim(),reflection:reflection.value.trim(),patternData:snapshot};
    busy=true;lock(true);status.textContent='Publishing…';
    try{
      published=await communityRequest('patterns',{body:request});editor.hidden=true;confirmation.hidden=false;status.textContent='';
    }catch(error){
      status.textContent=error.status?error.message:'The connection was interrupted. Retry to check your publication.';
      // Only a definitive rejection can safely start a new edited request.
      if(error.status&&error.status<500)request=null;
      submit.textContent='Try Again';
    }finally{busy=false;lock(false);if(request&&!published){name.disabled=true;reflection.disabled=true;}}
  });
  dialog.querySelector('[data-view-published]').addEventListener('click',async()=>{if(!published)return;const id=published.id;dialog.close();await onPublished(id);});
  return {setSaved,open:payload=>{if(busy)return;setSaved(payload);openDialog();},close:()=>dialog.close()};
}
