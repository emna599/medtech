# MedTech - crée la base "medtech" (si besoin) et la remplit avec les mêmes données pour toute l'équipe.
# Usage (PowerShell, depuis la racine du dépôt) :  .\database\setup.ps1
# ATTENTION : supprime et recrée toutes les tables de la base "medtech".
param(
    [string]$User = "postgres",
    [string]$DbName = "medtech"
)

$ErrorActionPreference = "Stop"

# Cherche psql : dans le PATH, sinon dans les dossiers d'installation habituels.
$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) {
    $psql = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $psql) {
    Write-Host "psql introuvable. Installe PostgreSQL ou ajoute son dossier bin au PATH." -ForegroundColor Red
    exit 1
}

$confirm = Read-Host "Cela efface les tables de la base '$DbName'. Continuer ? (o/N)"
if ($confirm -ne "o") { Write-Host "Annulé."; exit 0 }

# Mot de passe demandé une seule fois, jamais écrit dans un fichier.
$secure = Read-Host "Mot de passe PostgreSQL de '$User'" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

try {
    $exists = & $psql -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
    if (-not $exists) {
        & $psql -U $User -d postgres -c "CREATE DATABASE $DbName"
    }
    & $psql -U $User -d $DbName -f (Join-Path $PSScriptRoot "setup.sql")
    Write-Host "Base '$DbName' prête : 3 comptes de démo, 6 chambres, 8 résidents." -ForegroundColor Green
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
