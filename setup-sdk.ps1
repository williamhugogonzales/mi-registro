$androidSdkPath = Join-Path $env:LOCALAPPDATA "Android\Sdk"
if (-not (Test-Path $androidSdkPath)) {
    New-Item -ItemType Directory -Path $androidSdkPath -Force | Out-Null
    Write-Host "Created SDK directory at: $androidSdkPath"
} else {
    Write-Host "SDK directory already exists at: $androidSdkPath"
}
Write-Host "SDK Path: $androidSdkPath"
