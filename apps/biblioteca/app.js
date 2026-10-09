const STORE='adrianLibraryEasyCatalanV1', POS='adrianLibraryEasyCatalanPositionsV1';
const NORMAL_PLAYS='adrianEasyCatalanNormalPlaysV1', TASK_PLAYS='adrianEasyCatalanTaskSessionsV1';
const $=s=>document.querySelector(s);
const els={art:$('#artwork'),heard:$('#heardCount'),total:$('#totalCount'),search:$('#search'),sort:$('#sortBtn'),sortLabel:$('#sortLabel'),shown:$('#shownCount'),list:$('#episodes'),empty:$('#empty'),audio:$('#audio'),player:$('#player'),playerToggle:$('#playerToggle'),playerTitle:$('#playerTitle'),playerDone:$('#playerDone'),seek:$('#seek'),elapsed:$('#elapsed'),remaining:$('#remaining')};
let data=null,order='asc',current=null,lastSaved=0;
const heard=()=>{try{return new Set(JSON.parse(localStorage.getItem(STORE)||'[]').map(Number))}catch{return new Set()}};
const positions=()=>{try{return JSON.parse(localStorage.getItem(POS)||'{}')}catch{return {}}};
const saveHeard=s=>localStorage.setItem(STORE,JSON.stringify([...s].sort((a,b)=>a-b)));
const savePositions=p=>localStorage.setItem(POS,JSON.stringify(p));

function normalCounts(){
 try{const obj=JSON.parse(localStorage.getItem(NORMAL_PLAYS)||'{}');return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{}}catch{return{}}
}
function taskCounts(){
 const out={};
 try{
  const raw=JSON.parse(localStorage.getItem(TASK_PLAYS)||'[]');
  const seen=new Set();
  if(!Array.isArray(raw))return out;
  for(const row of raw){
   const n=Number(row?.episodeNumber);
   if(row?.status!=='completado'||!Number.isInteger(n)||n<1)continue;
   if(row.id && seen.has(row.id))continue;
   if(row.id)seen.add(row.id);
   out[n]=(out[n]||0)+1;
  }
 }catch{}
 return out;
}
window.PodcastCounts={normalCounts,taskCounts};
function saveNormalListen(n){
 const counts=normalCounts(),key=String(n);
 counts[key]=Math.max(0,Number(counts[key])||0)+1;
 localStorage.setItem(NORMAL_PLAYS,JSON.stringify(counts));
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dateText=raw=>{const d=new Date(raw);return Number.isNaN(+d)?'':d.toLocaleDateString('ca-ES',{day:'numeric',month:'short',year:'numeric'})};
const time=s=>{s=Math.max(0,Math.floor(Number(s)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function render(){
  if(!data)return;
  const done=heard(),normal=normalCounts(),tasks=taskCounts(),q=norm(els.search.value).trim();
  let rows=data.episodes.filter(e=>!q||norm(e.number+' '+e.title+' '+e.summary).includes(q));
  if(order==='desc')rows=[...rows].reverse();
  const known=new Set([...done,...Object.keys(normal).filter(n=>normal[n]>0).map(Number),...Object.keys(tasks).filter(n=>tasks[n]>0).map(Number)]);
  els.heard.textContent=known.size;els.total.textContent=data.episodes.length;els.shown.textContent=rows.length===data.episodes.length?'':rows.length+' resultats';
  els.empty.hidden=window.ModeTarea?.selectedTab==='task'||!!rows.length;
  els.list.innerHTML=rows.map(e=>{
    const isDone=known.has(e.number),playing=current===e.number&&!els.audio.paused;
    const ordinary=Math.max(0,Number(normal[e.number])||0),work=tasks[e.number]||0;
    const listeningInfo=(ordinary||work)?'<div class="listen-tally">'+(ordinary?'🎧 '+ordinary+' '+(ordinary===1?'escucha':'escuchas'):'')+(ordinary&&work?' · ':'')+(work?'🦖 '+work+' '+(work===1?'tarea':'tareas'):'')+'</div>':(isDone?'<div class="listen-tally">✓ Ya escuchado</div>':'');
    return '<article class="episode '+(isDone?'done':'')+'" data-episode="'+e.number+'">'+
      '<button class="play-btn '+(playing?'playing':'')+'" data-play="'+e.number+'" aria-label="'+(playing?'Pausar':'Reproduir')+'">'+(playing?'Ⅱ':'▶')+'</button>'+
      '<div class="episode-main"><div class="episode-top"><span class="episode-no">#'+e.number+'</span><h2 class="episode-title">'+esc(e.title)+'</h2></div>'+
      '<div class="meta">'+esc(dateText(e.dateRaw))+(e.duration?' · '+esc(e.duration):'')+'</div>'+
      '<p class="summary">'+esc(e.summary||'')+'</p>'+listeningInfo+'</div>'+
      '<button class="state-btn" data-state="'+e.number+'" aria-label="'+(isDone?'Marcar pendent':'Marcar escoltat')+'">'+(isDone?'✓':'×')+'</button></article>'
  }).join('');
  els.list.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>toggleEpisode(Number(b.dataset.play)));
  els.list.querySelectorAll('[data-state]').forEach(b=>b.onclick=()=>toggleDone(Number(b.dataset.state)));
}
function episode(n){return data?.episodes.find(e=>e.number===n)}
function toggleDone(n,force){
  const s=heard(),next=force===undefined?!s.has(n):!!force;
  next?s.add(n):s.delete(n);saveHeard(s);render();
}
async function toggleEpisode(n){
  const e=episode(n);if(!e||!e.audio||window.ModeTarea?.playing)return;
  if(current===n){if(els.audio.paused)await els.audio.play();else els.audio.pause();render();return}
  persistPosition();current=n;els.audio.src=e.audio;els.player.hidden=false;els.playerTitle.textContent='#'+e.number+' · '+e.title;
  els.audio.onloadedmetadata=()=>{const p=positions()[n]||0;if(p>3&&p<els.audio.duration-10)els.audio.currentTime=p;updateTimeline()};
  try{await els.audio.play()}catch{}
  render();
}
function persistPosition(){
  if(window.ModeTarea?.playing||!current||!Number.isFinite(els.audio.currentTime))return;
  const p=positions();p[current]=Math.floor(els.audio.currentTime);savePositions(p);lastSaved=Date.now();
}
function updateTimeline(){
  const d=Number.isFinite(els.audio.duration)?els.audio.duration:0,c=els.audio.currentTime||0;
  els.seek.value=d?Math.round(c/d*1000):0;els.elapsed.textContent=time(c);els.remaining.textContent=d?'-'+time(Math.max(0,d-c)):'0:00';
  els.playerToggle.textContent=els.audio.paused?'▶':'Ⅱ';
}
els.search.oninput=render;
els.sort.onclick=()=>{order=order==='asc'?'desc':'asc';els.sortLabel.textContent=order==='asc'?'1 → 233':'233 → 1';render()};
els.playerToggle.onclick=async()=>{if(!current)return;if(els.audio.paused)await els.audio.play();else els.audio.pause();render()};
els.playerDone.onclick=()=>{if(current)toggleDone(current,true)};
els.seek.oninput=()=>{if(Number.isFinite(els.audio.duration))els.audio.currentTime=els.audio.duration*Number(els.seek.value)/1000};
els.audio.addEventListener('play',()=>{updateTimeline();render()});
els.audio.addEventListener('pause',()=>{persistPosition();updateTimeline();render()});
els.audio.addEventListener('timeupdate',()=>{updateTimeline();if(Date.now()-lastSaved>5000)persistPosition()});
els.audio.addEventListener('ended',()=>{if(window.ModeTarea?.playing)return;if(current){saveNormalListen(current);toggleDone(current,true);const p=positions();delete p[current];savePositions(p)}});
window.addEventListener('pagehide',persistPosition);
window.LibraryGetSort=()=>order;
window.LibraryOriginalStop=()=>{persistPosition();els.audio.pause();current=null;els.audio.onloadedmetadata=null;els.player.hidden=true;render()};
fetch('./easy-catalan.json').then(r=>{if(!r.ok)throw Error('Catàleg no disponible');return r.json()}).then(x=>{data=x;els.art.src=x.artwork;render();window.ModeTarea?.catalogReady(x)}).catch(err=>{els.empty.hidden=false;els.empty.textContent='No s’ha pogut carregar el catàleg.';console.error(err)});
