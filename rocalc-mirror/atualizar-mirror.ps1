# Re-baixa https://www.rocalc.cc/ e todos os .js/.css/.ico referenciados no index.
# Execute na pasta deste script:  powershell -ExecutionPolicy Bypass -File .\atualizar-mirror.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$base = "https://www.rocalc.cc/"

$html = Invoke-WebRequest -Uri $base -UseBasicParsing
[System.IO.File]::WriteAllText((Join-Path $root "index.html"), $html.Content, [System.Text.UTF8Encoding]::new($false))

$assets = [regex]::Matches($html.Content, '(?:href|src)="([^"]+)"') |
  ForEach-Object { $_.Groups[1].Value } |
  Where-Object {
    $_ -notmatch '^https?://' -and $_ -notmatch '^//' -and
    $_ -ne '' -and $_ -ne '/'
  } |
  Sort-Object -Unique

foreach ($a in $assets) {
  $url = if ($a.StartsWith("/")) { "https://www.rocalc.cc$a" } else { $base.TrimEnd("/") + "/" + $a.TrimStart("/") }
  $local = Join-Path $root ($a -replace '^\./', '')
  $dir = Split-Path $local -Parent
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Write-Host "GET $url"
  Invoke-WebRequest -Uri $url -OutFile $local -UseBasicParsing
}

Write-Host "Concluido. Abra index.html no navegador (alguns recursos podem ainda apontar para o site)."
