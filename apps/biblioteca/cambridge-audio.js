/* Cambridge B2 audiobook files stay local and private.
 * Only index/metadata may ship with the public Hub. IndexedDB retains
 * the exact user-selected Google AI Studio MP3s on each device.
 */
(()=>{
'use strict';
const STORAGE='adrianCambridgePrivateAudioV1';
let dbPromise=null;
const urls=new Map();
let catalog=null,refresh=null;
const $=id=>document.getElementById(id);
function setStatus(message){
 const x=$('cambridgeImportStatus');if(x)x.textContent=message;
}
function openDb(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(STORAGE,1);
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains('tracks'))request.result.createObjectStore('tracks',{keyPath:'number'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('No se ha podido abrir el almacenamiento local.'));
 });
 return dbPromise;
}
async function allSaved(){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('tracks','readonly');
  const q=tx.objectStore('tracks').getAll();
  q.onsuccess=()=>resolve(q.result||[]);
  q.onerror=()=>reject(q.error);
 });
}
async function store(number,hash,file){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('tracks','readwrite');
  tx.objectStore('tracks').put({number,hash,bytes:file.size,file});
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error('Fallo al guardar el MP3.'));
  tx.onabort=()=>reject(tx.error||new Error('El dispositivo no tiene espacio suficiente para el MP3.'));
 });
}
async function sha(file){
 const bytes=await file.arrayBuffer();
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function attach(row,blob){
 if(!row||!blob)return;
 if(urls.has(row.number))URL.revokeObjectURL(urls.get(row.number));
 const url=URL.createObjectURL(blob);
 urls.set(row.number,url);
 row.audio=url;
}
async function attachSaved(data){
 if(!window.PodcastLibraryConfig?.isEnglish)return;
 try{
  const saved=await allSaved();
  let ready=0;
  for(const s of saved){
   const row=data.episodes.find(x=>x.number===s.number&&x.audioSha256===s.hash&&x.audioBytes===s.bytes);
   if(row&&s.file){attach(row,s.file);ready++;}
  }
  setStatus(ready+' de '+data.episodes.length+' audiolibros disponibles en este dispositivo.');
 }catch(error){
  console.error('Private Cambridge audio storage:',error);
  setStatus('No se ha podido leer el almacenamiento local. Puedes volver a importar tus MP3.');
 }
}
async function importFiles(files){
 if(!catalog)return;
 const selected=[...files];
 if(!selected.length)return;
 const unique=new Set();
 let count=0,failed=0;
 for(let i=0;i<selected.length;i++){
  const file=selected[i];
  try{
   setStatus('Comprobando MP3 '+(i+1)+' de '+selected.length+'…');
   if(!file.name.toLowerCase().endsWith('.mp3')||file.size<10000)throw new Error('No es un MP3 válido.');
   const candidates=catalog.episodes.filter(e=>!unique.has(e.number)&&e.audioBytes===file.size);
   if(!candidates.length)throw new Error('No coincide con ningún examen terminado.');
   const hash=await sha(file);
   const row=candidates.find(e=>e.audioSha256===hash);
   if(!row)throw new Error('El contenido no coincide con los MP3 originales comprobados.');
   await store(row.number,hash,file);
   attach(row,file);
   unique.add(row.number);
   count++;
  }catch(error){
   failed++;
   console.warn('MP3 omitido:',file.name,error);
  }
 }
 refresh?.();
 const ready=catalog.episodes.filter(e=>!!e.audio).length;
 setStatus(ready+' de '+catalog.episodes.length+' disponibles. '+count+' incorporado(s) ahora.'+
  (failed?' '+failed+' archivo(s) no reconocido(s): deben ser nuestros MP3 originales.':''));
}
function catalogReady(data,onRefresh){
 if(!window.PodcastLibraryConfig?.isEnglish)return;
 catalog=data;refresh=onRefresh;
 const panel=$('cambridgeImport');
 if(panel)panel.hidden=false;
 const input=$('cambridgeFiles');
 if(input&&!input.dataset.bound){
  input.dataset.bound='true';
  input.addEventListener('change',()=>{importFiles(input.files).finally(()=>{input.value='';});});
 }
 setStatus(data.episodes.filter(e=>!!e.audio).length+' de '+data.episodes.length+' audiolibros disponibles en este dispositivo.');
}
window.CambridgeAudio={attachSaved,catalogReady,importFiles};
// Do not revoke on pagehide: Android/Chromium may keep this document in the
// back-forward cache. Revoking there makes the MP3 silently fail after return.
// The browser releases these object URLs when the document is actually destroyed;
// attach() still revokes superseded URLs when an MP3 is reimported.
})();
