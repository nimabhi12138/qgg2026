[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$IsoPath,
    [string]$VmName = 'AdHunterLab',
    [string]$VmRoot = 'C:\HyperV\AdHunterLab',
    [string]$SwitchName = 'Default Switch',
    [int]$MemoryStartupGB = 4,
    [int]$MemoryMinimumGB = 2,
    [int]$MemoryMaximumGB = 8,
    [int]$ProcessorCount = 2,
    [int]$VhdSizeGB = 80
)

$ErrorActionPreference = 'Stop'

$memoryStartupBytes = [int64]$MemoryStartupGB * 1GB
$memoryMinimumBytes = [int64]$MemoryMinimumGB * 1GB
$memoryMaximumBytes = [int64]$MemoryMaximumGB * 1GB
$vhdSizeBytes = [int64]$VhdSizeGB * 1GB

if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) {
    throw 'Hyper-V cmdlets are not available yet. Reboot the host first.'
}

if (-not (Test-Path $IsoPath)) {
    throw "ISO not found: $IsoPath"
}

if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
    $available = (Get-VMSwitch | Select-Object -ExpandProperty Name) -join ', '
    throw "VMSwitch '$SwitchName' not found. Available switches: $available"
}

$vmConfigRoot = Join-Path $VmRoot 'vm'
$vhdRoot = Join-Path $VmRoot 'disks'
$vhdPath = Join-Path $vhdRoot ($VmName + '.vhdx')

foreach ($path in @($VmRoot, $vmConfigRoot, $vhdRoot)) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) {
    throw "A VM named '$VmName' already exists."
}

$vm = New-VM `
    -Name $VmName `
    -Generation 2 `
    -MemoryStartupBytes $memoryStartupBytes `
    -NewVHDPath $vhdPath `
    -NewVHDSizeBytes $vhdSizeBytes `
    -Path $vmConfigRoot `
    -SwitchName $SwitchName

Set-VMProcessor -VMName $VmName -Count $ProcessorCount
Set-VMMemory -VMName $VmName `
    -DynamicMemoryEnabled $true `
    -MinimumBytes $memoryMinimumBytes `
    -StartupBytes $memoryStartupBytes `
    -MaximumBytes $memoryMaximumBytes
Set-VM -Name $VmName -AutomaticCheckpointsEnabled $false

Add-VMDvdDrive -VMName $VmName -Path $IsoPath | Out-Null
$dvd = Get-VMDvdDrive -VMName $VmName
$disk = Get-VMHardDiskDrive -VMName $VmName
Set-VMFirmware -VMName $VmName -FirstBootDevice $dvd

$summary = [ordered]@{
    Timestamp = (Get-Date).ToString('s')
    VmName = $VmName
    VmRoot = $VmRoot
    IsoPath = (Resolve-Path $IsoPath).Path
    VhdPath = $vhdPath
    SwitchName = $SwitchName
    ProcessorCount = $ProcessorCount
    MemoryStartupGB = $MemoryStartupGB
    MemoryMinimumGB = $MemoryMinimumGB
    MemoryMaximumGB = $MemoryMaximumGB
    VhdSizeGB = $VhdSizeGB
}

$summary
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host ('1. Start-VM -Name ' + $VmName)
Write-Host '2. Install Windows in the guest'
Write-Host ('3. After guest setup, create checkpoints: clean-os, tools-installed, pre-client-download')
