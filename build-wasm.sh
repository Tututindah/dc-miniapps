#!/bin/bash
# Build script for Unix/macOS/Linux

echo "=== Dragon City WASM Build Script ==="
echo ""

# Step 1: Activate Emscripten
echo "[1/4] Activating Emscripten SDK..."
cd ~/emsdk
source ./emsdk_env.sh

echo "✓ Emscripten activated"
echo ""

# Step 2: Navigate to engine directory
echo "[2/4] Setting up build directory..."
cd ~/Documents/WORK/dc-miniapps/engine
rm -rf build
mkdir build
cd build

echo "✓ Build directory ready"
echo ""

# Step 3: Configure with CMake
echo "[3/4] Configuring project with CMake..."
emcmake cmake ..

echo "✓ Project configured"
echo ""

# Step 4: Build
echo "[4/4] Compiling C++ to WebAssembly..."
emmake make

echo "✓ Build complete!"
echo ""

# Check output
echo "=== Build Output ==="
ls -lh ../public/wasm/dragon_city.*

echo ""
echo "=== Next Steps ==="
echo "1. Update app/play/page.tsx to import WASMGame"
echo "2. Run 'npm run dev'"
echo "3. Test at http://localhost:3000/play"
echo ""
echo "Expected performance: 60 FPS on laptop!"
