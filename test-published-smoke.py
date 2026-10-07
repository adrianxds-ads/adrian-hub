"""Check actual published resources in fresh Chrome contexts. Sync calls are simulated to protect real progress."""
from pathlib import Path
import json,urllib.request
from playwright.sync_api import sync_playwright
hub=Path(__file__).parent
version=json.loads((hub/'versions.json').read_text(encoding='utf-8'))['hub']['version']
sync_stub="""(()=>{const native=window.fetch.bind(window);window.fetch=(input,opts)=>{const u=String(input?.url||input);if(u.includes('adrin.tail8fd071.ts.net'))return Promise.resolve(new Response(JSON.stringify({ok:true,entries:{},revision:0,accepted:0,acceptedKeys:[]}),{status:200,headers:{'Content-Type':'application/json'}}));return native(input,opts);};})();"""
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 c=b.new_context(service_workers='allow');c.add_init_script(sync_stub);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('https://adrianxds-ads.github.io/adrian-hub/?acceptance='+version,wait_until='domcontentloaded')
 page.locator('[data-version-id="hub"]').wait_for();assert page.locator('#hubVersionLabel').inner_text()=='Hub v'+version
 assert page.evaluate("async()=>{const r=await Promise.all(orderedVersionEntries().filter(e=>['public','bundled'].includes(e.kind)||e.id==='hub').map(verifyEntry));return r.every(x=>x.ok)}")
 assert page.evaluate("window.AdrianSync.version")=='1.0.6'
 worker=page.evaluate("async()=>{const r=await navigator.serviceWorker.ready,sw=r.active;if(sw.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('activation timeout')),15000);const done=()=>{if(sw.state==='activated'){clearTimeout(timer);resolve();}else if(sw.state==='redundant'){clearTimeout(timer);reject(Error('redundant worker'));}};sw.addEventListener('statechange',done);done();});return sw.state}")
 assert worker=='activated',worker
 page.locator('[data-version-id="hub"]').click();assert page.locator('#versionDialog').is_visible();page.locator('#versionDialogClose').click()
 assert not errors,errors;c.close()
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,service_workers='allow');c.add_init_script(sync_stub);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('https://adrianxds-ads.github.io/adaptive-exam/?acceptance=1.2.9',wait_until='domcontentloaded')
 assert page.evaluate('APP_VERSION')=='1.2.9'
 page.locator('#partList .part-card').nth(3).click();page.locator('#exerciseList button').first.click();page.locator('#paperHost input[data-n]').first.tap();page.locator('.ad-keyboard.open').wait_for()
 page.locator('.cambridge-next').click();page.wait_for_timeout(350);page.locator('.ad-keyboard [data-char="A"]').first.tap();page.wait_for_timeout(250)
 field=page.locator('#paperHost input[data-n]:focus');assert field.input_value().endswith('A')
 rect=field.bounding_box();kb=page.locator('.ad-keyboard').bounding_box();assert rect['y']+rect['height']<=kb['y']-10
 assert page.evaluate("document.body.classList.contains('cambridge-writing')")
 page.locator('[data-action="close"]').click();assert page.locator('.ad-keyboard').is_hidden()
 worker=page.evaluate("async()=>{const r=await navigator.serviceWorker.ready,sw=r.active;if(sw.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('activation timeout')),15000);const done=()=>{if(sw.state==='activated'){clearTimeout(timer);resolve();}else if(sw.state==='redundant'){clearTimeout(timer);reject(Error('redundant worker'));}};sw.addEventListener('statechange',done);done();});return sw.state}");assert worker=='activated'
 assert not errors,errors;c.close();b.close()
health=json.load(urllib.request.urlopen('http://127.0.0.1:8788/health',timeout=5));assert health['version']=='1.0.6'
print('PASS ACTUAL PUBLICATION: Hub '+version+', real public/bundled evidence, Sync 1.0.6, actual Hub/Cambridge SW activation, Cambridge 1.2.9 context/focus/typing. Fresh isolated stores; no writes to real sync service.')