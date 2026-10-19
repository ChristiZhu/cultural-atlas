/** Owner utility. Credentials arrive through hidden stdin, never argv or a file. */
import {projectSubmissions} from './project-collection.mjs';
const api='https://cultural-atlas-community.alan-zhu015.chatgpt.site/api/community/';
const action=process.argv[2]||'check';
if(!['check','seed'].includes(action))throw new Error('Use check or seed.');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('Ready for owner credentials on stdin (input is hidden).');
const credentials=await new Promise((resolve,reject)=>{
 let value='';process.stdin.setEncoding('utf8');process.stdin.resume();
 process.stdin.on('data',chunk=>{
  value+=chunk;
  if(value.includes('\u0003')){process.exit(130);}
  if(value.includes('\n')||value.includes('\r')){
   process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);
   try{resolve(JSON.parse(value.trim()));}catch{reject(new Error('Invalid credential input.'));}
  }
 });
});
const headers={'Content-Type':'application/json',...(credentials.serviceToken?{'OAI-Sites-Authorization':'Bearer '+credentials.serviceToken}:{})};
const health=await fetch(api+'health',{headers});
if(!health.ok)throw new Error('Service check failed: HTTP '+health.status);
console.log('Service health: '+JSON.stringify(await health.json()));
if(action==='seed'){
 if(!credentials.adminToken)throw new Error('Owner authorization required.');
 for(const input of projectSubmissions()){
  const response=await fetch(api+'admin/seed',{method:'POST',headers:{...headers,Authorization:'Bearer '+credentials.adminToken},body:JSON.stringify(input)});
  if(!response.ok)throw new Error('Publication failed: HTTP '+response.status+' '+(await response.text()).slice(0,200));
  const entry=await response.json();console.log(JSON.stringify({id:entry.id,creatorName:entry.creatorName,city:entry.citySelection,status:response.status}));
 }
}
