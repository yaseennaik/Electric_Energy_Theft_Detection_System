# VoltGuard one-command launcher (Windows PowerShell) — Django + DRF edition
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

Write-Host 'Applying database migrations...' -ForegroundColor Cyan
& $python manage.py migrate --noinput
& $python manage.py seed_demo

Write-Host ''
Write-Host '  VoltGuard is starting at http://localhost:8000' -ForegroundColor Green
Write-Host '  Browsable API:     http://localhost:8000/api/health' -ForegroundColor DarkGray
Write-Host '  Demo:              demo@voltguard.io / demo1234' -ForegroundColor DarkGray
Write-Host ''

& $python manage.py runserver 127.0.0.1:8000
