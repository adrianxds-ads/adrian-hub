const btn=document.querySelector('#openHistory');
const status=document.querySelector('#status');
btn?.addEventListener('click',()=>{
  status.textContent='Si no se abre otra pestaña, este dispositivo no tiene la extensión ADRI · TYPE instalada.';
});
