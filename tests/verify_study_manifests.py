"""Required release gate: reject stale study asset digests and Hub version records."""
from pathlib import Path
import subprocess,json,hashlib,sys
root=Path(__file__).resolve().parents[2]
ids={'adaptive-english':'english','b2-multiple-choice-cloze':'b2-cloze','adaptive-verbs-catala':'catala','adaptive-phrasal-verbs':'phrasal-verbs'}
hub=json.loads((root/'adrian-hub/versions.json').read_text(encoding='utf-8-sig'))
records={a.get('id'):a for a in hub.get('apps',[])}
fail=[];total=0
for name,app_id in ids.items():
 repo=root/name
 blob=(repo/'build-assets.js').read_text(encoding='utf-8-sig').removeprefix('self.AdrianRelease=').strip().rstrip(';')
 release=json.loads(blob)
 for url,expected in release['assets'].items():
  parts=url.lstrip('/').split('/')
  try:raw=subprocess.check_output(['git','show','HEAD:'+'/'.join(parts[1:])],cwd=root/parts[0],stderr=subprocess.DEVNULL)
  except Exception:fail.append(name+' missing '+url);continue
  total+=1
  if hashlib.sha256(raw).hexdigest()!=expected:fail.append(name+' mismatch '+url)
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
 row=records.get(app_id,{})
 if row.get('sourceCommit')!=head:fail.append('Hub stale commit '+name)
 if row.get('cacheBuild')!=release.get('build'):fail.append('Hub stale build '+name)
 print('CHECK',name,len(release['assets']),release.get('build'))
print('VERIFIED',total,'FAILURES',len(fail))
for item in fail:print('FAIL',item)
sys.exit(bool(fail))
