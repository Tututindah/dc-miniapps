#include "player.h"

PlayerController::PlayerController(ChunkTerrain& terrain)
    : terrain_(terrain),
      dragon_(Color(0.23f, 0.51f, 0.96f)),
      position_(0, 10, 0),
      velocity_(0, 0, 0),
      moveSpeed_(0.3f),
      flySpeed_(0.4f),
      gravity_(0.02f),
      jumpForce_(0.5f),
      isFlying_(false),
      isGrounded_(false) {}

PlayerController::~PlayerController() {}

void PlayerController::update(float deltaTime, const InputState& input) {
    // Toggle flying
    isFlying_ = input.fly;
    
    // Camera-relative movement (fixed movement directions)
    Vec3 movement(0, 0, 0);
    
    // Forward/backward movement (Z-axis)
    if (input.forward) movement.z += 1.0f;
    if (input.backward) movement.z -= 1.0f;
    
    // Left/right movement (X-axis) - A=left, D=right
    if (input.left) movement.x += 1.0f;
    if (input.right) movement.x -= 1.0f;
    
    // Normalize diagonal movement
    float len = std::sqrt(movement.x * movement.x + movement.z * movement.z);
    if (len > 0.001f) {
        movement.x /= len;
        movement.z /= len;
    }
    
    float speed = isFlying_ ? flySpeed_ : moveSpeed_;
    velocity_.x = movement.x * speed;
    velocity_.z = movement.z * speed;
    
    // Flying mode
    if (isFlying_) {
        velocity_.y = 0;
        if (input.jump) velocity_.y = flySpeed_;
    } else {
        // Gravity
        velocity_.y -= gravity_;
        
        // Jump
        if (input.jump && isGrounded_) {
            velocity_.y = jumpForce_;
        }
    }
    
    // Apply velocity
    position_ = position_ + velocity_;
    
    // Terrain collision
    float terrainHeight = terrain_.getHeightAt(position_.x, position_.z);
    isGrounded_ = false;
    
    if (position_.y <= terrainHeight && !isFlying_) {
        position_.y = terrainHeight;
        velocity_.y = 0;
        isGrounded_ = true;
    }
    
    // Update dragon animation with current velocity
    dragon_.setVelocity(velocity_);
    
    // Set animation state based on flying mode
    if (isFlying_) {
        dragon_.setAnimState(DragonAnimState::FLYING);
    }
    
    dragon_.update(deltaTime);
}

void PlayerController::render(Renderer& renderer) {
    dragon_.render(renderer, position_);
}

void PlayerController::setDragonColor(const Color& color) {
    dragon_.setColor(color);
}
