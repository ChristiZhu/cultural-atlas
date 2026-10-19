/** Public community API for the hosted D1 database; local Node preview stays independent. */
import {cities} from '../dist/scripts/library-state.js';
import {renderArtwork} from '../dist/scripts/pattern-export.js';
import {uuid,validateSubmission} from './pattern-schema.mjs';
import {localizedReflection} from './reflection-translation.mjs';
const failure=(status,message)=>Object.assign(new Error(message),{status});
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
const publicEntry=(row,detail=false)=>{const p=JSON.parse(row.data);return {id:row.id,creatorName:row.creator_name,reflection:row.reflection,citySelection:row.city,iconsUsed:p.selectedIcons,createdAt:row.created_at,visibility:'public',previewImage:`patterns/${row.id}/preview.svg`,...(detail?{patternData:p}:{})};};
async function readJSON(request){
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw failure(415,'JSON required.');
 const reader=request.body?.getReader();if(!reader)throw failure(400,'Missing submission.');
 const chunks=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>150000){await reader.cancel();throw failure(413,'Submission too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw failure(400,'Invalid JSON.');}
}
export async function communityAPI(request,env,assets){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 const allowed=['https://christizhu.github.io',url.origin,...(env.COMMUNITY_ORIGINS||'').split(',').filter(Boolean)];
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'});
 const json=(status,data)=>Response.json(data,{status,headers});
 try{
  if(origin&&!allowed.includes(origin))throw failure(403,'Origin not allowed.');
  if(origin)headers.set('Access-Control-Allow-Origin',origin);
  if(request.method==='OPTIONS'){headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');return new Response(null,{status:204,headers});}
  const route=url.pathname.replace(/^\/api\/community\//,'');
  if(route==='health'&&request.method==='GET'){await env.DB.prepare('SELECT id FROM patterns LIMIT 1').first();return json(200,{ok:true});}
  const find=id=>env.DB.prepare("SELECT * FROM patterns WHERE id=? AND visibility='public'").bind(id).first();
  const admin=route.startsWith('admin/');
  if(admin){
   const supplied=request.headers.get('Authorization')||'';
   if(!env.ADMIN_TOKEN||await digest(supplied)!==await digest('Bearer '+env.ADMIN_TOKEN))throw failure(403,'Not allowed.');
   if(route==='admin/patterns'&&request.method==='GET')return json(200,{items:(await env.DB.prepare('SELECT id,creator_name,city,visibility,source,created_at FROM patterns ORDER BY rowid DESC LIMIT 100').all()).results});
   const removal=route.match(/^admin\/patterns\/([a-f\d-]+)$/i);
   if(removal&&uuid.test(removal[1])&&request.method==='DELETE'){
    await env.DB.prepare('DELETE FROM translations WHERE pattern_id=?').bind(removal[1]).run();
    await env.DB.prepare("UPDATE patterns SET visibility='removed',creator_name='',reflection='',data='{}',preview='' WHERE id=?").bind(removal[1]).run();return json(200,{removed:true});
   }
  }
  if(route==='patterns'&&request.method==='GET'){
   const city=url.searchParams.get('city')||'*',before=url.searchParams.get('before');
   if(city!=='*'&&!cities.some(c=>c.id===city))throw failure(400,'Invalid city.');
   if(before&&!uuid.test(before))throw failure(400,'Invalid cursor.');
   const anchor=before?await env.DB.prepare('SELECT rowid AS cursor FROM patterns WHERE id=?').bind(before).first():null;
   if(before&&!anchor)throw failure(400,'This gallery page is no longer available.');
   // Separate indexed queries keep gallery reads bounded as the collection grows.
   const cityClause=city==='*'?'':' AND city=?',cursorClause=before?' AND rowid < ?':'';
   const values=[...(city==='*'?[]:[city]),...(before?[anchor.cursor]:[])];
   const rows=(await env.DB.prepare("SELECT * FROM patterns WHERE visibility='public'"+cityClause+cursorClause+' ORDER BY rowid DESC LIMIT 13').bind(...values).all()).results;
   return json(200,{items:rows.slice(0,12).map(row=>publicEntry(row)),nextCursor:rows.length>12?rows[11].id:null});
  }
  const match=route.match(/^patterns\/([a-f\d-]+)(\/preview\.svg)?$/i);
  if(match&&uuid.test(match[1])&&request.method==='GET'){
   const row=await find(match[1]);if(!row)throw failure(404,'Pattern not found.');
   if(!match[2]){
    const lang=url.searchParams.get('lang');if(lang&&!['en','zh'].includes(lang))throw failure(400,'Invalid language.');
    const localized=lang?await localizedReflection(row,lang,{
     read:(id,language)=>env.DB.prepare('SELECT text,updated_at FROM translations WHERE pattern_id=? AND language=?').bind(id,language).first(),
     write:(id,language,text,now)=>env.DB.prepare("INSERT INTO translations(pattern_id,language,text,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM patterns WHERE id=? AND visibility='public') ON CONFLICT(pattern_id,language) DO UPDATE SET text=excluded.text,updated_at=excluded.updated_at").bind(id,language,text,now,id).run(),
    }):{};
    if(!await find(row.id))throw failure(404,'Pattern not found.');
    return json(200,{...publicEntry(row,true),...localized});
   }
   headers.set('Content-Type','image/svg+xml');headers.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; sandbox");return new Response(row.preview,{headers});
  }
  if((route==='patterns'||route==='admin/seed')&&request.method==='POST'){
   if(!admin&&!origin)throw failure(403,'A browser origin is required.');
   const clean=validateSubmission(await readJSON(request)),hash=await digest(JSON.stringify(clean));
   const previous=()=>env.DB.prepare('SELECT * FROM patterns WHERE request_id=?').bind(clean.requestId).first();
   const check=row=>{if(row.visibility!=='public')throw failure(410,'This publication is no longer available.');if(row.digest!==hash)throw failure(409,'This request has already been published.');return json(200,publicEntry(row,true));};
   const prior=await previous();if(prior)return check(prior);
   if(!admin){
    const now=Date.now(),client=await digest(request.headers.get('CF-Connecting-IP')||'shared');
    // One atomic statement prevents concurrent requests bypassing the hourly quota.
    const limit=await env.DB.prepare('INSERT INTO limits(client,start,count) VALUES(?,?,1) ON CONFLICT(client) DO UPDATE SET start=CASE WHEN start<? THEN excluded.start ELSE start END,count=CASE WHEN start<? THEN 1 ELSE count+1 END WHERE start<? OR count<20 RETURNING count').bind(client,now,now-3600000,now-3600000,now-3600000).first();
    if(!limit)throw failure(429,'Please try sharing again later.');
    await env.DB.prepare('DELETE FROM limits WHERE start<?').bind(now-7200000).run();
   }
   const id=crypto.randomUUID(),createdAt=new Date().toISOString(),preview=renderArtwork(clean.patternData,assets,'community-artwork');
   try{await env.DB.prepare('INSERT INTO patterns(id,request_id,digest,creator_name,reflection,city,data,preview,created_at,visibility,source) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,clean.requestId,hash,clean.creatorName,clean.reflection,clean.patternData.selectedCity,JSON.stringify(clean.patternData),preview,createdAt,'public',admin?'project-curated':'visitor').run();}
   catch(error){const duplicate=await previous();if(duplicate)return check(duplicate);throw error;}
   return json(201,publicEntry(await find(id),true));
  }
  throw failure(404,'Not found.');
 }catch(error){if(!error.status)console.error('Community API:',error.message);return json(error.status||500,{error:error.status?error.message:'Unable to complete the request. Please try again.'});}
}
