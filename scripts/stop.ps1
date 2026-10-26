# OpenSource Navigator AI - Stop Services (Windows PowerShell)
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$pidFile = Join-Path $ProjectRoot "scripts\.running_pids"

Write-Host "Stopping OpenSource Navigator AI services..." -ForegroundColor Yellow

if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    foreach ($p in $pids) {
        $cleanId = $p.Trim()
        if ($cleanId -match '^\d+$') {
            try {
                Stop-Process -Id ([int]$cleanId) -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped process with PID $cleanId" -ForegroundColor Green
            } catch {
                # Process already terminated
            }
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Gracefully terminate any processes listening on ports 8000 and 3000
$ports = @(8000, 3000)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($c in $conns) {
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped process on port $port (PID: $($c.OwningProcess))" -ForegroundColor Green
            }
        }
    } catch {
        # Port was not in use
    }
}

Write-Host "All OpenSource Navigator AI services stopped." -ForegroundColor Green
