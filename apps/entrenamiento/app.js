const FALLBACK={updated:null,score:null,decision:"Aún no hay suficientes datos normalizados para recomendar cambios de carga.",metrics:{weight:{v:"89,48",u:"kg",label:"Peso",note:"02/09"},fat:{v:"16,7",u:"%",label:"Grasa",note:"BIA · puntual"},muscle:{v:"71,14",u:"kg",label:"Músculo",note:"BIA · puntual"},rhr:{v:"70",u:"lpm",label:"FCR",note:"19/09 · puntual"},hrv:{v:"—",u:"ms",label:"VFC",note:"normalización pendiente"},sleep:{v:"—",u:"h",label:"Sueño",note:"deduplicación pendiente"},steps:{v:"—",u:"",label:"Pasos",note:"deduplicación pendiente"},photos:{v:"30/08",u:"",label:"Body Check",note:"última sesión"}},sources:[["Withings","Sin medición nueva","warn"],["FC / FCR","Disponible","ok"],["VFC","Disponible · normalizar","warn"],["Sueño","Duplicados detectados","warn"],["Pasos","Duplicados detectados","warn"],["Body Check","Sin sesión nueva","warn"]],series:{weight:[90.30,89.48],rhr:[73,75,74,72,69,69,67,66,67,72,72,74,71,68,70,77,81,80,72,69,66,67,70],hrv:[],sleep:[],steps:[]}};
const E=(id,name,group,o={})=>({id,name,group,sets:4,reps:"10–12",repsDefault:11,rest:75,kg:0,...o});
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
E("plank","Plank","Core",{sets:4,reps:"45 s",repsDefault:0,durationSec:45,rest:60,source:"Archivo"})
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
legcurl:[P("FLEXIONA",2),P("VUELVE",3)],
latneutral:[P("BAJA",2),P("VUELVE",3)],
seatedrow:[P("TIRA",2),P("VUELVE",3)],
bicepsmachine:[P("SUBE",2),P("BAJA",3)],
tricepsrope:[P("EXTIENDE",2),P("VUELVE",3)],
abmachine:[P("CIERRA",2),P("VUELVE",3)],
bench:[P("EMPUJA",2),P("VUELVE",3)],
inclinepress:[P("EMPUJA",2),P("VUELVE",3)],
chestfly:[P("CIERRA",2),P("ABRE",3)],
cablecross:[P("CIERRA",2),P("ABRE",3)],
dips:[P("EMPUJA",2),P("VUELVE",3)],
shoulderpress:[P("EMPUJA",2),P("VUELVE",3)],
latwide:[P("BAJA",2),P("VUELVE",3)],
onearmrow:[P("TIRA",2),P("VUELVE",3)],
seatedcable:[P("TIRA",2),P("VUELVE",3)],
straightarm:[P("BAJA",2),P("VUELVE",3)],
hyperext:[P("SUBE",2),P("BAJA",3)],
reversefly:[P("ABRE",2),P("VUELVE",3)],
military:[P("EMPUJA",2),P("VUELVE",3)],
lateralraise:[P("SUBE",2),P("BAJA",3)],
frontraise:[P("SUBE",2),P("BAJA",3)],
facepull:[P("TIRA",2),P("VUELVE",3)],
reardelt:[P("ABRE",2),P("VUELVE",3)],
shrugs:[P("SUBE",2),P("BAJA",3)],
frenchpress:[P("EXTIENDE",2),P("VUELVE",3)],
pushdown:[P("EXTIENDE",2),P("VUELVE",3)],
machinedips:[P("EMPUJA",2),P("VUELVE",3)],
overheadtri:[P("EXTIENDE",2),P("VUELVE",3)],
kickbacks:[P("EXTIENDE",2),P("VUELVE",3)],
diamond:[P("EMPUJA",2),P("VUELVE",3)],
barcurl:[P("SUBE",2),P("BAJA",3)],
hammercurl:[P("SUBE",2),P("BAJA",3)],
concentration:[P("SUBE",2),P("BAJA",3)],
preacher:[P("SUBE",2),P("BAJA",3)],
inclinecurl:[P("SUBE",2),P("BAJA",3)],
cablecurl:[P("SUBE",2),P("BAJA",3)],
legext:[P("EXTIENDE",2),P("VUELVE",3)],
lunges:[P("BAJA",3),P("SUBE",2)],
calf:[P("SUBE",2),P("BAJA",3)]
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE="adaptive_gym_v2";
let health=FALLBACK,saved=loadSaved(),selected=new Set(saved.lastSelection?.length?saved.lastSelection:TEMPLATES[0].ids),activeTemplate="",viewDay=localDay(),editingPlanId=null;
let session=null,timerHandle=null,clockHandle=null,timerMode="idle",timerTotal=0,timerLeft=0,timerDeadline=0,timerLastBeat=-1,audioCtx=null,soundOn=true,wakeLock=null,restCueMarks=new Set(),coachVoice=null;
function normalizePlans(raw={}){
  const out={};
  for(const [day,value] of Object.entries(raw||{})){
    if(Array.isArray(value)&&value.every(x=>typeof x==="string")) out[day]=value.length?[{id:`legacy-${day}`,name:"Sesión 1",ids:value}]:[];
    else if(Array.isArray(value)) out[day]=value.filter(x=>x&&Array.isArray(x.ids)).map((x,i)=>({id:x.id||`plan-${day}-${i+1}`,name:x.name||`Sesión ${i+1}`,ids:x.ids.filter(id=>exById(id))}));
  }
  return out;
}
function loadSaved(){
  try{
    const old=JSON.parse(localStorage.getItem("adaptive_gym_v1"))||{},x=JSON.parse(localStorage.getItem(STORE))||{};
    return {history:Array.isArray(x.history)?x.history:(Array.isArray(old.history)?old.history:[]),kg:x.kg&&typeof x.kg==="object"?x.kg:(old.kg||{}),lastReps:x.lastReps&&typeof x.lastReps==="object"?x.lastReps:{},lastSets:x.lastSets&&typeof x.lastSets==="object"?x.lastSets:{},plans:normalizePlans(x.plans&&typeof x.plans==="object"?x.plans:{}),routines:Array.isArray(x.routines)?x.routines:[],lastSelection:Array.isArray(x.lastSelection)?x.lastSelection:(old.lastSelection||[]),coachMode:x.coachMode||"voice"};
  }catch{return {history:[],kg:{},lastReps:{},lastSets:{},plans:{},routines:[],lastSelection:[],coachMode:"voice"}}
}
function persist(){saved.lastSelection=[...selected];saved.coachMode=$("#coachMode")?.value||saved.coachMode||"tones";localStorage.setItem(STORE,JSON.stringify(saved))}
function localDay(delta=0){const d=new Date();d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function addDays(day,delta){const d=new Date(day+"T12:00:00");d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function prettyDayKey(day){return new Intl.DateTimeFormat("es-ES",{weekday:"long",day:"numeric",month:"long"}).format(new Date(day+"T12:00:00"))}
function exById(id){return EXERCISES.find(x=>x.id===id)}
function sameSelection(ids,set=selected){if(ids.length!==set.size)return false;return ids.every(id=>set.has(id))}
function matchingTemplateId(set=selected){return TEMPLATES.find(t=>sameSelection(t.ids,set))?.id||""}
function phasesFor(ex){return TEMPO_PHASES[ex?.id]||[P("MUEVE",2),P("VUELVE",3)]}
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
    return;
  }
  const phases=phasesFor(ex),per=repSeconds(ex),count=Math.max(1,Number(reps)||ex.repsDefault||1);
  $("#tempoInfo").textContent=`TEMPO PRESCRITO · ${secLabel(per)} s / rep`;
  $("#coachCue").textContent=phasePlanText(ex);
  $("#phaseSummary").textContent=`${count} reps · ${fmt(per*count)} de trabajo`;
  $("#beatReadout").innerHTML=phases.map(p=>`<i><b>${p.cue}</b><small>${secLabel(p.sec)}s</small></i>`).join("");
}
function currentEx(){return session?exById(session.ids[session.exIndex]):null}
function currentKg(ex){return Number(saved.kg?.[ex.id]??ex.kg??0)}
function currentReps(ex){return Number(saved.lastReps?.[ex.id]??ex.repsDefault??0)}
function currentSets(ex){return Math.max(1,Number(saved.lastSets?.[ex.id]??ex.sets??4))}
function runSets(ex){return Math.max(1,Number($("#setsInput")?.value)||currentSets(ex))}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")}
function syncDock(){const dock=$("#selectionDock");if(!dock)return;$("#dockCount").textContent=selected.size;dock.classList.toggle("hidden",$("#setupView").classList.contains("hidden")||!selected.size)}
function show(view){document.body.classList.toggle("session-active",view==="#runView");["#setupView","#runView","#resultView"].forEach(id=>$(id).classList.add("hidden"));if(view)$(view).classList.remove("hidden");syncDock();if(view)requestAnimationFrame(()=>$(view).scrollIntoView({block:"start"}))}

function dayPlans(day=viewDay){return Array.isArray(saved.plans?.[day])?saved.plans[day]:[]}
function planLabel(day){return `Sesión ${dayPlans(day).length+1}`}
function renderDaily(){
  const plans=dayPlans(viewDay);
  $("#dailyDate").textContent=prettyDayKey(viewDay);
  $("#dayPicker").value=viewDay;
  $("#dailyCount").textContent=plans.length?`${plans.length} ${plans.length===1?"sesión":"sesiones"}`:"Sin plan";
  $("#deleteDay").disabled=!plans.length;$("#deleteDay").style.opacity=plans.length?"1":".4";
  $("#dailyExercises").innerHTML=plans.length?plans.map(plan=>`<article class="day-session" data-plan="${plan.id}">
    <div class="day-session-head"><div><b>${plan.name}</b><small>${plan.ids.length} ejercicios</small></div><button class="plan-x" data-delete-plan="${plan.id}" aria-label="Borrar sesión">×</button></div>
    <div class="daily-exercises">${plan.ids.map(id=>{const ex=exById(id);return ex?`<span class="daily-pill">${ex.name}<button data-remove-ex="${id}" data-plan="${plan.id}" aria-label="Quitar ${ex.name}">×</button></span>`:""}).join("")}</div>
    <div class="day-session-actions"><button data-play-plan="${plan.id}">▶ PLAY</button><button data-edit-plan="${plan.id}">EDITAR</button></div>
  </article>`).join(""):'<span class="daily-empty">No hay sesión programada para este día.</span>';
}
function renderSavedRoutines(){
  $("#savedRoutines").innerHTML=(saved.routines||[]).length?saved.routines.map(r=>`<div class="saved-routine"><button data-use-routine="${r.id}"><b>${r.name}</b><small>${r.ids.length} ejercicios</small></button><button class="plan-x" data-delete-routine="${r.id}">×</button></div>`).join(""):'<span class="hint">Aún no hay rutinas guardadas.</span>';
}
function renderSetup(){
  activeTemplate=matchingTemplateId(selected);
  $("#templates").innerHTML=TEMPLATES.map(t=>`<button class="template ${t.id===activeTemplate?"active":""}" data-template="${t.id}">${t.name}</button>`).join("");
  renderSavedRoutines();
  const ordered=[...EXERCISES].sort((a,b)=>(selected.has(b.id)-selected.has(a.id))||a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  $("#exerciseList").innerHTML=ordered.map(x=>`<label class="exercise"><input type="checkbox" data-ex="${x.id}" ${selected.has(x.id)?"checked":""}><div><b>${x.name}</b><small>${x.group} · ${currentSets(x)}×${x.durationSec?x.reps:currentReps(x)}${x.rir?` · RIR ${x.rir}`:""} · descanso ${x.rest}s</small></div><span class="seconds">${x.durationSec?fmt(x.durationSec):`${secLabel(repSeconds(x))}s/rep`}<small>${x.durationSec?"":fmt(workSeconds(x,currentReps(x)))}</small></span></label>`).join("");
  $("#selectedCount").textContent=`${selected.size} ejercicios`;syncDock();
}
function chooseTemplate(id){const t=TEMPLATES.find(x=>x.id===id);if(!t)return;selected=new Set(t.ids);persist();renderSetup()}
function openEditor(planId=null,day=viewDay){viewDay=day;editingPlanId=planId;const plan=planId?dayPlans(day).find(x=>x.id===planId):null;selected=new Set(plan?.ids||[]);$("#routineName").value=plan?.name||"";renderDaily();renderSetup();show("#setupView")}
function savePlan(delta){if(!selected.size)return;const targetDay=addDays(viewDay,delta),plans=dayPlans(targetDay),existing=delta===0&&editingPlanId?plans.find(x=>x.id===editingPlanId):null;const name=$("#routineName").value.trim()||existing?.name||planLabel(targetDay);if(existing){existing.ids=[...selected];existing.name=name}else plans.push({id:`plan-${Date.now().toString(36)}`,name,ids:[...selected]});saved.plans[targetDay]=plans;persist();viewDay=targetDay;editingPlanId=null;renderDaily();show(null)}
function saveRoutine(){if(!selected.size)return;const name=$("#routineName").value.trim()||`Rutina ${(saved.routines||[]).length+1}`;saved.routines=saved.routines||[];saved.routines.push({id:`routine-${Date.now().toString(36)}`,name,ids:[...selected],createdAt:new Date().toISOString()});persist();renderSavedRoutines();flash("Rutina guardada")}
function deleteRoutine(id){saved.routines=(saved.routines||[]).filter(r=>r.id!==id);persist();renderSavedRoutines()}
function deletePlan(planId){saved.plans[viewDay]=dayPlans(viewDay).filter(p=>p.id!==planId);persist();renderDaily()}
function removeExerciseFromPlan(planId,exId){const p=dayPlans(viewDay).find(x=>x.id===planId);if(!p)return;p.ids=p.ids.filter(id=>id!==exId);if(!p.ids.length)return deletePlan(planId);persist();renderDaily()}
function deleteDay(){if(!dayPlans(viewDay).length)return;delete saved.plans[viewDay];persist();renderDaily()}
function changeDay(delta){viewDay=addDays(viewDay,delta);editingPlanId=null;renderDaily()}
function flash(msg){const el=$("#selectedCount"),old=el.textContent;el.textContent=msg;setTimeout(()=>{if(el)el.textContent=old},1400)}
function startWorkout(ids=[...selected],meta={}){
  if(!ids.length)return;
  clearTimer();stopClock();
  session={id:Date.now(),startedAt:Date.now(),ids:[...ids],exIndex:0,setIndex:0,records:[],skipped:[],paused:false,activeMs:0,clockLast:performance.now(),timerWasRunning:false,planId:meta.planId||null,planDay:meta.planDay||viewDay,planName:meta.planName||$("#routineName")?.value?.trim()||"Sesión libre",setStartedAt:null};
  acquireWakeLock();show("#runView");$("#coachMode").value=saved.coachMode||"voice";$("#sessionClock").textContent="00:00";$("#sessionPause").textContent="Ⅱ PAUSA";$("#sessionPause").classList.remove("paused");startClock();showCurrent();
  const ex=currentEx();setTimeout(()=>announceCurrent(ex,true),250);
}
function startClock(){stopClock();if(!session)return;session.clockLast=performance.now();clockHandle=setInterval(()=>{if(!session)return;const now=performance.now();if(!session.paused)session.activeMs+=Math.max(0,now-session.clockLast);session.clockLast=now;$("#sessionClock").textContent=fmt(session.activeMs/1000)},250)}
function stopClock(){if(clockHandle){clearInterval(clockHandle);clockHandle=null}}
function toggleSessionPause(){
  if(!session)return;
  const now=performance.now();if(!session.paused)session.activeMs+=Math.max(0,now-session.clockLast);session.clockLast=now;
  session.paused=!session.paused;$("#sessionPause").textContent=session.paused?"▶ CONTINUAR":"Ⅱ PAUSA";$("#sessionPause").classList.toggle("paused",session.paused);
  if(session.paused){session.timerWasRunning=!!timerHandle;pauseTimer();if("speechSynthesis"in window)speechSynthesis.cancel();setTrainer("Sesión en pausa.",false)}
  else{setTrainer("Seguimos.",false);if(session.timerWasRunning&&(timerMode==="running"||timerMode==="rest"))runClock(timerMode==="running"?()=>completeSet(false):advanceAfterRest)}
  renderTimer();
}
function showCurrent(){
  const ex=currentEx();if(!ex){finishSession();return}
  clearTimer();timerMode="idle";const reps=ex.durationSec?0:currentReps(ex),sets=currentSets(ex);timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;
  $("#runProgress").textContent=`EJERCICIO ${session.exIndex+1}/${session.ids.length}`;$("#runName").textContent=ex.name;
  $("#runMeta").textContent=`${ex.group}${ex.rir?` · RIR ${ex.rir}`:""} · ${ex.rest}s descanso`;
  $("#kgInput").value=currentKg(ex);$("#repsInput").value=reps;$("#setsInput").value=sets;$("#repsInput").disabled=!!ex.durationSec;
  $("#runNote").textContent=ex.note||"";$("#runNote").classList.toggle("hidden",!ex.note);
  updatePhaseUI(ex,reps);
  $("#repReadout").textContent=ex.durationSec?"TIEMPO":`1/${reps}`;setBeat(-1);renderTimer();$("#timerAction").textContent="▶ START SERIE";$("#timerAction").classList.remove("running");
}
function announceCurrent(ex,first=false){
  if(!ex)return;
  const repsN=ex.durationSec?null:currentReps(ex),reps=ex.durationSec?`${ex.durationSec} segundos`:`${repsN} repeticiones`,kg=currentKg(ex),setNo=session?.setIndex+1||1,sets=runSets(ex);
  const intro=first?`Vamos, Adri. Empezamos con ${ex.name}.`:`Siguiente ejercicio: ${ex.name}.`;
  const load=kg>0?` ${kg} kilos.`:"";
  const rhythm=ex.durationSec?"":` El ritmo es ${phasesFor(ex).map(p=>`${p.cue.toLowerCase()} ${String(p.sec).replace(".",",")} segundos`).join(", y después ")}.`;
  const visual=ex.durationSec?`${kg||"—"} KG · ${ex.durationSec} S · ${sets} SERIES`:`${kg||"—"} KG · ${repsN} REPS · ${sets} SERIES`;
  setTrainer(`${intro}${load} ${reps}. Serie ${setNo} de ${sets}.${rhythm}`,true,1.12,visual);
}
async function ensureAudio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==="suspended")await audioCtx.resume();return audioCtx.state==="running"}catch{return false}}
function tone(f,dur=.026,gain=.016,type="square",delay=0){if(!soundOn||!audioCtx||audioCtx.state!=="running")return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;o.type=type;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01)}
function playTick(strong=false,step=0){const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.034:.026,strong?.026:.016,"square")}
function playDone(){[440,587.33,783.99,1046.5].forEach((f,i)=>tone(f,i===3?.11:.052,i===3?.024:.020,i%2?"sine":"triangle",i*.047))}
function chooseCoachVoice(){if(!("speechSynthesis"in window))return null;const voices=speechSynthesis.getVoices().filter(v=>/^es(-|_)/i.test(v.lang)||/spanish|español/i.test(v.name));coachVoice=voices.find(v=>/google.*español|microsoft.*(alvaro|elvira)|natural|neural/i.test(v.name))||voices.find(v=>/^es-ES/i.test(v.lang))||voices[0]||null;return coachVoice}
function speak(text,rate=1.07){
  if(!soundOn||($("#coachMode")?.value!=="voice"))return false;
  const cue=String(text).trim().split(/\s+/).length<=2;
  if(window.AdrianVoice)return window.AdrianVoice.speak(text,{lang:"es-ES",style:cue?"cue":"coach",rate:rate>1.25?undefined:rate,interrupt:cue,volume:.94});
  if(!("speechSynthesis"in window))return false;
  const u=new SpeechSynthesisUtterance(text);u.lang="es-ES";u.rate=Math.min(1.16,rate||1.07);u.pitch=1;u.volume=.92;u.voice=coachVoice||chooseCoachVoice();speechSynthesis.speak(u);return true;
}
function setTrainer(text,voice=true,rate=1.07,visual=null){$("#trainerTalk").textContent=visual||text;if(voice)speak(text,rate)}
function coachPhase(index){
  const mode=$("#coachMode").value,phases=phasesFor(currentEx()),phase=phases[index];if(!soundOn||!phase)return;
  if(mode==="voice"){if("speechSynthesis"in window&&speechSynthesis.speaking)speechSynthesis.cancel();speak(phase.cue,1.25)}
  else if(mode==="ticks")playTick(index===0,index);
  else{const f=[1046.5,830.61,740,932.33][index%4];tone(f,index===0?.055:.04,index===0?.026:.018,index===0?"triangle":"sine")}
}
function setBeat(n){$$(".beat-readout i").forEach((el,i)=>el.classList.toggle("active",i===n))}
function renderTimer(){
  const ex=currentEx(),label=timerMode==="rest"?"DESCANSO":`SERIE ${session?.setIndex+1||1}/${ex?runSets(ex):1}`;
  $("#timerStage").classList.toggle("rest-mode",timerMode==="rest");
  if(window.AdrianVisualTimer)window.AdrianVisualTimer.update($("#timerRing"),{remaining:Math.max(0,timerLeft),total:Math.max(1,timerTotal),text:fmt(timerLeft),label,paused:!!session?.paused});
  else $("#timerRing").textContent=`${fmt(timerLeft)} · ${label}`;
}
function clearTimer(){if(timerHandle){clearInterval(timerHandle);timerHandle=null}timerLastBeat=-1}
function pauseTimer(){if(timerHandle){timerLeft=Math.max(0,(timerDeadline-performance.now())/1000);clearInterval(timerHandle);timerHandle=null}}
async function startSet(){
  if(!session||session.paused)return;
  if(timerMode==="rest"){advanceAfterRest();return}
  if(timerMode==="running")return;
  await ensureAudio();const ex=currentEx(),reps=ex.durationSec?0:Math.max(1,Number($("#repsInput").value)||currentReps(ex));
  timerMode="running";timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;timerLastBeat=-1;session.setStartedAt=Date.now();
  $("#timerAction").textContent="EN CURSO";$("#timerAction").classList.add("running");setTrainer(`Serie ${session.setIndex+1}. Vamos con ella.`,true,1.2,`SERIE ${session.setIndex+1} / ${runSets(ex)}`);runClock(()=>completeSet(false));
}
function runClock(onEnd){
  clearTimer();timerDeadline=performance.now()+timerLeft*1000;
  timerHandle=setInterval(()=>{
    if(!session||session.paused)return;timerLeft=Math.max(0,(timerDeadline-performance.now())/1000);
    if(timerMode==="running")updateTempo();
    else if(timerMode==="rest"){
      const shown=Math.ceil(timerLeft);
      if(shown===20&&!restCueMarks.has(20)){restCueMarks.add(20);setTrainer("Te quedan 20 segundos. Ve preparándote con calma para la siguiente serie.",true,1.15,"20 s · PREPÁRATE")}
      if(shown===8&&!restCueMarks.has(8)){restCueMarks.add(8);setTrainer("Quedan ocho segundos. Colócate y deja todo listo.",true,1.18,"8 s · LISTO")}
      if(shown>0&&shown<=3&&shown!==timerLastBeat){timerLastBeat=shown;playTick(true,shown)}
    }
    renderTimer();if(timerLeft<=0){clearTimer();onEnd()}
  },60);
}
function updateTempo(){
  const ex=currentEx();if(!ex||ex.durationSec){setBeat(-1);return}
  const phases=phasesFor(ex),per=repSeconds(ex),elapsed=Math.max(0,timerTotal-timerLeft),target=Math.max(1,Number($("#repsInput").value)||currentReps(ex)||1);
  const repIndex=Math.min(target-1,Math.floor(elapsed/per)),inside=Math.max(0,elapsed-repIndex*per);
  let phaseIndex=phases.length-1,acc=0;
  for(let i=0;i<phases.length;i++){acc+=phases[i].sec;if(inside<acc){phaseIndex=i;break}}
  const eventKey=repIndex*10+phaseIndex;
  if(eventKey!==timerLastBeat){timerLastBeat=eventKey;setBeat(phaseIndex);coachPhase(phaseIndex)}
  $("#repReadout").textContent=`${Math.min(target,repIndex+1)}/${target}`;
}
function completeSet(manual=true){
  if(!session||timerMode==="rest")return;const ex=currentEx();clearTimer();setBeat(-1);
  const kg=Math.max(0,Number($("#kgInput").value)||0),reps=ex.durationSec?0:Math.max(1,Number($("#repsInput").value)||currentReps(ex)),sets=runSets(ex),actualSec=session.setStartedAt?Math.round((Date.now()-session.setStartedAt)/100)/10:null;
  saved.kg[ex.id]=kg;saved.lastSets[ex.id]=sets;if(!ex.durationSec)saved.lastReps[ex.id]=reps;
  session.records.push({exerciseId:ex.id,exerciseName:ex.name,set:session.setIndex+1,plannedSets:sets,kg,reps,durationSec:ex.durationSec||null,prescribedRepSeconds:ex.durationSec?null:repSeconds(ex),phases:ex.durationSec?[]:phasesFor(ex),restSec:ex.rest,actualSec,at:Date.now(),manual});persist();
  if(session.setIndex+1>=sets&&session.exIndex+1>=session.ids.length){playDone();finishSession();return}
  startRest(ex.rest);
}
function startRest(sec){
  timerMode="rest";timerTotal=sec;timerLeft=sec;timerLastBeat=-1;restCueMarks=new Set();$("#repReadout").textContent="REST";$("#timerAction").textContent="SALTAR DESCANSO";$("#timerAction").classList.remove("running");renderTimer();
  const done=(session.records.length%3===0)?"Muy bien. Otra serie hecha.":(session.records.length%2===0?"Bien. Seguimos sumando.":"Bien. Serie hecha.");
  setTrainer(`${done} Descansa ${sec} segundos. Respira y suelta un poco.`,true,1.15,`DESCANSO · ${sec} s`);runClock(advanceAfterRest);
}
function advanceAfterRest(){
  clearTimer();const prev=currentEx(),same=session.setIndex+1<runSets(prev);
  if(same)session.setIndex++;else{session.exIndex++;session.setIndex=0}
  const next=currentEx();showCurrent();
  if(!next)return;
  if(same)setTrainer(`Descanso terminado. Vamos con la serie ${session.setIndex+1} de ${runSets(next)}. Mantén el mismo control.`,true,1.15,`SERIE ${session.setIndex+1} / ${runSets(next)}`);
  else announceCurrent(next,false);
}
function skipExercise(){const ex=currentEx();if(!ex)return;session.skipped.push(ex.id);clearTimer();session.exIndex++;session.setIndex=0;const next=currentEx();showCurrent();if(next)announceCurrent(next,false)}
function finishSession(){
  if(!session)return;pauseTimer();stopClock();if("speechSynthesis"in window)speechSynthesis.cancel();releaseWakeLock();
  const totalSets=session.ids.reduce((n,id)=>{const ex=exById(id);return n+(ex?currentSets(ex):0)},0),minutes=Math.max(1,Math.round(session.activeMs/60000));
  const rec={id:session.id,date:new Date(session.startedAt).toISOString(),finishedAt:new Date().toISOString(),planId:session.planId,planDay:session.planDay,planName:session.planName,minutes,sets:session.records.length,totalSets,exercises:new Set(session.records.map(r=>r.exerciseId)).size,planned:session.ids.length,skipped:session.skipped.length,records:session.records};
  saved.history=[...(saved.history||[]),rec].slice(-365);persist();const summary=`Sesión terminada. ${rec.sets} series, ${rec.exercises} ejercicios y ${rec.minutes} minutos. Buen trabajo.`;session=null;renderHistory();renderResult(rec);show("#resultView");setTimeout(()=>speak(summary,1.08),300);
}
function renderResult(r){$("#resultTitle").textContent=`${r.sets} series completadas`;$("#resultGrid").innerHTML=[["SERIES",r.sets],["EJERCICIOS",r.exercises],["MIN",r.minutes]].map(x=>`<div class="result-card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("")}
function dayKeyFromIso(iso){return new Date(iso).toLocaleDateString("sv-SE")}
function renderHistory(){const h=(saved.history||[]).slice(-10),total=(saved.history||[]).reduce((n,x)=>n+x.sets,0);$("#historyLabel").textContent=h.length?`${saved.history.length} sesiones · ${total} series`:"Sin sesiones";$("#workoutChart").innerHTML=h.length?h.map(x=>{const pct=x.totalSets?Math.max(8,Math.round(100*x.sets/x.totalSets)):8;return `<i class="workout-bar" style="height:${pct}%" title="${x.sets}/${x.totalSets} series · ${x.minutes} min"><span>${x.sets}</span></i>`}).join(""):'<div class="hint">Tu primera sesión aparecerá aquí.</div>'}
function exportDayJson(){
  const sessions=(saved.history||[]).filter(r=>dayKeyFromIso(r.date)===viewDay);
  const plans=dayPlans(viewDay).map(p=>({...p,exercises:p.ids.map(id=>{const ex=exById(id);return ex?{id:ex.id,name:ex.name,sets:currentSets(ex),reps:ex.durationSec?ex.reps:currentReps(ex),restSec:ex.rest,phases:ex.durationSec?[]:phasesFor(ex)}:null}).filter(Boolean)}));
  const payload={schema:"ADAPTIVE_GYM_DAY_V1",day:viewDay,exportedAt:new Date().toISOString(),plans,sessions,lastKnown:{kg:saved.kg,lastReps:saved.lastReps,lastSets:saved.lastSets}};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`adaptive-gym-${viewDay}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function acquireWakeLock(){try{if("wakeLock"in navigator)wakeLock=await navigator.wakeLock.request("screen")}catch{}}
function releaseWakeLock(){try{wakeLock?.release()}catch{}wakeLock=null}

function renderHealth(){const m=$("#metrics");m.innerHTML=Object.values(health.metrics).map(x=>`<div class="metric ad-card"><b>${x.v}<small>${x.u}</small></b><span>${x.label}</span><small>${x.note||""}</small></div>`).join("");$("#scoreLabel").textContent=health.score==null?"Esperando datos normalizados":health.score+" / 100";$("#scoreFill").style.width=(health.score??0)+"%";$("#decision").textContent=health.decision;$("#sources").innerHTML=health.sources.map(x=>`<div class="source"><b>${x[0]}</b><span class="${x[2]}">${x[1]}</span></div>`).join("");drawHealth()}
function drawHealth(){const key=$("#chartMetric").value,a=health.series[key]||[],el=$("#chart");if(!a.length){el.innerHTML='<div class="hint">Sin serie fiable todavía.</div>';return}const lo=Math.min(...a),hi=Math.max(...a),span=hi-lo||1;el.innerHTML=a.map(v=>`<i class="bar" title="${v}" style="height:${25+75*(v-lo)/span}%"></i>`).join("")}
async function loadHealth(){try{const r=await fetch("./data/latest.json?"+Date.now(),{cache:"no-store"});if(r.ok)health=await r.json()}catch{}renderHealth()}

$("#templates").addEventListener("click",e=>{const b=e.target.closest("[data-template]");if(b)chooseTemplate(b.dataset.template)});
$("#savedRoutines").addEventListener("click",e=>{const use=e.target.closest("[data-use-routine]"),del=e.target.closest("[data-delete-routine]");if(del){deleteRoutine(del.dataset.deleteRoutine);return}if(use){const r=(saved.routines||[]).find(x=>x.id===use.dataset.useRoutine);if(r){selected=new Set(r.ids);$("#routineName").value=r.name;renderSetup()}}});
$("#exerciseList").addEventListener("change",e=>{const id=e.target.dataset.ex;if(!id)return;e.target.checked?selected.add(id):selected.delete(id);persist();renderSetup()});
$("#clearSelection").onclick=()=>{selected.clear();persist();renderSetup()};$("#saveToday").onclick=()=>savePlan(0);$("#saveTomorrow").onclick=()=>savePlan(1);$("#saveRoutine").onclick=saveRoutine;
$("#prevDay").onclick=()=>changeDay(-1);$("#nextDay").onclick=()=>changeDay(1);$("#dayPicker").onchange=e=>{if(e.target.value){viewDay=e.target.value;editingPlanId=null;renderDaily()}};$("#addSession").onclick=()=>openEditor(null,viewDay);$("#deleteDay").onclick=deleteDay;
$("#dailyExercises").addEventListener("click",e=>{const play=e.target.closest("[data-play-plan]"),edit=e.target.closest("[data-edit-plan]"),del=e.target.closest("[data-delete-plan]"),remove=e.target.closest("[data-remove-ex]");if(remove){removeExerciseFromPlan(remove.dataset.plan,remove.dataset.removeEx);return}if(del){deletePlan(del.dataset.deletePlan);return}if(edit){openEditor(edit.dataset.editPlan,viewDay);return}if(play){const p=dayPlans(viewDay).find(x=>x.id===play.dataset.playPlan);if(p)startWorkout(p.ids,{planId:p.id,planDay:viewDay,planName:p.name})}});
$("#closeSetup").onclick=()=>{editingPlanId=null;show(null)};const startSelected=()=>startWorkout([...selected],{planId:editingPlanId,planDay:viewDay,planName:$("#routineName").value.trim()||"Sesión libre"});$("#startWorkout").onclick=startSelected;$("#startWorkoutDock").onclick=startSelected;
$("#timerAction").onclick=startSet;$("#completeNow").onclick=()=>timerMode==="rest"?advanceAfterRest():completeSet(true);$("#sessionPause").onclick=toggleSessionPause;
$("#skipExercise").onclick=skipExercise;$("#finishWorkout").onclick=finishSession;$("#anotherRun").onclick=()=>{renderDaily();show(null);window.scrollTo({top:0,behavior:"smooth"})};$("#exportJson").onclick=exportDayJson;
function changeRunNumber(kind,delta){
  if(!session)return;const ex=currentEx();if(!ex)return;
  const input=kind==="kg"?$("#kgInput"):kind==="sets"?$("#setsInput"):$("#repsInput");
  const min=kind==="kg"?0:kind==="sets"?Math.max(1,session.setIndex+1):1,max=kind==="sets"?12:999;
  input.value=Math.min(max,Math.max(min,(Number(input.value)||min)+delta));
  if(kind==="sets"){saved.lastSets[ex.id]=Number(input.value);persist();renderTimer()}
  if(kind==="reps"&&timerMode==="idle"&&!ex.durationSec){const reps=Number(input.value)||currentReps(ex);timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;updatePhaseUI(ex,reps);renderTimer()}
}
$$("[data-step]").forEach(b=>{
  let delay=null,repeat=null;const act=()=>changeRunNumber(b.dataset.step,Number(b.dataset.delta));
  b.addEventListener("pointerdown",e=>{e.preventDefault();act();delay=setTimeout(()=>{repeat=setInterval(act,110)},420)});
  const stop=()=>{clearTimeout(delay);clearInterval(repeat);delay=repeat=null};
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,stop));
});
$("#setsInput").onchange=()=>{if(!session)return;const ex=currentEx(),min=Math.max(1,session.setIndex+1);$("#setsInput").value=Math.min(12,Math.max(min,Number($("#setsInput").value)||currentSets(ex)));saved.lastSets[ex.id]=Number($("#setsInput").value);persist();renderTimer()};
$("#repsInput").onchange=()=>{if(!session||currentEx()?.durationSec)return;$("#repsInput").value=Math.max(1,Number($("#repsInput").value)||currentReps(currentEx()));if(timerMode==="idle"){const ex=currentEx(),reps=Number($("#repsInput").value);timerTotal=workSeconds(ex,reps);timerLeft=timerTotal;updatePhaseUI(ex,reps);renderTimer()}};

$("#soundBtn").onclick=async()=>{soundOn=!soundOn;if(soundOn)await ensureAudio();$("#soundBtn").textContent=soundOn?"SOUND ON":"SOUND OFF";if(!soundOn&&"speechSynthesis"in window)speechSynthesis.cancel()};
$("#coachMode").onchange=()=>persist();$("#chartMetric").onchange=drawHealth;
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&session)acquireWakeLock()});
renderDaily();renderSetup();renderHistory();$("#coachMode").value=saved.coachMode||"tones";loadHealth();