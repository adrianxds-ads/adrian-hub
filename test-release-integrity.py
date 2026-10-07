"""Fail when build-assets.js does not match the canonical files that GitHub Pages serves."""
from pathlib import Path
import hashlib,json,sys
ROOT=Path(__file__).resolve().parent
WORKSPACE=ROOT.parent
TEXT_EXT={'.js','.cjs','.html','.css','.json','.webmanifest','.svg','.py','.md','.txt'}

def digest(path):
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
    path=WORKSPACE/rel
    if not path.is_file():
        errors.append(f'MISSING {pathname}')
        continue
    got=digest(path);checked+=1
    if got!=expected:
        errors.append(f'MISMATCH {pathname} expected={expected} actual={got}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'PASS release integrity: {checked} assets match canonical fingerprints')
