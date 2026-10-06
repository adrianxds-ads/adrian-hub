param(
  [string]$Model = 'openrouter-claude-sonnet-5-5',
  [string]$Mission = '',
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$agentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $agentDir
try {
  if ($DryRun) {
    python .\agent.py audit --dry-run --model $Model
    exit $LASTEXITCODE
  }
  $secure = Read-Host 'OpenRouter API key (hidden; not saved)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $env:OPENROUTER_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $argsList = @('.\agent.py','audit','--model',$Model)
    if ($Mission) { $argsList += @('--mission',$Mission) }
    python @argsList
    exit $LASTEXITCODE
  }
  finally {
    Remove-Item Env:OPENROUTER_API_KEY -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}
finally {
  Pop-Location
}
