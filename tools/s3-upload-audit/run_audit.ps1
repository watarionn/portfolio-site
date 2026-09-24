$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONPATH=Join-Path $root 'src'
$config=Join-Path $root 'config.json'
$targets=Join-Path $root 'targets.txt'
if(!(Test-Path $config)){ throw "config.json not found. Copy config.example.json first." }
if(!(Test-Path $targets)){ throw "targets.txt not found. Copy targets.example.txt first." }
& py -3 -m s3_upload_audit.cli --config $config --targets $targets --strict
exit $LASTEXITCODE
