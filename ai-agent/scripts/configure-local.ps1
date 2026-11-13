$ErrorActionPreference = 'Stop'

$backendEnv = Join-Path $PSScriptRoot '../../be/soes-be/.env'
$agentEnv = Join-Path $PSScriptRoot '../.env'
if (-not (Test-Path -LiteralPath $backendEnv)) {
  throw 'Backend .env is missing.'
}

function Get-EnvValue([string[]] $lines, [string] $name) {
  $prefix = "$name="
  foreach ($line in $lines) {
    if ($line.StartsWith($prefix)) {
      return $line.Substring($prefix.Length)
    }
  }
  return ''
}

function Set-EnvValue([string[]] $lines, [string] $name, [string] $value) {
  $prefix = "$name="
  return @($lines | Where-Object { $null -ne $_ -and -not $_.StartsWith($prefix) }) + @("$name=$value")
}

$backendLines = [System.IO.File]::ReadAllLines($backendEnv)
$geminiKey = Get-EnvValue $backendLines 'GEMINI_API_KEY'
if ([string]::IsNullOrWhiteSpace($geminiKey) -or $geminiKey -eq 'your_gemini_api_key') {
  throw 'Set GEMINI_API_KEY in be/soes-be/.env before configuring the agent.'
}

$secret = Get-EnvValue $backendLines 'AI_AGENT_SHARED_SECRET'
if ([string]::IsNullOrWhiteSpace($secret) -or $secret -eq 'replace_with_random_secret') {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
}

$backendLines = Set-EnvValue $backendLines 'AI_AGENT_ENABLED' 'true'
$backendLines = Set-EnvValue $backendLines 'AI_AGENT_URL' 'http://127.0.0.1:8001'
$backendLines = Set-EnvValue $backendLines 'AI_AGENT_SHARED_SECRET' $secret

$agentLines = if (Test-Path -LiteralPath $agentEnv) { [System.IO.File]::ReadAllLines($agentEnv) } else { @() }
$agentLines = Set-EnvValue $agentLines 'GEMINI_API_KEY' $geminiKey
$agentLines = Set-EnvValue $agentLines 'AI_AGENT_SHARED_SECRET' $secret
if (-not (Get-EnvValue $agentLines 'AI_AGENT_MODEL')) {
  $backendModel = Get-EnvValue $backendLines 'GEMINI_MODEL'
  if (-not $backendModel) { $backendModel = 'gemini-3.1-flash-lite' }
  $agentLines = Set-EnvValue $agentLines 'AI_AGENT_MODEL' $backendModel
}

$encoding = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($backendEnv, $backendLines, $encoding)
[System.IO.File]::WriteAllLines($agentEnv, $agentLines, $encoding)
Write-Output 'Local AI agent configuration saved. Restart the backend after starting the agent.'
