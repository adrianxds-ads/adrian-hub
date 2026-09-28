const FALLBACK={updated:null,score:null,decision:"Aún no hay suficientes datos normalizados para recomendar cambios de carga.",metrics:{weight:{v:"89,48",u:"kg",label:"Peso",note:"02/09"},fat:{v:"16,7",u:"%",label:"Grasa",note:"BIA · puntual"},muscle:{v:"71,14",u:"kg",label:"Músculo",note:"BIA · puntual"},rhr:{v:"70",u:"lpm",label:"FCR",note:"19/09 · puntual"},hrv:{v:"—",u:"ms",label:"VFC",note:"normalización pendiente"},sleep:{v:"—",u:"h",label:"Sueño",note:"deduplicación pendiente"},steps:{v:"—",u:"",label:"Pasos",note:"deduplicación pendiente"},photos:{v:"30/08",u:"",label:"Body Check",note:"última sesión"}},sources:[["Withings","Sin medición nueva","warn"],["FC / FCR","Disponible","ok"],["VFC","Disponible · normalizar","warn"],["Sueño","Duplicados detectados","warn"],["Pasos","Duplicados detectados","warn"],["Body Check","Sin sesión nueva","warn"]],series:{weight:[90.30,89.48],rhr:[73,75,74,72,69,69,67,66,67,72,72,74,71,68,70,77,81,80,72,69,66,67,70],hrv:[],sleep:[],steps:[]}};
const E=(id,name,group,o={})=>({id,name,group,sets:2,reps:"10–12",repsDefault:11,rest:75,kg:0,...o});
const EXERCISES=[
E("legpress","Prensa de piernas","Piernas",{kg:100,rir:3,rest:90,source:"Gymbro",note:"Punto de partida guardado en TickTick: 100 kg. Ajusta al escalón real de la máquina."}),
E("legcurl","Curl femoral tumbado","Piernas",{kg:35,rir:3,rest:75,source:"Gymbro"}),
E("latneutral","Jalón al pecho · agarre neutro","Espalda",{kg:35,rest:90,source:"Gymbro",note:"Usa un recorrido cómodo. Si hoy no es un movimiento tolerado, sáltalo."}),
E("seatedrow","Remo sentado · agarre neutro","Espalda",{kg:35,rir:3,rest:90,source:"Gymbro",note:"Mantén el gesto controlado; si el hombro protesta, no fuerces la serie."}),
E("bicepsmachine","Curl de bíceps · máquina/cable","Bíceps",{kg:15,rir:3,reps:"10–15",repsDefault:12,rest:60,source:"Gymbro"}),
E("tricepsrope","Tríceps en polea · cuerda","Tríceps",{kg:15,rir:3,reps:"10–15",repsDefault:12,rest:60,source:"Gymbro",note:"En TickTick quedó anotado dolor con ambos brazos. Si aparece dolor, salta este ejercicio."}),
E("abmachine","Abdominal en máquina","Core",{kg:35,rir:3,reps:"12–15",repsDefault:13,rest:60,source:"Gymbro"}),
E("bench","Bench Press","Pecho",{rest:90,source:"Archivo"}),E("inclinepress","Incline Press","Pecho",{rest:90,source:"Archivo"}),E("chestfly","Chest Flyes · máquina/peck deck","Pecho",{source:"Archivo"}),
E("cablecross","Cable Crossovers","Pecho",{source:"Archivo"}),E("dips","Dips o Push-ups","Pecho",{source:"Archivo"}),E("shoulderpress","Shoulder Press","Hombros",{rest:90,source:"Archivo"}),
E("latwide","Lat Pulldown · agarre ancho","Espalda",{rest:90,source:"Archivo"}),E("onearmrow","One-Arm Dumbbell Row","Espalda",{rest:90,source:"Archivo"}),E("seatedcable","Seated Cable Row · agarre cerrado","Espalda",{rest:90,source:"Archivo"}),
E("straightarm","Straight-Arm Cable Pulldown","Espalda",{source:"Archivo"}),E("hyperext","Hyperextensions","Espalda",{source:"Archivo"}),E("reversefly","Reverse Flyes","Espalda",{source:"Archivo"}),
E("military","Seated Military Press","Hombros",{rest:90,source:"Archivo"}),E("lateralraise","Lateral Raises","Hombros",{source:"Archivo"}),E("frontraise","Front Raises","Hombros",{source:"Archivo"}),
E("facepull","Face Pulls","Hombros",{source:"Archivo"}),E("reardelt","Rear Delt Raises","Hombros",{source:"Archivo"}),E("shrugs","Shrugs","Hombros",{source:"Archivo"}),
E("frenchpress","French Press","Tríceps",{source:"Archivo"}),E("pushdown","Cable Pushdowns","Tríceps",{source:"Archivo"}),E("machinedips","Machine/Bench Dips","Tríceps",{source:"Archivo"}),
E("overheadtri","Overhead Triceps Extension","Tríceps",{source:"Archivo"}),E("kickbacks","Triceps Kickbacks","Tríceps",{source:"Archivo"}),E("diamond","Diamond Push-ups","Tríceps",{source:"Archivo"}),
E("barcurl","Barbell Bicep Curls","Bíceps",{source:"Archivo"}),E("hammercurl","Dumbbell Hammer Curls","Bíceps",{source:"Archivo"}),E("concentration","Concentration Curls","Bíceps",{source:"Archivo"}),
E("preacher","Preacher Curls","Bíceps",{source:"Archivo"}),E("inclinecurl","Incline Dumbbell Curls","Bíceps",{source:"Archivo"}),E("cablecurl","Cable Bicep Curls","Bíceps",{source:"Archivo"}),
E("legext","Leg Extensions","Piernas",{source:"Archivo"}),E("lunges","Lunges","Piernas",{source:"Archivo"}),E("calf","Calf Raises","Piernas",{source:"Archivo"}),
E("plank","Plank","Core",{sets:3,reps:"45 s",repsDefault:0,durationSec:45,rest:60,source:"Archivo"})
];
const TEMPLATES=[
{id:"gymbro",name:"GYMBRO 7",ids:["legpress","legcurl","latneutral","seatedrow","bicepsmachine","tricepsrope","abmachine"]},
{id:"legs",name:"LEGS / CORE",ids:["legpress","legext","legcurl","lunges","calf","plank","abmachine"]},
{id:"back",name:"BACK / PULL",ids:["latneutral","latwide","onearmrow","seatedrow","seatedcable","straightarm","hyperext","reversefly"]},
{id:"chest",name:"CHEST / PUSH",ids:["bench","inclinepress","chestfly","cablecross","dips","shoulderpress"]},
{id:"shoulders",name:"SHOULDERS",ids:["military","lateralraise","frontraise","facepull","reardelt","shrugs"]},
{id:"biceps",name:"BICEPS",ids:["bicepsmachine","barcurl","hammercurl","concentration","preacher","inclinecurl","cablecurl"]},
{id:"triceps",name:"TRICEPS",ids:["tricepsrope","frenchpress","pushdown","machinedips","overheadtri","kickbacks","diamond"]},
{id:"mixed",name:"MIXED",ids:["bench","latneutral","shoulderpress","legpress","bicepsmachine","plank"]}
];

const P=(cue,sec)=>({cue,sec});
const TEMPO_PHASES={
legpress:[P("EMPUJA",2),P("VUELVE",3)],
legcurl:[P("FLEXIONA",2),P("APRIETA",0.5),P("VUELVE",3)],
latneutral:[P("BAJA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
seatedrow:[P("TIRA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
bicepsmachine:[P("SUBE",2),P("APRIETA",0.5),P("BAJA",2.5)],
tricepsrope:[P("EXTIENDE",2),P("APRIETA",0.5),P("VUELVE",2.5)],
abmachine:[P("CIERRA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
bench:[P("EMPUJA",2),P("VUELVE",3)],
inclinepress:[P("EMPUJA",2),P("VUELVE",3)],
chestfly:[P("CIERRA",2),P("APRIETA",0.5),P("ABRE",2.5)],
cablecross:[P("CIERRA",2),P("APRIETA",0.5),P("ABRE",2.5)],
dips:[P("EMPUJA",2),P("VUELVE",3)],
shoulderpress:[P("EMPUJA",2),P("VUELVE",3)],
latwide:[P("BAJA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
onearmrow:[P("TIRA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
seatedcable:[P("TIRA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
straightarm:[P("BAJA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
hyperext:[P("SUBE",2),P("PAUSA",0.5),P("BAJA",2.5)],
reversefly:[P("ABRE",2),P("APRIETA",0.5),P("VUELVE",2.5)],
military:[P("EMPUJA",2),P("VUELVE",3)],
lateralraise:[P("SUBE",2),P("BAJA",3)],
frontraise:[P("SUBE",2),P("BAJA",3)],
facepull:[P("TIRA",2),P("APRIETA",0.5),P("VUELVE",2.5)],
reardelt:[P("ABRE",2),P("APRIETA",0.5),P("VUELVE",2.5)],
shrugs:[P("SUBE",1.5),P("APRIETA",1),P("BAJA",2.5)],
frenchpress:[P("EXTIENDE",2),P("VUELVE",3)],
pushdown:[P("EXTIENDE",2),P("APRIETA",0.5),P("VUELVE",2.5)],
machinedips:[P("EMPUJA",2),P("VUELVE",3)],
overheadtri:[P("EXTIENDE",2),P("VUELVE",3)],
kickbacks:[P("EXTIENDE",2),P("APRIETA",0.5),P("VUELVE",2.5)],
diamond:[P("EMPUJA",2),P("VUELVE",3)],
barcurl:[P("SUBE",2),P("APRIETA",0.5),P("BAJA",2.5)],
hammercurl:[P("SUBE",2),P("BAJA",3)],
concentration:[P("SUBE",2),P("APRIETA",0.5),P("BAJA",2.5)],
preacher:[P("SUBE",2),P("BAJA",3)],
inclinecurl:[P("SUBE",2),P("BAJA",3)],
cablecurl:[P("SUBE",2),P("APRIETA",0.5),P("BAJA",2.5)],
legext:[P("EXTIENDE",2),P("APRIETA",0.5),P("VUELVE",2.5)],
lunges:[P("BAJA",2.5),P("SUBE",2)],
calf:[P("SUBE",1.5),P("APRIETA",1),P("BAJA",2.5)]
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE="adaptive_gym_v2";
let health=FALLBACK,saved=loadSaved(),selected=new Set(saved.lastSelection?.length?saved.lastSelection:TEMPLATES[0].ids),activeTemplate="";
let session=null,timerHandle=null,clockHandle=null,timerMode="idle",timerTotal=0,timerLeft=0,timerDeadline=0,timerLastBeat=-1,audioCtx=null,soundOn=true,wakeLock=null;
function loadSaved(){
  try{
    const old=JSON.parse(localStorage.getItem("adaptive_gym_v1"))||{},x=JSON.parse(localStorage.getItem(STORE))||{};
    return {history:Array.isArray(x.history)?x.history:(Array.isArray(old.history)?old.history:[]),kg:x.kg&&typeof x.kg==="object"?x.kg:(old.kg||{}),plans:x.plans&&typeof x.plans==="object"?x.plans:{},lastSelection:Array.isArray(x.lastSelection)?x.lastSelection:(old.lastSelection||[]),coachMode:x.coachMode||"voice",tempoScale:x.tempoScale&&typeof x.tempoScale==="object"?x.tempoScale:{}};
  }catch{return {history:[],kg:{},plans:{},lastSelection:[],coachMode:"voice",tempoScale:{}}}
}
function persist(){saved.lastSelection=[...selected];saved.coachMode=$("#coachMode")?.value||saved.coachMode||"tones";localStorage.setItem(STORE,JSON.stringify(saved))}
function localDay(delta=0){const d=new Date();d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function prettyDay(delta=0){return new Intl.DateTimeFormat("es-ES",{weekday:"long",day:"numeric",month:"long"}).format(new Date(Date.now()+delta*86400000))}
function exById(id){return EXERCISES.find(x=>x.id===id)}
function sameSelection(ids,set=selected){if(ids.length!==set.size)return false;return ids.every(id=>set.has(id))}
function matchingTemplateId(set=selected){return TEMPLATES.find(t=>sameSelection(t.ids,set))?.id||""}
function tempoScale(ex){return Math.max(.75,Math.min(1.35,Number(saved.tempoScale?.[ex?.id]||1)))}
function phasesFor(ex){
  const base=TEMPO_PHASES[ex?.id]||[P("MUEVE",2),P("VUELVE",3)],scale=tempoScale(ex);
  return base.map(x=>({cue:x.cue,sec:Math.round(x.sec*scale*10)/10}));
}
function repSeconds(ex){return ex?.durationSec||phasesFor(ex).reduce((n,p)=>n+p.sec,0)}
function secLabel(n){return Number(n).toFixed(1).replace(".",",")}
function phasePlanText(ex){return ex?.durationSec?"MANTÉN · RESPIRA":phasesFor(ex).map(p=>`${p.cue} ${secLabel(p.sec)} s`).join(" · ")}
function workSeconds(ex,reps=ex.repsDefault){return ex.durationSec||Math.max(4,(Number(reps)||ex.repsDefault||1)*repSeconds(ex))}
function updatePhaseUI(ex,reps){
  if(ex.durationSec){
    $("#tempoInfo").textContent="CRONO";
    $("#coachCue").textContent="MANTÉN · RESPIRA";
    $("#phaseSummary").textContent=`${ex.durationSec} s de trabajo`;
    $("#beatReadout").innerHTML="";
    $("#tempoCalibrate").classList.add("hidden");
    return;
  }
  const phases=phasesFor(ex),per=repSeconds(ex),count=Math.max(1,Number(reps)||ex.repsDefault||1),scale=tempoScale(ex);
  const tag=Math.abs(scale-1)<.01?"BASE":`${scale>1?"+":""}${Math.round((scale-1)*100)}%`;
  $("#tempoInfo").textContent=`${secLabel(per)} s / rep · ${tag}`;
  $("#coachCue").textContent=phasePlanText(ex);
  $("#phaseSummary").textContent=`${count} reps · ${fmt(per*count)} de trabajo`;
  $("#beatReadout").innerHTML=phases.map(p=>`<i><b>${p.cue}</b><small>${secLabel(p.sec)}s</small></i>`).join("");
  $("#tempoCalibrate").classList.remove("hidden");
}
function adjustTempo(delta){
  const ex=currentEx();if(!ex||ex.durationSec)return;
  saved.tempoScale=saved.tempoScale||{};
  if(delta===0)delete saved.tempoScale[ex.id];
  else saved.tempoScale[ex.id]=Math.max(.75,Math.min(1.35,Math.round((tempoScale(ex)+delta)*100)/100));
  persist();const reps=Math.max(1,Number($("#repsInput").value)||ex.repsDefault||1);updatePhaseUI(ex,reps);
  if(timerMode==="idle"){timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;renderTimer()}
}
function currentEx(){return session?exById(session.ids[session.exIndex]):null}
function currentKg(ex){return Number(saved.kg?.[ex.id]??ex.kg??0)}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")}
function syncDock(){const dock=$("#selectionDock");if(!dock)return;$("#dockCount").textContent=selected.size;dock.classList.toggle("hidden",$("#setupView").classList.contains("hidden")||!selected.size)}
function show(view){document.body.classList.toggle("session-active",view==="#runView");["#setupView","#runView","#resultView"].forEach(id=>$(id).classList.add("hidden"));if(view)$(view).classList.remove("hidden");syncDock();if(view)requestAnimationFrame(()=>$(view).scrollIntoView({block:"start"}))}

function renderDaily(){
  const ids=(saved.plans?.[localDay()]||[]).filter(id=>exById(id));
  $("#dailyDate").textContent=prettyDay(0);
  $("#dailyCount").textContent=ids.length?`${ids.length} ejercicios`:"Sin plan";
  $("#dailyExercises").innerHTML=ids.length?ids.map(id=>`<span class="daily-pill">${exById(id).name}</span>`).join(""):'<span class="daily-empty">Guarda una selección para que mañana solo tengas que pulsar PLAY.</span>';
  $("#playDaily").disabled=!ids.length;$("#playDaily").style.opacity=ids.length?"1":".45";
  $("#editDaily").textContent=ids.length?"EDITAR RUTINA":"CREAR RUTINA";
}
function renderSetup(){
  activeTemplate=matchingTemplateId(selected);
  $("#templates").innerHTML=TEMPLATES.map(t=>`<button class="template ${t.id===activeTemplate?"active":""}" data-template="${t.id}">${t.name}</button>`).join("");
  const ordered=[...EXERCISES].sort((a,b)=>(selected.has(b.id)-selected.has(a.id))||a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  $("#exerciseList").innerHTML=ordered.map(x=>`<label class="exercise"><input type="checkbox" data-ex="${x.id}" ${selected.has(x.id)?"checked":""}><div><b>${x.name}</b><small>${x.group} · ${x.sets}×${x.reps}${x.rir?` · RIR ${x.rir}`:""} · descanso ${x.rest}s</small></div><span class="seconds">${x.durationSec?fmt(x.durationSec):`${secLabel(repSeconds(x))}s/rep`}<small>${x.durationSec?"":fmt(workSeconds(x))}</small></span></label>`).join("");
  $("#selectedCount").textContent=`${selected.size} ejercicios`;syncDock();
}
function chooseTemplate(id){const t=TEMPLATES.find(x=>x.id===id);if(!t)return;activeTemplate=id;selected=new Set(t.ids);persist();renderSetup()}
function savePlan(delta){if(!selected.size)return;saved.plans[localDay(delta)]=[...selected];persist();renderDaily();flash(delta===0?"Plan de hoy guardado":"Plan de mañana guardado")}
function flash(msg){const el=$("#selectedCount"),old=el.textContent;el.textContent=msg;setTimeout(()=>{if(el)el.textContent=old},1400)}
function playDaily(){const ids=(saved.plans?.[localDay()]||[]).filter(id=>exById(id));if(ids.length){selected=new Set(ids);startWorkout(ids)}}
function editDaily(){const ids=(saved.plans?.[localDay()]||[]).filter(id=>exById(id));if(ids.length)selected=new Set(ids);renderSetup();show("#setupView")}

function startWorkout(ids=[...selected]){
  if(!ids.length)return;
  clearTimer();stopClock();session={id:Date.now(),startedAt:Date.now(),ids:[...ids],exIndex:0,setIndex:0,records:[],skipped:[],paused:false,activeMs:0,clockLast:performance.now(),timerWasRunning:false};
  acquireWakeLock();show("#runView");$("#coachMode").value=saved.coachMode||"tones";$("#sessionClock").textContent="00:00";$("#sessionPause").textContent="Ⅱ PAUSA";$("#sessionPause").classList.remove("paused");startClock();showCurrent();
}
function startClock(){stopClock();if(!session)return;session.clockLast=performance.now();clockHandle=setInterval(()=>{if(!session)return;const now=performance.now();if(!session.paused)session.activeMs+=Math.max(0,now-session.clockLast);session.clockLast=now;$("#sessionClock").textContent=fmt(session.activeMs/1000)},250)}
function stopClock(){if(clockHandle){clearInterval(clockHandle);clockHandle=null}}
function toggleSessionPause(){
  if(!session)return;
  const now=performance.now();if(!session.paused)session.activeMs+=Math.max(0,now-session.clockLast);session.clockLast=now;
  session.paused=!session.paused;$("#sessionPause").textContent=session.paused?"▶ CONTINUAR":"Ⅱ PAUSA";$("#sessionPause").classList.toggle("paused",session.paused);$("#timerRing").classList.toggle("paused",session.paused);
  if(session.paused){session.timerWasRunning=!!timerHandle;pauseTimer();if("speechSynthesis"in window)speechSynthesis.cancel()}
  else if(session.timerWasRunning&&(timerMode==="running"||timerMode==="rest"))runClock(timerMode==="running"?()=>completeSet(false):advanceAfterRest);
}
function showCurrent(){
  const ex=currentEx();if(!ex){finishSession();return}
  clearTimer();timerMode="idle";const reps=ex.repsDefault||0;timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;
  $("#runProgress").textContent=`EJERCICIO ${session.exIndex+1}/${session.ids.length}`;$("#runName").textContent=ex.name;
  $("#runMeta").textContent=`${ex.group} · ${ex.sets}×${ex.reps}${ex.rir?` · RIR ${ex.rir}`:""} · descanso ${ex.rest}s`;
  $("#kgInput").value=currentKg(ex);$("#repsInput").value=reps;$("#repsInput").disabled=!!ex.durationSec;
  $("#runNote").textContent=ex.note||"";$("#runNote").classList.toggle("hidden",!ex.note);
  updatePhaseUI(ex,reps);
  $("#repReadout").textContent=ex.durationSec?"TIEMPO":`1/${reps}`;setBeat(-1);$("#timerRing").classList.remove("paused");renderTimer();$("#timerAction").textContent="▶ START SERIE";$("#timerAction").classList.remove("running");
}
async function ensureAudio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==="suspended")await audioCtx.resume();return audioCtx.state==="running"}catch{return false}}
function tone(f,dur=.026,gain=.016,type="square",delay=0){if(!soundOn||!audioCtx||audioCtx.state!=="running")return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;o.type=type;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01)}
function playTick(strong=false,step=0){const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.034:.026,strong?.026:.016,"square")}
function playDone(){[440,587.33,783.99,1046.5].forEach((f,i)=>tone(f,i===3?.11:.052,i===3?.024:.020,i%2?"sine":"triangle",i*.047))}
function speak(text,rate=1.6){if(!soundOn||!("speechSynthesis"in window)||($("#coachMode")?.value!=="voice"))return;const u=new SpeechSynthesisUtterance(text);u.lang="es-ES";u.rate=rate;u.volume=.8;speechSynthesis.speak(u)}
function coachPhase(index){
  const mode=$("#coachMode").value,phases=phasesFor(currentEx()),phase=phases[index];if(!soundOn||!phase)return;
  if(mode==="voice"){
    if("speechSynthesis"in window&&speechSynthesis.speaking)speechSynthesis.cancel();speak(phase.cue,1.75);
  }else if(mode==="ticks")playTick(index===0,index);
  else{const f=[1046.5,830.61,740,932.33][index%4];tone(f,index===0?.055:.04,index===0?.026:.018,index===0?"triangle":"sine")}
}
function setBeat(n){$$(".beat-readout i").forEach((el,i)=>el.classList.toggle("active",i===n))}
function renderTimer(){
  $("#timerText").textContent=fmt(timerLeft);const ex=currentEx();
  $("#timerLabel").textContent=timerMode==="rest"?"DESCANSO":`SERIE ${session?.setIndex+1||1}/${ex?.sets||1}`;
  $("#timerRing").style.setProperty("--p",timerTotal?Math.min(100,100*(timerTotal-timerLeft)/timerTotal):0);$("#timerRing").classList.toggle("rest",timerMode==="rest");
}
function clearTimer(){if(timerHandle){clearInterval(timerHandle);timerHandle=null}timerLastBeat=-1}
function pauseTimer(){if(timerHandle){timerLeft=Math.max(0,(timerDeadline-performance.now())/1000);clearInterval(timerHandle);timerHandle=null}}
async function startSet(){
  if(!session||session.paused)return;
  if(timerMode==="rest"){advanceAfterRest();return}
  if(timerMode==="running")return;
  await ensureAudio();const ex=currentEx(),reps=Math.max(0,Number($("#repsInput").value)||0);timerMode="running";timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;timerLastBeat=-1;
  $("#timerAction").textContent="EN CURSO";$("#timerAction").classList.add("running");runClock(()=>completeSet(false));
}
function runClock(onEnd){
  clearTimer();timerDeadline=performance.now()+timerLeft*1000;
  timerHandle=setInterval(()=>{
    if(!session||session.paused)return;timerLeft=Math.max(0,(timerDeadline-performance.now())/1000);
    if(timerMode==="running")updateTempo();
    else if(timerMode==="rest"){const shown=Math.ceil(timerLeft);if(shown>0&&shown<=3&&shown!==timerLastBeat){timerLastBeat=shown;playTick(true,shown)}}
    renderTimer();if(timerLeft<=0){clearTimer();onEnd()}
  },60);
}
function updateTempo(){
  const ex=currentEx();if(!ex||ex.durationSec){setBeat(-1);return}
  const phases=phasesFor(ex),per=repSeconds(ex),elapsed=Math.max(0,timerTotal-timerLeft),target=Math.max(1,Number($("#repsInput").value)||ex.repsDefault||1);
  const repIndex=Math.min(target-1,Math.floor(elapsed/per)),inside=Math.max(0,elapsed-repIndex*per);
  let phaseIndex=phases.length-1,acc=0;
  for(let i=0;i<phases.length;i++){acc+=phases[i].sec;if(inside<acc){phaseIndex=i;break}}
  const eventKey=repIndex*10+phaseIndex;
  if(eventKey!==timerLastBeat){timerLastBeat=eventKey;setBeat(phaseIndex);coachPhase(phaseIndex)}
  $("#repReadout").textContent=`${Math.min(target,repIndex+1)}/${target}`;
}
function completeSet(manual=true){
  if(!session||timerMode==="rest")return;const ex=currentEx();clearTimer();setBeat(-1);
  const kg=Math.max(0,Number($("#kgInput").value)||0),reps=ex.durationSec?0:Math.max(0,Number($("#repsInput").value)||0);
  saved.kg[ex.id]=kg;session.records.push({exerciseId:ex.id,set:session.setIndex+1,kg,reps,at:Date.now(),manual});persist();
  if(session.setIndex+1>=ex.sets&&session.exIndex+1>=session.ids.length){playDone();finishSession();return}
  startRest(ex.rest);
}
function startRest(sec){timerMode="rest";timerTotal=sec;timerLeft=sec;timerLastBeat=-1;$("#repReadout").textContent="REST";$("#timerAction").textContent="SALTAR DESCANSO";$("#timerAction").classList.remove("running");renderTimer();speak(`Descanso. ${sec} segundos`,1.5);runClock(advanceAfterRest)}
function advanceAfterRest(){clearTimer();const ex=currentEx();if(session.setIndex+1<ex.sets)session.setIndex++;else{session.exIndex++;session.setIndex=0}const next=currentEx();showCurrent();if(next)speak(`Siguiente. ${next.name}`,1.5)}
function skipExercise(){const ex=currentEx();if(!ex)return;session.skipped.push(ex.id);clearTimer();session.exIndex++;session.setIndex=0;showCurrent()}
function finishSession(){
  if(!session)return;pauseTimer();stopClock();if("speechSynthesis"in window)speechSynthesis.cancel();releaseWakeLock();
  const totalSets=session.ids.reduce((n,id)=>n+(exById(id)?.sets||0),0),minutes=Math.max(1,Math.round(session.activeMs/60000));
  const rec={id:session.id,date:new Date(session.startedAt).toISOString(),minutes,sets:session.records.length,totalSets,exercises:new Set(session.records.map(r=>r.exerciseId)).size,planned:session.ids.length,skipped:session.skipped.length,records:session.records};
  saved.history=[...(saved.history||[]),rec].slice(-60);persist();session=null;renderHistory();renderResult(rec);show("#resultView")
}
function renderResult(r){$("#resultTitle").textContent=`${r.sets} series completadas`;$("#resultGrid").innerHTML=[["SERIES",r.sets],["EJERCICIOS",r.exercises],["MIN",r.minutes]].map(x=>`<div class="result-card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("")}
function renderHistory(){const h=(saved.history||[]).slice(-10),total=(saved.history||[]).reduce((n,x)=>n+x.sets,0);$("#historyLabel").textContent=h.length?`${saved.history.length} sesiones · ${total} series`:"Sin sesiones";$("#workoutChart").innerHTML=h.length?h.map(x=>{const pct=x.totalSets?Math.max(8,Math.round(100*x.sets/x.totalSets)):8;return `<i class="workout-bar" style="height:${pct}%" title="${x.sets}/${x.totalSets} series · ${x.minutes} min"><span>${x.sets}</span></i>`}).join(""):'<div class="hint">Tu primera sesión aparecerá aquí.</div>'}
async function acquireWakeLock(){try{if("wakeLock"in navigator)wakeLock=await navigator.wakeLock.request("screen")}catch{}}
function releaseWakeLock(){try{wakeLock?.release()}catch{}wakeLock=null}

function renderHealth(){const m=$("#metrics");m.innerHTML=Object.values(health.metrics).map(x=>`<div class="metric ad-card"><b>${x.v}<small>${x.u}</small></b><span>${x.label}</span><small>${x.note||""}</small></div>`).join("");$("#scoreLabel").textContent=health.score==null?"Esperando datos normalizados":health.score+" / 100";$("#scoreFill").style.width=(health.score??0)+"%";$("#decision").textContent=health.decision;$("#sources").innerHTML=health.sources.map(x=>`<div class="source"><b>${x[0]}</b><span class="${x[2]}">${x[1]}</span></div>`).join("");drawHealth()}
function drawHealth(){const key=$("#chartMetric").value,a=health.series[key]||[],el=$("#chart");if(!a.length){el.innerHTML='<div class="hint">Sin serie fiable todavía.</div>';return}const lo=Math.min(...a),hi=Math.max(...a),span=hi-lo||1;el.innerHTML=a.map(v=>`<i class="bar" title="${v}" style="height:${25+75*(v-lo)/span}%"></i>`).join("")}
async function loadHealth(){try{const r=await fetch("./data/latest.json?"+Date.now(),{cache:"no-store"});if(r.ok)health=await r.json()}catch{}renderHealth()}

$("#templates").addEventListener("click",e=>{const b=e.target.closest("[data-template]");if(b)chooseTemplate(b.dataset.template)});
$("#exerciseList").addEventListener("change",e=>{const id=e.target.dataset.ex;if(!id)return;e.target.checked?selected.add(id):selected.delete(id);activeTemplate="";persist();renderSetup()});
$("#clearSelection").onclick=()=>{selected.clear();persist();renderSetup()};$("#saveToday").onclick=()=>savePlan(0);$("#saveTomorrow").onclick=()=>savePlan(1);
$("#playDaily").onclick=playDaily;$("#editDaily").onclick=editDaily;$("#closeSetup").onclick=()=>show(null);$("#startWorkout").onclick=()=>startWorkout();$("#startWorkoutDock").onclick=()=>startWorkout();
$("#timerAction").onclick=startSet;$("#completeNow").onclick=()=>timerMode==="rest"?advanceAfterRest():completeSet(true);$("#sessionPause").onclick=toggleSessionPause;
$("#skipExercise").onclick=skipExercise;$("#finishWorkout").onclick=finishSession;$("#anotherRun").onclick=()=>{renderDaily();show(null);window.scrollTo({top:0,behavior:"smooth"})};
$$("[data-step]").forEach(b=>b.onclick=()=>{const input=b.dataset.step==="kg"?$("#kgInput"):$("#repsInput"),delta=Number(b.dataset.delta);input.value=Math.max(0,(Number(input.value)||0)+delta);if(b.dataset.step==="reps"&&session&&timerMode==="idle"){const ex=currentEx(),reps=Number(input.value)||ex.repsDefault;timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;updatePhaseUI(ex,reps);renderTimer()}});
$("#tempoFaster").onclick=()=>adjustTempo(-.05);$("#tempoReset").onclick=()=>adjustTempo(0);$("#tempoSlower").onclick=()=>adjustTempo(.05);
$("#soundBtn").onclick=async()=>{soundOn=!soundOn;if(soundOn)await ensureAudio();$("#soundBtn").textContent=soundOn?"SOUND ON":"SOUND OFF";if(!soundOn&&"speechSynthesis"in window)speechSynthesis.cancel()};
$("#coachMode").onchange=()=>persist();$("#chartMetric").onchange=drawHealth;
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&session)acquireWakeLock()});
renderDaily();renderSetup();renderHistory();$("#coachMode").value=saved.coachMode||"tones";loadHealth();