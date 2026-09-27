const FALLBACK={updated:null,score:null,decision:"Aún no hay suficientes datos normalizados para recomendar cambios de carga.",metrics:{weight:{v:"89,48",u:"kg",label:"Peso",note:"02/09"},fat:{v:"16,7",u:"%",label:"Grasa",note:"BIA · puntual"},muscle:{v:"71,14",u:"kg",label:"Músculo",note:"BIA · puntual"},rhr:{v:"70",u:"lpm",label:"FCR",note:"19/09 · puntual"},hrv:{v:"—",u:"ms",label:"VFC",note:"normalización pendiente"},sleep:{v:"—",u:"h",label:"Sueño",note:"deduplicación pendiente"},steps:{v:"—",u:"",label:"Pasos",note:"deduplicación pendiente"},photos:{v:"30/08",u:"",label:"Body Check",note:"última sesión"}},sources:[["Withings","Sin medición nueva","warn"],["FC / FCR","Disponible","ok"],["VFC","Disponible · normalizar","warn"],["Sueño","Duplicados detectados","warn"],["Pasos","Duplicados detectados","warn"],["Body Check","Sin sesión nueva","warn"]],series:{weight:[90.30,89.48],rhr:[73,75,74,72,69,69,67,66,67,72,72,74,71,68,70,77,81,80,72,69,66,67,70],hrv:[],sleep:[],steps:[]}};
const E=(id,name,group,o={})=>({id,name,group,sets:2,reps:"10–12",repsDefault:11,work:45,rest:60,kg:0,...o});
const EXERCISES=[
E("legpress","Prensa de piernas","Piernas",{kg:100,rir:3,source:"Gymbro",note:"Punto de partida guardado en TickTick: 100 kg. Ajusta al escalón real de la máquina."}),
E("legcurl","Curl femoral tumbado","Piernas",{kg:35,rir:3,source:"Gymbro"}),
E("latneutral","Jalón al pecho · agarre neutro","Espalda",{kg:35,source:"Gymbro",note:"Usa un recorrido cómodo. Si hoy no es un movimiento tolerado, sáltalo."}),
E("seatedrow","Remo sentado · agarre neutro","Espalda",{kg:35,rir:3,source:"Gymbro",note:"Mantén el gesto controlado; si el hombro protesta, no fuerces la serie."}),
E("bicepsmachine","Curl de bíceps · máquina/cable","Bíceps",{kg:15,rir:3,reps:"10–15",repsDefault:12,work:50,source:"Gymbro"}),
E("tricepsrope","Tríceps en polea · cuerda","Tríceps",{kg:15,rir:3,reps:"10–15",repsDefault:12,work:50,source:"Gymbro",note:"En TickTick quedó anotado dolor con ambos brazos. Si aparece dolor, salta este ejercicio."}),
E("abmachine","Abdominal en máquina","Core",{kg:35,rir:3,reps:"12–15",repsDefault:13,work:50,source:"Gymbro"}),
E("bench","Bench Press","Pecho",{source:"Archivo"}),E("inclinepress","Incline Press","Pecho",{source:"Archivo"}),E("chestfly","Chest Flyes · máquina/peck deck","Pecho",{source:"Archivo"}),
E("cablecross","Cable Crossovers","Pecho",{source:"Archivo"}),E("dips","Dips o Push-ups","Pecho",{source:"Archivo"}),E("shoulderpress","Shoulder Press","Hombros",{source:"Archivo"}),
E("latwide","Lat Pulldown · agarre ancho","Espalda",{source:"Archivo"}),E("onearmrow","One-Arm Dumbbell Row","Espalda",{source:"Archivo"}),E("seatedcable","Seated Cable Row · agarre cerrado","Espalda",{source:"Archivo"}),
E("straightarm","Straight-Arm Cable Pulldown","Espalda",{source:"Archivo"}),E("hyperext","Hyperextensions","Espalda",{source:"Archivo"}),E("reversefly","Reverse Flyes","Espalda",{source:"Archivo"}),
E("military","Seated Military Press","Hombros",{source:"Archivo"}),E("lateralraise","Lateral Raises","Hombros",{source:"Archivo"}),E("frontraise","Front Raises","Hombros",{source:"Archivo"}),
E("facepull","Face Pulls","Hombros",{source:"Archivo"}),E("reardelt","Rear Delt Raises","Hombros",{source:"Archivo"}),E("shrugs","Shrugs","Hombros",{source:"Archivo"}),
E("frenchpress","French Press","Tríceps",{source:"Archivo"}),E("pushdown","Cable Pushdowns","Tríceps",{source:"Archivo"}),E("machinedips","Machine/Bench Dips","Tríceps",{source:"Archivo"}),
E("overheadtri","Overhead Triceps Extension","Tríceps",{source:"Archivo"}),E("kickbacks","Triceps Kickbacks","Tríceps",{source:"Archivo"}),E("diamond","Diamond Push-ups","Tríceps",{source:"Archivo"}),
E("barcurl","Barbell Bicep Curls","Bíceps",{source:"Archivo"}),E("hammercurl","Dumbbell Hammer Curls","Bíceps",{source:"Archivo"}),E("concentration","Concentration Curls","Bíceps",{source:"Archivo"}),
E("preacher","Preacher Curls","Bíceps",{source:"Archivo"}),E("inclinecurl","Incline Dumbbell Curls","Bíceps",{source:"Archivo"}),E("cablecurl","Cable Bicep Curls","Bíceps",{source:"Archivo"}),
E("legext","Leg Extensions","Piernas",{source:"Archivo"}),E("lunges","Lunges","Piernas",{source:"Archivo"}),E("calf","Calf Raises","Piernas",{source:"Archivo"}),
E("plank","Plank","Core",{sets:3,reps:"45 s",repsDefault:0,work:45,source:"Archivo"})
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

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE="adaptive_gym_v1";
let health=FALLBACK, saved=loadSaved(), selected=new Set(saved.lastSelection?.length?saved.lastSelection:TEMPLATES[0].ids), activeTemplate="gymbro";
let session=null, timerHandle=null, timerMode="idle", timerTotal=0, timerLeft=0, timerLastShown=null, audioCtx=null, soundOn=true, wakeLock=null;
function loadSaved(){try{const x=JSON.parse(localStorage.getItem(STORE))||{};return {history:Array.isArray(x.history)?x.history:[],kg:x.kg&&typeof x.kg==="object"?x.kg:{},lastSelection:Array.isArray(x.lastSelection)?x.lastSelection:[]}}catch{return {history:[],kg:{},lastSelection:[]}}}
function persist(){saved.lastSelection=[...selected];localStorage.setItem(STORE,JSON.stringify(saved))}
function exById(id){return EXERCISES.find(x=>x.id===id)}
function renderSetup(){
  $("#templates").innerHTML=TEMPLATES.map(t=>`<button class="template ${t.id===activeTemplate?"active":""}" data-template="${t.id}">${t.name}</button>`).join("");
  const ordered=[...EXERCISES].sort((a,b)=>(selected.has(b.id)-selected.has(a.id))||a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  $("#exerciseList").innerHTML=ordered.map(x=>`<label class="exercise"><input type="checkbox" data-ex="${x.id}" ${selected.has(x.id)?"checked":""}><div><b>${x.name}</b><small>${x.group} · ${x.sets}×${x.reps}${x.rir?` · RIR ${x.rir}`:""} · ${x.source}</small></div><span class="seconds">${fmt(x.work)}</span></label>`).join("");
  $("#selectedCount").textContent=`${selected.size} ejercicios`;
}
function chooseTemplate(id){const t=TEMPLATES.find(x=>x.id===id);if(!t)return;activeTemplate=id;selected=new Set(t.ids);persist();renderSetup()}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")}
function currentEx(){return session?exById(session.ids[session.exIndex]):null}
function currentKg(ex){return Number(saved.kg?.[ex.id]??ex.kg??0)}
function show(view){["#setupView","#runView","#resultView"].forEach(id=>$(id).classList.add("hidden"));$(view).classList.remove("hidden")}
function startWorkout(){
  if(!selected.size)return;
  clearTimer();session={id:Date.now(),startedAt:Date.now(),ids:[...selected],exIndex:0,setIndex:0,records:[],skipped:[]};
  acquireWakeLock();show("#runView");showCurrent();
}
function showCurrent(){
  const ex=currentEx();if(!ex){finishSession();return}
  clearTimer();timerMode="idle";timerTotal=ex.work;timerLeft=ex.work;
  $("#runProgress").textContent=`EJERCICIO ${session.exIndex+1}/${session.ids.length}`;
  $("#runName").textContent=ex.name;
  $("#runMeta").textContent=`${ex.group} · ${ex.sets}×${ex.reps}${ex.rir?` · RIR ${ex.rir}`:""}`;
  $("#kgInput").value=currentKg(ex);$("#repsInput").value=ex.repsDefault||0;
  $("#runNote").textContent=ex.note||"";$("#runNote").classList.toggle("hidden",!ex.note);
  renderTimer();$("#timerAction").textContent="START SERIE";$("#timerAction").classList.remove("running");
}
async function ensureAudio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==="suspended")await audioCtx.resume();return audioCtx.state==="running"}catch{return false}}
function tone(f,dur=.026,gain=.016,type="square",delay=0){if(!soundOn||!audioCtx||audioCtx.state!=="running")return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;o.type=type;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01)}
function playTick(strong=false,step=0){const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.034:.026,strong?.026:.016,"square")}
function playDone(){[440,587.33,783.99,1046.5].forEach((f,i)=>tone(f,i===3?.11:.052,i===3?.024:.020,i%2?"sine":"triangle",i*.047))}
function renderTimer(){
  $("#timerText").textContent=fmt(timerLeft);const ex=currentEx();
  $("#timerLabel").textContent=timerMode==="rest"?"DESCANSO":`SERIE ${session.setIndex+1}/${ex?.sets||1}`;
  $("#timerRing").style.setProperty("--p",timerTotal?Math.min(100,100*(timerTotal-timerLeft)/timerTotal):0);
  $("#timerRing").classList.toggle("rest",timerMode==="rest");
}
function clearTimer(){if(timerHandle){clearInterval(timerHandle);timerHandle=null}timerLastShown=null}
async function startSet(){
  if(timerMode==="rest"){advanceAfterRest();return}
  if(timerMode==="running")return;await ensureAudio();const ex=currentEx();timerMode="running";timerTotal=ex.work;timerLeft=ex.work;timerLastShown=Math.ceil(timerLeft)+1;
  $("#timerAction").textContent="EN CURSO";$("#timerAction").classList.add("running");runClock(()=>completeSet(false));
}
function runClock(onEnd){
  clearTimer();const deadline=performance.now()+timerLeft*1000;
  timerHandle=setInterval(()=>{timerLeft=Math.max(0,(deadline-performance.now())/1000);const shown=Math.ceil(timerLeft);
    const cadence=timerTotal>120?10:1;if(shown>0&&shown!==timerLastShown&&(shown<=10||shown%cadence===0)){playTick(shown<=3,shown);timerLastShown=shown}
    renderTimer();if(timerLeft<=0){clearTimer();onEnd()}},80);
}
function completeSet(manual=true){
  if(!session||timerMode==="rest")return;const ex=currentEx();clearTimer();
  const kg=Math.max(0,Number($("#kgInput").value)||0),reps=Math.max(0,Number($("#repsInput").value)||0);
  saved.kg[ex.id]=kg;session.records.push({exerciseId:ex.id,set:session.setIndex+1,kg,reps,at:Date.now(),manual});
  persist();if(session.setIndex+1>=ex.sets&&session.exIndex+1>=session.ids.length){playDone();finishSession();return}
  startRest(ex.rest);
}
function startRest(sec){
  timerMode="rest";timerTotal=sec;timerLeft=sec;$("#timerAction").textContent="SALTAR DESCANSO";$("#timerAction").classList.remove("running");runClock(advanceAfterRest);
}
function advanceAfterRest(){
  clearTimer();const ex=currentEx();if(session.setIndex+1<ex.sets)session.setIndex++;else{session.exIndex++;session.setIndex=0}
  showCurrent();
}
function skipExercise(){
  const ex=currentEx();if(!ex)return;session.skipped.push(ex.id);clearTimer();session.exIndex++;session.setIndex=0;showCurrent();
}
function finishSession(){
  if(!session)return;clearTimer();releaseWakeLock();const endedAt=Date.now(),totalSets=session.ids.reduce((n,id)=>n+(exById(id)?.sets||0),0);
  const rec={id:session.id,date:new Date(session.startedAt).toISOString(),minutes:Math.max(1,Math.round((endedAt-session.startedAt)/60000)),sets:session.records.length,totalSets,exercises:new Set(session.records.map(r=>r.exerciseId)).size,planned:session.ids.length,skipped:session.skipped.length,records:session.records};
  saved.history=[...(saved.history||[]),rec].slice(-60);persist();session=null;renderHistory();renderResult(rec);show("#resultView");
}
function renderResult(r){
  $("#resultTitle").textContent=`${r.sets} series completadas`;
  $("#resultGrid").innerHTML=[["SERIES",r.sets],["EJERCICIOS",r.exercises],["MIN",r.minutes]].map(x=>`<div class="result-card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
}
function renderHistory(){
  const h=(saved.history||[]).slice(-10);const total=(saved.history||[]).reduce((n,x)=>n+x.sets,0);
  $("#historyLabel").textContent=h.length?`${saved.history.length} sesiones · ${total} series`:"Sin sesiones";
  $("#workoutChart").innerHTML=h.length?h.map(x=>{const pct=x.totalSets?Math.max(8,Math.round(100*x.sets/x.totalSets)):8;return `<i class="workout-bar" style="height:${pct}%" title="${x.sets}/${x.totalSets} series · ${x.minutes} min"><span>${x.sets}</span></i>`}).join(""):'<div class="hint">Tu primera sesión aparecerá aquí.</div>';
}
async function acquireWakeLock(){try{if("wakeLock"in navigator)wakeLock=await navigator.wakeLock.request("screen")}catch{}}
function releaseWakeLock(){try{wakeLock?.release()}catch{}wakeLock=null}

function renderHealth(){const m=$("#metrics");m.innerHTML=Object.values(health.metrics).map(x=>`<div class="metric ad-card"><b>${x.v}<small>${x.u}</small></b><span>${x.label}</span><small>${x.note||""}</small></div>`).join("");$("#scoreLabel").textContent=health.score==null?"Esperando datos normalizados":health.score+" / 100";$("#scoreFill").style.width=(health.score??0)+"%";$("#decision").textContent=health.decision;$("#sources").innerHTML=health.sources.map(x=>`<div class="source"><b>${x[0]}</b><span class="${x[2]}">${x[1]}</span></div>`).join("");drawHealth()}
function drawHealth(){const key=$("#chartMetric").value,a=health.series[key]||[],el=$("#chart");if(!a.length){el.innerHTML='<div class="hint">Sin serie fiable todavía.</div>';return}const lo=Math.min(...a),hi=Math.max(...a),span=hi-lo||1;el.innerHTML=a.map(v=>`<i class="bar" title="${v}" style="height:${25+75*(v-lo)/span}%"></i>`).join("")}
async function loadHealth(){try{const r=await fetch("./data/latest.json?"+Date.now(),{cache:"no-store"});if(r.ok)health=await r.json()}catch{}renderHealth()}

$("#templates").addEventListener("click",e=>{const b=e.target.closest("[data-template]");if(b)chooseTemplate(b.dataset.template)});
$("#exerciseList").addEventListener("change",e=>{const id=e.target.dataset.ex;if(!id)return;e.target.checked?selected.add(id):selected.delete(id);activeTemplate="";persist();renderSetup()});
$("#clearSelection").onclick=()=>{selected.clear();activeTemplate="";persist();renderSetup()};
$("#startWorkout").onclick=startWorkout;$("#timerAction").onclick=startSet;$("#completeNow").onclick=()=>timerMode==="rest"?advanceAfterRest():completeSet(true);
$("#skipExercise").onclick=skipExercise;$("#finishWorkout").onclick=finishSession;$("#anotherRun").onclick=()=>{show("#setupView");renderSetup()};
$$("[data-step]").forEach(b=>b.onclick=()=>{const input=b.dataset.step==="kg"?$("#kgInput"):$("#repsInput"),delta=Number(b.dataset.delta);input.value=Math.max(0,(Number(input.value)||0)+delta)});
$("#soundBtn").onclick=async()=>{soundOn=!soundOn;if(soundOn)await ensureAudio();$("#soundBtn").textContent=soundOn?"SOUND ON":"SOUND OFF"};
$("#chartMetric").onchange=drawHealth;
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&session)acquireWakeLock()});
renderSetup();renderHistory();loadHealth();