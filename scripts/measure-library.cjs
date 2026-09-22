// Raster measurement is used only to locate vector ink, never as website artwork.
const fs=require('node:fs'),sharp=require('sharp');
(async()=>{
 const sources=JSON.parse(fs.readFileSync('design-sources/library/glyphs.json'));
 for(const source of sources){
  const {data,info}=await sharp(Buffer.from(source.svg),{density:288}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width,top=info.height,right=0,bottom=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
  source.bounds=[left/4,top/4,(right-left)/4,(bottom-top)/4];
 }
 fs.writeFileSync('design-sources/library/ink-bounds.json',JSON.stringify(Object.fromEntries(sources.map(s=>[`${s.scene}:${s.id}`,s.bounds])),null,2)+'\n');
})();
