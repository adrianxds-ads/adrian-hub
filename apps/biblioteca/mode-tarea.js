/* Biblioteca · Modo Tarea v1.1 — independent session history; original player remains unchanged. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY='adrianEasyCatalanTaskSessionsV1', LIVE='adrianEasyCatalanTaskLiveV1';
const audio=$('audio'), panel=$('taskPanel'), list=$('taskEpisodes'), original=$('episodes');
const els={normal:$('tabPodcasts'),task:$('tabTasks'),legend:$('libraryLegend'),empty:$('empty'),search:$('search'),sort:$('sortBtn'),sortLabel:$('sortLabel'),modal:$('taskSetup'),setupTitle:$('taskSetupTitle'),taskText:$('taskText'),setupButton:$('taskSetupButton'),setupCancel:$('taskSetupCancel'),stage:$('taskStage'),journey:$('taskJourney'),dino:$('taskDino'),progress:$('taskProgress'),clock:$('taskClock'),stageTitle:$('taskStageTitle'),stageTask:$('taskStageTask'),resume:$('taskResume'),exit:$('taskExit'),breakBox:$('taskBreak'),breakClock:$('taskBreakClock'),breakText:$('taskBreakText'),today:$('taskToday'),total:$('taskTotal'),minutes:$('taskMinutes'),chart:$('taskChart'),chartFull:$('taskChartFull'),chartOpen:$('taskChartOpen'),chartClose:$('taskChartClose'),chartDialog:$('taskChartDialog'),dayInfo:$('taskDayInfo'),dayInfoFull:$('taskDayInfoFull'),history:$('taskHistory'),openStats:$('taskStatsToggle'),stats:$('taskStatsDetails'),planner:$('taskPlanner'),slots:$('taskPlanSlots'),hint:$('taskPlanHint'),startPlan:$('taskPlanStart'),completed:$('taskCompleted'),setupPosition:$('taskSetupPosition'),stagePosition:$('taskStagePosition'),medals:$('taskMedals'),medalFraction:$('taskMedalFraction'),medalBar:$('taskMedalBar'),uniqueCount:$('taskUniqueCount')};
let catalog=null,chosen=null,lastPersist=0,allowSeek=false,restoring=false,tick=null,taskDescending=true;
let draft={count:1,steps:[null],slot:0},wake=null,wakePending=false,speechTimeout=null,speechCurrent=null;
const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
let state=parse(LIVE,{active:null,breakEnd:null,chain:null,queue:null,plan:null});
if(!state.plan&&!state.active&&state.breakEnd){state.breakEnd=null;state.queue=null;state.chain=null;try{localStorage.setItem(LIVE,JSON.stringify(state))}catch{}}
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
function audioUnlock(){
 try{
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  const ctx=window.__adAchievementAudio||(window.__adAchievementAudio=new AC());
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 }catch{}
}
async function keepScreenOn(){
 if(!state.active||wake||wakePending||document.visibilityState!=='visible'||!navigator.wakeLock?.request)return;
 wakePending=true;
 try{wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null})}catch{wake=null}
 finally{wakePending=false}
 if(!state.active&&wake)releaseScreen();
}
function releaseScreen(){const old=wake;wake=null;if(old)old.release().catch(()=>{})}
function say(message){
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
 try{
  const synth=window.speechSynthesis;
  synth.cancel();if(speechTimeout)clearTimeout(speechTimeout);
  const u=new SpeechSynthesisUtterance(message);
  u.lang='es-ES';u.rate=1;u.pitch=1;u.volume=.9;
  const voices=synth.getVoices?.()||[];
  u.voice=voices.find(v=>v.lang.toLowerCase()==='es-es')||voices.find(v=>v.lang.toLowerCase().startsWith('es'))||null;
  const oldVolume=audio.volume;
  if(!audio.paused)audio.volume=Math.min(oldVolume,.28);
  speechCurrent=u;
  const reset=()=>{if(speechCurrent!==u)return;speechCurrent=null;audio.volume=oldVolume;if(speechTimeout)clearTimeout(speechTimeout)};
  u.onend=reset;u.onerror=reset;
  speechTimeout=setTimeout(reset,6500);
  synth.speak(u);
 }catch{}
}
function silence(){try{window.speechSynthesis?.cancel()}catch{};if(speechTimeout)clearTimeout(speechTimeout);speechCurrent=null;audio.volume=1}
function victory(){try{window.AdrianAchievements?.play?.(null,15,15)}catch(e){console.warn('Gold sound not available',e)}}
function slots(){return state.plan?.steps||draft.steps}
function renderPlan(){
 const locked=!!(state.active||state.breakEnd);
 const count=state.plan?.steps.length||draft.count;
 els.planner.querySelectorAll('[data-task-count]').forEach(btn=>{
  btn.disabled=locked;btn.setAttribute('aria-pressed',String(Number(btn.dataset.taskCount)===count));
 });
 els.slots.innerHTML=slots().map((step,i)=>{
  const current=!locked&&draft.slot===i,done=!!step;
  return '<button type="button" class="task-slot '+(current?'task-slot-current ':'')+(done?'task-slot-filled':'')+'" data-task-slot="'+i+'" '+(locked?'disabled':'')+'>'+
   '<strong>'+(i+1)+'. '+(step?safe(step.task):'Elegir tarea')+'</strong>'+
   '<span>'+(step?'#'+step.episodeNumber+' · '+safe(catalog?.episodes.find(e=>e.number===step.episodeNumber)?.title||'Easy Catalan'):'Podcast por elegir')+'</span></button>';
 }).join('');
 els.slots.querySelectorAll('[data-task-slot]').forEach(b=>b.onclick=()=>{
  draft.slot=Number(b.dataset.taskSlot);renderPlan();
  document.getElementById('taskEpisodes').scrollIntoView({block:'nearest',behavior:'smooth'});
 });
 const ready=!locked&&draft.steps.length===draft.count&&draft.steps.every(Boolean);
 els.startPlan.hidden=!ready;
 els.hint.textContent=state.active?'Recorrido en marcha · '+(state.plan.index+1)+' de '+count:
  state.breakEnd?'Sesión de '+count+' tareas · descanso entre bloques':
  ready?'Todo preparado. Puedes empezar el recorrido.':
  'Elige un episodio para la tarea '+(draft.slot+1)+'. Orden: más reciente primero.';
}
function tabs(tab){
 const task=tab==='task';
 if(!task&&state.breakEnd&&state.plan){
  if(!confirm('¿Cancelar la sesión de tareas pendiente? El siguiente bloque no se iniciará.'))return;
  state.plan=null;state.breakEnd=null;state.chain=null;save();
 }
 if(task&&!state.active)window.LibraryOriginalStop?.();
 window.ModeTarea.selectedTab=tab;
 els.normal.setAttribute('aria-selected',String(!task));els.task.setAttribute('aria-selected',String(task));
 panel.hidden=!task;original.hidden=task;els.legend.hidden=task;
 els.sortLabel.textContent=task?(taskDescending?'233 → 1':'1 → 233'):(window.LibraryGetSort?.()==='desc'?'233 → 1':'1 → 233');
 if(task)els.empty.hidden=true;
 else {els.empty.hidden=true;if(typeof render==='function')render()}
 if(task){renderList();renderStats();renderBreak();renderPlan()}
}
function renderList(){
 if(!catalog)return;
 const q=norm(els.search.value).trim();
 let rows=catalog.episodes.filter(e=>!q||norm(e.number+' '+e.title+' '+e.summary).includes(q));
 if(taskDescending)rows=rows.slice().reverse();
 const tasks=window.PodcastCounts?.taskCounts?.()||{},normal=window.PodcastCounts?.normalCounts?.()||{};
 const flags=new Set((()=>{try{return JSON.parse(localStorage.getItem('adrianLibraryEasyCatalanV1')||'[]').map(Number)}catch{return []}})());
 list.innerHTML=rows.map(e=>{
  const work=tasks[e.number]||0,ordinary=Math.max(0,Number(normal[e.number])||0),listened=ordinary>0||flags.has(e.number);
  const annotation=work?'<div class="task-tally">🏁 Completado '+work+' '+(work===1?'vez':'veces')+' en Modo Tarea</div>':
     listened?'<div class="task-tally task-listened">🎧 Ya escuchado en la Biblioteca · todavía sin tarea</div>':'';
  return '<article class="episode task-episode '+(work?'task-episode-done':'')+'"><button type="button" class="play-btn" data-task-episode="'+e.number+'" aria-label="Añadir episodio '+e.number+' a una tarea">▶</button><div class="episode-main"><div class="episode-top"><span class="episode-no">#'+e.number+'</span><h2 class="episode-title">'+safe(e.title)+'</h2></div><div class="meta">'+safe(e.duration||'')+' · Duración fija</div><p class="summary">'+safe(e.summary||'')+'</p>'+annotation+'</div><button type="button" class="task-select-btn '+(work?'task-select-done':'')+'" data-task-episode="'+e.number+'" aria-label="Elegir episodio '+e.number+' para trabajar">'+(work?'✓ '+work+' '+(work===1?'vez':'veces'):'＋')+'</button></article>';
 }).join('');
 $('taskEmpty').hidden=!!rows.length;
 list.querySelectorAll('[data-task-episode]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.taskEpisode))));
}
function choose(n){
 if(state.active||state.breakEnd)return;
 chosen=catalog?.episodes.find(e=>e.number===n);
 if(!chosen?.audio)return;
 els.setupTitle.textContent='#'+chosen.number+' · '+chosen.title+' · '+(chosen.duration||'');
 els.setupPosition.textContent='MODO TAREA · '+(draft.slot+1)+' DE '+draft.count;
 els.taskText.value=draft.steps[draft.slot]?.task||'';
 els.setupButton.textContent=draft.count===1?'Iniciar recorrido':'Guardar tarea '+(draft.slot+1)+'/'+draft.count;
 els.modal.hidden=false;els.taskText.focus();
}
function closeSetup(){els.modal.hidden=true}
function submitSetup(){
 const task=els.taskText.value.trim().slice(0,130);
 if(!task){els.taskText.focus();els.taskText.setCustomValidity('Escribe una tarea breve');els.taskText.reportValidity();return}
 els.taskText.setCustomValidity('');
 if(!chosen||state.active||state.breakEnd)return;
 draft.steps[draft.slot]={episodeNumber:chosen.number,task};
 closeSetup();renderPlan();
 if(draft.count===1){startPlan();return}
 const next=draft.steps.findIndex(x=>!x);
 if(next>=0){draft.slot=next;renderPlan()}
 else{els.startPlan.hidden=false;els.startPlan.focus();els.hint.textContent='Las '+draft.count+' tareas están preparadas. Pulsa Empezar recorrido.'}
}
function startPlan(){
 if(state.active||state.breakEnd||draft.steps.length!==draft.count||!draft.steps.every(Boolean))return;
 const chain=identifier();
 state.plan={steps:draft.steps.map(x=>({...x})),index:0,chain};
 state.chain=chain;state.queue=null;save();
 els.completed.hidden=true;renderPlan();audioUnlock();
 begin(state.plan.steps[0]);
}
function begin(prepared){
 const e=catalog?.episodes.find(x=>x.number===prepared?.episodeNumber);
 if(!e?.audio)return;
 window.LibraryOriginalStop?.();
 const index=state.plan?.index||0,total=state.plan?.steps.length||1;
 state.active={id:identifier(),episodeNumber:e.number,title:e.title,task:prepared.task,startedAt:new Date().toISOString(),elapsed:0,duration:seconds(e.duration),chain:state.plan?.chain||identifier(),halfAnnounced:false,position:index+1,total};
 state.chain=state.active.chain;state.breakEnd=null;state.queue=null;save();
 audio.onloadedmetadata=null;audio.src=e.audio;audio.playbackRate=1;audio.controls=false;
 window.ModeTarea.playing=true;
 els.stage.hidden=false;els.resume.hidden=true;els.stageTitle.textContent='#'+e.number+' · '+e.title;els.stageTask.textContent=prepared.task;
 els.stagePosition.textContent=(index+1)+'/'+total;els.completed.hidden=true;
 updateJourney();keepScreenOn();
 const playPromise=audio.play();
 if(playPromise?.then)playPromise.then(()=>say('Comenzamos la tarea '+(index+1)+' de '+total+'. Dispones de '+Math.round(seconds(e.duration)/60)+' minutos. ¡Adelante!')).catch(()=>{els.resume.hidden=false;els.resume.textContent='▶ Reanudar audio';});
 renderBreak();renderPlan();
}
function restore(){
 if(state.active){
  if(!state.plan)state.plan={steps:[{episodeNumber:state.active.episodeNumber,task:state.active.task}],index:0,chain:state.active.chain||identifier()};
  const e=catalog?.episodes.find(x=>x.number===state.active.episodeNumber);
  if(e?.audio){
   window.LibraryOriginalStop?.();window.ModeTarea.playing=true;restoring=true;allowSeek=true;
   audio.onloadedmetadata=null;audio.src=e.audio;audio.playbackRate=1;
   els.stageTitle.textContent='#'+e.number+' · '+e.title;els.stageTask.textContent=state.active.task;
   els.stagePosition.textContent=(state.plan.index+1)+'/'+state.plan.steps.length;
   els.stage.hidden=false;els.resume.hidden=false;els.resume.textContent='▶ Reanudar después de la interrupción';
   const pos=state.active.elapsed||0;
   audio.addEventListener('loadedmetadata',function loaded(){
    audio.removeEventListener('loadedmetadata',loaded);
    audio.currentTime=Math.min(pos,Math.max(0,audio.duration-3));
    allowSeek=false;restoring=false;updateJourney();
   },{once:true});keepScreenOn();
  }else{state.active=null;state.plan=null;save()}
 }
 if(state.breakEnd){
  if(!state.plan){state.breakEnd=null;state.queue=null;save()}
  else renderBreak();
 }
 renderPlan();
}
function updateJourney(){
 if(!state.active)return;
 const actual=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:state.active.duration;
 const pct=actual?Math.min(100,Math.max(0,(audio.currentTime||0)/actual*100)):0;
 els.dino.style.left='calc('+(pct*.88+3)+'% - 16px)';
 els.progress.style.width=pct+'%';
 els.journey.setAttribute('aria-valuenow',String(Math.floor(pct)));
 els.clock.textContent=fmt(Math.max(0,actual-(audio.currentTime||0)))+' restantes';
 if(pct>=50&&!state.active.halfAnnounced&&!audio.paused){
  state.active.halfAnnounced=true;save();
  say('Has llegado a la mitad. Sigue así, ya queda la otra mitad.');
 }
}
function finished(){
 const a=state.active;if(!a)return;
 const arr=logs();
 arr.push({id:a.id,episodeNumber:a.episodeNumber,title:a.title,task:a.task,startedAt:a.startedAt,endedAt:new Date().toISOString(),seconds:Math.round(Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:(a.duration||audio.currentTime||0)),status:'completado',chain:a.chain,position:a.position,total:a.total});
 saveLogs(arr);
 const next=state.plan&&state.plan.index+1<state.plan.steps.length;
 state.active=null;window.ModeTarea.playing=false;releaseScreen();
 if(next){state.plan.index++;state.breakEnd=Date.now()+ms;state.chain=state.plan.chain}
 else{state.plan=null;state.breakEnd=null;state.queue=null;state.chain=null;draft={count:1,steps:[null],slot:0}}
 save();
 els.stage.hidden=true;renderStats();renderList();renderBreak();renderPlan();tabs('task');
 els.completed.hidden=false;
 els.completed.textContent=next?'✓ Tarea '+a.position+' de '+a.total+' completada. Descanso de 10 minutos antes de la siguiente.':'🏁 ¡Tarea completada! '+(a.total>1?'Has terminado los '+a.total+' bloques.':'Un bloque más conseguido.');
 victory();say('¡Enhorabuena! Tarea completada.'+(next?' Ahora, diez minutos de descanso.':' Has llegado a la meta.'));
 if(typeof toggleDone==='function')toggleDone(a.episodeNumber,true);
}
function stop(){
 if(!state.active||!confirm('¿Salir de este recorrido? La sesión se interrumpirá y no contará como completada.'))return;
 const a=state.active,arr=logs();
 arr.push({id:a.id,episodeNumber:a.episodeNumber,title:a.title,task:a.task,startedAt:a.startedAt,endedAt:new Date().toISOString(),seconds:Math.round(audio.currentTime||a.elapsed||0),status:'interrumpido',chain:a.chain,position:a.position,total:a.total});
 saveLogs(arr);silence();audio.pause();audio.removeAttribute('src');audio.load();
 state.active=null;state.queue=null;state.breakEnd=null;state.chain=null;state.plan=null;window.ModeTarea.playing=false;releaseScreen();
 draft={count:1,steps:[null],slot:0};els.stage.hidden=true;save();renderStats();renderBreak();renderPlan();
}
function renderBreak(){
 if(state.active||!state.breakEnd||!state.plan){els.breakBox.hidden=true;return}
 const left=Math.max(0,Math.ceil((state.breakEnd-Date.now())/1000));
 if(!left){
  state.breakEnd=null;save();els.breakBox.hidden=true;
  const next=state.plan.steps[state.plan.index];
  if(next)begin(next);
  return;
 }
 els.breakBox.hidden=false;els.breakClock.textContent=fmt(left);
 const upcoming=state.plan.steps[state.plan.index];
 els.breakText.textContent='Siguiente tarea: '+upcoming.task+' · episodio #'+upcoming.episodeNumber+'. Comenzará cuando termine el descanso.';
}
function renderStats(){
 const done=logs().filter(x=>x.status==='completado'),all=logs();
 els.today.textContent=done.filter(x=>day(x.endedAt)===day(Date.now())).length;
 els.total.textContent=done.length;
 const dedup=new Set(),unique=new Set();
 for(const row of done){if(row.id&&dedup.has(row.id))continue;if(row.id)dedup.add(row.id);unique.add(Number(row.episodeNumber))}
 const completed=dedup.size+done.filter(x=>!x.id).length;
 els.medals.textContent=String(Math.floor(completed/15));
 els.medalFraction.textContent=(completed%15)+'/15';
 els.medalBar.value=completed%15;
 els.uniqueCount.textContent=unique.size+' '+(unique.size===1?'episodio utilizado':'episodios utilizados')+' para tareas';
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
els.sort.addEventListener('click',e=>{
 if(window.ModeTarea.selectedTab!=='task')return;
 e.stopImmediatePropagation();taskDescending=!taskDescending;
 els.sortLabel.textContent=taskDescending?'233 → 1':'1 → 233';
 renderList();
},true);
els.planner.querySelectorAll('[data-task-count]').forEach(btn=>btn.onclick=()=>{
 if(state.active||state.breakEnd)return;
 const count=Number(btn.dataset.taskCount);
 draft={count,steps:Array.from({length:count},(_,i)=>draft.steps[i]||null),slot:Math.min(draft.slot,count-1)};
 const empty=draft.steps.findIndex(x=>!x);if(empty>=0)draft.slot=empty;
 els.completed.hidden=true;renderPlan();
});
els.startPlan.onclick=startPlan;
els.setupCancel.onclick=closeSetup;
els.setupButton.onclick=submitSetup;
els.taskText.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitSetup()}});
els.taskText.addEventListener('input',()=>els.taskText.setCustomValidity(''));
els.modal.addEventListener('click',e=>{if(e.target===els.modal)closeSetup()});
els.exit.onclick=stop;
els.resume.onclick=()=>{audioUnlock();keepScreenOn();audio.play().then(()=>{els.resume.hidden=true}).catch(()=>{els.resume.hidden=false})};
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
window.addEventListener('pagehide',()=>{if(state.active){state.active.elapsed=audio.currentTime||0;save()}releaseScreen()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.active)keepScreenOn()});
tick=setInterval(renderBreak,1000);
renderPlan();
})();