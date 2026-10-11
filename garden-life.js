/* Núcleo Garden Life 1.1 — decorative and read-only; shared by Hub and Task Garden.
   Barcelona weather is estimated by Open-Meteo. No rewards/progress are written. */
(function(){
'use strict';
if(window.NucleoGardenLife)return;
const HISTORY_KEY='adrianEasyCatalanTaskSessionsV1';
const WEATHER_KEY='nucleo_garden_weather_barcelona_v1';
// The SVG is presentation-only and cannot change cottage tasks or plant growth.
const DRAGON_URL=new URL('./garden-dragon.svg?v=1.1.0',document.currentScript?.src||location.href);
// Purely decorative illustration; never substitutes or covers the progress trees.
const BCN_LANDSCAPE_URL=new URL('./garden-barcelona.svg?v=1.0.0',document.currentScript?.src||location.href);
const BCN_SKY_CLOCK=new Intl.DateTimeFormat('en-GB',{
 timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
});
const BCN_SKY_DATE=new Intl.DateTimeFormat('en-CA',{
 timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'
});
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

const WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=41.3874&longitude=2.1686&current=temperature_2m,cloud_cover,weather_code,precipitation,rain,snowfall,is_day,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&daily=sunrise,sunset&forecast_days=1&timezone=Europe%2FMadrid';
// The model's `rain`/`precipitation` values refer to a prior accumulation window,
// not necessarily to rain falling at this instant. Use the instantaneous WMO code.
const TTL=15*60*1000,MAX_STALE=30*60*1000;
const mounted=new WeakSet();
// Decorative journey state only; the task garden remains exclusively progress-driven.
const journeys=new WeakMap();
const personalities=new WeakMap();
// Mood, phrases and reward reactions are transient, do not write score/history.
let rewardBaseline=null;
let lastRewardReaction=0;
let lastUserActivity=Date.now();
['pointerdown','keydown'].forEach(type=>document.addEventListener(type,()=>{lastUserActivity=Date.now();},{passive:true,capture:true}));
const REWARD_COOLDOWN=30000;
const AUTO_DIALOGUE_INTERVAL=165000;
const AUTO_DIALOGUE_GRACE=90000;
function gardenInView(host){
 const rect=host?.getBoundingClientRect();
 return !!rect&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<window.innerHeight&&
  !document.querySelector('#immersiveLayer:not([hidden])');
}
function petState(host){
 let data=personalities.get(host);
 if(!data){data={lastTap:Date.now(),lastSpeech:0,lastAuto:Date.now(),lastLine:'',lines:new Map()};personalities.set(host,data);}
 return data;
}

const JOURNEY_INTERVAL=16000;
const travelDisabled=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function isTaskGarden(host){return host.id==='taskGarden'||!!host.closest('#taskJourney');}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function obstaclePoint(host,target){
 const d=host.querySelector('.nl-dino'),box=host.getBoundingClientRect(),r=target?.getBoundingClientRect();
 if(!d||!r||!r.width||!r.height||!box.width||!box.height)return null;
 const half=d.offsetWidth/2;
 // SVG g bounds are transformed into actual screen coordinates, including viewBox meet.
 // Keep 10 px from the container and enough room for a short speech bubble.
 const x=clamp(r.left+r.width/2-box.left-half,10,Math.max(10,box.width-half-67));
 const bottom=clamp(box.bottom-r.bottom+3,Math.max(5,box.height*.055),Math.max(6,box.height*.31));
 return {left:x,bottom};
}
function journeyDestination(host,place){
 const d=host.querySelector('.nl-dino');if(!d)return null;
 const plants=host.querySelectorAll('.cottage-garden [data-cottage-plant]');
 const cave=host.querySelector('.cottage-garden .jurassic-cave');
 if(place==='cave'){
  const point=obstaclePoint(host,cave);
  if(point)return point;
  return {left:clamp(host.clientWidth*.72-d.offsetWidth/2,10,host.clientWidth*.72),
    bottom:Math.max(7,host.clientHeight*.09)};
 }
 if(place==='tree'){
  // These are the existing larger trees grown by the main Hub apps, not invented scenery.
  const tree=host.querySelector('.gg-scene .gg-plant[data-active="true"]')||
    host.querySelector('.gg-scene .gg-plant[data-app]');
  const point=obstaclePoint(host,tree);
  if(point)return point;
 }
 if(place==='plant'){
  // The last live plant really belongs to the user's growth history.
  const plant=plants.length?plants[plants.length-1]:null;
  const point=obstaclePoint(host,plant);
  if(point)return point;
 }
 const fallback=place==='clearing'?.28:.38;
 return {left:clamp(host.clientWidth*fallback-d.offsetWidth/2,10,host.clientWidth*.68),
  bottom:Math.max(8,host.clientHeight*.105)};
}
function weatherShelter(){
 if(!weather||Date.now()-weatherAt>MAX_STALE)return false;
 return ['rain','drizzle','snow','storm'].includes(weatherKind(weather));
}
function flightWeatherOK(){
 if(weatherShelter())return false;
 // Bad conditions do not trigger automatic takeoff (wind is a modelled, recent value).
 if(weather&&Date.now()-weatherAt<=MAX_STALE){
  const wind=Number(weather.wind_speed_10m);
  if(Number.isFinite(wind)&&wind>=30)return false;
 }
 return true;
}
function visit(host,place,fly=false){
 if(!host?.isConnected||isTaskGarden(host))return false;
 const d=host.querySelector('.nl-dino'),stage=Number(d?.dataset.stage)||0;
 if(!d||stage===0||travelDisabled())return false;
 const j=journeys.get(host);if(!j)return false;
 const coords=journeyDestination(host,place);
 if(!coords)return false;
 const actualFlight=fly&&stage>=3&&flightWeatherOK()&&place!=='cave';
 const dx=Math.abs((parseFloat(d.style.left)||host.clientWidth*.14)-coords.left);
 const duration=actualFlight?4400:Math.round(clamp(dx*25,2500,5700));
 d.dataset.journey=actualFlight?'flying':place;
 updateEcosystem(host);
 d.classList.toggle('nl-dragon-travel-flight',actualFlight);
 d.classList.toggle('nl-dragon-travel-walk',!actualFlight&&place!=='cave');
 d.style.transitionDuration=duration+'ms';
 d.style.left=coords.left.toFixed(1)+'px';
 d.style.bottom=coords.bottom.toFixed(1)+'px';
 j.place=place;
 clearTimeout(j.settleTimer);
 j.settleTimer=setTimeout(()=>{
  if(!d.isConnected||isTaskGarden(host))return;
  d.classList.remove('nl-dragon-travel-flight','nl-dragon-travel-walk');
  d.dataset.journey=place;
  if(place==='cave')d.classList.add('nl-at-cave');else d.classList.remove('nl-at-cave');
 },duration+100);
 return true;
}
function journeyTick(host,immediate=false){
 if(!host?.isConnected||isTaskGarden(host))return;
 const d=host.querySelector('.nl-dino');
 if(!d)return;
 const stage=Number(d.dataset.stage)||0;
 let j=journeys.get(host);
 if(!j){j={turn:0,place:null,steps:null,settleTimer:null};journeys.set(host,j);}
 if(stage===0){
  d.dataset.journey='egg';
  d.classList.remove('nl-dragon-travel-walk','nl-dragon-travel-flight','nl-at-cave');
  d.style.removeProperty('left');d.style.removeProperty('bottom');
  return;
 }
 if(travelDisabled()){
  d.dataset.journey='still';
  d.classList.remove('nl-dragon-travel-walk','nl-dragon-travel-flight');
  d.style.removeProperty('left');d.style.removeProperty('bottom');
  return;
 }
 // A newly completed growth step draws the dragon's attention to an existing plant.
 const growth=Number(window.CottageGarden?.progress?.().growthSteps);
 const growing=Number.isFinite(growth)&&j.steps!==null&&growth>j.steps;
 if(Number.isFinite(growth))j.steps=growth;
 const shelter=d.dataset.mood==='sleepy'||weatherShelter();
 if(shelter){
  if(j.place!=='cave')visit(host,'cave');
  return;
 }
 if(growing){
  if(visit(host,'plant')){
   const bubble=d.querySelector('.nl-dino-bubble');
   if(bubble)speak(host,'¡Una hoja más! El bosque se acuerda de cada avance.',{celebrate:true});
  }
  return;
 }
 if(immediate){
  if(j.place===null)visit(host,'clearing');
  return;
 }
 j.turn++;
 const path=['plant','clearing','cave','tree','plant','clearing'];
 const place=path[j.turn%path.length];
 // Later stages occasionally glide instead of marching, no new rewards.
 const fly=stage>=3&&j.turn%4===0;
 visit(host,place,fly);
}
function journeyLoop(){
 if(document.hidden)return;
 document.querySelectorAll('.github-garden').forEach(host=>journeyTick(host));
}
function personalityLoop(){
 if(document.hidden||travelDisabled())return;
 for(const host of document.querySelectorAll('.github-garden')){
  if(isTaskGarden(host)||!host.isConnected||!gardenInView(host))continue;
  const d=host.querySelector('.nl-dino'),st=petState(host);
  if(!d||Number(d.dataset.stage)===0)continue;
  if(Date.now()-st.lastAuto<AUTO_DIALOGUE_INTERVAL||Date.now()-lastUserActivity<AUTO_DIALOGUE_GRACE||Date.now()-st.lastSpeech<AUTO_DIALOGUE_GRACE)continue;
  // Rare spontaneous lines (not every 16-second journey tick).
  speak(host,nextLine(host,phraseContext(host)),{automatic:true});
 }
}

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
 happy:['¡Hoy tengo las alas especialmente contentas!','Este bosque crece con buenas ideas.','Acabo de aprender una palabra: ¡excelente!','¿Has visto qué bien están los árboles?','Hoy estoy para dar un saltito.'],
 curious:['¿Ese árbol siempre fue tan alto?','Me pregunto qué hay detrás de la cueva.','Voy a contar las hojas. Otra vez.','¿Dónde habré dejado mi piedra favorita?','Tengo una teoría sobre las mariposas.'],
 mischief:['Estoy tramando una pequeña dragontravesura.','He cambiado una piedra de sitio. Nadie lo notará.','Si ves una hoja al revés… no he sido yo.','He escondido una piña. A plena vista.','¿Los dragones necesitamos licencia para volar?'],
 sleepy:['Shhh… duerme el bosque.','He soñado que volaba sobre Barcelona.','Mi cueva tiene cinco estrellas. Imaginarias.','Zzz… estoy vigilando con los ojos cerrados.','Mañana sigo explorando.'],
 cave:['Mi cueva tiene una acústica estupenda. ¡Eco!','En casa se está de maravilla.','Aquí guardo mis tesoros: tres piedras y una hoja.','Mis alitas también necesitan descansar.'],
 tree:['Este árbol sabe guardar secretos.','¿Cuántas primaveras tendrá?','Los árboles grandes también empezaron pequeños.','Me gusta ver cómo crecen sin prisa.'],
 plant:['¡Hola, hojita!','Esta planta crece con cada pequeño avance.','Las raíces hacen su trabajo en silencio.','Creo que esta planta me está mirando.'],
 clearing:['Aquí puedo estirar bien las alas.','Un rincón perfecto para pensar.','¿Dónde plantaremos la próxima semilla?','Me gusta este pedacito de bosque.'],
 rain:['Está lloviendo en Barcelona: mejor bajo techo.','Las nubes están regando el jardín.','Hoy prefiero escuchar la lluvia desde la cueva.'],
 wind:['Con este viento, mejor los pies en la tierra.','Mis alas hacen de veleta.','Viento a favor… de quedarme un rato aquí.'],
 morning:['Buenos días, bosque.','El sol ya está despertando las hojas.','Voy a comprobar si ha crecido algo.'],
 afternoon:['Una vuelta corta y regreso.','Esta tarde huele a aventuras pequeñas.'],
 evening:['El bosque está bajando el ritmo.','Un paseo más antes de dormir.'],
 special:['¡Otra estrella en nuestro cielo!','¡Una estrella más! La guardaré junto a la cueva.']
};
function bcnHour(){
 try{return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',hourCycle:'h23'}).format(new Date()));}
 catch{return new Date().getHours();}
}
function phraseContext(host){
 const d=host.querySelector('.nl-dino');
 if(!d)return 'curious';
 const place=d.dataset.journey;
 if(weatherShelter())return 'rain';
 const w=weather&&Date.now()-weatherAt<MAX_STALE?Number(weather.wind_speed_10m):NaN;
 if(Number.isFinite(w)&&w>=30)return 'wind';
 if(place==='cave')return 'cave';
 if(place==='tree'||place==='plant'||place==='clearing')return place;
 const hr=bcnHour();
 if(hr>=7&&hr<11)return 'morning';
 if(hr>=11&&hr<19)return 'afternoon';
 if(hr>=19&&hr<23)return 'evening';
 return d.dataset.mood||'curious';
}
function nextLine(host,key){
 const st=petState(host),list=say[key]||say.curious;
 // Rotate through every line in a context before repeating; avoid
 // repeating the last line when switching between contexts.
 let index=st.lines.get(key)||0;
 let line=list[index%list.length];
 if(line===st.lastLine&&list.length>1){index++;line=list[index%list.length];}
 st.lines.set(key,index+1);st.lastLine=line;
 return line;
}
function orientBubble(host){
 const d=host?.querySelector('.nl-dino');if(!d)return;
 const rect=d.getBoundingClientRect(),garden=host.getBoundingClientRect();
 const center=rect.left-garden.left+rect.width/2;
 d.dataset.bubbleAlign=center<(host.clientWidth/2)?'left':'right';
}
function speak(host,line,{automatic=false,celebrate=false}={}){
 const d=host?.querySelector('.nl-dino');if(!d||!d.isConnected)return false;
 const bubble=d.querySelector('.nl-dino-bubble');if(!bubble)return false;
 const st=petState(host);
 if(automatic){
  if(document.hidden||isTaskGarden(host)||travelDisabled()||Number(d.dataset.stage)===0||!gardenInView(host))return false;
  if(Date.now()-lastUserActivity<AUTO_DIALOGUE_GRACE||Date.now()-st.lastTap<AUTO_DIALOGUE_GRACE||Date.now()-st.lastSpeech<AUTO_DIALOGUE_GRACE)return false;
  if(d.classList.contains('nl-speaking'))return false;
 }
 orientBubble(host);
 bubble.textContent=line;
 st.lastSpeech=Date.now();
 if(automatic)st.lastAuto=Date.now();
 d.classList.remove('nl-speaking');void d.offsetWidth;d.classList.add('nl-speaking');
 clearTimeout(d.__bubbleTimer);
 d.__bubbleTimer=setTimeout(()=>d.classList.remove('nl-speaking'),celebrate?4400:3300);
 if(celebrate){
  d.classList.remove('nl-dragon-celebrate');void d.offsetWidth;d.classList.add('nl-dragon-celebrate');
  clearTimeout(d.__celebrateTimer);
  d.__celebrateTimer=setTimeout(()=>d.classList.remove('nl-dragon-celebrate'),2400);
 }
 return true;
}
function rewardInventory(detail){
 const apps=detail?.apps;
 if(!apps||typeof apps!=='object'||Array.isArray(apps))return null;
 const normalized={};
 for(const [id,value] of Object.entries(apps)){
  const n=Number(value);
  if(Number.isFinite(n)&&n>=0)normalized[id]=Math.floor(n);
 }
 return normalized;
}
function onRewardUpdate(event){
 const next=rewardInventory(event.detail);
 if(!next)return;
 if(!rewardBaseline){rewardBaseline=next;return;} // do not celebrate already earned rewards on load
 const gains=[];
 for(const [id,n] of Object.entries(next)){
  const prev=rewardBaseline[id];
  // Never infer a new prize for an app that was not in the initial snapshot.
  if(Number.isFinite(prev)&&n>prev){
   const addedStars=Math.floor(n/5)-Math.floor(prev/5);
   gains.push({id,gold:n-prev,stars:addedStars});
  }
 }
 rewardBaseline=next; // read-only live observation; no new score or persistence
 if(!gains.length||Date.now()-lastRewardReaction<REWARD_COOLDOWN||document.hidden)return;
 const host=document.querySelector('#githubGarden');
 const d=host?.querySelector('.nl-dino');
 if(!host||!d||Number(d.dataset.stage)===0||travelDisabled()||!gardenInView(host))return;
 const totalGold=gains.reduce((sum,a)=>sum+a.gold,0),star=gains.some(a=>a.stars>0);
 const line=star?nextLine(host,'special'):(totalGold===1?'¡Un oro más conseguido! ¡Muy bien!':'¡'+totalGold+' oros nuevos! ¡Menuda cosecha!');
 lastRewardReaction=Date.now();
 speak(host,line,{celebrate:true});
}
window.addEventListener('hub:reward-summary-updated',onRewardUpdate);
function dinoClick(host){
 const d=host.querySelector('.nl-dino');if(!d)return;
 const state=d.dataset.mood||'curious',n=(Number(d.dataset.taps)||0)+1;
 d.dataset.taps=String(n);
 if(!isTaskGarden(host)&&Number(d.dataset.stage)>=1){
  if(d.dataset.mood==='sleepy'||weatherShelter())visit(host,'cave');
  else if(n%3===0)visit(host,'cave');
  else visit(host,n%2===0?'tree':'plant',Number(d.dataset.stage)>=3&&n%4===0);
 }
 const st=petState(host);st.lastTap=Date.now();
 const eco=host.dataset.ecosystem;
 const ecoMessage=n%6===0&&eco==='butterfly'?'¡Una mariposa! Voy a seguirla con los ojos.':
  n%6===0&&eco==='fireflies'?'¡Mira las lucecitas del bosque!':
  n%6===0&&eco==='leaves'?'Con el viento, hasta las hojas salen de paseo.':null;
 const msg=d.dataset.stage==='0'?['Crac… ¿has oído eso?','Dentro está creciendo algo.','Todavía un poquito de paciencia.'][(n-1)%3]:
  (ecoMessage||nextLine(host,((n%3===0||state==='sleepy')?state:phraseContext(host))));
 // A small wing celebration; occasional hover is unlocked only at stages 3–4.
 if(d.dataset.stage!=='0'){
  d.classList.remove('nl-dragon-flap','nl-dragon-flight');
  void d.offsetWidth;
  const stage=Number(d.dataset.stage);
  d.classList.add(stage>=3&&n%4===0&&flightWeatherOK()&&d.dataset.journey!=='cave'?'nl-dragon-flight':'nl-dragon-flap');
  clearTimeout(d.__motionTimer);
  d.__motionTimer=setTimeout(()=>d.classList.remove('nl-dragon-flap','nl-dragon-flight'),2600);
 }
 speak(host,msg);
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

// Dragon's tiny decorative ecosystem. Uses a recent *estimated* Barcelona weather
// reading only to decide whether the fantasy particles should be shown.
// Creatures are illustrations, not claims of actual Barcelona wildlife.
const ECOSYSTEM_MAX_WIND_BUTTERFLY=22;
const ECOSYSTEM_MIN_WIND_LEAVES=14;
function ecosystemMode(){
 if(travelDisabled()||!weather||!weatherAt||Date.now()-weatherAt>MAX_STALE)return 'quiet';
 const kind=weatherKind(weather);
 if(!kind||['rain','drizzle','snow','storm','fog'].includes(kind))return 'quiet';
 const wind=weather.wind_speed_10m==null?NaN:Number(weather.wind_speed_10m);
 const month=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',month:'numeric'}).format(new Date()));
 if(Number.isFinite(wind)&&wind>=ECOSYSTEM_MIN_WIND_LEAVES&&[9,10,11].includes(month))return 'leaves';
 if(weather.is_day===1&&['clear','partly'].includes(kind)&&(!Number.isFinite(wind)||wind<ECOSYSTEM_MAX_WIND_BUTTERFLY))return 'butterfly';
 if(weather.is_day===0&&['clear','partly'].includes(kind)&&(!Number.isFinite(wind)||wind<ECOSYSTEM_MAX_WIND_BUTTERFLY))return 'fireflies';
 return 'quiet';
}
function ecosystemMarkup(){
 // Fixed, inexpensive decorative children; never track clicks, points or progress.
 return '<span class="nl-eco-butterflies" aria-hidden="true">'+
  [0,1].map(i=>'<span class="nl-butterfly nl-butterfly-'+i+'">'+
  '<svg viewBox="0 0 54 38" aria-hidden="true" focusable="false">'+
  '<path d="M27 19Q6 -4 2 12Q-1 27 26 22Z" fill="#f3d29d" stroke="#8d785e" stroke-width="1.5"/>'+
  '<path d="M27 19Q46 -4 52 12Q55 27 28 22Z" fill="#d6bfe8" stroke="#877c96" stroke-width="1.5"/>'+
  '<path d="M25 22Q6 23 12 33Q20 40 27 25Z" fill="#ebb0a5" stroke="#a57875" stroke-width="1"/>'+
  '<path d="M29 22Q48 23 42 33Q34 40 27 25Z" fill="#bbdebc" stroke="#78937e" stroke-width="1"/>'+
  '<path d="M27 13V29M27 15l-4-5m4 5 4-5" stroke="#5a6a5a" stroke-width="2" stroke-linecap="round" fill="none"/>'+
  '</svg></span>').join('')+'</span>'+
  '<span class="nl-eco-fireflies" aria-hidden="true">'+Array.from({length:5},(_,i)=>'<i class="nl-firefly nl-firefly-'+i+'"></i>').join('')+'</span>'+
  '<span class="nl-eco-leaves" aria-hidden="true">'+Array.from({length:5},(_,i)=>'<i class="nl-leaf nl-leaf-'+i+'"></i>').join('')+'</span>';
}
function updateEcosystem(host){
 if(!host||isTaskGarden(host))return;
 let layer=host.querySelector(':scope > .nl-ecosystem');
 if(!layer){
  layer=document.createElement('div');layer.className='nl-ecosystem';
  layer.setAttribute('aria-hidden','true');
  layer.innerHTML=ecosystemMarkup();
  host.appendChild(layer);
 }
 const mode=ecosystemMode();
 if(layer.dataset.ecoMode!==mode){
  layer.dataset.ecoMode=mode;
  host.dataset.ecosystem=mode;
 }
 const d=host.querySelector('.nl-dino');
 if(d){
  const curious=Number(d.dataset.stage)>0&&mode!=='quiet'&&
   (d.dataset.journey==='plant'||d.dataset.journey==='clearing'||d.dataset.journey==='tree');
  d.classList.toggle('nl-dragon-watching',curious);
 }
}

// Barcelona is a miniaturised illustration, NOT a geographical map.
// Use today's estimated sunrise and sunset when available; the soft
// transitions start 40 minutes before and finish 35 minutes after.
// If the estimate cannot be checked, choose a modest local-clock fallback,
// without inventing an exact astronomical event.
function bcnMinutes(){
 const parts=BCN_SKY_CLOCK.formatToParts(new Date());
 const hour=Number(parts.find(x=>x.type==='hour')?.value);
 const minute=Number(parts.find(x=>x.type==='minute')?.value);
 return Number.isFinite(hour)&&Number.isFinite(minute)?hour*60+minute:NaN;
}
function bcnLocalDate(){
 const parts=BCN_SKY_DATE.formatToParts(new Date());
 const m=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return [m.year,m.month,m.day].join('-');
}
function bcnSunMinutes(value,today){
 if(typeof value!=='string'||!value.startsWith(today+'T'))return null;
 const match=/T(\d{2}):(\d{2})/.exec(value);
 if(!match)return null;
 const h=Number(match[1]),m=Number(match[2]);
 return h<24&&m<60?h*60+m:null;
}
function barcelonaPhase(){
 const minute=bcnMinutes();
 if(!Number.isFinite(minute))return 'night';
 const recent=weather&&weatherAt&&Date.now()-weatherAt<MAX_STALE;
 if(recent){
  const date=bcnLocalDate();
  const sunrise=bcnSunMinutes(weather.sunrise_local,date);
  const sunset=bcnSunMinutes(weather.sunset_local,date);
  if(sunrise!==null&&sunset!==null&&sunrise<sunset){
   if(minute>=sunrise-40&&minute<sunrise+25)return 'dawn';
   if(minute>=sunset-40&&minute<sunset+35)return 'dusk';
   return minute<sunrise-40||minute>=sunset+35?'night':'day';
  }
  if(weather.is_day===0||weather.is_day===1)
   return weather.is_day===1?'day':'night';
 }
 return minute>=7*60&&minute<9*60+30?'dawn':
        minute>=18*60&&minute<20*60?'dusk':
        minute>=9*60+30&&minute<18*60?'day':'night';
}
function updateBarcelonaLandscape(host){
 if(!host||isTaskGarden(host))return;
 let layer=host.querySelector(':scope > .nl-barcelona-landscape');
 if(!layer){
  layer=document.createElement('div');
  layer.className='nl-barcelona-landscape';
  layer.setAttribute('aria-hidden','true');
  const artwork=document.createElement('img');
  artwork.src=BCN_LANDSCAPE_URL.href;
  artwork.alt='';
  artwork.decoding='async';
  artwork.draggable=false;
  artwork.addEventListener('error',()=>{layer.hidden=true;});
  layer.appendChild(artwork);
  host.appendChild(layer);
 }
 const phase=barcelonaPhase();
 if(host.dataset.bcnPhase!==phase)host.dataset.bcnPhase=phase;
}
function applyWeather(host){
 updateBarcelonaBar();
 updateBarcelonaLandscape(host);
 updateEcosystem(host);
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
  weather={...data.current};
  if(Array.isArray(data.daily?.sunrise)&&Array.isArray(data.daily?.sunset)){
   const sunrise=data.daily.sunrise[0],sunset=data.daily.sunset[0];
   if(typeof sunrise==='string'&&typeof sunset==='string'){
    weather.sunrise_local=sunrise;weather.sunset_local=sunset;
   }
  }
  weatherAt=Date.now();
  try{localStorage.setItem(WEATHER_KEY,JSON.stringify({at:weatherAt,current:weather}));}catch{}
 }catch(e){/* Retain a recent real reading or show no current weather; never invent it. */}
 finally{requesting=false;document.querySelectorAll('.github-garden').forEach(host=>{applyWeather(host);journeyTick(host,true);});}
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
  // Core garden may redraw its scene: forget coordinates belonging to an old pet node.
  journeys.delete(host);
  const d=document.createElement('button');d.type='button';d.className='nl-dino nl-dragon';
  d.innerHTML=petArt(dinoStage())+'<span class="nl-dino-bubble" aria-live="polite"></span>';
  host.appendChild(d);
  d.addEventListener('pointerdown',event=>event.stopPropagation());
  d.addEventListener('click',()=>dinoClick(host));
 }
 if(!mounted.has(host))mounted.add(host);
 updateDino(host);applyWeather(host);
 journeyTick(host,true);
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
 document.querySelectorAll('.github-garden').forEach(host=>journeyTick(host,true));
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
setInterval(journeyLoop,JOURNEY_INTERVAL);
setInterval(personalityLoop,45000);
window.NucleoGardenLife=Object.freeze({version:'1.6.0',refresh,weatherKind,mood});
loadDragonArtwork();
updateBarcelonaBar();
schedule();
})();
