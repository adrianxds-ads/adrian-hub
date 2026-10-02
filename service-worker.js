const CACHE_PREFIX='adrian-hub-';
const CACHE='adrian-hub-v24-loadfix2';
const PAYLOADS='dc-inbox-payloads';
const SHELL=['./','./index.html','./chatgpt.html','./styles.css','./app.js','./apps.json','./manifest.webmanifest','./icon.svg','./apps/dc-inbox/','./apps/dc-inbox/index.html','./apps/dc-inbox/styles.css','./apps/dc-inbox/app.js','./apps/cambio/','./apps/cambio/index.html','./apps/cambio/styles.css','./apps/cambio/app.js','./apps/entrenamiento/','./apps/entrenamiento/index.html','./apps/entrenamiento/styles.css','./apps/entrenamiento/app.js','./apps/entrenamiento/data/latest.json'];
async function warmCache(){const c=await caches.open(CACHE);await Promise.all(SHELL.map(async url=>{try{const req=new Request(new URL(url,self.registration.scope),{cache:'reload'});const r=await fetch(req);if(r&&r.ok)await c.put(req,r.clone());}catch(_){}}));}
self.addEventListener('install',e=>e.waitUntil(warmCache().then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function acceptShare(req){
  const fd=await req.formData(),id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const files=fd.getAll('files').filter(v=>v instanceof File),cache=await caches.open(PAYLOADS),base=new URL('./__dc_share/',self.registration.scope);
  const meta={title:fd.get('title')||'',text:fd.get('text')||'',url:fd.get('url')||'',createdAt:new Date().toISOString(),files:[]};
  for(let i=0;i<files.length;i++){const x=files[i],key=new URL('file/'+id+'/'+i,base).href;await cache.put(key,new Response(x,{headers:{'Content-Type':x.type||'application/octet-stream'}}));meta.files.push({name:x.name,type:x.type,size:x.size,key});}
  await cache.put(new URL('meta/'+id,base).href,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json'}}));
  return Response.redirect(new URL('./apps/dc-inbox/?share='+encodeURIComponent(id),self.registration.scope).href,303);
}
async function fetchAndStore(req){try{const r=await fetch(req,{cache:'no-cache'});if(r&&r.ok){const c=await caches.open(CACHE);await c.put(req,r.clone());}return r;}catch(_){return null;}}
function criticalRequest(req,u){return req.mode==='navigate'||/\.(?:html|js|css|json|webmanifest)$/i.test(u.pathname);}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){e.respondWith(acceptShare(e.request));return;}
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const fresh=fetchAndStore(e.request);e.waitUntil(fresh.then(()=>{}));
  e.respondWith((async()=>{
    const c=await caches.open(CACHE),critical=criticalRequest(e.request,u);
    if(critical){const r=await fresh;if(r)return r;const hit=await c.match(e.request,{ignoreSearch:true});if(hit)return hit;}
    else{const hit=await c.match(e.request,{ignoreSearch:true});if(hit)return hit;const r=await fresh;if(r)return r;}
    if(e.request.mode==='navigate')return (await c.match('./index.html'))||(await c.match('./'))||Response.error();
    return Response.error();
  })());
});
