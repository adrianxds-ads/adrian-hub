'use strict';
// Cucu Finder v1.1.0. Registros embebidos, estadísticas y favoritos solo en este navegador.
const DB = JSON.parse(document.getElementById('qqData').textContent);
const all = DB.records;
const $ = id => document.getElementById(id);
const norm = s => String(s || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tokensOf = s => norm(s).trim().split(/\s+/).filter(Boolean);
const persist = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch(e) {} };
const restore = (key,fallback) => { try {const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch(e){return fallback;} };
const favs = new Set(restore('cucu-favorites-v1',[]));
const usage = restore('cucu-usage-v1',{});
const state = {mode:'essentials',sort:restore('qq-finder-sort-v2','alpha'),query:'',visible:30,active:null,editing:false};
const essentialIds=['qqpro','qqs','qqctx','qqe','qqpln','qqres','qqadd','qqcre','qqaud','qqx','qqzip','qq2','qqcomp','qqmenu','qqsearch'];
const essentialRank=new Map(essentialIds.map((id,i)=>[id,i]));
const windowsKeys=[
 ['Edición','Ctrl + C','Copiar','copiar'],['Edición','Ctrl + V','Pegar','pegar'],['Edición','Ctrl + X','Cortar','cortar'],['Edición','Ctrl + Z','Deshacer','deshacer'],['Edición','Ctrl + Y','Rehacer','rehacer'],['Edición','Ctrl + A','Seleccionar todo','seleccion'],
 ['Edición','Ctrl + F','Buscar en documento o página','buscar'],['Ventanas','Alt + Tab','Cambiar de ventana','aplicaciones'],['Ventanas','Win + E','Abrir Explorador de archivos','carpetas'],['Ventanas','Win + V','Historial de portapapeles (si está activado)','historial'],['Ventanas','Win + Shift + S','Recortar pantalla','captura'],['Ventanas','Win + D','Mostrar escritorio','escritorio'],['Ventanas','Ctrl + Shift + Esc','Administrador de tareas','procesos'],['Ventanas','Win + L','Bloquear sesión','bloquear'],
 ['Navegador','Ctrl + T','Pestaña nueva','pestaña'],['Navegador','Ctrl + W','Cerrar pestaña','pestaña'],['Navegador','Ctrl + Shift + T','Reabrir pestaña cerrada','restaurar'],
 ['QQ · AHK documentado','Alt + Q','Abrir QQ Finder (script versionado)','finder'],['QQ · AHK documentado','Alt + Shift + Q','Abrir menú clásico QQ (script versionado)','menu']
].map(([category,keys,description,keywords])=>({category,keys,description,keywords}));

const categoryPalette = [
 ['web', '#56d6d3','🔗'],['windows','#ffcd73','⌨️'],['informática','#55b7ff','💻'],
 ['código','#55b7ff','💻'],['audio','#f8a9e4','🎧'],['notebook','#f8a9e4','🎧'],
 ['salud','#ff94a4','❤️'],['estudio','#a4db76','📚'],['anki','#a4db76','📚'],
 ['escritura','#c5a7ff','✍️'],['idioma','#a4db76','🗣️'],
 ['vida','#ffa578','🏡'],['trámite','#ffa578','🏡'],
 ['ia','#95b7ff','✦'],['productividad','#95b7ff','✦'],
 ['radar','#f6d978','📡'],['personal','#f6d978','🌟']
];
const paletteOf = x => {
 const cat=norm(x.category||'');
 for(const [key,color,icon] of categoryPalette){if(cat.includes(key))return {color,icon};}
 return {color:'#94b9dc',icon:'◈'};
};
const isHistoric=x=>x.status==='historical';
const isAction=x=>x.type==='action'||!(x.text||'').trim();
function matchMode(x){
 if(state.mode==='windows')return false;
 if(state.mode==='essentials')return !isHistoric(x)&&essentialRank.has(x.id);
 if(state.mode==='history')return isHistoric(x);
 if(isHistoric(x))return false;
 if(state.mode==='favorites')return favs.has(x.id);
 if(state.mode==='prompt')return !isAction(x);
 if(state.mode==='actions')return isAction(x);
 return true;
}
function relevance(x,terms){
 if(!terms.length)return 0;
 const q=norm(state.query.trim());
 const id=norm(x.id),name=norm(x.name),aliases=(x.aliases||[]).map(norm);
 if(q===id)return 0;
 if(aliases.includes(q))return 1;
 if(id.startsWith(q))return 2;
 if(name.startsWith(q))return 3;
 const corpus=norm([x.id,x.name,x.category,x.description,(x.aliases||[]).join(' '),(x.text||'').slice(0,600),x.action_note||''].join(' '));
 return terms.every(t=>corpus.includes(t))?4:100;
}
function compareUsage(a,b){
 const ua=usage[a.id]||{},ub=usage[b.id]||{};
 if(state.sort==='recent')return (ub.last||0)-(ua.last||0)||(ub.count||0)-(ua.count||0);
 if(state.sort==='alpha')return a.name.localeCompare(b.name,'es');
 if(state.sort==='category')return a.category.localeCompare(b.category,'es')||a.name.localeCompare(b.name,'es');
 return (ub.count||0)-(ua.count||0)||(ub.last||0)-(ua.last||0);
}
function ordered(){
 const terms=tokensOf(state.query);
 return all.filter(matchMode).map(x=>({x,rank:relevance(x,terms)})).filter(z=>z.rank!==100)
 .sort((a,b)=>{
  if(terms.length&&a.rank!==b.rank)return a.rank-b.rank;
  if(state.mode==='essentials')return essentialRank.get(a.x.id)-essentialRank.get(b.x.id);
  if(state.mode==='favorites')return a.x.name.localeCompare(b.x.name,'es');
  if(state.sort!=='alpha'&&favs.has(a.x.id)!==favs.has(b.x.id))return favs.has(a.x.id)?-1:1;
  return compareUsage(a.x,b.x)||a.x.name.localeCompare(b.x.name,'es');
 }).map(z=>z.x);
}
function countUse(id){
 const val=usage[id]||{count:0,last:0};
 usage[id]={count:val.count+1,last:Date.now()};
 persist('cucu-usage-v1',usage);
}
function toggleFavorite(id){
 if(favs.has(id))favs.delete(id);else favs.add(id);
 persist('cucu-favorites-v1',Array.from(favs));
 render();
 if(state.active?.id===id) updateFavoriteButton();
}
function updateFavoriteButton(){
 const active=state.active;
 $('detailFavorite').textContent=active&&favs.has(active.id)?'★ Destacado':'☆ Destacar';
 $('detailFavorite').setAttribute('aria-pressed',String(!!active&&favs.has(active.id)));
}
let toastTimeout;
function notify(message){
 const status=$('sourceState');
 status.textContent=message;
 status.setAttribute('role','status');
 clearTimeout(toastTimeout);
 toastTimeout=setTimeout(()=>{status.textContent='★ '+favs.size+' favoritos personales';},1800);
}
async function clipboardWrite(value){
 if(navigator.clipboard?.writeText) {
  try {await navigator.clipboard.writeText(value);return true;}catch(e){}
 }
 const area=document.createElement('textarea');
 area.value=value;area.setAttribute('readonly','');
 area.style.position='fixed';area.style.opacity='0';area.style.top='0';area.style.left='0';
 document.body.append(area);area.select();area.setSelectionRange(0,area.value.length);
 let copied=false;
 try{copied=document.execCommand('copy');}catch(e){}
 area.remove();
 return copied;
}
function openLink(x){
 if(!x.target_url)return;
 const dest=new URL(x.target_url);
 if(dest.protocol!=='https:'&&dest.protocol!=='http:')return;
 countUse(x.id);
 window.open(dest.href,'_blank','noopener,noreferrer');
 notify('Enlace abierto: '+x.id);
 render();
}
function button(label,cls,onClick,aria){
 const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;
 if(aria)b.setAttribute('aria-label',aria);
 b.addEventListener('click',onClick);return b;
}
function row(x){
 const wrap=document.createElement('div');wrap.className='entry';
 wrap.style.setProperty('--accent',paletteOf(x).color);
 const main=button('','item',()=>openDetail(x),x.name+', código '+x.id);
 const top=document.createElement('div');top.className='itemTop';
 const title=document.createElement('span');title.className='itemName';
 title.textContent=paletteOf(x).icon+' '+x.name;
 const code=document.createElement('span');code.className='code';code.textContent=x.id;
 top.append(title,code);
 const sub=document.createElement('div');sub.className='sub';
 const how=isAction(x)?(x.target_url?'Abrir enlace':'Acción · sin texto'):('Prompt · '+(usage[x.id]?.count||0)+' usos');
 sub.textContent=x.category+' · '+how+(isHistoric(x)?' · Histórico':x.status==='proposal'?' · Propuesta':'');
 main.append(top,sub);
 const fav=button(favs.has(x.id)?'★':'☆','favButton',()=>toggleFavorite(x.id),'Destacar '+x.id);
 fav.setAttribute('aria-pressed',String(favs.has(x.id)));
 let action;
 if(x.text){
  action=button('Copiar','quickCopy',async()=>{
   const success=await clipboardWrite(x.text);
   if(success){countUse(x.id);notify('✓ '+x.id+' copiado · vuelve a tu chat');action.textContent='✓ Listo';setTimeout(()=>{action.textContent='Copiar';render();},700);}
   else {openDetail(x);$('hint').textContent='Selecciona el texto del cuadro y usa Copiar del móvil.';}
  },'Copiar '+x.id+' completo');
 }else if(x.target_url){
  action=button('Abrir ↗','quickCopy',()=>openLink(x),'Abrir enlace '+x.id);
 }else{
  action=button('Acción','quickCopy',()=>openDetail(x),'Ver tipo de acción '+x.id);
 }
 wrap.append(main,fav,action);
 return wrap;
}
function windowsResults(){
 const terms=tokensOf(state.query);
 return windowsKeys.filter(x=>terms.every(t=>norm([x.keys,x.description,x.category,x.keywords].join(' ')).includes(t)));
}
function windowsRow(x){
 const wrap=document.createElement('div');wrap.className='shortcutRow';
 const info=document.createElement('div');info.className='shortcutInfo';
 const keys=document.createElement('kbd');keys.textContent=x.keys;
 const desc=document.createElement('span');desc.textContent=x.description;
 const cat=document.createElement('small');cat.textContent=x.category;
 info.append(keys,desc,cat);
 const copy=button('Copiar','shortcutCopy',async()=>{
  notify(await clipboardWrite(x.keys)?'✓ Copiado: '+x.keys:'No se pudo copiar; selecciona el texto.');
 },'Copiar '+x.keys);
 wrap.append(info,copy);return wrap;
}
function render(){
 const list=$('results');list.replaceChildren();
 const isWin=state.mode==='windows',out=isWin?windowsResults():ordered();
 for(const x of out.slice(0,state.visible))list.append(isWin?windowsRow(x):row(x));
 if(!out.length){
  const p=document.createElement('p');p.className='empty';
  p.textContent=state.mode==='favorites'?'Sin favoritos aún: ve a Esenciales y toca ☆.':'No hay coincidencias. Prueba otro término.';
  list.append(p);
 }
 const intro={essentials:'Seleccionados por utilidad en QQ Prompts, no por supuestas estadísticas.',favorites:'Guardados por ti en este navegador.',all:'Listado completo con búsqueda, categorías y ordenación.',windows:'Chuleta de Windows. Los accesos de QQ proceden del AHK versionado; instalación actual no comprobada.'};
 $('viewIntro').textContent=intro[state.mode]||intro.all;
 const inLibrary=['all','prompt','actions','history'].includes(state.mode);
 document.querySelector('.filters').hidden=!inLibrary;
 document.querySelector('.sortbar').hidden=!inLibrary;
 $('counter').textContent=out.length+' '+(isWin?'atajos':'resultados')+(state.mode==='essentials'?' · Orden de importancia':'');
 $('more').hidden=out.length<=state.visible;
 $('more').textContent='Mostrar más ('+(out.length-state.visible)+')';
 $('clear').hidden=!state.query;
 if(!$('sourceState').textContent.startsWith('✓'))$('sourceState').textContent='★ '+favs.size+' favoritos personales';
}
function openDetail(x){
 state.active=x;state.editing=false;
 $('detailTitle').textContent=x.name;
 $('detailContext').textContent=x.id+' · '+x.category+(isHistoric(x)?' · Histórico':x.status==='proposal'?' · Propuesta':'');
 $('payload').readOnly=true;
 $('payload').value=x.text||((x.target_url||'')?('Enlace del expansor:\n'+x.target_url):('Esta entrada es una acción o acceso del expansor y no contiene texto de prompt.\n'+(x.action_note||'')));
 $('dataInput').value='';
 $('dataBox').hidden=!x.text;
 $('edit').hidden=!x.text;
 $('edit').textContent='Editar copia';
 $('edit').setAttribute('aria-pressed','false');
 $('copy').disabled=!(x.text||x.target_url);
 $('copy').textContent=x.text?'Copiar texto':'Copiar enlace';
 $('share').disabled=!(x.text||x.target_url);
 $('select').disabled=!x.text;
 $('openExternal').hidden=!x.target_url;
 $('hint').textContent=isHistoric(x)?'Entrada histórica: puede no estar instalada.':x.status==='proposal'?'Propuesta: todavía no consta instalada.':!x.text?(x.target_url?'Acceso web: puedes abrir la página o copiar el enlace.':'Acción dependiente de Windows o del expansor. No tiene texto para copiar.'):'El texto original no se modificará. Puedes escribir tus datos debajo o editar una copia.';
 updateFavoriteButton();
 $('overlay').hidden=false;
 $('close').focus();
}
function closeDetail(){
 $('overlay').hidden=true;state.active=null;state.editing=false;
 $('q').focus();
}
function composed(){
 const x=state.active;if(!x)return '';
 if(!x.text)return x.target_url||'';
 const body=$('payload').value;
 const data=$('dataInput').value.trim();
 return data?body+'\n\nDATOS / CONTEXTO PARA ESTA PETICIÓN:\n'+data:body;
}
async function copyDetail(){
 const x=state.active;if(!x)return;
 const value=composed();
 if(!value)return;
 const ok=await clipboardWrite(value);
 if(ok){
  countUse(x.id);$('hint').textContent='✓ Copiado. Vuelve al chat y pega el contenido.';
  notify('✓ '+x.id+' copiado');
 }else{
  $('payload').focus();$('payload').select();
  $('hint').textContent='Copia automática bloqueada. Selecciona el texto y usa el menú Copiar.';
 }
}
function downloadBlob(filename,mime,text){
 const blob=new Blob([text],{type:mime});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportCSV(){
 // Formato verificado de Escritura Rápida: keyword,phrase. No puede representar acciones ni carpetas.
 const used=new Set(),list=[['keyword','phrase']];
 function add(key,txt){
  if(!/^[a-z0-9_]+$/i.test(key)||used.has(key)||!txt)return;
  used.add(key);list.push([key,txt]);
 }
 all.forEach(x=>{
  if(isHistoric(x)||x.status==='proposal'||!x.text||isAction(x))return;
  if((x.id==='keyword'&&x.text==='phrase')||(x.id==='nnn'&&x.text==='hola'))return;
  add(x.id,x.text);
  for(const alias of (x.aliases||[]))add(alias,x.text);
 });
 const escapeCsv=s=>'"'+String(s).replace(/"/g,'""')+'"';
 const out=list.map((row,i)=>i===0?row.join(','):row.map(escapeCsv).join(',')).join('\r\n')+'\r\n';
 downloadBlob('CUCU_FINDER_Escritura_Rapida_'+used.size+'_atajos.csv','text/csv;charset=utf-8','\ufeff'+out);
 notify('CSV preparado: '+used.size+' atajos de texto');
}
const input=$('q');
document.querySelectorAll('.viewTab').forEach(tab=>tab.addEventListener('click',()=>{
 state.mode=tab.dataset.view;state.visible=30;
 document.querySelectorAll('.viewTab').forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-pressed',String(t===tab));});
 document.querySelectorAll('.chip').forEach(t=>{t.classList.toggle('selected',t.dataset.mode==='all');t.setAttribute('aria-pressed',String(t.dataset.mode==='all'));});
 render();
}));
input.addEventListener('input',()=>{state.query=input.value;state.visible=30;render();});
$('clear').addEventListener('click',()=>{input.value='';state.query='';state.visible=30;render();input.focus();});
$('more').addEventListener('click',()=>{state.visible+=30;render();});
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
 state.mode=b.dataset.mode;state.visible=30;
 document.querySelectorAll('.chip').forEach(c=>{
  c.classList.toggle('selected',c===b);c.setAttribute('aria-pressed',String(c===b));
 });render();
}));
$('sortOrder').value=['usage','recent','alpha','category'].includes(state.sort)?state.sort:'alpha';
$('sortOrder').addEventListener('change',e=>{state.sort=e.target.value;persist('qq-finder-sort-v2',state.sort);render();});
$('exportsToggle').addEventListener('click',()=>{
 const panel=$('exports');panel.hidden=!panel.hidden;
 $('exportsToggle').setAttribute('aria-expanded',String(!panel.hidden));
});
$('exportCSV').addEventListener('click',exportCSV);
$('close').addEventListener('click',closeDetail);
$('overlay').addEventListener('click',e=>{if(e.target===$('overlay'))closeDetail();});
$('copy').addEventListener('click',copyDetail);
$('copyCode').addEventListener('click',async()=>{
 if(!state.active)return;
 const ok=await clipboardWrite(state.active.id);
 $('hint').textContent=ok?'✓ Código copiado: '+state.active.id:'No se pudo copiar el código; selecciónalo de arriba.';
 if(ok)notify('✓ Código '+state.active.id+' copiado');
});
$('detailFavorite').addEventListener('click',()=>{if(state.active)toggleFavorite(state.active.id);});
$('edit').addEventListener('click',()=>{
 if(!state.active?.text)return;
 state.editing=!state.editing;
 $('payload').readOnly=!state.editing;
 $('edit').setAttribute('aria-pressed',String(state.editing));
 $('edit').textContent=state.editing?'✓ Edición activa':'Editar copia';
 if(state.editing)$('payload').focus();
});
$('openExternal').addEventListener('click',()=>{if(state.active?.target_url)openLink(state.active);});
$('share').addEventListener('click',async()=>{
 if(!state.active)return;
 const text=composed();if(!text)return;
 if(navigator.share) {
  try{await navigator.share({title:state.active.name,text});return;}catch(e){if(e.name==='AbortError')return;}
 }
 await copyDetail();
});
$('select').addEventListener('click',()=>{
 $('payload').focus();$('payload').select();
 $('hint').textContent='Texto seleccionado. Usa Copiar en el menú del móvil.';
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('overlay').hidden){closeDetail();return;}
 if(e.key==='Enter'&&e.target===input){
  const first=document.querySelector('.entry .item, .shortcutRow .shortcutCopy');
  if(first){e.preventDefault();first.click();}
 }
});
$('returnChat').addEventListener('click',()=>{
 if(history.length>1){history.back();return;}
 location.assign('https://chatgpt.com/');
});
if('serviceWorker' in navigator && (location.protocol==='https:'||['127.0.0.1','localhost'].includes(location.hostname))){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));
}
$('checksum').textContent='Biblioteca verificada · Origen '+DB.source_sha256.slice(0,16)+'…';
render();
