[CmdletBinding()]
param(
    [string]$AnalysisRoot = 'C:\Analysis\adhunter'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$toolRoot = Join-Path $AnalysisRoot 'tools'
$downloadRoot = Join-Path $AnalysisRoot 'downloads'
$logRoot = Join-Path $AnalysisRoot 'logs'

foreach ($path in @($AnalysisRoot, $toolRoot, $downloadRoot, $logRoot)) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

function Download-File {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][string]$OutFile
    )
    if (-not (Test-Path $OutFile)) {
        Write-Host ('Downloading ' + $Url) -ForegroundColor Cyan
        Invoke-WebRequest -Uri $Url -OutFile $OutFile
    }
}

function Expand-Zip {
    param(
        [Parameter(Mandatory = $true)][string]$ZipPath,
        [Parameter(Mandatory = $true)][string]$Destination
    )
    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }
    Expand-Archive -Path $ZipPath -DestinationPath $Destination -Force
}

$manifest = [ordered]@{
    '7zipInstaller' = 'https://github.com/ip7z/7zip/releases/download/26.00/7z2600-x64.exe'
    'SysinternalsSuite' = 'https://download.sysinternals.com/files/SysinternalsSuite.zip'
    'WiresharkInstaller' = 'https://2.na.dl.wireshark.org/win64/Wireshark-4.6.3-x64.exe'
    'NpcapInstaller' = 'https://npcap.com/dist/npcap-1.87.exe'
}

$ilSpyRelease = Invoke-RestMethod -Headers @{ 'User-Agent' = 'Codex' } -Uri 'https://api.github.com/repos/icsharpcode/ILSpy/releases/latest'
$ilSpyAsset = $ilSpyRelease.assets | Where-Object { $_.name -like 'ILSpy_selfcontained_*_x64.zip' } | Select-Object -First 1
if ($ilSpyAsset) {
    $manifest['ILSpySelfContained'] = $ilSpyAsset.browser_download_url
}

$dieRelease = Invoke-RestMethod -Headers @{ 'User-Agent' = 'Codex' } -Uri 'https://api.github.com/repos/horsicq/DIE-engine/releases/latest'
$dieAsset = $dieRelease.assets | Where-Object { $_.name -like 'die_win64_portable_*_x64.zip' } | Select-Object -First 1
if ($dieAsset) {
    $manifest['DIEPortable'] = $dieAsset.browser_download_url
}

$peBearRelease = Invoke-RestMethod -Headers @{ 'User-Agent' = 'Codex' } -Uri 'https://api.github.com/repos/hasherezade/pe-bear/releases/latest'
$peBearAsset = $peBearRelease.assets | Where-Object { $_.name -like 'PE-bear_*_qt6*_x64_win_*.zip' } | Select-Object -First 1
if ($peBearAsset) {
    $manifest['PEBearPortable'] = $peBearAsset.browser_download_url
}

$manifestPath = Join-Path $logRoot 'tool-manifest.json'
$manifest | ConvertTo-Json | Set-Content -Path $manifestPath -Encoding UTF8

$sysinternalsZip = Join-Path $downloadRoot 'SysinternalsSuite.zip'
$sevenZipExe = Join-Path $downloadRoot '7z2600-x64.exe'
$wiresharkExe = Join-Path $downloadRoot 'Wireshark-x64.exe'
$npcapExe = Join-Path $downloadRoot 'npcap.exe'

Download-File -Url $manifest['SysinternalsSuite'] -OutFile $sysinternalsZip
Download-File -Url $manifest['7zipInstaller'] -OutFile $sevenZipExe
Download-File -Url $manifest['WiresharkInstaller'] -OutFile $wiresharkExe
Download-File -Url $manifest['NpcapInstaller'] -OutFile $npcapExe

Expand-Zip -ZipPath $sysinternalsZip -Destination (Join-Path $toolRoot 'Sysinternals')

if ($manifest.Contains('ILSpySelfContained')) {
    $ilSpyZip = Join-Path $downloadRoot 'ILSpy-selfcontained-x64.zip'
    Download-File -Url $manifest['ILSpySelfContained'] -OutFile $ilSpyZip
    Expand-Zip -ZipPath $ilSpyZip -Destination (Join-Path $toolRoot 'ILSpy')
}

if ($manifest.Contains('DIEPortable')) {
    $dieZip = Join-Path $downloadRoot 'die-portable-x64.zip'
    Download-File -Url $manifest['DIEPortable'] -OutFile $dieZip
    Expand-Zip -ZipPath $dieZip -Destination (Join-Path $toolRoot 'DIE')
}

if ($manifest.Contains('PEBearPortable')) {
    $peBearZip = Join-Path $downloadRoot 'pe-bear-portable-x64.zip'
    Download-File -Url $manifest['PEBearPortable'] -OutFile $peBearZip
    Expand-Zip -ZipPath $peBearZip -Destination (Join-Path $toolRoot 'PE-bear')
}

Write-Host ''
Write-Host 'Downloaded and staged tools under:' -ForegroundColor Green
Write-Host ('  ' + $toolRoot)
Write-Host ('  ' + $downloadRoot)
Write-Host ''
Write-Host 'Manual installs still recommended inside the guest:' -ForegroundColor Yellow
Write-Host ('- Run "' + $sevenZipExe + '" to install 7-Zip')
Write-Host ('- Run "' + $wiresharkExe + '" and keep bundled Npcap enabled, or use "' + $npcapExe + '" if you want a separate Npcap install')
Write-Host '- Sysinternals, ILSpy, DIE, and PE-bear are staged as portable tools'
