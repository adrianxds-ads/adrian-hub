const groupsEl=document.querySelector('#groups');
const searchEl=document.querySelector('#search');
const countEl=document.querySelector('#count');
let registry=[];
function render(query=''){
  const q=query.trim().toLocaleLowerCase('es');
  const visible=registry.filter(a=>!q||[a.name,a.subtitle,a.group].join(' ').toLocaleLowerCase('es').includes(q));
  countEl.textContent=`${visible.length} app${visible.length===1?'':'s'}`;
  const groups=Object.groupBy(visible,a=>a.group||'Apps');
  groupsEl.innerHTML=Object.entries(groups).map(([group,items])=>`<section class="group"><h2>${group}</h2><div class="apps">${items.map(a=>`<a class="app ad-card" data-id="${a.id}" href="${a.url}"><span class="glyph">${a.glyph}</span><span class="app-copy"><strong>${a.name}</strong><small>${a.subtitle||''}</small></span><span class="go" aria-hidden="true">›</span></a>`).join('')}</div></section>`).join('')||'<div class="empty ad-card">No encuentro ninguna app con ese nombre.</div>';
}
fetch('./apps.json',{cache:'no-store'}).then(r=>r.json()).then(data=>{registry=data.apps||[];render();}).catch(()=>{groupsEl.innerHTML='<div class="empty ad-card">No se pudo cargar el directorio.</div>';});
searchEl.addEventListener('input',e=>render(e.target.value));
const HUB_STAR_KEY='adrian_hub_stars_v1',HUB_STAR_STEP=5;
function parseStore(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return{};}}
function perfectCount(rows=[]){return(rows||[]).filter(r=>{const c=Number(r?.correct??r?.score),t=Number(r?.total??15);return Number.isFinite(c)&&Number.isFinite(t)&&t>0&&c/t>=1-1e-9;}).length;}
function goldInventory(){
  const english=parseStore('adaptive_english_campaign1_v1'),cloze=parseStore('adaptive_b2_cloze_campaign1_v1'),catala=parseStore('adaptive_verbs_catala_campaign1_v1'),phrasal=parseStore('adaptive_phrasal_verbs_v1'),hoti=parseStore('adaptive_hoti0108_v1'),pizarras=parseStore('pizarras_state_v1'),cambridge=parseStore('cambridgeB2ExerciseStatsV3');
  return{
    english:perfectCount((english.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),
    'b2-cloze':perfectCount((cloze.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),
    catala:perfectCount((catala.sessionHistory||[]).filter(x=>!x.mode||x.mode==='training')),
    'phrasal-verbs':perfectCount(phrasal.history||[]),
    hoti0108:perfectCount((hoti.studyGame?.roundHistory||[]).filter(x=>Number(x.total)===15)),
    pizarras:perfectCount((pizarras.history||[]).filter(x=>x?.type==='quick'&&Number(x.questions)===15).map(x=>({correct:x.correct,total:15}))),
    cambridge:perfectCount(cambridge.attempts||[])
  };
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
if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=core-sync-20261004').catch(()=>{});