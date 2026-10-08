/* Biblioteca · Modo Tarea v1.0 — independent session history; original player remains unchanged. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY='adrianEasyCatalanTaskSessionsV1', LIVE='adrianEasyCatalanTaskLiveV1';
const audio=$('audio'), panel=$('taskPanel'), list=$('taskEpisodes'), original=$('episodes');
const els={normal:$('tabPodcasts'),task:$('tabTasks'),legend:$('libraryLegend'),empty:$('empty'),search:$('search'),sort:$('sortBtn'),modal:$('taskSetup'),setupTitle:$('taskSetupTitle'),taskText:$('taskText'),setupButton:$('taskSetupButton'),setupCancel:$('taskSetupCancel'),stage:$('taskStage'),journey:$('taskJourney'),dino:$('taskDino'),progress:$('taskProgress'),clock:$('taskClock'),stageTitle:$('taskStageTitle'),stageTask:$('taskStageTask'),resume:$('taskResume'),exit:$('taskExit'),breakBox:$('taskBreak'),breakClock:$('taskBreakClock'),breakText:$('taskBreakText'),today:$('taskToday'),total:$('taskTotal'),minutes:$('taskMinutes'),chart:$('taskChart'),chartFull:$('taskChartFull'),chartOpen:$('taskChartOpen'),chartClose:$('taskChartClose'),chartDialog:$('taskChartDialog'),dayInfo:$('taskDayInfo'),dayInfoFull:$('taskDayInfoFull'),history:$('taskHistory'),openStats:$('taskStatsToggle'),stats:$('taskStatsDetails')};
let catalog=null,chosen=null,lastPersist=0,allowSeek=false,restoring=false,tick=null;
const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
let state=parse(LIVE,{active:null,breakEnd:null,chain:null,queue:null});
const logs=()=>parse(KEY,[]);
const save=()=>{try{localStorage.setItem(LIVE,JSON.stringify(state))}catch(e){console.error('Task live save',e)}};
const saveLogs=arr=>{try{localStorage.setItem(KEY,JSON.stringify(arr))}catch(e){console.error('Task history save',e)}};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const seconds=s=>{const p=String(s||'').split(':').map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:0};
const day=t=>{const d=new Date(t);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const identifier=()=>('s'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));
const ms=600000;
window.ModeTarea={playing:false,selectedTab:'listen',catalogReady(data){catalog=data;renderList();renderStats();restore()}};
function tabs(tab){
 const task=tab==='task';
 if(task&&!state.active)window.LibraryOriginalStop?.();
 if(!task&&state.breakEnd){state.breakEnd=null;state.queue=null;state.chain=null;save()}
 window.ModeTarea.selectedTab=tab;
 els.normal.setAttribute('aria-selected',String(!task));els.task.setAttribute('aria-selected',String(task));
 panel.hidden=!task;original.hidden=task;els.legend.hidden=task;
 if(task)els.empty.hidden=true;
 else {els.empty.hidden=true; if(typeof render==='function')render();}
 if(task){renderList();renderStats();renderBreak();}
}
function renderList(){
 if(!catalog)return;
 const q=norm(els.search.value).trim();
 let rows=catalog.episodes.filter(e=>!q||norm(e.number+' '+e.title+' '+e.summary).includes(q));
 if(els.sort.textContent.includes('233 → 1'))rows=rows.slice().reverse();
 list.innerHTML=rows.map(e=>'<article class="episode task-episode"><button type="button" class="play-btn" data-task-episode="'+e.number+'" aria-label="Elegir episodio '+e.number+'">▶</button><div class="episode-main"><div class="episode-top"><span class="episode-no">#'+e.number+'</span><h2 class="episode-title">'+safe(e.title)+'</h2></div><div class="meta">'+safe(e.duration||'')+' · Duración fija</div><p class="summary">'+safe(e.summary||'')+'</p></div><button type="button" class="task-select-btn" data-task-episode="'+e.number+'">ELEGIR</button></article>').join('');
 $('taskEmpty').hidden=!!rows.length;
 list.querySelectorAll('[data-task-episode]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.taskEpisode))));
}
function choose(n){
 if(state.active)return;
 chosen=catalog?.episodes.find(e=>e.number===n);
 if(!chosen?.audio)return;
 els.setupTitle.textContent='#'+chosen.number+' · '+chosen.title+' · '+(chosen.duration||'');
 els.taskText.value=state.queue?.episodeNumber===n?state.queue.task:'';
 els.setupButton.textContent=state.breakEnd&&state.breakEnd>Date.now()?'Preparar para después del descanso':'Iniciar recorrido';
 els.modal.hidden=false;els.taskText.focus();
}
function closeSetup(){els.modal.hidden=true}
async function submitSetup(){
 const task=els.taskText.value.trim().slice(0,130);
 if(!task){els.taskText.focus();els.taskText.setCustomValidity('Escribe una tarea breve');els.taskText.reportValidity();return}
 els.taskText.setCustomValidity('');
 const prepared={episodeNumber:chosen.number,task};
 closeSetup();
 if(state.breakEnd&&state.breakEnd>Date.now()){
  state.queue=prepared;save();renderBreak();
 } else begin(prepared,false);
}
function begin(prepared,continuation){
 const e=catalog?.episodes.find(x=>x.number===prepared.episodeNumber);
 if(!e?.audio)return;
 window.LibraryOriginalStop?.();
 state.active={id:identifier(),episodeNumber:e.number,title:e.title,task:prepared.task,startedAt:new Date().toISOString(),elapsed:0,duration:seconds(e.duration),chain:continuation&&state.chain?state.chain:identifier()};
 state.chain=state.active.chain;state.breakEnd=null;state.queue=null;save();
 audio.onloadedmetadata=null;audio.src=e.audio;audio.playbackRate=1;audio.controls=false;
 window.ModeTarea.playing=true;
 els.stage.hidden=false;els.resume.hidden=true;els.stageTitle.textContent='#'+e.number+' · '+e.title;els.stageTask.textContent=prepared.task;
 updateJourney();
 audio.play().catch(()=>{els.resume.hidden=false;els.resume.textContent='▶ Reanudar audio';});
 renderBreak();
}
function restore(){
 if(state.active){
  const e=catalog?.episodes.find(x=>x.number===state.active.episodeNumber);
  if(e?.audio){
   window.LibraryOriginalStop?.();window.ModeTarea.playing=true;restoring=true;allowSeek=true;
   audio.onloadedmetadata=null;audio.src=e.audio;audio.playbackRate=1;
   els.stageTitle.textContent='#'+e.number+' · '+e.title;els.stageTask.textContent=state.active.task;
   els.stage.hidden=false;els.resume.hidden=false;els.resume.textContent='▶ Reanudar después de la interrupción';
   const p=state.active.elapsed||0;
   audio.addEventListener('loadedmetadata',function loaded(){audio.removeEventListener('loadedmetadata',loaded);audio.currentTime=Math.min(p,Math.max(0,audio.duration-3));allowSeek=false;restoring=false;updateJourney();},{once:true});
  } else {state.active=null;save();}
 }
 if(state.breakEnd){if(Date.now()>state.breakEnd){state.breakEnd=null;state.queue=null;save()}else renderBreak();}
}
function updateJourney(){
 if(!state.active)return;
 const actual=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:state.active.duration;
 const pct=actual?Math.min(100,Math.max(0,(audio.currentTime||0)/actual*100)):0;
 els.dino.style.left='calc('+(pct*.88+3)+'% - 16px)';
 els.progress.style.width=pct+'%';
 els.journey.setAttribute('aria-valuenow',String(Math.floor(pct)));
 els.clock.textContent=fmt(Math.max(0,actual-(audio.currentTime||0)))+' restantes';
}
function finished(){
 const a=state.active;if(!a)return;
 const arr=logs();
 arr.push({id:a.id,episodeNumber:a.episodeNumber,title:a.title,task:a.task,startedAt:a.startedAt,endedAt:new Date().toISOString(),seconds:Math.round(Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:(a.duration||audio.currentTime||0)),status:'completado',chain:a.chain});
 saveLogs(arr);
 state.active=null;state.breakEnd=Date.now()+ms;state.queue=null;state.chain=a.chain;save();
 window.ModeTarea.playing=false;els.stage.hidden=true;renderStats();renderBreak();tabs('task');
 // Preserve the existing library's listened indicator, independently from the task history.
 if(typeof toggleDone==='function')toggleDone(a.episodeNumber,true);
}
function stop(){
 if(!state.active||!confirm('¿Salir de este recorrido? El bloque no contará como completado.'))return;
 const a=state.active,arr=logs();
 arr.push({id:a.id,episodeNumber:a.episodeNumber,title:a.title,task:a.task,startedAt:a.startedAt,endedAt:new Date().toISOString(),seconds:Math.round(audio.currentTime||a.elapsed||0),status:'interrumpido',chain:a.chain});
 saveLogs(arr);audio.pause();audio.removeAttribute('src');audio.load();
 state.active=null;state.queue=null;state.breakEnd=null;state.chain=null;window.ModeTarea.playing=false;
 els.stage.hidden=true;save();renderStats();renderBreak();
}
function renderBreak(){
 if(state.active||!state.breakEnd){els.breakBox.hidden=true;return}
 const left=Math.max(0,Math.ceil((state.breakEnd-Date.now())/1000));
 if(!left){
  const queued=state.queue,chain=state.chain;
  state.breakEnd=null;state.queue=null;save();els.breakBox.hidden=true;
  if(queued){state.chain=chain;begin(queued,true)}
  return;
 }
 els.breakBox.hidden=false;els.breakClock.textContent=fmt(left);
 els.breakText.textContent=state.queue?'Próximo bloque preparado. Comenzará al terminar el descanso.':'Descanso fijo de 10 minutos. Elige el siguiente episodio y su tarea antes de que termine.';
}
function renderStats(){
 const done=logs().filter(x=>x.status==='completado'),all=logs();
 els.today.textContent=done.filter(x=>day(x.endedAt)===day(Date.now())).length;
 els.total.textContent=done.length;
 const secs=done.reduce((sum,x)=>sum+(Number(x.seconds)||0),0);
 els.minutes.textContent=Math.floor(secs/3600)+' h '+Math.floor((secs%3600)/60)+' min';
 const byDay={};done.forEach(x=>{const d=day(x.endedAt);byDay[d]=(byDay[d]||0)+1});
 const dates=Object.keys(byDay).sort(),end=day(Date.now()),start=dates[0]||end;
 const days=[],d=new Date(start+'T12:00:00'),last=new Date(end+'T12:00:00');
 for(let i=0;d<=last&&i<5000;i++,d.setDate(d.getDate()+1))days.push(day(d));
 const max=Math.max(1,...Object.values(byDay));
 const chart=days.map(k=>{const n=byDay[k]||0;return '<button type="button" class="task-day" data-day="'+k+'" title="'+k+': '+n+' bloques" aria-label="'+k+': '+n+' bloques"><span class="task-day-bar" style="height:'+(n?Math.max(5,Math.round(n/max*100)):2)+'%"></span><small>'+(k.slice(-2)==='01'?k.slice(5,7)+'/'+k.slice(2,4):k.slice(-2))+'</small></button>'}).join('');
 [els.chart,els.chartFull].forEach(node=>{node.innerHTML=chart;node.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>showDay(b.dataset.day))});
 const rows=all.slice().reverse().map(x=>'<div class="task-log '+(x.status==='completado'?'':'task-log-interrupted')+'"><span>'+safe(new Date(x.endedAt).toLocaleDateString('es-ES'))+' · '+safe(x.status==='completado'?'✓':'Interrumpido')+'</span><b>'+safe(x.task)+'</b><small>#'+x.episodeNumber+' · '+safe(x.title)+' · '+fmt(x.seconds)+'</small></div>').join('');
 els.history.innerHTML=rows||'<p class="task-muted">Aún no hay bloques registrados.</p>';
 showDay(day(Date.now()));
}
function showDay(k){
 const rows=logs().filter(x=>x.status==='completado'&&day(x.endedAt)===k);
 const label=k+' · '+rows.length+' '+(rows.length===1?'bloque':'bloques')+(rows.length?' · '+rows.map(x=>x.task).join(' / '):'');
 els.dayInfo.textContent=label;els.dayInfoFull.textContent=label;
}
els.normal.onclick=()=>tabs('listen');
els.task.onclick=()=>tabs('task');
els.search.addEventListener('input',()=>{renderList();if(window.ModeTarea.selectedTab==='task')els.empty.hidden=true});
els.sort.addEventListener('click',()=>setTimeout(renderList,0));
els.setupCancel.onclick=closeSetup;
els.setupButton.onclick=submitSetup;
els.taskText.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitSetup()}});
els.taskText.addEventListener('input',()=>els.taskText.setCustomValidity(''));
els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeSetup()});
els.exit.onclick=stop;
els.resume.onclick=()=>{audio.play().then(()=>{els.resume.hidden=true}).catch(()=>{els.resume.hidden=false})};
els.openStats.onclick=()=>{els.stats.hidden=!els.stats.hidden;els.openStats.setAttribute('aria-expanded',String(!els.stats.hidden));if(!els.stats.hidden)renderStats()};
els.chartOpen.onclick=()=>{renderStats();els.chartDialog.showModal()};
els.chartClose.onclick=()=>els.chartDialog.close();
audio.addEventListener('timeupdate',()=>{
 if(!state.active)return;
 updateJourney();
 if(Date.now()-lastPersist>4000){state.active.elapsed=audio.currentTime||0;save();lastPersist=Date.now()}
});
audio.addEventListener('seeking',()=>{
 if(!state.active||allowSeek||restoring)return;
 const target=state.active.elapsed||0;
 if(Math.abs(audio.currentTime-target)>6){allowSeek=true;audio.currentTime=target;allowSeek=false}
});
audio.addEventListener('ratechange',()=>{if(state.active&&audio.playbackRate!==1)audio.playbackRate=1});
audio.addEventListener('pause',()=>{if(state.active&&!audio.ended){els.resume.hidden=false;els.resume.textContent='▶ Reanudar audio'}});
audio.addEventListener('play',()=>{if(state.active)els.resume.hidden=true});
audio.addEventListener('ended',()=>{if(state.active)finished()});
audio.addEventListener('error',()=>{if(state.active){els.resume.hidden=false;els.resume.textContent='Reintentar audio'}});
window.addEventListener('pagehide',()=>{if(state.active){state.active.elapsed=audio.currentTime||0;save()}});
tick=setInterval(renderBreak,1000);
})();