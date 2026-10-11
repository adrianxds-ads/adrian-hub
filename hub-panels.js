(() => {
'use strict';
const root=document.querySelector('[data-hub-root]');
if(!root)return;
const panels=Array.from(document.querySelectorAll('[data-hub-panel]'));
const labels={inicio:'Inicio',modulos:'Módulos',estadisticas:'Estadísticas',coach:'Coach'};
const nav=document.createElement('nav');nav.className='hub-bottom-nav';nav.setAttribute('aria-label','Navegación del Hub');
for(const [key,label] of Object.entries(labels)){const a=document.createElement('a');a.href='#hub/'+key;a.textContent=label;a.dataset.hubTab=key;nav.append(a);}
root.append(nav);
function select(){
 const key=location.hash.match(/^#hub\/(inicio|modulos|estadisticas|coach)$/)?.[1]||'inicio';
 for(const panel of panels){const active=panel.dataset.hubPanel===key;panel.hidden=!active;panel.inert=!active;}
 for(const link of nav.querySelectorAll('a')){if(link.dataset.hubTab===key)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
}
window.addEventListener('hashchange',select);select();
const settings=document.querySelector('#hubSettings');
document.querySelector('#hubSettingsOpen').addEventListener('click',()=>settings.showModal());
document.querySelector('#hubSettingsClose').addEventListener('click',()=>settings.close());
settings.addEventListener('click',e=>{if(e.target===settings)settings.close();});
})();
