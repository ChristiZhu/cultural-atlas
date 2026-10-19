import {projectTranslations} from './project-translations.mjs';
const inFlight=new Map();
export const reflectionLanguage=text=>/\p{Script=Han}/u.test(text)?'zh':'en';
export function translationChunks(text){
 const chunks=[];let chunk='';
 // The provider accepts at most 500 UTF-8 bytes per segment, not 500 characters.
 for(const part of text.match(/[^。！？.!?\n]+[。！？.!?\n]*|[。！？.!?\n]+/gu)||[]){
  if(new TextEncoder().encode(chunk+part).length<=450){chunk+=part;continue;}
  if(chunk){chunks.push(chunk);chunk='';}
  for(const char of part){if(new TextEncoder().encode(chunk+char).length>450){chunks.push(chunk);chunk='';}chunk+=char;}
 }
 if(chunk)chunks.push(chunk);return chunks;
}
function decode(text){return text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi,(_,v)=>{
 if(v[0]==='#'){const n=v[1].toLowerCase()==='x'?parseInt(v.slice(2),16):Number(v.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
 return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[v.toLowerCase()];
});}
export async function machineTranslate(text,source,target,request=fetch){
 const signal=AbortSignal.timeout(12000);
 const parts=await Promise.all(translationChunks(text).map(async chunk=>{
  const url=new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q',chunk);url.searchParams.set('langpair',`${source==='zh'?'zh-CN':'en'}|${target==='zh'?'zh-CN':'en'}`);
  const response=await request(url,{signal});if(!response.ok)throw new Error('Translation unavailable.');
  const data=await response.json(),value=data.responseData?.translatedText;
  if(Number(data.responseStatus)!==200||data.quotaFinished||typeof value!=='string'||!value.trim()||value.length>2000)throw new Error('Translation unavailable.');
  return decode(value).trim();
 }));return parts.join(target==='zh'?'':' ');
}
/** Original content remains immutable. Store only a separate derived display translation. */
export async function localizedReflection(row,target,{read,write,request=fetch}){
 const original=row.reflection,source=reflectionLanguage(original);
 const result=(text,status)=>({reflection:text,reflectionOriginal:original,sourceLanguage:source,reflectionLanguage:status==='translated'?target:source,translationStatus:status});
 if(!original||source===target)return result(original,'original');
 const curated=projectTranslations[original]?.[target];if(curated)return result(curated,'translated');
 const cached=await read(row.id,target);
 if(cached?.text)return result(cached.text,'translated');
 if(cached&&Date.now()-cached.updated_at<1800000)return result(original,'unavailable');
 const key=row.id+':'+target;
 if(!inFlight.has(key))inFlight.set(key,(async()=>{
  try{const translated=await machineTranslate(original,source,target,request);await write(row.id,target,translated,Date.now());return result(translated,'translated');}
  catch{await write(row.id,target,'',Date.now());return result(original,'unavailable');}
 })().finally(()=>inFlight.delete(key)));
 return inFlight.get(key);
}
