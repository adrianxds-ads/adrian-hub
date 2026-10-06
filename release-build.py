"""Generate reproducible release cache IDs and Version Center fingerprints. No consumer apply or deployment."""
from pathlib import Path
import hashlib,json,re,subprocess,argparse
from urllib.parse import urlparse,unquote
parser=argparse.ArgumentParser();parser.add_argument('--hub-version');args=parser.parse_args()
hub=Path(__file__).parent;w=hub.parent
names=['adrian-hub','adaptive-english','adaptive-exam','adaptive-hoti0108','adaptive-phrasal-verbs','adaptive-pizarras','adaptive-verbs-catala','b2-multiple-choice-cloze']
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if args.hub_version:
 p=hub/'app.js';s=p.read_text(encoding='utf-8-sig');old=re.search(r"HUB_VERSION='([^']+)'",s).group(1);s=s.replace("HUB_VERSION='"+old+"'","HUB_VERSION='"+args.hub_version+"'");s=re.sub(r"HUB_BUILD='[^']+'","HUB_BUILD='hub-"+args.hub_version+"-20261006'",s);p.write_text(s,encoding='utf-8')
 p=hub/'index.html';p.write_text(p.read_text(encoding='utf-8-sig').replace(old,args.hub_version),encoding='utf-8')
node="""const fs=require('fs'),vm=require('vm');const ctx={self:{AdrianRelease:{build:'test'},addEventListener(){}},importScripts(){}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),ctx);console.log(JSON.stringify(vm.runInContext("typeof ASSETS!=='undefined'?ASSETS:SHELL",ctx)));"""
builds={}
for name in names:
 repo=w/name;(repo/'sw-integrity.js').write_bytes((w/'adrian-core/components/sw-integrity.js').read_bytes())
 urls=json.loads(subprocess.check_output(['node','-e',node,str(repo/'service-worker.js')],text=True))
 # Include concrete CSS/JS loaded by entry pages, preserving query strings.
 for index in repo.rglob('index.html'):
  if any(p in index.parts for p in ['.git','node_modules']):continue
  text=index.read_text(encoding='utf-8-sig')
  for url in re.findall(r'(?:src|href)=["\']([^"\']+)["\']',text):
   parsed=urlparse(url)
   if parsed.netloc and parsed.netloc!='adrianxds-ads.github.io':continue
   if Path(parsed.path).suffix.lower() not in ['.js','.css','.svg','.webmanifest']:continue
   if parsed.netloc or parsed.path.startswith('/'):candidate=parsed.path+('?' + parsed.query if parsed.query else '')
   else:
    relative=index.parent.relative_to(repo)/parsed.path
    candidate='./'+str(relative).replace('\\','/')+('?' + parsed.query if parsed.query else '')
   urls.append(candidate)
 urls+=['./service-worker.js','./sw-integrity.js']
 assets={}
 for url in sorted(set(urls)):
  clean=unquote(urlparse(url).path)
  if clean.endswith('/') or clean in ['.','./']:clean=clean.rstrip('/')+'/index.html'
  file=(w/clean.lstrip('/')) if clean.startswith('/') else (repo/clean)
  if file.name in ['build-assets.js','versions.json','apps.json']:continue
  if not file.is_file():raise RuntimeError('Missing release asset: '+name+' '+url)
  pathname='/'+str(file.resolve().relative_to(w.resolve())).replace('\\','/')
  assets[pathname]=digest(file)
 build=hashlib.sha256(json.dumps(assets,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16]
 payload={'schema':1,'build':build,'assets':assets}
 (repo/'build-assets.js').write_text('self.AdrianRelease='+json.dumps(payload,sort_keys=True,separators=(',',':'))+';\n',encoding='utf-8')
 builds[name]=build
x=json.loads((hub/'versions.json').read_text(encoding='utf-8-sig'))
s=(hub/'app.js').read_text(encoding='utf-8');x['hub']['version']=re.search(r"HUB_VERSION='([^']+)'",s).group(1);x['hub']['build']=re.search(r"HUB_BUILD='([^']+)'",s).group(1);x['hub']['cacheBuild']=builds['adrian-hub']
registry=json.loads((hub/'apps.json').read_text(encoding='utf-8'));registry['hubVersion']=x['hub']['version'];byid={a['id']:a for a in registry['apps']}
for a in [x['hub']]+x['apps']:
 if a['id']=='hub':files=[('app.js',hub/'app.js'),('version-verifier.js',hub/'version-verifier.js'),('index.html',hub/'index.html'),('styles.css',hub/'styles.css'),('service-worker.js',hub/'service-worker.js'),('build-assets.js',hub/'build-assets.js')]
 elif a['kind']=='public':
  base=byid[a['id']]['url'];repo=w/base.rstrip('/').split('/')[-1];s=(repo/'app.js').read_text(encoding='utf-8-sig');a['version']=re.search(r"const APP_VERSION\s*=\s*['\"]([^'\"]+)",s).group(1);files=[(base+f,repo/f) for f in ['app.js','index.html','service-worker.js','build-assets.js']]
  a['cacheBuild']=builds[repo.name];a['sourceCommit']=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip();a['sourceDirty']=bool(subprocess.check_output(['git','-C',str(repo),'status','--porcelain'],text=True).strip())
 elif a['kind']=='bundled':
  base=byid[a['id']]['url'];repo=hub/base.removeprefix('./');files=[(base+f,repo/f) for f in ['index.html','app.js','styles.css'] if (repo/f).exists()]
 else:continue
 a['verify']={'files':[{'url':url,'sha256':digest(p)} for url,p in files]}
 if a['id']!='hub':a['build']='sha256-'+hashlib.sha256(''.join(f['sha256'] for f in a['verify']['files']).encode()).hexdigest()[:12]
(hub/'versions.json').write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(hub/'apps.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Generated verified release assets for '+str(len(names))+' repositories')