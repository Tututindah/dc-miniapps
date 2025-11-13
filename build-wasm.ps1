# Build script for Dragon City C++ WebAssembly Engine

Write-Host "=== Dragon City WASM Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Activate Emscripten
Write-Host "[1/4] Activating Emscripten SDK..." -ForegroundColor Yellow
cd C:\emsdk
python emsdk.py activate latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to activate Emscripten" -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:PATH = "C:\emsdk;C:\emsdk\upstream\emscripten;$env:PATH"
$env:EMSDK = "C:\emsdk"
$env:EM_CONFIG = "C:\emsdk\.emscripten"

Write-Host "✓ Emscripten activated" -ForegroundColor Green
Write-Host ""

# Step 2: Navigate to engine directory
Write-Host "[2/4] Setting up build directory..." -ForegroundColor Yellow
cd C:\Users\tutut\Documents\WORK\dc-miniapps\engine

if (Test-Path "build") {
    Remove-Item -Recurse -Force build
}
New-Item -ItemType Directory -Path build | Out-Null
cd build

Write-Host "✓ Build directory ready" -ForegroundColor Green
Write-Host ""

# Step 3: Configure with CMake
Write-Host "[3/4] Configuring project with CMake..." -ForegroundColor Yellow
& C:\emsdk\upstream\emscripten\emcmake.bat cmake ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: CMake configuration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Project configured" -ForegroundColor Green
Write-Host ""

# Step 4: Build
Write-Host "[4/4] Compiling C++ to WebAssembly..." -ForegroundColor Yellow
& C:\emsdk\upstream\emscripten\emmake.bat make

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build complete!" -ForegroundColor Green
Write-Host ""

# Check output
Write-Host "=== Build Output ===" -ForegroundColor Cyan
if (Test-Path "..\public\wasm\dragon_city.js") {
    $jsSize = (Get-Item "..\public\wasm\dragon_city.js").Length / 1KB
    Write-Host "dragon_city.js: $([math]::Round($jsSize, 2)) KB" -ForegroundColor Green
}

if (Test-Path "..\public\wasm\dragon_city.wasm") {
    $wasmSize = (Get-Item "..\public\wasm\dragon_city.wasm").Length / 1KB
    Write-Host "dragon_city.wasm: $([math]::Round($wasmSize, 2)) KB" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Update app/play/page.tsx to import WASMGame instead of ThreeJSGame"
Write-Host "2. Run 'npm run dev' to start the server"
Write-Host "3. Test at http://localhost:3000/play"
Write-Host ""
Write-Host "Expected performance: 60 FPS on laptop!" -ForegroundColor Green
