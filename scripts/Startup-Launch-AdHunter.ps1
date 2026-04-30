[CmdletBinding()]
param(
    [string]$SampleExe = 'C:\Analysis\adhunter\17629075264\17629075264\AdHunter.exe',
    [string]$OutputRoot = 'C:\Analysis\adhunter\artifacts'
)

$ErrorActionPreference = 'Stop'

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDir = Join-Path $OutputRoot ($stamp + '-startup-client-run')
New-Item -ItemType Directory -Path $runDir -Force | Out-Null

$tcpOut = Join-Path $runDir 'tcp-samples.csv'
$procOut = Join-Path $runDir 'process-samples.csv'
$eventOut = Join-Path $runDir 'system-events.txt'
$summaryOut = Join-Path $runDir 'summary.json'
$startTime = Get-Date

if (-not (Test-Path $SampleExe)) {
    $sampleZip = 'C:\Analysis\adhunter\17629075264.zip'
    $sampleRoot = 'C:\Analysis\adhunter\17629075264'
    if (Test-Path $sampleZip) {
        if (Test-Path $sampleRoot) {
            Remove-Item -Recurse -Force $sampleRoot
        }
        Expand-Archive -Path $sampleZip -DestinationPath $sampleRoot -Force
    }
}

if (-not (Test-Path $SampleExe)) {
    throw ('Sample executable not found: ' + $SampleExe)
}

$sampler = Start-Job -ScriptBlock {
    param($tcpOut, $procOut)
    1..180 | ForEach-Object {
        $ts = (Get-Date).ToString('s')

        Get-NetTCPConnection -ErrorAction SilentlyContinue | ForEach-Object {
            $procName = $null
            $procPath = $null
            try {
                $p = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $_.OwningProcess) -ErrorAction Stop
                $procName = $p.Name
                $procPath = $p.ExecutablePath
            }
            catch {}

            [PSCustomObject]@{
                Timestamp = $ts
                State = [string]$_.State
                LocalAddress = $_.LocalAddress
                LocalPort = $_.LocalPort
                RemoteAddress = $_.RemoteAddress
                RemotePort = $_.RemotePort
                OwningProcess = $_.OwningProcess
                ProcessName = $procName
                ProcessPath = $procPath
            }
        } | Export-Csv -Path $tcpOut -NoTypeInformation -Append

        Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
            [PSCustomObject]@{
                Timestamp = $ts
                Name = $_.Name
                ProcessId = $_.ProcessId
                SessionId = $_.SessionId
                ExecutablePath = $_.ExecutablePath
                CommandLine = $_.CommandLine
            }
        } | Export-Csv -Path $procOut -NoTypeInformation -Append

        Start-Sleep -Seconds 1
    }
} -ArgumentList $tcpOut, $procOut

$proc = Start-Process -FilePath $SampleExe -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 120

Get-WinEvent -FilterHashtable @{ LogName = 'System'; StartTime = $startTime.AddMinutes(-1) } -ErrorAction SilentlyContinue |
    Select-Object TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-File -FilePath $eventOut -Width 4096 -Encoding UTF8

Wait-Job $sampler -Timeout 70 | Out-Null
if ((Get-Job -Id $sampler.Id).State -eq 'Running') {
    Stop-Job -Id $sampler.Id | Out-Null
}
Remove-Job -Id $sampler.Id -Force | Out-Null

$summary = [PSCustomObject]@{
    StartTime = $startTime.ToString('s')
    SampleExe = $SampleExe
    MainProcessId = $proc.Id
    MainProcessStillRunning = [bool](Get-Process -Id $proc.Id -ErrorAction SilentlyContinue)
    SampleProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -eq $SampleExe } |
        Select-Object Name, ProcessId, SessionId, ExecutablePath, CreationDate, CommandLine
}

$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryOut -Encoding UTF8
