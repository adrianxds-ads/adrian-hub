/* QQ Finder · SW network-first, offline fallback. Version release 1.0.0. */
const CACHE='qq-finder-1.1.0';
const PAGE='./index.html';
self.addEventListener('install',evt=>{evt.waitUntil(caches.open(CACHE).then(c=>c.addAll([PAGE,'./manifest.webmanifest','./icon.svg','./styles.css','./app.js'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',evt=>{evt.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('qq-finder-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',evt=>{
 const req=evt.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  evt.respondWith(fetch(req,{cache:'no-store'}).then(resp=>{if(resp.ok){const clone=resp.clone();caches.open(CACHE).then(c=>c.put(PAGE,clone))}return resp}).catch(()=>caches.match(PAGE)));
 }else{
  evt.respondWith(fetch(req).then(resp=>{if(resp.ok){const clone=resp.clone();caches.open(CACHE).then(c=>c.put(req,clone))}return resp}).catch(()=>caches.match(req)));
 }
});
