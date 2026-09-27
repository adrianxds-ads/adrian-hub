const STORE='dcInboxHistoryV1';
const BRIDGE='https://adrin.tail8fd071.ts.net/dc-inbox';
const $=s=>document.querySelector(s);
const els={badge:$('#sourceBadge'),status:$('#statusText'),title:$('#itemTitle'),text:$('#itemText'),files:$('#files'),route:$('#routeText'),result:$('#result'),history:$('#history')};
let current=null;
const clean=s=>(s||'').toString().trim();
const short=(s,n=220)=>s.length>n?s.slice(0,n-1)+'…':s;
const esc=s=>clean(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function taskRoute(x,hay){
  if(x.url||(x.files||[]).length) return '';
  const t=clean(x.title||x.text).toLocaleLowerCase('es');
  const verbs=/(^|\b)(comprar|llamar|mandar|enviar|hacer|pagar|pedir|recoger|reservar|revisar|buscar|firmar|llevar|traer|cancelar|renovar|solicitar|responder|escribir|preparar|devolver|ir|sacar|poner|mirar|comprobar|arreglar|limpiar|recordar)\b/;
  const cue=/\b(tengo que|hay que|debo|deber[ií]a|necesito|me toca|toca|recu[eé]rdame|acu[eé]rdame|recordarme|no olvidar|que no se me olvide)\b/;
  const timed=/^(hoy|ma[nñ]ana|pasado ma[nñ]ana|esta tarde|esta noche|el (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo))\b/;
  return (/^(comprar|llamar|mandar|enviar|hacer|pagar|pedir|recoger|reservar|revisar|buscar|firmar|llevar|traer|cancelar|renovar|solicitar|responder|escribir|preparar|devolver|ir|sacar|poner|mirar|comprobar|arreglar|limpiar|recordar)\b/.test(t)||cue.test(t)||(timed.test(t)&&verbs.test(t)))?'TickTick · Inbox':'';
}
function classify(x){
  const hay=[x.title,x.text,x.url,...(x.files||[]).map(f=>f.name)].join(' ').toLocaleLowerCase('es');
  const task=taskRoute(x,hay); if(task) return task;
  if(/indeed|linkedin|empleo|trabajo|oferta|vacante|candidatura|curr[ií]culum|cv\b/.test(hay)) return 'Empleo';
  if(/hoti0108|mf1074|uf008|turismo|actividad|instituci[oó] pau casals/.test(hay)) return 'HOTI0108';
  if(/generalitat|abogado|autofirma|ok mobility|notificaci[oó]n|recurso|tr[aá]mite/.test(hay)) return 'Documentos · gestiones';
  if(/limpieza|casa|habitaci[oó]n|cocina|ba[nñ]o|sal[oó]n/.test(hay)) return 'Limpieza 2.2';
  if(/english|ingl[eé]s|catal[aà]|italiano|phrasal|grammar|vocabulario/.test(hay)) return 'Idiomas';
  if((x.files||[]).some(f=>f.type==='application/pdf')) return 'Documentos';
  return 'Inbox general';
}
function makeItem(x={}){
  const text=clean(x.text), url=clean(x.url);
  return {id:x.id||Date.now().toString(36),source:x.source||'Compartido',title:clean(x.title)||url||text.split('\n')[0]||'Nueva captura',text,url,files:x.files||[],route:'',createdAt:x.createdAt||new Date().toISOString()};
}function renderItem(x){
  if(!x) return;
  x.route=classify(x); current=x;
  els.badge.textContent=x.source.toUpperCase();
  els.status.textContent='Listo para decidir';
  els.title.textContent=short(x.title,120);
  els.text.textContent=short([x.text,x.url].filter(Boolean).join('\n'),360)||'Sin texto adicional.';
  els.route.textContent=x.route;
  els.files.innerHTML=(x.files||[]).map(f=>`<div class="file">${esc(f.name||'Archivo')} · ${esc(f.type||'tipo desconocido')}</div>`).join('');
  els.result.textContent='';
}
function getHistory(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}}
function drawHistory(){
  const rows=getHistory();
  els.history.innerHTML=rows.length?rows.slice(0,12).map(x=>`<div class="hist"><b>${esc(short(x.title,80))}</b><small>${esc(x.route)} · ${esc(x.status)} · ${esc(new Date(x.savedAt).toLocaleString('es-ES'))}</small></div>`).join(''):'<div class="empty">Todavía no hay capturas guardadas.</div>';
}
function saveCurrent(status){
  if(!current) return;
  const rows=getHistory().filter(x=>x.id!==current.id);
  rows.unshift({...current,status,savedAt:new Date().toISOString()});
  localStorage.setItem(STORE,JSON.stringify(rows.slice(0,80)));
  drawHistory();
}
async function bridgeTask(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
    const res=await fetch(BRIDGE+'/task',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({source_id:current.id,title:current.title,source:current.source})});
    const data=await res.json();
    if(!res.ok&&!data.ok) throw new Error(data.error||'puente no disponible');
    if(!data.ok) throw new Error(data.error||'puente no disponible');
    if(data.queued){
      saveCurrent(data.duplicate?'TickTick · sigue en cola':'TickTick · en cola');
      els.result.textContent=data.duplicate?'⏳ Sigue en cola para TickTick.':'⏳ Guardado en cola. Se enviará automáticamente cuando el Pixel esté disponible.';
      return 'queued';
    }
    saveCurrent(data.duplicate?'TickTick · ya existía':'TickTick · creado');
    els.result.textContent=data.duplicate?'✓ Ya estaba enviado a TickTick.':'✓ Creado en TickTick.';
    return 'sent';
  }finally{clearTimeout(timer)}
}
function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onerror=()=>reject(r.error||new Error('No pude leer el archivo'));
    r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');
    r.readAsDataURL(blob);
  });
}
async function captureFiles(){
  const out=[]; let total=0;
  for(const f of (current.files||[])){
    if(!f.key) continue;
    const res=await caches.match(f.key);
    if(!res) continue;
    const blob=await res.blob();
    total+=blob.size;
    if(blob.size>15*1024*1024||total>25*1024*1024) throw new Error('Archivo demasiado grande para enviar al PC');
    out.push({name:f.name||'archivo',type:f.type||blob.type||'',size:blob.size,data_base64:await blobToBase64(blob)});
  }
  return out;
}
async function bridgeCapture(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
    const files=await captureFiles();
    const payload={source_id:current.id,source:current.source,title:current.title,text:current.text,url:current.url,route:current.route,files};
    const res=await fetch(BRIDGE+'/capture',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify(payload)});
    const data=await res.json();
    if(!res.ok||!data.ok) throw new Error(data.error||'puente no disponible');
    saveCurrent(data.duplicate?'PC · ya guardado':'PC · guardado');
    els.result.textContent=data.duplicate?'✓ Ya estaba guardado en el PC.':'✓ Guardado en el PC.';
    return 'saved';
  }finally{clearTimeout(timer)}
}
async function action(mode){
  if(!current){els.result.textContent='Primero comparte o pega algo.';return}
  if(mode==='auto'){
    if(current.route.startsWith('TickTick')){
      els.status.textContent='Enviando a TickTick…'; els.result.textContent='';
      try{const state=await bridgeTask();els.status.textContent=state==='queued'?'En cola':'Acción completada'}
      catch(e){saveCurrent('Pendiente de puente');els.status.textContent='Pendiente';els.result.textContent='No pude contactar con el puente DC. La captura queda guardada en este Inbox para reintentar.'}
      return;
    }
    els.status.textContent='Guardando en el PC…'; els.result.textContent='';
    try{await bridgeCapture();els.status.textContent='Acción completada'}
    catch(e){saveCurrent('Pendiente PC');els.status.textContent='Pendiente';els.result.textContent='No pude guardar en el PC todavía. La captura queda conservada en este Inbox.'}
    return;
  }
  if(mode==='pc'){
    els.status.textContent='Guardando en el PC…'; els.result.textContent='';
    try{await bridgeCapture();els.status.textContent='Acción completada'}
    catch(e){saveCurrent('Pendiente PC');els.status.textContent='Pendiente';els.result.textContent='No pude guardar en el PC todavía. La captura queda conservada en este Inbox.'}
    return;
  }
  if(mode==='later'){saveCurrent('Guardado');els.result.textContent='Guardado en DC Inbox.';}
}async function loadShared(){
  const id=new URLSearchParams(location.search).get('share');
  if(!id) return;
  try{
    const cache=await caches.open('dc-inbox-payloads');
    const key=new URL('../../__dc_share/meta/'+id,location.href).href;
    const res=await cache.match(key);
    if(!res) throw new Error('captura no encontrada');
    const meta=await res.json();
    renderItem(makeItem({...meta,id,source:'Compartido'}));
  }catch(e){
    els.status.textContent='No pude recuperar la captura';
    els.result.textContent='Abre DC Inbox y vuelve a compartir el contenido.';
  }
}
$('#autoBtn').addEventListener('click',()=>action('auto'));
$('#pcBtn').addEventListener('click',()=>action('pc'));
$('#laterBtn').addEventListener('click',()=>action('later'));
$('#manualBtn').addEventListener('click',()=>{
  const v=clean($('#manualInput').value);
  if(!v){els.result.textContent='Pega algo primero.';return}
  const url=/^https?:\/\//i.test(v)?v:'';
  renderItem(makeItem({text:url?'':v,url,source:'Manual'}));
});
$('#clearBtn').addEventListener('click',()=>{localStorage.removeItem(STORE);drawHistory()});
drawHistory();
loadShared();