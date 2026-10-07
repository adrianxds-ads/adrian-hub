# Local Audit Agent

This is the first local agent for the Adrián Hub ecosystem.

## Current safety mode
- Read-only over the isolated `C:\Users\adria\agent-workbench` worktree.
- No code-writing tool exists in this version.
- OpenRouter credentials can be read from Windows Credential Manager (`AdrianHubAgent/openrouter`); environment variables remain supported as overrides.
- The agent never reads plaintext credential files.
- No API call is made when the required environment variable is absent.
- Default spend ceiling: USD 0.35 per run.
- Reports are written only to `agent/runs/`, which is git-ignored.
- Finalization reserves recovery turns, enforces a compact report size, and saves a recovered partial report if a provider truncates the final JSON.

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

## Scoped Claude repair agent

Explicit repair authorization enables `repair_agent.py` in an isolated Git checkout.
This keeps the original audit-only agent unchanged. The repair agent can read and edit only
app.js, index.html, manifest.webmanifest, service-worker.js and README.md.
It offers no arbitrary shell, deployment, credential, question-bank or progress-state tool.

The caller supplies a trusted regression script via --test-script. The model can invoke
that script through action=test but cannot edit it. Reports and transcripts remain in runs/.
The provider credential is resolved by the existing credential-manager helper.
Default model: openrouter-claude-opus-5-5. Default estimated spend guard: USD 1.65.
This is a ceiling for one run, separate from the OpenRouter key's account ceiling.

Example:
python repair_agent.py --root C:\Users\adria\agent-workbench\keyboard-speak-audit-20261007 --test-script C:\Users\adria\agent-workbench\test-keyboard-opus-repair.py --mission-file C:\Users\adria\agent-workbench\keyboard-opus-mission.txt

After the run, independently review Git diff and rerun tests. Commit only the requested
changes and verify the published build separately. Simulated viewports do not establish
that a physical Android keyboard or microphone has passed testing.
