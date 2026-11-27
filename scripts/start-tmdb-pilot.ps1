$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
if (-not (Test-Path 'node_modules/.bin/electron.cmd')) {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci ist fehlgeschlagen.' }
}
$previousPilot = $env:SERKAL_LOCAL_TMDB_PILOT
$previousKey = $env:TMDB_API_KEY
$pilot = $null
try {
    $secureKey = Read-Host 'TMDB-Entwickler-Key fuer den lokalen Pilot' -AsSecureString
    $env:TMDB_API_KEY = [System.Net.NetworkCredential]::new('', $secureKey).Password
    try {
        $pilot = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList '"5 tools/tmdb-desktop-pilot.mjs"' -NoNewWindow -PassThru
    } finally {
        Remove-Item Env:TMDB_API_KEY -ErrorAction SilentlyContinue
    }
    $env:SERKAL_LOCAL_TMDB_PILOT = '1'
    # Run Electron directly for this local pilot; Forge loads the installer configuration.
    & '.\node_modules\.bin\electron.cmd' .
    if ($LASTEXITCODE -ne 0) { throw 'SerKal konnte nicht gestartet werden.' }
} finally {
    if ($pilot -and -not $pilot.HasExited) { Stop-Process -Id $pilot.Id -ErrorAction SilentlyContinue }
    $env:SERKAL_LOCAL_TMDB_PILOT = $previousPilot
    $env:TMDB_API_KEY = $previousKey
}
