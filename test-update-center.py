from pathlib import Path
import json
w=Path(__file__).parent.parent
expectedHub='Hub v'+json.loads((w/'adrian-hub/versions.json').read_text(encoding='utf-8'))['hub']['version']
source=Path(__file__).parent/'test-mobile.py';scope={'__file__':str(source)}
exec(source.read_text(encoding='utf-8').split('with sync_playwright() as p:')[0],scope)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);c=b.new_context(service_workers='block');c.route('**/*',scope['serve']);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('https://adrianxds-ads.github.io/adrian-hub/',wait_until='domcontentloaded');page.locator('[data-version-id="hub"]').wait_for()
 assert page.locator('#hubVersionLabel').inner_text()==expectedHub
 assert page.evaluate("async()=>{const r=await Promise.all(orderedVersionEntries().filter(e=>['public','bundled'].includes(e.kind)||e.id==='hub').map(verifyEntry));return r.every(x=>x.ok)}")
 page.locator('[data-version-id="hub"]').click();assert page.locator('#versionDialog').is_visible();page.locator('#versionDialogClose').click()
 page.evaluate("""async()=>{
  window.fixtureEntry=orderedVersionEntries().find(e=>e.kind==='public');
  window.fixtureCache=fixtureEntry.cachePrefixes[0]+'legacy-test';
  const c=await caches.open(fixtureCache);await c.put(fixtureEntry.verify.files.find(f=>f.url.endsWith('/app.js')).url,new Response('older build'));
  localStorage.setItem('fixture-progress','preserved');
  Object.defineProperty(navigator,'serviceWorker',{value:{async register(url){if(String(url).includes('adaptive-pizarras'))throw Error('synthetic install failure');return{waiting:{state:'installed'},async update(){}};}}});
 }""")
 page.evaluate("async()=>await updateOneApp(fixtureEntry,'test')")
 assert page.evaluate("async()=>await caches.has(fixtureCache)")
 assert page.evaluate("localStorage.getItem('fixture-progress')")=='preserved'
 assert page.evaluate("async()=>{const r=await verifyEntry(fixtureEntry);return r.pending===true}")
 page.evaluate("async()=>await updateAllVersions()")
 result=page.evaluate("JSON.parse(localStorage.getItem(UPDATE_STATE_KEY))")
 assert result['failed']==1 and result['updated']==7,result
 assert page.evaluate("async()=>await caches.has(fixtureCache)")
 assert page.evaluate("localStorage.getItem('fixture-progress')")=='preserved'
 assert 'parcial' in page.locator('#updateHeadline').inner_text().lower()
 assert not errors,errors
 page.reload(wait_until='domcontentloaded');page.locator('[data-version-id="hub"]').wait_for();assert page.locator('#hubVersionLabel').inner_text()==expectedHub
 c.close();b.close()
print('PASS candidate Hub: runtime and SHA evidence, dialog/reload, update preparation preserves old offline cache and progress, stale cache flagged, failed install counted truthfully')
