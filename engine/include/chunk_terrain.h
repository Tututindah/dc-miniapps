#pragma once

#include "renderer.h"
#include <vector>
#include <map>
#include <cmath>

enum class BiomeType {
    PLAINS,
    MOUNTAINS,
    WATER,
    LAVA
};

struct ChunkCoord {
    int x, z;
    
    bool operator<(const ChunkCoord& other) const {
        if (x != other.x) return x < other.x;
        return z < other.z;
    }
};

struct Chunk {
    ChunkCoord coord;
    std::vector<Vec3> blockPositions;
    std::vector<Color> blockColors;
    BiomeType biome;
    bool isGenerated;
    
    Chunk() : biome(BiomeType::PLAINS), isGenerated(false) {}
};

class ChunkTerrain {
public:
    ChunkTerrain(int chunkSize = 16, int maxHeight = 32, int renderDistance = 3);
    ~ChunkTerrain();
    
    void update(const Vec3& playerPos);
    void render(Renderer& renderer, const Vec3& cameraPos);
    
    float getHeightAt(float x, float z) const;
    BiomeType getBiomeAt(float x, float z) const;
    
private:
    void generateChunk(const ChunkCoord& coord);
    void unloadDistantChunks(const Vec3& playerPos);
    ChunkCoord worldToChunk(float x, float z) const;
    bool isChunkInViewRange(const ChunkCoord& chunkCoord, const Vec3& cameraPos, int viewDistance) const;
    
    float noise2D(float x, float z) const;
    float fbmNoise(float x, float z, int octaves) const;
    
    int chunkSize_;
    int maxHeight_;
    int renderDistance_;
    
    std::map<ChunkCoord, Chunk*> chunks_;
    ChunkCoord lastPlayerChunk_;
};
