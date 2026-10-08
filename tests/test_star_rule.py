from pathlib import Path
import json,threading,http.server,socketserver
from playwright.sync_api import sync_playwright
root=Path('C:/Users/adria')
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
 def log_message(self,*a):pass
srv=socketserver.TCPServer(('127.0.0.1',18772),Handler);threading.Thread(target=srv.serve_forever,daemon=True).start()
cases=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 for path in ['adaptive-english','adaptive-phrasal-verbs','adaptive-keyword-speaking','adaptive-exam']:
  c=b.new_context()
  c.route('**/star-test.html',lambda route:route.fulfill(content_type='text/html',body='<html><head></head><body></body></html>'))
  page=c.new_page();page.goto('http://127.0.0.1:18772/'+path+'/star-test.html')
  page.evaluate('()=>{document.body.innerHTML="";}')
  page.add_script_tag(path=str(root/'adrian-core/components/adrian-achievements.js'))
  for gold,want in [(0,0),(4,0),(5,1),(9,1),(10,2)]:
   page.evaluate('()=>localStorage.clear()')
   result=page.evaluate('(gold)=>window.AdrianAchievements.starState({gold,blue:2,violet:3})',gold)
   assert result['localStars']==want and result['progress']==gold%5
  for apps,want in [({'english':4,'phrasal-verbs':4},0),({'english':5,'phrasal-verbs':4},1),({'english':10,'phrasal-verbs':5},3)]:
   page.evaluate('(apps)=>localStorage.setItem("adrian_hub_stars_v1",JSON.stringify({version:2,apps}))',apps)
   st=page.evaluate('AdrianAchievements.starState()');assert st['stars']==want
  page.evaluate('()=>localStorage.setItem("adrian_hub_stars_v1",JSON.stringify({version:2,apps:{"keyword-speaking":5,"adaptive-keyword-speaking":5}}))')
  assert page.evaluate('AdrianAchievements.starState().stars')==1
  page.evaluate('()=>localStorage.clear()')
  strip=page.evaluate('AdrianAchievements.medalStripHtml({gold:5,blue:2,violet:3})')
  assert 'STAR GLOBAL' not in strip
  assert '2' in strip and '3' in strip
  cases.append({'app':path,'thresholds':[0,4,5,9,10],'perAppStars':True,'noMixedGold':True,'keywordAlias':True})
  c.close()
 # Build five perfect 8-question Cambridge rounds, one partial and duplicate records.
 rows=[]
 for run in range(6):
  for q in range(8 if run<5 else 7):
   rows.append({'id':f'{run}-{q}','exerciseId':'quiz-p1-paper:q'+str(q),'sessionId':f'run-{run}','part':1,'roundSize':8,'correct':1,'total':1,'items':[{'sourceKey':'q'+str(q),'correct':True}]})
 rows.append(dict(rows[0]))
 data={'attempts':rows}
 for width in [412,1280]:
  c=b.new_context(viewport={'width':width,'height':900})
  def route(r):
   url=r.request.url
   if 'adrian-sync.js' in url:return r.abort()
   if 'adrianxds-ads.github.io/' in url:
    path=url.split('adrianxds-ads.github.io/',1)[1].split('?',1)[0];f=root/path
    if f.is_file():return r.fulfill(path=str(f))
   return r.abort()
  c.route('https://**/*',route)
  c.add_init_script('(data=>{localStorage.setItem("cambridgeB2ExerciseStatsV3",JSON.stringify(data));localStorage.setItem("adrian_hub_stars_v1",JSON.stringify({version:2,apps:{english:4,"phrasal-verbs":4,cambridge:999},stars:201,totalGold:1007}));})('+json.dumps(data)+');')
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:18772/adrian-hub/index.html',wait_until='networkidle')
  assert page.locator('#hubStarCount').inner_text()=='1'
  assert page.locator('#hubStarCounter').inner_text().strip()=='★1' or page.locator('#hubStarCounter').inner_text().replace('\n','').strip()=='★1'
  assert page.locator('#hubStarCounter small').count()==0
  st=page.evaluate('readHubStars()');assert st['apps']['cambridge']==5 and st['stars']==1
  assert page.evaluate('AdrianGarden.starProgress().stars')==1
  counts=page.evaluate('AdrianAchievements.cambridgeMedalCounts()');assert counts=={'blue':0,'violet':0,'gold':5}
  assert page.evaluate('localStorage.getItem("cambridgeB2ExerciseStatsV3")')==json.dumps(data,separators=(',',':'))
  assert page.evaluate('localStorage.getItem("adrian_hub_stars_v1_before_rule_v3")') is not None
  if width==412:page.locator('.hero').screenshot(path='C:/Users/adria/agent-workbench/stars-compact-mobile.png')
  assert page.locator('#hubStarCounter').bounding_box()['width']<85
  assert not errors,errors
  cases.append({'width':width,'hubStars':1,'cambridgeGold':5,'partialExcluded':True,'duplicatesExcluded':True,'oldLedgerBackedUp':True,'gardenMatches':True})
  c.close()
 b.close()
srv.shutdown()
(root/'adrian-hub/tests/STAR_RULE_ACCEPTANCE_2026-10-08.json').write_text(json.dumps(cases,indent=2)+'\n',encoding='utf-8',newline='\n')
print('PASS: per-app thresholds, mixed gold blocked, local medals/stars, Key Word alias, Cambridge full rounds, duplicate/partial exclusion, compact Hub and garden')
