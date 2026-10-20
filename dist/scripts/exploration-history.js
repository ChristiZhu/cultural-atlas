/** Scene URLs and contextual return routes, using the application's native history. */
const cityIds=['guangzhou','beijing','shanghai','dehong','taiyuan'];
export const workflowScenes=['library','choose-icons','pattern-creating','pattern-preview','pattern-save','pattern-saved'];
const routeScenes=['home','world','corkboard','map','about','community',...workflowScenes];
export function routeFromHash(hash){
  const [scene,cityId]=hash.replace(/^#/,'').split('/');
  return {scene:routeScenes.includes(scene)?scene:'home',...(scene==='map'&&cityIds.includes(cityId)?{cityId}:{})};
}
export function routeHash({scene,cityId}){
  return scene==='home'?'':`#${scene}${scene==='map'&&cityIds.includes(cityId)?'/'+cityId:''}`;
}
export function nextEntry(previous,destination,cityId,{replace=false}={}){
  const from={scene:previous.scene,cityId:previous.cityId};
  const trail=replace?(previous.trail||[]):[...(previous.trail||[]),from].slice(-60);
  const enteringCreation=workflowScenes.includes(destination)&&!workflowScenes.includes(previous.scene)&&!['community','about'].includes(previous.scene);
  return {atlas:true,scene:destination,cityId,trail,
    creationOrigin:enteringCreation?from:previous.creationOrigin,
    index:replace?(previous.index||0):(previous.index||0)+1};
}
export function backTarget(entry){
  if(entry.scene==='world')return {scene:'home'};
  if(entry.scene==='corkboard')return {scene:'world'};
  if(entry.scene==='map')return {scene:'corkboard'};
  if(entry.scene==='library')return entry.creationOrigin||{scene:'corkboard'};
  if(entry.scene==='pattern-save')return {scene:'pattern-preview',cityId:entry.cityId};
  if(entry.scene==='pattern-creating')return {scene:'choose-icons',cityId:entry.cityId};
  return entry.trail?.at(-1)||{scene:'corkboard'};
}
export function backDistance(entry,target){
  const trail=entry.trail||[];
  for(let i=trail.length-1;i>=0;i--){
    if(trail[i].scene===target.scene&&(!target.cityId||trail[i].cityId===target.cityId))
      return trail.length-i;
  }
  return 0;
}
