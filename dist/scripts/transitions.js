/** One viewport-level veil covers artwork, edge backgrounds and shared navigation. */
export async function transitionPage(color, commit) {
  const layer=document.querySelector('#page-transition');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){commit();return;}
  layer.style.backgroundColor=color;layer.hidden=false;
  try {
    const fadeIn=layer.animate([{opacity:0},{opacity:1}],{duration:240,easing:'ease-in-out',fill:'forwards'});
    await fadeIn.finished;commit();
    const fadeOut=layer.animate([{opacity:1},{opacity:0}],{duration:320,easing:'ease-in-out',fill:'forwards'});
    await fadeOut.finished;
  } finally {layer.hidden=true;layer.getAnimations().forEach(motion=>motion.cancel());}
}

/** A short crossfade of the real viewport scenes, with no cloned headers or color wipe. */
export async function transitionWorkflow(color,commit,outgoing,incoming) {
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){commit();return;}
  const oldBackground=getComputedStyle(document.body).backgroundColor;
  commit();
  if(outgoing===incoming)return;
  const oldStyle=outgoing.getAttribute('style');
  Object.assign(outgoing.style,{visibility:'visible',opacity:'1',zIndex:'3',pointerEvents:'none',backgroundColor:oldBackground});
  try {
    const fade=outgoing.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease-out',fill:'forwards'});
    await fade.finished;fade.cancel();
  } finally {
    if(oldStyle===null)outgoing.removeAttribute('style');else outgoing.setAttribute('style',oldStyle);
  }
}

export async function transitionSuccess(layer,opening,commit) {
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){commit();return;}
  if(opening)commit();
  const motion=layer.animate([{opacity:opening?0:1},{opacity:opening?1:0}],{duration:opening?160:140,easing:'ease-out',fill:'forwards'});
  try {await motion.finished;if(!opening)commit();}finally{motion.cancel();}
}
