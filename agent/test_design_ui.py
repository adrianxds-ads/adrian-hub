from pathlib import Path
import argparse,subprocess,re,json,threading,http.server,functools
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--root',required=True);a=p.parse_args();root=Path(a.root)
def original(name):
 r=subprocess.run(['git','-C',str(root),'show','HEAD:'+name],capture_output=True)
 return r.stdout.decode('utf-8-sig') if r.returncode==0 else ''
before=original('index.html');after=(root/'index.html').read_text(encoding='utf-8-sig')
scripts=lambda s:re.findall(r'<script\b[^>]*>[\s\S]*?</script>',s,re.I)
assert scripts(before)==scripts(after),'Inline scripts must remain unchanged'
changed=subprocess.run(['git','-C',str(root),'diff','--name-only'],capture_output=True,text=True).stdout.splitlines()
assert set(changed)<= {'index.html','styles.css','README.md'},changed
for name in ['app.js','service-worker.js','manifest.webmanifest']:
 if (root/name).exists():assert (root/name).read_bytes().replace(bytes([13,10]),bytes([10]))==subprocess.run(['git','-C',str(root),'show','HEAD:'+name],capture_output=True).stdout.replace(bytes([13,10]),bytes([10])),'Protected file: '+name
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
out=root.parent/'design-repair-evidence'/root.name;out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome')
 for width in [360,390,1280]:
  page=browser.new_page(viewport={'width':width,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:'+str(server.server_port)+'/index.html',wait_until='domcontentloaded',timeout=45000)
  page.wait_for_timeout(700)
  metrics=page.evaluate("""() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('button,a')].filter(e=>e.getBoundingClientRect().width>0).length,text:document.body.innerText.length})""")
  assert metrics['text']>30,metrics
  assert metrics['scroll']<=width+2,metrics
  assert not errors,errors
  page.evaluate("localStorage.setItem('design-regression-preserve',JSON.stringify({sessions:353,stars:4739,garden:8}))")
  page.reload(wait_until='domcontentloaded')
  assert page.evaluate("localStorage.getItem('design-regression-preserve')")== '{"sessions":353,"stars":4739,"garden":8}'
  page.screenshot(path=str(out/(str(width)+'.png')),full_page=True)
  results.append(metrics);page.close()
 browser.close()
server.shutdown()
(out/'test.json').write_text(json.dumps(results),encoding='utf-8')
print(json.dumps({'ok':True,'protected_logic':'unchanged','viewports':results,'storage_sentinel':'persists; real user sync not tested'}))
