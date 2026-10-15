/* Read committed Classroom progress for Hub rewards; never create or write a database. */
(()=>{
'use strict';
let running=false;
async function refresh(){
 if(running)return;running=true;
 try{
  if(!(await indexedDB.databases()).some(d=>d.name==='adrian-classroom-progress-v1'))return;
  const db=await new Promise((res,rej)=>{const q=indexedDB.open('adrian-classroom-progress-v1');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onupgradeneeded=()=>{q.transaction.abort();rej(Error('Classroom database disappeared'));};});
  let row;try{row=await new Promise((res,rej)=>{const tx=db.transaction('states','readonly'),q=tx.objectStore('states').get('classroom_b2_state_v3');q.onsuccess=()=>row=q.result;tx.oncomplete=()=>res(row);tx.onabort=()=>rej(tx.error);});}finally{db.close();}
  if(!row)return;
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(row.raw??'null'))),x=>x.toString(16).padStart(2,'0')).join('');
  if(row.sha256!==sha)throw Error('No se puede verificar el progreso actual de Classroom');
  const current=row.raw===null?{version:3,history:[]}:JSON.parse(row.raw);
  if(current.version!==3||!Array.isArray(current.history))throw Error('Estado de Classroom incompatible');
  window.ClassroomCurrentCourse=current;
  if(typeof renderHubStars==='function')renderHubStars();
 }catch(e){console.warn('Classroom: '+e.message);}finally{running=false;}
}
addEventListener('pageshow',refresh);addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
if('BroadcastChannel'in window){const channel=new BroadcastChannel('adrian-classroom-progress-v1');channel.onmessage=refresh;}
refresh();
})();