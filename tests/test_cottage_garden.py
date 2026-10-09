from pathlib import Path
from playwright.sync_api import sync_playwright
base='http://127.0.0.1:19543/'
with sync_playwright() as p:
 b=p.chromium.launch(channel='msedge',headless=True)
 for width,height in [(360,800),(412,915),(915,412),(1280,800)]:
  ctx=b.new_context(viewport={'width':width,'height':height})
  page=ctx.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'apps/biblioteca/',wait_until='networkidle')
  page.wait_for_function("window.CottageGarden && document.querySelector('#taskGarden .cottage-house')")
  assert page.evaluate('CottageGarden.progress().completedBlocks')==0
  assert page.evaluate("""CottageGarden.completed([
   {id:'a',status:'completado'},{id:'a',status:'completado'},
   {id:'b',status:'interrumpido'},{id:'c',status:'escuchado'},
   {id:'a',libraryId:'six-minute-english',status:'completado'}
  ])""")==2
  # Deterministic prefixes: every block adds exactly one plant detail.
  for n in [0,1,2,19,20,21,4999,5000]:
   result=page.evaluate("""n=>{
    const host=document.createElement('div');host.innerHTML=CottageGarden.markup(n);
    return {details:[...host.querySelectorAll('[data-cottage-plant]')].reduce((s,e)=>s+e.children.length,0),
     plants:host.querySelectorAll('[data-cottage-plant]').length,house:host.querySelectorAll('.cottage-house').length};
   }""",n)
   assert result=={'details':n,'plants':(n+19)//20,'house':1},result
  page.evaluate("""()=>{
   const rows=[{id:'one',status:'completado',episodeNumber:233},{id:'one',status:'completado',episodeNumber:233},
    {id:'two',status:'completado',episodeNumber:233},{id:'cancel',status:'interrumpido'}];
   localStorage.setItem('adrianEasyCatalanTaskSessionsV1',JSON.stringify(rows));
   localStorage.setItem('adrianEasyCatalan20261009ReconciliationV1',JSON.stringify({skipped:'no-preexisting-data'}));
   window.dispatchEvent(new Event('podcast-task-history-updated'));
   document.getElementById('taskStage').hidden=false;
  }""")
  page.wait_for_function("document.querySelector('#taskGarden .cottage-garden')?.dataset.steps==='2'")
  assert page.locator('#taskGarden .cottage-house').count()==1
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.screenshot(path=str(Path(__file__).parent/('cottage-'+str(width)+'.png')))
  before=page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")
  page.reload(wait_until='networkidle')
  assert page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==before
  assert page.evaluate('CottageGarden.progress().completedBlocks')==2
  page.goto(base,wait_until='networkidle')
  page.wait_for_function("document.querySelector('#githubGarden .cottage-garden')?.dataset.steps==='2'")
  assert '2 bloques' in page.locator('#gardenTaskMedals').inner_text()
  assert page.locator('#githubGarden .gg-plant').count()==9
  assert not errors,errors
  print('PASS cottage',width,'dedup, growth prefix, reload, shared Hub, preserved trees and history')
  ctx.close()
 b.close()
