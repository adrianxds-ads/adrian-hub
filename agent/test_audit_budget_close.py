"""Verify a budget-limited investigation closes with a report without exceeding its cap."""
import importlib.util,argparse,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('audit_budget',Path(__file__).with_name('agent.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as tmp:
 m.RUNS_DIR=Path(tmp);m.bootstrap_context=lambda cfg:'verified test context'
 m.required_key_present=lambda provider:True
 m.estimated_call_ceiling=lambda messages,system,tokens,model:0.20 if tokens>1000 else 0.05
 calls=[]
 def model(messages,system,name,tokens,cfg):
  calls.append(tokens)
  if len(calls)==1:return '{"action":"read","path":"adrian-hub/README.md"}',{'input_tokens':1,'output_tokens':1}
  assert tokens==1000
  assert 'BUDGET FINALIZATION' in messages[-1]['content']
  return '{"action":"report","content":"Observed evidence; remaining checks pending."}',{'input_tokens':1,'output_tokens':1}
 m.call_model=model;m.token_cost=lambda usage,cfg:0.18 if len(calls)==1 else 0.04
 m.run_tool=lambda action,cfg:'observed test evidence'
 cfg={'default_model':'test','models':{'test':{'provider':'test'}},'max_output_tokens_per_turn':4000,'max_usd_per_run':0.35,'max_turns':10,'force_report_turn':7}
 result=m.audit(argparse.Namespace(model=None,mission='Test',dry_run=False),cfg)
 assert result==0 and calls==[4000,1000]
 assert len(list(Path(tmp).glob('*-audit.md')))==1
 print('PASS budget closes with report: $0.22 <= $0.35; no extra investigation')
