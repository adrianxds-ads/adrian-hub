(() => {
'use strict';
const btn=document.querySelector('#openHistory'),status=document.querySelector('#status');
const mobile=navigator.userAgentData?.mobile||/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
function refresh(){
 const version=document.documentElement.dataset.hubControlVersion;
 const available=!!version&&!mobile;
 if(btn){btn.hidden=!available;btn.disabled=!available;}
 if(status)status.textContent=mobile?'En el móvil puedes consultar esta ficha. El panel flotante y su historial funcionan en Chrome del ordenador.':version?'Extensión HUB CONTROL v'+version+' disponible. Puedes abrir su historial.':'La extensión HUB CONTROL debe estar activa en Chrome del ordenador para abrir el historial.';
}
window.addEventListener('hub-control-ready',refresh);
new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-hub-control-version']});
refresh();
})();
