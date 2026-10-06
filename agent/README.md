# Local Audit Agent

This is the first local agent for the Adrián Hub ecosystem.

## Current safety mode
- Read-only over the isolated `C:\Users\adria\agent-workbench` worktree.
- No code-writing tool exists in this version.
- OpenRouter credentials can be read from Windows Credential Manager (`AdrianHubAgent/openrouter`); environment variables remain supported as overrides.
- The agent never reads plaintext credential files.
- No API call is made when the required environment variable is absent.
- Default spend ceiling: USD 0.50 per run.
- Reports are written only to `agent/runs/`, which is git-ignored.

## Providers and models
- Default: OpenRouter + `anthropic/claude-sonnet-5.5` via local alias `openrouter-claude-sonnet-5-5`.
- Premium OpenRouter override: `anthropic/claude-opus-5.5` via `openrouter-claude-opus-5-5`.
- Direct Anthropic remains available: `claude-sonnet-5-5`, `claude-opus-5-5`.
- Direct OpenAI remains available: `gpt-6-sol`.

OpenRouter endpoint: `https://openrouter.ai/api/v1`.

## Safe OpenRouter launch
Use `run-openrouter.ps1`. It prompts for the API key with hidden input, places it only in the current process environment, runs the audit, then deletes the environment variable.

Examples:
- `powershell -ExecutionPolicy Bypass -File .\run-openrouter.ps1 -DryRun`
- `powershell -ExecutionPolicy Bypass -File .\run-openrouter.ps1`
- `powershell -ExecutionPolicy Bypass -File .\run-openrouter.ps1 -Model openrouter-claude-opus-5-5`
- `powershell -ExecutionPolicy Bypass -File .\run-openrouter.ps1 -Mission "Audit only Pizarras session completion"`

Do not paste API keys into chat, source files, Git, `.env` files, or documentation.

## Other useful commands
- `python agent.py doctor`
- `python agent.py inventory`
- `python agent.py audit --dry-run`
- `python agent.py audit --model openrouter-claude-sonnet-5-5 --dry-run`
- `python agent.py audit --model openrouter-claude-opus-5-5 --dry-run`

The agent can autonomously request `list`, `read`, `search`, and `git_status` operations. The local harness validates every requested path and refuses anything outside the isolated workbench. A later phase may add write/test tools behind explicit approval; they do not exist yet.
