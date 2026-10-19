/** Same-origin in local development; one public HTTPS base can point Pages at the API. */
const base=new URL(document.querySelector('meta[name="community-api"]').content,document.baseURI);
export const previewURL=id=>new URL(`patterns/${encodeURIComponent(id)}/preview.svg`,base).href;
export async function communityRequest(path,{body,signal}={}){
  const controller=new AbortController();
  const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
  const timeout=setTimeout(abort,20000);
  try{
    const response=await fetch(new URL(path,base),{method:body?'POST':'GET',cache:'no-store',credentials:'omit',signal:controller.signal,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    if(!response.ok){
      const message=({404:'This pattern is no longer available.',410:'This pattern is no longer available.',429:'Please try sharing again later.'})[response.status]||'The community could not be reached. Please try again.';
      throw Object.assign(new Error(message),{status:response.status});
    }
    return await response.json();
  }finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
}
