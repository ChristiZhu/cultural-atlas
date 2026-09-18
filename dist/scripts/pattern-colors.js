/** Source-derived, repeatable palettes. Color seeds never enter the geometry generator. */
export const COLOR_MODES=['authentic','vivid','harmonious','surprise'];
export const COLOR_LABELS={authentic:'Authentic',vivid:'Vivid',harmonious:'Harmonious',surprise:'Surprise Me'};
export const COLOR_ROLES=['background','primary','secondary','accent','accent2','detail'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function random(seed){let v=seed>>>0;return()=>{v+=0x6D2B79F5;let t=v;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
export function contrast(a,b){const l=c=>{const v=rgb(c).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function toHSL(hex){const [r,g,b]=rgb(hex),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0;if(d)h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60;return [h,d?d/(1-Math.abs(2*l-1)):0,l];}
function hex(h,s,l){h=((h%360)+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;const v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+v.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();}
const distance=(a,b)=>Math.hypot(...rgb(a).map((v,i)=>(v-rgb(b)[i])*255));
const unique=colors=>colors.reduce((all,c)=>all.some(v=>distance(v,c)<28)?all:[...all,c],[]);
function readable(color,background){let [h,s,l]=toHSL(color);while(contrast(color,background)<3&&l>.1){l-=.02;color=hex(h,s,l);}return color;}
export const CURATED_PALETTES=[
 {name:'Porcelain Blue',colors:['#F3E9D2','#193C67','#245F95','#54829C','#98712E']},
 {name:'Lingnan Garden',colors:['#F3EBD8','#296B57','#65713F','#987C2C','#A45F7C']},
 {name:'Festival Red',colors:['#FAECD8','#A73430','#BC5143','#99752A','#533C35']},
 {name:'Jade & Gold',colors:['#F0EBD8','#245D50','#577D69','#94702B','#384944']},
 {name:'Night Market',colors:['#F4E0DF','#213B58','#23747A','#B44932','#967423']},
 {name:'Cobalt + Dusty Pink',colors:['#F3EBE1','#245F95','#A36385','#7F6893','#253C55','#99752D']},
];
function sourcesFor(icons){const seen=new Set();return icons.map(icon=>icon.naturalPalette).filter(p=>{const key=p.colors.join();if(seen.has(key))return false;seen.add(key);return true;});}
export function generatePalette({icons,colorMode='harmonious',seed=0}){
 if(!COLOR_MODES.includes(colorMode))throw new RangeError('Unknown color mode');
 if(!icons.length)throw new RangeError('Choose cultural sources first');
 const rng=random(seed),sources=sourcesFor(icons),sourcePool=unique(sources.flatMap(p=>p.colors));
 const sourceHue=toHSL(sourcePool[0])[0];let background,colors,name=COLOR_LABELS[colorMode];
 if(colorMode==='surprise'){
  // Seed chooses a starting family related to the first source, then cycles on shuffle.
  const family=CURATED_PALETTES[(Math.floor(sourceHue/60)+(seed>>>0))%CURATED_PALETTES.length];
  [background,...colors]=family.colors;name=family.name;
 }else{
  const base=sources[Math.floor(rng()*sources.length)].background,[bh,bs,bl]=toHSL(base);
  background=hex(bh,Math.min(bs,.42),clamp(bl+(rng()-.5)*.055,.89,.97));
  const anchors=[];
  for(const p of sources){const readableOptions=p.colors.filter(c=>contrast(c,background)>=3);const distinct=readableOptions.filter(c=>anchors.every(a=>distance(a,c)>=28));const options=distinct.length?distinct:readableOptions;anchors.push(options[Math.floor(rng()*options.length)]||p.colors[0]);}
  const pool=unique([...anchors,...sourcePool.filter(c=>contrast(c,background)>=3)]);
  // Choose distinct source representatives instead of concatenating every swatch.
  const chosen=unique(anchors);
  while(chosen.length<Math.min(4,pool.length)){
   const candidates=pool.filter(c=>!chosen.includes(c));
   candidates.sort((a,b)=>Math.min(...chosen.map(c=>distance(b,c)))-Math.min(...chosen.map(c=>distance(a,c))));
   chosen.push(candidates[0]);
  }
  if(colorMode==='authentic')colors=chosen.slice(0,4);
  else if(colorMode==='vivid'){
   const [h,s]=toHSL(anchors[0]);
   const enriched=sourcePool.map(c=>{const [ch,cs,cl]=toHSL(c);return hex(ch,clamp(cs+.2,.3,.75),clamp(cl,.28,.48));});
   colors=[...unique(anchors).slice(0,3),hex(h+150,clamp(s+.2,.48,.72),.4),hex(h-150,.52,.43),...enriched];
   colors=unique(colors).slice(0,5);
  }else{
   const [h,s]=toHSL(anchors[0]),sat=clamp(s,.3,.5),direction=rng()<.5?-1:1;
   colors=[anchors[0],hex(h+28*direction,sat,.4),hex(h-28*direction,sat*.85,.34),hex(h+165,.38,.43),hex(h,.23,.26)];
  }
 }
 colors=unique(colors.map(c=>readable(c,background)));
 // Near-duplicate reduction may remove a derived shade. Add a source-relative
 // darker tone only when needed to retain a useful, readable palette.
 const minimum=colorMode==='vivid'?4:3;
 for(let i=0;colors.length<minimum&&i<12;i++){
  const [h,s]=toHSL(colors[i%colors.length]);const c=readable(hex(h,s,.2+i*.025),background);
  if(colors.every(other=>distance(c,other)>=28))colors.push(c);
 }
 const [primary,secondary=primary,accent=secondary,accent2=primary,detail=secondary]=colors;
 return {mode:colorMode,seed:seed>>>0,name,background,primary,secondary,accent,accent2,detail};
}
export function paletteSwatches(palette){return [...new Set(COLOR_ROLES.map(role=>palette[role]))];}
export function palettesDiffer(a,b){
 const changes=COLOR_ROLES.slice(1).map(role=>distance(a[role],b[role]));
 return changes.filter(d=>d>=28).length>=2||Math.max(...changes)>=65;
}
/** Recoloring preserves the exact geometry object/array; it cannot regenerate it. */
export function recolorPattern(result,icons,colorMode,seed){return {...result,palette:generatePalette({icons,colorMode,seed})};}
