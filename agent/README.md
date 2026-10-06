# Local Audit Agent

This is the first local agent for the Adrián Hub ecosystem.

## Current safety mode
- Read-only over the isolated `C:\Users\adria\agent-workbench` worktree.
- No code-writing tool exists in this version.
- API credentials are accepted only through standard process environment variables.
- The agent never reads local credential files.
- No API call is made when the required environment variable is absent.
- Default spend ceiling: USD 0.50 per run.
- Reports are written only to `agent/runs/`, which is git-ignored.

## Models configured
- Default: `claude-sonnet-5-5` through Anthropic.
- Premium override: `claude-opus-5-5`.
- Alternative provider: `gpt-6-sol` through OpenAI Responses API.

## Before enabling paid API access
Set the chosen API key as a Windows user/process environment variable outside this repository: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Do not paste the key into chat or store it inside the workbench.

## Useful commands
- `python agent.py doctor`
- `python agent.py inventory`
- `python agent.py audit --dry-run`
- `python agent.py audit`
- `python agent.py audit --model claude-opus-5-5`
- `python agent.py audit --model gpt-6-sol`
- `python agent.py audit --mission "Audit only Pizarras session completion"`

The agent can autonomously request `list`, `read`, `search`, and `git_status` operations. The local harness validates every requested path and refuses anything outside the isolated workbench. A later phase may add write/test tools behind explicit approval; they do not exist yet.
