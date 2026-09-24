$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONPATH=Join-Path $root 'src'
& py -3 -m mkpdf_safe.gui
exit $LASTEXITCODE
