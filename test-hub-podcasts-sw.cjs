'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=__dirname;
const root=path.dirname(repo);
const cacheFiles=new Map();
async function fixtureBytes(href){
 const u=new URL(href);
 let pathname=decodeURIComponent(u.pathname);
 if(pathname.startsWith('/adrian-core/')){
  if(!cacheFiles.has(pathname)){
   cacheFiles.set(pathname,(async()=>{
    const r=await fetch('https://adrianxds-ads.github.io'+pathname,{signal:AbortSignal.timeout(25000)});
    assert.equal(r.status,200,'Official public Core asset unavailable '+pathname);
    return Buffer.from(await r.arrayBuffer());
   })());
  }
  return Buffer.from(await cacheFiles.get(pathname));
 }
 if(!pathname.startsWith('/adrian-hub/'))throw Error('Unexpected path '+pathname);
 let local=path.join(repo,pathname.slice('/adrian-hub/'.length));
 if(!fs.existsSync(local))throw Error('Core cache path absent '+pathname);
 if(fs.statSync(local).isDirectory())local=path.join(local,'index.html');
 let bytes=fs.readFileSync(local);
 if(/\.(?:js|cjs|html|css|json|webmanifest|svg|py|md|txt)$/i.test(local))bytes=Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'),'utf8');
 return bytes;
}
async function run(bad){
 const scope='https://fixture.test/adrian-hub/';
 const handlers={},stores=new Map();
 let removed=0,installP;
 const context={URL,Request,Response,AbortController,Uint8Array,
  crypto:crypto.webcrypto,setTimeout,clearTimeout,location:{origin:'https://fixture.test'},
  self:{registration:{scope},location:{origin:'https://fixture.test'},
        clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>handlers[n]=f},
  caches:{
   open:async key=>{
    if(!stores.has(key))stores.set(key,new Map());
    let map=stores.get(key);
    return {put:async(req,v)=>map.set(new URL(req.url||req,scope).href,v),
            match:async req=>map.get(new URL(req.url||req,scope).href)?.clone()};
   },
   delete:async key=>{removed++;return stores.delete(key)},
   keys:async()=>[...stores.keys()]
  },
  fetch:async request=>{
   let href=request.url||request;
   let bytes=await fixtureBytes(href);
   if(bad&&new URL(href,scope).pathname==='/adrian-hub/app.js')bytes=Buffer.from('corrupted-script');
   return new Response(bytes,{status:200});
  }
 };
 vm.createContext(context);
 context.importScripts=(...refs)=>refs.forEach(file=>vm.runInContext(fs.readFileSync(path.join(repo,file),'utf-8'),context));
 vm.runInContext(fs.readFileSync(path.join(repo,'service-worker.js'),'utf-8'),context);
 assert.equal(typeof handlers.install,'function','Service worker has install handler');
 handlers.install({waitUntil:p=>installP=p});
 if(bad){
  await assert.rejects(installP,/fingerprint mismatch/i,'corruption must fail installation');
  assert.equal(stores.size,0,'incomplete cache cleared');
  assert(removed>0,'failed cache deleted');
 }else{
  await installP;
  assert.equal(stores.size,1,'one complete cache after atomic installation');
  let c=await context.caches.open([...stores.keys()][0]);
  let req=new Request(scope+'apps/biblioteca/cambridge-exams.json');
  assert((await c.match(req))?.ok,'Cambridge catalog is cached');
  assert((await c.match(new Request(scope+'apps/biblioteca/cambridge-audio.js')))?.ok,'Cambridge importer cached');
  assert((await c.match(new Request(scope+'apps/biblioteca/config.js')))?.ok,'Language config cached');
 }
}
(async()=>{
 await run(false);console.log('PASS Hub install atomic; Cambridge catalog/config/importer cached; Core hash valid');
 await run(true);console.log('PASS Corrupt app.js rejected and cache rolled back');
 console.log('HUB_CAMBRIDGE_SERVICE_WORKER_ACCEPTANCE_PASSED');
})().catch(e=>{console.error(e);process.exitCode=1;});
