"""Responsive and zoom geometry, with synthetic browser storage only."""
from pathlib import Path
exec((Path(__file__).with_name('test_quiz_ergonomics.py')).read_text(encoding='utf-8').split('with sync_playwright()')[0])
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);out=[]
 for name in (sys.argv[1:] or names):
  c=b.new_context(viewport={'width':390,'height':844},service_workers='block',has_touch=True,is_mobile=True);c.route('**/*',serve);p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto('https://adrianxds-ads.github.io/'+name+'/');ready(p,name);p.locator('#quickBtn' if name=='adaptive-pizarras' else '#startBtn').click();p.wait_for_selector('#gameScreen:not(.hidden)');reveal(p,name)
  p.evaluate('clearInterval(timerHandle);timerHandle=null')
  for width in [360,390,412,768,1280]:
   for zoom in [100,160]:
    p.set_viewport_size({'width':width,'height':915});p.evaluate('(z)=>document.documentElement.style.fontSize=(16*z/100)+"px"',zoom);p.wait_for_timeout(250)
    got=p.evaluate("""()=>{const host=document.querySelector('#answers'),buttons=[...host.querySelectorAll(':scope>button.answer')],rects=buttons.map(x=>x.getBoundingClientRect());return {width:innerWidth,scroll:document.documentElement.scrollWidth,display:getComputedStyle(host).display,timerCount:[...document.querySelectorAll('.timer-footer,.integrated-timer,.focus-native-timer')].filter(x=>x.getBoundingClientRect().height&&getComputedStyle(x).display!=='none').length,aligned:rects.every(r=>Math.abs(r.x-rects[0].x)<1&&Math.abs(r.width-rects[0].width)<1),rows:rects.every((r,i)=>!i||r.y>=rects[i-1].bottom),touch:Math.min(...rects.map(r=>r.height)),text:buttons.map(x=>getComputedStyle(x.querySelector('.option-label')).fontSize),label:document.querySelector('#qe-counter').textContent}}""")
    assert got['scroll']<=width and got['display']=='flex' and got['aligned'] and got['rows'] and got['timerCount']==1 and got['touch']>=56,(name,width,zoom,got)
    if width==390 and zoom==100:p.screenshot(path=str(root/(name+'-ergonomic-final.png')),full_page=True)
    out.append({'app':name,'width':width,'zoom':zoom,**got})
  assert not errors,(name,errors);print('PASS VISUAL',name,'5 widths × 2 font scales',flush=True);c.close()
 b.close()
(root/'ergonomics-visual-results.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
