const STORE='cambioHistoryV1',ACTIVE='cambioActiveV1';
const TRANSITION_MS=2*60*1000,LANDING_MS=5*60*1000;
const targets=[
  {id:'anki',name:'Anki',sub:'Hacer tarjetas, no configurar'},
  {id:'hoti',name:'HOTI0108',sub:'Entrar y hacer la siguiente tarea'},
  {id:'empleo',name:'Buscar trabajo',sub:'Abrir ofertas y actuar'},
  {id:'limpieza',name:'Limpieza',sub:'Una acción física concreta'},
  {id:'gym',name:'Gimnasio',sub:'Prepararte y salir'},
  {id:'otro',name:'Otra tarea',sub:'Cualquier cambio intencional'}
];
const $=s=>document.querySelector(s);
const els={choose:$('#chooseView'),timerView:$('#timerView'),targets:$('#targets'),start:$('#startBtn'),phase:$('#phaseLabel'),title:$('#targetTitle'),timer:$('#timer'),instruction:$('#instruction'),next:$('#nextBtn'),cancel:$('#cancelBtn'),history:$('#history'),today:$('#todayCount'),streak:$('#streakCount'),total:$('#totalCount')};
let selected=null,active=null,tickId=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const history=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return[]}};
const dayKey=d=>new Date(d).toLocaleDateString('sv-SE');
function saveHistory(rows){localStorage.setItem(STORE,JSON.stringify(rows.slice(0,100)))}
function renderTargets(){
  els.targets.innerHTML=targets.map(t=>`<button class="target" data-id="${t.id}"><b>${esc(t.name)}</b><small>${esc(t.sub)}</small></button>`).join('');
  els.targets.querySelectorAll('.target').forEach(b=>b.onclick=()=>selectTarget(b.dataset.id));
}
function selectTarget(id){selected=targets.find(t=>t.id===id);els.targets.querySelectorAll('.target').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));els.start.disabled=!selected}
function startTransition(){
  if(!selected)return;
  active={target:selected,phase:'transition',startedAt:Date.now(),deadline:Date.now()+TRANSITION_MS};
  persistActive();showActive();runTimer();
}
function beginLanding(){
  if(!active)return;
  active.phase='landing';active.landingStartedAt=Date.now();active.deadline=Date.now()+LANDING_MS;
  persistActive();showActive();runTimer();
}
function cancelActive(){
  active=null;localStorage.removeItem(ACTIVE);clearInterval(tickId);tickId=null;
  els.timerView.classList.add('hidden');els.choose.classList.remove('hidden');selected=null;
  els.start.disabled=true;els.targets.querySelectorAll('.target').forEach(b=>b.classList.remove('selected'));
}
function persistActive(){localStorage.setItem(ACTIVE,JSON.stringify(active))}
function restoreActive(){try{active=JSON.parse(localStorage.getItem(ACTIVE)||'null')}catch{active=null}}
function showActive(){
  els.choose.classList.add('hidden');els.timerView.classList.remove('hidden');
  els.title.textContent=active.target.name;
  if(active.phase==='transition'){
    els.phase.textContent='2 · SUELTA LO ANTERIOR';els.next.textContent='YA HE EMPEZADO';els.next.disabled=false;
    els.instruction.textContent='Cierra lo anterior. Levántate. Prepara únicamente lo necesario para empezar.';
  }else{
    els.phase.textContent='3 · ATERRIZA EN LA NUEVA TAREA';els.next.textContent='5 MIN EN CURSO';els.next.disabled=true;
    els.instruction.textContent='No optimices el sistema. Haz solamente la tarea durante 5 minutos.';
  }
}
function format(ms){const s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60),r=s%60;return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`}
function complete(){
  if(!active)return;
  const rows=history();
  rows.unshift({id:Date.now().toString(36),target:active.target.name,completedAt:new Date().toISOString(),transitionStartedAt:new Date(active.startedAt).toISOString()});
  saveHistory(rows);active=null;localStorage.removeItem(ACTIVE);clearInterval(tickId);tickId=null;
  els.timerView.classList.add('hidden');els.choose.classList.remove('hidden');selected=null;els.start.disabled=true;
  els.targets.querySelectorAll('.target').forEach(b=>b.classList.remove('selected'));drawStats();
}
function runTimer(){
  clearInterval(tickId);
  const update=()=>{
    if(!active)return;
    const left=active.deadline-Date.now();els.timer.textContent=format(left);
    if(left>0)return;
    if(active.phase==='landing'){complete();return}
    els.timer.textContent='00:00';els.phase.textContent='AHORA · EMPIEZA';els.instruction.textContent=`Empieza ${active.target.name}. Cuando estés realmente dentro, pulsa “YA HE EMPEZADO”.`;
    if(navigator.vibrate)navigator.vibrate([180,100,180]);clearInterval(tickId);tickId=null;
  };
  update();if(active)tickId=setInterval(update,500);
}
function drawStats(){
  const rows=history(),today=dayKey(Date.now()),todayRows=rows.filter(r=>dayKey(r.completedAt)===today);
  els.today.textContent=todayRows.length;els.total.textContent=rows.length;
  const days=new Set(rows.map(r=>dayKey(r.completedAt)));let streak=0,d=new Date();
  while(days.has(dayKey(d))){streak++;d.setDate(d.getDate()-1)}els.streak.textContent=streak;
  els.history.innerHTML=rows.length?rows.slice(0,8).map(r=>`<div class="hist"><b>${esc(r.target)}</b><small>${new Date(r.completedAt).toLocaleString('es-ES')}</small></div>`).join(''):'<div class="empty">Todavía no hay transiciones completadas.</div>';
}
els.start.onclick=startTransition;els.cancel.onclick=cancelActive;
els.next.onclick=()=>{if(active?.phase==='transition')beginLanding();else if(active?.phase==='landing')complete()};
$('#resetBtn').onclick=()=>{localStorage.removeItem(STORE);drawStats()};
renderTargets();drawStats();restoreActive();if(active){showActive();runTimer()}
