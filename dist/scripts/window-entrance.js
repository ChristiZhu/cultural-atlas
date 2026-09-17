import { loadArtwork } from './scenes.js';

const EASE='cubic-bezier(.35,0,.2,1)';
export const ENTRANCE_TIMING=Object.freeze({curtain:120,flowers:220,open:350,edge:730,opened:1150,push:940,fade:1400,end:1740});

/** One click owns one timeline. The illustration itself is untouched Figma vectors. */
export function createWindowEntrance(home,trigger){
  const still=home.querySelector('.scene__art');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let artwork,preparing,active,controller;
  const effects=new Set();
  home.dataset.entrance='CLOSED';
  function prepare(){
    if(!preparing)preparing=loadArtwork('./assets/homepage-motion.svg').then(svg=>{
      svg.classList.add('window-art');svg.setAttribute('role','img');svg.setAttribute('aria-hidden','false');svg.setAttribute('aria-label',still.alt);
      svg.setAttribute('hidden','');home.insertBefore(svg,trigger);artwork=svg;return svg;
    }).catch(error=>{preparing=null;throw error;});
    return preparing;
  }
  function reset(){
    for(const motion of effects)motion.cancel();effects.clear();
    if(artwork){artwork.setAttribute('hidden','');artwork.removeAttribute('style');artwork.querySelectorAll('[style]').forEach(e=>e.removeAttribute('style'));}
    still.hidden=false;
    home.style.opacity='';home.style.zIndex='';home.dataset.entrance='CLOSED';
    trigger.removeAttribute('aria-disabled');
  }
  function guard(promise,signal){
    return new Promise((resolve,reject)=>{
      const stop=()=>{signal.removeEventListener('abort',stop);reject(new DOMException('Entrance interrupted','AbortError'));};
      Promise.resolve(promise).then(value=>{signal.removeEventListener('abort',stop);resolve(value);},error=>{signal.removeEventListener('abort',stop);reject(error);});
      if(signal.aborted)stop();else signal.addEventListener('abort',stop,{once:true});
    });
  }
  function motion(element,frames,start,duration,signal){
    const animation=element.animate(frames,{delay:start,duration,easing:EASE,fill:'both'});
    effects.add(animation);
    // Consume rejections immediately even for effects which overlap later awaits.
    const done=guard(animation.finished,signal);done.catch(()=>{});return done;
  }
  function pose(element,x,y){element.style.transformBox='view-box';element.style.transformOrigin=`${x}px ${y}px`;}
  async function play({ready,commit,incoming},signal){
    ready.catch(()=>{});
    trigger.setAttribute('aria-disabled','true');home.dataset.entrance='OPENING';
    try{
      await guard(prepare(),signal);
      if(reduced.matches){await guard(ready,signal);commit();home.dataset.entrance='CORKBOARD';return;}
      artwork.removeAttribute('hidden');still.hidden=true;
      const animations=[];
      const q=selector=>[...artwork.querySelectorAll(selector)];
      const start=(el,frames,delay,duration)=>animations.push(motion(el,frames,delay,duration,signal));
      // Cloth layers pivot at the curtain rail; stitch lines lag the fabric subtly.
      q('[data-motion="curtain"]').forEach((el,i)=>{
        const left=el.dataset.side==='left',direction=left?1:-1;
        pose(el,left?580:848,242);
        start(el,[{transform:'skewX(0deg) rotate(0deg)'},{transform:`skewX(${direction*.7}deg) rotate(${direction*.25}deg)`,offset:.38},{transform:`skewX(${-direction*.25}deg) rotate(${-direction*.12}deg)`,offset:.7},{transform:'skewX(0deg) rotate(0deg)'}],ENTRANCE_TIMING.curtain+(i%2)*45,1030);
      });
      q('[data-stem],[data-flower]').forEach(el=>{
        const i=Number(el.dataset.stem??el.dataset.flower),[x,y]=el.dataset.pivot.split(' ');
        pose(el,x,y);const angle=.8+(i%4)*.2;
        start(el,[{transform:'rotate(0deg)'},{transform:`rotate(${-angle}deg)`,offset:.38},{transform:`rotate(${angle*.32}deg)`,offset:.72},{transform:'rotate(0deg)'}],ENTRANCE_TIMING.flowers+(i%4)*24,950);
      });
      q('[data-leaf]').forEach((el,i)=>{pose(el,1210,796);start(el,[{transform:'rotate(0deg)'},{transform:'rotate(-.7deg)',offset:.4},{transform:'rotate(.2deg)',offset:.75},{transform:'rotate(0deg)'}],260+i*35,950);});
      start(q('[data-motion="recess"]')[0],[{opacity:0},{opacity:1}],ENTRANCE_TIMING.open,180);
      start(q('[data-motion="curtain-closed"]')[0],[{opacity:1},{opacity:0}],ENTRANCE_TIMING.open,380);
      start(q('[data-motion="curtain-open"]')[0],[{opacity:0},{opacity:1}],ENTRANCE_TIMING.open,380);
      // Project each leaf around its fixed hinge. SVG groups do not consistently
      // project CSS 3D transforms across browsers, so animate their horizontal
      // projection; the exported open faces supply the original perspective.
      q('[data-motion="closed-pane"]').forEach(el=>{
        const left=el.dataset.side==='left';pose(el,left?568:863,417);
        start(el,[{transform:'scale(1,1)',opacity:1},{transform:'scale(.001,1.025)',opacity:1,offset:.995},{transform:'scale(0,1.025)',opacity:0}],ENTRANCE_TIMING.open,ENTRANCE_TIMING.edge-ENTRANCE_TIMING.open);
      });
      q('[data-motion="open-pane"]').forEach(el=>{
        const left=el.dataset.side==='left';pose(el,left?568:863,417);
        start(el,[{transform:'scale(0,1.025)',opacity:0},{transform:'scale(.001,1.025)',opacity:1,offset:.005},{transform:'scale(1,1)',opacity:1}],ENTRANCE_TIMING.edge,ENTRANCE_TIMING.opened-ENTRANCE_TIMING.edge);
      });
      start(q('[data-motion="shadow"]')[0],[{opacity:0},{opacity:.18}],ENTRANCE_TIMING.edge,420);
      start(q('[data-motion="hinges"]')[0],[{opacity:0},{opacity:1}],ENTRANCE_TIMING.open,250);
      artwork.style.transformOrigin='47.55% 42.5%';
      start(artwork,[{transform:'scale(1)'},{transform:'scale(1.105)'}],ENTRANCE_TIMING.push,ENTRANCE_TIMING.end-ENTRANCE_TIMING.push);
      // This opacity hold is a cancellable timeline marker, not a second timer.
      await motion(home,[{opacity:1},{opacity:1}],0,ENTRANCE_TIMING.fade,signal);
      await guard(ready,signal);home.dataset.entrance='ENTERING';
      incoming.style.visibility='visible';incoming.style.opacity='1';incoming.inert=true;
      home.style.zIndex='2';
      await motion(home,[{opacity:1},{opacity:0}],0,ENTRANCE_TIMING.end-ENTRANCE_TIMING.fade,signal);
      await Promise.all(animations);commit();home.dataset.entrance='CORKBOARD';
    }finally{
      for(const effect of effects)effect.cancel();effects.clear();
      incoming.style.visibility='';incoming.style.opacity='';home.style.opacity='';home.style.zIndex='';
      if(home.dataset.entrance!=='CORKBOARD')reset();
    }
  }
  return {prepare,reset,
    enter(options){
      if(active)return active;
      controller=new AbortController();
      active=play(options,controller.signal).finally(()=>{active=null;});return active;
    },
    async cancel(){controller?.abort();if(active)await active.catch(()=>{});reset();},
  };
}
