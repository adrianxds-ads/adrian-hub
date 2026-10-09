import pathlib,json,hashlib,urllib.request,concurrent.futures,sys,time
r=pathlib.Path('C:/Users/adria');sys.stdout.reconfigure(encoding='utf-8')
names=['adaptive-english','b2-multiple-choice-cloze','adaptive-verbs-catala','adaptive-phrasal-verbs','adaptive-pizarras','adaptive-exam','adaptive-keyword-speaking','adaptive-hoti0108','adrian-hub']
extra={'adaptive-exam':['cambridge-quiz.html','cambridge-quiz.js'],'b2-multiple-choice-cloze':['territory-01.js','territory-01.json'],'adaptive-phrasal-verbs':['phrasals.js'],'adaptive-pizarras':['questions.js'],'adaptive-keyword-speaking':['data/engexam-bank.js'],'adrian-hub':['versions.json']}
checks=[(n,f) for n in names for f in ['app.js','index.html','service-worker.js','build-assets.js']+([] if n=='adrian-hub' else ['learning-feedback.js'])+extra.get(n,[])]
def check(item):
 n,f=item;p=r/n/f;url='https://adrianxds-ads.github.io/'+n+'/'+f+'?xdsRelease='+str(int(time.time()))
 try:
  data=urllib.request.urlopen(url,timeout=20).read().replace(b'\r\n',b'\n');expected=p.read_bytes().replace(b'\r\n',b'\n')
  return {'app':n,'file':f,'match':hashlib.sha256(data).digest()==hashlib.sha256(expected).digest()}
 except Exception as e:return {'app':n,'file':f,'match':False,'error':type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(check,checks))
missing=[x for x in results if not x['match']]
if missing:print('WAITING publication',json.dumps(missing),flush=True)
else:
 print('PASS public publication',len(results),'changed assets match canonical bytes',flush=True)
 (r/'adrian-hub/tests/QUIZ_PUBLICATION_ACCEPTANCE_20261009.json').write_text(json.dumps({'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'hub':'30.4.32','assets':results,'physicalPixel':False},indent=2)+'\n',encoding='utf-8')
sys.exit(1 if missing else 0)
