from pathlib import Path
import json,subprocess,hashlib
w=Path(__file__).parent.parent;core=w/'adrian-core'
config=json.loads((core/'consumers.json').read_text(encoding='utf-8-sig'))
assert config['workspaceOnly']
for c in config['consumers']:
 repo=(core/c['path']).resolve();assert repo.parent==w.resolve() and (repo/'.git').is_file(),repo
 assert subprocess.check_output(['git','-C',str(repo),'branch','--show-current'],text=True).strip().startswith('agent-workbench-')
 for f in ['hub-path-game.js','adrian-achievements.js']:
  assert (repo/f).read_bytes()==(core/'components'/f).read_bytes(),str(repo/f)
 for p in repo.rglob('*.html'):
  s=p.read_text(encoding='utf-8-sig')
  assert 'hub-nav.js?v=6' not in s,str(p)
  if 'adrian-sync.js' in s:assert 'adrian-sync.js?v=1.0.5-20261007' in s,str(p)
catalog=json.loads((w/'adrian-hub/versions.json').read_text(encoding='utf-8-sig'))
for e in [catalog['hub']]+catalog['apps']:
 for f in e.get('verify',{}).get('files',[]):
  from urllib.parse import urlparse
  file=w/urlparse(f['url']).path.lstrip('/') if f['url'].startswith('https:') else w/'adrian-hub'/f['url']
  repo=next(r for r in [w/n for n in [q.name for q in w.iterdir() if q.is_dir()]] if r==file or r in file.parents)
  rel=str(file.relative_to(repo))
  filtered=subprocess.check_output(['git','-C',str(repo),'hash-object','--path='+rel,str(file)],text=True).strip()
  raw=subprocess.check_output(['git','-C',str(repo),'hash-object','--no-filters',str(file)],text=True).strip()
  assert filtered==raw,'Build fingerprint differs from Git-served bytes: '+str(file)
print('PASS Core consumers: isolated paths/branches, synchronized fallback copies, active sync/nav pins and canonical Git-served fingerprints')
