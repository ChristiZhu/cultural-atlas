import {generatePalette,contrast} from './pattern-colors.js';
export {contrast} from './pattern-colors.js';
/** Deterministic, periodic geometry. No network, raster generation or AI is used. */
export const TILE_SIZE=1200;
export const GRAMMARS=['grid','half-drop','diamond','scatter','four-way','diagonal'];
const SPACING={loose:.48,medium:.62,tight:.76};
const round=n=>Math.round(n*1000)/1000;
const mod=(n,m)=>((n%m)+m)%m;
export function seededRandom(seed) {
  let value=seed>>>0;
  return ()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function pick(items,random){return items[Math.floor(random()*items.length)];}
function chooseGrammar(primary,random,previous) {
  const weights=GRAMMARS.filter(g=>g!==previous).flatMap(g=>Array(primary.preferredPatterns.includes(g)?6:1).fill(g));
  return pick(weights,random);
}
export function motifBounds(item,icon) {
  const [w,h]=icon.dimensions,max=Math.max(w,h),angle=item.angle*Math.PI/180;
  // Bounds include the original vector stroke and the normalized asset's clear margin.
  const width=item.size*(.92*w/max+.04),height=item.size*(.92*h/max+.04);
  return {width:Math.abs(Math.cos(angle))*width+Math.abs(Math.sin(angle))*height,height:Math.abs(Math.sin(angle))*width+Math.abs(Math.cos(angle))*height};
}
function compose(icons,grammar,spacing,random) {
  const items=[],cell=TILE_SIZE/2,base=cell*SPACING[spacing];
  const hierarchy=[1,.65,.42];
  function put(role,x,y,size,angle=0,flipX=false,flipY=false) {
    const icon=icons[role]||icons[0];
    items.push({id:icon.id,role:['primary','secondary','accent'][role],x:round(mod(x,TILE_SIZE)),y:round(mod(y,TILE_SIZE)),size:round(size),angle,flipX,flipY});
  }
  const simple=(x,y,row,col)=>{
    const angle=icons[0].directionality==='strong'?(row%2?180:0):[0,90,180,270][(row+col)%4];
    put(0,x,y,base,angle,col%2===1);
    put(1,x+cell/2,y+cell/2,base*hierarchy[1],angle===0?90:0);
    if(icons.length===3)put(2,x+cell/2,y,base*hierarchy[2],row%2?180:0);
  };
  if(grammar==='grid')for(let row=0;row<2;row++)for(let col=0;col<2;col++)simple(col*cell,row*cell,row,col);
  if(grammar==='half-drop')for(let row=0;row<4;row++)for(let col=0;col<2;col++){
    const x=col*cell+(row%2)*cell/2,y=row*cell/2;
    put(0,x,y,base*.69,icons[0].directionality==='strong'?0:row%2?180:0,col%2===1);
    put(1,x+cell/2,y,base*.69*hierarchy[1],0,row%2===1);
    if(icons.length===3)put(2,x+cell/4,y+cell/4,base*.69*hierarchy[2],90);
  }
  if(grammar==='diamond')for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const x=col*cell,y=row*cell;
    put(0,x,y,base*.9,icons[0].shapeType==='radial'?45:0,col%2===1);
    put(1,x+cell/2,y+cell/2,base*.9*hierarchy[1],45,row%2===1);
    if(icons.length===3){put(2,x+cell/2,y,base*.9*hierarchy[2]);put(2,x,y+cell/2,base*.9*hierarchy[2],90);}
  }
  if(grammar==='scatter') {
    const anchors=[[.12,.12],[.64,.24],[.34,.67],[.86,.79]];
    anchors.forEach(([x,y],i)=>put(0,x*TILE_SIZE,y*TILE_SIZE,base*.82,[0,90,180,270][i],i%2===1));
    [[.4,.07],[.9,.43],[.08,.52],[.59,.94]].forEach(([x,y],i)=>put(1,x*TILE_SIZE,y*TILE_SIZE,base*.82*hierarchy[1],i%2?45:0));
    if(icons.length===3)[[.43,.39],[.64,.63],[.12,.87],[.87,.04]].forEach(([x,y],i)=>put(2,x*TILE_SIZE,y*TILE_SIZE,base*.82*hierarchy[2],i%2?90:0));
  }
  if(grammar==='four-way')for(let row=0;row<2;row++)for(let col=0;col<2;col++) {
    const x=col*cell,y=row*cell,arm=cell*.255,size=base*.47;
    [[0,-arm,0],[arm,0,90],[0,arm,180],[-arm,0,270]].forEach(([dx,dy,angle])=>put(0,x+dx,y+dy,size,angle));
    put(1,x,y,size*hierarchy[1],icons[1]?.shapeType==='radial'?45:0);
    if(icons.length===3)put(2,x+cell/2,y+cell/2,size*hierarchy[2],45);
  }
  if(grammar==='diagonal')for(let row=0;row<4;row++)for(let col=0;col<2;col++){
    const x=col*cell+(row%2)*cell/2,y=row*cell/2;
    put(0,x,y,base*.68,45,row%2===1);
    put(1,x+cell/2,y,base*.68*hierarchy[1],45,row%2!==1);
    if(icons.length===3)put(2,x+cell/4,y+cell/4,base*.68*hierarchy[2],0);
  }
  // Controlled quarter-turn/reflect variations preserve the periodic domain.
  const quarter=pick([0,1,2,3],random),mirror=random()<.5,verticalMirror=random()<.25;
  return items.map(item=>{
    let {x,y}=item;for(let n=0;n<quarter;n++)[x,y]=[TILE_SIZE-y,x];
    return {...item,x:round(mod(mirror?TILE_SIZE-x:x,TILE_SIZE)),y:round(mod(verticalMirror?TILE_SIZE-y:y,TILE_SIZE)),angle:mod((verticalMirror?-1:1)*((mirror?-item.angle:item.angle)+quarter*90),360),flipX:mirror?!item.flipX:item.flipX,flipY:verticalMirror?!item.flipY:item.flipY};
  });
}
export function validateComposition(result,icons) {
  const byId=new Map(icons.map(icon=>[icon.id,icon])),problems=[];
  const bounds=result.items.map(item=>motifBounds(item,byId.get(item.id)));
  const coverage=bounds.reduce((sum,b)=>sum+b.width*b.height,0)/(TILE_SIZE*TILE_SIZE);
  if(coverage<.1||coverage>.72)problems.push('density');
  for(let i=0;i<result.items.length;i++)for(let j=i+1;j<result.items.length;j++){
    const a=result.items[i],b=result.items[j];
    const dx=Math.min(Math.abs(a.x-b.x),TILE_SIZE-Math.abs(a.x-b.x)),dy=Math.min(Math.abs(a.y-b.y),TILE_SIZE-Math.abs(a.y-b.y));
    const overlapX=Math.max(0,(bounds[i].width+bounds[j].width)/2-dx),overlapY=Math.max(0,(bounds[i].height+bounds[j].height)/2-dy);
    if(overlapX*overlapY>Math.min(bounds[i].width*bounds[i].height,bounds[j].width*bounds[j].height)*.1)problems.push('overlap');
  }
  for(const role of ['primary','secondary','accent'])if(contrast(result.palette[role],result.palette.background)<3)problems.push('contrast');
  for(const icon of icons)if(!result.items.some(item=>item.id===icon.id))problems.push('missing-icon');
  if(result.items.some(item=>!Number.isFinite(item.x+item.y+item.size)||item.size<=0||item.x<0||item.x>=TILE_SIZE||item.y<0||item.y>=TILE_SIZE))problems.push('geometry');
  const roleSizes=['primary','secondary','accent'].map(role=>{const values=result.items.filter(item=>item.role===role).map(item=>item.size);return values.length?values.reduce((a,b)=>a+b)/values.length:0;});
  if(roleSizes[1]>=roleSizes[0]||roleSizes[2]>=roleSizes[1])problems.push('hierarchy');
  return {valid:problems.length===0,problems:[...new Set(problems)],coverage:round(coverage)};
}
export function generatePattern(icons,{seed=Date.now(),previousGrammar=null,grammar=null,first=false,colorMode='harmonious',colorSeed=seed}={}) {
  if(icons.length<1||icons.length>3)throw new RangeError('Choose one to three icons.');
  if(new Set(icons.map(icon=>icon.id)).size!==icons.length)throw new RangeError('Choose distinct icons.');
  if(grammar&&!GRAMMARS.includes(grammar))throw new RangeError('Unknown pattern grammar.');
  const random=seededRandom(seed),palette=generatePalette({icons,colorMode,seed:colorSeed}),chosen=grammar||chooseGrammar(icons[0],random,previousGrammar);
  // Try discrete spacing levels before changing a grammar. No arbitrary jitter.
  const spaces=[pick(['loose','medium','medium','tight'],random),'medium','loose','tight'];
  for(const candidate of [chosen,...(grammar?[]:GRAMMARS.filter(g=>g!==chosen&&g!==previousGrammar))])for(const spacing of [...new Set(spaces)]) {
    const result={seed,grammar:candidate,spacing,palette,selectedIcons:icons.map(icon=>icon.id),tileSize:TILE_SIZE,items:compose(icons,candidate,spacing,random)};
    result.quality=validateComposition(result,icons);if(result.quality.valid)return result;
  }
  throw new Error('This composition needs another variation. Please try again.');
}
/** Explicit toroidal copies make every edge-crossing motif continue on the opposite edge. */
export function wrappedItems(result) {
  return result.items.flatMap(item=>[-TILE_SIZE,0,TILE_SIZE].flatMap(dx=>[-TILE_SIZE,0,TILE_SIZE].map(dy=>({...item,x:item.x+dx,y:item.y+dy}))));
}
export function itemColorRole(item,index){
  const roles=item.role==='primary'?['primary','primary','accent','accent2']:item.role==='secondary'?['secondary','detail']:['accent'];
  return roles[index%roles.length];
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function renderPatternSVG(result,assets,{width=TILE_SIZE,height=TILE_SIZE,prefix='atlas-pattern',repeats=1}={}) {
  const defs=result.selectedIcons.map(id=>`<symbol id="${prefix}-${escape(id)}" viewBox="0 0 100 100" fill="none">${assets[id].replace(/(fill|stroke)="(?:white|#fff(?:fff)?)"/gi,(_,attr)=>`${attr}="${result.palette.background}" data-color-role="background" data-color-attribute="${attr}"`)}</symbol>`).join('');
  const roleCounters={};
  const colored={...result,items:result.items.map(item=>({...item,colorRole:itemColorRole(item,roleCounters[item.role]=(roleCounters[item.role]??-1)+1)}))};
  const placements=wrappedItems(colored).map(item=>`<use href="#${prefix}-${escape(item.id)}" x="${-item.size/2}" y="${-item.size/2}" width="${item.size}" height="${item.size}" data-color-role="${item.colorRole}" data-color-attribute="color" color="${result.palette[item.colorRole]}" transform="translate(${item.x} ${item.y}) rotate(${item.angle}) scale(${item.flipX?-1:1} ${item.flipY?-1:1})"/>`).join('');
  const viewWidth=TILE_SIZE*repeats,viewHeight=viewWidth*height/width;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-label="${escape(result.grammar)} pattern"><title>Cultural Atlas — ${escape(result.grammar)}</title><metadata>${escape(JSON.stringify({selectedIcons:result.selectedIcons,grammar:result.grammar,seed:result.seed,colorMode:result.palette.mode,palette:result.palette,tileSize:TILE_SIZE}))}</metadata><defs>${defs}<pattern id="${prefix}-repeat" width="${TILE_SIZE}" height="${TILE_SIZE}" patternUnits="userSpaceOnUse"><rect width="${TILE_SIZE}" height="${TILE_SIZE}" fill="${result.palette.background}" data-color-role="background" data-color-attribute="fill"/>${placements}</pattern></defs><rect width="${viewWidth}" height="${viewHeight}" fill="url(#${prefix}-repeat)"/></svg>`;
}
