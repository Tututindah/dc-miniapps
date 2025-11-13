#include "village.h"
#include <cstdlib>
#include <cmath>

Village::Village() {
    // Initialize texture map with 0 (will be set from JS)
    textures_[BuildingType::CASTLE] = 0;
    textures_[BuildingType::FORTRESS] = 0;
    textures_[BuildingType::FARM] = 0;
    textures_[BuildingType::TOWER] = 0;
    textures_[BuildingType::TEMPLE] = 0;
}

Village::~Village() {
}

void Village::setTexture(BuildingType type, GLuint texture) {
    textures_[type] = texture;
}

void Village::generate(float startX, float groundY, int buildingCount) {
    buildings_.clear();
    
    float currentX = startX;
    
    for (int i = 0; i < buildingCount; i++) {
        int buildingType = rand() % 5;
        
        switch (buildingType) {
            case 0: createCastle(currentX, groundY); break;
            case 1: createFortress(currentX, groundY); break;
            case 2: createFarm(currentX, groundY); break;
            case 3: createTower(currentX, groundY); break;
            case 4: createTemple(currentX, groundY); break;
        }
        
        // Space between buildings
        currentX += 16.0f + (rand() % 8);
    }
}

void Village::createCastle(float x, float y) {
    Building castle;
    castle.type = BuildingType::CASTLE;
    castle.position = Vec3(x, y + 12.0f, 0);
    castle.size = Vec3(16.0f, 24.0f, 4.0f);
    castle.texture = textures_[BuildingType::CASTLE];
    castle.textureName = "castle";
    buildings_.push_back(castle);
}

void Village::createFortress(float x, float y) {
    Building fortress;
    fortress.type = BuildingType::FORTRESS;
    fortress.position = Vec3(x, y + 10.0f, 0);
    fortress.size = Vec3(14.0f, 20.0f, 4.0f);
    fortress.texture = textures_[BuildingType::FORTRESS];
    fortress.textureName = "fortress";
    buildings_.push_back(fortress);
}

void Village::createFarm(float x, float y) {
    Building farm;
    farm.type = BuildingType::FARM;
    farm.position = Vec3(x, y + 6.0f, 0);
    farm.size = Vec3(12.0f, 12.0f, 4.0f);
    farm.texture = textures_[BuildingType::FARM];
    farm.textureName = "farm";
    buildings_.push_back(farm);
}

void Village::createTower(float x, float y) {
    Building tower;
    tower.type = BuildingType::TOWER;
    tower.position = Vec3(x, y + 14.0f, 0);
    tower.size = Vec3(6.0f, 28.0f, 4.0f);
    tower.texture = textures_[BuildingType::TOWER];
    tower.textureName = "tower";
    buildings_.push_back(tower);
}

void Village::createTemple(float x, float y) {
    Building temple;
    temple.type = BuildingType::TEMPLE;
    temple.position = Vec3(x, y + 10.0f, 0);
    temple.size = Vec3(14.0f, 20.0f, 4.0f);
    temple.texture = textures_[BuildingType::TEMPLE];
    temple.textureName = "temple";
    buildings_.push_back(temple);
}

void Village::render(Renderer& renderer, float cameraX) {
    for (const Building& building : buildings_) {
        // Only render if in view
        float distFromCamera = std::abs(building.position.x - cameraX);
        if (distFromCamera > 100.0f) continue;
        
        renderBuilding(renderer, building);
    }
}

void Village::renderBuilding(Renderer& renderer, const Building& building) {
    if (building.texture > 0) {
        // Render as textured sprite billboard
        renderer.addTexturedQuadToBatch(building.position, building.size, building.texture);
    } else {
        // Fallback: render as colored cube if texture not loaded yet
        Color fallbackColor;
        switch (building.type) {
            case BuildingType::CASTLE: fallbackColor = Color(0.6f, 0.6f, 0.7f); break;
            case BuildingType::FORTRESS: fallbackColor = Color(0.5f, 0.5f, 0.5f); break;
            case BuildingType::FARM: fallbackColor = Color(0.7f, 0.5f, 0.3f); break;
            case BuildingType::TOWER: fallbackColor = Color(0.4f, 0.4f, 0.5f); break;
            case BuildingType::TEMPLE: fallbackColor = Color(0.9f, 0.9f, 0.8f); break;
        }
        renderer.addCubeToBatch(building.position, building.size, fallbackColor);
    }
}

bool Village::isInside(float x, float y) const {
    for (const Building& building : buildings_) {
        float halfW = building.size.x * 0.5f;
        float halfH = building.size.y * 0.5f;
        
        if (x >= building.position.x - halfW && x <= building.position.x + halfW &&
            y >= building.position.y - halfH && y <= building.position.y + halfH) {
            return true;
        }
    }
    return false;
}
