import pathlib,sys,json,hashlib,subprocess
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
r=pathlib.Path('C:/Users/adria');sys.stdout.reconfigure(encoding='utf-8')
def route(req):
 p=(r/unquote(urlparse(req.request.url).path).lstrip('/')).resolve()
 if not p.is_relative_to(r.resolve()) or not p.is_file():req.abort();return
 req.fulfill(body=p.read_bytes(),content_type={'.js':'application/javascript','.html':'text/html','.json':'application/json','.css':'text/css'}.get(p.suffix,'application/octet-stream'))
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 for width in [390,1280]:
  ctx=b.new_context(viewport={'width':width,'height':844},service_workers='block');p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.route('**/*',route)
  p.goto('https://adrianxds-ads.github.io/adaptive-exam/cambridge-quiz.html',wait_until='load')
  assert p.locator('.ql-evidence').count()==1
  p.locator('[name=quizKind][value=mixed]').check()
  for part in [1,2,3]:
   p.locator('#quizModes [data-part="'+str(part)+'"]').click()
   origin=p.locator('#quizOrigin').inner_text()
   answer=p.evaluate("""part=>{const ids=document.querySelector('#quizOrigin').textContent.match(/\\d+/g).map(Number),papers=[...(window.ADAPTIVE_EXAM_TRANSCRIBED_CAMBRIDGE_PAPERS||[]),...(window.ADAPTIVE_EXAM_PAPERS||[])],section=papers.find(x=>x.examNumber===ids[0]).parts[part],q=(section.items||section.segments.filter(x=>typeof x==='object')).find(x=>Number(x.n)===ids[1]);return q.answers?.[0]||q.answer;}""",part)
   if part==1:
    opts=p.locator('#quizAnswerArea .option-btn')
    text=opts.all_text_contents();wrong=next(i for i,v in enumerate(text) if v[1:]!=answer);opts.nth(wrong).click()
   else:p.locator('#quizInput').fill('wrong');p.locator('#submitQuiz').click()
   assert p.locator('#targetGap').inner_text()==answer,(part,answer,p.locator('#targetGap').inner_text())
   assert p.locator('#targetGap').get_attribute('class').find('ql-answer')>=0
   if part==2 and width==390:p.screenshot(path=str(r/'adrian-hub/tests/cambridge-correction-mobile.png'))
   p.wait_for_timeout(650);assert p.locator('#quizOrigin').inner_text()==origin
   p.wait_for_function("document.querySelector('#quizPosition').textContent.startsWith('2 /')")
   # prior answered gap contains the correct word, while the recorded user attempt remains wrong.
   history=p.evaluate("JSON.parse(localStorage.getItem('cambridgeB2ExerciseStatsV3')).attempts")
   assert history[-1]['items'][0]['userAnswer']!=''+answer
   p.locator('#quitQuiz').click()
   assert p.locator('.ql-evidence').count()==1
  assert not errors,errors;print('PASS Cambridge',width,'Parts 1/2/3: expected word in original text, hold, history',flush=True);ctx.close()
 # Local durable archive: repeated question IDs must retain distinct attempts; trimming only after archive commit.
 ctx=b.new_context(service_workers='block');p=ctx.new_page();p.route('**/*',route);p.goto('https://adrianxds-ads.github.io/adaptive-keyword-speaking/index.html')
 p.evaluate("""()=>{window.fixture=Array.from({length:1300},(_,i)=>({id:'same-question',at:1700000000000+i,ok:i%2===0}));window.first=QuizLearning.retain(fixture,1200,'fixture:answers');}""")
 assert p.evaluate('first.length')==1300
 p.wait_for_function("""()=>new Promise(resolve=>{const q=indexedDB.open('xds-learning-history-v1',1);q.onsuccess=()=>{const c=q.result.transaction('records').objectStore('records').count();c.onsuccess=()=>resolve(c.result===1300);};})""")
 assert p.evaluate("QuizLearning.retain(fixture,1200,'fixture:answers').length")==1200
 p.reload(wait_until='load')
 count=p.evaluate("""()=>new Promise(resolve=>{const q=indexedDB.open('xds-learning-history-v1',1);q.onsuccess=()=>{const c=q.result.transaction('records').objectStore('records').count();c.onsuccess=()=>resolve(c.result);};})""");assert count==1300,count
 print('PASS durable archive: 1300 unique attempts retained across reload, 1200 active window',flush=True)
 p.evaluate("""()=>{window.indexedDB.open=()=>{throw Error('simulated storage failure')};}""")
 # Fresh helper instance to exercise a rejected first archive.
 p.add_script_tag(content=(r/'adaptive-keyword-speaking/learning-feedback.js').read_text(encoding='utf-8'))
 assert p.evaluate("QuizLearning.retain(Array.from({length:1300},(_,i)=>({at:i,id:'x'})),1200,'unavailable').length")==1300
 print('PASS unavailable archive: detail is not truncated',flush=True)
 ctx.close();b.close()
