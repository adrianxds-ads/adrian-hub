"""Isolated English quartet regression. No real progress or remote sync."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import mimetypes,json,sys,time
sys.stdout.reconfigure(encoding='utf-8');root=Path(__file__).resolve().parents[2]
names=['adaptive-english','b2-multiple-choice-cloze','adaptive-phrasal-verbs','adaptive-pizarras']
reports=[]
def serve(r):
 u=urlparse(r.request.url)
 if u.hostname!='adrianxds-ads.github.io':r.abort();return
 f=root/unquote(u.path).lstrip('/')
 if f.is_dir():f=f/'index.html'
 r.fulfill(status=200 if f.is_file() else 404,body=f.read_bytes() if f.is_file() else b'missing',content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
def rows(p):return p.evaluate("session.records?.length??session.times.length")
def position(p):return p.evaluate("({top:document.querySelector('#answers').getBoundingClientRect().top+scrollY,height:document.querySelector('.prompt-card').getBoundingClientRect().height,cardTop:document.querySelector('.prompt-card').getBoundingClientRect().top+scrollY,stageTop:document.querySelector('#gameScreen').getBoundingClientRect().top+scrollY,progress:document.querySelector('.progress-track').getBoundingClientRect().height,scroll:scrollY,stack:document.querySelector('.focus-stack')?.getBoundingClientRect().top,app:document.querySelector('.app').getBoundingClientRect().top})")
def ready(p,name):
 p.wait_for_function("window.ClassroomBootComplete===true" if name=='adaptive-pizarras' else "typeof state!=='undefined'&&!!state&&!!document.body.dataset.quizErgonomics",timeout=20000)
def reveal(p,name):
 p.wait_for_function("document.querySelectorAll('#answers >button.option-btn').length===4")
 if name=='adaptive-english':
  if p.evaluate('focusAwaiting'):p.locator('#questionText').tap()
 elif p.locator('.nucleo-read-skip:visible').count():p.locator('.nucleo-read-skip:visible').click()
 p.wait_for_function("!locked && !document.querySelector('#answers').matches('.read-first-hidden,.prethink-hidden')",timeout=10000)
def choice(p,name,correct):
 if name in ['adaptive-english','b2-multiple-choice-cloze']:idx=p.evaluate('current.correctPos')
 elif name=='adaptive-phrasal-verbs':idx=p.evaluate('current.options.findIndex(x=>x.key===current.correctKey)')
 else:idx=p.evaluate("[...document.querySelectorAll('#answers >button.answer')].findIndex(b=>b.textContent===current.correct)")
 assert idx>=0
 return idx if correct else (idx+1)%4
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 for name in (sys.argv[1:] or names):
  c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,service_workers='block')
  c.route('**/*',serve)
  c.add_init_script("""window.qeCaptured=[];(()=>{const old=window.setInterval;window.setInterval=function(fn,ms,...args){if(ms===50)window.qeCaptured.push(fn);return old.call(this,fn,ms,...args);};})();""")
  p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('https://adrianxds-ads.github.io/'+name+'/');ready(p,name)
  start='#quickBtn' if name=='adaptive-pizarras' else '#startBtn'
  p.locator(start).click();p.wait_for_selector('#gameScreen:not(.hidden)')
  anchors=[];holds=[]
  for i in range(15):
   reveal(p,name);p.wait_for_timeout(120)
   assert rows(p)==i,(name,i,rows(p))
   current=p.evaluate('session.questionCount' if name=='adaptive-pizarras' else 'session.index');assert current==i
   before=position(p);anchors.append(before['top'])
   p.evaluate("window.qeOldInterval=window.qeCaptured.at(-1)")
   correct=i not in [5,9]
   if i==9:
    fn='renderQuestion' if name=='adaptive-pizarras' else 'nextQuestion'
    p.evaluate("()=>{window.qeSaved="+fn+";window.qeFail=1;"+fn+"=function(){if(window.qeFail-->0)throw Error('INJECTED_RENDER_RECOVERY');return window.qeSaved();};}")
   idx=choice(p,name,correct);start_time=time.monotonic()
   p.locator('#answers >button.answer').nth(idx).tap()
   # Immediate duplicate invocation must be ignored by the native answer lock.
   if name in ['adaptive-english','b2-multiple-choice-cloze']:p.evaluate('answer(current.correctPos,false)')
   elif name=='adaptive-phrasal-verbs':p.evaluate('answer(current.options[0],false)')
   else:p.evaluate('answer(current.correct,null,false)')
   assert rows(p)==i+1
   p.wait_for_timeout(120);after=position(p)
   if abs(before['top']-after['top'])>1:
    p.screenshot(path=str(root/'layout-failure.png'),full_page=True)
    print('LAYOUT_FAILURE',p.evaluate("({prompt:current.q||current.text||current.prompt,ancestors:[...document.querySelectorAll('.app,#gameScreen,.focus-stack,.progress-track,.prompt-card,.answer-stage')].map(e=>({cls:e.className,id:e.id,css:e.style.cssText,computed:{top:getComputedStyle(e).top,translate:getComputedStyle(e).translate,position:getComputedStyle(e).position,margin:getComputedStyle(e).margin,display:getComputedStyle(e).display,gap:getComputedStyle(e).gap}}))})"),flush=True)
   assert abs(before['top']-after['top'])<=1,(name,i,'feedback layout shift',before,after)
   if i in [0,5,9]:
    p.screenshot(path=str(root/(name+'-'+str(i)+'-feedback.png')),full_page=True)
   # Native timer callback queued before the answer is now obsolete.
   p.evaluate('window.qeOldInterval?.()');assert rows(p)==i+1
   if i==5:
    cd=c.new_cdp_session(p);cd.send('Page.setWebLifecycleState',{'state':'frozen'});time.sleep(2.3);cd.send('Page.setWebLifecycleState',{'state':'active'})
   if i<14:
    p.wait_for_function("!locked && session && "+("session.questionCount" if name=='adaptive-pizarras' else "session.index")+"==="+str(i+1),timeout=10000)
    elapsed=time.monotonic()-start_time;holds.append(elapsed)
    assert elapsed>=(.90 if correct else 1.90),(name,i,'early advance',elapsed)
    assert rows(p)==i+1
    p.evaluate('window.qeOldInterval?.()');assert rows(p)==i+1
   else:p.wait_for_selector('#endScreen:not(.hidden)',timeout=15000)
  got=p.evaluate("({answers:state.totalAttempts??state.answers,sessions:state.sessions,history:(state.sessionHistory||state.history).length})")
  assert got=={'answers':15,'sessions':1,'history':1},(name,got)
  assert max(anchors)-min(anchors)<=1,(name,'between-question shift',anchors)
  assert p.evaluate('quizFlow.pending.size')==0
  # Same profile reload retains native progress; no storage migration by this feature.
  p.reload();ready(p,name)
  assert p.evaluate('(state.totalAttempts??state.answers)===15&&state.sessions===1')
  assert not errors,(name,errors)
  report={'app':name,'answers':15,'sessions':1,'anchorSpread':round(max(anchors)-min(anchors),3),'minAdvanceSec':round(min(holds),3),'errors':errors}
  reports.append(report);print('PASS FULL_ROUND',json.dumps(report),flush=True);c.close()
 b.close()
(root/'ergonomics-round-results.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
