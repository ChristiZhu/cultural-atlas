import http from 'node:http';
import {resolve,dirname,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {statSync,createReadStream} from 'node:fs';
import {cities} from '../dist/scripts/library-state.js';
import {openPatternStore,publicEntry} from './pattern-store.mjs';
import {uuid,validateSubmission} from './pattern-schema.mjs';
import {localizedReflection} from './reflection-translation.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const error=(status,message)=>Object.assign(new Error(message),{status});
export function createCommunityServer({database=process.env.COMMUNITY_DB||resolve(root,'../work/community/community.sqlite'),allowedOrigins=(process.env.COMMUNITY_ORIGINS||'').split(',').filter(Boolean)}={}){
  const store=openPatternStore(database,root);
  const server=http.createServer(async(req,res)=>{
    // Local previews must not keep a stale entry module after an implementation update.
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    try{
      const url=new URL(req.url,'http://localhost');
      const pathname=url.pathname.replace(/^\/cultural-atlas(?=\/)/,'');
      if(!pathname.startsWith('/api/community/')){
        if(!['GET','HEAD'].includes(req.method))throw error(405,'Method not allowed.');
        const path=decodeURIComponent(pathname),file=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
        if(!file.startsWith(root+sep))throw error(404,'Not found.');
        let stat;try{stat=statSync(file);}catch{throw error(404,'Not found.');}
        if(!stat.isFile())throw error(404,'Not found.');
        const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.png':'image/png'};
        res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':stat.size});
        if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
        return;
      }
      const origin=req.headers.origin;
      const own=origin===`http://${req.headers.host}`||origin===`https://${req.headers.host}`;
      if(origin&&!own&&!allowedOrigins.includes(origin))throw error(403,'Origin not allowed.');
      if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
      if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});res.end();return;}
      const route=pathname.slice('/api/community/'.length);
      if(route==='patterns'&&req.method==='GET'){
        const city=url.searchParams.get('city')||'*',before=url.searchParams.get('before');
        if(city!=='*'&&!cities.some(c=>c.id===city))throw error(400,'Invalid city.');
        if(before&&!uuid.test(before))throw error(400,'Invalid cursor.');
        const rows=store.list(city,before);
        return json(200,{items:rows.slice(0,12).map(row=>publicEntry(row)),nextCursor:rows.length>12?rows[11].id:null});
      }
      const match=route.match(/^patterns\/([a-f\d-]+)(\/preview\.svg)?$/i);
      if(match&&uuid.test(match[1])&&req.method==='GET'){
        const row=store.find(match[1]);if(!row)throw error(404,'Pattern not found.');
        if(!match[2]){
          const lang=url.searchParams.get('lang');if(lang&&!['en','zh'].includes(lang))throw error(400,'Invalid language.');
          const localized=lang?await localizedReflection(row,lang,store.translations):{};
          if(!store.find(row.id))throw error(404,'Pattern not found.');
          return json(200,{...publicEntry(row,true),...localized});
        }
        res.writeHead(200,{'Content-Type':'image/svg+xml','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"});res.end(row.preview);return;
      }
      if(route==='patterns'&&req.method==='POST'){
        if(!origin)throw error(403,'A browser origin is required.');
        if(req.headers['content-type']?.split(';')[0]!=='application/json')throw error(415,'JSON required.');
        const chunks=[];let length=0;
        for await(const chunk of req){length+=chunk.length;if(length>150000){json(413,{error:'Submission too large.'});return;}chunks.push(chunk);}
        let input;try{input=JSON.parse(Buffer.concat(chunks));}catch{throw error(400,'Invalid JSON.');}
        const result=store.publish(validateSubmission(input),req.socket.remoteAddress||'unknown');
        return json(result.created?201:200,publicEntry(result.entry,true));
      }
      throw error(404,'Not found.');
    }catch(cause){
      if(!cause.status)console.error('Community request failed:',cause.message);
      if(!res.headersSent)json(cause.status||500,{error:cause.status?cause.message:'Unable to complete the request. Please try again.'});else res.end();
    }
  });
  server.requestTimeout=30000;server.headersTimeout=15000;
  server.on('close',()=>store.close());return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=createCommunityServer(),port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
  server.listen(port,host,()=>console.log(`Cultural Atlas preview: http://${host}:${port}/cultural-atlas/`));
}
