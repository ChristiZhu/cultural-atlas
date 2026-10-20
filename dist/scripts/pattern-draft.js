import {GRAMMARS,TILE_SIZE} from './pattern-generator.js';
import {COLOR_ROLES} from './pattern-colors.js';

/** Validate numeric/vector metadata before restoring a tab-local draft. No markup is stored. */
export function readPatternDraft(storage,key,icons){
  try{
    const saved=JSON.parse(storage?.getItem('atlas-pattern-draft')||'null'),p=saved?.pattern;
    if(saved?.key!==key||!icons.length||!p||!GRAMMARS.includes(p.grammar)||p.tileSize!==TILE_SIZE||
      !Number.isSafeInteger(p.seed)||!Number.isSafeInteger(saved.colorSeed)||
      !['authentic','vivid','harmonious','surprise'].includes(saved.colorMode)||
      !['loose','medium','tight'].includes(p.spacing)||p.palette?.mode!==saved.colorMode||
      typeof p.palette.name!=='string'||p.palette.name.length>100||
      !COLOR_ROLES.every(role=>/^#[a-f\d]{6}$/i.test(p.palette[role]))||
      JSON.stringify(p.selectedIcons)!==JSON.stringify(icons.map(i=>i.id))||
      !Array.isArray(p.items)||!p.items.length||p.items.length>100)return null;
    if(!p.items.every(item=>icons.some(i=>i.id===item.id)&&['primary','secondary','accent'].includes(item.role)&&
      ['x','y','size','angle'].every(k=>typeof item[k]==='number'&&Number.isFinite(item[k]))&&
      item.x>=0&&item.x<=TILE_SIZE&&item.y>=0&&item.y<=TILE_SIZE&&item.size>0&&item.size<=TILE_SIZE&&
      Math.abs(item.angle)<=360&&typeof item.flipX==='boolean'&&typeof item.flipY==='boolean'))return null;
    return saved;
  }catch{return null;}
}
