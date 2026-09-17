import {createWindowEntrance} from '../dist/scripts/window-entrance.js';
import {prepareScene,showScene} from '../dist/scripts/scenes.js';
const home=document.querySelector('#home'),incoming=document.querySelector('#corkboard'),trigger=document.querySelector('#enter-window'),result=document.querySelector('#result');
const entrance=createWindowEntrance(home,trigger);
await entrance.prepare();
const ready=prepareScene(incoming);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function commit(){showScene(home,false);showScene(incoming,true);}
async function reset(){await entrance.cancel();showScene(home,true);showScene(incoming,false);}
async function snapshot(time){await reset();entrance.enter({ready,commit,incoming}).catch(()=>{});await wait(20);for(const a of document.getAnimations()){a.pause();a.currentTime=time;}result.textContent=`At ${time}ms\n`+[...document.querySelectorAll('[data-motion$="pane"]')].map(e=>`${e.dataset.motion} ${e.dataset.side} ${getComputedStyle(e).opacity} ${getComputedStyle(e).transform}`).join("\n");}
document.querySelector('#mid').onclick=()=>snapshot(600);
document.querySelector('#end').onclick=()=>snapshot(1300);
document.querySelector('#tests').onclick=async()=>{
 const lines=[];function check(ok,label){lines.push(`${ok?'PASS':'FAIL'} ${label}`);result.textContent=lines.join('\n');if(!ok)throw Error(label);}
 try{
 await reset();check(document.getAnimations().length===0&&!home.querySelector('img').hidden&&home.dataset.entrance==='CLOSED','Idle is original illustration, no autoplay');
 let release,count=0;const pending=new Promise(r=>release=r);const finish=()=>{count++;commit();};
 const first=entrance.enter({ready:pending,commit:finish,incoming});
 check(first===entrance.enter({ready:pending,commit:finish,incoming}),'Repeated clicks share one entrance');
 await wait(1550);check(count===0&&incoming.inert,'Slow board stays inert and waits for assets');release();await first;
 check(count===1&&!incoming.inert&&home.dataset.entrance==='CORKBOARD','Exactly one board commit after transition');
 await reset();check(!home.querySelector('img').hidden&&home.querySelector('svg').hasAttribute('hidden')&&document.getAnimations().length===0,'Return resets original closed artwork and every animation');
 const second=entrance.enter({ready,commit:finish,incoming});await second;check(count===2,'Second visit replays successfully');
 await reset();const aborted=entrance.enter({ready,commit:finish,incoming});aborted.catch(()=>{});await wait(100);await entrance.cancel();check(count===2&&home.dataset.entrance==='CLOSED'&&document.getAnimations().length===0,'Interrupted entrance resets without navigation');
 const realMatch=window.matchMedia;window.matchMedia=()=>({matches:true});const reduced=createWindowEntrance(home,trigger);await reduced.enter({ready,commit:finish,incoming});window.matchMedia=realMatch;check(count===3&&document.getAnimations().length===0,'Reduced motion commits without animation');
 result.textContent+='\nALL TESTS PASSED';
 }catch(error){result.textContent+='\n'+error.stack;}
};
