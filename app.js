const HUB_VERSION='30.0.5',HUB_BUILD='hub-30.0.5-20261006';
const groupsEl=document.querySelector('#groups');
const searchEl=document.querySelector('#search');
const countEl=document.querySelector('#count');
let registry=[];
let versionCatalog=null;
let versionMap={};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function versionFor(id){return versionMap[id]||null;}
function launchUrl(app){
  const v=versionFor(app.id),u=new URL(app.url,location.href);
  u.searchParams.set('hubv',HUB_VERSION);
  if(v?.version)u.searchParams.set('appv',v.version);
  if(v?.build)u.searchParams.set('build',v.build);
  return u.href;
}
function render(query=''){
  const q=query.trim().toLocaleLowerCase('es');
  const visible=registry.filter(a=>!q||[a.name,a.subtitle,a.group].join(' ').toLocaleLowerCase('es').includes(q));
  countEl.textContent=`${visible.length} app${visible.length===1?'':'s'}`;
  const groups=Object.groupBy(visible,a=>a.group||'Apps');
  groupsEl.innerHTML=Object.entries(groups).map(([group,items])=>`<section class="group"><h2>${esc(group)}</h2><div class="apps">${items.map(a=>{const v=versionFor(a.id);return `<a class="app ad-card" data-id="${esc(a.id)}" href="${esc(launchUrl(a))}"><span class="glyph">${esc(a.glyph)}</span><span class="app-copy"><strong>${esc(a.name)}</strong><small>${esc(a.subtitle||'')}</small>${v?`<span class="app-version-chip">v${esc(v.version)} · ${esc(v.build)}</span>`:''}</span><span class="go" aria-hidden="true">›</span></a>`;}).join('')}</div></section>`).join('')||'<div class="empty ad-card">No encuentro ninguna app con ese nombre.</div>';
}
async function loadHubData(){
  const appsRes=await fetch('./apps.json',{cache:'no-store'});
  const appsData=await appsRes.json();
  registry=appsData.apps||[];
  render();
  try{
    const versionsRes=await fetch('./versions.json',{cache:'no-store'});
    versionCatalog=await versionsRes.json();
    versionMap=Object.fromEntries((versionCatalog.apps||[]).map(x=>[x.id,x]));
    render();renderVersionCenter();setTimeout(verifyAllVersions,150);
  }catch(e){
    console.error('Version Center load failed',e);
    const host=document.querySelector('#versionList');if(host)host.innerHTML='<div class="empty">Version Center no disponible. Las apps siguen operativas.</div>';
  }
}
loadHubData().catch(e=>{console.error('Hub registry load failed',e);groupsEl.innerHTML='<div class="empty ad-card">No se pudo cargar el directorio.</div>';});
searchEl.addEventListener('input',e=>render(e.target.value));

const HUB_STAR_KEY='adrian_hub_stars_v1',HUB_STAR_STEP=5;
function parseStore(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return{};}}
function perfectCount(rows=[]){return(rows||[]).filter(r=>{const c=Number(r?.correct??r?.score),t=Number(r?.total??15);return Number.isFinite(c)&&Number.isFinite(t)&&t>0&&c/t>=1-1e-9;}).length;}
function goldInventory(){
  const english=parseStore('adaptive_english_campaign1_v1'),cloze=parseStore('adaptive_b2_cloze_campaign1_v1'),catala=parseStore('adaptive_verbs_catala_campaign1_v1'),phrasal=parseStore('adaptive_phrasal_verbs_v1'),hoti=parseStore('adaptive_hoti0108_v1'),pizarras=parseStore('pizarras_state_v1'),cambridge=parseStore('cambridgeB2ExerciseStatsV3');
  return{english:perfectCount((english.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),'b2-cloze':perfectCount((cloze.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),catala:perfectCount((catala.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),'phrasal-verbs':perfectCount(phrasal.history||[]),hoti0108:perfectCount((hoti.studyGame?.roundHistory||[]).filter(x=>Number(x.total)===15)),pizarras:perfectCount((pizarras.history||[]).filter(x=>x?.type==='quick'&&Number(x.questions)===15).map(x=>({correct:x.correct,total:15}))),cambridge:perfectCount(cambridge.attempts||[])};
}
function readHubStars(){
  const old=parseStore(HUB_STAR_KEY),apps={...(old.apps||{})},actual=goldInventory();
  for(const [id,n] of Object.entries(actual))apps[id]=Math.max(Math.max(0,Math.floor(Number(apps[id])||0)),n);
  const totalGold=Object.values(apps).reduce((sum,n)=>sum+Math.max(0,Math.floor(Number(n)||0)),0),stars=Math.floor(totalGold/HUB_STAR_STEP),progress=totalGold%HUB_STAR_STEP;
  const next={version:2,apps,stars,totalGold,progress,step:HUB_STAR_STEP,updatedAt:Date.now()};
  if(JSON.stringify({apps:old.apps||{},stars:Number(old.stars)||0,totalGold:Number(old.totalGold)||0})!==JSON.stringify({apps,stars,totalGold}))try{localStorage.setItem(HUB_STAR_KEY,JSON.stringify(next));}catch{}
  return next;
}
function renderHubStars(){const s=readHubStars(),host=document.querySelector('#hubStarCounter'),count=document.querySelector('#hubStarCount'),progress=document.querySelector('#hubStarProgress');if(!host||!count||!progress)return;count.textContent=String(s.stars);progress.textContent=`${s.progress}/${s.step} · ${s.totalGold} OROS`;host.classList.toggle('earned',s.stars>0);host.setAttribute('aria-label',`${s.stars} estrellas globales. ${s.totalGold} medallas de oro acumuladas entre todos los Adaptive.`);}
renderHubStars();
window.addEventListener('storage',e=>{if(e.key===HUB_STAR_KEY||e.key==='adrian_hub_oca_v1')renderHubStars();});
window.addEventListener('hub:star-progress',renderHubStars);
window.addEventListener('adrian-sync-updated',()=>{renderHubStars();window.AdrianOca?.refresh?.();});
window.addEventListener('pageshow',()=>{renderHubStars();window.AdrianOca?.refresh?.();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){renderHubStars();window.AdrianOca?.refresh?.();}});

function orderedVersionEntries(){
  if(!versionCatalog)return[];
  const byId=Object.fromEntries((versionCatalog.apps||[]).map(x=>[x.id,x]));
  return[versionCatalog.hub,...registry.map(a=>byId[a.id]).filter(Boolean)];
}
function statusText(entry){if(entry.id==='hub')return'ESTE HUB';if(entry.kind==='bundled')return'INCLUIDA EN HUB';if(entry.kind==='private')return'PRIVADA';return'COMPROBANDO';}
function renderVersionCenter(){
  const host=document.querySelector('#versionList'),hubLabel=document.querySelector('#hubVersionLabel');if(!host||!versionCatalog)return;
  if(hubLabel)hubLabel.textContent=`Hub v${HUB_VERSION}`;
  host.innerHTML=orderedVersionEntries().map(entry=>`<button class="version-row" type="button" data-version-id="${esc(entry.id)}"><span class="version-main"><b>${esc(entry.name)}</b><small>${entry.id==='hub'?'Versión del sistema':'Versión de la aplicación'}</small></span><span class="version-build"><strong>v${esc(entry.version)}</strong><small>${esc(entry.build||'—')}</small></span><span class="version-status ${entry.kind==='private'?'private':entry.kind==='bundled'?'bundled':''}" id="versionStatus-${esc(entry.id)}">${statusText(entry)}</span></button>`).join('');
  host.querySelectorAll('[data-version-id]').forEach(btn=>btn.addEventListener('click',()=>openVersionDialog(btn.dataset.versionId)));
  const footer=document.querySelector('#coreStatus');if(footer)footer.textContent=`Hub v${versionCatalog.hub.version} · AVS 2.0 · Jardín GitHub 1.3`;
}
function setVersionStatus(id,text,kind='checking'){
  const el=document.getElementById(`versionStatus-${id}`);if(!el)return;el.textContent=text;el.className=`version-status ${kind}`;
}
async function verifyEntry(entry){
 const result=await window.AdrianVersionVerifier.verify(entry,{version:HUB_VERSION,build:HUB_BUILD});
 setVersionStatus(entry.id,result.text,result.kind);return result.ok;
}
async function verifyAllVersions(){
  if(!versionCatalog)return;
  const btn=document.querySelector('#verifyVersionsBtn'),stamp=document.querySelector('#versionCheckedAt');if(btn){btn.disabled=true;btn.textContent='COMPROBANDO…';}
  await Promise.all(orderedVersionEntries().map(verifyEntry));
  if(stamp)stamp.textContent=`Última comprobación: ${new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
  if(btn){btn.disabled=false;btn.textContent='COMPROBAR AHORA';}
}
function openVersionDialog(id){
  const entry=id==='hub'?versionCatalog?.hub:versionFor(id),dialog=document.querySelector('#versionDialog'),body=document.querySelector('#versionDialogBody');if(!entry||!dialog||!body)return;
  const changes=(entry.changes||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Sin notas registradas.</li>';
  const history=(entry.history||[]).map(h=>`<section class="version-history"><div><b>v${esc(h.version)}</b><small>${esc(h.date||'')}</small></div><ul>${(h.changes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('');
  body.innerHTML=`<div class="version-dialog-title"><span>${entry.id==='hub'?'HUB':'APLICACIÓN'}</span><h2>${esc(entry.name)}</h2><p><b>v${esc(entry.version)}</b> · build <code>${esc(entry.build||'—')}</code> · ${esc(entry.releasedAt||'')}</p></div><h3>Qué cambió</h3><ul class="version-change-list">${changes}</ul>${history?`<h3>Historial registrado</h3>${history}`:''}`;
  dialog.showModal();
}
document.querySelector('#verifyVersionsBtn')?.addEventListener('click',verifyAllVersions);
document.querySelector('#versionDialogClose')?.addEventListener('click',()=>document.querySelector('#versionDialog')?.close());
document.querySelector('#versionDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});

if('serviceWorker' in navigator){
  let refreshed=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshed)return;refreshed=true;if(sessionStorage.getItem('hub-sw-v30.0.1-reloaded')!=='1'){sessionStorage.setItem('hub-sw-v30.0.1-reloaded','1');location.reload();}});
  navigator.serviceWorker.register('./service-worker.js?v=hub-v30.0.1-p1-20261006',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
}