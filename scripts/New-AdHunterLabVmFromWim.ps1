[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$WimPath,
    [int]$ImageIndex = 1,
    [string]$VmName = 'AdHunterLab',
    [string]$VmRoot = 'C:\HyperV\AdHunterLab',
    [string]$SwitchName = 'AdHunterNAT',
    [string]$NatName = 'AdHunterNAT',
    [string]$NatPrefix = '192.168.233.0/24',
    [string]$HostNatIp = '192.168.233.1',
    [int]$MemoryStartupGB = 4,
    [int]$MemoryMinimumGB = 2,
    [int]$MemoryMaximumGB = 8,
    [int]$ProcessorCount = 2,
    [int]$VhdSizeGB = 80
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) {
    throw 'Hyper-V cmdlets are not available.'
}

if (-not (Test-Path $WimPath)) {
    throw "WIM not found: $WimPath"
}

$memoryStartupBytes = [int64]$MemoryStartupGB * 1GB
$memoryMinimumBytes = [int64]$MemoryMinimumGB * 1GB
$memoryMaximumBytes = [int64]$MemoryMaximumGB * 1GB
$vhdSizeBytes = [int64]$VhdSizeGB * 1GB

$vmConfigRoot = Join-Path $VmRoot 'vm'
$vhdRoot = Join-Path $VmRoot 'disks'
$logRoot = Join-Path $VmRoot 'logs'
$vhdPath = Join-Path $vhdRoot ($VmName + '.vhdx')

foreach ($path in @($VmRoot, $vmConfigRoot, $vhdRoot, $logRoot)) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) {
    throw "A VM named '$VmName' already exists."
}

function Ensure-NatSwitch {
    param(
        [string]$SwitchName,
        [string]$NatName,
        [string]$NatPrefix,
        [string]$HostNatIp
    )

    $switch = Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue
    if (-not $switch) {
        Write-Host ('Creating internal switch ' + $SwitchName) -ForegroundColor Cyan
        $switch = New-VMSwitch -Name $SwitchName -SwitchType Internal
    }

    $ifAlias = 'vEthernet (' + $SwitchName + ')'
    $prefixLength = [int]($NatPrefix.Split('/')[1])
    $existingIp = Get-NetIPAddress -InterfaceAlias $ifAlias -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -eq $HostNatIp }
    if (-not $existingIp) {
        $existing = Get-NetIPAddress -InterfaceAlias $ifAlias -AddressFamily IPv4 -ErrorAction SilentlyContinue
        foreach ($item in $existing) {
            Remove-NetIPAddress -InterfaceAlias $ifAlias -IPAddress $item.IPAddress -Confirm:$false -ErrorAction SilentlyContinue
        }
        New-NetIPAddress -IPAddress $HostNatIp -PrefixLength $prefixLength -InterfaceAlias $ifAlias | Out-Null
    }

    $nat = Get-NetNat -Name $NatName -ErrorAction SilentlyContinue
    if (-not $nat) {
        Write-Host ('Creating NAT ' + $NatName + ' on ' + $NatPrefix) -ForegroundColor Cyan
        New-NetNat -Name $NatName -InternalIPInterfaceAddressPrefix $NatPrefix | Out-Null
    }

    return $switch
}

function Get-FreeDriveLetter {
    $used = (Get-Volume -ErrorAction SilentlyContinue).DriveLetter | Where-Object { $_ }
    foreach ($letter in 'Z','Y','X','W','V','U','T','S','R','Q','P','O') {
        if ($used -notcontains $letter) {
            return $letter
        }
    }
    throw 'No free drive letter available for mounting VHD partitions.'
}

function Dism-Run {
    param([string[]]$Arguments)
    $text = & dism.exe @Arguments
    $exit = $LASTEXITCODE
    $text
    if ($exit -ne 0) {
        throw ('DISM failed with exit code ' + $exit)
    }
}

$null = Ensure-NatSwitch -SwitchName $SwitchName -NatName $NatName -NatPrefix $NatPrefix -HostNatIp $HostNatIp

if (Test-Path $vhdPath) {
    Remove-Item $vhdPath -Force
}

Write-Host ('Creating VHDX ' + $vhdPath) -ForegroundColor Cyan
$null = New-VHD -Path $vhdPath -Dynamic -SizeBytes $vhdSizeBytes

$mountedDisk = $null

try {
    $mountedDisk = Mount-VHD -Path $vhdPath -Passthru
    Initialize-Disk -Number $mountedDisk.DiskNumber -PartitionStyle GPT | Out-Null

    $efiPartition = New-Partition -DiskNumber $mountedDisk.DiskNumber -Size 100MB -GptType '{C12A7328-F81F-11D2-BA4B-00A0C93EC93B}'
    $null = New-Partition -DiskNumber $mountedDisk.DiskNumber -Size 16MB -GptType '{E3C9E316-0B5C-4DB8-817D-F92DF00215AE}'
    $osPartition = New-Partition -DiskNumber $mountedDisk.DiskNumber -UseMaximumSize -AssignDriveLetter

    $efiLetter = Get-FreeDriveLetter
    Set-Partition -DiskNumber $mountedDisk.DiskNumber -PartitionNumber $efiPartition.PartitionNumber -NewDriveLetter $efiLetter | Out-Null

    Format-Volume -DriveLetter $efiLetter -FileSystem FAT32 -NewFileSystemLabel 'SYSTEM' -Confirm:$false | Out-Null
    Format-Volume -DriveLetter $osPartition.DriveLetter -FileSystem NTFS -NewFileSystemLabel 'Windows' -Confirm:$false | Out-Null
    $osLetter = $osPartition.DriveLetter

    Write-Host ('Applying WIM index ' + $ImageIndex + ' to ' + $osLetter + ':\') -ForegroundColor Cyan
    $applyLog = Join-Path $logRoot ('dism-apply-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
    Dism-Run @(
        "/Apply-Image",
        "/ImageFile:$WimPath",
        "/Index:$ImageIndex",
        "/ApplyDir:$($osLetter):\\",
        "/LogPath:$applyLog"
    ) | Out-Null

    Write-Host 'Writing boot files with BCDBoot' -ForegroundColor Cyan
    & bcdboot.exe "$($osLetter):\Windows" /s "$($efiLetter):" /f UEFI | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw ('bcdboot failed with exit code ' + $LASTEXITCODE)
    }
}
finally {
    if ($mountedDisk) {
        Dismount-VHD -Path $vhdPath -ErrorAction SilentlyContinue
    }
}

Write-Host ('Creating Hyper-V VM ' + $VmName) -ForegroundColor Cyan
$vm = New-VM `
    -Name $VmName `
    -Generation 2 `
    -MemoryStartupBytes $memoryStartupBytes `
    -VHDPath $vhdPath `
    -Path $vmConfigRoot `
    -SwitchName $SwitchName

Set-VMProcessor -VMName $VmName -Count $ProcessorCount
Set-VMMemory -VMName $VmName `
    -DynamicMemoryEnabled $true `
    -MinimumBytes $memoryMinimumBytes `
    -StartupBytes $memoryStartupBytes `
    -MaximumBytes $memoryMaximumBytes
Set-VM -Name $VmName -AutomaticCheckpointsEnabled $false | Out-Null
Set-VMFirmware -VMName $VmName -EnableSecureBoot On -SecureBootTemplate 'MicrosoftWindows' | Out-Null

$summary = [ordered]@{
    Timestamp = (Get-Date).ToString('s')
    VmName = $VmName
    WimPath = (Resolve-Path $WimPath).Path
    ImageIndex = $ImageIndex
    VhdPath = $vhdPath
    SwitchName = $SwitchName
    NatName = $NatName
    NatPrefix = $NatPrefix
    HostNatIp = $HostNatIp
    ProcessorCount = $ProcessorCount
    MemoryStartupGB = $MemoryStartupGB
    MemoryMinimumGB = $MemoryMinimumGB
    MemoryMaximumGB = $MemoryMaximumGB
    VhdSizeGB = $VhdSizeGB
}

$summaryPath = Join-Path $logRoot ('vm-created-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$summary | ConvertTo-Json | Set-Content -Path $summaryPath -Encoding UTF8

$summary
Write-Host ''
Write-Host ('VM created. Next: Start-VM -Name ' + $VmName) -ForegroundColor Green
