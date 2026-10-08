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

const TRIAGE_TARGETS={auditor:'audit',reparador:'repair',operador:'pc',consejero:'advisor',nucleo:'nucleo'};
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
    const r=await fetch('./training.json?v=1.2.0',{cache:'no-store'});
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
 if(mission){
  try{await navigator.clipboard.writeText(mission);note.textContent='Misión copiada. Pégala en nuestra conversación de ChatGPT.';}
  catch{note.textContent='No se pudo copiar. Selecciona y copia la misión antes de continuar.';document.querySelector('#triageRequest').focus();document.querySelector('#triageRequest').select();return;}
 }
 location.assign('https://adrianxds-ads.github.io/adrian-hub/chatgpt.html');
});
