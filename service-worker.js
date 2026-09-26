const CACHE='adrian-hub-v9-dc-inbox-ticktick';
const PAYLOADS='dc-inbox-payloads';
const SHELL=['./','./index.html','./chatgpt.html','./styles.css','./app.js','./apps.json','./manifest.webmanifest','./icon.svg','./apps/dc-inbox/','./apps/dc-inbox/index.html','./apps/dc-inbox/styles.css','./apps/dc-inbox/app.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==PAYLOADS).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function acceptShare(req){
  const fd=await req.formData(),id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const files=fd.getAll('files').filter(v=>v instanceof File),cache=await caches.open(PAYLOADS),base=new URL('./__dc_share/',self.registration.scope);
  const meta={title:fd.get('title')||'',text:fd.get('text')||'',url:fd.get('url')||'',createdAt:new Date().toISOString(),files:[]};
  for(let i=0;i<files.length;i++){const x=files[i],key=new URL('file/'+id+'/'+i,base).href;await cache.put(key,new Response(x,{headers:{'Content-Type':x.type||'application/octet-stream'}}));meta.files.push({name:x.name,type:x.type,size:x.size,key});}
  await cache.put(new URL('meta/'+id,base).href,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json'}}));
  return Response.redirect(new URL('./apps/dc-inbox/?share='+encodeURIComponent(id),self.registration.scope).href,303);
}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){e.respondWith(acceptShare(e.request));return}if(e.request.method!=='GET'||u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));});