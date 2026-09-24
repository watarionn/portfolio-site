param(
  [Parameter(Mandatory=$true,Position=0)][string]$Archive,
  [string]$Output
)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PYTHONPATH=Join-Path $root 'src'
$argsList=@('-m','mkpdf_safe.cli','convert',$Archive)
if($Output){$argsList += @('-o',$Output)}
& py -3 @argsList
exit $LASTEXITCODE
