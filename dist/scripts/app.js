import { scenes, prepareScene, showScene } from './scenes.js';
import { createGuangzhouMap } from './guangzhou.js';
import { createArchive } from './archive.js';

const atlas = document.querySelector('#atlas');
const trigger = document.querySelector('#enter-window');
const status = document.querySelector('#status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const map = createGuangzhouMap(document.querySelector('#guangzhou'), { navigate });
const archive = createArchive(document.querySelector('#archive'), { onClose: () => { if(history.state?.archive)history.back(); } });
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>map.zoomBy(button.dataset.zoom==='in'?1.25:1/1.25)));
let current = 'home';
let transitioning = false;

// Every fresh visit starts at the window. History supports returning and replaying.
history.replaceState({ scene: 'home' }, '');

async function navigate(destination, { recordHistory = true, source } = {}) {
  if(destination==='canton'||destination==='porcelain'){
    if(transitioning||archive.isOpen)return;
    transitioning=true;map.dismissCard();
    try{await archive.open(destination,source);if(recordHistory)history.pushState({scene:'map',archive:destination},'');}
    catch{status.textContent='The archive could not load. Please try again.';}
    finally{transitioning=false;}
    return;
  }
  if (archive.isOpen) return;
  if (transitioning || destination === current || !scenes[destination]) return;
  transitioning = true;
  trigger.setAttribute('aria-disabled', 'true');
  source?.setAttribute('data-selected', 'true');
  source?.setAttribute('aria-disabled', 'true');
  const outgoing = document.getElementById(scenes[current].elementId);
  const incoming = document.getElementById(scenes[destination].elementId);
  try {
    // Avoid fading into an empty screen on a slow connection.
    await Promise.all([prepareScene(incoming), destination === 'map' ? map.prepare() : Promise.resolve()]);
    document.body.style.backgroundColor = scenes[destination].background;
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
    if (!reducedMotion.matches) {
      outgoing.classList.add('scene--leaving');
      incoming.classList.add('scene--entering');
      await Promise.all([...outgoing.getAnimations(), ...incoming.getAnimations()].map(animation => animation.finished.catch(() => {})));
    }
    showScene(outgoing, false);
    showScene(incoming, true);
    outgoing.classList.remove('scene--leaving');
    incoming.classList.remove('scene--entering');
    current = destination;
    atlas.dataset.screen = destination;
    document.title = scenes[destination].title;
    if (recordHistory) history.pushState({ scene: destination }, '');
    if (destination === 'home') trigger.focus({ preventScroll: true });
    else incoming.focus({ preventScroll: true });
    status.textContent = '';
  } catch {
    document.body.style.backgroundColor = scenes[current].background;
    showScene(outgoing, true);
    status.textContent = 'The artwork could not load. Please try again.';
  } finally {
    transitioning = false;
    trigger.removeAttribute('aria-disabled');
    source?.removeAttribute('aria-disabled');
    source?.removeAttribute('data-selected');
  }
}

trigger.addEventListener('click', () => navigate('corkboard'));
document.querySelectorAll('[data-nav]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.nav, { source: button }));
});
window.addEventListener('popstate', async event => {
  if(archive.isOpen)archive.close(false);
  await navigate(event.state?.scene ?? 'home', {recordHistory:false});
  if(event.state?.archive)await navigate(event.state.archive,{recordHistory:false});
});
