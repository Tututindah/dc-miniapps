#pragma once

#include "renderer.h"
#include <cmath>

enum class DragonAnimState {
    IDLE,
    WALKING,
    FLYING,
    ATTACKING
};

class VoxelDragon {
public:
    VoxelDragon(const Color& color = Color(0.23f, 0.51f, 0.96f));
    ~VoxelDragon();
    
    void update(float deltaTime);
    void render(Renderer& renderer, const Vec3& position);
    
    void setColor(const Color& color) { color_ = color; }
    Color getColor() const { return color_; }
    
    void setAnimState(DragonAnimState state) { animState_ = state; }
    void setVelocity(const Vec3& velocity) { velocity_ = velocity; }
    
private:
    void createDragon();
    void addCube(const Vec3& pos, const Vec3& size, const Color& color);
    void updateAnimation(float deltaTime);
    
    Color color_;
    DragonAnimState animState_;
    Vec3 velocity_;
    
    // Animation timers
    float wingAngle_;
    float walkCycle_;
    float breathCycle_;
    float attackTimer_;
    
    // Animation values
    float currentWingFlap_;
    float currentTailSway_;
    float currentHeadBob_;
    float currentLegOffset_;
    
    struct DragonPart {
        Vec3 position;
        Vec3 size;
        Color color;
        bool isWing;
        bool isTail;
        bool isHead;
        bool isLeg;
        int legIndex;
        
        DragonPart() : isWing(false), isTail(false), isHead(false), isLeg(false), legIndex(0) {}
    };
    
    std::vector<DragonPart> parts_;
};
