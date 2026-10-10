/* Núcleo Garden Life 1.0 — decorative and read-only; shared by Hub and Task Garden.
   Barcelona weather is estimated by Open-Meteo. No rewards/progress are written. */
(function(){
'use strict';
if(window.NucleoGardenLife)return;
const HISTORY_KEY='adrianEasyCatalanTaskSessionsV1';
const WEATHER_KEY='nucleo_garden_weather_barcelona_v1';
const WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=41.3874&longitude=2.1686&current=temperature_2m,cloud_cover,weather_code,precipitation,rain,snowfall,is_day&timezone=Europe%2FMadrid';
const TTL=15*60*1000,MAX_STALE=90*60*1000;
const mounted=new WeakSet();
let weather=null,weatherAt=0,lastRequest=0,requesting=false;
const weatherKinds={
 clear:{icon:'☀',label:'despejado'},partly:{icon:'⛅',label:'intervalos nubosos'},
 clouds:{icon:'☁',label:'nublado'},fog:{icon:'≋',label:'niebla'},
 drizzle:{icon:'☂',label:'llovizna'},rain:{icon:'☂',label:'lluvia'},
 snow:{icon:'❄',label:'nieve'},storm:{icon:'⚡',label:'tormenta'}
};
function rows(){
 try{const a=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(a)?a:[];}catch{return[];}
}
function lastCompletion(){
 let latest=0;const seen=new Set();
 for(const r of rows()){
  if(!r||r.status!=='completado')continue;
  const id=r.id&&String(r.id);if(id&&seen.has(id))continue;if(id)seen.add(id);
  const raw=r.endedAt||(r.completedOn?r.completedOn+'T12:00:00':null);
  const t=raw?Date.parse(raw):NaN;if(Number.isFinite(t)&&t<=Date.now()+86400000)latest=Math.max(t,latest);
 }
 return latest;
}
function mood(now=new Date()){
 const h=now.getHours(),last=lastCompletion(),hours=last?(now.getTime()-last)/3600000:Infinity;
 if((h>=23||h<7)&&hours>1)return 'sleepy';
 if(hours<36)return 'happy';
 if(hours<72||!last)return 'curious';
 return 'mischief';
}
function dinoSvg(){
 return `<svg viewBox="0 0 124 108" aria-hidden="true" focusable="false">
 <ellipse cx="63" cy="101" rx="41" ry="5" fill="#123e2f" opacity=".24"/>
 <path d="M37 73 Q11 79 5 54 Q23 63 40 57" fill="#4e9b70" stroke="#27664b" stroke-width="3" stroke-linejoin="round"/>
 <path d="M33 51 L37 32 L47 41 L54 24 L64 39 L74 24 L84 44" fill="#c9a45d" stroke="#8d7242" stroke-width="2" stroke-linejoin="round"/>
 <ellipse cx="65" cy="67" rx="38" ry="29" fill="#51a879" stroke="#236e4e" stroke-width="3"/>
 <path d="M76 82 Q59 91 42 74" fill="none" stroke="#a9d6a1" stroke-width="7" stroke-linecap="round"/>
 <path d="M83 36 Q102 31 111 47 Q124 69 110 77 Q92 84 81 69" fill="#62b684" stroke="#236e4e" stroke-width="3"/>
 <ellipse cx="105" cy="63" rx="3.3" ry="2.3" fill="#317957"/>
 <ellipse cx="82" cy="55" rx="6.2" ry="7.2" fill="#f9f7e8" class="nl-eye-white"/>
 <circle cx="84" cy="56" r="3.2" fill="#152f29" class="nl-pupil"/>
 <path class="nl-eye-sleep" d="M76 56 Q82 62 89 56" fill="none" stroke="#183e30" stroke-width="2.5" stroke-linecap="round"/>
 <path class="nl-mouth" d="M98 70 Q105 78 112 69" fill="none" stroke="#20553f" stroke-width="2.7" stroke-linecap="round"/>
 <ellipse cx="89" cy="68" rx="6" ry="3" fill="#eb9290" opacity=".8"/>
 <path d="M56 66 Q72 74 80 63" fill="none" stroke="#27805b" stroke-width="7" stroke-linecap="round"/>
 <g class="nl-foot nl-foot-a"><path d="M42 88 L40 100 L62 100 Q61 91 55 87" fill="#438f68" stroke="#236e4e" stroke-width="2"/></g>
 <g class="nl-foot nl-foot-b"><path d="M77 87 L77 100 L98 100 Q98 90 88 85" fill="#3b875f" stroke="#236e4e" stroke-width="2"/></g>
 </svg>`;
}
const say={
 happy:['¡Una hoja nueva!','Hoy el jardín huele a victoria.','¡Rooar! Eso ha ido bien.'],
 curious:['¿Qué habrá detrás de la casita?','Estoy contando mariposas.','¿Damos una vuelta?'],
 mischief:['He escondido una piedra.','Hoy me toca explorar.','Estoy tramando una dinotravesura.'],
 sleepy:['Zzz… cinco minutos más.','He soñado con helechos gigantes.','Shhh… duerme el jurásico.']
};
function dinoClick(host){
 const d=host.querySelector('.nl-dino');if(!d)return;
 const state=d.dataset.mood||'curious',n=(Number(d.dataset.taps)||0)+1;
 d.dataset.taps=String(n);const msg=say[state][(n-1)%say[state].length];
 const bubble=d.querySelector('.nl-dino-bubble');bubble.textContent=msg;
 d.classList.remove('nl-speaking');void d.offsetWidth;d.classList.add('nl-speaking');
 clearTimeout(d.__bubbleTimer);d.__bubbleTimer=setTimeout(()=>d.classList.remove('nl-speaking'),3300);
}
function updateDino(host){
 const d=host.querySelector('.nl-dino');if(!d)return;
 const m=mood(),names={happy:'alegre',curious:'curioso',mischief:'travieso',sleepy:'dormido'};
 if(d.dataset.mood!==m){d.dataset.mood=m;}
 d.setAttribute('aria-label','Dinosaurio '+names[m]+'. Tócalo para saludarlo.');
}
function weatherKind(c){
 if(!c||!Number.isFinite(+c.weather_code))return null;
 const w=+c.weather_code,cloud=Number(c.cloud_cover)||0;
 if(w>=95)return 'storm';
 if((w>=71&&w<=77)||w===85||w===86||Number(c.snowfall)>0)return 'snow';
 if((w>=61&&w<=67)||(w>=80&&w<=82)||Number(c.rain)>0||Number(c.precipitation)>0)return 'rain';
 if(w>=51&&w<=57)return 'drizzle';
 if(w===45||w===48)return 'fog';
 if(w===3||cloud>=78)return 'clouds';
 if(w===1||w===2||cloud>=28)return 'partly';
 return 'clear';
}
function flakes(kind){
 const n=kind==='snow'?18:kind==='storm'?17:kind==='rain'?17:kind==='drizzle'?11:0;
 let s='';for(let i=0;i<n;i++){
  const x=((i*37+7)%97),delay=-(i*0.31%3.4).toFixed(2),duration=(1.3+(i%5)*.23).toFixed(2);
  s+=`<i style="--nl-x:${x}%;--nl-delay:${delay}s;--nl-duration:${duration}s"></i>`;
 }
 return s;
}
function applyWeather(host){
 const layer=host.querySelector('.nl-weather');if(!layer)return;
 if(!weather||Date.now()-weatherAt>MAX_STALE){
  host.removeAttribute('data-nl-weather');layer.hidden=true;return;
 }
 const kind=weatherKind(weather);
 if(!kind){layer.hidden=true;return;}
 layer.hidden=false;host.dataset.nlWeather=kind;
 const chip=layer.querySelector('.nl-weather-chip');
 const spec=weatherKinds[kind],temperature=Number(weather.temperature_2m);
 const t=Number.isFinite(temperature)?Math.round(temperature)+'°':'';
 chip.textContent=spec.icon+(t?' '+t:'');
 chip.title='Barcelona: '+spec.label+(t?', '+t:'')+'. Datos meteorológicos estimados: Open-Meteo.';
 chip.setAttribute('aria-label',chip.title);
 layer.querySelector('.nl-particles').innerHTML=flakes(kind);
}
function loadWeatherCache(){
 try{const c=JSON.parse(localStorage.getItem(WEATHER_KEY)||'null');if(c&&c.at&&c.current&&Date.now()-c.at<MAX_STALE){weather=c.current;weatherAt=c.at;return true;}}catch{}
 return false;
}
async function refreshWeather(){
 if(requesting||document.hidden||!document.querySelector('.nl-weather'))return;
 const now=Date.now();
 if(now-lastRequest<TTL){document.querySelectorAll('.github-garden').forEach(applyWeather);return;}
 lastRequest=now;requesting=true;
 try{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),6500);
  let res;try{res=await fetch(WEATHER_URL,{signal:ctl.signal,cache:'no-store'});}finally{clearTimeout(timer);}
  if(!res.ok)throw new Error('weather '+res.status);
  const data=await res.json();
  if(!data.current||!Number.isFinite(Number(data.current.weather_code)))throw Error('weather data');
  weather=data.current;weatherAt=Date.now();
  try{localStorage.setItem(WEATHER_KEY,JSON.stringify({at:weatherAt,current:weather}));}catch{}
 }catch(e){/* Retain a recent real reading or show no current weather; never invent it. */}
 finally{requesting=false;document.querySelectorAll('.github-garden').forEach(applyWeather);}
}
function mount(host){
 if(!host.querySelector('.gg-scene'))return;
 if(!host.querySelector('.nl-weather')){
  const layer=document.createElement('div');layer.className='nl-weather';layer.hidden=true;
  layer.innerHTML='<div class="nl-clouds" aria-hidden="true"><i></i><i></i><i></i></div><div class="nl-particles" aria-hidden="true"></div><a class="nl-weather-chip" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" aria-label="Tiempo estimado en Barcelona"></a>';
  host.appendChild(layer);
  layer.querySelector('.nl-weather-chip').addEventListener('pointerdown',event=>event.stopPropagation());
 }
 if(!host.querySelector('.nl-dino')){
  const d=document.createElement('button');d.type='button';d.className='nl-dino';
  d.innerHTML=dinoSvg()+'<span class="nl-dino-bubble" aria-live="polite"></span>';
  host.appendChild(d);
  d.addEventListener('pointerdown',event=>event.stopPropagation());
  d.addEventListener('click',()=>dinoClick(host));
 }
 if(!mounted.has(host))mounted.add(host);
 updateDino(host);applyWeather(host);
}
function followTask(){
 const host=document.getElementById('taskGarden'),progress=document.getElementById('taskProgress');
 const d=host?.querySelector('.nl-dino');if(!d||!progress)return;
 const pct=parseFloat(progress.style.width);
 if(!Number.isFinite(pct))return;
 const left=(10+Math.min(100,Math.max(0,pct))*.72)+'%';
 d.style.left=left;d.style.setProperty('--nl-task-left',left);
}
const taskProgress=document.getElementById('taskProgress');
if(taskProgress)new MutationObserver(followTask).observe(taskProgress,{attributes:true,attributeFilter:['style']});
function refresh(){
 document.querySelectorAll('.github-garden').forEach(mount);
 followTask();
 document.querySelectorAll('.nl-dino').forEach(el=>{if(el.isConnected)updateDino(el.closest('.github-garden'));});
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh();refreshWeather();});}
const observer=new MutationObserver(ms=>{
 if(ms.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.gg-scene,.github-garden')||n.querySelector?.('.gg-scene')))))schedule();
});
observer.observe(document.body,{subtree:true,childList:true});
loadWeatherCache();
['pageshow','podcast-task-history-updated','adrian-sync-applied','adrian-sync-updated'].forEach(type=>window.addEventListener(type,schedule));
window.addEventListener('storage',e=>{if(!e.key||e.key===HISTORY_KEY||e.key===WEATHER_KEY){if(e.key===WEATHER_KEY)loadWeatherCache();schedule();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastRequest=0;schedule();}});
setInterval(()=>{if(!document.hidden){refresh();refreshWeather();}},60000);
window.NucleoGardenLife=Object.freeze({version:'1.0.0',refresh,weatherKind,mood});
schedule();
})();
