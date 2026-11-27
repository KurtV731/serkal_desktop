$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
if (-not (Test-Path 'node_modules/.bin/electron.cmd')) {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci ist fehlgeschlagen.' }
}
$previousPilot = $env:SERKAL_LOCAL_TMDB_PILOT
$previousKey = $env:TMDB_API_KEY
$previousOauth = $env:SERKAL_GOOGLE_OAUTH_FILE
$pilot = $null
try {
    $secureKey = Read-Host 'TMDB-Entwickler-Key fuer den lokalen Pilot' -AsSecureString
    $env:TMDB_API_KEY = [System.Net.NetworkCredential]::new('', $secureKey).Password
    try {
        $pilot = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList '"5 tools/tmdb-desktop-pilot.mjs"' -NoNewWindow -PassThru
    } finally {
        Remove-Item Env:TMDB_API_KEY -ErrorAction SilentlyContinue
    }
    if (-not $env:SERKAL_GOOGLE_OAUTH_FILE) {
        $candidates = @(
            'C:\ppd\serkal\serkal_dev\serkal_private\google_oauth_client.json',
            'C:\ppd\serkal\serkal_private\google_oauth_client.json',
            'C:\serkal_dev\serkal_private\google_oauth_client.json'
        )
        foreach ($name in @('SerKalDesktop', 'serkal_desktop', 'SerKal Desktop')) {
            $installed = Join-Path $env:LOCALAPPDATA $name
            $candidates += Get-ChildItem -LiteralPath $installed -Directory -Filter 'app-*' -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                ForEach-Object { Join-Path $_.FullName 'resources\google_oauth_client.json' }
        }
        $oauthFile = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
        if ($oauthFile) {
            $env:SERKAL_GOOGLE_OAUTH_FILE = $oauthFile
            Write-Host 'Vorhandene SerKal-Google-Konfiguration fuer diesen Start gefunden.'
        } else {
            Write-Host 'Keine SerKal-Google-Konfiguration gefunden. TMDB-Suche ist moeglich, Google-Speichern ggf. nicht.'
        }
    }
    $env:SERKAL_LOCAL_TMDB_PILOT = '1'
    # Run Electron directly for this local pilot; Forge loads the installer configuration.
    & '.\node_modules\.bin\electron.cmd' .
    if ($LASTEXITCODE -ne 0) { throw 'SerKal konnte nicht gestartet werden.' }
} finally {
    if ($pilot -and -not $pilot.HasExited) { Stop-Process -Id $pilot.Id -ErrorAction SilentlyContinue }
    $env:SERKAL_LOCAL_TMDB_PILOT = $previousPilot
    $env:TMDB_API_KEY = $previousKey
    $env:SERKAL_GOOGLE_OAUTH_FILE = $previousOauth
}
