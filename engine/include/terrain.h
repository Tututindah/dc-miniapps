#pragma once

#include "renderer.h"
#include <vector>

enum class BlockType {
    AIR,
    GRASS,
    DIRT,
    STONE
};

struct Block {
    BlockType type;
    Vec3 position;
};

class VoxelTerrain {
public:
    VoxelTerrain(int size = 10, int maxHeight = 3);
    ~VoxelTerrain();
    
    void generate();
    void render(Renderer& renderer);
    
    float getHeightAt(float x, float z) const;
    bool isColliding(const Vec3& position, float radius) const;
    
private:
    float noise(float x, float z) const;
    void addBlock(BlockType type, int x, int y, int z);
    Color getBlockColor(BlockType type) const;
    
    int size_;
    int maxHeight_;
    std::vector<Block> blocks_;
};
