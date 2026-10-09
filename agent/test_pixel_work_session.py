import importlib.util,json,time,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument("--bridge",required=True);a=p.parse_args()
spec=importlib.util.spec_from_file_location("bridge",a.bridge);b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
spec2=importlib.util.spec_from_file_location("pixel_work",Path(__file__).with_name("pixel_work_session.py"));m=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(m)
target=b.serial();baseline=b.adb("shell","settings","get","system","screen_off_timeout")
assert baseline=="60000",baseline
print(m.renew(b.ADB,target,5,True),flush=True)
during=m.status(b.ADB,target)
assert "held=true" in during,during
print("PASS temporary screen protection acquired; timeout setting unchanged",flush=True)
time.sleep(8)
after=m.status(b.ADB,target)
assert "held=true" not in after,after
assert b.adb("shell","settings","get","system","screen_off_timeout")==baseline
print("PASS device-side expiry released protection without PC heartbeat; normal timeout still 60000",flush=True)
print(m.renew(b.ADB,target,20,True),flush=True)
m.renew(b.ADB,target,20,True)
renewed=m.status(b.ADB,target);assert "refCount=1" in renewed,renewed
print("PASS repeated renewal does not accumulate wake locks",flush=True)
print(m.release(b.ADB,target),flush=True)
assert "held=true" not in m.status(b.ADB,target)
# Actual hooked UI read starts the standard ten-minute lease.
b.adb("shell","screencap","-p","/sdcard/nexo-screen-guard-test.png")
assert "held=true" in m.status(b.ADB,target)
print("PASS bridge UI operation activates lease automatically",flush=True)
m.release(b.ADB,target)
assert b.adb("shell","settings","get","global","stay_on_while_plugged_in")=="0"
assert b.adb("shell","settings","get","secure","lock_screen_lock_after_timeout")=="30000"
print("PASS charging/security settings unchanged, final protection released",flush=True)
