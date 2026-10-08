# Local Audit Agent

This is the first local agent for the AdriÃ¡n Hub ecosystem.

## Núcleo · autodiagnóstico ChatGPT/Codex (08/10/2026)
- Motor: `agent/nucleo_agent.py`, solo lectura y sin uso de API de pago.
- Nexo reúne el autodiagnóstico de Núcleo y el triaje en una sola tarjeta del Centro de Agentes 1.0.0. Los identificadores internos se conservan por compatibilidad. Conversación mediante el acceso existente a ChatGPT y copia manual de la misión.
- Endpoint privado de DC Inbox: `GET /dc-inbox/agents/nucleo/status`; no existe operación POST.
- Verifica archivos de instrucciones, contrato y formación; memoria, plan, modelos y gastos privados quedan **no verificables** hasta consultarlos en fuentes autorizadas.
- Comprobación inicial: 3 aspectos confirmados, 4 desconocidos; coste 0 USD y ningún ajuste automático.
- Pruebas: `python agent/test_nucleo_agent.py`, `python agent/test_nucleo_bridge.py`, `python agent/test_triage_agent.py`.
- Siguiente fase: ampliar las fuentes verificables autorizadas y permitir solamente mejoras reversibles sujetas a aprobación cuando corresponda.

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


## Design repair agent (nine study apps)

The separate design_repair_agent.py supports the eight external study apps and Biblioteca in allowlisted direct agent-workbench checkouts named design-repair-<repository>. Only index.html, styles.css and README.md are writable. Storage, scoring, data, inline scripts, music, rewards and cache code remain protected by test_design_ui.py. Every edit invalidates the last passing test; a report requires a successful trusted test. The original Keyboard Speak repair agent remains available.

Example: python agent/design_repair_agent.py --root C:/Users/adria/agent-workbench/design-repair-adaptive-english --test-script C:/Users/adria/adrian-hub/agent/test_design_ui.py --mission-file C:/Users/adria/agent-workbench/design-mission-adaptive-english.txt --max-usd 0.65 --max-turns 5

Reports never publish changes. Review diffs, increment app versions, rebuild cache fingerprints and verify deployed bytes separately. Chrome headless viewports do not verify a physical Pixel keyboard, microphone or audio.
