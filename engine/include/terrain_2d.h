#pragma once

#include "renderer.h"
#include "village.h"
#include <vector>

enum class TileType {
    AIR,
    GROUND,
    PLATFORM,
    OBSTACLE,
    LAVA
};

struct Tile {
    TileType type;
    Color color;
};

class Terrain2D {
public:
    Terrain2D(int width, int height);
    ~Terrain2D();
    
    void generate();
    void render(Renderer& renderer, float cameraX);
    
    bool isSolid(int x, int y) const;
    bool isPlatform(int x, int y) const;
    int getGroundHeight(int x) const;
    
    int getWidth() const { return width_; }
    int getHeight() const { return height_; }
    
    Village* getVillage() { return village_; }
    
private:
    int width_;
    int height_;
    std::vector<std::vector<Tile>> tiles_;
    Village* village_;
    
    void generateTerrain();
    void addPlatforms();
    void addObstacles();
    void addVillage();
    
    TileType getTileType(int x, int y) const;
    void setTile(int x, int y, TileType type, const Color& color);
};
