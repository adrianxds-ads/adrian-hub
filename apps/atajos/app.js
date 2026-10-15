/* Atajos Sprint 1.0.2 · Quiz de 15 s, flashcards, progreso e histórico local exportable. */
(() => {
'use strict';
const bank=window.ATAJOS_BANK||[],groups=window.ATAJOS_GROUPS||{};
const STORE='xds_atajos_sprint_v1',ROUND=15,SECONDS=15,READ_MS=1000,HOLD_MS=1100;
const $=id=>document.getElementById(id),byId=new Map(bank.map(x=>[x.id,x]));
const views=['home','quiz','flash','result'];
const nowISO=()=>new Date().toISOString(),rand=()=>Math.random().toString(36).slice(2,10);
const empty=()=>({schema:1,app:'atajos-sprint',cards:{},sessions:[],draft:null,prefs:{group:'all',readFirst:true,sound:false,fontScale:115}});
let state;let mode='home',clock=null,hold=null,quiz=null,flash=null,audio=null;
function load(){
 try{const x=JSON.parse(localStorage.getItem(STORE)||'null');if(x?.schema===1&&x.cards&&Array.isArray(x.sessions)){return {...empty(),...x,prefs:{...empty().prefs,...x.prefs}};}}catch(_){}
 return empty();
}
state=load();
const FONT_STEPS=[100,115,130,145,160];
function applyFontScale(){
 const n=Number(state.prefs.fontScale);
 const scale=FONT_STEPS.includes(n)?n:115;
 document.documentElement.style.setProperty('--atajos-type-scale',String(scale/100));
 $('fontSizeLabel').textContent=scale+'%';
 $('fontSmaller').disabled=scale<=FONT_STEPS[0];
 $('fontLarger').disabled=scale>=FONT_STEPS[FONT_STEPS.length-1];
}
function changeFont(direction){
 const cur=FONT_STEPS.includes(Number(state.prefs.fontScale))?Number(state.prefs.fontScale):115;
 const next=FONT_STEPS[Math.max(0,Math.min(FONT_STEPS.length-1,FONT_STEPS.indexOf(cur)+direction))];
 if(next===cur)return;
 state.prefs.fontScale=next;
 applyFontScale();
 save();
 if(mode==='home')renderHome();
}
applyFontScale();
function save(){
 try{localStorage.setItem(STORE,JSON.stringify(state));$('storageStatus').textContent='Progreso guardado en este navegador · sin sincronización entre dispositivos.';return true;}
 catch(err){$('storageStatus').textContent='⚠ Sin espacio o almacenamiento restringido: exporta JSON para conservar tu progreso.';console.error('No se guardó el estado',err);return false;}
}
if(state.draft && Array.isArray(state.draft.attempts)){
 if(state.draft.attempts.length){
  const old={...state.draft,completedAt:nowISO(),status:'interrumpida',correct:state.draft.attempts.filter(a=>a.correct).length,medal:null};
  if(!state.sessions.some(s=>s.id===old.id))state.sessions.push(old);
 }
 state.draft=null;save();
}
function show(name){
 mode=name;views.forEach(id=>$(id).hidden=id!==name);
 window.scrollTo({top:0,behavior:'instant'});
 if(name==='home')renderHome();
}
function groupCards(){return bank.filter(x=>state.prefs.group==='all'||x.group===state.prefs.group);}
function getStats(id){return state.cards[id]||{quizAttempts:0,correct:0,quick:0,box:0,seenAt:null,lastAt:null,nextDue:0,flashSeen:0,flashKnown:0};}
function mastery(r){return r.quizAttempts>=3&&r.correct>=3&&r.box>=3;}
function metrics(){
 const list=bank,seen=list.filter(c=>getStats(c.id).quizAttempts>0).length,
 mastered=list.filter(c=>mastery(getStats(c.id))).length,
 pending=list.filter(c=>!mastery(getStats(c.id))).length;
 const sessions=state.sessions.filter(s=>s.status==='completada'&&s.total===15);
 const medals={m13:0,m14:0,m15:0};
 for(const s of sessions){if(s.correct===13)medals.m13++;else if(s.correct===14)medals.m14++;else if(s.correct===15)medals.m15++;}
 return{seen,mastered,pending,sessions,medals,stars:Math.floor(medals.m15/5)};
}
function renderHome(){
 const m=metrics();
 $('coverage').textContent=Math.round(m.seen*100/bank.length)+'%';
 $('mastery').textContent=Math.round(m.mastered*100/bank.length)+'%';
 $('due').textContent=String(m.pending);
 $('medal13').textContent=m.medals.m13;$('medal14').textContent=m.medals.m14;$('medal15').textContent=m.medals.m15;
 $('starCount').textContent=m.stars;
 $('groupSelect').value=state.prefs.group;$('readFirst').checked=state.prefs.readFirst;
 $('soundToggle').setAttribute('aria-pressed',String(!!state.prefs.sound));
 $('soundToggle').textContent=state.prefs.sound?'♫':'♪';
 const arr=m.sessions.slice(-6).reverse();$('history').replaceChildren();
 for(const s of arr){
  const row=document.createElement('div');row.className='history-item';
  const date=new Date(s.completedAt||s.startedAt).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  const a=document.createElement('span');a.textContent=date+' · '+(s.group==='all'?'Mixto':groups[s.group]?.name||s.group);
  const b=document.createElement('strong');b.textContent=s.correct+'/15 · '+Math.round(100*s.correct/15)+'%';
  row.append(a,b);$('history').appendChild(row);
 }
 drawChart(m.sessions.slice(-12));
}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function chooseDeck(){
 const items=groupCards(),due=Date.now();
 const unseen=shuffle(items.filter(c=>!getStats(c.id).quizAttempts));
 const weak=shuffle(items.filter(c=>getStats(c.id).quizAttempts&&!mastery(getStats(c.id))&&getStats(c.id).nextDue<=due))
   .sort((a,b)=>getStats(a.id).box-getStats(b.id).box);
 const known=shuffle(items.filter(c=>getStats(c.id).quizAttempts));
 const chosen=[],added=new Set();
 function put(arr,limit){for(const c of arr){if(chosen.length>=limit)break;if(!added.has(c.id)){chosen.push(c);added.add(c.id);}}}
 put(weak,Math.min(5,ROUND));put(unseen,ROUND);put(weak,ROUND);put(known,ROUND);put(shuffle(items),ROUND);
 return shuffle(chosen);
}
function makeQuestion(card){
 const pool=bank.filter(x=>x.group===card.group && x.id!==card.id),reverse=Math.random()<.45;
 const correct=reverse?card.key:card.meaning;
 let options=[correct];
 for(const c of shuffle(pool)){const x=reverse?c.key:c.meaning;if(!options.includes(x))options.push(x);if(options.length===4)break;}
 if(options.length!==4)throw Error('Banco insuficiente para opciones');
 return{cardId:card.id,reverse,prompt:reverse?'¿Qué atajo corresponde a esta acción?':'¿Qué hace este atajo?',front:reverse?card.meaning:card.key,answer:correct,options:shuffle(options)};
}
function makeRound(){
 const cards=chooseDeck();if(cards.length!==ROUND)throw Error('La categoría no tiene 15 preguntas');
 return {id:'session-'+Date.now()+'-'+rand(),startedAt:nowISO(),group:state.prefs.group,total:ROUND,readFirst:state.prefs.readFirst,questions:cards.map(makeQuestion),attempts:[]};
}
function stopTimers(){if(clock){cancelAnimationFrame(clock);clock=null;}if(hold){clearTimeout(hold);hold=null;}}
function sound(type){
 if(!state.prefs.sound)return;
 try{
  audio=audio||new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const base=type==='good'?660:type==='gold'?780:210,notes=type==='gold'?[base,base*1.25,base*1.5]:[base];
  notes.forEach((hz,i)=>{const t=audio.currentTime+i*.11,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.10,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.19);});
 }catch(_){}
}
function startQuiz(){
 if(mode==='quiz')return;stopTimers();quiz={session:makeRound(),index:0,question:null,phase:'idle',startedMs:0,spent:0,pausedMs:0,hiddenAt:0};state.draft=quiz.session;save();show('quiz');nextQuestion();
}
function nextQuestion(){
 stopTimers();if(!quiz)return;
 if(quiz.index>=ROUND){finishQuiz();return;}
 const q=quiz.session.questions[quiz.index];quiz.question=q;quiz.phase='reading';quiz.spent=0;quiz.hiddenAt=0;quiz.pausedMs=0;
 $('questionNumber').textContent=(quiz.index+1)+' / '+ROUND;
 $('points').textContent=quiz.session.attempts.reduce((s,a)=>s+(a.correct?100+Math.max(0,Math.round((SECONDS-a.answerSeconds)*10)):0),0)+' pts';
 const card=byId.get(q.cardId);
 $('questionGroup').textContent=groups[card.group]?.name||card.group;
 $('questionText').textContent=q.prompt;$('questionHint').textContent=q.front;
 $('feedback').textContent='';$('feedback').className='feedback';
 const options=$('options');options.replaceChildren();options.hidden=!!state.prefs.readFirst;
 q.options.forEach((value,index)=>{
  const b=document.createElement('button');b.type='button';b.className='option';b.dataset.index=String(index);
  const key=document.createElement('span');key.className='letter';key.textContent='ABCD'[index];
  const text=document.createElement('span');text.textContent=value;b.append(key,text);
  b.addEventListener('click',()=>answer(index));options.appendChild(b);
 });
 $('secondsLeft').textContent=String(SECONDS);$('timerArc').style.strokeDashoffset='0';
 $('readPrompt').hidden=!state.prefs.readFirst;
 if(state.prefs.readFirst){
  hold=setTimeout(()=>{hold=null;if(!quiz||quiz.phase!=='reading')return;$('readPrompt').hidden=true;options.hidden=false;startClock();},READ_MS);
 }else startClock();
}
function startClock(){
 if(!quiz)return;quiz.phase='active';quiz.startedMs=performance.now();quiz.pausedMs=0;quiz.hiddenAt=document.hidden?performance.now():0;
 const run=(now)=>{
  if(!quiz||quiz.phase!=='active')return;
  const elapsed=(quiz.hiddenAt?quiz.hiddenAt:now)-quiz.startedMs-quiz.pausedMs;
  const remain=Math.max(0,SECONDS-elapsed/1000);
  $('secondsLeft').textContent=String(Math.ceil(remain));
  $('timerArc').style.strokeDashoffset=String(282.743*(1-remain/SECONDS));
  if(remain<=0){answer(-1);return;}
  clock=requestAnimationFrame(run);
 };clock=requestAnimationFrame(run);
}
document.addEventListener('visibilitychange',()=>{
 if(!quiz||quiz.phase!=='active')return;
 if(document.hidden){quiz.hiddenAt=performance.now();if(clock)cancelAnimationFrame(clock);clock=null;}
 else if(quiz.hiddenAt){quiz.pausedMs+=performance.now()-quiz.hiddenAt;quiz.hiddenAt=0;startFrame();}
});
function startFrame(){
 if(quiz&&quiz.phase==='active'){const now=performance.now(),elapsed=(now-quiz.startedMs-quiz.pausedMs)/1000;
  if(elapsed>=SECONDS){answer(-1);return;}clock=requestAnimationFrame(function tick(t){if(!quiz||quiz.phase!=='active')return;const elapsed=(quiz.hiddenAt?quiz.hiddenAt:t)-quiz.startedMs-quiz.pausedMs,remain=Math.max(0,SECONDS-elapsed/1000);$('secondsLeft').textContent=String(Math.ceil(remain));$('timerArc').style.strokeDashoffset=String(282.743*(1-remain/SECONDS));if(remain<=0)answer(-1);else clock=requestAnimationFrame(tick);});
 }
}
function answer(index){
 if(!quiz||quiz.phase!=='active')return;
 const q=quiz.question,card=byId.get(q.cardId),elapsed=(performance.now()-quiz.startedMs-quiz.pausedMs)/1000,seconds=Math.min(SECONDS,Math.max(0,elapsed));
 quiz.phase='feedback';stopTimers();const picked=index>=0?q.options[index]:null,correct=index>=0&&picked===q.answer;
 const attempt={cardId:q.cardId,group:card.group,key:card.key,reverse:q.reverse,prompt:q.front,response:picked,expected:q.answer,correct,timeout:index<0,answerSeconds:Math.round(seconds*1000)/1000,at:nowISO()};
 quiz.session.attempts.push(attempt);
 const old=getStats(q.cardId),box=correct?Math.min(5,old.box+1):0;
 const intervals=[0,30*1000,6*60*1000,24*60*60*1000,3*24*60*60*1000,7*24*60*60*1000];
 state.cards[q.cardId]={...old,quizAttempts:old.quizAttempts+1,correct:old.correct+(correct?1:0),quick:old.quick+(correct&&seconds<=2.5?1:0),box,seenAt:old.seenAt||attempt.at,lastAt:attempt.at,nextDue:Date.now()+(correct?intervals[box]:20000)};
 state.draft=quiz.session;save();
 const opts=[...$('options').children];
 opts.forEach((node,i)=>{node.disabled=true;if(q.options[i]===q.answer)node.classList.add('correct');else if(i===index)node.classList.add('wrong');});
 $('feedback').textContent=correct?'✓ ¡Correcto! '+seconds.toFixed(1)+' s':(index<0?'⏱ Tiempo agotado':'✕ Repasa')+' · '+q.answer;
 $('feedback').className='feedback '+(correct?'correct':'wrong');$('secondsLeft').textContent=String(Math.max(0,Math.ceil(SECONDS-seconds)));
 sound(correct?'good':'bad');if(!correct&&navigator.vibrate)try{navigator.vibrate(12);}catch(_){}
 quiz.index++;hold=setTimeout(()=>{hold=null;if(quiz)nextQuestion();},HOLD_MS);
}
function quitQuiz(){
 if(!quiz)return;stopTimers();
 if(quiz.session.attempts.length){const s={...quiz.session,completedAt:nowISO(),status:'interrumpida',correct:quiz.session.attempts.filter(a=>a.correct).length,medal:null};state.sessions.push(s);}
 state.draft=null;quiz=null;save();show('home');
}
function finishQuiz(){
 if(!quiz)return;stopTimers();
 const s=quiz.session;s.completedAt=nowISO();s.status='completada';s.correct=s.attempts.filter(a=>a.correct).length;
 s.medal=s.correct===15?'oro':s.correct===14?'violeta':s.correct===13?'azul':null;
 state.sessions.push(s);state.draft=null;quiz=null;save();show('result');
 $('finalScore').textContent=s.correct+'/15';
 $('resultTitle').textContent=s.medal==='oro'?'¡Medalla de oro!':s.medal?'¡Medalla '+s.medal+'!':'Una ronda más de práctica';
 const quick=s.attempts.filter(a=>a.correct&&a.answerSeconds<=2.5).length;
 $('resultDetail').textContent='Aciertos: '+s.correct+' · Respuestas automáticas (≤2,5 s): '+quick+' · Errores: '+(15-s.correct);
 const times=s.attempts.map(a=>a.answerSeconds),average=times.reduce((a,b)=>a+b,0)/times.length;
 $('resultTime').textContent='Tiempo medio '+average.toFixed(2)+' s';
 $('resultMedal').textContent=s.medal?'Medalla '+s.medal:'Sin medalla';
 if(s.medal==='oro'){const gold=metrics().medals.m15;if(gold%5===0)sound('gold');}
 $('errorReview').replaceChildren();
 const wrong=s.attempts.filter(a=>!a.correct);
 if(wrong.length){const h=document.createElement('h2');h.textContent='Repasa estas respuestas';$('errorReview').appendChild(h);}
 for(const a of wrong){const row=document.createElement('article'),code=document.createElement('strong'),answerText=document.createElement('span');code.textContent=a.key;answerText.textContent='→ '+byId.get(a.cardId).meaning;row.append(code,answerText);$('errorReview').appendChild(row);}
 renderGlossary(s);
}
const KEY_NAMES={Win:'tecla Windows',Ctrl:'Control',Alt:'Alt (alternativa)',Mayús:'Mayúsculas (Shift)',Esc:'Escape',Tab:'Tabulador',Espacio:'barra espaciadora',Intro:'Enter',Supr:'Suprimir'};
function explainKeys(key){
 const names=[...new Set((key.match(/\b(?:Win|Ctrl|Alt|Mayús|Esc|Tab|Espacio|Intro|Supr|F\d{1,2})\b/g)||[]))];
 const bits=names.map(x=>x+' = '+(KEY_NAMES[x]||'tecla de función '+x));
 if(key.includes('←')||key.includes('→'))bits.push('←/→ = flechas de dirección');
 return bits.join(' · ');
}
function renderGlossary(session){
 const host=$('glossaryList');host.replaceChildren();
 $('sessionGlossary').open=true;
 for(const [i,a] of session.attempts.entries()){
  const card=byId.get(a.cardId),row=document.createElement('li');
  row.className='glossary-item '+(a.correct?'is-correct':'is-wrong');
  if(!card){row.textContent=(i+1)+'. Atajo sin ficha disponible';host.appendChild(row);continue;}
  const top=document.createElement('div');top.className='glossary-top';
  const code=document.createElement('strong');code.textContent=card.key;
  const status=document.createElement('span');status.className='glossary-status';
  status.textContent=a.correct?'✓ Acertado':a.timeout?'⏱ Sin responder':'✕ Error';
  top.append(code,status);
  const action=document.createElement('p');action.className='glossary-action';action.textContent='¿Para qué sirve? '+card.meaning+'.';
  row.append(top,action);
  const keyParts=explainKeys(card.key);
  if(keyParts){const description=document.createElement('p');description.className='glossary-key-legend';description.textContent='Teclas: '+keyParts;row.appendChild(description);}
  if(!a.correct){
   const userAnswer=document.createElement('p');userAnswer.className='glossary-user-answer';
   userAnswer.textContent=a.timeout?'Se agotó el tiempo sin responder.':'Tu respuesta: '+String(a.response??'Sin respuesta');
   row.appendChild(userAnswer);
  }
  host.appendChild(row);
 }
}
function startFlash(){
 if(mode==='quiz')return;stopTimers();flash={cards:shuffle(groupCards()).sort((a,b)=>getStats(a.id).box-getStats(b.id).box),index:0,up:false};show('flash');paintFlash();
}
function paintFlash(){
 if(!flash)return;if(flash.index>=flash.cards.length){flash=null;show('home');return;}
 const card=flash.cards[flash.index];flash.up=false;
 $('flashCounter').textContent=(flash.index+1)+' / '+flash.cards.length;
 $('flashGroup').textContent=groups[card.group]?.name||card.group;
 $('flashCaption').textContent='RECUERDA · '+groups[card.group]?.name;
 $('flashFront').textContent=card.key;$('flashBack').textContent=card.meaning;
 $('flashBack').hidden=true;$('revealFlash').hidden=false;$('flashActions').hidden=true;
}
function revealFlash(){
 if(!flash||flash.up)return;flash.up=true;$('flashBack').hidden=false;$('revealFlash').hidden=true;$('flashActions').hidden=false;
}
function gradeFlash(remembered){
 if(!flash||!flash.up)return;
 const c=flash.cards[flash.index],s=getStats(c.id);
 state.cards[c.id]={...s,flashSeen:s.flashSeen+1,flashKnown:s.flashKnown+(remembered?1:0)};
 save();
 if(!remembered && !flash.cards.slice(flash.index+1).some(x=>x.id===c.id))flash.cards.splice(Math.min(flash.index+3,flash.cards.length),0,c);
 flash.index++;paintFlash();
}
function soundToggle(){state.prefs.sound=!state.prefs.sound;save();renderHome();}
function drawChart(sessions){
 const canvas=$('trendChart'),empty=$('trendEmpty');empty.hidden=sessions.length>0;canvas.hidden=sessions.length===0;if(!sessions.length)return;
 const width=Math.max(280,canvas.clientWidth||560),height=130,dpr=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(width*dpr);canvas.height=height*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,width,height);
 const pad=18,plotH=96,slot=(width-pad*2)/sessions.length;
 sessions.forEach((s,i)=>{const x=pad+i*slot+slot*.17,correct=s.correct/15,quick=s.attempts.filter(a=>a.correct&&a.answerSeconds<=2.5).length/15,w=slot*.66;
  ctx.fillStyle='#d1c1e9';ctx.fillRect(x,110-plotH*correct,w,plotH*correct);
  ctx.fillStyle='#a47bbf';ctx.fillRect(x,110-plotH*quick,w,plotH*quick);
  ctx.font='12px Roboto, sans-serif';ctx.textAlign='center';ctx.fillStyle='#445065';ctx.fillText(String(s.correct),x+w/2,124);
 });
}
function jsonExport(){
 const m=metrics();return{schema:'xds.shortcuts.learning.v1',exportedAt:nowISO(),source:'Memoria de atajos v1.0 · 15/10/2026',appVersion:'1.0.2',
  deviceScope:'Almacenamiento local del navegador; no sincronización certificada',bank:{total:bank.length,groups:Object.fromEntries(Object.keys(groups).map(g=>[g,bank.filter(c=>c.group===g).length]))},
  metrics:{coverage:Math.round(100*m.seen/bank.length),estimatedMastery:Math.round(100*m.mastered/bank.length),remaining:m.pending,medals:m.medals,stars:m.stars},
  cards:state.cards,sessions:state.sessions,draft:state.draft,prefs:state.prefs};
}
function downloadJson(){
 const text=JSON.stringify(jsonExport(),null,2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='atajos-sprint-progreso-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function copyJson(){
 const text=JSON.stringify(jsonExport(),null,2);
 try{await navigator.clipboard.writeText(text);$('storageStatus').textContent='JSON completo copiado al portapapeles.';}
 catch(_){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.top='0';ta.style.width='1px';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(_){}ta.remove();$('storageStatus').textContent=ok?'JSON copiado.':'La copia no está disponible; utiliza Exportar JSON.';}
}
$('fontSmaller').addEventListener('click',()=>changeFont(-1));
$('fontLarger').addEventListener('click',()=>changeFont(1));
$('groupSelect').addEventListener('change',e=>{state.prefs.group=e.target.value;save();renderHome();});
$('readFirst').addEventListener('change',e=>{state.prefs.readFirst=e.target.checked;save();});
$('soundToggle').addEventListener('click',soundToggle);
$('startQuiz').addEventListener('click',startQuiz);$('quitQuiz').addEventListener('click',quitQuiz);
$('startFlash').addEventListener('click',startFlash);$('quitFlash').addEventListener('click',()=>{flash=null;show('home');});
$('revealFlash').addEventListener('click',revealFlash);$('flashAgain').addEventListener('click',()=>gradeFlash(false));$('flashKnown').addEventListener('click',()=>gradeFlash(true));
$('playAgain').addEventListener('click',()=>{show('home');startQuiz();});$('goHome').addEventListener('click',()=>show('home'));
$('exportJson').addEventListener('click',downloadJson);$('copyJson').addEventListener('click',copyJson);
window.addEventListener('resize',()=>{if(mode==='home')renderHome();});
window.__ATAJOS_TEST__={bankSize:bank.length,metrics,storeKey:STORE,version:'1.0.2'};
renderHome();
})();