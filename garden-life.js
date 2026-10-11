/* Núcleo Garden Life 1.1 — decorative and read-only; shared by Hub and Task Garden.
   Barcelona weather is estimated by Open-Meteo. No rewards/progress are written. */
(function(){
'use strict';
if(window.NucleoGardenLife)return;
const HISTORY_KEY='adrianEasyCatalanTaskSessionsV1';
const WEATHER_KEY='nucleo_garden_weather_barcelona_v1';
// The SVG is presentation-only and cannot change cottage tasks or plant growth.
const DRAGON_URL=new URL('./garden-dragon.svg?v=1.0.0',document.currentScript?.src||location.href);
let dragonArtwork=null;
function petArt(stage){return stage===0?eggSvg():(dragonArtwork||dinoSvg());}
async function loadDragonArtwork(){
 try{
  const res=await fetch(DRAGON_URL,{cache:'no-cache'});if(!res.ok)throw Error('dragon '+res.status);
  const content=await res.text();
  if(!content.startsWith('<svg')||!content.includes('class="dragon-art"')||!content.includes('</svg>'))throw Error('invalid dragon art');
  dragonArtwork=content;
  document.querySelectorAll('.nl-dino:not([data-stage="0"])').forEach(d=>{
   const old=d.querySelector('svg');if(old)old.outerHTML=dragonArtwork;
  });
 }catch(e){/* Keep the original mascot artwork if the SVG is unavailable offline. */}
}

const WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=41.3874&longitude=2.1686&current=temperature_2m,cloud_cover,weather_code,precipitation,rain,snowfall,is_day,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=Europe%2FMadrid';
// The model's `rain`/`precipitation` values refer to a prior accumulation window,
// not necessarily to rain falling at this instant. Use the instantaneous WMO code.
const TTL=15*60*1000,MAX_STALE=30*60*1000;
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
function dinoStage(){
 const p=window.CottageGarden?.progress?.();
 const completed=Number(p?.completedBlocks)||0;
 return completed<5?0:completed<25?1:completed<100?2:completed<300?3:4;
}
function eggSvg(){
 return `<svg viewBox="0 0 124 108" aria-hidden="true" focusable="false"><ellipse cx="62" cy="100" rx="36" ry="6" fill="#274b37" opacity=".24"/><path d="M62 9 C27 9 21 58 29 82 Q37 102 62 102 Q87 102 95 82 C103 58 97 9 62 9Z" fill="#d9e6bb" stroke="#608a71" stroke-width="3"/><g fill="#8cb59a"><ellipse cx="46" cy="42" rx="8" ry="12"/><ellipse cx="75" cy="65" rx="10" ry="7"/><ellipse cx="64" cy="26" rx="5" ry="6"/></g><path d="M45 78 l10 -9 8 8 9 -11 9 6" fill="none" stroke="#6a927a" stroke-width="2"/></svg>`;
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
 happy:['¡Una hoja nueva!','Hoy el jardín huele a victoria.','¡Mis alitas están de fiesta!'],
 curious:['¿Qué habrá dentro de la cueva?','Estoy contando mariposas.','¿Damos una vuelta?'],
 mischief:['He escondido una piedra.','Hoy me toca explorar.','Estoy tramando una pequeña dragontravesura.'],
 sleepy:['Zzz… cinco minutos más.','He soñado que volaba sobre Barcelona.','Shhh… duerme el bosque.']
};
function dinoClick(host){
 const d=host.querySelector('.nl-dino');if(!d)return;
 const state=d.dataset.mood||'curious',n=(Number(d.dataset.taps)||0)+1;
 d.dataset.taps=String(n);
 const msg=d.dataset.stage==='0'?['Crac… ¿has oído eso?','Dentro está creciendo algo.','Todavía un poquito de paciencia.'][(n-1)%3]:say[state][(n-1)%say[state].length];
 const bubble=d.querySelector('.nl-dino-bubble');bubble.textContent=msg;
 // A small wing celebration; occasional hover is unlocked only at stages 3–4.
 if(d.dataset.stage!=='0'){
  d.classList.remove('nl-dragon-flap','nl-dragon-flight');
  void d.offsetWidth;
  const stage=Number(d.dataset.stage);
  d.classList.add(stage>=3&&n%3===0?'nl-dragon-flight':'nl-dragon-flap');
  clearTimeout(d.__motionTimer);
  d.__motionTimer=setTimeout(()=>d.classList.remove('nl-dragon-flap','nl-dragon-flight'),2600);
 }
 d.classList.remove('nl-speaking');void d.offsetWidth;d.classList.add('nl-speaking');
 clearTimeout(d.__bubbleTimer);d.__bubbleTimer=setTimeout(()=>d.classList.remove('nl-speaking'),3300);
}
function updateDino(host){
 const d=host.querySelector('.nl-dino');if(!d)return;
 const m=mood(),names={happy:'alegre',curious:'curioso',mischief:'travieso',sleepy:'dormido'};
 const stage=dinoStage();
 if(d.dataset.stage!==String(stage)){
  d.dataset.stage=String(stage);
  const picture=d.querySelector('svg');if(picture)picture.outerHTML=petArt(stage);
 }
 if(d.dataset.mood!==m){d.dataset.mood=m;}
 d.setAttribute('aria-label',stage===0?'Huevo de dragoncillo. Tócalo para saludar.':'Dragoncillo '+names[m]+'. Tócalo para saludarlo.');
}
function weatherKind(c){
 if(!c||!Number.isFinite(Number(c.weather_code)))return null;
 const w=Number(c.weather_code);
 // WMO code describes the current sky; `rain` and `precipitation` are
 // accumulated over the preceding hour and may remain positive under clear skies.
 if(w===95||w===96||w===97||w===99)return 'storm';
 if([71,73,75,77,85,86].includes(w))return 'snow';
 if([61,63,65,66,67,80,81,82].includes(w))return 'rain';
 if([51,53,55,56,57].includes(w))return 'drizzle';
 if(w===45||w===48)return 'fog';
 if(w===3)return 'clouds';
 if(w===2)return 'partly';
 if(w===0||w===1)return 'clear';
 return null;
}
function flakes(kind){
 const n=kind==='snow'?18:kind==='storm'?17:kind==='rain'?17:kind==='drizzle'?11:0;
 let s='';for(let i=0;i<n;i++){
  const x=((i*37+7)%97),delay=-(i*0.31%3.4).toFixed(2),duration=(1.3+(i%5)*.23).toFixed(2);
  s+=`<i style="--nl-x:${x}%;--nl-delay:${delay}s;--nl-duration:${duration}s"></i>`;
 }
 return s;
}
const BCN_CLOCK=new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'});
function updateBarcelonaClock(){
 const t=document.getElementById('barcelonaClock');
 if(t){t.textContent=BCN_CLOCK.format(new Date());t.dateTime=new Date().toISOString();}
}
function updateBarcelonaBar(){
 const strip=document.getElementById('barcelonaWeather');if(!strip)return;
 updateBarcelonaClock();
 const sky=document.getElementById('barcelonaCondition'),temp=document.getElementById('barcelonaTemperature'),wind=document.getElementById('barcelonaWind');
 const valid=weather&&Date.now()-weatherAt<MAX_STALE;
 const kind=valid?weatherKind(weather):null;
 const age=valid?Date.now()-weatherAt:Infinity;
 strip.dataset.weatherState=kind?(age>TTL?'cached':'live'):'unknown';
 sky.textContent=kind?weatherKinds[kind].label:'Tiempo no disponible';
 const c=kind&&weather.temperature_2m!=null?Number(weather.temperature_2m):NaN;
 temp.textContent=Number.isFinite(c)?Math.round(c)+' °C':'— °C';
 const speed=kind&&weather.wind_speed_10m!=null?Number(weather.wind_speed_10m):NaN;
 const direction=kind&&Number.isFinite(Number(weather.wind_direction_10m))&&weather.wind_direction_10m!=null?Number(weather.wind_direction_10m):NaN;
 const sectors=['N','NE','E','SE','S','SO','O','NO'];
 const dir=Number.isFinite(direction)?' '+sectors[Math.round(((direction%360)+360)%360/45)%8]:'';
 wind.textContent='〰 Viento '+(Number.isFinite(speed)?Math.round(speed)+' km/h'+dir:'— km/h');
 const hour=kind&&typeof weather.time==='string'?weather.time.slice(11,16):null;
 strip.title=kind?'Datos estimados de Open-Meteo para Barcelona'+(hour?', lectura de las '+hour+' h':'')+(age>TTL?'. Última lectura guardada.':'.'):'Datos meteorológicos no disponibles o antiguos.';
}
function applyWeather(host){
 updateBarcelonaBar();
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
 const icon=weather.is_day===0&&(kind==='clear'||kind==='partly')?'☾':spec.icon;
 const measured=typeof weather.time==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/.test(weather.time)?weather.time.slice(11,16):null;
 chip.textContent=icon+(t?' '+t:'');
 chip.title='Barcelona: '+spec.label+(t?', '+t:'')+(measured?', datos de las '+measured+' h (Barcelona)':'')+'. Estimación meteorológica de Open-Meteo.';
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
  const d=document.createElement('button');d.type='button';d.className='nl-dino nl-dragon';
  d.innerHTML=petArt(dinoStage())+'<span class="nl-dino-bubble" aria-live="polite"></span>';
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
setInterval(()=>{updateBarcelonaClock();if(!document.hidden){refresh();refreshWeather();}},60000);
window.NucleoGardenLife=Object.freeze({version:'1.1.0',refresh,weatherKind,mood});
loadDragonArtwork();
updateBarcelonaBar();
schedule();
})();
