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
  const verbs=/^(comprar|llamar|mandar|enviar|hacer|pagar|pedir|recoger|reservar|revisar|buscar|firmar|llevar|traer|cancelar|renovar|solicitar|responder|escribir|preparar|devolver|ir|sacar|poner|mirar|comprobar|arreglar|limpiar|pedir|recordar)\b/;
  return verbs.test(t)?'TickTick · Inbox':'';
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
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try{
    const res=await fetch(BRIDGE+'/task',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({source_id:current.id,title:current.title,source:current.source})});
    const data=await res.json();
    if(!res.ok||!data.ok) throw new Error(data.error||'puente no disponible');
    saveCurrent(data.duplicate?'TickTick · ya existía':'TickTick · creado');
    els.result.textContent=data.duplicate?'✓ Ya estaba enviado a TickTick.':'✓ Creado en TickTick.';
  }finally{clearTimeout(timer)}
}
async function action(mode){
  if(!current){els.result.textContent='Primero comparte o pega algo.';return}
  if(mode==='auto'){
    if(current.route.startsWith('TickTick')){
      els.status.textContent='Enviando a TickTick…'; els.result.textContent='';
      try{await bridgeTask();els.status.textContent='Acción completada'}
      catch(e){saveCurrent('Pendiente TickTick');els.status.textContent='Pendiente';els.result.textContent='No se creó todavía. Desbloquea el Pixel y pulsa AUTOMÁTICO otra vez.'}
      return;
    }
    saveCurrent('Clasificado');els.result.textContent=`Clasificado → ${current.route}`;
  }
  if(mode==='pc'){saveCurrent('Pendiente de puente DC');els.result.textContent='Guardado para enviar al PC en la siguiente fase.';}
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