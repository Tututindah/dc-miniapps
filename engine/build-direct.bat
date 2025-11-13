@echo off
REM Direct compilation script for Dragon City WASM engine (no CMake needed)

echo === Building Dragon City C++ WebAssembly Engine ===
echo.

cd C:\Users\tutut\Documents\WORK\dc-miniapps\engine

echo [1/2] Compiling C++ source files...

C:\emsdk\upstream\emscripten\em++.bat ^
  -O3 ^
  -std=c++17 ^
  -s WASM=1 ^
  -s USE_WEBGL2=1 ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_NAME=DragonCityEngine ^
  --bind ^
  -s EXPORTED_FUNCTIONS="['_main','_init_game','_update_game','_render_game','_set_input','_set_dragon_color','_set_attack','_set_weapon','_get_player_health','_get_player_max_health','_get_current_weapon','_get_entity_count','_load_building_texture','_set_village_texture','_cleanup_game']" ^
  -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" ^
  -I include ^
  src/main.cpp ^
  src/renderer.cpp ^
  src/terrain_2d.cpp ^
  src/village.cpp ^
  src/dragon.cpp ^
  src/player_2d.cpp ^
  src/camera.cpp ^
  src/combat.cpp ^
  src/entity.cpp ^
  src/blockchain.cpp ^
  -o ..\public\wasm\dragon_city.js

if %ERRORLEVEL% NEQ 0 (
    echo Error: Build failed
    exit /b 1
)

echo.
echo [2/2] Build complete!
echo.
echo === Output Files ===
dir ..\public\wasm\dragon_city.*
echo.
echo === Next Steps ===
echo 1. Update app/play/page.tsx to use WASMGame
echo 2. Run 'npm run dev'
echo 3. Test at http://localhost:3000/play
echo.
echo Expected: 60 FPS on your laptop!
