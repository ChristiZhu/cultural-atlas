import {createCommunity} from './community/index.js?v=20261017-rebuild';
import {initLocalization,t} from './i18n.js';
import {initNavigation} from './navigation.js';
import { transitionPage, transitionWorkflow, transitionSuccess } from './transitions.js';
import { scenes, prepareScene, showScene } from './scenes.js';
import { createCityMap } from './city-map.js?v=2';
import { createArchive, archiveIds } from './archive.js?v=5';
import { createWindowEntrance } from './window-entrance.js';
import { createPatternWorkflow } from './pattern-workflow.js?v=20260929-taiyuan';
import { createIconLibrary } from './icon-library.js?v=20260929-taiyuan';
import {createWorld} from './world.js';
import {routeFromHash,routeHash,nextEntry,backTarget,backDistance} from './exploration-history.js';

initNavigation();
await initLocalization();

const atlas = document.querySelector('#atlas');
const trigger = document.querySelector('#enter-window');
const status = document.querySelector('#status');
const successLayer = document.querySelector('#save-success-layer');
const map = createCityMap(document.querySelector('#guangzhou'), { navigate });
const archive = createArchive(document.querySelector('#archive'), { onRestore: () => map.resetInteraction(), onClose: () => { if(history.state?.archive){transitioning=true;history.back();} } });
const community = createCommunity({ navigate });
const world = createWorld({navigate});
const pattern = createPatternWorkflow({ navigate, onSaved:community.setSaved, onShare:community.share });
document.querySelector('#share-pattern').addEventListener('click',()=>pattern.share());
const library = createIconLibrary({ navigate, onSave: () => pattern.save() });
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>map.zoomBy(button.dataset.zoom==='in'?1.25:1/1.25)));
let current = 'home';
let transitioning = false;
const entrance=createWindowEntrance(document.querySelector('#home'),trigger);
void entrance.prepare().catch(()=>{});

// Every scene has a project-path-safe hash. Native history keeps internal origins
// across refreshes, without ever using an unrelated external history entry.
const initialRoute=routeFromHash(location.hash),initialScene=initialRoute.scene;
let entry=history.state?.atlas&&history.state.scene===initialScene?history.state:{atlas:true,...initialRoute,index:0,trail:[]};
history.replaceState(entry, '');
if(entry.cityId)document.querySelectorAll('[data-nav="map"]:not([data-city])').forEach(button=>
  button.setAttribute('aria-label',`Map — return to ${entry.cityId[0].toUpperCase()+entry.cityId.slice(1)}`));

async function navigate(destination, { recordHistory = true, replaceHistory = false, source, cityId, patternContinuation = false } = {}) {
  cityId=cityId||entry.cityId||map.cityId;
  if(archiveIds.includes(destination)){
    if(transitioning||archive.isOpen)return;
    transitioning=true;map.dismissCard();
    try{const opened=await archive.open(destination,source);if(opened&&recordHistory)history.pushState({...entry,scene:'map',cityId:map.cityId,archive:destination},'');}
    catch{status.textContent='The archive could not load. Please try again.';}
    finally{transitioning=false;}
    return;
  }
  if (archive.isOpen) return;
  if(destination.startsWith('pattern-')&&!library.getSelection().selectedIcons.length)destination='choose-icons';
  if(['pattern-preview','pattern-save','pattern-saved'].includes(destination)&&!pattern.canShowResult())destination='pattern-creating';
  if (transitioning || (destination === current && (destination !== 'map' || !cityId || cityId === map.cityId)) || !scenes[destination]) return;
  library.leave();
  if(!patternContinuation)pattern.leave();
  transitioning = true;
  trigger.setAttribute('aria-disabled', 'true');
  source?.setAttribute('data-selected', 'true');
  source?.setAttribute('aria-disabled', 'true');
  const closingSuccess=current==='pattern-saved'&&destination==='pattern-save';
  const openingSuccess=destination==='pattern-saved';
  const workflowScenes=['library','choose-icons','pattern-creating','pattern-preview','pattern-save','pattern-saved'];
  const lightTransition=workflowScenes.includes(current)||workflowScenes.includes(destination);
  const outgoing = document.getElementById(scenes[current].elementId);
  const incoming = document.getElementById(scenes[destination].elementId);
  try {
    // Avoid fading into an empty screen on a slow connection.
    const destinationReady=Promise.all([prepareScene(incoming), destination === 'world' ? world.prepare() : Promise.resolve(), destination === 'map' ? map.prepare(cityId) : Promise.resolve(), destination === 'pattern-saved' ? prepareScene(successLayer) : Promise.resolve()]);
    const windowEntrance=current==='home'&&destination==='world';
    if(!windowEntrance)await destinationReady;
    if(destination==='home')entrance.reset();
    // Only an explicit entry from a city map changes the shared city filter.
    // Back/forward and the creation workflow retain city and icon selection.
    if(destination==='library'&&current==='map'&&recordHistory&&!library.getSelection().selectedIcons.length)library.setCity(map.cityId);
    await pattern.prepare(destination);
    library.prepare();
    const commit = () => {
      if (destination === 'corkboard') incoming.querySelectorAll('[data-card]').forEach(card => {
        card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
        const name = card.dataset.card === 'shanxi' ? 'Taiyuan' : card.dataset.card;
        card.setAttribute('aria-label', `${name[0].toUpperCase() + name.slice(1)} — open the map`);
        card.removeAttribute('aria-hidden');
        card.ownerSVGElement.removeAttribute('aria-hidden');
      });

      document.body.style.backgroundColor = scenes[destination].background;
      showScene(outgoing, false);showScene(incoming, true);
      current = destination;atlas.dataset.screen = destination;
      if(destination==='community')community.enter();
      successLayer.hidden = destination !== 'pattern-saved';
      atlas.inert = destination === 'pattern-saved';
    };
    if(windowEntrance)await entrance.enter({ready:destinationReady,commit,incoming});
    else if(closingSuccess||openingSuccess)await transitionSuccess(successLayer,openingSuccess,commit);
    else if(lightTransition)await transitionWorkflow(scenes[destination].background,commit,outgoing,incoming);
    else await transitionPage(scenes[destination].background, commit);
    if(patternContinuation)pattern.leave();
    document.title = destination === 'map' ? `${map.cityName} — The Cultural Atlas` : scenes[destination].title;
    if (recordHistory) {
      entry=nextEntry(entry,destination,cityId,{replace:replaceHistory});
      history[replaceHistory ? 'replaceState' : 'pushState'](entry,'',location.pathname+location.search+routeHash(entry));
    } else if(entry.scene!==destination) {
      // A direct result URL without a saved draft safely lands in icon selection.
      entry={...entry,scene:destination,cityId};
      history.replaceState(entry,'',location.pathname+location.search+routeHash(entry));
    }
    if (destination === 'home') trigger.focus({ preventScroll: true });
    else (destination === 'pattern-saved' ? successLayer : incoming).focus({ preventScroll: true });
    status.textContent = '';

  } catch(error) {
    console.error('Unable to open the requested scene',destination,error);
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
  if(current==='map') {
    // Warm only the current city's books; each book limits concurrent decodes.
    for(const id of map.archiveIds)void archive.preload(id).catch(()=>{});
  }
}

trigger.addEventListener('click', () => navigate('world'));
document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>{
  if(transitioning||archive.isOpen)return;
  const target=backTarget(entry),distance=backDistance(entry,target);
  if(distance&&entry.index>=distance)history.go(-distance);
  else void navigate(target.scene,{cityId:target.cityId,source:button});
}));
document.querySelectorAll('[data-nav]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.nav, { source: button, cityId: button.dataset.city }));
});
window.addEventListener('popstate', async event => {
  await entrance.cancel();
  if(archive.isOpen)await archive.close(false);
  transitioning=false;
  entry=event.state?.atlas?event.state:{atlas:true,...routeFromHash(location.hash),index:0,trail:[]};
  await navigate(entry.scene, {recordHistory:false,cityId:entry.cityId});
  if(event.state?.archive)await navigate(event.state.archive,{recordHistory:false,cityId:event.state?.cityId});
});

const board = document.querySelector('#corkboard');
function openBoardCity(event) {
  const card = event.target.closest('[data-card]');
  if (!card || (event.type === 'keydown' && !['Enter', ' '].includes(event.key))) return;
  event.preventDefault();
  navigate('map', { source: card, cityId: card.dataset.card === 'shanxi' ? 'taiyuan' : card.dataset.card });
}
board.addEventListener('click', openBoardCity);
board.addEventListener('keydown', openBoardCity);

// Keep direct links in the existing scene lifecycle, including asset preparation.
if(initialScene!=='home')void navigate(initialScene,{recordHistory:false,cityId:entry.cityId});
