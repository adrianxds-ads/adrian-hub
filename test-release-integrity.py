"""Fail when build-assets.js does not match the canonical files that GitHub Pages serves."""
from pathlib import Path
import hashlib,json,sys,requests
ROOT=Path(__file__).resolve().parent
WORKSPACE=ROOT.parent
TEXT_EXT={'.js','.cjs','.html','.css','.json','.webmanifest','.svg','.py','.md','.txt'}

def published_core(path):
    try:
        rel=path.resolve().relative_to(WORKSPACE.resolve()).as_posix()
        return rel if rel.startswith('adrian-core/') else None
    except ValueError:return None

def digest(path):
    rel=published_core(path)
    if rel:
        response=requests.get('https://adrianxds-ads.github.io/'+rel,timeout=30)
        response.raise_for_status()
        b=response.content
        if not b or b'<!DOCTYPE html' in b[:100]:
            raise ValueError('Published core not found: '+rel)
    else:
        b=path.read_bytes()
    if path.suffix.lower() in TEXT_EXT:
        b=b.replace(b'\r\n',b'\n')
    return hashlib.sha256(b).hexdigest()

raw=(ROOT/'build-assets.js').read_text(encoding='utf-8-sig').strip()
payload=json.loads(raw.removeprefix('self.AdrianRelease=').removesuffix(';'))
errors=[]
checked=0
for pathname,expected in payload.get('assets',{}).items():
    rel=pathname.lstrip('/')
    path=(ROOT/rel.removeprefix('adrian-hub/')) if rel.startswith('adrian-hub/') else WORKSPACE/rel
    if not path.is_file() and not published_core(path):
        errors.append(f'MISSING {pathname}')
        continue
    got=digest(path);checked+=1
    if got!=expected:
        errors.append(f'MISMATCH {pathname} expected={expected} actual={got}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'PASS release integrity: {checked} assets match canonical fingerprints')
