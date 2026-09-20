const groupsEl=document.querySelector('#groups');
const searchEl=document.querySelector('#search');
const countEl=document.querySelector('#count');
let registry=[];
function render(query=''){
  const q=query.trim().toLocaleLowerCase('es');
  const visible=registry.filter(a=>!q||[a.name,a.subtitle,a.group].join(' ').toLocaleLowerCase('es').includes(q));
  countEl.textContent=`${visible.length} app${visible.length===1?'':'s'}`;
  const groups=Object.groupBy(visible,a=>a.group||'Apps');
  groupsEl.innerHTML=Object.entries(groups).map(([group,items])=>`<section class="group"><h2>${group}</h2><div class="apps">${items.map(a=>`<a class="app ad-card" href="${a.url}"><span class="glyph">${a.glyph}</span><span><strong>${a.name}</strong><small>${a.subtitle||''}</small></span></a>`).join('')}</div></section>`).join('')||'<div class="empty ad-card">No encuentro ninguna app con ese nombre.</div>';
}
fetch('./apps.json',{cache:'no-store'}).then(r=>r.json()).then(data=>{registry=data.apps||[];render();}).catch(()=>{groupsEl.innerHTML='<div class="empty ad-card">No se pudo cargar el directorio.</div>';});
searchEl.addEventListener('input',e=>render(e.target.value));
if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});