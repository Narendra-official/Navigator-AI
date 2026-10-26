# OpenSource Navigator AI - Launch Services (Windows PowerShell)
$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    OpenSource Navigator AI - Launching Services          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend FastAPI
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$BackendPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $BackendPython)) {
    Write-Host "Error: Virtual environment not found. Please run .\scripts\setup.ps1 first." -ForegroundColor Red
    exit 1
}

$backendProcess = Start-Process -FilePath $BackendPython `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" `
    -WorkingDirectory $BackendDir `
    -PassThru

$backendPid = $backendProcess.Id
Write-Host "  Backend started (PID: $backendPid)" -ForegroundColor Green

# 2. Start Frontend Next.js
Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
$nextBuildDir = Join-Path $FrontendDir ".next"
$npmScript = if (Test-Path $nextBuildDir) { "start" } else { "dev" }
$frontendProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", $npmScript `
    -WorkingDirectory $FrontendDir `
    -PassThru

$frontendPid = $frontendProcess.Id
Write-Host "  Frontend started (PID: $frontendPid)" -ForegroundColor Green

# Save PIDs to a temporary file for stop.ps1
$pidFile = Join-Path $ProjectRoot "scripts\.running_pids"
Set-Content -Path $pidFile -Value "$backendPid`n$frontendPid"

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Services are live!                                       " -ForegroundColor Green
Write-Host "  - Frontend UI:    http://localhost:3000                 " -ForegroundColor White
Write-Host "  - Backend API:    http://localhost:8000                 " -ForegroundColor White
Write-Host "  - API Swagger:    http://localhost:8000/docs            " -ForegroundColor White
Write-Host "  To stop services, run '.\scripts\stop.ps1'               " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
