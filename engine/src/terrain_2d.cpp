#include "terrain_2d.h"
#include <cmath>
#include <cstdlib>

Terrain2D::Terrain2D(int width, int height) 
    : width_(width), height_(height), village_(nullptr) {
    tiles_.resize(height);
    for (int y = 0; y < height; y++) {
        tiles_[y].resize(width);
    }
    village_ = new Village();
    generate();
}

Terrain2D::~Terrain2D() {
    delete village_;
}

float noise2D(float x, float y) {
    int n = (int)x + (int)y * 57;
    n = (n << 13) ^ n;
    return (1.0f - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0f);
}

void Terrain2D::generate() {
    generateTerrain();
    addPlatforms();
    addObstacles();
    addVillage();
}

void Terrain2D::generateTerrain() {
    // Fill with air
    for (int y = 0; y < height_; y++) {
        for (int x = 0; x < width_; x++) {
            tiles_[y][x].type = TileType::AIR;
            tiles_[y][x].color = Color(135, 206, 235); // Sky blue
        }
    }
    
    // Generate ground with varying height
    for (int x = 0; x < width_; x++) {
        float n = noise2D(x * 0.1f, 0) * 0.5f + noise2D(x * 0.05f, 100) * 0.5f;
        int groundHeight = 8 + (int)(n * 4.0f); // Height 8-12
        
        for (int y = 0; y < groundHeight; y++) {
            if (y == groundHeight - 1) {
                // Grass top
                setTile(x, y, TileType::GROUND, Color(34, 139, 34));
            } else if (y >= groundHeight - 4) {
                // Dirt
                setTile(x, y, TileType::GROUND, Color(139, 69, 19));
            } else {
                // Stone
                setTile(x, y, TileType::GROUND, Color(128, 128, 128));
            }
        }
        
        // Add lava patches randomly
        if (rand() % 20 == 0 && x > 10) {
            int lavaWidth = 2 + rand() % 3;
            for (int lx = 0; lx < lavaWidth && x + lx < width_; lx++) {
                setTile(x + lx, 0, TileType::LAVA, Color(255, 69, 0));
                setTile(x + lx, 1, TileType::LAVA, Color(255, 69, 0));
            }
        }
    }
}

void Terrain2D::addPlatforms() {
    // Add floating platforms
    for (int i = 0; i < 15; i++) {
        int x = 10 + rand() % (width_ - 20);
        int y = 12 + rand() % 8; // Height 12-20
        int platformWidth = 3 + rand() % 5;
        
        for (int px = 0; px < platformWidth && x + px < width_; px++) {
            setTile(x + px, y, TileType::PLATFORM, Color(101, 67, 33)); // Brown platform
        }
    }
}

void Terrain2D::addVillage() {
    // Place village around x=50-80
    int villageStartX = 50;
    int groundY = getGroundHeight(villageStartX);
    
    // Flatten ground for village (make platform)
    for (int x = villageStartX - 5; x < villageStartX + 50; x++) {
        if (x >= 0 && x < width_) {
            // Clear space above ground
            for (int y = groundY; y < height_; y++) {
                setTile(x, y, TileType::AIR, Color(135, 206, 235));
            }
            // Set flat ground level
            for (int y = 0; y < groundY; y++) {
                if (y == groundY - 1) {
                    setTile(x, y, TileType::GROUND, Color(34, 139, 34)); // Grass
                } else if (y >= groundY - 4) {
                    setTile(x, y, TileType::GROUND, Color(139, 69, 19)); // Dirt
                } else {
                    setTile(x, y, TileType::GROUND, Color(128, 128, 128)); // Stone
                }
            }
        }
    }
    
    // Generate village buildings
    village_->generate((float)villageStartX * 2.0f, (float)groundY * 2.0f, 5);
}

void Terrain2D::addObstacles() {
    // Add obstacles (spikes, pillars, etc)
    for (int i = 0; i < 10; i++) {
        int x = 5 + rand() % (width_ - 10);
        int groundY = getGroundHeight(x);
        
        if (groundY > 0 && getTileType(x, groundY) != TileType::LAVA) {
            // Add pillar obstacle
            int pillarHeight = 2 + rand() % 4;
            for (int py = 0; py < pillarHeight; py++) {
                setTile(x, groundY + py, TileType::OBSTACLE, Color(64, 64, 64)); // Dark gray
            }
        }
    }
}

void Terrain2D::render(Renderer& renderer, float cameraX) {
    int startX = (int)(cameraX / 2.0f) - 20;
    int endX = startX + 60;
    
    if (startX < 0) startX = 0;
    if (endX > width_) endX = width_;
    
    renderer.beginBatch();
    
    // Render terrain tiles
    for (int x = startX; x < endX; x++) {
        for (int y = 0; y < height_; y++) {
            const Tile& tile = tiles_[y][x];
            
            if (tile.type != TileType::AIR) {
                // Render as cube with 2D positioning
                Vec3 pos((float)x * 2.0f, (float)y * 2.0f, 0);
                renderer.addCubeToBatch(pos, Vec3(2.0f, 2.0f, 2.0f), tile.color);
            }
        }
    }
    
    // Render village buildings
    if (village_) {
        village_->render(renderer, cameraX);
    }
    
    renderer.endBatch();
}

bool Terrain2D::isSolid(int x, int y) const {
    if (x < 0 || x >= width_ || y < 0 || y >= height_) return false;
    TileType type = tiles_[y][x].type;
    return type == TileType::GROUND || type == TileType::OBSTACLE;
}

bool Terrain2D::isPlatform(int x, int y) const {
    if (x < 0 || x >= width_ || y < 0 || y >= height_) return false;
    return tiles_[y][x].type == TileType::PLATFORM;
}

int Terrain2D::getGroundHeight(int x) const {
    if (x < 0 || x >= width_) return 0;
    
    for (int y = height_ - 1; y >= 0; y--) {
        if (isSolid(x, y)) {
            return y;
        }
    }
    return 0;
}

TileType Terrain2D::getTileType(int x, int y) const {
    if (x < 0 || x >= width_ || y < 0 || y >= height_) return TileType::AIR;
    return tiles_[y][x].type;
}

void Terrain2D::setTile(int x, int y, TileType type, const Color& color) {
    if (x >= 0 && x < width_ && y >= 0 && y < height_) {
        tiles_[y][x].type = type;
        tiles_[y][x].color = color;
    }
}
