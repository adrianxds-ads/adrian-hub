"""Register only fully recorded and hash-verified Cambridge audiobook MP3s.
Usage: python apps/biblioteca/register_cambridge_exam.py 05 [06 ...]
Separate the private audio from the public metadata; never copy the MP3 to Git.
"""
from pathlib import Path
import sys, json, hashlib, datetime, os, tempfile
PRIVATE=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'
CATALOG=Path(__file__).with_name('cambridge-exams.json')
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def add(exam,rows):
 n=int(exam)
 if n<5 or n>30:raise ValueError('Only unregistered exams 05–30 can be added')
 folder=PRIVATE/f'EXAMEN{n:02}'
 manifest=json.loads((folder/'production.json').read_text(encoding='utf-8-sig'))
 if manifest.get('status')!='COMPLETE_ASR_VERIFIED_PENDING_HUMAN_LISTENING':
  raise ValueError(f'EXAMEN{n:02} not audio-complete; do not register')
 fragments=manifest['fragments']
 if len(fragments)<12 or any(x.get('status')!='ASR_VERIFIED' for x in fragments):
  raise ValueError('Unverified TTS segments')
 if sorted({x['part'] for x in fragments})!=[1,2,3,4]:
  raise ValueError('Missing Reading and Use of English part')
 for part in fragments:
  wav=folder/part['audio']
  if not wav.is_file() or sha(wav)!=part['audio_sha256']:
   raise ValueError(f'Invalid ASR audio: {wav}')
 audio=folder/manifest['finished_audio']
 if not audio.is_file() or not audio.name.lower().endswith('.mp3'):
  raise ValueError('Final MP3 missing')
 digest=sha(audio)
 if digest!=manifest['finished_sha256']:raise ValueError('Final MP3 SHA-256 mismatch')
 seconds=float(manifest['duration_seconds'])
 if not 300<=seconds<=3600:raise ValueError('Final duration suspicious')
 duration=f"{int(seconds//60):02d}:{int(round(seconds%60)):02d}"
 existing=next((x for x in rows if x['number']==n),None)
 if existing:
  if existing['audioSha256']!=digest or existing['audioBytes']!=audio.stat().st_size:
   raise ValueError('Registered exam differs; refusing overwrite')
  print('ALREADY_REGISTERED',n,duration,flush=True);return
 entry={'number':n,'title':f'Cambridge B2 First · Examen {n:02d}',
  'source':'Audiolibro Cambridge B2 · Proyecto privado',
  'dateRaw':datetime.date.today().isoformat(),'duration':duration,
  'audio':'','fileName':audio.name,'audioSha256':digest,'audioBytes':audio.stat().st_size,
  'summary':f'Reading and Use of English · Partes 1–4 · Voz {manifest["voice"]}. Audio original de nuestra producción en Google AI Studio.',
  'level':'B2','voice':manifest['voice']}
 rows.append(entry)
 print('REGISTERED',n,audio.name,duration,audio.stat().st_size,flush=True)
def main():
 ids=sys.argv[1:]
 if not ids:raise SystemExit('Supply completed exam numbers')
 if len(set(ids))!=len(ids):raise SystemExit('Duplicate number')
 data=json.loads(CATALOG.read_text(encoding='utf-8-sig'))
 rows=data['episodes']
 if [x['number'] for x in rows]!=sorted(x['number'] for x in rows):raise ValueError('Original catalogue not sorted')
 for n in ids:add(n,rows)
 rows.sort(key=lambda x:x['number'])
 data['count']=len(rows)
 encoded=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 if encoded==CATALOG.read_text(encoding='utf-8-sig'):
  print('CATALOG_UNCHANGED',flush=True);return
 target=CATALOG.with_suffix('.json.tmp')
 target.write_text(encoded,encoding='utf-8')
 if json.loads(target.read_text(encoding='utf-8'))['count']!=len(rows):raise ValueError('Invalid staged catalog')
 os.replace(target,CATALOG)
 print('CATALOG_UPDATED',len(rows),flush=True)
if __name__=='__main__':main()
