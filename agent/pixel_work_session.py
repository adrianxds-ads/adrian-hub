"""Temporary Pixel screen lease for actual UI work; does not change lock settings."""
import argparse, subprocess, threading, time, tempfile
from pathlib import Path
REMOTE="/data/local/tmp/nexo-screen-guard.sh"
LEASE_SECONDS=600
_lock=threading.Lock()
_last={}
_installed=set()

def ui_operation(args):
 args=tuple(map(str,args))
 if len(args)>=2 and args[0]=="shell":
  if args[1] in ("input","uiautomator","screencap","monkey"):return True
  if args[1]=="am" and len(args)>=3 and args[2] in ("start","start-activity","startservice"):return True
 return bool(len(args)>=2 and args[:2]==("exec-out","screencap"))

def _run(adb,serial,*args):
 result=subprocess.run([str(adb),"-s",str(serial),*map(str,args)],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=8)
 if result.returncode:raise RuntimeError((result.stderr or result.stdout or "Pixel screen lease failed")[-1800:])
 return result.stdout.strip()

def renew(adb,serial,seconds=LEASE_SECONDS,force=False):
 key=(str(adb),str(serial))
 with _lock:
  if not force and time.monotonic()-_last.get(key,0)<15:return
  if key not in _installed:
   with tempfile.TemporaryDirectory() as tmp:
    script=Path(tmp)/"pixel_screen_guard.sh"
    script.write_bytes(Path(__file__).with_name("pixel_screen_guard.sh").read_bytes().replace(b"\r\n",b"\n"))
    _run(adb,serial,"push",script,REMOTE)
   _installed.add(key)
  result=_run(adb,serial,"shell","sh",REMOTE,"renew",int(seconds))
  if not result.startswith("ACTIVE"):raise RuntimeError("Pixel lease not acknowledged")
  _last[key]=time.monotonic()
  return result

def release(adb,serial):
 with _lock:
  _last.pop((str(adb),str(serial)),None)
  return _run(adb,serial,"shell","sh",REMOTE,"release")

def status(adb,serial):
 return _run(adb,serial,"shell","sh",REMOTE,"status")

if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("--adb",required=True);p.add_argument("--serial",required=True)
 p.add_argument("action",choices=("renew","release","status"));p.add_argument("--seconds",type=int,default=LEASE_SECONDS)
 a=p.parse_args()
 print(renew(a.adb,a.serial,a.seconds,True) if a.action=="renew" else release(a.adb,a.serial) if a.action=="release" else status(a.adb,a.serial))
