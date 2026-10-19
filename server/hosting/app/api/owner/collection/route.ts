import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {communityAPI} from '../../../../shared/server/hosted-api.mjs';
import assets from '../../../../shared/assets.json';
import collection from '../../../../shared/project-collection.json';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const user=await getChatGPTUser(),config=env as any;
 if(!user||user.email.toLowerCase()!==config.COMMUNITY_OWNER_EMAIL?.toLowerCase())return new Response('Owner access required.',{status:403});
 const origin=new URL(request.url).origin;
 if(request.headers.get('Origin')!==origin)return new Response('Origin not allowed.',{status:403});
 for(const submission of collection){
  const response=await communityAPI(new Request(origin+'/api/community/admin/seed',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.ADMIN_TOKEN},body:JSON.stringify(submission)}),env,assets);
  if(!response.ok)return new Response('Collection publication stopped. Retry safely. HTTP '+response.status,{status:500});
 }
 return new Response('Published 18 project compositions. Identical retries are not duplicated.',{headers:{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'no-store'}});
}
