#pragma once

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

#include <GLES3/gl3.h>
#include <vector>
#include <cmath>

struct Vec3 {
    float x, y, z;
    
    Vec3(float x = 0, float y = 0, float z = 0) : x(x), y(y), z(z) {}
    
    Vec3 operator+(const Vec3& v) const { return Vec3(x + v.x, y + v.y, z + v.z); }
    Vec3 operator-(const Vec3& v) const { return Vec3(x - v.x, y - v.y, z - v.z); }
    Vec3 operator*(float s) const { return Vec3(x * s, y * s, z * s); }
    
    float length() const { return std::sqrt(x*x + y*y + z*z); }
    Vec3 normalize() const { 
        float len = length();
        return len > 0 ? Vec3(x/len, y/len, z/len) : Vec3(0, 0, 0);
    }
};

struct Color {
    float r, g, b, a;
    Color(float r = 1, float g = 1, float b = 1, float a = 1) : r(r), g(g), b(b), a(a) {}
};

struct Vertex {
    Vec3 position;
    Vec3 normal;
    Color color;
};

struct TexVertex {
    Vec3 position;
    float u, v; // texture coordinates
};

class Renderer {
public:
    Renderer();
    ~Renderer();
    
    bool initialize(int width, int height);
    void clear(const Color& color);
    void setViewMatrix(const float* matrix);
    void setProjectionMatrix(const float* matrix);
    
    void drawCube(const Vec3& position, const Vec3& size, const Color& color);
    void drawMesh(const std::vector<Vertex>& vertices, const std::vector<unsigned int>& indices);
    
    // Texture support
    GLuint loadTexture(int width, int height, const unsigned char* data);
    void drawTexturedQuad(const Vec3& position, const Vec3& size, GLuint texture);
    void addTexturedQuadToBatch(const Vec3& position, const Vec3& size, GLuint texture);
    
    // Batched rendering for performance
    void beginBatch();
    void addCubeToBatch(const Vec3& position, const Vec3& size, const Color& color);
    void endBatch();
    
    void present();
    
    int getWidth() const { return width_; }
    int getHeight() const { return height_; }
    
private:
    void createShaderProgram();
    void createTextureShaderProgram();
    GLuint compileShader(GLenum type, const char* source);
    
    int width_;
    int height_;
    GLuint shaderProgram_;
    GLuint textureShaderProgram_;
    GLuint vao_;
    GLuint vbo_;
    GLuint ebo_;
    GLuint texVao_;
    GLuint texVbo_;
    GLuint texEbo_;
    
    GLint viewMatrixLoc_;
    GLint projMatrixLoc_;
    GLint modelMatrixLoc_;
    
    GLint texViewMatrixLoc_;
    GLint texProjMatrixLoc_;
    GLint texModelMatrixLoc_;
    GLint texSamplerLoc_;
    
    // Batching data
    std::vector<Vertex> batchVertices_;
    std::vector<unsigned int> batchIndices_;
    unsigned int batchIndexOffset_;
    
    std::vector<TexVertex> texBatchVertices_;
    std::vector<unsigned int> texBatchIndices_;
    unsigned int texBatchIndexOffset_;
    GLuint currentBatchTexture_;
};
