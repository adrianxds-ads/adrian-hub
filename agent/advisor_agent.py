"""El Consejero v0.1: local zero-AI observer and rule engine."""
from __future__ import annotations
import argparse,json,sqlite3,re,sys,time,unicodedata
from datetime import datetime,timedelta,timezone
from pathlib import Path

HERE=Path(__file__).resolve().parent
RULES=json.loads((HERE/"advisor_rules.json").read_text(encoding="utf-8"))
DEFAULT_DB=Path(r"C:\Users\adria\Android-DC\advisor_state.sqlite3")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

SCHEMA="""
create table if not exists events(
 id integer primary key autoincrement,
 source text not null,
 external_id text,
 sender text,
 title text,
 body text,
 happened_at integer not null,
 received_at integer not null,
 useful integer,
 payload text,
 unique(source, external_id)
);
create table if not exists findings(
 id integer primary key autoincrement,
 event_id integer,
 kind text not null,
 confidence real not null,
 status text not null default 'new',
 summary text not null,
 details text,
 created_at integer not null,
 foreign key(event_id) references events(id)
);
create table if not exists source_state(
 source text primary key,
 connected integer not null default 0,
 method text,
 last_check integer,
 last_event integer,
 note text
);
create index if not exists idx_events_source_time on events(source,happened_at);
create index if not exists idx_findings_kind_status on findings(kind,status);
"""

def norm(s):
    s=unicodedata.normalize("NFD",str(s or "").casefold())
    return "".join(c for c in s if unicodedata.category(c)!="Mn")

def now(): return int(time.time())
def db(path):
    p=Path(path);p.parent.mkdir(parents=True,exist_ok=True)
    c=sqlite3.connect(p);c.row_factory=sqlite3.Row;c.executescript(SCHEMA)
    for source,note in [
        ("gmail","Esperando autorización local de Google; el motor ya acepta eventos."),
        ("calendar","Esperando autorización local de Google Calendar."),
        ("plaud","Esperando un adaptador local/connector para nuevas grabaciones.")
    ]:
        c.execute("insert or ignore into source_state(source,connected,method,note) values(?,0,'pending',?)",(source,note))
    c.commit();return c

def has(text,terms): 
    n=norm(text)
    return [t for t in terms if norm(t) in n]

def parse_datetime(text):
    # Deliberately conservative: explicit numeric date + clock time only.
    n=str(text or "")
    pats=[
      r"(?P<d>\d{1,2})[/-](?P<m>\d{1,2})[/-](?P<y>20\d{2})[^\d]{0,25}(?P<h>\d{1,2})[:.](?P<min>\d{2})",
      r"(?P<y>20\d{2})[/-](?P<m>\d{1,2})[/-](?P<d>\d{1,2})[^\d]{0,25}(?P<h>\d{1,2})[:.](?P<min>\d{2})"
    ]
    for p in pats:
        m=re.search(p,n)
        if m:
            try:
                dt=datetime(int(m["y"]),int(m["m"]),int(m["d"]),int(m["h"]),int(m["min"]))
                return dt.isoformat(timespec="minutes")
            except ValueError: pass
    return None

def add_finding(c,event_id,kind,confidence,summary,details):
    c.execute("insert into findings(event_id,kind,confidence,summary,details,created_at) values(?,?,?,?,?,?)",
              (event_id,kind,float(confidence),summary,json.dumps(details,ensure_ascii=False),now()))

def classify(c,event_id,event):
    source=event["source"];title=event.get("title","");body=event.get("body","");sender=event.get("sender","")
    whole=" ".join([title,body,sender])
    made=[]
    if source=="gmail":
        job=has(whole,RULES["job_terms"])
        if job:
            conf=min(.98,.72+.04*len(job))
            add_finding(c,event_id,"job",conf,"Correo laboral relevante",{"signals":job,"sender":sender,"title":title})
            made.append("job")
        cal=has(whole,RULES["calendar_terms"]);dt=parse_datetime(whole)
        if cal and dt:
            conf=min(.98,.80+.03*len(cal))
            add_finding(c,event_id,"calendar_candidate",conf,"Posible evento para Calendar",
                        {"signals":cal,"start":dt,"sender":sender,"title":title,"auto_create":False})
            made.append("calendar_candidate")
        noise=has(whole,RULES["noise_terms"])
        if noise:
            add_finding(c,event_id,"noise_signal",min(.95,.6+.05*len(noise)),
                        "Correo posiblemente prescindible",{"signals":noise,"sender":sender,"title":title})
            made.append("noise_signal")
    elif source=="plaud":
        acts=has(whole,RULES["plaud_action_terms"]);dt=parse_datetime(whole)
        if acts:
            add_finding(c,event_id,"action_candidate",min(.9,.62+.04*len(acts)),
                        "Posible acción detectada en Plaud",{"signals":acts,"title":title})
            made.append("action_candidate")
        if dt and has(whole,RULES["calendar_terms"]):
            add_finding(c,event_id,"calendar_candidate",.86,"Posible cita detectada en Plaud",
                        {"start":dt,"title":title,"auto_create":False})
            made.append("calendar_candidate")
    elif source=="calendar":
        # Calendar is primarily context: observing it costs no AI.
        add_finding(c,event_id,"calendar_observed",1.0,"Evento de Calendar observado",
                    {"title":title,"happened_at":event.get("happened_at")})
        made.append("calendar_observed")
    return made

def ingest(c,event):
    source=str(event.get("source") or "").strip().lower()
    if source not in ("gmail","calendar","plaud"): raise ValueError("source debe ser gmail, calendar o plaud")
    external_id=str(event.get("external_id") or "").strip() or None
    ts=int(event.get("happened_at") or now())
    payload=json.dumps(event,ensure_ascii=False)
    try:
        cur=c.execute("""insert into events(source,external_id,sender,title,body,happened_at,received_at,useful,payload)
            values(?,?,?,?,?,?,?,?,?)""",(source,external_id,event.get("sender",""),event.get("title",""),
            event.get("body",""),ts,now(),event.get("useful"),payload))
        event_id=cur.lastrowid
    except sqlite3.IntegrityError:
        row=c.execute("select id from events where source=? and external_id=?",(source,external_id)).fetchone()
        return {"ok":True,"duplicate":True,"event_id":row["id"],"findings":[]}
    made=classify(c,event_id,{**event,"source":source})
    c.execute("update source_state set last_event=?,last_check=? where source=?",(ts,now(),source))
    c.commit()
    return {"ok":True,"duplicate":False,"event_id":event_id,"findings":made}

def tick(c):
    t=now();created=0
    window=t-int(RULES["cleanup_window_days"])*86400
    threshold=int(RULES["cleanup_threshold"])
    rows=c.execute("""select lower(trim(sender)) sender,count(*) n,max(happened_at) last_at
        from events where source='gmail' and happened_at>=? and trim(sender)<>'' group by lower(trim(sender))
        having count(*)>=?""",(window,threshold)).fetchall()
    for r in rows:
        exists=c.execute("""select 1 from findings where kind='cleanup_candidate' and status in ('new','accepted')
            and json_extract(details,'$.sender')=? and created_at>=? limit 1""",(r["sender"],window)).fetchone()
        if exists: continue
        # require at least one newsletter/noise signal for this sender
        noisy=c.execute("""select 1 from findings f join events e on e.id=f.event_id
            where f.kind='noise_signal' and lower(trim(e.sender))=? and e.happened_at>=? limit 1""",(r["sender"],window)).fetchone()
        if noisy:
            add_finding(c,None,"cleanup_candidate",.85,
                        f"Remitente repetitivo: {r['sender']}",
                        {"sender":r["sender"],"messages":r["n"],"window_days":RULES["cleanup_window_days"],
                         "action":"review_only","destructive":False})
            created+=1
    for s in ("gmail","calendar","plaud"):
        c.execute("update source_state set last_check=coalesce(last_check,?) where source=?",(t,s))
    c.commit()
    return {"ok":True,"created":created,"checked_at":t,"ai_cost_usd":0.0}

def source_payload(row):
    return {"source":row["source"],"connected":bool(row["connected"]),"method":row["method"],
            "last_check":row["last_check"],"last_event":row["last_event"],"note":row["note"]}

def status(c):
    sources=[source_payload(r) for r in c.execute("select * from source_state order by source")]
    counts={r["kind"]:r["n"] for r in c.execute("select kind,count(*) n from findings where status='new' group by kind")}
    recent=[]
    for r in c.execute("select id,kind,confidence,summary,details,created_at from findings where status='new' order by id desc limit 8"):
        try:d=json.loads(r["details"] or "{}")
        except:d={}
        recent.append({"id":r["id"],"kind":r["kind"],"confidence":r["confidence"],"summary":r["summary"],
                       "details":d,"created_at":r["created_at"]})
    return {"ok":True,"version":RULES["version"],"engine":"ready","ai_cost_usd":0.0,
            "events":c.execute("select count(*) from events").fetchone()[0],
            "findings":sum(counts.values()),"counts":counts,"sources":sources,"recent":recent,
            "policy":RULES["policies"]}

def set_source(c,source,connected,method,note=""):
    if source not in ("gmail","calendar","plaud"): raise ValueError("source inválida")
    c.execute("update source_state set connected=?,method=?,note=?,last_check=? where source=?",
              (1 if connected else 0,method,note,now(),source));c.commit()
    return status(c)

def main():
    p=argparse.ArgumentParser();p.add_argument("--db",default=str(DEFAULT_DB))
    sub=p.add_subparsers(dest="cmd",required=True)
    s=sub.add_parser("ingest");s.add_argument("--json",required=True)
    sub.add_parser("tick");sub.add_parser("status")
    s=sub.add_parser("source");s.add_argument("source");s.add_argument("--connected",action="store_true");s.add_argument("--method",default="manual");s.add_argument("--note",default="")
    a=p.parse_args();c=db(a.db)
    try:
        if a.cmd=="ingest": out=ingest(c,json.loads(a.json))
        elif a.cmd=="tick": out=tick(c)
        elif a.cmd=="source": out=set_source(c,a.source,a.connected,a.method,a.note)
        else: out=status(c)
        print(json.dumps(out,ensure_ascii=False))
    finally:c.close()

if __name__=="__main__": main()
