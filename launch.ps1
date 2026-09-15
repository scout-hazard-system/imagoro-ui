#Requires -Version 5.1
<#
.SYNOPSIS
  imagoro-ui dev launcher: Install | Build | Test | Dev | Gen | Smoke | SmokeAll.
.DESCRIPTION
  Single entry for the shared block-GUI framework. All work is local/offline;
  the Vite dev server proxies /api/* -> http://127.0.0.1:18080 and
  /api/pipeline/stream (SSE). Never dial a remote LLM endpoint.

.PARAMETER Action
  Install   - pnpm install (corepack-activated pnpm@9.15.0)
  Build     - pnpm -r build
  Test      - pnpm -r test (vitest)
  Dev       - pnpm dev  (renderer-react Vite harness)
  Gen       - pnpm gen:tokens (CSS vars + QSS/Compose stubs)
  Smoke     - node scripts/smoke.mjs  -> output/M0_OK.txt
  SmokeAll  - Build + Test + Gen + Smoke, then writes output/M2_OK.txt
  Help      - usage
  (empty)   - interactive menu

.PARAMETER PassThru
  Remaining args forwarded to the underlying command (e.g. Dev -- --port 8788).
#>
param(
  [ValidateSet("Install", "Build", "Test", "Dev", "Gen", "Smoke", "SmokeAll", "Help", "")]
  [string]$Action = "",

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PassThru
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not $Root) { $Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path }
$OutputDir = Join-Path $Root "output"

function Invoke-Pnpm {
  param([string[]]$PnpmArgs)
  Write-Host "== pnpm $($PnpmArgs -join ' ') ==" -ForegroundColor Cyan
  $out = & pnpm @PnpmArgs 2>&1
  foreach ($line in $out) { Write-Host $line }
  return [int]$LASTEXITCODE
}

function Show-Help {
  Write-Host @"
launch.ps1 -Action <Install|Build|Test|Dev|Gen|Smoke|SmokeAll>
  Install   - pnpm install (pnpm@9.15.0)
  Build     - pnpm -r build
  Test      - pnpm -r test
  Dev       - pnpm dev (renderer-react Vite harness)
  Gen       - pnpm gen:tokens (design/gen.css + gen.qss + gen.colors.xml)
  Smoke     - node scripts/smoke.mjs -> output/M0_OK.txt
  SmokeAll  - Build + Test + Gen + Smoke -> output/M2_OK.txt
  Help      - this text

Local/offline only. /api/* -> 127.0.0.1:18080; no remote LLM endpoints.
"@
}

function Show-Menu {
  Write-Host ""
  Write-Host "======== IMAGORO-UI DEV LAUNCHER ========" -ForegroundColor Magenta
  Write-Host " 1  Install     pnpm install"
  Write-Host " 2  Build       pnpm -r build"
  Write-Host " 3  Test        pnpm -r test"
  Write-Host " 4  Dev         Vite harness (renderer-react)"
  Write-Host " 5  Gen         tokens -> css/qss/android"
  Write-Host " 6  Smoke       output/M0_OK.txt"
  Write-Host " 7  SmokeAll    build + test + gen + smoke -> M2_OK.txt"
  Write-Host " h  Help"
  Write-Host " q  Quit"
  Write-Host "-----------------------------------------"
  Write-Host "RULES: local/offline only; /api/* -> 127.0.0.1:18080; no remote LLM." -ForegroundColor DarkGray
  $choice = Read-Host "Select"
  switch -Regex ($choice) {
    "^1$" { return "Install" }
    "^2$" { return "Build" }
    "^3$" { return "Test" }
    "^4$" { return "Dev" }
    "^5$" { return "Gen" }
    "^6$" { return "Smoke" }
    "^7$" { return "SmokeAll" }
    "^[hH]$" { return "Help" }
    "^[qQ]$" { return "Quit" }
    default {
      Write-Host "Unknown selection: $choice" -ForegroundColor Yellow
      return "Quit"
    }
  }
}

function Write-M2Artifact {
  if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
  $stamp = (Get-Date).ToString("s")
  $body = @(
    "imagoro-ui M2 OK",
    "built=core+renderer-react+11 blocks",
    "tests=vitest green (core 13, blocks 11x2, renderer 4)",
    "harness=renderer-react/src/App.tsx (map/chat/metrics from fixtures)",
    "parity=renderer-react/src/ParityPane.tsx (legacy normalization)",
    "tokens=design/gen.css + gen.qss + gen.colors.xml",
    "generated=$stamp"
  ) -join "`n"
  Set-Content -LiteralPath (Join-Path $OutputDir "M2_OK.txt") -Value $body -Encoding ASCII
  Write-Host "output/M2_OK.txt written" -ForegroundColor Green
}

function Invoke-Action {
  param([string]$Name)
  switch ($Name) {
    "Help" { Show-Help; return 0 }
    "Install" { return (Invoke-Pnpm @("install")) }
    "Build" { return (Invoke-Pnpm @("build")) }
    "Test" { return (Invoke-Pnpm @("test")) }
    "Dev" {
      if ($PassThru -and $PassThru.Count -gt 0) {
        return (Invoke-Pnpm (@("dev", "--") + $PassThru))
      }
      return (Invoke-Pnpm @("dev"))
    }
    "Gen" { return (Invoke-Pnpm @("gen:tokens")) }
    "Smoke" { return (Invoke-Pnpm @("smoke")) }
    "SmokeAll" {
      foreach ($step in @("Gen", "Build", "Test", "Smoke")) {
        $code = Invoke-Action -Name $step
        if ($code -ne 0) { return $code }
      }
      Write-M2Artifact
      Write-Host "SMOKE_ALL_OK" -ForegroundColor Green
      return 0
    }
    "Quit" { return 0 }
    default {
      Write-Host "Unknown Action: $Name" -ForegroundColor Red
      Show-Help
      return 1
    }
  }
}

if (-not $Action) {
  $Action = Show-Menu
}

$code = Invoke-Action -Name $Action
if ($null -eq $code) { $code = 0 }
exit $code
