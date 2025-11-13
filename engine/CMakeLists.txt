cmake_minimum_required(VERSION 3.15)
project(DragonCityEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten-specific settings for WebAssembly
if(EMSCRIPTEN)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    
    # Emscripten compiler flags for optimization
    set(EMSCRIPTEN_FLAGS
        -O3
        -s WASM=1
        -s USE_WEBGL2=1
        -s ALLOW_MEMORY_GROWTH=1
        -s EXPORTED_FUNCTIONS=['_main','_init_game','_update_game','_render_game','_handle_input','_cleanup_game','_malloc','_free']
        -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']
        -s MODULARIZE=1
        -s EXPORT_NAME='DragonCityEngine'
        --bind
    )
    
    string(REPLACE ";" " " EMSCRIPTEN_FLAGS_STR "${EMSCRIPTEN_FLAGS}")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EMSCRIPTEN_FLAGS_STR}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${EMSCRIPTEN_FLAGS_STR}")
endif()

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)

# Source files
set(SOURCES
    src/main.cpp
    src/renderer.cpp
    src/terrain.cpp
    src/dragon.cpp
    src/player.cpp
    src/camera.cpp
    src/blockchain.cpp
)

# Create executable
add_executable(dragon_city ${SOURCES})

# Output to public directory for Next.js
set_target_properties(dragon_city PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/../public/wasm"
)
