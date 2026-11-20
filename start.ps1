# VoltGuard one-command launcher (Windows PowerShell)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
    Write-Host 'Creating virtual environment...' -ForegroundColor Cyan
    python -m venv --system-site-packages (Join-Path $root '.venv')
    & $python -m pip install -r (Join-Path $root 'requirements.txt')
}

if (-not (Test-Path (Join-Path $root 'frontend\dist\index.html'))) {
    Write-Host 'Building frontend...' -ForegroundColor Cyan
    Push-Location (Join-Path $root 'frontend')
    npm install
    npm run build
    Pop-Location
}

Write-Host ''
Write-Host '  VoltGuard is starting at http://localhost:8000' -ForegroundColor Green
Write-Host '  API docs:          http://localhost:8000/docs' -ForegroundColor DarkGray
Write-Host '  Demo:              demo@voltguard.io / demo1234' -ForegroundColor DarkGray
Write-Host ''

& $python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
