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
