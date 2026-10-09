const API=location.origin+'/dc-inbox/agents';
const $=s=>document.querySelector(s);
let auditPoll=0,repairPoll=0;

async function request(path,options={}){
  const res=await fetch(API+path,{cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data={};try{data=await res.json();}catch{}
  if(!res.ok)throw new Error(data.error||('HTTP '+res.status));
  return data;
}
function money(v,digits=4){return Number.isFinite(Number(v))?'$'+Number(v).toFixed(digits):'—';}
function showToast(msg){document.querySelector('.toast')?.remove();const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2400);}

async function refreshSpend(){
  try{
    const d=await request('/openrouter');
    $('#spendToday').textContent=money(d.usage_daily);
    $('#spendRemaining').textContent=money(d.limit_remaining);
    $('#spendLimit').textContent=money(d.limit,2);
    $('#spendNote').textContent='Datos reales de la clave de agentes · uso total '+money(d.usage)+' · actualización automática.';
  }catch(e){
    $('#spendNote').textContent='OpenRouter no responde ahora mismo · Activity conserva el histórico oficial.';
  }
}

const ADVISOR_KIND={job:'EMPLEO',calendar_candidate:'CALENDAR',cleanup_candidate:'LIMPIEZA',action_candidate:'ACCIÓN',noise_signal:'RUIDO',calendar_observed:'AGENDA'};
function advisorTime(ts){if(!ts)return'—';try{return new Date(Number(ts)*1000).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return'—';}}
function renderAdvisor(d){
  const status=$('#advisorStatus');
  status.textContent='LISTO';status.className='status ready';
  $('#advisorEvents').textContent=String(d.events||0);
  $('#advisorFindings').textContent=String(d.findings||0);
  $('#advisorCost').textContent=money(d.ai_cost_usd||0);
  for(const src of d.sources||[]){
    const row=document.querySelector('[data-source="'+src.source+'"]');if(!row)continue;
    const span=row.querySelector('span');
    span.textContent=src.connected?'CONECTADO':'POR CONECTAR';
    span.className=src.connected?'source-ready':'source-pending';
    row.title=src.note||'';
  }
  const recent=$('#advisorRecent');
  if(!(d.recent||[]).length){recent.innerHTML='<small>Aún no hay observaciones reales. El motor local está preparado.</small>';}
  else recent.innerHTML=d.recent.slice(0,5).map(x=>'<div><span>'+(ADVISOR_KIND[x.kind]||x.kind.toUpperCase())+'</span><b>'+escHtml(x.summary)+'</b><small>'+Math.round((x.confidence||0)*100)+'% · '+advisorTime(x.created_at)+'</small></div>').join('');
}
function escHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function refreshAdvisor(){
  try{const d=await request('/advisor/status');renderAdvisor(d);}
  catch(e){const s=$('#advisorStatus');s.textContent='SIN PC';s.className='status offline';}
}
async function tickAdvisor(){
  const b=$('#advisorTick');b.disabled=true;
  try{await request('/advisor/tick',{method:'POST',body:'{}'});await refreshAdvisor();showToast('El Consejero ha procesado la cola · 0 USD');}
  catch(e){showToast(e.message);}
  finally{b.disabled=false;}
}

const TRIAGE_TARGETS={auditor:'audit',reparador:'repair',operador:'pc',consejero:'advisor',nucleo:'nucleo',constructor:'constructor',editor:'editor'};
function renderTriage(t){
  const box=$('#triageResult'),status=$('#triageStatus'),go=$('#triageGo');
  box.hidden=false;go.hidden=true;go.dataset.target='';
  if(t.status==='ambiguous'){
    status.textContent='AMBIGUO';status.className='status guarded';
    $('#triageConfidence').textContent='REGLAS · 0 USD';
    $('#triagePrimary').textContent='Necesita segunda mirada';
    $('#triageReason').textContent='Las reglas locales no tienen señales suficientes. Podemos continuar con Nexo en ChatGPT para aclarar la petición.';
    $('#triagePipeline').innerHTML='<span class="triage-chip waiting">CONTINUAR EN CHATGPT</span>';
    $('#triageBudget').textContent='$0.0000';
    return;
  }
  const primary=t.primary||{};
  status.textContent='DERIVADO';status.className='status ready';
  $('#triageConfidence').textContent='CONFIANZA '+Math.round((t.confidence||0)*100)+'%';
  $('#triagePrimary').textContent=primary.name||'Ruta preparada';
  $('#triageReason').textContent=t.reason||'';
  $('#triagePipeline').innerHTML=(t.pipeline||[]).map((x,i)=>'<span class="triage-chip '+(x.active?'active':'training')+'">'+(i?'<i>→</i> ':'')+x.name+(x.active?'':' · EN FORMACIÓN')+'</span>').join('');
  $('#triageBudget').textContent=money(t.active_ceiling_usd||0);
  if(!primary.active){status.textContent='EN FORMACIÓN';status.className='status guarded';}
  const target=TRIAGE_TARGETS[primary.id];
  if(target&&primary.active){
    go.hidden=false;go.dataset.target=target;go.textContent='IR A '+primary.name.toUpperCase();
  }
}
async function startTriage(){
  const text=$('#triageRequest').value.trim();
  if(!text){showToast('Escribe primero qué quieres hacer.');return;}
  const btn=$('#triageBtn'),status=$('#triageStatus');
  btn.disabled=true;status.textContent='CLASIFICANDO';status.className='status checking';
  try{
    const d=await request('/triage',{method:'POST',body:JSON.stringify({request:text})});
    renderTriage(d.triage);
  }catch(e){
    status.textContent='ERROR';status.className='status failed';showToast(e.message);
  }finally{btn.disabled=false;}
}
function goToTriageTarget(){
  const key=$('#triageGo').dataset.target,target=document.querySelector('[data-agent="'+key+'"]');
  if(!target)return;
  const text=$('#triageRequest').value.trim();
  if(key==='audit'&&text)$('#auditMission').value=text;
  if(key==='repair'&&text)$('#repairMission').value=text;
  if(['constructor','editor'].includes(key)&&text)window.nexoSpecialistRequest(key,text);
  target.scrollIntoView({behavior:'smooth',block:'start'});
  target.classList.add('triage-highlight');setTimeout(()=>target.classList.remove('triage-highlight'),1800);
}

function renderAudit(state){
  const badge=$('#auditStatus'),head=$('#auditHeadline'),meta=$('#auditMeta');
  const busy=!!state?.running;$('#agentDryRun').disabled=busy;$('#agentAuditOpus').disabled=busy;
  if(!state){badge.textContent='SIN PC';badge.className='status offline';head.textContent='El Operador no responde';meta.textContent='Comprueba Tailscale y que el PC esté encendido.';return;}
  if(busy){badge.textContent='AUDITANDO';badge.className='status running';head.textContent=state.dry_run?'Comprobando configuración sin gasto…':'Opus está auditando el workbench…';meta.textContent='Puedes salir: el proceso continúa en el PC.';scheduleAudit();return;}
  const result=state.result||{};
  if(state.status==='failed'){badge.textContent='ERROR';badge.className='status failed';head.textContent='La última ejecución falló';meta.textContent=state.error||'Consulta el estado del agente.';return;}
  badge.textContent='LISTO';badge.className='status ready';
  if(state.status==='completed'&&state.dry_run){head.textContent='Prueba sin gasto superada';meta.textContent='Opus disponible · tope '+money(result.budget_usd)+' · primera llamada estimada '+money(result.estimated_first_call_ceiling_usd)+'.';}
  else if(state.status==='completed'){head.textContent=result.partial?'Informe parcial disponible':'Auditoría terminada';meta.textContent=[result.cost_usd!=null?'Coste '+money(result.cost_usd):'',result.partial?'· revisión incompleta':'',state.report_available?'· informe disponible':''].join(' ').trim()||'Resultado disponible.';}
  else{head.textContent='El Auditor está preparado';meta.textContent='Solo lectura · ninguna llamada a IA en curso.';}
}
async function refreshAudit(){clearTimeout(auditPoll);try{const d=await request('/status');renderAudit(d.agent);}catch{renderAudit(null);}}
function scheduleAudit(){clearTimeout(auditPoll);auditPoll=setTimeout(refreshAudit,2200);}
async function startAudit(dryRun){
  const mission=$('#auditMission').value.trim();
  if(!dryRun&&!confirm('Lanzar El Auditor con Claude Opus 5.5?\n\nSolo lectura, workbench aislado y límite de 0,35 USD.'))return;
  try{const d=await request('/audit',{method:'POST',body:JSON.stringify({model:'opus',mission,dry_run:dryRun,confirm_cost:!dryRun})});renderAudit(d.agent);scheduleAudit();}catch(e){showToast(e.message);refreshAudit();}
}

function renderRepair(state){
  const badge=$('#repairStatus'),head=$('#repairHeadline'),meta=$('#repairMeta');
  const busy=!!state?.running;$('#repairDryRun').disabled=busy;$('#repairOpus').disabled=busy;
  if(!state){badge.textContent='SIN PC';badge.className='status offline';head.textContent='El Operador no responde';meta.textContent='El Reparador necesita el PC y Tailscale.';return;}
  if(busy){badge.textContent='REPARANDO';badge.className='status running';head.textContent='Opus trabaja en una copia aislada…';meta.textContent='No puede publicar. Al terminar podrás revisar informe y diff.';scheduleRepair();return;}
  const result=state.result||{};
  if(state.status==='failed'||state.returncode>0){badge.textContent='BLOQUEADO';badge.className='status failed';head.textContent=state.dry_run?'Preflight con incidencias':'La reparación no terminó';meta.textContent=state.error||((result.issues||[]).join(' · '))||'Revisa el informe.';return;}
  badge.textContent='LISTO';badge.className='status ready';
  if(state.status==='completed'&&state.dry_run){head.textContent='Preflight superado sin gasto';meta.textContent='Baseline limpio · regresión disponible · margen OpenRouter '+money(result.openrouter?.limit_remaining)+' · techo '+money(result.max_usd)+'.';}
  else if(state.status==='completed'){head.textContent='Parche preparado para revisar';meta.textContent=[result.cost_usd!=null?'Coste '+money(result.cost_usd):'',state.report_available?'· informe disponible':'',state.diff_available?'· diff disponible':''].join(' ').trim()||'La copia aislada queda conservada.';}
  else{head.textContent='El Reparador está preparado';meta.textContent='Keyboard Speak · copia nueva por ejecución · sin publicación automática.';}
}
async function refreshRepair(){clearTimeout(repairPoll);try{const d=await request('/repair/status');renderRepair(d.repair);}catch{renderRepair(null);}}
function scheduleRepair(){clearTimeout(repairPoll);repairPoll=setTimeout(refreshRepair,2500);}
async function startRepair(dryRun){
  const mission=$('#repairMission').value.trim();
  if(!dryRun&&mission.length<10){showToast('Describe primero qué debe reparar.');return;}
  if(!dryRun&&!confirm('Lanzar El Reparador con Claude Opus 5.5?\n\nCreará una copia aislada, ejecutará la regresión y NO publicará cambios. Techo máximo: 1,65 USD.'))return;
  try{const d=await request('/repair',{method:'POST',body:JSON.stringify({mission,dry_run:dryRun,confirm_cost:!dryRun})});renderRepair(d.repair);scheduleRepair();if(dryRun)refreshSpend();}catch(e){showToast(e.message);refreshRepair();refreshSpend();}
}

async function showReport(kind){
  try{
    const d=await request(kind==='repair'?'/repair/report':'/report');
    $('#reportDialog h2').textContent=kind==='repair'?'El Reparador':'El Auditor';
    const extra=d.diff_stat?'\n\nCAMBIOS\n'+d.diff_stat:'';
    $('#reportContent').textContent=d.available?(d.content||'')+extra:(kind==='repair'?'Todavía no hay ningún parche guardado.':'Todavía no hay ningún informe de auditoría guardado.');
    $('#reportDialog').showModal();
  }catch(e){showToast('No se pudo cargar: '+e.message);}
}

$('#advisorRefresh').addEventListener('click',refreshAdvisor);
$('#advisorTick').addEventListener('click',tickAdvisor);
$('#triageBtn').addEventListener('click',startTriage);
$('#triageGo').addEventListener('click',goToTriageTarget);
$('#triageRequest').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')startTriage();});
$('#agentDryRun').addEventListener('click',()=>startAudit(true));
$('#agentAuditOpus').addEventListener('click',()=>startAudit(false));
$('#agentReport').addEventListener('click',()=>showReport('audit'));
$('#repairDryRun').addEventListener('click',()=>startRepair(true));
$('#repairOpus').addEventListener('click',()=>startRepair(false));
$('#repairReport').addEventListener('click',()=>showReport('repair'));
$('#reportClose').addEventListener('click',()=>$('#reportDialog').close());
$('#reportDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
refreshSpend();refreshAudit();refreshRepair();refreshAdvisor();
setInterval(refreshSpend,60000);setInterval(refreshAdvisor,60000);

async function refreshTraining(){
  const box=document.querySelector('#trainingProfiles');
  try{
    const r=await fetch('./training.json?v=1.4.0',{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();
    box.innerHTML='<details><summary>Información · base común</summary><ul>'+d.common.map(x=>'<li>'+escHtml(x)+'</li>').join('')+'</ul></details>'+d.agents.filter(a=>a.id!=='triaje').map(a=>'<details><summary>Información · '+escHtml(a.name)+'</summary><p>'+escHtml(a.role)+'</p><p><b>Ejercicio:</b> '+escHtml(a.exercise)+'</p><p><b>Para aprobar:</b> '+escHtml(a.acceptance)+'</p><small>'+escHtml(a.status)+'</small>'+(a.assessment?'<p><b>Evaluación:</b> '+a.assessment.passed_cases+'/'+a.assessment.total_cases+' comprobaciones · '+escHtml(a.assessment.date)+'</p><ul>'+a.assessment.cases.map(c=>'<li>'+escHtml(c.request)+' · '+(c.pass?'SUPERADA':'PENDIENTE')+'</li>').join('')+'</ul>':'')+'</details>').join('');
  }catch(e){box.textContent='Formación no disponible: '+e.message;}
}
refreshTraining();

/* Núcleo: comprobación local y transparente, sin llamadas de pago. */
function renderNucleo(data){
  const badge=$('#nucleoStatus'),head=$('#nucleoHeadline'),meta=$('#nucleoMeta'),list=$('#nucleoChecks');
  const s=data.summary||{},checks=data.checks||[];
  badge.textContent=(s.unverifiable||0)?'PARCIAL':'COMPROBADO';
  badge.className='status '+((s.to_review||0)?'guarded':'ready');
  head.textContent='He comprobado '+(s.verified||0)+' apartados; '+(s.to_review||0)+' requieren revisión.';
  meta.textContent=(s.unverifiable||0)+' aspectos pendientes de comprobar · 0 USD · sin cambios automáticos.';
  list.replaceChildren();
  for(const c of checks){
    const item=document.createElement('div');item.className='nucleo-check';item.dataset.state=c.state;
    const title=document.createElement('b');title.textContent=(c.state==='ok'?'COMPROBADO':c.state==='review'?'REVISAR':'SIN VERIFICAR')+' · '+c.name;
    const text=document.createElement('p');text.textContent=c.evidence;
    item.append(title,text);
    if(c.next_step){const next=document.createElement('small');next.textContent='Siguiente paso: '+c.next_step;item.append(next);}
    list.append(item);
  }
}
async function refreshNucleo(){
  const badge=$('#nucleoStatus'),button=$('#nucleoRefresh');
  button.disabled=true;badge.textContent='COMPROBANDO';badge.className='status checking';
  try{
    const data=await request('/nucleo/status');
    if(!data.ok)throw new Error('Respuesta de diagnóstico no válida');
    renderNucleo(data);
  }catch(e){
    badge.textContent='SIN CONEXIÓN';badge.className='status offline';
    $('#nucleoHeadline').textContent='No he podido consultar el diagnóstico local.';
    $('#nucleoMeta').textContent='El PC o el servicio Núcleo no responde. '+e.message;
  }finally{button.disabled=false;}
}
$('#nucleoRefresh').addEventListener('click',refreshNucleo);
refreshNucleo();

document.querySelector('#nexoChat').addEventListener('click',async()=>{
 const mission=document.querySelector('#triageRequest').value.trim();
 const note=document.querySelector('#nexoHandoff');
 let context=mission;
 try{const shared=await request('/nexo/context');if(shared.mission&&shared.context&&(!mission||mission===shared.mission.request))context=shared.context;}catch{}
 if(context){
  try{await navigator.clipboard.writeText(context);note.textContent='Contexto copiado. Pégalo en nuestra conversación de ChatGPT.';}
  catch{note.textContent='No se pudo copiar. Selecciona y copia la misión antes de continuar.';document.querySelector('#triageRequest').focus();document.querySelector('#triageRequest').select();return;}
 }
 location.assign('https://adrianxds-ads.github.io/adrian-hub/chatgpt.html');
});

/* Nexo mission tracking: resumes observation, never automatically repeats a paid run. */
(()=>{
 const KEY='nexo-mission-v1';let mission=null,timer=0,starting=false,polling=false;
 try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v?.schema===1&&typeof v.runId==='string'&&typeof v.request==='string'&&['running','complete','partial','preflight','failed','superseded','repairing','repaired','repair_failed','verified'].includes(v.phase))mission=v;}catch{}
 const q=s=>document.querySelector(s);
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(mission));}catch{q('#nexoMissionNote').textContent='No se pudo guardar el seguimiento en este navegador.';}}
 function canRepair(){return mission?.phase==='complete'&&!!mission?.report&&/keyboard speak|adaptive-keyword-speaking/i.test(mission.request);}
 function paint(){
  q('#nexoRun').disabled=starting||['running','repairing'].includes(mission?.phase);
  q('#nexoRecover').disabled=starting||polling;
  q('#nexoMissionRequest').textContent=mission?.request||'Todavía no hay una ejecución vinculada.';
  q('#nexoMissionState').textContent=({running:'AUDITOR TRABAJANDO',complete:'INFORME PARA REVISAR',partial:'INFORME PARCIAL · RUTA DETENIDA',preflight:'COMPROBACIÓN SIN GASTO',failed:'EJECUCIÓN FALLIDA',superseded:'OTRA EJECUCIÓN EN EL SERVICIO',repairing:'REPARADOR TRABAJANDO',repaired:'PARCHE VERIFICADO · PENDIENTE DE REVISIÓN',repair_failed:'REPARACIÓN DETENIDA',verified:'SIN FALLO REPRODUCIDO · PRUEBAS APROBADAS'})[mission?.phase]||'SIN EJECUCIÓN';
  q('#nexoMissionMeta').textContent=mission?'Auditor · '+mission.runId+' · coste '+(Number.isFinite(mission.cost)?money(mission.cost):'pendiente')+(mission.repairRunId?' · Reparador '+mission.repairRunId+' · coste '+(Number.isFinite(mission.repairCost)?money(mission.repairCost):'pendiente'):''):'';
  q('#nexoMissionReport').textContent=mission?.repairReport||mission?.report||'El resultado aparecerá aquí al terminar.';
  q('#nexoMissionRepair').disabled=!canRepair();
  q('#nexoMissionNote').textContent=mission?.note||'El Auditor continúa en el PC al cerrar el panel. La misión se recupera desde el PC; el parche se verifica en una copia aislada.';
 }
 function schedule(){clearTimeout(timer);if(['running','repairing'].includes(mission?.phase))timer=setTimeout(poll,2500);}
 async function collect(state){
  if(!mission||state.run_id!==mission.runId){if(mission){mission.phase='superseded';mission.note='La misión se conserva. El servicio tiene otra ejecución; no vinculamos su resultado.';persist();paint();}return;}
  const result=state.result||{};mission.cost=Number.isFinite(result.cost_usd)?result.cost_usd:state.dry_run?0:null;
  if(state.running){mission.phase='running';persist();paint();schedule();return;}
  if(state.status!=='completed'||state.returncode>0){mission.phase='failed';mission.note=state.error||'El Auditor no terminó; no se inicia el Reparador.';persist();paint();return;}
  if(state.dry_run){mission.phase='preflight';mission.note='Preparación comprobada. No se ha ejecutado una auditoría ni generado un informe.';persist();paint();return;}
  if(!state.report_available){mission.phase='failed';mission.note='La ejecución terminó sin informe vinculado; no se recupera un informe anterior.';persist();paint();return;}
  const report=await request('/report');
  const fresh=(await request('/status')).agent;
  if(fresh.run_id!==mission.runId){mission.phase='superseded';mission.note='Cambió la ejecución mientras recogíamos el informe. Conservamos la misión sin asociar ese resultado.';}
  else if(!report.available||!report.content){mission.phase='failed';mission.note='No hay contenido de informe verificable para esta misión.';}
  else{
   mission.report=report.content;
   const partial=!!result.partial||report.content.includes('INFORME PARCIAL');
   mission.phase=partial?'partial':'complete';
   mission.note=partial?'El diagnóstico está incompleto. Nexo detiene la ruta; debemos completar la evidencia antes de reparar.':'El diagnóstico completo permite iniciar la reproducción, reparación y verificación automática en una copia aislada.';
  }
  persist();paint();
  if(state.repair_run_id){mission.repairRunId=state.repair_run_id;mission.phase='repairing';persist();paint();schedule();}
  else if(mission.phase==='complete'&&mission.autoRepair)await startRepair(false);
 }
 async function poll(){
  if(polling||!mission)return;polling=true;
  try{if(mission.phase==='repairing')await collectRepair();else await collect((await request('/status')).agent);}
  catch(e){q('#nexoMissionNote').textContent='Seguimiento sin conexión: '+e.message+'. No se repite la ejecución.';schedule();}
  finally{polling=false;q('#nexoRecover').disabled=false;}
 }
 q('#nexoRun').addEventListener('click',async()=>{
  if(starting||['running','repairing'].includes(mission?.phase))return;
  const text=q('#triageRequest').value.trim();
  if(text.length<10||text.length>1200){showToast('Describe una misión de entre 10 y 1200 caracteres.');return;}
  starting=true;paint();
  try{
   const route=(await request('/triage',{method:'POST',body:JSON.stringify({request:text})})).triage;renderTriage(route);
   if(route.primary?.id!=='auditor'||!route.primary.active){showToast('Este recorrido empieza por el Auditor. Usa la derivación para los demás especialistas.');return;}
   const active=(await request('/status')).agent;
   if(active?.running){showToast('El Auditor ya está ocupado. Recupera su ejecución para seguirla.');return;}
   const autoRepair=q('#nexoAutoRepair').checked;
   if(autoRepair&&!/keyboard speak|adaptive-keyword-speaking/i.test(text)){showToast('La reparación automática solo admite Keyboard Speak.');return;}
   if(!confirm(autoRepair?'Auditar, reparar y verificar Keyboard Speak?\n\nMáximo total: 2,00 USD (Auditor 0,35 + Reparador 1,65). Los informes parciales detienen la ruta. El parche queda aislado para revisión.':'Iniciar la auditoría desde Nexo?\n\nSolo lectura. Límite: 0,35 USD.'))return;
   const d=await request('/audit',{method:'POST',body:JSON.stringify({model:'opus',mission:text,dry_run:false,confirm_cost:true,auto_repair:autoRepair})});
   mission={schema:1,runId:d.agent.run_id,request:text,autoRepair,phase:'running',cost:null,report:'',note:''};
   q('#auditMission').value=text;persist();paint();schedule();
  }catch(e){showToast(e.message);}
  finally{starting=false;paint();}
 });
 q('#nexoRecover').addEventListener('click',async()=>{
  if(starting||polling)return;polling=true;paint();
  try{
   if(await recoverShared())return;
   if(mission?.repairRunId){mission.phase='repairing';await collectRepair();return;}
   const state=(await request('/status')).agent;
   if(!state?.run_id){showToast('No hay una ejecución del Auditor para recuperar.');return;}
   if(mission&&mission.runId!==state.run_id&&!confirm('El servicio tiene otra ejecución. ¿Vincularla al seguimiento de Nexo?'))return;
   mission={schema:1,runId:state.run_id,request:state.mission||'Misión sin descripción',phase:'running',cost:null,report:'',note:''};
   await collect(state);
  }catch(e){showToast(e.message);}
  finally{polling=false;paint();}
 });
 async function startRepair(ask=true){
  if(!canRepair()||starting)return;
  if(ask&&!confirm('Reparar y verificar automáticamente este diagnóstico?\n\nMáximo: 1,65 USD. Se reproducen los fallos y se ejecutan pruebas sobre el parche final. No se publica.'))return;
  starting=true;paint();
  try{
   const d=await request('/repair',{method:'POST',body:JSON.stringify({audit_run_id:mission.runId,confirm_cost:true})});
   mission.repairRunId=d.repair.run_id;mission.phase='repairing';
   mission.note='El Reparador continúa en el PC al cerrar el panel. Recuperaremos su parche y las pruebas; no se repite la ejecución.';
   persist();paint();schedule();
  }catch(e){mission.autoRepair=false;mission.note='Reparación detenida: '+e.message;persist();paint();}
  finally{starting=false;paint();}
 }
 async function collectRepair(){
  const state=(await request('/repair/status')).repair;
  if(state.run_id!==mission.repairRunId){mission.phase='repair_failed';mission.note='El servicio tiene otra reparación. Conservamos la referencia y no repetimos el trabajo.';}
  else if(state.running){schedule();return;}
  else{
   const result=state.result||{};mission.repairCost=result.cost_usd??result.spent_usd??null;
   if(state.status!=='completed'||state.returncode!==0||!result.ok||result.last_test?.exit_code!==0){
    mission.phase='repair_failed';mission.note=state.error||'La reparación no terminó con pruebas aprobadas sobre el código final.';
   }else{
    const report=await request('/repair/report');
    const fresh=(await request('/repair/status')).repair;
    if(fresh.run_id!==mission.repairRunId||!report.available||!report.content){mission.phase='repair_failed';mission.note='No se pudo vincular el informe al parche.';}
    else{mission.phase=report.diff_stat?.trim()?'repaired':'verified';mission.repairReport=report.content+'\n\nDIFF\n'+(report.diff_stat||'Sin cambios');mission.note=(mission.phase==='verified'?'No se modificaron archivos; pruebas aprobadas. Copia aislada: ':'Pruebas aprobadas. Copia aislada: ')+state.checkout+'. Revisamos el parche antes de publicarlo.';}
   }
  }
  persist();paint();
 }
 async function recoverShared(){
  try{
   const d=await request('/nexo/mission'),v=d.mission;
   if(d.specialist_contracts){
    const roles=d.specialist_contracts.roles||{},targets=d.specialist_contracts.targets||{};
    q('#nexoCapabilities').textContent='Auditor: disponible. Reparador y regresión: Keyboard Speak. Constructor: '+(roles.constructor?.active?'disponible vía ChatGPT; sin ejecución autónoma':'pendiente')+'. Editor: '+(roles.editor?.active?'disponible vía ChatGPT; sin ejecución autónoma':'pendiente')+'. Cambridge: '+(targets['adaptive-exam']?.audit?'auditoría disponible; reparación pendiente de su regresión propia':'pendiente')+'.';
   }
   if(!v?.runId||v.schema!==1)return false;
   if(mission&&mission.runId!==v.runId&&!confirm('El PC tiene otra misión. ¿Recuperarla en este navegador?'))return true;
   mission=v;persist();paint();schedule();
   q('#nexoSharedNote').textContent='Misión recuperada del PC. Mismo identificador y resultado en cada navegador; esta consulta no consume API.';
   return true;
  }catch{return false;}
 }
 q('#nexoMissionContext').addEventListener('click',async()=>{
  const button=q('#nexoMissionContext');button.disabled=true;
  try{
   const d=await request('/nexo/context');
   if(!d.mission||!d.context){showToast('No hay una misión compartida para transferir.');return;}
   await navigator.clipboard.writeText(d.context);
   q('#nexoHandoff').textContent='Petición, identificadores, costes e informes copiados. Pégalos en nuestra conversación; la memoria de ChatGPT no se sincroniza automáticamente.';
   showToast('Resultado y continuidad copiados para nuestra conversación.');
  }catch(e){showToast('No se pudo copiar el resultado: '+e.message);}
  finally{button.disabled=false;}
 });
 q('#nexoMissionRepair').addEventListener('click',()=>startRepair());
 paint();if(!mission)recoverShared();else if(['running','repairing'].includes(mission?.phase))poll();
})();

/* Zero-cost specialist briefs; manual ChatGPT continuation, no execution endpoint. */
(()=>{
 const roles=['constructor','editor'],key=r=>'nexo-specialist-'+r+'-v1';
 const fields=r=>['Brief','Source','Criteria'].map(x=>document.getElementById(r+x));
 function packet(r){
  const [brief,source,criteria]=fields(r).map(x=>x.value.trim());
  if(!brief||!source||!criteria)return '';
  const instructions=r==='constructor'
   ?'Trabajamos como Constructor. Inspecciona la fuente actual, conserva trabajo existente y crea una copia o rama aislada cuando proceda. Implementa solo el alcance indicado, verifica las pruebas de aceptación y entrega cambios revisables. Conserva progresos y datos. No publiques sin una instrucción que autorice la publicación.'
   :'Trabajamos como Editor. Recupera el original indicado antes de editar. Aplica la Voz de Adrián a textos en su nombre, respetando las instrucciones concretas. Conserva hechos, estructura y original; entrega una copia revisable. Si es un documento con maquetación, verifica el render final. No envíes mensajes ni inventes datos.';
  return ['NEXO · '+r.toUpperCase()+' · CONTINUACIÓN MANUAL EN CHATGPT',
   'Encargo: '+brief,'Fuente y alcance: '+source,'Criterios: '+criteria,instructions,
   'Sin nuevas llamadas a modelos de pago. Este paquete no prueba que el trabajo esté ejecutado. Si falta acceso o información esencial, decláralo; continúa con el trabajo independiente autorizado.'].join('\n\n');
 }
 function save(r){
  const fs=fields(r),note=document.getElementById(r+'Note');
  document.getElementById(r+'Packet').hidden=true;
  for(const action of ['Copy','Continue'])document.getElementById(r+action).disabled=true;
  try{localStorage.setItem(key(r),JSON.stringify({schema:1,values:fs.map(x=>x.value)}));note.textContent='Borrador guardado en este navegador. Prepara el encargo después de los cambios.';}
  catch{note.textContent='No se pudo guardar el borrador. Conserva una copia antes de salir.';}
 }
 window.nexoSpecialistRequest=(r,text)=>{
  if(!roles.includes(r))return;
  fields(r)[0].value=text;save(r);
 };
 for(const r of roles){
  const fs=fields(r),out=document.getElementById(r+'Packet'),note=document.getElementById(r+'Note');
  try{const v=JSON.parse(localStorage.getItem(key(r))||'null');if(v?.schema===1&&Array.isArray(v.values)&&v.values.length===3)fs.forEach((x,i)=>{if(typeof v.values[i]==='string')x.value=v.values[i].slice(0,x.maxLength);});}catch{}
  fs.forEach(x=>x.addEventListener('input',()=>save(r)));
  document.getElementById(r+'Form').addEventListener('submit',e=>{
   e.preventDefault();const text=packet(r);if(!text){note.textContent='Completa el encargo, la fuente y los criterios antes de preparar.';return;}
   out.value=text;out.hidden=false;
   for(const action of ['Copy','Continue'])document.getElementById(r+action).disabled=false;
   note.textContent='Encargo preparado. Cópialo y pégalo en nuestra conversación para ejecutarlo. Sin gasto de API adicional.';
  });
  async function copy(continueChat){
   try{await navigator.clipboard.writeText(out.value);note.textContent='Encargo copiado. Pégalo en nuestra conversación de ChatGPT.';
    if(continueChat)location.assign('https://adrianxds-ads.github.io/adrian-hub/chatgpt.html');
   }catch{out.hidden=false;out.focus();out.select();note.textContent='Copia automática no disponible. Selecciona y copia el encargo; después pégalo en ChatGPT.';}
  }
  document.getElementById(r+'Copy').addEventListener('click',()=>copy(false));
  document.getElementById(r+'Continue').addEventListener('click',()=>copy(true));
 }
})();
