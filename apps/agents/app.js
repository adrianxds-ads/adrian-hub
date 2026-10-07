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

function renderAudit(state){
  const badge=$('#auditStatus'),head=$('#auditHeadline'),meta=$('#auditMeta');
  const busy=!!state?.running;$('#agentDryRun').disabled=busy;$('#agentAuditOpus').disabled=busy;
  if(!state){badge.textContent='SIN PC';badge.className='status offline';head.textContent='El Operador no responde';meta.textContent='Comprueba Tailscale y que el PC esté encendido.';return;}
  if(busy){badge.textContent='AUDITANDO';badge.className='status running';head.textContent=state.dry_run?'Comprobando configuración sin gasto…':'Opus está auditando el workbench…';meta.textContent='Puedes salir: el proceso continúa en el PC.';scheduleAudit();return;}
  const result=state.result||{};
  if(state.status==='failed'){badge.textContent='ERROR';badge.className='status failed';head.textContent='La última ejecución falló';meta.textContent=state.error||'Consulta el estado del agente.';return;}
  badge.textContent='LISTO';badge.className='status ready';
  if(state.status==='completed'&&state.dry_run){head.textContent='Prueba sin gasto superada';meta.textContent='Opus disponible · tope '+money(result.budget_usd)+' · primera llamada estimada '+money(result.estimated_first_call_ceiling_usd)+'.';}
  else if(state.status==='completed'){head.textContent='Auditoría terminada';meta.textContent=[result.cost_usd!=null?'Coste '+money(result.cost_usd):'',state.report_available?'· informe disponible':''].join(' ').trim()||'Resultado disponible.';}
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

$('#agentDryRun').addEventListener('click',()=>startAudit(true));
$('#agentAuditOpus').addEventListener('click',()=>startAudit(false));
$('#agentReport').addEventListener('click',()=>showReport('audit'));
$('#repairDryRun').addEventListener('click',()=>startRepair(true));
$('#repairOpus').addEventListener('click',()=>startRepair(false));
$('#repairReport').addEventListener('click',()=>showReport('repair'));
$('#reportClose').addEventListener('click',()=>$('#reportDialog').close());
$('#reportDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
refreshSpend();refreshAudit();refreshRepair();
setInterval(refreshSpend,60000);
