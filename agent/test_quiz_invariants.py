import pathlib,subprocess,json,sys,hashlib
r=pathlib.Path('C:/Users/adria');sys.stdout.reconfigure(encoding='utf-8')
for n,f,count in [('adaptive-english','campaign-01.json',3000),('b2-multiple-choice-cloze','territory-01.json',2431),('adaptive-verbs-catala','campaign-01.json',12360)]:
 p=r/n/f;d=json.loads(p.read_text(encoding='utf-8'));qs=d['questions'];assert len(qs)==count
 old=json.loads(subprocess.check_output(['git','-C',str(p.parent),'show','quiz-learning-baseline-20261009:'+f],text=True,encoding='utf-8'))
 assert {q['id'] for q in qs}=={q['id'] for q in old['questions']}
 assert all(0<=q['c']<len(q['a']) and len(set(q['a']))==len(q['a']) for q in qs)
 print('PASS bank IDs/count/options',n,count,flush=True)
js=r"""const fs=require('fs'),vm=require('vm'),r='C:/Users/adria/';
for(const name of ['adaptive-english','adaptive-verbs-catala']){
 const CAMPAIGN=JSON.parse(fs.readFileSync(r+name+'/campaign-01.json','utf8')),BANK=CAMPAIGN.questions,state={level:50,sessions:49,seen:{},metrics:{},templateLast:{},history:[],totalAttempts:6000,unlockedTier:3};
 for(const s of CAMPAIGN.skills)state.metrics[s.id]={attempts:100,lastLevel:49,interval:30,domains:{}};
 const cats=new Map();for(const q of BANK){const idx=cats.get(q.cat)||0;cats.set(q.cat,idx+1);if(idx<50)state.seen[q.fingerprint]={lastLevel:49,lastTs:Date.now()-3600000,nextDueTs:Date.now()+29*86400000,intervalDays:30,count:2,lastCorrect:true,lapses:0};}
 const c={state,CAMPAIGN,BANK,SESSION_SIZE:15,Math,Date,Set,Map,Number,Array,Object,window:{},document:{readyState:'loading',addEventListener(){}},seenInfo:q=>state.seen[q.fingerprint],catPriority:()=>.2,elapsedDays:ts=>(Date.now()-ts)/86400000,skillTimeDue:()=>({due:false,overdue:0})};vm.createContext(c);
 vm.runInContext(fs.readFileSync(r+name+'/learning-feedback.js','utf8'),c);c.QuizLearning=c.window.QuizLearning;
 const a=fs.readFileSync(r+name+'/app.js','utf8');vm.runInContext(a.slice(a.indexOf('function qScore('),a.indexOf('function buildFinalPlan(')),c);
 for(let i=0;i<10;i++){const plan=c.buildTrainingPlan();if(plan.length!==15||plan.some(q=>!!state.seen[q.fingerprint]))throw Error(name+' picked an early review while new items were available');}
 const original=c.qScore;let calls=0;c.qScore=(...args)=>{calls++;return original(...args);};c.chooseOne(BANK,[],{},{},'explore');const eligible=BANK.filter(q=>!state.seen[q.fingerprint]).length;if(calls!==eligible)throw Error(name+' score calls '+calls+' expected '+eligible);
 if(name==='adaptive-english'){c.qScore=original;const i=a.indexOf('function buildFinalPlan('),j=a.indexOf('function shuffleOptions(',i);vm.runInContext(a.slice(i,j),c);for(const q of BANK)state.seen[q.fingerprint]={lastLevel:49,lastTs:Date.now(),nextDueTs:Date.now()+30*86400000,count:4,lastCorrect:true};if(c.buildFinalPlan().length!==30)throw Error('Consolidated Grammar assessment must remain 30 questions');console.log('PASS Grammar assessment: 30 questions with all items known/not due');}
 console.log('PASS planner',name,'10 rounds: 15 new / 0 early; score evaluated once per candidate');
}
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(r+'b2-multiple-choice-cloze/territory-01.js','utf8'),c);
const bank=JSON.parse(fs.readFileSync(r+'b2-multiple-choice-cloze/territory-01.json','utf8'));if(JSON.stringify(c.window.__AE_CAMPAIGN__)!==JSON.stringify(bank))throw Error('Cloze JS/JSON mismatch');
console.log('PASS Cloze bank mirrors');
"""
o=subprocess.run(['node','-e',js],capture_output=True,text=True,encoding='utf-8');print(o.stdout,flush=True);assert o.returncode==0,o.stderr
