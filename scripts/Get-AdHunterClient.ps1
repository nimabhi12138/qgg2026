[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$UserId,
    [Parameter(Mandatory = $true)][string]$Password,
    [ValidateSet(0, 2)][int]$ClientType = 0,
    [string]$OutputDirectory = 'C:\Analysis\adhunter\samples',
    [int]$PollCount = 100,
    [int]$PollIntervalSeconds = 1
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

foreach ($path in @($OutputDirectory, 'C:\Analysis\adhunter\logs')) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

$cookieFile = Join-Path ([IO.Path]::GetTempPath()) ('adhunter-cookie-' + [guid]::NewGuid().ToString('N') + '.txt')

function Strip-DebugPrefix {
    param([string]$Text)
    $match = [regex]::Match($Text, '\{.*', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $match.Success) {
        throw 'No JSON payload found in server response.'
    }
    return $match.Value
}

function Decode-HexIfNeeded {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $Text
    }

    if (($Text.Length % 2) -ne 0) {
        return $Text
    }

    if ($Text -notmatch '^[0-9A-Fa-f]+$') {
        return $Text
    }

    try {
        $bytes = for ($i = 0; $i -lt $Text.Length; $i += 2) {
            [Convert]::ToByte($Text.Substring($i, 2), 16)
        }
        return [Text.Encoding]::UTF8.GetString($bytes)
    }
    catch {
        return $Text
    }
}

function Invoke-AdHunterJson {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [ValidateSet('GET', 'POST')][string]$Method = 'GET',
        [hashtable]$Body
    )

    $args = @('-sS', '-c', $cookieFile, '-b', $cookieFile)
    if ($Method -eq 'POST') {
        foreach ($key in $Body.Keys) {
            $pair = '{0}={1}' -f [Uri]::EscapeDataString([string]$key), [Uri]::EscapeDataString([string]$Body[$key])
            $args += @('-d', $pair)
        }
    }
    $args += $Uri
    $resp = [string]::Concat((curl.exe @args))
    $clean = Strip-DebugPrefix -Text $resp
    $json = $clean | ConvertFrom-Json
    if (-not $json.bResult) {
        throw ('Server returned failure: ' + $json.szMsg)
    }
    return $json
}

$login = Invoke-AdHunterJson -Uri 'http://www.adhunter.cn/index.php/login/login' -Method POST -Body @{
    UserID = $UserId
    PassWD = $Password
}

$null = [string]::Concat((curl.exe -sS -c $cookieFile -b $cookieFile 'http://www.adhunter.cn/index.php/main'))

$null = Invoke-AdHunterJson -Uri ("http://www.adhunter.cn/index.php/agent_mng/generate_client?type={0}" -f $ClientType)

$downloadUrl = $null
for ($i = 0; $i -lt $PollCount; $i++) {
    Start-Sleep -Seconds $PollIntervalSeconds
    $progress = Invoke-AdHunterJson -Uri ("http://www.adhunter.cn/index.php/agent_mng/check_generate_client_progress?type={0}" -f $ClientType)
    $candidate = Decode-HexIfNeeded -Text ([string]$progress.szData)
    if ($candidate -and $candidate.Length -gt 0) {
        $downloadUrl = $candidate
        break
    }
}

if (-not $downloadUrl) {
    throw 'Timed out waiting for generated client download URL.'
}

if ($downloadUrl -notmatch '^https?://') {
    $downloadUrl = ([Uri]::new([Uri]'http://www.adhunter.cn/', $downloadUrl)).AbsoluteUri
}

$uri = [Uri]$downloadUrl
$leafName = Split-Path $uri.AbsolutePath -Leaf
if ([string]::IsNullOrWhiteSpace($leafName)) {
    $leafName = 'adhunter-client.zip'
}

$outFile = Join-Path $OutputDirectory $leafName
$null = curl.exe -L -sS -c $cookieFile -b $cookieFile -o $outFile $downloadUrl

$summary = [ordered]@{
    Timestamp = (Get-Date).ToString('s')
    ClientType = $ClientType
    DownloadUrl = $downloadUrl
    OutputFile = $outFile
    SHA256 = (Get-FileHash -Path $outFile -Algorithm SHA256).Hash
    Size = (Get-Item $outFile).Length
}

$logPath = Join-Path 'C:\Analysis\adhunter\logs' ('download-client-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$summary | ConvertTo-Json | Set-Content -Path $logPath -Encoding UTF8

$summary

if (Test-Path $cookieFile) {
    Remove-Item $cookieFile -Force -ErrorAction SilentlyContinue
}
