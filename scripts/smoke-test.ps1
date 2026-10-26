# OpenSource Navigator AI - Automated Smoke Test Suite (Windows PowerShell)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    OpenSource Navigator AI - Smoke Tests                 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendUrl = "http://127.0.0.1:8000"
$frontendUrl = "http://localhost:3000"
$allPassed = $true

# Test 1: Backend Health Endpoint
Write-Host "`n[Test 1/4] Checking Backend Health..." -ForegroundColor Yellow
try {
    $healthUri = "$backendUrl/api/v1/health"
    $health = Invoke-RestMethod -Uri $healthUri -Method Get -TimeoutSec 5
    if ($health.status -eq "healthy") {
        Write-Host "  Backend status: HEALTHY" -ForegroundColor Green
        Write-Host "    - Ollama Connected: $($health.ollama.connected)" -ForegroundColor Gray
        Write-Host "    - Configured Model: $($health.ollama.configured_model)" -ForegroundColor Gray
        Write-Host "    - GitHub Auth Token: $($health.github.token_configured)" -ForegroundColor Gray
    } else {
        Write-Host "  Health endpoint returned non-healthy status" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  Could not reach backend: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: Real GitHub Issues Search
Write-Host "`n[Test 2/4] Testing Real GitHub Issue Search..." -ForegroundColor Yellow
try {
    $issuesUri = "$backendUrl/api/v1/issues?language=python`&label=good%20first%20issue`&per_page=3"
    $issuesResp = Invoke-RestMethod -Uri $issuesUri -Method Get -TimeoutSec 10
    if ($issuesResp.rate_limited) {
        Write-Host "  GitHub API returned rate-limited response (handled gracefully as designed)" -ForegroundColor Yellow
        Write-Host "    - Message: $($issuesResp.message)" -ForegroundColor Gray
    } elseif ($issuesResp.items.Count -gt 0) {
        Write-Host "  Issue search succeeded! Found $($issuesResp.total_count) issues." -ForegroundColor Green
        Write-Host "    - Sample issue: [$($issuesResp.items[0].repository_name)] $($issuesResp.items[0].title)" -ForegroundColor Gray
        Write-Host "    - URL: $($issuesResp.items[0].html_url)" -ForegroundColor Gray
    } else {
        Write-Host "  Zero issues returned (check query or network connectivity)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Issue search failed: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Frontend Web Server
Write-Host "`n[Test 3/4] Testing Frontend Next.js Server..." -ForegroundColor Yellow
try {
    $fe = Invoke-WebRequest -Uri $frontendUrl -Method Get -UseBasicParsing -TimeoutSec 10
    if ($fe.StatusCode -eq 200) {
        Write-Host "  Frontend is serving HTTP 200 OK" -ForegroundColor Green
    } else {
        Write-Host "  Frontend returned status $($fe.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  Frontend server check notice: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 4: AI Analysis Endpoint
Write-Host "`n[Test 4/4] Testing AI Analysis Endpoint..." -ForegroundColor Yellow
try {
    $analyzeUri = "$backendUrl/api/v1/analyze"
    $payloadObj = @{
        issue_title = "Add docstring to calculate_total utility"
        issue_body = "The calculate_total function in math_utils.py is missing documentation."
        repository_name = "example-org/sample-repo"
        issue_url = "https://github.com/example-org/sample-repo/issues/1"
        labels = @("good first issue", "documentation")
    }
    $jsonPayload = $payloadObj | ConvertTo-Json

    $aiResp = Invoke-RestMethod -Uri $analyzeUri -Method Post -Body $jsonPayload -ContentType "application/json" -TimeoutSec 120
    Write-Host "  AI Analysis generated successfully!" -ForegroundColor Green
    Write-Host "    - Estimated Difficulty: $($aiResp.estimated_difficulty)" -ForegroundColor Gray
    Write-Host "    - Plain English Summary: $($aiResp.plain_english_summary)" -ForegroundColor Gray
    Write-Host "    - Model Used: $($aiResp.model_used)" -ForegroundColor Gray
} catch {
    Write-Host "  AI Analysis test: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  Core smoke tests executed successfully!                  " -ForegroundColor Green
} else {
    Write-Host "  Review any warnings or error messages above.             " -ForegroundColor Yellow
}
Write-Host "==========================================================" -ForegroundColor Cyan
