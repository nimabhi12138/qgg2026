[CmdletBinding()]
param(
    [string]$AnalysisRoot = 'C:\Analysis\adhunter'
)

$ErrorActionPreference = 'Stop'

function Get-FeatureState {
    param([string]$FeatureName)
    (Get-WindowsOptionalFeature -Online -FeatureName $FeatureName).State
}

$features = @(
    'Microsoft-Hyper-V-All',
    'Microsoft-Hyper-V',
    'Microsoft-Hyper-V-Hypervisor',
    'Microsoft-Hyper-V-Management-PowerShell'
)

foreach ($path in @(
    $AnalysisRoot,
    (Join-Path $AnalysisRoot 'host'),
    (Join-Path $AnalysisRoot 'guest'),
    (Join-Path $AnalysisRoot 'artifacts'),
    (Join-Path $AnalysisRoot 'logs'),
    (Join-Path $AnalysisRoot 'scripts')
)) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

$status = [ordered]@{
    Timestamp = (Get-Date).ToString('s')
    ComputerName = $env:COMPUTERNAME
    AnalysisRoot = $AnalysisRoot
    RestartPending = $false
}

foreach ($feature in $features) {
    $status[$feature] = Get-FeatureState -FeatureName $feature
}

if ($status['Microsoft-Hyper-V-All'] -ne 'Enabled') {
    Write-Host 'Enabling Hyper-V...' -ForegroundColor Cyan
    $null = Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -All -NoRestart
    $status['Microsoft-Hyper-V-All'] = Get-FeatureState -FeatureName 'Microsoft-Hyper-V-All'
}

$status['RestartPending'] = $true
try {
    $null = Get-Command Get-VM -ErrorAction Stop
    $status['HyperVModuleAvailable'] = $true
    $status['RestartPending'] = $false
}
catch {
    $status['HyperVModuleAvailable'] = $false
}

$logPath = Join-Path $AnalysisRoot ('logs\host-status-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$status | ConvertTo-Json | Set-Content -Path $logPath -Encoding UTF8

Write-Host ('Host status written to ' + $logPath) -ForegroundColor Green
$status.GetEnumerator() | ForEach-Object {
    '{0}: {1}' -f $_.Key, $_.Value
}
