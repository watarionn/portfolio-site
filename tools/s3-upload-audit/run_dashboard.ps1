$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONPATH=Join-Path $root 'src'
& py -3 -m s3_upload_audit.gui
exit $LASTEXITCODE
