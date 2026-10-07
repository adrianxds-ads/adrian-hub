const COMMANDS={
  'audit-opus':'powershell -ExecutionPolicy Bypass -File .\\agent\\run-openrouter.ps1 -Model openrouter-claude-opus-5-5',
  'repair-info':'python .\\agent\\repair_agent.py --root <CHECKOUT_AISLADO> --test-script <REGRESION.py> --mission-file <MISION.txt>'
};
async function copyText(text){
  try{await navigator.clipboard.writeText(text);showToast('Comando copiado');}
  catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Comando copiado');}
}
function showToast(msg){document.querySelector('.toast')?.remove();const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800);}
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(COMMANDS[btn.dataset.copy]||'')));
