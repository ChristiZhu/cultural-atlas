import {createGallery} from './gallery.js';
import {createSharing} from './share.js';
export function createCommunity({navigate}){
  const gallery=createGallery({navigate});
  const share=createSharing({onPublished:async id=>{gallery.reset();await navigate('community');await gallery.showDetail(id);}});
  window.addEventListener('popstate',()=>{share.close();gallery.close();});
  return {setSaved:share.setSaved,share:share.open,enter:gallery.enter};
}
