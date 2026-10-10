/* Cottage garden v1: deterministic scenery derived from completed task history.
   250 plants x 20 details = 5,000 completed blocks. No stored rewards or writes. */
(function(){
'use strict';
const KEY='adrianEasyCatalanTaskSessionsV1',MAX=5000,STEPS=20;
function completed(rows){
 const seen=new Set();
 return (Array.isArray(rows)?rows:[]).filter(r=>{
  if(!r||r.status!=='completado')return false;
  const id=r.id?String(r.libraryId||'easy-catalan')+':'+r.id:null;
  if(id&&seen.has(id))return false;
  if(id)seen.add(id);
  return true;
 }).length;
}
function progress(){
 let rows=[];try{rows=JSON.parse(localStorage.getItem(KEY)||'[]')}catch{}
 const total=completed(rows),steps=Math.min(MAX,total);
 return {schema:'nucleo.cottage-garden.v1',completedBlocks:total,growthSteps:steps,target:MAX,
  completePlants:Math.floor(steps/STEPS),currentPlantSteps:steps%STEPS,stepsPerPlant:STEPS,
  source:KEY};
}
function rnd(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296}}
function plant(i,n){
 const r=rnd(17637+i*71),vine=i%7===6;
 const x=vine?792+r()*124:24+r()*950,y=vine?263+r()*46:291+r()*99;
 const height=vine?27+r()*42:9+r()*28,c=['#cc8f99','#b7a0cf','#cfb36d','#8fb8ae','#d9b9a4'][i%5];
 const out=['<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="2.1" ry="1.2" fill="#ac8c61"/>'];
 for(let k=1;k<n;k++){
  const yy=y-height*(k<6?k/5:(k-5)/8);
  if(k<6)out.push('<path d="M '+x.toFixed(1)+' '+(y-height*(k-1)/5).toFixed(1)+' l '+(vine?(k%2?2:-2):0)+' '+(-height/5).toFixed(1)+'" stroke="#67906b" stroke-width="1.4" fill="none"/>');
  else if(k<13){const side=k%2?1:-1;out.push('<ellipse cx="'+(x+side*3).toFixed(1)+'" cy="'+yy.toFixed(1)+'" rx="3.2" ry="1.3" transform="rotate('+side*30+' '+(x+side*3).toFixed(1)+' '+yy.toFixed(1)+')" fill="'+(i%2?'#789d70':'#91aa78')+'"/>')}
  else {const a=(k-13)*Math.PI/3;out.push('<circle cx="'+(x+Math.cos(a)*3).toFixed(1)+'" cy="'+(y-height+Math.sin(a)*3).toFixed(1)+'" r="'+(k===19?1.6:2)+'" fill="'+(k===19?'#ead4a0':c)+'"/>')}
 }
 return '<g data-cottage-plant="'+i+'" data-details="'+n+'">'+out.join('')+'</g>';
}
const house='<g class="jurassic-cave"><ellipse cx="850" cy="300" rx="91" ry="13" fill="#233b31" opacity=".3"/><path d="M 758 292 Q 762 225 811 204 Q 854 171 901 207 Q 941 237 941 292 Z" fill="#87958b" stroke="#52675e" stroke-width="4"/><path d="M 793 292 Q 800 236 851 223 Q 902 233 911 292 Z" fill="#263b37"/><path d="M 809 291 Q 816 253 850 245 Q 884 255 895 291" fill="none" stroke="#40594b" stroke-width="5"/><g fill="#658e70"><path d="M 773 291 q -18 -25 -8 -44 q 17 17 17 44 M 930 291 q 4 -36 22 -44 q 3 29 -11 44"/><path d="M 786 290 q -5 -37 13 -50 q 5 28 -2 50"/></g><ellipse cx="848" cy="302" rx="50" ry="5" fill="#9ba48a" opacity=".55"/></g>';
function markup(n){
 let plants='';for(let i=0;i<Math.ceil(n/STEPS);i++)plants+=plant(i,Math.min(STEPS,n-i*STEPS));
 return '<svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Cueva jurásica y jardín: '+n+' detalles de crecimiento">'+house+plants+'</svg>';
}
function css(){
 if(document.getElementById('cottage-css'))return;
 const el=document.createElement('style');el.id='cottage-css';
 el.textContent='.cottage-garden{position:absolute;inset:0 0 18% 0;z-index:9;pointer-events:none;opacity:.92;filter:brightness(calc(1 - var(--gg-stars,0)*.23))}.cottage-garden svg{width:100%;height:100%}.cottage-progress{font:inherit;font-size:14px;line-height:1.35;color:inherit}';
 document.head.append(el);
}
function refresh(){
 css();const p=progress();
 document.querySelectorAll('.github-garden').forEach(host=>{
  if(!host.querySelector('.gg-scene'))return;
  let layer=host.querySelector('.cottage-garden');
  if(!layer){layer=document.createElement('div');layer.className='cottage-garden';host.append(layer)}
  if(layer.dataset.steps!==String(p.growthSteps)){layer.innerHTML=markup(p.growthSteps);layer.dataset.steps=String(p.growthSteps)}
 });
 document.querySelectorAll('[data-cottage-progress]').forEach(el=>{
  el.textContent=p.completedBlocks.toLocaleString('es-ES')+' bloques · '+p.growthSteps.toLocaleString('es-ES')+' / 5.000 detalles';
 });
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})}
const observe=new MutationObserver(changes=>{
 if(changes.some(c=>[...c.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.gg-scene,.github-garden')||n.querySelector?.('.gg-scene')))))schedule();
});
observe.observe(document.body,{childList:true,subtree:true});
window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)schedule()});
['pageshow','adrian-sync-updated','adrian-sync-applied','podcast-task-history-updated'].forEach(e=>window.addEventListener(e,schedule));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
window.CottageGarden=Object.freeze({version:'1.0.0',progress,completed,markup,refresh});
refresh();
})();