[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Label,
    [string]$OutputRoot = 'C:\Analysis\adhunter\artifacts'
)

$ErrorActionPreference = 'Stop'

$safeLabel = ($Label -replace '[^A-Za-z0-9_.-]', '_')
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $OutputRoot ($stamp + '-' + $safeLabel)

New-Item -ItemType Directory -Path $outDir -Force | Out-Null

Get-Process | Sort-Object ProcessName | Export-Csv -NoTypeInformation -Path (Join-Path $outDir 'processes.csv')
Get-Service | Sort-Object Name | Export-Csv -NoTypeInformation -Path (Join-Path $outDir 'services.csv')
Get-ScheduledTask | Sort-Object TaskName | Export-Csv -NoTypeInformation -Path (Join-Path $outDir 'scheduled-tasks.csv')
driverquery /v /fo csv | Set-Content -Path (Join-Path $outDir 'drivers.csv')
netstat -ano | Set-Content -Path (Join-Path $outDir 'netstat.txt')
reg query 'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' /s | Set-Content -Path (Join-Path $outDir 'run-hklm.txt')
reg query 'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' /s | Set-Content -Path (Join-Path $outDir 'run-hkcu.txt')
Get-CimInstance Win32_StartupCommand | Export-Csv -NoTypeInformation -Path (Join-Path $outDir 'startup-commands.csv')
Get-ChildItem -Path 'C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup' -Force -ErrorAction SilentlyContinue |
    Select-Object FullName, Length, LastWriteTime |
    Export-Csv -NoTypeInformation -Path (Join-Path $outDir 'startup-folder-programdata.csv')
Get-ChildItem -Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" -Force -ErrorAction SilentlyContinue |
    Select-Object FullName, Length, LastWriteTime |
    Export-Csv -NoTypeInformation -Path (Join-Path $outDir 'startup-folder-user.csv')

$summary = [ordered]@{
    Label = $Label
    Timestamp = (Get-Date).ToString('s')
    OutputDirectory = $outDir
}
$summary | ConvertTo-Json | Set-Content -Path (Join-Path $outDir 'summary.json') -Encoding UTF8

Write-Host ('Baseline snapshot saved to ' + $outDir) -ForegroundColor Green
