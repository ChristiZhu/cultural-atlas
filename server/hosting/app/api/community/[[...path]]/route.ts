import {env} from 'cloudflare:workers';
import {communityAPI} from '../../../../shared/server/hosted-api.mjs';
import assets from '../../../../shared/assets.json';
export const dynamic='force-dynamic';
const handle=(request:Request)=>communityAPI(request,env,assets);
export {handle as GET,handle as POST,handle as OPTIONS,handle as DELETE};
