#pragma once

#include "renderer.h"
#include <vector>
#include <map>
#include <string>

enum class BuildingType {
    CASTLE,
    FORTRESS,
    FARM,
    TOWER,
    TEMPLE
};

struct Building {
    BuildingType type;
    Vec3 position;
    Vec3 size;
    GLuint texture;
    std::string textureName;
};

class Village {
public:
    Village();
    ~Village();
    
    void generate(float startX, float groundY, int buildingCount);
    void render(Renderer& renderer, float cameraX);
    void setTexture(BuildingType type, GLuint texture);
    
    bool isInside(float x, float y) const;
    
private:
    std::vector<Building> buildings_;
    std::map<BuildingType, GLuint> textures_;
    
    void createCastle(float x, float y);
    void createFortress(float x, float y);
    void createFarm(float x, float y);
    void createTower(float x, float y);
    void createTemple(float x, float y);
    
    void renderBuilding(Renderer& renderer, const Building& building);
};
