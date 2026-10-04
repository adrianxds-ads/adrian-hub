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
function readHubStars(){
  if(window.AdrianGarden?.starProgress)return window.AdrianGarden.starProgress();
  try{const x=JSON.parse(localStorage.getItem('adrian_hub_stars_v1')||'{}'),values=Object.values(x.apps||{}).map(n=>Math.max(0,Math.floor(Number(n)||0))),totalGold=values.reduce((sum,n)=>sum+n,0),stars=values.reduce((sum,n)=>sum+Math.floor(n/5),0);return{stars,totalGold,step:5};}catch{return{stars:0,totalGold:0,step:5};}
}
function renderHubStars(){const s=readHubStars(),host=document.querySelector('#hubStarCounter'),count=document.querySelector('#hubStarCount'),progress=document.querySelector('#hubStarProgress');if(!host||!count||!progress)return;count.textContent=String(s.stars);progress.textContent='5 OROS = 1 STAR';host.classList.toggle('earned',s.stars>0);host.setAttribute('aria-label',`${s.stars} estrellas ganadas. Cada cinco medallas de oro dentro de un juego conceden una estrella.`);}
renderHubStars();
window.addEventListener('storage',e=>{if(e.key==='adrian_hub_stars_v1')renderHubStars();});
window.addEventListener('hub:star-progress',renderHubStars);
if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js?v=core-sync-20261004').catch(()=>{});