"""Fail-closed private UI reads; no real phone operations."""
import argparse,importlib.util
from types import SimpleNamespace
from unittest.mock import patch
p=argparse.ArgumentParser();p.add_argument("--bridge",required=True);a=p.parse_args()
spec=importlib.util.spec_from_file_location("bridge",a.bridge);b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
b.PIXEL_SCREEN_MODULE=SimpleNamespace(ui_operation=lambda args:False)
calls=[]
def fake(args,**kwargs):
 calls.append((args,kwargs["timeout"]))
 if "uiautomator" in args:return SimpleNamespace(returncode=0,stdout="UI hierarchy dumped",stderr="")
 return SimpleNamespace(returncode=0,stdout="",stderr="")
with patch.object(b,"serial",return_value="test-pixel"),patch.object(b.subprocess,"run",side_effect=fake):
 b.adb("shell","uiautomator","dump","/sdcard/nexo-fresh-test.xml")
 assert len(calls)==3
 assert calls[0][0][-3:]==["rm","-f","/sdcard/nexo-fresh-test.xml"]
 assert calls[1][1]==25 and calls[0][1]==8 and calls[2][1]==8
 assert calls[2][0][-3:]==["test","-s","/sdcard/nexo-fresh-test.xml"]
 print("PASS stale XML removed, bounded UI timeout, new nonempty XML required")
def idle_error(args,**kwargs):
 if "uiautomator" in args:return SimpleNamespace(returncode=0,stdout="",stderr="ERROR: could not get idle state")
 return SimpleNamespace(returncode=0,stdout="",stderr="")
with patch.object(b,"serial",return_value="test-pixel"),patch.object(b.subprocess,"run",side_effect=idle_error):
 try:b.adb("shell","uiautomator","dump","/sdcard/nexo-fresh-test.xml")
 except RuntimeError:pass
 else:raise AssertionError("Return-code-zero UI error accepted")
 print("PASS UI errors rejected even when Android returns exit code zero")
def no_file(args,**kwargs):
 return SimpleNamespace(returncode=1 if "test" in args else 0,stdout="",stderr="missing XML" if "test" in args else "")
with patch.object(b,"serial",return_value="test-pixel"),patch.object(b.subprocess,"run",side_effect=no_file):
 try:b.adb("shell","uiautomator","dump","/sdcard/nexo-fresh-test.xml")
 except RuntimeError:pass
 else:raise AssertionError("Missing new XML accepted")
 print("PASS missing fresh XML blocks further use")
