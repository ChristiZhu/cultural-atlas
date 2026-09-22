import {renderPatternSVG} from './pattern-generator.js?v=20260922-library-final';

/** One composition definition is shared by Preview, Save and full-artwork export. */
export const ARTWORK=Object.freeze({width:1014,height:581,repeats:3});
export function renderArtwork(result,assets,prefix='atlas-artwork') {
  return renderPatternSVG(result,assets,{...ARTWORK,prefix});
}
export async function exportArtworkPNG(result,assets) {
  const svg=renderArtwork(result,assets,'atlas-full-export');
  const source=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try {
    const image=new Image();image.src=source;await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=3072;canvas.height=Math.round(canvas.width*ARTWORK.height/ARTWORK.width);
    const context=canvas.getContext('2d');if(!context)throw new Error('PNG export is unavailable.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG export failed.')),'image/png'));
    return {blob,width:canvas.width,height:canvas.height};
  } finally {URL.revokeObjectURL(source);}
}
