import sys,json,pathlib,hashlib,subprocess,time
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
r=pathlib.Path('C:/Users/adria');sys.stdout.reconfigure(encoding='utf-8')
baseline=json.loads((r/'adrian-hub/tests/quiz-learning-baseline.json').read_text(encoding='utf-8'))
for n,meta in baseline.items():
 for file,h in meta['protected'].items():assert hashlib.sha256((r/n/file).read_bytes()).hexdigest()==h,('Protected material changed',n,file)
 for f in ['app.js','learning-feedback.js']:
  c=subprocess.run(['node','--check',str(r/n/f)],capture_output=True,text=True);assert c.returncode==0,c.stderr
print('PASS syntax and protected materials',flush=True)
def route(req):
 u=urlparse(req.request.url);p=(r/unquote(u.path).lstrip('/')).resolve()
 if u.path.endswith('/'):p=p/'index.html'
 if not p.is_relative_to(r.resolve()) or not p.is_file():req.abort();return
 typ={'.js':'application/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'}.get(p.suffix,'application/octet-stream')
 req.fulfill(body=p.read_bytes(),content_type=typ)
names=['adaptive-english','b2-multiple-choice-cloze','adaptive-verbs-catala','adaptive-phrasal-verbs','adaptive-pizarras','adaptive-keyword-speaking','adaptive-hoti0108']
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 for width,height in [(390,844),(1280,900)]:
  for n in names:
   ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('**/*',route)
   try:
    page.goto('https://adrianxds-ads.github.io/'+n+'/',wait_until='load')
    page.wait_for_function("typeof QuizLearning!=='undefined'")
    if n in ['adaptive-english','b2-multiple-choice-cloze','adaptive-verbs-catala']:
     page.wait_for_function("typeof state!=='undefined'&&!!state&&!!BANK")
     page.evaluate("showLevelIntro=async()=>{};if(typeof readFirstMode!=='undefined')readFirstMode=false;if(typeof readFirstEnabled==='function')readFirstEnabled=()=>false;")
     page.evaluate("startSession(false)");page.wait_for_function("current&&current.correctPos>=0&&!locked")
     before=page.evaluate("({index:session.index,id:current.id,attempts:state.totalAttempts,correct:current.visibleOptions[current.correctPos]})")
     page.evaluate("answer(current.correctPos,false)")
     assert page.locator('.ql-answer,.ql-correction').count()>0,'No correct solution'
     assert before['correct'] in page.locator('#questionText').inner_text() or before['correct'] in page.locator('.ql-correction').inner_text()
     page.wait_for_timeout(650);assert page.evaluate("session.index")==before['index'],'Hold too short'
     page.wait_for_function("session.index===1")
     assert page.evaluate("state.totalAttempts")==before['attempts']+1
     page.evaluate("answer(-1,false)");assert page.locator('.ql-answer,.ql-correction').count()>0
     page.wait_for_function("session.index===2")
     # Production mode: actual text must be recorded, with the mode marked independently.
     if n in ['b2-multiple-choice-cloze','adaptive-verbs-catala']:
      page.evaluate("""()=>{const q=BANK.find(q=>"""+("Number(q.sourcePart)===2" if n=='b2-multiple-choice-cloze' else "q.eligibleModes?.includes('PRODUCTION')")+""");state.seen[q.fingerprint]={count:3,lastTs:Date.now()-86400000,lastLevel:state.level-5};session.plan[session.index]=shuffleOptions(q);const random=Math.random;Math.random=()=>0;nextQuestion();Math.random=random;}""")
      page.wait_for_selector('.ql-production');correct=page.evaluate("current.a[current.c]");page.locator('.ql-production').fill(correct);page.locator('.ql-submit').click()
      rec=page.evaluate("session.records.at(-1)")
      assert rec['correct'] and rec['retrievalMode']=='PRODUCTION' and rec['userAnswer']==correct,rec
     saved=page.evaluate("JSON.parse(localStorage.getItem(STORAGE_KEY)).totalAttempts")
     page.reload(wait_until='load');page.wait_for_function("typeof state!=='undefined'&&!!state")
     assert page.evaluate("state.totalAttempts")==saved
    elif n=='adaptive-phrasal-verbs':
     page.evaluate("showLevelIntro=async()=>{};readFirstEnabled=()=>false;shouldPrethink=()=>false;")
     # Start function name is discovered from its canonical start control.
     page.locator('#startBtn').click();page.wait_for_function("current&&questionPhase==='answer'&&!locked")
     page.evaluate("answer(current.options.find(o=>o.key===current.correctKey))")
     assert page.locator('.ql-answer,.ql-correction').count()>0
     page.wait_for_timeout(650);assert page.evaluate("session.index")==0
     page.wait_for_function("session.index===1")
     page.evaluate("answer(null,true)");assert page.locator('.ql-answer,.ql-correction').count()>0
     page.wait_for_function("session.index===2")
     assert page.evaluate("state.answers")==2
    elif n=='adaptive-pizarras':
     page.evaluate("readFirstMode=false;startQuick()");page.wait_for_function("current&&!locked")
     page.evaluate("answer(current.correct,null,false)");assert page.locator('.ql-answer,.ql-correction').count()>0
     page.wait_for_timeout(650);assert page.evaluate("session.questionCount")==1
     page.wait_for_function("!locked")
     page.evaluate("answer('___wrong___',null,false)");assert page.locator('.ql-answer,.ql-correction').count()>0
     page.wait_for_function("!locked")
     assert page.evaluate("state.answers")==2
     # Final quick question must reveal before recording exactly one finished round.
     page.evaluate("session.index=14;renderQuestion();answer(current.correct,null,false)")
     assert page.locator('.ql-answer,.ql-correction').count()>0
     page.wait_for_timeout(500);assert page.evaluate("state.history.length")==0
     page.wait_for_function("state.history.length===1")
     page.reload(wait_until='load');assert page.evaluate("state.history.length")==1
    elif n=='adaptive-keyword-speaking':
     page.evaluate("secondsPerQuestion=0;startSession()")
     bad=page.evaluate("""()=>QUESTIONS.flatMap(q=>expectedVariants(q).filter(v=>scoreTransformation(v,q).points!==2).map(v=>[q._qid,v]))""");assert not bad,bad[:5]
     assert page.evaluate("""()=>{const q=QUESTIONS.find(q=>q.first==='Cycling is not allowed in the park.');return scoreTransformation('are supposed to cycle',q).points;}""")==0
     page.locator('#answer').fill(page.evaluate("expectedVariants(current())[0]"));page.locator('#checkBtn').click()
     assert page.locator('.ql-correction').count()>0
     page.wait_for_timeout(650);assert page.evaluate('index')==0
     page.wait_for_function('index===1')
     page.locator('#answer').fill('wrong answer');page.locator('#checkBtn').click();assert page.locator('.ql-correction').count()>0
     page.wait_for_function('index===2')
     assert page.evaluate('session.results.length')==2
    elif n=='adaptive-hoti0108':
     page.evaluate("start(bank.slice(0,15).map(q=>q.id))")
     page.wait_for_function("session&&session.ids.length===15")
     page.evaluate("answer(byId.get(session.ids[session.index]).correct_answer)")
     assert page.locator('.ql-correction').count()>0
     page.wait_for_timeout(650);assert page.evaluate('session.index')==0
     page.wait_for_function('session.index===1')
     page.evaluate("answer(null)");assert page.locator('.ql-correction').count()>0
     page.wait_for_function('session.index===2');assert page.evaluate('session.answers.length')==2
    page.evaluate('renderStatsScreen()' if n in ['adaptive-english','b2-multiple-choice-cloze','adaptive-verbs-catala'] else 'renderStatistics()' if n=='adaptive-hoti0108' else 'renderStats()')
    assert page.locator('.ql-evidence').count()==1
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),('overflow',n,width)
    assert not errors,errors
    print('PASS',n,width,'correct/wrong hold, transition, state',flush=True);results.append({'app':n,'width':width,'pass':True})
    if width==390 and n=='adaptive-keyword-speaking':page.screenshot(path=str(r/'adrian-hub/tests/quiz-feedback-mobile.png'))
   except Exception:
    print('FAIL',n,width,'errors',errors,flush=True);raise
   finally:ctx.close()
 browser.close()
(r/'adrian-hub/tests/QUIZ_LEARNING_ACCEPTANCE_20261009.json').write_text(json.dumps({'results':results,'protected':'all hashes match','physicalPixel':False},indent=2),encoding='utf-8')
