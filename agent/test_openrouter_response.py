"""Offline regression: final text, token metadata and fail-fast empty response."""
import sys,types,importlib.util,argparse,tempfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
spec=importlib.util.spec_from_file_location("response_test_agent",HERE/"agent.py")
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
calls=[];mode={"empty":False}
def create(**kw):
 calls.append(kw)
 usage=types.SimpleNamespace(prompt_tokens=12,completion_tokens=100,completion_tokens_details=types.SimpleNamespace(reasoning_tokens=96),cost=.002)
 msg=types.SimpleNamespace(content="" if mode["empty"] else '{"action":"report","content":"OK"}')
 return types.SimpleNamespace(id="test-generation",choices=[types.SimpleNamespace(message=msg,finish_reason="length" if mode["empty"] else "stop")],usage=usage)
class FakeClient:
 def __init__(self,**kw):
  assert kw["max_retries"]==0
  self.chat=types.SimpleNamespace(completions=types.SimpleNamespace(create=create))
sys.modules["openai"]=types.SimpleNamespace(OpenAI=FakeClient)
a.provider_api_key=lambda _: "test-not-a-real-key"
text,u=a.call_openrouter([],"Test","anthropic/claude-opus-5.5",1000)
assert text and u["finish_reason"]=="stop" and u["cost_usd"]==.002
assert calls[-1]["extra_body"]=={"reasoning":{"effort":"low"}}
mode["empty"]=True
try:a.call_openrouter([],"Test","anthropic/claude-opus-5.5",1000)
except a.ProviderResponseError as e:
 assert e.details["finish_reason"]=="length" and e.details["reasoning_tokens"]==96
else:raise AssertionError("Empty response was accepted")
with tempfile.TemporaryDirectory() as tmp:
 a.RUNS_DIR=Path(tmp);a.bootstrap_context=lambda cfg:"test";a.required_key_present=lambda _:True
 cfg={"default_model":"opus","models":{"opus":{"provider":"openrouter","api_model":"anthropic/claude-opus-5.5","input_usd_per_million":4,"output_usd_per_million":20}},"max_output_tokens_per_turn":1000,"max_usd_per_run":.35,"max_turns":10}
 before=len(calls)
 assert a.audit(argparse.Namespace(model=None,mission="Test",dry_run=False),cfg)==6
 assert len(calls)==before+1
 assert not list(Path(tmp).glob("*-audit.md"))
 assert "provider_empty_response" in next(Path(tmp).glob("*transcript.jsonl")).read_text()
print("PASS: final text, actual cost, reasoning diagnostics; empty response stops after one call")
