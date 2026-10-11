const HUB_VERSION='30.4.60';
const HUB_BUILD='hub-30.4.60-20261011';
const groupsEl=document.querySelector('#groups');
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
function render(){
  const visible=registry;
  const groups=visible.reduce((acc,a)=>{const key=a.group||'Apps';(acc[key]||(acc[key]=[])).push(a);return acc;},{});
  groupsEl.innerHTML=Object.entries(groups).map(([group,items])=>`<section class="group"><h2>${esc(group)}</h2><div class="apps">${items.map(a=>{const v=versionFor(a.id);return `<article class="app ad-card" data-id="${esc(a.id)}"><a class="app-launch" href="${esc(launchUrl(a))}" aria-label="Abrir ${esc(a.name)}"><span class="glyph">${esc(a.glyph)}</span><span class="app-copy"><strong>${esc(a.name)}</strong><small>${esc(a.subtitle||'')}</small>${v?`<span class="app-version-chip">v${esc(v.version)}</span>`:''}</span><span class="go" aria-hidden="true">›</span></a><button type="button" class="app-info" data-info="${esc(a.id)}" aria-label="Información sobre ${esc(a.name)}" title="Información sobre esta aplicación">i</button></article>`;}).join('')}</div></section>`).join('')||'<div class="empty ad-card">No encuentro ninguna app con ese nombre.</div>';
  renderTaskMedals();
  renderHubStars();
}
async function fetchHubJson(path){
  const url=new URL(path,location.href);url.searchParams.set('hubv',HUB_VERSION);url.searchParams.set('fresh',Date.now());
  const res=await fetch(url.href,{cache:'no-store'});
  if(!res.ok)throw new Error(path+' '+res.status);
  return res.json();
}
async function loadHubData(){
  const appsData=await fetchHubJson('./apps.json');
  registry=Array.isArray(appsData.apps)?appsData.apps:[];
  if(!registry.length)throw new Error('Empty app registry');
  render();
  try{
    versionCatalog=await fetchHubJson('./versions.json');
    versionMap=Object.fromEntries((versionCatalog.apps||[]).map(x=>[x.id,x]));
    render();renderTaskMedals();renderVersionCenter();setTimeout(verifyAllVersions,150);
  }catch(e){
    console.error('Version Center load failed',e);
    const host=document.querySelector('#versionList');if(host)host.innerHTML='<div class="empty">Version Center no disponible. Las apps siguen operativas.</div>';
  }
}
loadHubData().catch(e=>{console.error('Hub registry load failed',e);groupsEl.innerHTML='<div class="empty ad-card">No se pudo cargar el directorio.</div>';});
function openAppInfo(id){
 const a=registry.find(x=>x.id===id),dialog=document.querySelector('#appInfoDialog');
 if(!a||!dialog)return;
 const title=dialog.querySelector('#appInfoTitle'),intro=dialog.querySelector('#appInfoDescription'),features=dialog.querySelector('#appInfoFeatures'),open=dialog.querySelector('#appInfoOpen');
 title.textContent=a.name;intro.textContent=a.description||a.subtitle||'';
 features.replaceChildren();
 for(const item of a.features||[]){const li=document.createElement('li');li.textContent=item;features.appendChild(li)}
 open.href=launchUrl(a);open.setAttribute('aria-label','Abrir '+a.name);
 dialog.showModal();
}
groupsEl.addEventListener('click',e=>{const b=e.target.closest('button[data-info]');if(b)openAppInfo(b.dataset.info)});
document.querySelector('#appInfoClose')?.addEventListener('click',()=>document.querySelector('#appInfoDialog')?.close());
document.querySelector('#appInfoDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close()});


const HUB_STAR_KEY='adrian_hub_stars_v1',HUB_STAR_STEP=5;
function parseStore(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return{};}}
function perfectCount(rows=[]){return(rows||[]).filter(r=>{const c=Number(r?.correct??r?.score),t=Number(r?.total??15);return Number.isFinite(c)&&Number.isFinite(t)&&t>0&&c/t>=1-1e-9;}).length;}
function goldInventory(){
  const english=parseStore('adaptive_english_campaign1_v1'),cloze=parseStore('adaptive_b2_cloze_campaign1_v1'),catala=parseStore('adaptive_verbs_catala_campaign1_v1'),phrasal=parseStore('adaptive_phrasal_verbs_v1'),hoti=parseStore('adaptive_hoti0108_v1'),pizarras=parseStore('pizarras_state_v1'),cambridge=parseStore('cambridgeB2ExerciseStatsV3'),keyword=parseStore('keywordSpeakingStatsV1');
  return{english:perfectCount((english.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),'b2-cloze':perfectCount((cloze.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),catala:perfectCount((catala.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),'phrasal-verbs':perfectCount(phrasal.history||[]),hoti0108:perfectCount((hoti.studyGame?.roundHistory||[]).filter(x=>Number(x.total)===15)),pizarras:perfectCount((pizarras.history||[]).filter(x=>x?.type==='quick'&&Number(x.questions)===15).map(x=>({correct:x.correct,total:15}))),cambridge:window.AdrianAchievements?.cambridgeMedalCounts?.()?.gold??0,'keyword-speaking':perfectCount(keyword.sessions||[])};
}
function readHubStars(){
  const old=parseStore(HUB_STAR_KEY),apps=window.AdrianAchievements.normalizeStarApps(old.apps),actual=goldInventory();
  for(const [id,n] of Object.entries(actual))apps[id]=id==="cambridge"&&window.AdrianAchievements.cambridgeMedalCounts()!==null?n:Math.max(Math.max(0,Math.floor(Number(apps[id])||0)),n);
  try{const raw=localStorage.getItem(HUB_STAR_KEY);if(raw&&Number(old.version)<3&&!localStorage.getItem(HUB_STAR_KEY+"_before_rule_v3"))localStorage.setItem(HUB_STAR_KEY+"_before_rule_v3",raw);}catch(_){}
  const totalGold=Object.values(apps).reduce((sum,n)=>sum+Math.max(0,Math.floor(Number(n)||0)),0),stars=Object.values(apps).reduce((sum,n)=>sum+Math.floor(Math.max(0,Number(n)||0)/HUB_STAR_STEP),0);
  const next={version:3,apps,stars,totalGold,step:HUB_STAR_STEP,updatedAt:Date.now()};
  if(JSON.stringify({apps:old.apps||{},stars:Number(old.stars)||0,totalGold:Number(old.totalGold)||0})!==JSON.stringify({apps,stars,totalGold}))try{localStorage.setItem(HUB_STAR_KEY,JSON.stringify(next));}catch{}
  return next;
}
const HUB_TASK_LOG_KEY='adrianEasyCatalanTaskSessionsV1';
function taskProgress(){
 let rows=[];
 try{const x=JSON.parse(localStorage.getItem(HUB_TASK_LOG_KEY)||'[]');rows=Array.isArray(x)?x:[]}catch{}
 const ids=new Set();let completed=0;
 for(const row of rows){
  if(row?.status!=='completado')continue;
  if(row.id&&ids.has(row.id))continue;
  if(row.id)ids.add(row.id);
  completed++;
 }
 return{completed,medals:Math.floor(completed/15),progress:completed%15};
}
function renderTaskMedals(){
 const x=window.CottageGarden?.progress()||{completedBlocks:taskProgress().completed};
 window.CottageGarden?.refresh();
 const card=document.querySelector('[data-id="biblioteca"] .app-copy');
 if(card){
  let chip=card.querySelector('.app-task-chip');
  if(!chip){chip=document.createElement('span');chip.className='app-task-chip';card.appendChild(chip)}
  chip.textContent='🌱 '+x.completedBlocks+' bloques · jardín de la casita';
 }
}

function renderHubStars(){
 const s=readHubStars(),host=document.querySelector('#hubStarCounter'),count=document.querySelector('#hubStarCount');
 if(host&&count){count.textContent=String(s.stars);host.classList.toggle('earned',s.stars>0);host.setAttribute('aria-label',s.stars+' estrellas y '+s.totalGold+' oros acumulados en las aplicaciones');}
 const gold=document.querySelector('#hubGoldCount');if(gold)gold.textContent=String(s.totalGold);
 window.dispatchEvent(new Event('hub:reward-summary-updated'));
 const grammar=document.querySelector('[data-id="english"] .app-copy');
 if(grammar){
  let chip=grammar.querySelector('.app-gold-chip');
  if(!chip){chip=document.createElement('span');chip.className='app-gold-chip';grammar.appendChild(chip);}
  const n=Math.max(0,Number(s.apps.english)||0);
  chip.textContent='🥇 '+n+(n===1?' oro':' oros');
  chip.setAttribute('aria-label',n+' medallas de oro acumuladas en Grammar Quest');
 }
}
renderHubStars();renderTaskMedals();
window.addEventListener('storage',e=>{if(e.key===HUB_STAR_KEY||e.key==='adrian_hub_oca_v1')renderHubStars();if(e.key===HUB_TASK_LOG_KEY)renderTaskMedals();});
window.addEventListener('hub:star-progress',renderHubStars);
window.addEventListener('adrian-sync-updated',()=>{renderHubStars();renderTaskMedals();window.AdrianOca?.refresh?.();});
window.addEventListener('pageshow',()=>{renderHubStars();renderTaskMedals();window.AdrianOca?.refresh?.();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){renderHubStars();renderTaskMedals();window.AdrianOca?.refresh?.();}});

function orderedVersionEntries(){
  if(!versionCatalog)return[];
  const byId=Object.fromEntries((versionCatalog.apps||[]).map(x=>[x.id,x]));
  return[versionCatalog.hub,...registry.map(a=>byId[a.id]).filter(Boolean)];
}
function statusText(entry){if(entry.id==='hub')return'COMPROBANDO';if(entry.kind==='bundled')return'ACTUALIZADA';if(entry.kind==='private')return'PRIVADA';return'COMPROBANDO';}
function renderVersionCenter(){
  const host=document.querySelector('#versionList'),hubLabel=document.querySelector('#hubVersionLabel');if(!host||!versionCatalog)return;
  if(hubLabel)hubLabel.textContent=`Hub v${versionCatalog.hub.version}`;
  host.innerHTML=orderedVersionEntries().map(entry=>`<button class="version-row" type="button" data-version-id="${esc(entry.id)}"><span class="version-main"><b>${esc(entry.name)}</b><small>${entry.id==='hub'?'Versión del sistema':'Versión de la aplicación'}</small></span><span class="version-build"><strong>v${esc(entry.version)}</strong><small>${esc(entry.build||'—')}</small></span><span class="version-status ${entry.kind==='private'?'private':entry.kind==='bundled'?'ok':''}" id="versionStatus-${esc(entry.id)}">${statusText(entry)}</span></button>`).join('');
  host.querySelectorAll('[data-version-id]').forEach(btn=>btn.addEventListener('click',()=>openVersionDialog(btn.dataset.versionId)));
  const footer=document.querySelector('#coreStatus');if(footer)footer.textContent=`Hub v${versionCatalog.hub.version} · AVS 2.0 · Jardín GitHub 1.3`;
  renderLastUpdate();
}
function setVersionStatus(id,text,kind='checking'){
  const el=document.getElementById(`versionStatus-${id}`);if(!el)return;el.textContent=text;el.className=`version-status ${kind}`;
}
const UPDATE_STATE_KEY='adrian_hub_update_state_v1';
let versionAudit={};
function appForVersion(id){return registry.find(x=>x.id===id)||null;}
function updateSummary(kind,headline,detail,icon){
  const box=document.querySelector('#updateSummary'),h=document.querySelector('#updateHeadline'),d=document.querySelector('#updateDetail'),i=document.querySelector('#updateIcon');
  if(box)box.className=`update-summary ${kind||''}`;if(h)h.textContent=headline||'';if(d)d.textContent=detail||'';if(i)i.textContent=icon||'✓';
}
function renderLastUpdate(){
  const el=document.querySelector('#lastUpdateLabel');if(!el)return;
  try{const x=JSON.parse(localStorage.getItem(UPDATE_STATE_KEY)||'null');el.textContent=x?.at?`Última actualización: ${new Date(x.at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`:'Todavía no has usado ACTUALIZAR TODO';}catch{el.textContent='Historial de actualización no disponible';}
}
async function refreshVersionCatalog(redraw=true){
  const r=await fetch(`./versions.json?catalog=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('Version catalog '+r.status);
  versionCatalog=await r.json();versionMap=Object.fromEntries((versionCatalog.apps||[]).map(x=>[x.id,x]));
  if(redraw){render();renderVersionCenter();}
  return versionCatalog;
}
function matchingCacheNames(entry,names){const ps=entry.cachePrefixes||[];return names.filter(n=>ps.some(p=>n.startsWith(p)));}
async function inspectInstalled(entry){
 if(!('caches' in window)||!entry.verify?.files)return{state:'unknown',cacheCount:0};
 const file=entry.verify.files.find(f=>new URL(f.url,location.href).pathname.endsWith('/app.js'));
 if(!file)return{state:'unknown',cacheCount:0};
 try{
  const names=matchingCacheNames(entry,await caches.keys());let fresh=false,stale=false;
  for(const name of names){
   const c=await caches.open(name);
   for(const request of await c.keys()){
    if(new URL(request.url).pathname!==new URL(file.url,location.href).pathname)continue;
    const r=await c.match(request);if(!r)continue;
    const bytes=await crypto.subtle.digest('SHA-256',await r.arrayBuffer());
    const hash=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
    if(hash===file.sha256)fresh=true;else stale=true;
   }
  }
  return{state:stale?'stale':fresh?'fresh':'none',cacheCount:names.length,prepared:fresh};
 }catch{return{state:'unknown',cacheCount:0};}
}
async function verifyEntry(entry){
 const evidence=await window.AdrianVersionVerifier.verify(entry,{version:HUB_VERSION,build:HUB_BUILD});
 const installed=entry.kind==='public'&&evidence.ok?await inspectInstalled(entry):{state:'unknown'};
 const pending=evidence.ok&&installed.state==='stale';
 const type=entry.kind==='private'?'private':entry.kind==='extension'?'extension':!evidence.ok?'unverified':pending?'cache':'current';
 versionAudit[entry.id]={ok:evidence.ok,pending,type,installed:installed.state,prepared:installed.prepared};
 setVersionStatus(entry.id,pending?'CACHÉ ANTERIOR · PUBLICACIÓN VERIFICADA':evidence.text,pending?'pending':evidence.kind);
 window.dispatchEvent(new CustomEvent('hub:version-audit',{detail:{id:entry.id}}));
 return versionAudit[entry.id];
}
function renderAuditSummary(){
 const entries=orderedVersionEntries(),relevant=entries.filter(x=>x.id==='hub'||x.kind==='public'||x.kind==='bundled');
 const unverified=relevant.filter(x=>!versionAudit[x.id]?.ok),pending=relevant.filter(x=>versionAudit[x.id]?.pending);
 if(unverified.length){updateSummary('warn','Comprobación pendiente',unverified.map(x=>x.name).join(', ')+' requieren verificar versión o publicación.','?');return;}
 if(pending.length){updateSummary('pending','Hay cachés anteriores',pending.map(x=>x.name).join(', ')+'. ACTUALIZAR TODO prepara la nueva versión; termina las sesiones antes de cerrar sus pestañas.','↓');return;}
 updateSummary('ok','Código publicado verificado','Hub ejecutado v'+HUB_VERSION+' y archivos públicos comprobados. Las apps abiertas deben renovarse al terminar sus sesiones.','✓');
}
async function verifyAllVersions({refresh=true}={}){
  const btn=document.querySelector('#verifyVersionsBtn'),updateBtn=document.querySelector('#updateAllVersionsBtn'),stamp=document.querySelector('#versionCheckedAt');
  if(btn){btn.disabled=true;btn.textContent='COMPROBANDO…';}if(updateBtn)updateBtn.disabled=true;updateSummary('checking','Buscando actualizaciones','Comparando versión pública y copia instalada…','↻');
  try{if(refresh)await refreshVersionCatalog(true);versionAudit={};await Promise.all(orderedVersionEntries().map(verifyEntry));renderAuditSummary();if(stamp)stamp.textContent=`Última comprobación: ${new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;}
  catch(e){console.error('Update audit failed',e);updateSummary('warn','No se pudo comprobar','El Version Center no pudo completar la auditoría.','?');}
  finally{if(btn){btn.disabled=false;btn.textContent='BUSCAR ACTUALIZACIONES';}if(updateBtn)updateBtn.disabled=false;}
}
function waitForWorker(reg,timeout=14000){
  const worker=reg.installing||reg.waiting;if(!worker||['installed','activated'].includes(worker.state))return Promise.resolve();
  return Promise.race([new Promise((resolve,reject)=>worker.addEventListener('statechange',()=>{if(['installed','activated'].includes(worker.state))resolve();else if(worker.state==='redundant')reject(new Error('Service worker redundant'));})),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service worker timeout')),timeout))]);
}
async function preflightApp(entry,stamp){
  const app=appForVersion(entry.id);if(!app)throw new Error('App missing from registry');
  const base=new URL(app.url,location.href);if(base.origin!==location.origin)throw new Error('Different origin');
  const sw=new URL('service-worker.js',base);sw.searchParams.set('hub_preflight',stamp);const r=await fetch(sw.href,{cache:'no-store'});if(!r.ok)throw new Error(`SW ${r.status}`);return{base,sw};
}
async function updateOneApp(entry,stamp,onProgress){
  setVersionStatus(entry.id,'ACTUALIZANDO','checking');const {base,sw}=await preflightApp(entry,stamp);
  // Preserve offline caches until the new worker installs completely and activates naturally.
  const updateSw=new URL(sw.href);updateSw.searchParams.delete('hub_preflight');updateSw.searchParams.set('hub_update',stamp);
  const reg=await navigator.serviceWorker.register(updateSw.href,{scope:new URL('./',base).href,updateViaCache:'none'});await waitForWorker(reg);try{await reg.update();}catch{}
  onProgress?.();return true;
}
async function refreshHubWorker(stamp){
  if(!('serviceWorker' in navigator))return;const sw=new URL('./service-worker.js',location.href);sw.searchParams.set('hub_update',stamp);sw.searchParams.set('target',versionCatalog?.hub?.version||HUB_VERSION);
  const reg=await navigator.serviceWorker.register(sw.href,{scope:new URL('./',location.href).href,updateViaCache:'none'});try{await reg.update();}catch{}
}
async function updateAllVersions(){
  if(!versionCatalog)return;
  window.dispatchEvent(new Event('hub:bulk-update-start'));
  const checkBtn=document.querySelector('#verifyVersionsBtn'),btn=document.querySelector('#updateAllVersionsBtn'),bar=document.querySelector('#updateProgressBar'),label=document.querySelector('#updateProgressLabel');
  if(checkBtn)checkBtn.disabled=true;if(btn){btn.disabled=true;btn.textContent='ACTUALIZANDO…';}const stamp=String(Date.now());
  try{
    await refreshVersionCatalog(true);const publicApps=orderedVersionEntries().filter(x=>x.kind==='public');let done=0;if(bar){bar.hidden=false;bar.max=publicApps.length;bar.value=0;}if(label)label.textContent=`0 / ${publicApps.length}`;updateSummary('checking','Actualizando todo el Hub','Preparando las aplicaciones sin tocar tu progreso…','↓');
    const preflight=await Promise.allSettled(publicApps.map(e=>preflightApp(e,stamp)));const ready=publicApps.filter((_,i)=>preflight[i].status==='fulfilled'),blocked=publicApps.filter((_,i)=>preflight[i].status==='rejected');
    blocked.forEach(e=>setVersionStatus(e.id,'SIN RED · CONSERVADA','warn'));
    const results=await Promise.allSettled(ready.map(e=>updateOneApp(e,stamp,()=>{done++;if(bar)bar.value=done;if(label)label.textContent=`${done} / ${publicApps.length}`;updateSummary('checking','Actualizando todo el Hub',`${done} de ${publicApps.length} apps renovadas…`,'↓');})));
    await refreshHubWorker(stamp);localStorage.setItem(UPDATE_STATE_KEY,JSON.stringify({at:Date.now(),hubVersion:versionCatalog.hub.version,updated:results.filter(x=>x.status==='fulfilled').length,failed:blocked.length+results.filter(x=>x.status==='rejected').length}));renderLastUpdate();
    await new Promise(r=>setTimeout(r,700));await verifyAllVersions({refresh:true});
    const failed=blocked.length+results.filter(x=>x.status==='rejected').length;if(failed)updateSummary('warn','Actualización parcial',`${publicApps.length-failed} apps preparadas · ${failed} requieren nueva comprobación.`,'!');
    else updateSummary('ok','Actualización preparada','Termina las sesiones y cierra sus pestañas para activar las nuevas versiones. Se conserva el progreso y la caché anterior hasta entonces.','✓');
  }catch(e){console.error('Update all failed',e);updateSummary('bad','No se pudo completar la actualización','No se han borrado datos de progreso. Vuelve a intentarlo.','!');}
  finally{if(bar)bar.hidden=true;if(label)label.textContent='';if(btn){btn.disabled=false;btn.textContent='ACTUALIZAR TODO';}if(checkBtn)checkBtn.disabled=false;window.dispatchEvent(new Event('hub:bulk-update-finish'));}
}
function openVersionDialog(id){
  const entry=id==='hub'?versionCatalog?.hub:versionFor(id),dialog=document.querySelector('#versionDialog'),body=document.querySelector('#versionDialogBody');if(!entry||!dialog||!body)return;
  const changes=(entry.changes||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Sin notas registradas.</li>';
  const history=(entry.history||[]).map(h=>`<section class="version-history"><div><b>v${esc(h.version)}</b><small>${esc(h.date||'')}</small></div><ul>${(h.changes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('');
  body.innerHTML=`<div class="version-dialog-title"><span>${entry.id==='hub'?'HUB':'APLICACIÓN'}</span><h2>${esc(entry.name)}</h2><p><b>v${esc(entry.version)}</b> · build <code>${esc(entry.build||'—')}</code> · ${esc(entry.releasedAt||'')}</p></div><h3>Qué cambió</h3><ul class="version-change-list">${changes}</ul>${history?`<h3>Historial registrado</h3>${history}`:''}`;
  dialog.showModal();
}
document.querySelector('#verifyVersionsBtn')?.addEventListener('click',()=>verifyAllVersions({refresh:true}));
document.querySelector('#updateAllVersionsBtn')?.addEventListener('click',updateAllVersions);
document.querySelector('#versionDialogClose')?.addEventListener('click',()=>document.querySelector('#versionDialog')?.close());
document.querySelector('#versionDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js?v=hub-v30.4.6-triage-lesson-20261007',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
}