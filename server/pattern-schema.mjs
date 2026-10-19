import {culturalIcons, cities} from '../dist/scripts/library-state.js';
import {GRAMMARS, TILE_SIZE} from '../dist/scripts/pattern-generator.js';
import {COLOR_MODES, COLOR_ROLES} from '../dist/scripts/pattern-colors.js';
export const uuid=/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const fail=message=>{throw Object.assign(new Error(message),{status:400});};
const text=(v,max)=>{if(typeof v!=='string'||[...v].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v))fail('Invalid text.');return v.trim();};
const number=(v,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Invalid geometry.');return v;};
const member=(v,list)=>{if(!list.includes(v))fail('Invalid pattern selection.');return v;};
export function validateSubmission(input){
 if(!input||typeof input!=='object'||(typeof input.requestId!=='string'||!uuid.test(input.requestId))||input.consent!==true)fail('Explicit publication consent is required.');
 const p=input.patternData;if(!p||typeof p!=='object')fail('Missing pattern.');
 const selectedCity=member(p.selectedCity,cities.map(c=>c.id));
 if(!Array.isArray(p.selectedIcons)||p.selectedIcons.length<1||p.selectedIcons.length>3||new Set(p.selectedIcons).size!==p.selectedIcons.length)fail('Invalid icons.');
 const selectedIcons=p.selectedIcons.map(id=>member(id,culturalIcons.filter(i=>selectedCity==='all'||i.city===selectedCity).map(i=>i.id)));
 if(!p.palette||typeof p.palette!=='object')fail('Missing palette.');
 const palette={mode:member(p.palette.mode,COLOR_MODES),name:text(p.palette.name,80)};
 for(const role of COLOR_ROLES){if(typeof p.palette[role]!=='string'||!/^#[\da-f]{6}$/i.test(p.palette[role]))fail('Invalid color.');palette[role]=p.palette[role];}
 // Keep safe palette metadata, including the original seed and source description.
 for(const key of ['seed','source','colorSeed'])if(p.palette[key]!==undefined){const v=p.palette[key];if(typeof v==='number')palette[key]=number(v,0,Number.MAX_SAFE_INTEGER);else palette[key]=text(v,160);}
 if(!Array.isArray(p.items)||!p.items.length||p.items.length>100)fail('Invalid motif count.');
 const items=p.items.map(item=>{
  if(!item||typeof item.flipX!=='boolean'||typeof item.flipY!=='boolean')fail('Invalid motif.');
  return {id:member(item.id,selectedIcons),role:member(item.role,['primary','secondary','accent']),x:number(item.x,0,TILE_SIZE),y:number(item.y,0,TILE_SIZE),size:number(item.size,1,TILE_SIZE),angle:number(item.angle,-360,360),flipX:item.flipX,flipY:item.flipY};
 });
 if(selectedIcons.some(id=>!items.some(item=>item.id===id)))fail('Missing selected icon.');
 const patternData={selectedCity,selectedIcons,seed:number(p.seed,0,Number.MAX_SAFE_INTEGER),grammar:member(p.grammar,GRAMMARS),spacing:member(p.spacing,['loose','medium','tight']),tileSize:member(p.tileSize,[TILE_SIZE]),palette,items};
 if(p.quality){patternData.quality={valid:p.quality.valid===true,coverage:number(p.quality.coverage,0,100),problems:[]};}
 return {requestId:input.requestId,creatorName:text(input.creatorName,60),reflection:text(input.reflection,300),patternData};
}
