[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

function Invoke-Checked([string]$Label, [scriptblock]$Command) {
    Write-Host $Label
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Label failed: $LASTEXITCODE" }
}

Push-Location $Root
try {
    Invoke-Checked '[1/10] Public boundary' { python tools/validate_public_repo.py }
    Invoke-Checked '[2/10] Portfolio City contract' { python tools/check_portfolio_city_contract.py }
    Invoke-Checked '[3/10] Portfolio City runtime' { node tools/check_portfolio_city_runtime.mjs }
    Invoke-Checked '[4/10] MADORI contract' { python tools/check_madori_contract.py }
    Invoke-Checked '[5/10] Sphere contract' { python tools/check_sphere_contract.py }
    Invoke-Checked '[6/10] Prime Dot Art contract' { python tools/check_prime_dot_art_contract.py }
    Invoke-Checked '[7/10] Prime Dot Art runtime' { node tools/check_prime_dot_art_runtime.mjs }
    Invoke-Checked '[8/10] Build deployment artifact' { python tools/build_deployment.py }

    Write-Host '[9/10] JavaScript and PHP syntax'
    Get-ChildItem build\public_html -Recurse -File |
        Where-Object { $_.Extension -in '.js', '.mjs' } |
        ForEach-Object {
            node --check $_.FullName
            if ($LASTEXITCODE -ne 0) { throw "JavaScript syntax failed: $($_.FullName)" }
        }

    $Mount = (Resolve-Path build\public_html).Path
    docker run --rm -v "$($Mount):/work" -w /work php:8.4-cli sh -c "find . -type f -name '*.php' -print0 | xargs -0 -r -n 1 php -l"
    if ($LASTEXITCODE -ne 0) { throw 'PHP syntax check failed' }

    Invoke-Checked '[10/10] Exact SHA-256 inventory' { python tools/write_public_inventory.py }
    Invoke-Checked '[10/10] Deployment script preflight' { python scripts/deploy_production.py --preflight }

    Write-Output 'LOCAL_MERGE_VALIDATION_PASS'
}
finally {
    Pop-Location
}
