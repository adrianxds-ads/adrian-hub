const API=location.origin+'/dc-inbox/agents';
const COMMANDS={'repair-info':'python .\\agent\\repair_agent.py --root <CHECKOUT_AISLADO> --test-script <REGRESION.py> --mission-file <MISION.txt>'};
const $=s=>document.querySelector(s);
let pollTimer=0;

async function request(path,options={}){
  const res=await fetch(API+path,{cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data={};try{data=await res.json();}catch{}
  if(!res.ok)throw new Error(data.error||('HTTP '+res.status));
  return data;
}
function money(v){return Number.isFinite(Number(v))?'$'+Number(v).toFixed(4):'';}
function renderState(state){
  const badge=$('#auditStatus'),head=$('#auditHeadline'),meta=$('#auditMeta');
  const busy=!!state?.running;
  $('#agentDryRun').disabled=busy;$('#agentAuditOpus').disabled=busy;
  if(!state){badge.textContent='SIN PC';badge.className='status offline';head.textContent='PC Agent no disponible';meta.textContent='Comprueba Tailscale y que el PC esté encendido.';return;}
  if(busy){badge.textContent='AUDITANDO';badge.className='status running';head.textContent=state.dry_run?'Comprobando configuración sin gasto…':'Opus está auditando el workbench…';meta.textContent='Puedes salir del Hub: el proceso continúa en el PC.';schedulePoll();return;}
  const result=state.result||{};
  if(state.status==='failed'){badge.textContent='ERROR';badge.className='status failed';head.textContent='La última ejecución falló';meta.textContent=state.error||'Consulta el estado del agente.';return;}
  badge.textContent='LISTO';badge.className='status ready';
  if(state.status==='completed'&&state.dry_run){
    head.textContent='Prueba sin gasto superada';
    meta.textContent='Opus disponible · tope '+money(result.budget_usd)+' · primera llamada estimada '+money(result.estimated_first_call_ceiling_usd)+'.';
  }else if(state.status==='completed'){
    head.textContent='Auditoría terminada';
    meta.textContent=[result.cost_usd!=null?'Coste '+money(result.cost_usd):'',result.turns?'· '+result.turns+' turnos':'',state.report_available?'· informe disponible':''].join(' ').trim()||'Resultado disponible.';
  }else{
    head.textContent='Audit Agent preparado';
    meta.textContent='Estado local conectado · ninguna llamada a IA en curso.';
  }
}
async function refreshStatus(){
  clearTimeout(pollTimer);
  try{const data=await request('/status');renderState(data.agent);}
  catch(e){renderState(null);}
}
function schedulePoll(){clearTimeout(pollTimer);pollTimer=setTimeout(refreshStatus,2200);}
async function startAudit(dryRun){
  const mission=$('#auditMission').value.trim();
  if(!dryRun){
    const ok=confirm('Lanzar Audit Agent con Claude Opus 5.5?\n\nEs solo lectura y trabaja en el workbench aislado. El límite de esta ejecución es 0,35 USD.');
    if(!ok)return;
  }
  try{
    $('#agentDryRun').disabled=true;$('#agentAuditOpus').disabled=true;
    const data=await request('/audit',{method:'POST',body:JSON.stringify({model:'opus',mission,dry_run:dryRun,confirm_cost:!dryRun})});
    renderState(data.agent);schedulePoll();
  }catch(e){showToast(e.message);await refreshStatus();}
}
async function showReport(){
  try{
    const data=await request('/report');
    $('#reportContent').textContent=data.available?data.content:'Todavía no hay ningún informe de auditoría guardado.';
    $('#reportDialog').showModal();
  }catch(e){showToast('No se pudo cargar el informe: '+e.message);}
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);showToast('Comando copiado');}
  catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Comando copiado');}
}
function showToast(msg){document.querySelector('.toast')?.remove();const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200);}

$('#agentDryRun').addEventListener('click',()=>startAudit(true));
$('#agentAuditOpus').addEventListener('click',()=>startAudit(false));
$('#agentReport').addEventListener('click',showReport);
$('#reportClose').addEventListener('click',()=>$('#reportDialog').close());
$('#reportDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(COMMANDS[btn.dataset.copy]||'')));
refreshStatus();
