'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const src=fs.readFileSync(path.join(__dirname,'version-verifier.js'),'utf8');
const bytes=Buffer.from('fixture build'),hash=crypto.createHash('sha256').update(bytes).digest('hex');
const ctx={window:{},crypto:crypto.webcrypto,Uint8Array,URL,Date,location:{href:'https://fixture.test/adrian-hub/'},document:{documentElement:{dataset:{}}},fetch:async()=>({ok:true,arrayBuffer:async()=>bytes})};vm.runInNewContext(src,ctx);
(async()=>{
 const verify=ctx.window.AdrianVersionVerifier.verify,base={id:'fixture',kind:'bundled',verify:{files:[{url:'app.js',sha256:hash}]}};
 assert.equal((await verify({id:'fixture',kind:'bundled'})).ok,null,'bundled not automatically verified');
 assert.equal((await verify(base)).ok,true);
 assert.equal((await verify({...base,verify:{files:[{url:'app.js',sha256:'bad'}]}})).ok,false,'stale bytes');
 assert.equal((await verify({...base,id:'hub',version:'2',build:'new'},{version:'1',build:'old'})).ok,false,'actual running Hub');
 assert.equal((await verify({kind:'extension',version:'0.4.3'})).ok,null,'missing extension');
 ctx.document.documentElement.dataset.hubControlVersion='0.4.2';assert.equal((await verify({kind:'extension',version:'0.4.3'})).ok,false);
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'versions.json'),'utf8')),registry=JSON.parse(fs.readFileSync(path.join(__dirname,'apps.json'),'utf8'));
 assert.equal(catalog.hub.version,registry.hubVersion);assert.equal(new Set(catalog.apps.map(x=>x.id)).size,catalog.apps.length);assert.deepEqual(registry.apps.map(x=>x.id).sort(),catalog.apps.map(x=>x.id).sort());
 for(const e of [catalog.hub,...catalog.apps])for(const f of e.verify?.files||[]){
  const p=f.url.startsWith('https:')?path.join(__dirname,'..',new URL(f.url).pathname):path.join(__dirname,f.url);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),f.sha256,'registry fingerprint '+f.url);
 }
 assert(!JSON.stringify(catalog).includes('s?mbolos'));
 console.log('PASS Version Center: real runtime, build fingerprints, bundle evidence, extension presence, registry coherence');
})().catch(e=>{console.error(e);process.exitCode=1;});
