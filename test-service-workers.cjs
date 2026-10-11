'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const w=path.dirname(__dirname),names=['adrian-hub','adaptive-english','adaptive-exam','adaptive-hoti0108','adaptive-phrasal-verbs','adaptive-pizarras','adaptive-verbs-catala','b2-multiple-choice-cloze','adaptive-keyword-speaking'];
async function check(name,fail=false){
 const repo=path.join(w,name),scope='https://fixture.test/'+name+'/',handlers={},stores=new Map();let deleted=false;
 const context={URL,Request,Response,AbortController,Uint8Array,crypto:crypto.webcrypto,setTimeout,clearTimeout,location:{origin:'https://fixture.test'},self:{registration:{scope},location:{origin:'https://fixture.test'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>handlers[n]=f},
 caches:{open:async n=>{if(!stores.has(n))stores.set(n,new Map());const m=stores.get(n);return{put:async(r,v)=>m.set(new URL(r.url||r,scope).href,v),match:async r=>m.get(new URL(r.url||r,scope).href)?.clone()};},delete:async n=>{deleted=true;return stores.delete(n);},keys:async()=>[...stores.keys()]},
 fetch:async req=>{const u=new URL(req.url||req,scope);let p=path.join(w,decodeURIComponent(u.pathname));if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');let body=fs.readFileSync(p);if(/\.(?:js|cjs|html|css|json|webmanifest|svg|py|md|txt)$/i.test(p))body=Buffer.from(body.toString('utf8').replace(/\r\n/g,'\n'),'utf8');return new Response(fail&&u.pathname.endsWith('/app.js')?'wrong build':body,{status:200});}};
 vm.createContext(context);context.importScripts=(...files)=>files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(repo,f),'utf8'),context));const swSource=fs.readFileSync(path.join(repo,'service-worker.js'),'utf8'),deferred=swSource.includes('e.waitUntil(self.skipWaiting())');vm.runInContext(swSource,context);
 let job;handlers.install({waitUntil:p=>job=p});
 if(deferred){await job;assert.equal(stores.size,0,'deferred workers do not pre-cache on install');return;}
 if(fail){await assert.rejects(job,/fingerprint mismatch/);assert.equal(stores.size,0,'failed precache removed after all jobs settle');assert(deleted);}
 else{await job;assert.equal(stores.size,1);const c=await context.caches.open([...stores.keys()][0]);assert.equal(await context.releaseMatch(c,new Request(scope+'app.js?unknown-new-version')),undefined,'no query wildcard fallback');}
}
(async()=>{for(const n of names){await check(n);await check(n,true);const deferred=fs.readFileSync(path.join(w,n,'service-worker.js'),'utf8').includes('e.waitUntil(self.skipWaiting())');console.log((deferred?'PASS deferred install / on-demand cache: ':'PASS atomic install / corrupt build rejection: ')+n);}})().catch(e=>{console.error(e);process.exitCode=1;});
