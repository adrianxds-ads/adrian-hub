"""Build one private ZIP_STORED Cambridge audiobook import pack; never commit its audio.
Usage: python apps/biblioteca/create_cambridge_zip.py [1 2 3 4]
The output lives in the existing private Google Drive audiobooks folder.
"""
from pathlib import Path
from hashlib import sha256
import json, sys, zipfile
BASE=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'
CAT=Path(__file__).with_name('cambridge-exams.json')
catalog=json.loads(CAT.read_text(encoding='utf-8'))['episodes']
wanted={int(s) for s in sys.argv[1:]} if len(sys.argv)>1 else {x['number'] for x in catalog}
rows=[x for x in catalog if x['number'] in wanted]
if len(rows)!=len(wanted) or not rows:
 raise SystemExit('Only completed, catalogued Cambridge exam numbers may enter a package.')
if not BASE.is_dir(): raise SystemExit('Private Drive folder unavailable: '+str(BASE))
verified=[]
for x in rows:
 found=list(BASE.rglob(x['fileName']))
 if len(found)!=1:raise SystemExit('Expected exactly one original MP3: '+x['fileName'])
 p=found[0]
 h=sha256()
 with p.open('rb') as input:
  while chunk:=input.read(2*1024*1024):h.update(chunk)
 if p.stat().st_size!=x['audioBytes'] or h.hexdigest()!=x['audioSha256']:
  raise SystemExit('Size/SHA-256 mismatch (refusing package): '+str(p))
 verified.append((x,p))
numbers='-'.join(f"{x['number']:02d}" for x,p in verified)
output=BASE/f"Cambridge_B2_Audiolibros_{numbers}.zip"
temporary=output.with_suffix('.zip.tmp')
try:
 with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_STORED,allowZip64=False) as z:
  for x,p in verified:z.write(p,arcname=x['fileName'],compress_type=zipfile.ZIP_STORED)
 with zipfile.ZipFile(temporary) as z:
  if z.namelist()!=[x['fileName'] for x,p in verified]:raise ValueError('ZIP entries mismatch')
  if any(x.compress_type!=zipfile.ZIP_STORED for x in z.infolist()):raise ValueError('Unexpected ZIP compression')
 temporary.replace(output)
except Exception:
 temporary.unlink(missing_ok=True)
 raise
print('PRIVATE_ZIP_READY',output)
print('EXAMS',','.join(str(x['number']) for x,p in verified))
print('BYTES',output.stat().st_size)
