param(
    [Parameter(Mandatory=$true)][string]$SetupPath,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [Parameter(Mandatory=$true)][string]$IconPath
)

$ErrorActionPreference = "Stop"

$SetupPath = [IO.Path]::GetFullPath($SetupPath)
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
$IconPath = [IO.Path]::GetFullPath($IconPath)
$SourcePath = Join-Path $PSScriptRoot "SerKalInstaller.cs"

if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
    throw "Installer-Quelltext fehlt: $SourcePath"
}
if (-not (Test-Path -LiteralPath $SetupPath -PathType Leaf)) {
    throw "Squirrel-Setup fehlt: $SetupPath"
}
if (-not (Test-Path -LiteralPath $IconPath -PathType Leaf)) {
    throw "SerKal-Symbol fehlt: $IconPath"
}

$candidates = @(
    (Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"),
    (Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe")
)
$csc = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $csc) {
    throw "Der Windows-C#-Compiler wurde nicht gefunden."
}

$outputFolder = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputFolder -PathType Container)) {
    New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
}

$tempOutput = Join-Path $outputFolder ("serkal-installer-" + [Guid]::NewGuid().ToString("N") + ".exe")
$compilerArgs = @(
    "/nologo",
    "/target:winexe",
    "/optimize+",
    "/platform:anycpu",
    "/out:$tempOutput",
    "/win32icon:$IconPath",
    "/resource:$SetupPath,SerKal.Setup.exe",
    "/reference:System.dll",
    "/reference:System.Core.dll",
    "/reference:System.Drawing.dll",
    "/reference:System.Windows.Forms.dll",
    $SourcePath
)

& $csc $compilerArgs
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $tempOutput -PathType Leaf)) {
    throw "Die SerKal-Installer-Hülle konnte nicht gebaut werden."
}

$size = (Get-Item -LiteralPath $tempOutput).Length
if ($size -le (Get-Item -LiteralPath $SetupPath).Length) {
    Remove-Item -LiteralPath $tempOutput -Force -ErrorAction SilentlyContinue
    throw "Die gebaute EXE enthält das Squirrel-Setup offenbar nicht vollständig."
}

Move-Item -LiteralPath $tempOutput -Destination $OutputPath -Force
Write-Host "SerKal-Publish-Installer erstellt:"
Write-Host $OutputPath
