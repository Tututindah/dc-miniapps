#include "chunk_terrain.h"
#include <cmath>
#include <algorithm>

ChunkTerrain::ChunkTerrain(int chunkSize, int maxHeight, int renderDistance)
    : chunkSize_(chunkSize), maxHeight_(maxHeight), renderDistance_(renderDistance) {
    lastPlayerChunk_ = {0, 0};
}

ChunkTerrain::~ChunkTerrain() {
    for (auto& pair : chunks_) {
        delete pair.second;
    }
    chunks_.clear();
}

ChunkCoord ChunkTerrain::worldToChunk(float x, float z) const {
    return {
        static_cast<int>(std::floor(x / (chunkSize_ * 2.0f))),
        static_cast<int>(std::floor(z / (chunkSize_ * 2.0f)))
    };
}

float ChunkTerrain::noise2D(float x, float z) const {
    // Simple noise function
    float n = std::sin(x * 0.05f) * std::cos(z * 0.05f) * 10.0f +
              std::sin(x * 0.1f + z * 0.1f) * 5.0f +
              std::sin(x * 0.2f) * std::cos(z * 0.15f) * 3.0f;
    return n;
}

float ChunkTerrain::fbmNoise(float x, float z, int octaves) const {
    float total = 0.0f;
    float frequency = 1.0f;
    float amplitude = 1.0f;
    float maxValue = 0.0f;
    
    for (int i = 0; i < octaves; i++) {
        total += noise2D(x * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5f;
        frequency *= 2.0f;
    }
    
    return total / maxValue;
}

BiomeType ChunkTerrain::getBiomeAt(float x, float z) const {
    float biomeNoise = std::sin(x * 0.01f) * std::cos(z * 0.01f);
    float temperature = std::sin(x * 0.02f + z * 0.02f);
    
    if (biomeNoise < -0.3f) return BiomeType::WATER;
    if (biomeNoise > 0.5f && temperature > 0.3f) return BiomeType::LAVA;
    if (biomeNoise > 0.3f) return BiomeType::MOUNTAINS;
    return BiomeType::PLAINS;
}

void ChunkTerrain::generateChunk(const ChunkCoord& coord) {
    Chunk* chunk = new Chunk();
    chunk->coord = coord;
    chunk->isGenerated = true;
    
    int startX = coord.x * chunkSize_;
    int startZ = coord.z * chunkSize_;
    
    for (int x = 0; x < chunkSize_; x++) {
        for (int z = 0; z < chunkSize_; z++) {
            int worldX = startX + x;
            int worldZ = startZ + z;
            
            BiomeType biome = getBiomeAt(static_cast<float>(worldX), static_cast<float>(worldZ));
            chunk->biome = biome;
            
            int height = 0;
            Color color;
            
            switch (biome) {
                case BiomeType::WATER:
                    height = std::max(1, static_cast<int>(fbmNoise(worldX, worldZ, 2) * 2.0f + 3.0f));
                    for (int y = 0; y < height; y++) {
                        chunk->blockPositions.push_back(Vec3(worldX * 2.0f, y * 2.0f, worldZ * 2.0f));
                        if (y == height - 1) {
                            chunk->blockColors.push_back(Color(0.2f, 0.4f, 0.8f, 0.7f)); // Water
                        } else {
                            chunk->blockColors.push_back(Color(0.6f, 0.5f, 0.4f)); // Sand
                        }
                    }
                    break;
                    
                case BiomeType::LAVA:
                    height = std::max(1, static_cast<int>(fbmNoise(worldX, worldZ, 2) * 3.0f + 4.0f));
                    for (int y = 0; y < height; y++) {
                        chunk->blockPositions.push_back(Vec3(worldX * 2.0f, y * 2.0f, worldZ * 2.0f));
                        if (y == height - 1) {
                            chunk->blockColors.push_back(Color(1.0f, 0.3f, 0.0f)); // Lava
                        } else {
                            chunk->blockColors.push_back(Color(0.3f, 0.3f, 0.3f)); // Obsidian
                        }
                    }
                    break;
                    
                case BiomeType::MOUNTAINS:
                    height = std::max(2, static_cast<int>(fbmNoise(worldX, worldZ, 3) * 8.0f + 6.0f));
                    height = std::min(height, maxHeight_);
                    for (int y = 0; y < height; y++) {
                        chunk->blockPositions.push_back(Vec3(worldX * 2.0f, y * 2.0f, worldZ * 2.0f));
                        if (y == height - 1) {
                            if (y > 20) {
                                chunk->blockColors.push_back(Color(0.9f, 0.9f, 0.95f)); // Snow
                            } else if (y > 10) {
                                chunk->blockColors.push_back(Color(0.5f, 0.5f, 0.5f)); // Stone
                            } else {
                                chunk->blockColors.push_back(Color(0.4f, 0.7f, 0.4f)); // Grass
                            }
                        } else {
                            chunk->blockColors.push_back(Color(0.5f, 0.5f, 0.5f)); // Stone
                        }
                    }
                    break;
                    
                case BiomeType::PLAINS:
                default:
                    height = std::max(1, static_cast<int>(fbmNoise(worldX, worldZ, 2) * 2.0f + 3.0f));
                    for (int y = 0; y < height; y++) {
                        chunk->blockPositions.push_back(Vec3(worldX * 2.0f, y * 2.0f, worldZ * 2.0f));
                        if (y == height - 1) {
                            chunk->blockColors.push_back(Color(0.4f, 0.86f, 0.51f)); // Grass
                        } else if (y > height - 3) {
                            chunk->blockColors.push_back(Color(0.57f, 0.39f, 0.27f)); // Dirt
                        } else {
                            chunk->blockColors.push_back(Color(0.5f, 0.5f, 0.5f)); // Stone
                        }
                    }
                    break;
            }
        }
    }
    
    chunks_[coord] = chunk;
}

void ChunkTerrain::update(const Vec3& playerPos) {
    ChunkCoord playerChunk = worldToChunk(playerPos.x, playerPos.z);
    
    // Generate chunks around player
    for (int x = -renderDistance_; x <= renderDistance_; x++) {
        for (int z = -renderDistance_; z <= renderDistance_; z++) {
            ChunkCoord coord = {playerChunk.x + x, playerChunk.z + z};
            
            if (chunks_.find(coord) == chunks_.end()) {
                generateChunk(coord);
            }
        }
    }
    
    // Unload distant chunks
    unloadDistantChunks(playerPos);
    
    lastPlayerChunk_ = playerChunk;
}

void ChunkTerrain::unloadDistantChunks(const Vec3& playerPos) {
    ChunkCoord playerChunk = worldToChunk(playerPos.x, playerPos.z);
    int unloadDistance = renderDistance_ + 2;
    
    auto it = chunks_.begin();
    while (it != chunks_.end()) {
        int dx = it->first.x - playerChunk.x;
        int dz = it->first.z - playerChunk.z;
        int dist = std::max(std::abs(dx), std::abs(dz));
        
        if (dist > unloadDistance) {
            delete it->second;
            it = chunks_.erase(it);
        } else {
            ++it;
        }
    }
}

void ChunkTerrain::render(Renderer& renderer, const Vec3& cameraPos) {
    renderer.beginBatch();
    
    // Only render chunks within visible range of camera (not all loaded chunks)
    int viewDistance = 2; // Only render 2 chunks around camera for mobile performance
    ChunkCoord cameraChunk = worldToChunk(cameraPos.x, cameraPos.z);
    
    int renderedChunks = 0;
    for (auto& pair : chunks_) {
        Chunk* chunk = pair.second;
        if (!chunk->isGenerated) continue;
        
        // Distance-based culling - only render nearby chunks
        int dx = pair.first.x - cameraChunk.x;
        int dz = pair.first.z - cameraChunk.z;
        int chunkDist = std::max(std::abs(dx), std::abs(dz));
        
        if (chunkDist > viewDistance) continue; // Skip distant chunks
        
        // Render this chunk's blocks
        for (size_t i = 0; i < chunk->blockPositions.size(); i++) {
            renderer.addCubeToBatch(chunk->blockPositions[i], Vec3(2, 2, 2), chunk->blockColors[i]);
        }
        renderedChunks++;
    }
    
    renderer.endBatch();
}

float ChunkTerrain::getHeightAt(float x, float z) const {
    ChunkCoord coord = worldToChunk(x, z);
    auto it = chunks_.find(coord);
    
    if (it == chunks_.end()) {
        // Chunk not loaded, estimate height
        BiomeType biome = getBiomeAt(x, z);
        switch (biome) {
            case BiomeType::WATER: return 6.0f;
            case BiomeType::LAVA: return 8.0f;
            case BiomeType::MOUNTAINS: return 30.0f;
            case BiomeType::PLAINS:
            default: return 10.0f;
        }
    }
    
    // Find highest block at this position
    int blockX = static_cast<int>(x / 2.0f);
    int blockZ = static_cast<int>(z / 2.0f);
    float maxY = 0.0f;
    
    for (const Vec3& pos : it->second->blockPositions) {
        int bx = static_cast<int>(pos.x / 2.0f);
        int bz = static_cast<int>(pos.z / 2.0f);
        
        if (bx == blockX && bz == blockZ) {
            maxY = std::max(maxY, pos.y + 2.0f);
        }
    }
    
    return maxY;
}
