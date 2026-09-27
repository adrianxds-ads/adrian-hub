const STORE='cambioHistoryV2',OLD_STORE='cambioHistoryV1',ACTIVE='cambioActiveV2',CUSTOM='cambioCustomTasksV1',SETTINGS='cambioSettingsV1';
const TRANSITION_MS=2*60*1000,PREP_MS=5*60*1000,DURATIONS=[10,15,25,45,60];
const presets=[
  {id:'anki',name:'Anki',sub:'Hacer tarjetas, no configurar'},
  {id:'hoti',name:'HOTI0108',sub:'Entrar y hacer la siguiente tarea'},
  {id:'empleo',name:'Buscar trabajo',sub:'Abrir ofertas y actuar'},
  {id:'limpieza',name:'Limpieza',sub:'Una acción física concreta'},
  {id:'gym',name:'Gimnasio',sub:'Prepararte y salir'}
];
const $=s=>document.querySelector(s);
const AVS=window.ADRIAN_VISUAL_SYSTEM?.ranks||[];
const els={choose:$('#chooseView'),timerView:$('#timerView'),targets:$('#targets'),saved:$('#customSaved'),custom:$('#customTask'),customBtn:$('#customBtn'),chips:$('#durationChips'),minutes:$('#minutesInput'),voice:$('#voiceBtn'),ticks:$('#ticksBtn'),start:$('#startBtn'),phase:$('#phaseLabel'),title:$('#targetTitle'),timer:$('#timer'),sub:$('#timerSub'),ring:$('#timerRing'),instruction:$('#instruction'),next:$('#nextBtn'),finish:$('#finishBtn'),cancel:$('#cancelBtn'),history:$('#history'),today:$('#todayCount'),week:$('#weekCount'),total:$('#totalCount'),dailyScore:$('#dailyScore'),dailyRank:$('#dailyRank'),dailySteps:$('#dailySteps'),dailyChart:$('#dailyChart'),dayStamp:$('#dayStamp')};
let selected=null,active=null,tickId=null,audioCtx=null,lastTickSecond=null,wakeLock=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dayKey=d=>new Date(d).toLocaleDateString('sv-SE');
function loadJSON(k,fallback){try{return JSON.parse(localStorage.getItem(k)||'null')??fallback}catch{return fallback}}
function settings(){return {...{voice:true,ticks:true},...loadJSON(SETTINGS,{})}}
function saveSettings(x){localStorage.setItem(SETTINGS,JSON.stringify(x))}
function customTasks(){return loadJSON(CUSTOM,[])}
function history(){
  const current=loadJSON(STORE,null);if(current)return current;
  return loadJSON(OLD_STORE,[]).map(x=>({...x,name:x.target||x.name,plannedMinutes:x.plannedMinutes||null}));
}
function saveHistory(rows){localStorage.setItem(STORE,JSON.stringify(rows.slice(0,200)))}
function renderTargets(){
  els.targets.innerHTML=presets.map(t=>`<button class="target" data-id="${t.id}"><b>${esc(t.name)}</b><small>${esc(t.sub)}</small></button>`).join('');
  els.targets.querySelectorAll('.target').forEach(b=>b.onclick=()=>selectTarget(presets.find(t=>t.id===b.dataset.id)));
  renderSaved();renderDurations();renderAudio();
}
function renderSaved(){
  const rows=customTasks();
  els.saved.innerHTML=rows.map((t,i)=>`<button class="saved-target" data-i="${i}">${esc(t.name)}</button>`).join('');
  els.saved.querySelectorAll('.saved-target').forEach(b=>b.onclick=()=>{const t=rows[Number(b.dataset.i)];selectTarget({...t,id:'custom-'+Number(b.dataset.i),custom:true});setMinutes(t.minutes||25)});
}
function renderDurations(){
  const n=Number(els.minutes.value)||25;
  els.chips.innerHTML=DURATIONS.map(x=>`<button class="duration-chip ${x===n?'selected':''}" data-min="${x}">${x} min</button>`).join('');
  els.chips.querySelectorAll('.duration-chip').forEach(b=>b.onclick=()=>setMinutes(Number(b.dataset.min)));
}
function renderAudio(){
  const s=settings();
  els.voice.classList.toggle('active',s.voice);els.voice.textContent=`VOZ · ${s.voice?'SÍ':'NO'}`;
  els.ticks.classList.toggle('active',s.ticks);els.ticks.textContent=`TIC-TAC · ${s.ticks?'SÍ':'NO'}`;
}
function setMinutes(n){els.minutes.value=clamp(Math.round(Number(n)||25),1,240);renderDurations()}
function selectTarget(t){
  selected=t;els.start.disabled=!selected;
  els.targets.querySelectorAll('.target').forEach(b=>b.classList.toggle('selected',b.dataset.id===t.id));
  els.saved.querySelectorAll('.saved-target').forEach(b=>b.classList.toggle('selected',b.textContent===t.name));
}
function saveCustomTask(name,minutes){
  const rows=customTasks().filter(x=>x.name.toLocaleLowerCase('es')!==name.toLocaleLowerCase('es'));
  rows.unshift({name,minutes});localStorage.setItem(CUSTOM,JSON.stringify(rows.slice(0,12)));renderSaved();
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
  const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=rate;u.volume=.9;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='es-ES'&&/(Google|Natural|Microsoft)/i.test(v.name))||voices.find(v=>v.lang?.toLowerCase().startsWith('es'))||null;speechSynthesis.speak(u);
}
async function acquireWakeLock(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch{}}
function releaseWakeLock(){try{wakeLock?.release()}catch{}wakeLock=null}
function persistActive(){localStorage.setItem(ACTIVE,JSON.stringify(active))}
function restoreActive(){active=loadJSON(ACTIVE,null)}
function phaseTotal(phase){if(phase==='transition')return TRANSITION_MS;if(phase==='prep')return PREP_MS;return (active?.plannedMinutes||25)*60*1000}
function format(ms){const s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60),r=s%60;return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`}
async function startTransition(){
  if(!selected)return;
  const plannedMinutes=clamp(Math.round(Number(els.minutes.value)||25),1,240);
  if(selected.custom)saveCustomTask(selected.name,plannedMinutes);
  await ensureAudio();await acquireWakeLock();
  active={target:{name:selected.name,id:selected.id,custom:!!selected.custom},plannedMinutes,phase:'transition',startedAt:Date.now(),phaseStartedAt:Date.now(),deadline:Date.now()+TRANSITION_MS};
  persistActive();showActive();runTimer();
  speak(`Vale. Cambiamos a ${selected.name}. Tienes dos minutos para soltar lo anterior y prepararte.`);
}
function setPhase(phase){
  const now=Date.now();active.phase=phase;active.phaseStartedAt=now;active.deadline=now+phaseTotal(phase);lastTickSecond=null;
  if(phase==='task'&&!active.taskStartedAt)active.taskStartedAt=now;
  persistActive();showActive();runTimer();
  if(phase==='prep')speak(`Bien. Ahora tienes cinco minutos para colocarte y empezar ${active.target.name}. Solo prepara lo necesario.`);
  if(phase==='task')speak(`Ya estás. Empieza ${active.target.name}. Has elegido ${active.plannedMinutes} minutos. Ahora solo haz la tarea.`);
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
  els.timerView.classList.add('hidden');els.choose.classList.remove('hidden');selected=null;els.start.disabled=true;
  els.targets.querySelectorAll('.target').forEach(b=>b.classList.remove('selected'));els.saved.querySelectorAll('.saved-target').forEach(b=>b.classList.remove('selected'));
}
function showActive(){
  els.choose.classList.add('hidden');els.timerView.classList.remove('hidden');els.title.textContent=active.target.name;
  els.next.classList.remove('hidden');els.finish.classList.add('hidden');els.next.disabled=false;
  if(active.phase==='transition'){
    els.phase.textContent='2 · DESPEGA';els.sub.textContent='TRANSICIÓN';els.next.textContent='LISTO · IR A PREPARAR';
    els.instruction.textContent='Cierra lo anterior. Levántate. Muévete hacia la nueva tarea.';
  }else if(active.phase==='prep'){
    els.phase.textContent='3 · ATERRIZA';els.sub.textContent='PREPARACIÓN';els.next.textContent='YA ESTOY LISTO · EMPEZAR';
    els.instruction.textContent='Prepara solo lo necesario. No optimices el sistema: deja la tarea lista para hacer.';
  }else{
    els.phase.textContent='4 · HAZ LA TAREA';els.sub.textContent=`${active.plannedMinutes} MIN`;els.next.classList.add('hidden');els.finish.classList.remove('hidden');
    els.instruction.textContent='Ya no hay que preparar nada. Haz únicamente la tarea que elegiste.';
  }
}
function runTimer(){
  clearInterval(tickId);lastTickSecond=null;
  const update=()=>{
    if(!active)return;
    const left=active.deadline-Date.now(),total=phaseTotal(active.phase),p=clamp(100*Math.max(0,left)/total,0,100);
    els.timer.textContent=format(left);els.ring.style.setProperty('--p',p.toFixed(2));
    const sec=Math.ceil(left/1000);
    if(left>0&&sec<=10&&sec!==lastTickSecond){lastTickSecond=sec;playTick(sec<=3,sec)}
    if(active.phase==='task'&&active.plannedMinutes>5&&left<=5*60*1000&&!active.fiveMinuteCue){
      active.fiveMinuteCue=true;persistActive();speak('Te quedan cinco minutos. Sigue con la misma tarea.');
    }
    if(left>0)return;
    if(active.phase==='task'){playAlarm();completeTask(false,true);return}
    advancePhase();
  };
  const phaseAtStart=active?.phase;update();if(active&&active.phase===phaseAtStart)tickId=setInterval(update,250);
}
function completeTask(early=false,expired=false){
  if(!active)return;
  const now=Date.now(),actualMs=active.taskStartedAt?Math.max(0,now-active.taskStartedAt):0,rows=history();
  rows.unshift({id:now.toString(36),name:active.target.name,completedAt:new Date(now).toISOString(),taskStartedAt:active.taskStartedAt?new Date(active.taskStartedAt).toISOString():null,transitionStartedAt:new Date(active.startedAt).toISOString(),plannedMinutes:active.plannedMinutes,actualMinutes:Math.max(1,Math.round(actualMs/60000)),early});
  saveHistory(rows);const name=active.target.name,todayN=rows.filter(r=>dayKey(r.completedAt)===dayKey(now)).length;active=null;localStorage.removeItem(ACTIVE);clearInterval(tickId);tickId=null;releaseWakeLock();
  els.timerView.classList.add('hidden');els.choose.classList.remove('hidden');selected=null;els.start.disabled=true;
  els.targets.querySelectorAll('.target').forEach(b=>b.classList.remove('selected'));els.saved.querySelectorAll('.saved-target').forEach(b=>b.classList.remove('selected'));drawStats();
  if(!expired)playDone();const msg=todayN===15?`Día oro. Quince tareas completadas hoy.`:todayN>15?`Hecho. Llevas ${todayN} tareas hoy. Ya estás por encima del día oro.`:`${expired?'Tiempo.':'Hecho.'} ${name}. Llevas ${todayN} de quince hoy.`;setTimeout(()=>speak(msg),650);
}
function rankInfo(n){
  const fallback=['#422522','#512927','#632d2a','#762f32','#843729','#904311','#90570c','#8b6b05','#798136','#57965a','#32a48f','#4aa7c8','#7aa5ec','#bb9ef0','#e7bf57'];
  const i=clamp(Math.round(n||1),1,15)-1,x=AVS[i]||{};
  return {name:x.name||('Nivel '+(i+1)),color:x.color||fallback[i],band:x.band||x.color||fallback[i],text:x.text||'#eef5f7'};
}
function dailyChartHtml(rows){
  const sorted=[...rows].sort((a,b)=>new Date(a.completedAt)-new Date(b.completedAt));
  const w=720,h=260,L=38,R=13,T=14,B=31,maxY=15,now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime();
  const xFor=ts=>L+clamp((ts-start)/(end-start),0,1)*(w-L-R),yFor=v=>T+((maxY-clamp(v,0,maxY))/maxY)*(h-T-B);
  const bands=Array.from({length:15},(_,i)=>{const x=rankInfo(i+1);return `<rect x="${L}" y="${yFor(i+1)}" width="${w-L-R}" height="${Math.max(1,yFor(i)-yFor(i+1))}" fill="${x.band}" fill-opacity=".60"/>`}).join('');
  const grid=[0,5,10,15].map(v=>`<line x1="${L}" y1="${yFor(v)}" x2="${w-R}" y2="${yFor(v)}" stroke="rgba(255,255,255,.22)"/><text x="${L-8}" y="${yFor(v)+4}" text-anchor="end" fill="#c5d3d6" font-size="11" font-weight="850">${v}</text>`).join('');
  const hours=[0,6,12,18,24].map(hr=>{const ts=hr===24?end:new Date(now.getFullYear(),now.getMonth(),now.getDate(),hr).getTime();return `<text x="${xFor(ts)}" y="${h-10}" text-anchor="${hr===0?'start':hr===24?'end':'middle'}" fill="#b5c5c9" font-size="11" font-weight="800">${String(hr).padStart(2,'0')}:00</text>`}).join('');
  const pts=sorted.map((r,i)=>({r,v:i+1,x:xFor(new Date(r.completedAt).getTime()),y:yFor(Math.min(15,i+1))}));
  const shadow=pts.length>1?`<polyline points="${pts.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ')}" fill="none" stroke="#050806" stroke-opacity=".75" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`:'';
  const segments=pts.slice(1).map((q,i)=>`<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${q.x}" y2="${q.y}" stroke="${rankInfo(Math.min(15,q.v)).color}" stroke-width="4" stroke-linecap="round"/>`).join('');
  const dots=pts.map(q=>{const ri=rankInfo(Math.min(15,q.v)),time=new Date(q.r.completedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});return `<circle cx="${q.x}" cy="${q.y}" r="5" fill="${ri.color}" stroke="${ri.text}" stroke-width="2"><title>${q.v}. ${esc(q.r.name||q.r.target||'Tarea')} · ${time}</title></circle>`}).join('');
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
  const rows=history(),today=dayKey(Date.now()),weekAgo=Date.now()-7*24*60*60*1000,todayRows=rows.filter(r=>dayKey(r.completedAt)===today);
  els.today.textContent=todayRows.length;els.week.textContent=rows.filter(r=>new Date(r.completedAt).getTime()>=weekAgo).length;els.total.textContent=rows.length;
  renderDaily(todayRows);
  els.history.innerHTML=rows.length?rows.slice(0,20).map(r=>{
    const when=new Date(r.completedAt),mins=r.actualMinutes||r.plannedMinutes,planned=r.plannedMinutes?` · objetivo ${r.plannedMinutes} min`:'';
    return `<div class="hist"><b>✓ ${esc(r.name||r.target||'Tarea')}</b><small>${esc(when.toLocaleString('es-ES'))}</small><em>${mins?`${mins} min realizados`:'Completada'}${planned}</em></div>`;
  }).join(''):'<div class="empty">Todavía no hay tareas terminadas. La primera aparecerá aquí.</div>';
}
els.customBtn.onclick=()=>{
  const name=els.custom.value.trim();if(!name)return;
  const minutes=clamp(Math.round(Number(els.minutes.value)||25),1,240);
  saveCustomTask(name,minutes);selectTarget({id:'custom-new',name,sub:'Tarea personalizada',custom:true});
};
els.custom.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();els.customBtn.click()}});
els.minutes.addEventListener('change',()=>setMinutes(els.minutes.value));
els.voice.onclick=()=>{const s=settings();s.voice=!s.voice;saveSettings(s);renderAudio();if(s.voice)speak('Voz activada.')};
els.ticks.onclick=async()=>{const s=settings();s.ticks=!s.ticks;saveSettings(s);renderAudio();if(s.ticks){await ensureAudio();playTick(true,0)}};
els.start.onclick=startTransition;els.cancel.onclick=cancelActive;els.next.onclick=advancePhase;els.finish.onclick=()=>completeTask(true,false);
$('#resetBtn').onclick=()=>{localStorage.removeItem(STORE);localStorage.removeItem(OLD_STORE);drawStats()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active)acquireWakeLock()});
renderTargets();drawStats();restoreActive();
let renderedDay=dayKey(Date.now());setInterval(()=>{const d=dayKey(Date.now());if(d!==renderedDay){renderedDay=d;drawStats()}},30000);
if(active){showActive();runTimer();acquireWakeLock()}