const STORE='cambioHistoryV2',OLD_STORE='cambioHistoryV1',ACTIVE='cambioActiveV2',CUSTOM='cambioCustomTasksV1',TASKS='cambioTaskLibraryV1',SETTINGS='cambioSettingsV1';
const DURATIONS=[10,15,25,45,60];
const DEFAULT_TASKS=[
  {id:'laundry',name:'Sacar ropa de la lavadora y tender',aliases:['Sacar la ropa de la lavadora'],sub:'Lavadora · tender',category:'Casa',minutes:10},
  {id:'dishes',name:'Lavar los platos',sub:'Cocina · dejar fregadero libre',category:'Casa',minutes:15},
  {id:'tidy',name:'Recoger un poco',aliases:['Limpieza'],sub:'Quince minutos de orden visible',category:'Casa',minutes:15},
  {id:'living',name:'Despejar el salón',sub:'Recoger superficies y suelo',category:'Casa',minutes:15},
  {id:'kitchen',name:'Recoger la cocina',sub:'Orden rápido de cocina',category:'Casa',minutes:20},
  {id:'bathroom',name:'Recoger el baño',sub:'Orden rápido de baño',category:'Casa',minutes:20},
  {id:'hoti',name:'Hacer el curso HOTI0108',aliases:['HOTI0108'],sub:'Abrir la siguiente tarea y avanzar',category:'Curso',minutes:25},
  {id:'english',name:'Estudiar inglés',sub:'Entrenamiento de inglés',category:'Idiomas',minutes:25},
  {id:'anki',name:'Hacer Anki',aliases:['Anki'],sub:'Tarjetas, no configurar el sistema',category:'Idiomas',minutes:15},
  {id:'empleo',name:'Buscar trabajo',sub:'Abrir ofertas y actuar',category:'Trabajo',minutes:25},
  {id:'gym',name:'Gimnasio',sub:'Prepararte, salir y entrenar',category:'Salud',minutes:60}
];
const $=s=>document.querySelector(s);
const AVS=window.ADRIAN_VISUAL_SYSTEM?.ranks||[];
const els={
  choose:$('#chooseView'),timerView:$('#timerView'),libraryPanel:$('#libraryPanel'),targets:$('#targets'),archiveList:$('#archiveList'),archiveCount:$('#archiveCount'),libraryCount:$('#libraryCount'),
  custom:$('#customTask'),customBtn:$('#customBtn'),chips:$('#durationChips'),minutes:$('#minutesInput'),transition:$('#transitionInput'),prep:$('#prepInput'),
  voice:$('#voiceBtn'),ticks:$('#ticksBtn'),start:$('#startBtn'),phase:$('#phaseLabel'),title:$('#targetTitle'),timer:$('#timer'),timerStage:$('#timerStage'),sub:$('#timerSub'),
  ring:$('#timerRing'),instruction:$('#instruction'),coach:$('#coachLine'),next:$('#nextBtn'),addTime:$('#addTimeBtn'),finish:$('#finishBtn'),cancel:$('#cancelBtn'),
  history:$('#history'),today:$('#todayCount'),week:$('#weekCount'),total:$('#totalCount'),dailyScore:$('#dailyScore'),dailyRank:$('#dailyRank'),dailySteps:$('#dailySteps'),
  dailyChart:$('#dailyChart'),dayStamp:$('#dayStamp')
};
let selected=null,active=null,tickId=null,audioCtx=null,lastTickSecond=null,wakeLock=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dayKey=d=>new Date(d).toLocaleDateString('sv-SE');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,' ').trim();
const makeId=name=>'task-'+norm(name).replace(/\s+/g,'-').slice(0,42)+'-'+Date.now().toString(36).slice(-5);
function loadJSON(k,fallback){try{return JSON.parse(localStorage.getItem(k)||'null')??fallback}catch{return fallback}}
function history(){
  const current=loadJSON(STORE,null);if(current)return current;
  return loadJSON(OLD_STORE,[]).map(x=>({...x,name:x.target||x.name,plannedMinutes:x.plannedMinutes||null}));
}
function saveHistory(rows){localStorage.setItem(STORE,JSON.stringify(rows.slice(0,500)))}
function settings(){return {...{voice:true,ticks:true,transitionMin:2,prepMin:5},...loadJSON(SETTINGS,{}),coachName:'Adri'}}
function saveSettings(x){localStorage.setItem(SETTINGS,JSON.stringify(x))}
function buildInitialLibrary(){
  const now=new Date().toISOString(),base=DEFAULT_TASKS.map((x,i)=>({...x,archived:false,order:i,createdAt:now}));
  const names=new Set(base.flatMap(x=>[norm(x.name),...(x.aliases||[]).map(norm)]));
  const oldCustom=loadJSON(CUSTOM,[]);
  oldCustom.forEach((x,i)=>{
    if(!x?.name||names.has(norm(x.name)))return;
    base.push({id:makeId(x.name),name:x.name,sub:'Tarea creada por Adri',category:'Personal',minutes:clamp(Math.round(Number(x.minutes)||25),1,240),archived:false,order:100+i,createdAt:now});
    names.add(norm(x.name));
  });
  history().forEach((r,i)=>{
    const name=r.name||r.target;if(!name||names.has(norm(name)))return;
    base.push({id:makeId(name),name,sub:'Tarea histórica',category:'Archivo',minutes:clamp(Math.round(Number(r.plannedMinutes)||25),1,240),archived:true,order:1000+i,createdAt:r.completedAt||now});
    names.add(norm(name));
  });
  localStorage.setItem(TASKS,JSON.stringify(base));return base;
}
function taskLibrary(){const x=loadJSON(TASKS,null);return Array.isArray(x)&&x.length?x:buildInitialLibrary()}
function saveTaskLibrary(rows){localStorage.setItem(TASKS,JSON.stringify(rows))}
function taskMatchesHistory(t,r){
  if(r.taskId===t.id)return true;if(r.taskId)return false;
  const names=[t.name,...(t.aliases||[])].map(norm);return names.includes(norm(r.name||r.target));
}
function taskCount(t){return history().filter(r=>taskMatchesHistory(t,r)).length}
function taskLast(t){
  const rows=history().filter(r=>taskMatchesHistory(t,r));
  if(!rows.length)return null;return new Date(rows.reduce((a,b)=>new Date(a.completedAt)>new Date(b.completedAt)?a:b).completedAt);
}
function taskById(id){return taskLibrary().find(x=>x.id===id)||null}
function upsertTask(name,minutes){
  const rows=taskLibrary(),key=norm(name),found=rows.find(x=>norm(x.name)===key);
  if(found){found.archived=false;found.minutes=minutes;found.sub=found.sub||'Tarea personal';saveTaskLibrary(rows);return found}
  const maxOrder=Math.max(100,...rows.map(x=>Number(x.order)||0));
  const t={id:makeId(name),name,sub:'Tarea creada por Adri',category:'Personal',minutes,archived:false,order:maxOrder+1,createdAt:new Date().toISOString()};
  rows.push(t);saveTaskLibrary(rows);return t;
}
function setArchived(id,value){
  const rows=taskLibrary(),t=rows.find(x=>x.id===id);if(!t)return;
  t.archived=!!value;saveTaskLibrary(rows);
  if(selected?.id===id){selected=null;els.start.disabled=true}
  renderLibrary();
}
function taskCycleVisual(t){
  const count=taskCount(t);let rank=1,completedCycles=0;
  if(count>0){const rem=count%15;if(rem===0){rank=15;completedCycles=Math.max(0,Math.floor(count/15)-1)}else{rank=rem;completedCycles=Math.floor(count/15)}}
  const ri=rankInfo(rank),rings=Math.min(completedCycles,3),layers=[];
  for(let i=0;i<rings;i++){const a=2+i*5;layers.push(`inset 0 0 0 ${a}px #E7BF57`);if(i<rings-1)layers.push(`inset 0 0 0 ${a+3}px #142126`)}
  return {count,rank,ri,completedCycles,shadow:layers.join(',')};
}
function taskCardHtml(t){
  const v=taskCycleVisual(t),last=taskLast(t),sel=selected?.id===t.id;
  const countText=v.count===1?'HECHA 1 VEZ':`HECHA ${v.count} VECES`,lastText=last?` · última ${last.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}`:'';
  const cycleText=v.completedCycles?` · ${v.completedCycles} ${v.completedCycles===1?'CICLO ORO':'CICLOS ORO'}`:'';
  const style=`--task-color:${v.ri.color};--task-text:${v.ri.text};${v.shadow?`box-shadow:${v.shadow};`:''}`;
  return `<article class="task-card ${sel?'selected':''}" data-id="${esc(t.id)}" style="${style}">
    <button class="task-main" data-task="${esc(t.id)}"><span><i class="task-color-dot"></i>${esc(t.category||'Tarea')} · ${v.rank}/15</span><b>${esc(t.name)}</b><small>${esc(t.sub||'')}</small><em>${countText}${esc(lastText)}${cycleText}</em></button>
    <button class="task-archive" data-archive="${esc(t.id)}" title="Archivar">ARCHIVAR</button>
  </article>`;
}
function renderLibrary(){
  const rows=taskLibrary().sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)),activeRows=rows.filter(x=>!x.archived),archived=rows.filter(x=>x.archived);
  els.libraryCount.textContent=`${activeRows.length} activas`;els.archiveCount.textContent=String(archived.length);
  els.targets.innerHTML=activeRows.map(taskCardHtml).join('');
  els.targets.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{const t=taskById(b.dataset.task);if(t)selectTarget(t)});
  els.targets.querySelectorAll('[data-archive]').forEach(b=>b.onclick=e=>{e.stopPropagation();setArchived(b.dataset.archive,true)});
  els.archiveList.innerHTML=archived.length?archived.map(t=>{
    const count=taskCount(t),last=taskLast(t);
    return `<div class="archived-task"><div><b>${esc(t.name)}</b><small>${count===1?'Hecha 1 vez':`Hecha ${count} veces`}${last?' · '+last.toLocaleDateString('es-ES'):''}</small></div><button data-restore="${esc(t.id)}">RECUPERAR</button></div>`;
  }).join(''):'<div class="archive-empty">No hay tareas archivadas.</div>';
  els.archiveList.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>setArchived(b.dataset.restore,false));
}
function renderDurations(){
  const n=Number(els.minutes.value)||25;
  els.chips.innerHTML=DURATIONS.map(x=>`<button class="duration-chip ${x===n?'selected':''}" data-min="${x}">${x} min</button>`).join('');
  els.chips.querySelectorAll('.duration-chip').forEach(b=>b.onclick=()=>setMinutes(Number(b.dataset.min)));
}
function renderControls(){
  const s=settings();
  els.transition.value=clamp(Math.round(Number(s.transitionMin)||2),1,10);
  els.prep.value=clamp(Math.round(Number(s.prepMin)||5),1,15);
  els.voice.classList.toggle('active',s.voice);els.voice.textContent=`VOZ · ${s.voice?'SÍ':'NO'}`;
  els.ticks.classList.toggle('active',s.ticks);els.ticks.textContent=`TIC-TAC · ${s.ticks?'SÍ':'NO'}`;
  els.start.textContent=`EMPEZAR CAMBIO · ${els.transition.value} MIN`;
}
function setMinutes(n){els.minutes.value=clamp(Math.round(Number(n)||25),1,240);renderDurations()}
function selectTarget(t){
  selected=t;els.start.disabled=false;setMinutes(t.minutes||25);
  els.targets.querySelectorAll('.task-card').forEach(x=>x.classList.toggle('selected',x.dataset.id===t.id));
  if(els.libraryCount)els.libraryCount.textContent='✓ '+t.name;
  if(els.libraryPanel)els.libraryPanel.open=false;
}
function updatePreamble(){
  const s=settings();s.transitionMin=clamp(Math.round(Number(els.transition.value)||2),1,10);s.prepMin=clamp(Math.round(Number(els.prep.value)||5),1,15);saveSettings(s);renderControls();
}
const COACH={
 transition:[
  c=>`Venga, ${c.name}. Deja lo que estabas haciendo y muévete a ${c.task}.`,
  c=>`${c.name}, sabes que lo tienes que hacer. Levántate ya y cambiamos a ${c.task}.`,
  c=>`Vamos, ${c.name}. No hace falta pensarlo más. Ahora toca ${c.task}.`,
  c=>`${c.name}, solo tienes que levantarte. Lo demás viene después.`,
  c=>`Venga, fuera de aquí. ${c.name}, en ${c.mins} minutos estamos con ${c.task}.`,
  c=>`${c.name}, cambio de pantalla, cambio de tarea. Vamos con ${c.task}.`
 ],
 prep:[
  c=>`Bien, ${c.name}. Prepara solo lo necesario para ${c.task}.`,
  c=>`${c.name}, nada de montar otro sistema. Deja ${c.task} listo y empieza.`,
  c=>`Venga, ${c.name}. Tienes ${c.mins} minutos para colocarte y arrancar.`,
  c=>`Ya estás en el sitio, ${c.name}. Ahora prepara lo mínimo y entra en ${c.task}.`,
  c=>`Una cosa cada vez, ${c.name}. Ahora solo preparar ${c.task}.`
 ],
 task:[
  c=>`${c.name}, ya está. Ahora solo ${c.task}. Lo demás puede esperar.`,
  c=>`Venga, ${c.name}. Empieza. No hace falta hacerlo perfecto; hace falta hacerlo.`,
  c=>`${c.name}, ya has cruzado la parte difícil. Sigue con ${c.task}.`,
  c=>`Ahora sí, ${c.name}: ${c.task}. Sin cambiar de carril.`,
  c=>`Vamos, ${c.name}. ${c.minutes} minutos para esta tarea y nada más.`
 ],
 five:[
  c=>`${c.name}, te quedan cinco minutos. Quédate exactamente con la misma tarea.`,
  c=>`Últimos cinco, ${c.name}. No abras nada nuevo; termina este bloque.`,
  c=>`${c.name}, cinco minutos más. Mantén el carril.`
 ],
 done:[
  c=>`Bien, ${c.name}. Otra hecha. Llevas ${c.n} de quince hoy.`,
  c=>`Eso es, ${c.name}. ${c.task} fuera. Van ${c.n} tareas hoy.`,
  c=>`${c.name}, hecha y guardada. Un punto más: ${c.n} de quince.`,
  c=>`Muy bien, ${c.name}. Ya no está pendiente. Llevas ${c.n}.`,
  c=>`Perfecto, ${c.name}. Una menos en la cabeza y una más en el diario.`
 ]
};
const coachLast={};
function coachText(kind,extra={}){
  const arr=COACH[kind]||[],s=settings(),ctx={name:s.coachName||'Adri',task:active?.target?.name||extra.task||'la tarea',mins:extra.mins||'',minutes:active?.plannedMinutes||extra.minutes||'',n:extra.n||0};
  if(!arr.length)return '';
  let i=Math.floor(Math.random()*arr.length);if(arr.length>1&&i===coachLast[kind])i=(i+1)%arr.length;coachLast[kind]=i;
  return arr[i](ctx);
}
function setCoach(kind,extra={},speakIt=true){
  const text=coachText(kind,extra);if(els.coach)els.coach.textContent=text;if(speakIt&&text)speak(text);return text;
}
async function ensureAudio(){
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')await audioCtx.resume();return audioCtx.state==='running'}catch{return false}
}
function tone(f,dur=.03,gain=.018,type='sine',delay=0){
  if(!audioCtx||audioCtx.state!=='running')return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.value=f;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01);
}
function playTick(strong=false,step=0){if(!settings().ticks)return;const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.04:.028,strong?.026:.015,'square')}
function playDone(){[392,523.25,659.25,783.99].forEach((f,i)=>tone(f,i===3?.16:.08,i===3?.03:.022,i%2?'sine':'triangle',i*.08))}
function playAlarm(){[880,1174.66,1567.98,1174.66,1567.98].forEach((f,i)=>tone(f,.12,.035,i%2?'triangle':'sine',i*.16))}
function speak(text,rate=1.12){
  if(!settings().voice||!('speechSynthesis'in window))return;
  if(speechSynthesis.speaking)speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=rate;u.volume=.9;
  const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='es-ES'&&/(Google|Natural|Microsoft)/i.test(v.name))||voices.find(v=>v.lang?.toLowerCase().startsWith('es'))||null;speechSynthesis.speak(u);
}
async function acquireWakeLock(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch{}}
function releaseWakeLock(){try{wakeLock?.release()}catch{}wakeLock=null}
function persistActive(){localStorage.setItem(ACTIVE,JSON.stringify(active))}
function restoreActive(){active=loadJSON(ACTIVE,null)}
function phaseTotal(phase){
  if(phase==='transition')return (active?.transitionMin??settings().transitionMin??2)*60000;
  if(phase==='prep')return (active?.prepMin??settings().prepMin??5)*60000;
  return (active?.plannedMinutes||25)*60000;
}
function format(ms){const s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60),r=s%60;return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`}
async function startTransition(){
  if(!selected)return;
  const s=settings(),plannedMinutes=clamp(Math.round(Number(els.minutes.value)||25),1,240),transitionMin=clamp(Math.round(Number(s.transitionMin)||2),1,10),prepMin=clamp(Math.round(Number(s.prepMin)||5),1,15);
  await ensureAudio();await acquireWakeLock();
  active={target:{name:selected.name,id:selected.id},plannedMinutes,transitionMin,prepMin,extensionMinutes:0,phase:'transition',startedAt:Date.now(),phaseStartedAt:Date.now(),deadline:Date.now()+transitionMin*60000};
  const lib=taskLibrary(),t=lib.find(x=>x.id===selected.id);if(t){t.minutes=plannedMinutes;t.lastUsedAt=new Date().toISOString();saveTaskLibrary(lib)}
  persistActive();showActive();runTimer();setCoach('transition',{mins:transitionMin});
}
function setPhase(phase){
  if(!active)return;const now=Date.now();active.phase=phase;active.phaseStartedAt=now;active.deadline=now+phaseTotal(phase);lastTickSecond=null;
  if(phase==='task'&&!active.taskStartedAt)active.taskStartedAt=now;
  persistActive();showActive();runTimer();
  if(phase==='prep')setCoach('prep',{mins:active.prepMin});
  if(phase==='task')setCoach('task');
}
function advancePhase(){
  if(!active)return;
  if(active.phase==='transition')setPhase('prep');
  else if(active.phase==='prep')setPhase('task');
  else completeTask(false);
}
function cancelActive(){
  active=null;localStorage.removeItem(ACTIVE);clearInterval(tickId);tickId=null;releaseWakeLock();
  if('speechSynthesis'in window)speechSynthesis.cancel();
  els.timerView.classList.add('hidden');els.choose.classList.remove('hidden');selected=null;els.start.disabled=true;renderLibrary();
}
function showActive(){
  els.choose.classList.add('hidden');els.timerView.classList.remove('hidden');els.title.textContent=active.target.name;
  els.next.classList.remove('hidden');els.addTime.classList.add('hidden');els.finish.classList.add('hidden');els.next.disabled=false;
  if(active.phase==='transition'){
    els.phase.textContent='2 · DESPEGA';els.sub.textContent=`${active.transitionMin||settings().transitionMin} MIN · TRANSICIÓN`;els.next.textContent='LISTO · IR A PREPARAR';
    els.instruction.textContent='Cierra lo anterior, levántate y muévete hacia la nueva tarea.';
  }else if(active.phase==='prep'){
    els.phase.textContent='3 · ATERRIZA';els.sub.textContent=`${active.prepMin||settings().prepMin} MIN · PREPARACIÓN`;els.next.textContent='YA ESTOY LISTO · EMPEZAR';
    els.instruction.textContent='Prepara solo lo necesario. No optimices el sistema: deja la tarea lista para hacer.';
  }else{
    const extra=active.extensionMinutes?` · +${active.extensionMinutes} EXTRA`:'';
    els.phase.textContent='4 · HAZ LA TAREA';els.sub.textContent=`${active.plannedMinutes} MIN${extra}`;els.next.classList.add('hidden');els.addTime.classList.remove('hidden');els.finish.classList.remove('hidden');
    els.instruction.textContent='Ya no hay que preparar nada. Haz únicamente la tarea que elegiste.';
  }
}
function extendTask(){
  if(!active||active.phase!=='task')return;
  active.extensionMinutes=(active.extensionMinutes||0)+15;active.plannedMinutes+=15;active.deadline+=15*60000;active.fiveMinuteCue=false;
  persistActive();showActive();speak('Vale, Adri. Quince minutos más. Sigue con la misma tarea.');
}
function paintTimer(left,total){
  const remaining=clamp(Math.max(0,left)/Math.max(1,total),0,1),elapsed=1-remaining;
  const rank=elapsed>=.9999?15:clamp(1+Math.floor(Math.pow(elapsed,.65)*14),1,15),ri=rankInfo(rank);
  const fg=rank>=10?'#071014':'#F6FBFC';
  els.ring.style.setProperty('--timer-color',ri.color);els.ring.style.setProperty('--timer-fg',fg);els.ring.style.setProperty('--timer-progress',(elapsed*100).toFixed(2));
  els.timerStage.textContent=`${ri.name.toLocaleUpperCase('es')} · ${rank}/15`;
}
function runTimer(){
  clearInterval(tickId);lastTickSecond=null;
  const update=()=>{
    if(!active)return;
    const left=active.deadline-Date.now(),total=phaseTotal(active.phase);
    els.timer.textContent=format(left);paintTimer(left,total);
    const sec=Math.ceil(left/1000);
    if(left>0&&sec<=10&&sec!==lastTickSecond){lastTickSecond=sec;playTick(sec<=3,sec)}
    if(active.phase==='task'&&active.plannedMinutes>5&&left<=5*60000&&!active.fiveMinuteCue){
      active.fiveMinuteCue=true;persistActive();setCoach('five');
    }
    if(left>0)return;
    if(active.phase==='task'){playAlarm();completeTask(false,true);return}
    advancePhase();
  };
  const phaseAtStart=active?.phase;update();if(active&&active.phase===phaseAtStart)tickId=setInterval(update,250);
}
function completeTask(early=false,expired=false){
  if(!active)return;
  const now=Date.now(),actualMs=active.taskStartedAt?Math.max(0,now-active.taskStartedAt):0,rows=history(),taskId=active.target.id,name=active.target.name;
  rows.unshift({id:now.toString(36),taskId,name,completedAt:new Date(now).toISOString(),taskStartedAt:active.taskStartedAt?new Date(active.taskStartedAt).toISOString():null,transitionStartedAt:new Date(active.startedAt).toISOString(),plannedMinutes:active.plannedMinutes,extensionMinutes:active.extensionMinutes||0,actualMinutes:Math.max(1,Math.round(actualMs/60000)),early});
  saveHistory(rows);
  const todayN=rows.filter(r=>dayKey(r.completedAt)===dayKey(now)).length,coachName='Adri';
  active=null;localStorage.removeItem(ACTIVE);clearInterval(tickId);tickId=null;releaseWakeLock();
  els.timerView.classList.add('hidden');els.choose.classList.remove('hidden');selected=null;els.start.disabled=true;renderLibrary();drawStats();
  if(!expired)playDone();
  let msg;
  if(todayN===15)msg=`Día oro, ${coachName}. Quince tareas completadas hoy.`;
  else if(todayN>15)msg=`Hecho, ${coachName}. Llevas ${todayN} tareas hoy. Ya estás por encima del día oro.`;
  else{
    const variants=COACH.done,ctx={name:coachName,task:name,n:todayN},i=Math.floor(Math.random()*variants.length);msg=variants[i](ctx);
    if(expired)msg='Tiempo. '+msg;
  }
  setTimeout(()=>speak(msg),650);
}
function rankInfo(n){
  const fallback=['#422522','#512927','#632d2a','#762f32','#843729','#904311','#90570c','#8b6b05','#798136','#57965a','#32a48f','#4aa7c8','#7aa5ec','#bb9ef0','#e7bf57'];
  const i=clamp(Math.round(n||1),1,15)-1,x=AVS[i]||{};
  return {name:x.name||('Nivel '+(i+1)),color:x.color||fallback[i],band:x.band||x.color||fallback[i],text:x.text||'#eef5f7'};
}
function dailyChartHtml(rows){
  const sorted=[...rows].sort((a,b)=>new Date(a.completedAt)-new Date(b.completedAt));
  const w=720,h=420,L=48,R=18,T=20,B=48,maxY=15,now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime();
  const xFor=ts=>L+clamp((ts-start)/(end-start),0,1)*(w-L-R),yFor=v=>T+((maxY-clamp(v,0,maxY))/maxY)*(h-T-B);
  const bands=Array.from({length:15},(_,i)=>{const x=rankInfo(i+1);return `<rect x="${L}" y="${yFor(i+1)}" width="${w-L-R}" height="${Math.max(1,yFor(i)-yFor(i+1))}" fill="${x.band}" fill-opacity=".60"/>`}).join('');
  const grid=[0,5,10,15].map(v=>`<line x1="${L}" y1="${yFor(v)}" x2="${w-R}" y2="${yFor(v)}" stroke="rgba(255,255,255,.22)"/><text x="${L-10}" y="${yFor(v)+5}" text-anchor="end" fill="#c5d3d6" font-size="14" font-weight="900">${v}</text>`).join('');
  const hours=[0,6,12,18,24].map(hr=>{const ts=hr===24?end:new Date(now.getFullYear(),now.getMonth(),now.getDate(),hr).getTime();return `<text x="${xFor(ts)}" y="${h-14}" text-anchor="${hr===0?'start':hr===24?'end':'middle'}" fill="#b5c5c9" font-size="14" font-weight="850">${String(hr).padStart(2,'0')}:00</text>`}).join('');
  const pts=sorted.map((r,i)=>({r,v:i+1,x:xFor(new Date(r.completedAt).getTime()),y:yFor(Math.min(15,i+1))}));
  const shadow=pts.length>1?`<polyline points="${pts.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ')}" fill="none" stroke="#050806" stroke-opacity=".75" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`:'';
  const segments=pts.slice(1).map((q,i)=>`<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${q.x}" y2="${q.y}" stroke="${rankInfo(Math.min(15,q.v)).color}" stroke-width="4" stroke-linecap="round"/>`).join('');
  const dots=pts.map(q=>{const ri=rankInfo(Math.min(15,q.v)),time=new Date(q.r.completedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});return `<circle cx="${q.x}" cy="${q.y}" r="7" fill="${ri.color}" stroke="${ri.text}" stroke-width="2.5"><title>${q.v}. ${esc(q.r.name||q.r.target||'Tarea')} · ${time}</title></circle>`}).join('');
  const empty=!pts.length?`<text x="${(L+w-R)/2}" y="${h/2}" text-anchor="middle" fill="#9eb0b5" font-size="16" font-weight="850">TU PRIMERA TAREA PONDRÁ EL PRIMER PUNTO</text>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><rect x="${L}" y="${T}" width="${w-L-R}" height="${h-T-B}" rx="10" fill="#101815"/>${bands}${grid}<line x1="${L}" y1="${yFor(15)}" x2="${w-R}" y2="${yFor(15)}" stroke="#f1da9e" stroke-width="2" stroke-dasharray="7 6"/>${shadow}${segments}${dots}${hours}${empty}</svg>`;
}
function renderDaily(todayRows){
  const count=todayRows.length,rank=Math.min(15,count),ri=rank?rankInfo(rank):null;
  els.dailyScore.textContent=String(count);
  els.dailyRank.textContent=count>=15?`ORO · META 15${count>15?' +'+(count-15):''}`:rank?`${rank}/15 · ${ri.name.toLocaleUpperCase('es')}`:'EMPEZAMOS';
  els.dailyRank.style.color=ri?.text||'#c5d3d6';els.dailyRank.style.border=`1px solid ${ri?.color||'#35515b'}`;els.dailyRank.style.background=ri?.band||'#1a272c';
  els.dailySteps.innerHTML=Array.from({length:15},(_,i)=>{const x=rankInfo(i+1),done=i<count,current=i===Math.min(count,15)-1;return `<i class="daily-step ${done?'done':''} ${current?'current':''}" style="background:${x.color};color:${x.color}" title="${i+1} · ${esc(x.name)}"></i>`}).join('');
  els.dailyChart.innerHTML=dailyChartHtml(todayRows);
  els.dayStamp.textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}).toLocaleUpperCase('es');
}
function drawStats(){
  const rows=history(),today=dayKey(Date.now()),weekAgo=Date.now()-7*24*60*60000,todayRows=rows.filter(r=>dayKey(r.completedAt)===today);
  els.today.textContent=todayRows.length;els.week.textContent=rows.filter(r=>new Date(r.completedAt).getTime()>=weekAgo).length;els.total.textContent=rows.length;
  renderDaily(todayRows);
  els.history.innerHTML=rows.length?rows.slice(0,30).map(r=>{
    const when=new Date(r.completedAt),mins=r.actualMinutes||r.plannedMinutes,planned=r.plannedMinutes?` · objetivo ${r.plannedMinutes} min`:'';
    return `<div class="hist"><b>✓ ${esc(r.name||r.target||'Tarea')}</b><small>${esc(when.toLocaleString('es-ES'))}</small><em>${mins?`${mins} min realizados`:'Completada'}${planned}</em></div>`;
  }).join(''):'<div class="empty">Todavía no hay tareas terminadas. La primera aparecerá aquí.</div>';
}
els.customBtn.onclick=()=>{
  const name=els.custom.value.trim();if(!name)return;
  const minutes=clamp(Math.round(Number(els.minutes.value)||25),1,240),t=upsertTask(name,minutes);
  els.custom.value='';els.custom.blur();renderLibrary();selectTarget(t);
};
els.custom.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();els.customBtn.click()}});
els.minutes.addEventListener('change',()=>{setMinutes(els.minutes.value);if(selected){const lib=taskLibrary(),t=lib.find(x=>x.id===selected.id);if(t){t.minutes=Number(els.minutes.value);saveTaskLibrary(lib)}}});
els.transition.addEventListener('change',updatePreamble);els.prep.addEventListener('change',updatePreamble);
els.voice.onclick=()=>{const s=settings();s.voice=!s.voice;saveSettings(s);renderControls();if(s.voice)speak('Voz activada, Adri.')};
els.ticks.onclick=async()=>{const s=settings();s.ticks=!s.ticks;saveSettings(s);renderControls();if(s.ticks){await ensureAudio();playTick(true,0)}};
els.start.onclick=startTransition;els.cancel.onclick=cancelActive;els.next.onclick=advancePhase;els.addTime.onclick=extendTask;els.finish.onclick=()=>completeTask(true,false);
$('#resetBtn').onclick=()=>{localStorage.removeItem(STORE);localStorage.removeItem(OLD_STORE);drawStats();renderLibrary()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active)acquireWakeLock()});
taskLibrary();renderLibrary();renderDurations();renderControls();drawStats();restoreActive();
let renderedDay=dayKey(Date.now());setInterval(()=>{const d=dayKey(Date.now());if(d!==renderedDay){renderedDay=d;drawStats();renderLibrary()}},30000);
if(active){showActive();runTimer();acquireWakeLock();if(!els.coach.textContent)setCoach(active.phase==='task'?'task':active.phase==='prep'?'prep':'transition',{},false)}
