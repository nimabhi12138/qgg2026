[CmdletBinding()]
param(
    [string]$SampleExe = 'C:\Analysis\adhunter\17629075264\17629075264\AdHunter.exe',
    [string]$OutputRoot = 'C:\Analysis\adhunter\artifacts',
    [int]$DurationSeconds = 900,
    [int]$PollSeconds = 1
)

$ErrorActionPreference = 'Stop'

function Export-ProcessSnapshot {
    param(
        [string]$Path,
        [string]$Timestamp
    )

    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
        [PSCustomObject]@{
            Timestamp = $Timestamp
            Name = $_.Name
            ProcessId = $_.ProcessId
            ParentProcessId = $_.ParentProcessId
            SessionId = $_.SessionId
            ExecutablePath = $_.ExecutablePath
            CommandLine = $_.CommandLine
        }
    } | Export-Csv -Path $Path -NoTypeInformation -Append
}

function Export-TcpSnapshot {
    param(
        [string]$Path,
        [string]$Timestamp
    )

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
            Timestamp = $Timestamp
            State = [string]$_.State
            LocalAddress = $_.LocalAddress
            LocalPort = $_.LocalPort
            RemoteAddress = $_.RemoteAddress
            RemotePort = $_.RemotePort
            OwningProcess = $_.OwningProcess
            ProcessName = $procName
            ProcessPath = $procPath
        }
    } | Export-Csv -Path $Path -NoTypeInformation -Append
}

function Export-DnsSnapshot {
    param(
        [string]$Path,
        [string]$Timestamp
    )

    Get-DnsClientCache -ErrorAction SilentlyContinue | ForEach-Object {
        [PSCustomObject]@{
            Timestamp = $Timestamp
            Entry = $_.Entry
            RecordType = $_.RecordType
            Data = $_.Data
            TimeToLive = $_.TimeToLive
            Status = $_.Status
        }
    } | Export-Csv -Path $Path -NoTypeInformation -Append
}

function Get-RandomWindowsArtifacts {
    $dirs = Get-ChildItem -Path 'C:\Windows' -Directory -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^[a-z0-9]{6,10}$' }

    foreach ($dir in $dirs) {
        Get-ChildItem -LiteralPath $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
            [PSCustomObject]@{
                Root = $dir.FullName
                FullName = $_.FullName
                PSIsContainer = $_.PSIsContainer
                Length = if ($_.PSIsContainer) { $null } else { $_.Length }
                CreationTime = $_.CreationTime
                LastWriteTime = $_.LastWriteTime
                Attributes = [string]$_.Attributes
            }
        }
    }
}

function Copy-IfExists {
    param(
        [string]$Source,
        [string]$DestinationDir
    )

    if (Test-Path -LiteralPath $Source) {
        New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
        $leaf = Split-Path -Path $Source -Leaf
        $dest = Join-Path $DestinationDir $leaf
        $parent = Split-Path -Path $Source -Parent
        cmd /c ('robocopy "{0}" "{1}" "{2}" /B /R:0 /W:0 /NFL /NDL /NJH /NJS /NP' -f $parent, $DestinationDir, $leaf) | Out-Null
        if (-not (Test-Path -LiteralPath $dest)) {
            try {
                Copy-Item -LiteralPath $Source -Destination $dest -Force -ErrorAction Stop
            }
            catch {}
        }
    }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDir = Join-Path $OutputRoot ($stamp + '-longtrace')
$beforeDir = Join-Path $runDir 'before'
$afterDir = Join-Path $runDir 'after'
$collectDir = Join-Path $runDir 'collected'
$summaryPath = Join-Path $runDir 'summary.json'
$transcriptPath = Join-Path $runDir 'transcript.txt'
$sysmonAllPath = Join-Path $runDir 'sysmon-all.txt'
$sysmonTargetedPath = Join-Path $runDir 'sysmon-targeted.txt'
$systemEventsPath = Join-Path $runDir 'system-events.txt'
$tcpPath = Join-Path $runDir 'tcp-samples.csv'
$procPath = Join-Path $runDir 'process-samples.csv'
$dnsPath = Join-Path $runDir 'dns-samples.csv'
$flagPath = Join-Path $runDir 'complete.flag'

New-Item -ItemType Directory -Path $runDir, $beforeDir, $afterDir, $collectDir -Force | Out-Null
Start-Transcript -Path $transcriptPath -Force | Out-Null

try {
    $startTime = Get-Date

    if (-not (Test-Path -LiteralPath $SampleExe)) {
        $sampleZip = 'C:\Analysis\adhunter\17629075264.zip'
        $sampleRoot = 'C:\Analysis\adhunter\17629075264'
        if (Test-Path -LiteralPath $sampleZip) {
            if (Test-Path -LiteralPath $sampleRoot) {
                Remove-Item -LiteralPath $sampleRoot -Recurse -Force
            }
            Expand-Archive -Path $sampleZip -DestinationPath $sampleRoot -Force
        }
    }

    if (-not (Test-Path -LiteralPath $SampleExe)) {
        throw ('Sample executable not found: ' + $SampleExe)
    }

    Start-Sleep -Seconds 15
    Clear-DnsClientCache -ErrorAction SilentlyContinue

    Export-ProcessSnapshot -Path (Join-Path $beforeDir 'processes.csv') -Timestamp $startTime.ToString('s')
    Export-TcpSnapshot -Path (Join-Path $beforeDir 'tcp.csv') -Timestamp $startTime.ToString('s')
    Export-DnsSnapshot -Path (Join-Path $beforeDir 'dns.csv') -Timestamp $startTime.ToString('s')

    Get-RandomWindowsArtifacts | Export-Csv -Path (Join-Path $beforeDir 'random-windows.csv') -NoTypeInformation

    Get-ChildItem -Path 'C:\Users\Administrator\AppData\Local\Microsoft\Windows\INetCache' -Recurse -Force -ErrorAction SilentlyContinue |
        Select-Object FullName, PSIsContainer, Length, CreationTime, LastWriteTime, Attributes |
        Export-Csv -Path (Join-Path $beforeDir 'inetcache.csv') -NoTypeInformation

    Get-ScheduledTask -ErrorAction SilentlyContinue |
        Select-Object TaskPath, TaskName, State |
        Export-Csv -Path (Join-Path $beforeDir 'scheduled-tasks.csv') -NoTypeInformation

    Get-ChildItem 'C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup' -Force -ErrorAction SilentlyContinue |
        Select-Object Name, FullName, LastWriteTime |
        Export-Csv -Path (Join-Path $beforeDir 'startup-folder.csv') -NoTypeInformation

    $sampler = Start-Job -ScriptBlock {
        param($DurationSeconds, $PollSeconds, $tcpPath, $procPath, $dnsPath)
        $ticks = [Math]::Max([int][Math]::Ceiling($DurationSeconds / $PollSeconds), 1)
        for ($i = 0; $i -lt $ticks; $i++) {
            $ts = (Get-Date).ToString('s')
            Get-NetTCPConnection -ErrorAction SilentlyContinue | ForEach-Object {
                $procName = $null
                $procPathNow = $null
                try {
                    $p = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $_.OwningProcess) -ErrorAction Stop
                    $procName = $p.Name
                    $procPathNow = $p.ExecutablePath
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
                    ProcessPath = $procPathNow
                }
            } | Export-Csv -Path $tcpPath -NoTypeInformation -Append

            if (($i % 5) -eq 0) {
                Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
                    [PSCustomObject]@{
                        Timestamp = $ts
                        Name = $_.Name
                        ProcessId = $_.ProcessId
                        ParentProcessId = $_.ParentProcessId
                        SessionId = $_.SessionId
                        ExecutablePath = $_.ExecutablePath
                        CommandLine = $_.CommandLine
                    }
                } | Export-Csv -Path $procPath -NoTypeInformation -Append

                Get-DnsClientCache -ErrorAction SilentlyContinue | ForEach-Object {
                    [PSCustomObject]@{
                        Timestamp = $ts
                        Entry = $_.Entry
                        RecordType = $_.RecordType
                        Data = $_.Data
                        TimeToLive = $_.TimeToLive
                        Status = $_.Status
                    }
                } | Export-Csv -Path $dnsPath -NoTypeInformation -Append
            }
            Start-Sleep -Seconds $PollSeconds
        }
    } -ArgumentList $DurationSeconds, $PollSeconds, $tcpPath, $procPath, $dnsPath

    $existing = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -eq $SampleExe } |
        Select-Object -First 1

    if ($existing) {
        $procId = $existing.ProcessId
        $launchMode = 'reused-existing'
    }
    else {
        $proc = Start-Process -FilePath $SampleExe -PassThru -WindowStyle Hidden
        $procId = $proc.Id
        $launchMode = 'started-new'
    }

    Start-Sleep -Seconds $DurationSeconds

    Wait-Job $sampler -Timeout 60 | Out-Null
    if ((Get-Job -Id $sampler.Id).State -eq 'Running') {
        Stop-Job -Id $sampler.Id | Out-Null
    }
    Receive-Job -Id $sampler.Id -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Id $sampler.Id -Force | Out-Null

    $endTime = Get-Date

    Export-ProcessSnapshot -Path (Join-Path $afterDir 'processes.csv') -Timestamp $endTime.ToString('s')
    Export-TcpSnapshot -Path (Join-Path $afterDir 'tcp.csv') -Timestamp $endTime.ToString('s')
    Export-DnsSnapshot -Path (Join-Path $afterDir 'dns.csv') -Timestamp $endTime.ToString('s')
    Get-RandomWindowsArtifacts | Export-Csv -Path (Join-Path $afterDir 'random-windows.csv') -NoTypeInformation

    Get-ChildItem -Path 'C:\Users\Administrator\AppData\Local\Microsoft\Windows\INetCache' -Recurse -Force -ErrorAction SilentlyContinue |
        Select-Object FullName, PSIsContainer, Length, CreationTime, LastWriteTime, Attributes |
        Export-Csv -Path (Join-Path $afterDir 'inetcache.csv') -NoTypeInformation

    Get-WinEvent -FilterHashtable @{ LogName = 'System'; StartTime = $startTime.AddSeconds(-5) } -ErrorAction SilentlyContinue |
        Select-Object TimeCreated, ProviderName, Id, LevelDisplayName, Message |
        Format-List | Out-File -FilePath $systemEventsPath -Width 4096 -Encoding UTF8

    if (Get-WinEvent -ListLog 'Microsoft-Windows-Sysmon/Operational' -ErrorAction SilentlyContinue) {
        $sysmonEvents = Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-Sysmon/Operational'; StartTime = $startTime.AddSeconds(-5) } -ErrorAction SilentlyContinue
        $sysmonEvents |
            Select-Object TimeCreated, Id, ProviderName, Message |
            Format-List | Out-File -FilePath $sysmonAllPath -Width 4096 -Encoding UTF8

        $sysmonEvents |
            Where-Object {
                $_.Message -match 'adhunter\.cn|wb009\.com|AdHunter\.exe|remote\.exe|cw\.dat|ControlWindow|WxPlugin|vqvam|hkthunk|CreateRemoteThread'
            } |
            Select-Object TimeCreated, Id, ProviderName, Message |
            Format-List | Out-File -FilePath $sysmonTargetedPath -Width 4096 -Encoding UTF8
    }

    $sampleProc = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -eq $SampleExe }

    if ($sampleProc) {
        try {
            Get-Process -Id $sampleProc[0].ProcessId -Module -ErrorAction Stop |
                Select-Object ModuleName, FileName |
                Export-Csv -Path (Join-Path $afterDir 'sample-modules.csv') -NoTypeInformation
        }
        catch {}
    }

    Get-ChildItem 'C:\Windows\System32' -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'vqvam_*' -or $_.Name -like '*fora*' } |
        Select-Object Name, FullName, Length, CreationTime, LastWriteTime |
        Export-Csv -Path (Join-Path $afterDir 'system32-drops.csv') -NoTypeInformation

    Get-ChildItem 'C:\Windows\SysWOW64' -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'vqvam_*' -or $_.Name -like 'Wxplugin*' } |
        Select-Object Name, FullName, Length, CreationTime, LastWriteTime |
        Export-Csv -Path (Join-Path $afterDir 'syswow64-drops.csv') -NoTypeInformation

    foreach ($path in @(
        'C:\Windows\cw.dat',
        'C:\Windows\System32\vqvam_80p.dll',
        'C:\Windows\SysWOW64\vqvam_80p.dll',
        'C:\Windows\System32\fora9_6e7oc1i',
        'C:\Windows\System32\6fora9_6e7oc1i'
    )) {
        try {
            Copy-IfExists -Source $path -DestinationDir $collectDir
        }
        catch {}
    }

    Get-ChildItem -Path 'C:\Windows' -Directory -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^[a-z0-9]{6,10}$' -and $_.LastWriteTime -gt $startTime.AddSeconds(-5) } |
        ForEach-Object {
            $dest = Join-Path $collectDir $_.Name
            cmd /c ('robocopy "{0}" "{1}" /E /B /R:0 /W:0 /NFL /NDL /NJH /NJS /NP' -f $_.FullName, $dest) | Out-Null
        }

    Get-ChildItem -Path 'C:\Users\Administrator\AppData\Local\Microsoft\Windows\INetCache' -Recurse -Force -ErrorAction SilentlyContinue |
        Where-Object { -not $_.PSIsContainer -and $_.LastWriteTime -gt $startTime.AddSeconds(-5) } |
        ForEach-Object {
            $safeName = [IO.Path]::GetFileName($_.FullName)
            if ($safeName) {
                try {
                    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $collectDir $safeName) -Force -ErrorAction Stop
                }
                catch {}
            }
        }

    $summary = [PSCustomObject]@{
        StartTime = $startTime.ToString('s')
        EndTime = $endTime.ToString('s')
        LaunchMode = $launchMode
        SampleExe = $SampleExe
        MainProcessId = $procId
        MainProcessStillRunning = [bool](Get-Process -Id $procId -ErrorAction SilentlyContinue)
        SampleProcesses = $sampleProc | Select-Object Name, ProcessId, SessionId, ExecutablePath, CreationDate, CommandLine
        RandomWindowsDirs = Get-ChildItem -Path 'C:\Windows' -Directory -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^[a-z0-9]{6,10}$' } |
            Select-Object Name, FullName, LastWriteTime
    }

    $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryPath -Encoding UTF8
    Set-Content -Path $flagPath -Value 'complete' -Encoding ASCII
}
finally {
    Stop-Transcript | Out-Null
}
