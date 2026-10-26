# OpenSource Navigator AI - Setup Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    OpenSource Navigator AI - Environment Setup            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Write-Host "[+] Project Root: $ProjectRoot" -ForegroundColor Green

# 1. Check prerequisites
Write-Host "`n[1/7] Checking prerequisites..." -ForegroundColor Yellow

# Python check
try {
    $pythonVersion = python --version
    Write-Host "  ✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python is not installed or not in PATH. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}

# Node.js check
try {
    $nodeVersion = node -v
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js is not installed or not in PATH. Please install Node.js 18+." -ForegroundColor Red
    exit 1
}

# Git check
try {
    $gitVersion = git --version
    Write-Host "  ✓ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Git is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Ollama check
try {
    $ollamaVersion = ollama --version
    Write-Host "  ✓ Ollama: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "  ! Ollama CLI not detected. You can download Ollama from https://ollama.com" -ForegroundColor Yellow
}

# 2. Disk Space & Model Storage Information
Write-Host "`n[2/7] Checking disk space and Ollama model storage..." -ForegroundColor Yellow
Get-PSDrive C, D | Format-Table Name, @{Label="Free Space (GB)"; Expression={[math]::Round($_.Free/1GB, 2)}}, @{Label="Used Space (GB)"; Expression={[math]::Round($_.Used/1GB, 2)}}

$ollamaEnv = [System.Environment]::GetEnvironmentVariable('OLLAMA_MODELS', 'User')
if (-not $ollamaEnv) {
    Write-Host "  Note: Default Ollama model storage is located on drive C: (%USERPROFILE%\.ollama\models)." -ForegroundColor DarkYellow
    Write-Host "  Tip: If drive C: is low on storage, set OLLAMA_MODELS to 'D:\OllamaModels' to store weights on drive D:." -ForegroundColor DarkYellow
} else {
    Write-Host "  ✓ Custom OLLAMA_MODELS configured at: $ollamaEnv" -ForegroundColor Green
}

# 3. Backend Environment File
Write-Host "`n[3/7] Setting up backend environment configuration..." -ForegroundColor Yellow
$BackendEnv = Join-Path $ProjectRoot "backend\.env"
$BackendEnvExample = Join-Path $ProjectRoot "backend\.env.example"
if (-not (Test-Path $BackendEnv)) {
    if (Test-Path $BackendEnvExample) {
        Copy-Item $BackendEnvExample $BackendEnv
        Write-Host "  ✓ Created backend\.env from template" -ForegroundColor Green
    }
} else {
    Write-Host "  ✓ backend\.env already exists (preserving configuration)" -ForegroundColor Green
}

# 4. Frontend Environment File
Write-Host "`n[4/7] Setting up frontend environment configuration..." -ForegroundColor Yellow
$FrontendEnv = Join-Path $ProjectRoot "frontend\.env.local"
$FrontendEnvExample = Join-Path $ProjectRoot "frontend\.env.local.example"
if (-not (Test-Path $FrontendEnv)) {
    if (Test-Path $FrontendEnvExample) {
        Copy-Item $FrontendEnvExample $FrontendEnv
        Write-Host "  ✓ Created frontend\.env.local from template" -ForegroundColor Green
    }
} else {
    Write-Host "  ✓ frontend\.env.local already exists (preserving configuration)" -ForegroundColor Green
}

# 5. Backend Virtual Environment & Dependencies
Write-Host "`n[5/7] Installing backend Python virtual environment & dependencies..." -ForegroundColor Yellow
$BackendDir = Join-Path $ProjectRoot "backend"
Set-Location $BackendDir
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "  ✓ Created Python virtual environment in backend\.venv" -ForegroundColor Green
}
& .\.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
Write-Host "  ✓ Backend dependencies installed successfully" -ForegroundColor Green

# 6. Frontend Dependencies
Write-Host "`n[6/7] Installing frontend npm packages..." -ForegroundColor Yellow
$FrontendDir = Join-Path $ProjectRoot "frontend"
Set-Location $FrontendDir
npm install --quiet
Write-Host "  ✓ Frontend dependencies verified and installed" -ForegroundColor Green

# 7. Check Ollama Service Connectivity & Offer Model Pull
Write-Host "`n[7/7] Checking local Ollama service status..." -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $models = $resp.models | ForEach-Object { $_.name }
    Write-Host "  ✓ Ollama service is running. Installed models: $($models -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "  ! Ollama is not currently responding at http://localhost:11434." -ForegroundColor Yellow
    Write-Host "    Make sure to launch Ollama before analyzing issues." -ForegroundColor Yellow
}

Set-Location $ProjectRoot
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ✓ Setup completed successfully!                          " -ForegroundColor Green
Write-Host "  Run '.\scripts\run.ps1' to start the application.        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
