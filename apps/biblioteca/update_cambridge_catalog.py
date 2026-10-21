"""Sync metadata ONLY from completed Cambridge B2 Google AI Studio audiobooks.
The MP3s and original Cambridge exam material remain PRIVATE in the user's Drive.
Usage (Windows):
 python apps/biblioteca/update_cambridge_catalog.py --source "PATH_TO_AUDIOBOOK_FOLDER"
No audio, exam text, question, solution or private Drive URL is published.
"""
from pathlib import Path
import argparse,hashlib,json,re,datetime
HERE=Path(__file__).resolve().parent
DEST=HERE/'cambridge-exams.json'
FINAL=re.compile(r'^(?:01_EXAMEN01_PARTES1-4_CONTINUO_FOLA|EX(\d{2})_PARTES1-4_([A-Z]+)_CONTINUO)\.mp3$',re.I)
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for data in iter(lambda:f.read(1<<20),b''):h.update(data)
 return h.hexdigest()
def each_exam(root):
 first=root/'01_EXAMEN01_PARTES1-4_CONTINUO_FOLA.mp3'
 if first.exists():yield 1,first,'Fola'
 for folder in sorted(root.glob('EXAMEN[0-9][0-9]')):
  manifest=folder/'production.json'
  if not manifest.is_file():continue
  m=json.loads(manifest.read_text(encoding='utf-8-sig'))
  if m.get('status') not in ('COMPLETE_ASR_VERIFIED_PENDING_HUMAN_LISTENING','COMPLETE_ASR_VERIFIED'):continue
  name=m.get('finished_audio')
  if not isinstance(name,str) or not FINAL.fullmatch(name):continue
  match=FINAL.fullmatch(name)
  n=int(match.group(1))
  if n!=int(folder.name[-2:]):raise ValueError('Finished audio wrong exam: '+name)
  path=folder/name
  if not path.is_file():raise ValueError('Manifest claims finished but MP3 is missing: '+str(path))
  yield n,path,str(m.get('voice') or match.group(2)).capitalize()
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--source',required=True,type=Path,help='Private synced Cambridge B2 Audiobook folder')
 ap.add_argument('--dry-run',action='store_true')
 a=ap.parse_args()
 if not a.source.is_dir():ap.error('Source folder unavailable')
 old=json.loads(DEST.read_text(encoding='utf-8')) if DEST.exists() else {'episodes':[]}
 prev={x['number']:x for x in old.get('episodes',[])}
 new=[]
 for number,file,voice in each_exam(a.source):
  if number>30:continue
  data=file.stat()
  if data.st_size<10000:raise ValueError('MP3 suspiciously short: '+str(file))
  current=prev.get(number,{})
  seconds=round(data.st_size/16000) # All existing TTS MP3s use verified CBR 128 kbps.
  duration=f'{seconds//60}:{seconds%60:02d}'
  new.append({'number':number,'title':f'Cambridge B2 First · Examen {number:02}',
    'source':'Audiolibro Cambridge B2 · Proyecto privado',
    'dateRaw':current.get('dateRaw') or datetime.date.today().isoformat(),
    'duration':duration,'audio':'','fileName':file.name,
    'audioSha256':digest(file),'audioBytes':data.st_size,
    'summary':f'Reading and Use of English · Partes 1–4 · Voz {voice}. Audio original de nuestra producción en Google AI Studio.',
    'level':'B2','voice':voice})
 new.sort(key=lambda x:x['number'])
 assert new and len(new)==len({x['number'] for x in new})
 # Do not silently remove previously released entries from the catalog.
 missing=set(prev)-{x['number'] for x in new}
 if missing:raise ValueError('Previously catalogued exams missing in source: '+str(sorted(missing)))
 result={'source':'Producción personal Cambridge B2 (archivos privados de Google Drive)',
  'title':'Cambridge B2 · Audiolibros de exámenes',
  'artwork':'../../icon.svg','count':len(new),'episodes':new}
 output=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
 if a.dry_run:print('DRY_RUN',len(new),'exams',[(x['number'],x['voice']) for x in new]);return
 if not DEST.exists() or DEST.read_text(encoding='utf-8')!=output:
  DEST.write_text(output,encoding='utf-8')
 assert json.loads(DEST.read_text(encoding='utf-8'))==result
 print('METADATA_UPDATED',len(new),'COMPLETED_EXAMS; ALL_AUDIO_REMAINS_PRIVATE')
if __name__=='__main__':main()
