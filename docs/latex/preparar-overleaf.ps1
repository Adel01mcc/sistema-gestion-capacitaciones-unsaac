[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$raizInforme = $PSScriptRoot
$raizRepositorio = (Resolve-Path -LiteralPath (Join-Path $raizInforme '..\..')).Path
$archivosCodigo = @(
  'server/db.js',
  'server/security.js',
  'server/services/training-service.js'
)
$registros = @()
foreach ($rutaRelativa in $archivosCodigo) {
  $origen = Join-Path $raizRepositorio $rutaRelativa
  if (-not (Test-Path -LiteralPath $origen -PathType Leaf)) {
    throw "No se encuentra el archivo real requerido: $rutaRelativa"
  }
  $destino = Join-Path (Join-Path $raizInforme 'codigo') $rutaRelativa
  $carpetaDestino = Split-Path -Parent $destino
  New-Item -ItemType Directory -Path $carpetaDestino -Force | Out-Null
  Copy-Item -LiteralPath $origen -Destination $destino -Force
  $hash = (Get-FileHash -LiteralPath $origen -Algorithm SHA256).Hash
  $registros += "$hash  codigo/$rutaRelativa"
}

$carpetaDiagramas = Join-Path $raizInforme 'diagramas'
New-Item -ItemType Directory -Path $carpetaDiagramas -Force | Out-Null
$fuentesDiagramas = Join-Path $raizRepositorio 'docs\diagramas'
foreach ($archivo in Get-ChildItem -LiteralPath $fuentesDiagramas -Filter '*.mmd' -File) {
  $destino = Join-Path $carpetaDiagramas $archivo.Name
  Copy-Item -LiteralPath $archivo.FullName -Destination $destino -Force
  $hash = (Get-FileHash -LiteralPath $archivo.FullName -Algorithm SHA256).Hash
  $registros += "$hash  diagramas/$($archivo.Name)"
}

$manifiesto = Join-Path $raizInforme 'FUENTES_SHA256.txt'
foreach ($nombre in @('v1-escritorio.png', 'v1-movil.png')) {
  $origen = Join-Path $raizRepositorio "docs/evidencias/$nombre"
  if (Test-Path -LiteralPath $origen -PathType Leaf) {
    Copy-Item -LiteralPath $origen -Destination (Join-Path $raizInforme "imagenes/$nombre") -Force
    $registros += "$( (Get-FileHash -LiteralPath $origen -Algorithm SHA256).Hash )  imagenes/$nombre"
  }
}
Set-Content -LiteralPath $manifiesto -Value $registros -Encoding utf8
Write-Output 'Fuentes reales copiadas para Overleaf; manifiesto SHA-256 actualizado.'
Write-Output 'Subir el contenido de docs/latex como proyecto y seleccionar XeLaTeX.'
