[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SamplePath,
    [string]$OutputRoot = 'C:\Analysis\adhunter\artifacts'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $SamplePath)) {
    throw "Sample not found: $SamplePath"
}

$sample = Get-Item $SamplePath
$sampleName = [IO.Path]::GetFileNameWithoutExtension($sample.Name)
$outDir = Join-Path $OutputRoot ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-static-' + $sampleName)
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

function Get-ReadableStrings {
    param(
        [byte[]]$Bytes,
        [int]$MinimumLength = 6
    )

    $results = New-Object System.Collections.Generic.List[string]

    $asciiChars = New-Object System.Collections.Generic.List[char]
    foreach ($b in $Bytes) {
        if ($b -ge 32 -and $b -le 126) {
            [void]$asciiChars.Add([char]$b)
        }
        else {
            if ($asciiChars.Count -ge $MinimumLength) {
                [void]$results.Add((-join $asciiChars))
            }
            $asciiChars.Clear()
        }
    }
    if ($asciiChars.Count -ge $MinimumLength) {
        [void]$results.Add((-join $asciiChars))
    }

    $unicodeChars = New-Object System.Collections.Generic.List[char]
    for ($i = 0; $i -lt ($Bytes.Length - 1); $i += 2) {
        $code = [BitConverter]::ToUInt16($Bytes, $i)
        if ($code -ge 32 -and $code -le 126) {
            [void]$unicodeChars.Add([char]$code)
        }
        else {
            if ($unicodeChars.Count -ge $MinimumLength) {
                [void]$results.Add((-join $unicodeChars))
            }
            $unicodeChars.Clear()
        }
    }
    if ($unicodeChars.Count -ge $MinimumLength) {
        [void]$results.Add((-join $unicodeChars))
    }

    $results | Sort-Object -Unique
}

$bytes = [IO.File]::ReadAllBytes($sample.FullName)
$hash = Get-FileHash -Path $sample.FullName -Algorithm SHA256
$sig = Get-AuthenticodeSignature -FilePath $sample.FullName
$versionInfo = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($sample.FullName)

$summary = [ordered]@{
    FileName = $sample.Name
    FullName = $sample.FullName
    Size = $sample.Length
    SHA256 = $hash.Hash
    SignatureStatus = [string]$sig.Status
    SignerCertificate = if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { $null }
    OriginalFilename = $versionInfo.OriginalFilename
    FileDescription = $versionInfo.FileDescription
    ProductName = $versionInfo.ProductName
    FileVersion = $versionInfo.FileVersion
}
$summary | ConvertTo-Json | Set-Content -Path (Join-Path $outDir 'summary.json') -Encoding UTF8

$strings = Get-ReadableStrings -Bytes $bytes
$strings | Set-Content -Path (Join-Path $outDir 'strings.txt') -Encoding UTF8

$interestingPatterns = @(
    'http://', 'https://', '.dll', '.sys', '.exe', '.bat',
    'DIR', 'REG', 'IP', 'CtrlWnd', 'AntiThread', 'ThreadControl',
    'service', 'driver', 'task', 'startup', 'update'
)

$interesting = foreach ($pattern in $interestingPatterns) {
    $strings | Where-Object { $_ -like ('*' + $pattern + '*') }
}
$interesting | Sort-Object -Unique | Set-Content -Path (Join-Path $outDir 'interesting-strings.txt') -Encoding UTF8

Copy-Item -Path $sample.FullName -Destination (Join-Path $outDir $sample.Name) -Force

Write-Host ('Static profile written to ' + $outDir) -ForegroundColor Green
