# Remet les donnees de demonstration a la date d'aujourd'hui (repas, medicaments, presences, tables).
# Utilisation, dans PowerShell :  cd C:\Users\pc\backend ; .\database\demo_du_jour.ps1
Set-Location (Split-Path $PSScriptRoot -Parent)
Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item "env:$($matches[1].Trim())" $matches[2].Trim() } }
$env:PGPASSWORD = $env:DB_PASSWORD
$env:PGCLIENTENCODING = 'UTF8'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d medtech -f database\install_personnel.sql
Write-Host "Termine. Rechargez la page (Ctrl+F5)."
