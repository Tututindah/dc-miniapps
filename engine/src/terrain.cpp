#include "terrain.h"
#include <cmath>

VoxelTerrain::VoxelTerrain(int size, int maxHeight) 
    : size_(size), maxHeight_(maxHeight) {
    generate();
}

VoxelTerrain::~VoxelTerrain() {}

float VoxelTerrain::noise(float x, float z) const {
    float n = std::sin(x * 0.1f) * std::cos(z * 0.1f) +
              std::sin(x * 0.05f + z * 0.05f) * 2.0f;
    return n;
}

void VoxelTerrain::generate() {
    blocks_.clear();
    
    int halfSize = size_ / 2;
    
    for (int x = -halfSize; x < halfSize; x++) {
        for (int z = -halfSize; z < halfSize; z++) {
            float heightNoise = noise(static_cast<float>(x), static_cast<float>(z));
            int baseHeight = static_cast<int>(heightNoise * 1.5f + 2.0f);
            int height = std::max(1, std::min(maxHeight_, baseHeight));
            
            for (int y = 0; y < height; y++) {
                BlockType type = (y == height - 1) ? BlockType::GRASS : BlockType::DIRT;
                addBlock(type, x, y, z);
            }
        }
    }
}

void VoxelTerrain::addBlock(BlockType type, int x, int y, int z) {
    Block block;
    block.type = type;
    block.position = Vec3(static_cast<float>(x * 2), static_cast<float>(y * 2), static_cast<float>(z * 2));
    blocks_.push_back(block);
}

Color VoxelTerrain::getBlockColor(BlockType type) const {
    switch (type) {
        case BlockType::GRASS: return Color(0.4f, 0.86f, 0.51f);
        case BlockType::DIRT: return Color(0.57f, 0.39f, 0.27f);
        case BlockType::STONE: return Color(0.42f, 0.44f, 0.50f);
        default: return Color(1, 1, 1);
    }
}

void VoxelTerrain::render(Renderer& renderer) {
    renderer.beginBatch();
    
    for (const auto& block : blocks_) {
        if (block.type == BlockType::AIR) continue;
        
        Color color = getBlockColor(block.type);
        renderer.addCubeToBatch(block.position, Vec3(2, 2, 2), color);
    }
    
    renderer.endBatch(); // Single draw call for entire terrain!
}

float VoxelTerrain::getHeightAt(float x, float z) const {
    int blockX = static_cast<int>(x / 2.0f);
    int blockZ = static_cast<int>(z / 2.0f);
    
    float maxY = 0;
    for (const auto& block : blocks_) {
        int bx = static_cast<int>(block.position.x / 2.0f);
        int bz = static_cast<int>(block.position.z / 2.0f);
        
        if (bx == blockX && bz == blockZ) {
            maxY = std::max(maxY, block.position.y + 2.0f);
        }
    }
    
    return maxY;
}

bool VoxelTerrain::isColliding(const Vec3& position, float radius) const {
    for (const auto& block : blocks_) {
        if (block.type == BlockType::AIR) continue;
        
        Vec3 blockMin = block.position - Vec3(1, 1, 1);
        Vec3 blockMax = block.position + Vec3(1, 1, 1);
        
        Vec3 closest = Vec3(
            std::max(blockMin.x, std::min(position.x, blockMax.x)),
            std::max(blockMin.y, std::min(position.y, blockMax.y)),
            std::max(blockMin.z, std::min(position.z, blockMax.z))
        );
        
        Vec3 diff = position - closest;
        if (diff.length() < radius) {
            return true;
        }
    }
    
    return false;
}
