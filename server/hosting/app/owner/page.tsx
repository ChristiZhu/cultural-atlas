import {env} from 'cloudflare:workers';
import {requireChatGPTUser} from '../chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Owner(){
 const user=await requireChatGPTUser('/owner');
 if(user.email.toLowerCase()!==(env as any).COMMUNITY_OWNER_EMAIL?.toLowerCase())return <main>Owner access required.</main>;
 return <main style={{padding:40,maxWidth:720}}><h1>Cultural Atlas — Project collection</h1><p>Publish 18 original Atlas Studio compositions across five cities and cross-city combinations. These are project-created works, not visitor testimonials. Existing entries with the same publication keys will not be duplicated.</p><form method="post" action="/api/owner/collection"><button type="submit" style={{padding:16,border:'1px solid',marginTop:24}}>Publish project collection</button></form></main>;
}
