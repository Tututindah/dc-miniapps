#include "dragon.h"
#include <cmath>

VoxelDragon::VoxelDragon(const Color& color) 
    : color_(color), 
      animState_(DragonAnimState::IDLE),
      velocity_(0, 0, 0),
      wingAngle_(0),
      walkCycle_(0),
      breathCycle_(0),
      attackTimer_(0),
      currentWingFlap_(0),
      currentTailSway_(0),
      currentHeadBob_(0),
      currentLegOffset_(0) {
    createDragon();
}

VoxelDragon::~VoxelDragon() {}

void VoxelDragon::createDragon() {
    parts_.clear();
    
    Color darker(color_.r * 0.8f, color_.g * 0.8f, color_.b * 0.8f);
    Color accent(1.0f, 0.92f, 0.23f); // Yellow
    Color wingColor(color_.r * 0.6f, color_.g * 0.6f, color_.b * 0.6f, 0.8f);
    
    DragonPart part;
    
    // Body
    part.position = Vec3(0, 1, 0);
    part.size = Vec3(3, 2, 4);
    part.color = color_;
    parts_.push_back(part);
    
    // Neck
    part.position = Vec3(0, 2, 2);
    part.size = Vec3(1.5f, 1.5f, 2);
    part.color = color_;
    parts_.push_back(part);
    
    // Head
    part.position = Vec3(0, 3, 3.5f);
    part.size = Vec3(2, 1.5f, 1.5f);
    part.color = color_;
    part.isHead = true;
    parts_.push_back(part);
    part.isHead = false;
    
    // Eyes
    part.position = Vec3(-0.6f, 3.3f, 4);
    part.size = Vec3(0.4f, 0.4f, 0.3f);
    part.color = accent;
    parts_.push_back(part);
    
    part.position = Vec3(0.6f, 3.3f, 4);
    parts_.push_back(part);
    
    // Tail segments (with animation flag)
    for (int i = 0; i < 3; i++) {
        float offset = -1.5f - i * 1.3f;
        float scale = 1.0f - i * 0.2f;
        part.position = Vec3(0, 0.8f - i * 0.1f, offset);
        part.size = Vec3(scale, 0.8f - i * 0.1f, 1.3f);
        part.color = color_;
        part.isTail = true;
        parts_.push_back(part);
        part.isTail = false;
    }
    
    // Wings (animated)
    part.position = Vec3(-2.5f, 1.8f, 0);
    part.size = Vec3(1.5f, 0.2f, 3);
    part.color = wingColor;
    part.isWing = true;
    parts_.push_back(part);
    
    part.position = Vec3(2.5f, 1.8f, 0);
    parts_.push_back(part);
    part.isWing = false;
    
    // Legs (animated when walking)
    Vec3 legPositions[] = {
        Vec3(-1.2f, -0.2f, 1.5f),   // Front left
        Vec3(1.2f, -0.2f, 1.5f),    // Front right
        Vec3(-1.2f, -0.2f, -1.5f),  // Back left
        Vec3(1.2f, -0.2f, -1.5f)    // Back right
    };
    
    for (int i = 0; i < 4; i++) {
        part.position = legPositions[i];
        part.size = Vec3(0.8f, 1.8f, 0.8f);
        part.color = darker;
        part.isLeg = true;
        part.legIndex = i;
        parts_.push_back(part);
        part.isLeg = false;
    }
}

void VoxelDragon::addCube(const Vec3& pos, const Vec3& size, const Color& color) {
    DragonPart part;
    part.position = pos;
    part.size = size;
    part.color = color;
    parts_.push_back(part);
}

void VoxelDragon::updateAnimation(float deltaTime) {
    // Detect movement
    float speed = std::sqrt(velocity_.x * velocity_.x + velocity_.z * velocity_.z);
    
    // Auto set animation state based on movement
    if (speed > 0.01f && animState_ == DragonAnimState::IDLE) {
        animState_ = DragonAnimState::WALKING;
    } else if (speed < 0.01f && animState_ == DragonAnimState::WALKING) {
        animState_ = DragonAnimState::IDLE;
    }
    
    switch (animState_) {
        case DragonAnimState::IDLE:
            // Gentle breathing
            breathCycle_ += deltaTime * 2.0f;
            currentHeadBob_ = std::sin(breathCycle_) * 0.1f;
            currentWingFlap_ = std::sin(breathCycle_ * 0.5f) * 0.05f;
            currentTailSway_ = std::sin(breathCycle_ * 0.8f) * 0.15f;
            currentLegOffset_ = 0.0f;
            break;
            
        case DragonAnimState::WALKING:
            // Walking animation
            walkCycle_ += deltaTime * 8.0f;
            currentHeadBob_ = std::sin(walkCycle_) * 0.2f;
            currentWingFlap_ = std::sin(walkCycle_ * 0.5f) * 0.1f;
            currentTailSway_ = std::sin(walkCycle_ * 0.7f) * 0.3f;
            currentLegOffset_ = std::sin(walkCycle_) * 0.4f;
            break;
            
        case DragonAnimState::FLYING:
            // Flying animation - strong wing flap
            wingAngle_ += deltaTime * 5.0f;
            currentWingFlap_ = std::sin(wingAngle_) * 0.5f;
            currentTailSway_ = std::sin(wingAngle_ * 0.6f) * 0.2f;
            currentHeadBob_ = std::sin(wingAngle_ * 0.4f) * 0.15f;
            currentLegOffset_ = -0.3f; // Legs tucked
            break;
            
        case DragonAnimState::ATTACKING:
            // Attack animation
            attackTimer_ += deltaTime * 10.0f;
            currentHeadBob_ = std::sin(attackTimer_) * 0.5f;
            currentWingFlap_ = std::sin(attackTimer_ * 2.0f) * 0.3f;
            if (attackTimer_ > 3.14159f) {
                animState_ = DragonAnimState::IDLE;
                attackTimer_ = 0.0f;
            }
            break;
    }
}

void VoxelDragon::update(float deltaTime) {
    updateAnimation(deltaTime);
}

void VoxelDragon::render(Renderer& renderer, const Vec3& position) {
    renderer.beginBatch();
    
    for (const auto& part : parts_) {
        Vec3 animatedPos = part.position;
        
        // Apply wing animation
        if (part.isWing) {
            animatedPos.y += currentWingFlap_;
        }
        
        // Apply tail animation
        if (part.isTail) {
            animatedPos.x += currentTailSway_;
        }
        
        // Apply head bob
        if (part.isHead) {
            animatedPos.y += currentHeadBob_;
        }
        
        // Apply leg animation
        if (part.isLeg) {
            if (part.legIndex == 0 || part.legIndex == 3) {
                // Front left and back right move together
                animatedPos.y += currentLegOffset_;
            } else {
                // Front right and back left move together
                animatedPos.y -= currentLegOffset_;
            }
        }
        
        Vec3 worldPos = position + animatedPos;
        renderer.addCubeToBatch(worldPos, part.size, part.color);
    }
    
    renderer.endBatch();
}
