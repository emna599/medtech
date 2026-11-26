# Initialise la base locale medtech avec le jeu de démonstration commun.
# Attention : la procédure efface les tables MedTech de cette base.
param([string]$User = "postgres")

$ErrorActionPreference = "Stop"
$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) {
    $psql = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $psql) { throw "psql introuvable." }
if ((Read-Host "Cela efface les tables de la base locale medtech. Continuer ? (o/N)") -ne "o") { exit 0 }

function Invoke-Psql {
    & $psql -h localhost -U $User -v ON_ERROR_STOP=1 @args
    if ($LASTEXITCODE -ne 0) { throw "psql a échoué (code $LASTEXITCODE)." }
}

$previousPassword = $env:PGPASSWORD
$secure = Read-Host "Mot de passe PostgreSQL de '$User'" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $exists = Invoke-Psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'medtech'"
    if (-not $exists) {
        Invoke-Psql -d postgres -c "CREATE DATABASE medtech"
    }
    Invoke-Psql -d medtech -f (Join-Path $PSScriptRoot "setup.sql")
    Write-Host "Base locale medtech prête."
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $env:PGPASSWORD = $previousPassword
}
