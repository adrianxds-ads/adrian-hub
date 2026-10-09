/* Shared scenery only: no task, reward or progress writes. */
(function(){
'use strict';
const stage=document.getElementById('taskStage');
let sequence=0;
async function refresh(){
 if(!window.AdrianGarden)return;
 const previous=document.getElementById('taskGarden');
 if(!previous)return;
 const host=document.createElement('div');
 host.id='taskGarden';
 host.setAttribute('aria-label','Nuestro jardín GitHub');
 if(previous.__gardenClock)clearInterval(previous.__gardenClock);
 previous.replaceWith(host);
 const ticket=++sequence;
 await AdrianGarden.mount(host,{currentApp:null,navigate:false});
 if(ticket!==sequence&&host.__gardenClock)clearInterval(host.__gardenClock);
}
refresh();
new MutationObserver(()=>{if(!stage.hidden)refresh();}).observe(stage,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('storage',e=>{
 if(!stage.hidden&&(!e.key||/garden|stars|progress/i.test(e.key)))refresh();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!stage.hidden)refresh();});
['adrian-sync-applied','adrian-sync-updated'].forEach(e=>window.addEventListener(e,()=>{if(!stage.hidden)refresh();}));
})();