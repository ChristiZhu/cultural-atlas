import { transitionPage } from './transitions.js';
import { scenes, prepareScene, showScene } from './scenes.js';
import { createGuangzhouMap } from './guangzhou.js';
import { createArchive } from './archive.js';
import { createPatternWorkflow } from './pattern-workflow.js';
import { createIconLibrary } from './icon-library.js';

const atlas = document.querySelector('#atlas');
const trigger = document.querySelector('#enter-window');
const status = document.querySelector('#status');
const successLayer = document.querySelector('#save-success-layer');
const map = createGuangzhouMap(document.querySelector('#guangzhou'), { navigate });
const archive = createArchive(document.querySelector('#archive'), { onRestore: () => map.resetInteraction(), onClose: () => { if(history.state?.archive)history.back(); } });
const pattern = createPatternWorkflow({ navigate });
const library = createIconLibrary({ navigate, onSave: () => pattern.save() });
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>map.zoomBy(button.dataset.zoom==='in'?1.25:1/1.25)));
let current = 'home';
let transitioning = false;

// Every fresh visit starts at the window. History supports returning and replaying.
history.replaceState({ scene: 'home' }, '');

async function navigate(destination, { recordHistory = true, replaceHistory = false, source, patternContinuation = false } = {}) {
  if(destination==='canton'||destination==='porcelain'){
    if(transitioning||archive.isOpen)return;
    transitioning=true;map.dismissCard();
    try{const opened=await archive.open(destination,source);if(opened&&recordHistory)history.pushState({scene:'map',archive:destination},'');}
    catch{status.textContent='The archive could not load. Please try again.';}
    finally{transitioning=false;}
    return;
  }
  if (archive.isOpen) return;
  if(destination.startsWith('pattern-')&&!library.getSelection().selectedIcons.length)destination='choose-icons';
  if (transitioning || destination === current || !scenes[destination]) return;
  library.leave();
  if(!patternContinuation)pattern.leave();
  transitioning = true;
  trigger.setAttribute('aria-disabled', 'true');
  source?.setAttribute('data-selected', 'true');
  source?.setAttribute('aria-disabled', 'true');
  const outgoing = document.getElementById(scenes[current].elementId);
  const incoming = document.getElementById(scenes[destination].elementId);
  try {
    // Avoid fading into an empty screen on a slow connection.
    await Promise.all([prepareScene(incoming), destination === 'map' ? map.prepare() : Promise.resolve(), destination === 'pattern-saved' ? prepareScene(successLayer) : Promise.resolve()]);
    await pattern.prepare(destination,{regenerate:destination==='pattern-creating'&&recordHistory});
    library.prepare();
    const commit = () => {
      document.body.style.backgroundColor = scenes[destination].background;
      showScene(outgoing, false);showScene(incoming, true);
      current = destination;atlas.dataset.screen = destination;
      successLayer.hidden = destination !== 'pattern-saved';
      atlas.inert = destination === 'pattern-saved';
      if(patternContinuation)pattern.leave();
    };
    if(patternContinuation)commit();
    else await transitionPage(scenes[destination].background, commit);
    document.title = scenes[destination].title;
    if (recordHistory) history[replaceHistory ? 'replaceState' : 'pushState']({ scene: destination }, '');
    if (destination === 'home') trigger.focus({ preventScroll: true });
    else (destination === 'pattern-saved' ? successLayer : incoming).focus({ preventScroll: true });
    status.textContent = '';

  } catch(error) {
    document.body.style.backgroundColor = scenes[current].background;
    showScene(outgoing, true);
    status.textContent = 'The artwork could not load. Please try again.';
    if(destination.startsWith('pattern-'))document.querySelector('#icon-selection-hint').textContent='Please try again — your selection is saved.';
  } finally {
    transitioning = false;
    trigger.removeAttribute('aria-disabled');
    source?.removeAttribute('aria-disabled');
    source?.removeAttribute('data-selected');
  }
  if(current===destination)void pattern.enter(destination);
}

trigger.addEventListener('click', () => navigate('corkboard'));
document.querySelectorAll('[data-nav]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.nav, { source: button }));
});
window.addEventListener('popstate', async event => {
  if(archive.isOpen)await archive.close(false);
  await navigate(event.state?.scene ?? 'home', {recordHistory:false});
  if(event.state?.archive)await navigate(event.state.archive,{recordHistory:false});
});
