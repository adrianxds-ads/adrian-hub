(() => {
'use strict';
async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function verify(entry,runtime){
 if(entry.kind==='private')return{text:'PRIVADA',kind:'private',ok:null};
 if(entry.kind==='extension'){
  const installed=document.documentElement.dataset.hubControlVersion;
  return !installed?{text:'EXTENSIÓN PC · SIN COMPROBAR',kind:'warn',ok:null}:{text:installed===entry.version?'EXTENSIÓN v'+installed:'EXTENSIÓN DESFASADA',kind:installed===entry.version?'ok':'bad',ok:installed===entry.version};
 }
 if(entry.id==='hub'&&(entry.version!==runtime.version||entry.build!==runtime.build))return{text:'CLIENTE DESFASADO',kind:'bad',ok:false};
 if(!entry.verify?.files?.length)return{text:'BUILD SIN PRUEBA',kind:'warn',ok:null};
 try{
  for(const f of entry.verify.files){
   const u=new URL(f.url,location.href);u.searchParams.set('hub_version_check',Date.now());
   const r=await fetch(u,{cache:'no-store'});if(!r.ok)return{text:'RECURSO AUSENTE',kind:'bad',ok:false};
   if(await sha256(await r.arrayBuffer())!==f.sha256)return{text:'BUILD DESFASADO',kind:'bad',ok:false};
  }
  return{text:entry.id==='hub'?'CLIENTE Y BUILD VERIFICADOS':'BUILD SERVIDO VERIFICADO',kind:'ok',ok:true};
 }catch{return{text:'SIN RED · SIN VERIFICAR',kind:'warn',ok:false};}
}
window.AdrianVersionVerifier=Object.freeze({verify,sha256});
})();
