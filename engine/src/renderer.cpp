#include "renderer.h"
#include <cstring>
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <string>

// Vertex shader source (GLSL ES 1.00 for better compatibility)
const char* vertexShaderSource = R"(
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec4 vColor;
varying vec3 vNormal;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vColor = aColor;
    vNormal = mat3(uModel) * aNormal;
}
)";

// Fragment shader source (GLSL ES 1.00)
const char* fragmentShaderSource = R"(
precision highp float;

varying vec4 vColor;
varying vec3 vNormal;

void main() {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 norm = normalize(vNormal);
    float diff = max(dot(norm, lightDir), 0.0);
    
    vec3 ambient = 0.6 * vColor.rgb;
    vec3 diffuse = 0.4 * diff * vColor.rgb;
    
    gl_FragColor = vec4(ambient + diffuse, vColor.a);
}
)";

// Texture shader (GLSL ES 1.00)
const char* textureVertexShaderSource = R"(
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec2 vTexCoord;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vTexCoord = aTexCoord;
}
)";

const char* textureFragmentShaderSource = R"(
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vTexCoord);
}
)";

Renderer::Renderer() 
    : width_(0), height_(0), shaderProgram_(0), textureShaderProgram_(0),
      vao_(0), vbo_(0), ebo_(0), texVao_(0), texVbo_(0), texEbo_(0),
      batchIndexOffset_(0), texBatchIndexOffset_(0), currentBatchTexture_(0) {}

Renderer::~Renderer() {
    if (shaderProgram_) glDeleteProgram(shaderProgram_);
    if (textureShaderProgram_) glDeleteProgram(textureShaderProgram_);
    if (vao_) glDeleteVertexArrays(1, &vao_);
    if (texVao_) glDeleteVertexArrays(1, &texVao_);
    if (vbo_) glDeleteBuffers(1, &vbo_);
    if (texVbo_) glDeleteBuffers(1, &texVbo_);
    if (ebo_) glDeleteBuffers(1, &ebo_);
    if (texEbo_) glDeleteBuffers(1, &texEbo_);
}

bool Renderer::initialize(int width, int height) {
    width_ = width;
    height_ = height;
    
    emscripten_run_script("console.log('[C++] 🎨 Creating WebGL context...')");
    
    // Verify canvas exists
    bool canvasExists = EM_ASM_INT({
        var canvas = Module['canvas'];
        if (!canvas) {
            console.error('[JS] Module.canvas is not set!');
            return 0;
        }
        console.log('[JS] Canvas element found:', canvas.id, canvas.width + 'x' + canvas.height);
        return 1;
    });
    
    if (!canvasExists) {
        emscripten_run_script("console.error('[C++] ❌ Canvas element not found in Module!')");
        return false;
    }
    
    // Create WebGL 1.0 context (better compatibility than WebGL 2)
    EmscriptenWebGLContextAttributes attrs;
    emscripten_webgl_init_context_attributes(&attrs);
    attrs.majorVersion = 1;
    attrs.minorVersion = 0;
    attrs.depth = true;
    attrs.stencil = false;
    attrs.antialias = true;
    attrs.alpha = false;
    
    // Use "#canvas" selector instead of 0/NULL
    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE ctx = emscripten_webgl_create_context("#canvas", &attrs);
    if (ctx <= 0) {
        emscripten_run_script(("console.error('[C++] ❌ Failed to create WebGL context! Error code: " + std::to_string(ctx) + "')").c_str());
        return false;
    }
    
    EMSCRIPTEN_RESULT res = emscripten_webgl_make_context_current(ctx);
    if (res != EMSCRIPTEN_RESULT_SUCCESS) {
        emscripten_run_script("console.error('[C++] ❌ Failed to make context current!')");
        return false;
    }
    
    emscripten_run_script("console.log('[C++] ✅ WebGL context created successfully')");
    
    // Set viewport
    glViewport(0, 0, width, height);
    emscripten_run_script(("console.log('[C++] 📐 Viewport set to " + std::to_string(width) + "x" + std::to_string(height) + "')").c_str());
    
    // Create shader program
    emscripten_run_script("console.log('[C++] 🔨 Compiling shaders...')");
    createShaderProgram();
    
    // Generate buffers
    glGenVertexArrays(1, &vao_);
    glGenBuffers(1, &vbo_);
    glGenBuffers(1, &ebo_);
    
    glGenVertexArrays(1, &texVao_);
    glGenBuffers(1, &texVbo_);
    glGenBuffers(1, &texEbo_);
    
    emscripten_run_script("console.log('[C++] 📦 Buffers created')");
    
    // Create texture shader program
    createTextureShaderProgram();
    
    // Enable depth test and blending for textures
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_CULL_FACE);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    
    emscripten_run_script("console.log('[C++] ✅ Renderer initialized successfully')");
    
    return true;
}

void Renderer::createShaderProgram() {
    GLuint vertShader = compileShader(GL_VERTEX_SHADER, vertexShaderSource);
    GLuint fragShader = compileShader(GL_FRAGMENT_SHADER, fragmentShaderSource);
    
    shaderProgram_ = glCreateProgram();
    glAttachShader(shaderProgram_, vertShader);
    glAttachShader(shaderProgram_, fragShader);
    glLinkProgram(shaderProgram_);
    
    // Check linking status
    GLint success;
    glGetProgramiv(shaderProgram_, GL_LINK_STATUS, &success);
    if (!success) {
        emscripten_run_script("console.error('[C++] Shader program linking failed')");
    } else {
        emscripten_run_script("console.log('[C++] ✅ Shader program linked successfully')");
    }
    
    glDeleteShader(vertShader);
    glDeleteShader(fragShader);
    
    // Get uniform locations
    viewMatrixLoc_ = glGetUniformLocation(shaderProgram_, "uView");
    projMatrixLoc_ = glGetUniformLocation(shaderProgram_, "uProjection");
    modelMatrixLoc_ = glGetUniformLocation(shaderProgram_, "uModel");
}

GLuint Renderer::compileShader(GLenum type, const char* source) {
    GLuint shader = glCreateShader(type);
    glShaderSource(shader, 1, &source, nullptr);
    glCompileShader(shader);
    
    // Check compilation status
    GLint success;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        const char* shaderType = (type == GL_VERTEX_SHADER) ? "Vertex" : "Fragment";
        emscripten_run_script(shaderType == "Vertex" ? 
            "console.error('[C++] Vertex shader compilation failed')" :
            "console.error('[C++] Fragment shader compilation failed')");
    }
    
    return shader;
}

void Renderer::clear(const Color& color) {
    glClearColor(color.r, color.g, color.b, color.a);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
}

void Renderer::setViewMatrix(const float* matrix) {
    glUseProgram(shaderProgram_);
    glUniformMatrix4fv(viewMatrixLoc_, 1, GL_FALSE, matrix);
}

void Renderer::setProjectionMatrix(const float* matrix) {
    glUseProgram(shaderProgram_);
    glUniformMatrix4fv(projMatrixLoc_, 1, GL_FALSE, matrix);
}

void Renderer::drawCube(const Vec3& position, const Vec3& size, const Color& color) {
    float hw = size.x * 0.5f, hh = size.y * 0.5f, hd = size.z * 0.5f;
    
    Vertex vertices[] = {
        // Front
        {{-hw, -hh, hd}, {0, 0, 1}, color}, {{hw, -hh, hd}, {0, 0, 1}, color},
        {{hw, hh, hd}, {0, 0, 1}, color}, {{-hw, hh, hd}, {0, 0, 1}, color},
        // Back
        {{-hw, -hh, -hd}, {0, 0, -1}, color}, {{hw, -hh, -hd}, {0, 0, -1}, color},
        {{hw, hh, -hd}, {0, 0, -1}, color}, {{-hw, hh, -hd}, {0, 0, -1}, color},
        // Top
        {{-hw, hh, -hd}, {0, 1, 0}, color}, {{hw, hh, -hd}, {0, 1, 0}, color},
        {{hw, hh, hd}, {0, 1, 0}, color}, {{-hw, hh, hd}, {0, 1, 0}, color},
        // Bottom
        {{-hw, -hh, -hd}, {0, -1, 0}, color}, {{hw, -hh, -hd}, {0, -1, 0}, color},
        {{hw, -hh, hd}, {0, -1, 0}, color}, {{-hw, -hh, hd}, {0, -1, 0}, color},
        // Right
        {{hw, -hh, -hd}, {1, 0, 0}, color}, {{hw, -hh, hd}, {1, 0, 0}, color},
        {{hw, hh, hd}, {1, 0, 0}, color}, {{hw, hh, -hd}, {1, 0, 0}, color},
        // Left
        {{-hw, -hh, -hd}, {-1, 0, 0}, color}, {{-hw, -hh, hd}, {-1, 0, 0}, color},
        {{-hw, hh, hd}, {-1, 0, 0}, color}, {{-hw, hh, -hd}, {-1, 0, 0}, color},
    };
    
    unsigned int indices[] = {
        0, 1, 2, 2, 3, 0,       // Front
        6, 5, 4, 4, 7, 6,       // Back
        8, 9, 10, 10, 11, 8,    // Top
        14, 13, 12, 12, 15, 14, // Bottom
        16, 17, 18, 18, 19, 16, // Right
        22, 21, 20, 20, 23, 22  // Left
    };
    
    // Model matrix (translation)
    float modelMatrix[16] = {
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        position.x, position.y, position.z, 1
    };
    
    glUseProgram(shaderProgram_);
    glUniformMatrix4fv(modelMatrixLoc_, 1, GL_FALSE, modelMatrix);
    
    glBindVertexArray(vao_);
    
    glBindBuffer(GL_ARRAY_BUFFER, vbo_);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo_);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    
    // Position
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
    glEnableVertexAttribArray(0);
    
    // Normal
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, normal));
    glEnableVertexAttribArray(1);
    
    // Color
    glVertexAttribPointer(2, 4, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, color));
    glEnableVertexAttribArray(2);
    
    glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0);
}

void Renderer::present() {
    // WebGL automatically presents
}

void Renderer::beginBatch() {
    batchVertices_.clear();
    batchIndices_.clear();
    batchIndexOffset_ = 0;
}

void Renderer::addCubeToBatch(const Vec3& position, const Vec3& size, const Color& color) {
    float hw = size.x * 0.5f, hh = size.y * 0.5f, hd = size.z * 0.5f;
    
    // Define cube vertices (24 vertices - 4 per face for proper normals)
    Vertex cubeVerts[] = {
        // Front face (Z+)
        {{position.x - hw, position.y - hh, position.z + hd}, {0, 0, 1}, color},
        {{position.x + hw, position.y - hh, position.z + hd}, {0, 0, 1}, color},
        {{position.x + hw, position.y + hh, position.z + hd}, {0, 0, 1}, color},
        {{position.x - hw, position.y + hh, position.z + hd}, {0, 0, 1}, color},
        // Back face (Z-)
        {{position.x - hw, position.y - hh, position.z - hd}, {0, 0, -1}, color},
        {{position.x + hw, position.y - hh, position.z - hd}, {0, 0, -1}, color},
        {{position.x + hw, position.y + hh, position.z - hd}, {0, 0, -1}, color},
        {{position.x - hw, position.y + hh, position.z - hd}, {0, 0, -1}, color},
        // Top face (Y+)
        {{position.x - hw, position.y + hh, position.z - hd}, {0, 1, 0}, color},
        {{position.x + hw, position.y + hh, position.z - hd}, {0, 1, 0}, color},
        {{position.x + hw, position.y + hh, position.z + hd}, {0, 1, 0}, color},
        {{position.x - hw, position.y + hh, position.z + hd}, {0, 1, 0}, color},
        // Bottom face (Y-)
        {{position.x - hw, position.y - hh, position.z - hd}, {0, -1, 0}, color},
        {{position.x + hw, position.y - hh, position.z - hd}, {0, -1, 0}, color},
        {{position.x + hw, position.y - hh, position.z + hd}, {0, -1, 0}, color},
        {{position.x - hw, position.y - hh, position.z + hd}, {0, -1, 0}, color},
        // Right face (X+)
        {{position.x + hw, position.y - hh, position.z - hd}, {1, 0, 0}, color},
        {{position.x + hw, position.y - hh, position.z + hd}, {1, 0, 0}, color},
        {{position.x + hw, position.y + hh, position.z + hd}, {1, 0, 0}, color},
        {{position.x + hw, position.y + hh, position.z - hd}, {1, 0, 0}, color},
        // Left face (X-)
        {{position.x - hw, position.y - hh, position.z - hd}, {-1, 0, 0}, color},
        {{position.x - hw, position.y - hh, position.z + hd}, {-1, 0, 0}, color},
        {{position.x - hw, position.y + hh, position.z + hd}, {-1, 0, 0}, color},
        {{position.x - hw, position.y + hh, position.z - hd}, {-1, 0, 0}, color},
    };
    
    // Add vertices
    for (int i = 0; i < 24; i++) {
        batchVertices_.push_back(cubeVerts[i]);
    }
    
    // Define indices for 6 faces (2 triangles each)
    unsigned int cubeIndices[] = {
        0, 1, 2, 2, 3, 0,       // Front
        6, 5, 4, 4, 7, 6,       // Back
        8, 9, 10, 10, 11, 8,    // Top
        14, 13, 12, 12, 15, 14, // Bottom
        16, 17, 18, 18, 19, 16, // Right
        22, 21, 20, 20, 23, 22  // Left
    };
    
    // Add indices with offset
    for (int i = 0; i < 36; i++) {
        batchIndices_.push_back(cubeIndices[i] + batchIndexOffset_);
    }
    
    batchIndexOffset_ += 24;
}

void Renderer::endBatch() {
    if (batchVertices_.empty()) return;
    
    // Identity model matrix (all positions already world-space)
    float modelMatrix[16] = {
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    };
    
    glUseProgram(shaderProgram_);
    glUniformMatrix4fv(modelMatrixLoc_, 1, GL_FALSE, modelMatrix);
    
    glBindVertexArray(vao_);
    
    // Upload batched data
    glBindBuffer(GL_ARRAY_BUFFER, vbo_);
    glBufferData(GL_ARRAY_BUFFER, batchVertices_.size() * sizeof(Vertex), batchVertices_.data(), GL_STATIC_DRAW);
    
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo_);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, batchIndices_.size() * sizeof(unsigned int), batchIndices_.data(), GL_STATIC_DRAW);
    
    // Set up vertex attributes
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
    glEnableVertexAttribArray(0);
    
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, normal));
    glEnableVertexAttribArray(1);
    
    glVertexAttribPointer(2, 4, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, color));
    glEnableVertexAttribArray(2);
    
    // Single draw call for all batched cubes!
    glDrawElements(GL_TRIANGLES, batchIndices_.size(), GL_UNSIGNED_INT, 0);
}

void Renderer::createTextureShaderProgram() {
    GLuint vertShader = compileShader(GL_VERTEX_SHADER, textureVertexShaderSource);
    GLuint fragShader = compileShader(GL_FRAGMENT_SHADER, textureFragmentShaderSource);
    
    textureShaderProgram_ = glCreateProgram();
    glAttachShader(textureShaderProgram_, vertShader);
    glAttachShader(textureShaderProgram_, fragShader);
    glLinkProgram(textureShaderProgram_);
    
    GLint success;
    glGetProgramiv(textureShaderProgram_, GL_LINK_STATUS, &success);
    if (!success) {
        emscripten_run_script("console.error('[C++] Texture shader program linking failed')");
    } else {
        emscripten_run_script("console.log('[C++] ✅ Texture shader program linked')");
    }
    
    glDeleteShader(vertShader);
    glDeleteShader(fragShader);
    
    texViewMatrixLoc_ = glGetUniformLocation(textureShaderProgram_, "uView");
    texProjMatrixLoc_ = glGetUniformLocation(textureShaderProgram_, "uProjection");
    texModelMatrixLoc_ = glGetUniformLocation(textureShaderProgram_, "uModel");
    texSamplerLoc_ = glGetUniformLocation(textureShaderProgram_, "uTexture");
}

GLuint Renderer::loadTexture(int width, int height, const unsigned char* data) {
    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
    
    emscripten_run_script(("console.log('[C++] 🖼️ Texture loaded: " + std::to_string(width) + "x" + std::to_string(height) + " ID=" + std::to_string(texture) + "')").c_str());
    
    return texture;
}

void Renderer::drawTexturedQuad(const Vec3& position, const Vec3& size, GLuint texture) {
    float hw = size.x * 0.5f;
    float hh = size.y * 0.5f;
    
    TexVertex vertices[] = {
        {{position.x - hw, position.y - hh, position.z}, 0.0f, 1.0f}, // Bottom-left
        {{position.x + hw, position.y - hh, position.z}, 1.0f, 1.0f}, // Bottom-right
        {{position.x + hw, position.y + hh, position.z}, 1.0f, 0.0f}, // Top-right
        {{position.x - hw, position.y + hh, position.z}, 0.0f, 0.0f}  // Top-left
    };
    
    unsigned int indices[] = {0, 1, 2, 2, 3, 0};
    
    float modelMatrix[16] = {1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1};
    
    glUseProgram(textureShaderProgram_);
    glUniformMatrix4fv(texModelMatrixLoc_, 1, GL_FALSE, modelMatrix);
    glUniform1i(texSamplerLoc_, 0);
    
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture);
    
    glBindVertexArray(texVao_);
    
    glBindBuffer(GL_ARRAY_BUFFER, texVbo_);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, texEbo_);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    
    // Position attribute
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(TexVertex), (void*)0);
    glEnableVertexAttribArray(0);
    
    // TexCoord attribute
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, sizeof(TexVertex), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}

void Renderer::addTexturedQuadToBatch(const Vec3& position, const Vec3& size, GLuint texture) {
    if (currentBatchTexture_ == 0) {
        currentBatchTexture_ = texture;
    } else if (currentBatchTexture_ != texture) {
        // Flush current batch and start new one
        // For simplicity, just draw immediately for now
        drawTexturedQuad(position, size, texture);
        return;
    }
    
    float hw = size.x * 0.5f;
    float hh = size.y * 0.5f;
    
    TexVertex verts[] = {
        {{position.x - hw, position.y - hh, position.z}, 0.0f, 1.0f},
        {{position.x + hw, position.y - hh, position.z}, 1.0f, 1.0f},
        {{position.x + hw, position.y + hh, position.z}, 1.0f, 0.0f},
        {{position.x - hw, position.y + hh, position.z}, 0.0f, 0.0f}
    };
    
    for (int i = 0; i < 4; i++) {
        texBatchVertices_.push_back(verts[i]);
    }
    
    unsigned int baseIdx = texBatchIndexOffset_;
    texBatchIndices_.push_back(baseIdx + 0);
    texBatchIndices_.push_back(baseIdx + 1);
    texBatchIndices_.push_back(baseIdx + 2);
    texBatchIndices_.push_back(baseIdx + 2);
    texBatchIndices_.push_back(baseIdx + 3);
    texBatchIndices_.push_back(baseIdx + 0);
    
    texBatchIndexOffset_ += 4;
}
