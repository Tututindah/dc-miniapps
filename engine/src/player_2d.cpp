#include "player_2d.h"
#include <cmath>

PlayerController2D::PlayerController2D(Terrain2D& terrain)
    : terrain_(terrain),
      dragon_(Color(220, 20, 60)),
      position_(10.0f, 20.0f, 0.0f),
      velocity_(0, 0, 0),
      moveSpeed_(10.0f),
      gravity_(30.0f),
      jumpForce_(15.0f),
      isGrounded_(false),
      facingRight_(true) {
}

PlayerController2D::~PlayerController2D() {
}

void PlayerController2D::update(float deltaTime, const InputState& input) {
    // Horizontal movement
    velocity_.x = 0;
    
    if (input.left) {
        velocity_.x = -moveSpeed_;
        facingRight_ = false;
    }
    if (input.right) {
        velocity_.x = moveSpeed_;
        facingRight_ = true;
    }
    
    // Gravity
    velocity_.y -= gravity_ * deltaTime;
    
    // Jump
    if (input.jump && isGrounded_) {
        velocity_.y = jumpForce_;
        isGrounded_ = false;
    }
    
    // Apply velocity
    position_.x += velocity_.x * deltaTime;
    position_.y += velocity_.y * deltaTime;
    
    // Collision detection with terrain
    int tileX = (int)(position_.x / 2.0f);
    int tileY = (int)(position_.y / 2.0f);
    
    // Ground collision
    isGrounded_ = false;
    if (terrain_.isSolid(tileX, tileY - 1) || terrain_.isPlatform(tileX, tileY - 1)) {
        if (velocity_.y < 0) {
            position_.y = (float)(tileY) * 2.0f + 2.0f;
            velocity_.y = 0;
            isGrounded_ = true;
        }
    }
    
    // Platform collision from below
    if (terrain_.isPlatform(tileX, tileY) && velocity_.y > 0) {
        position_.y = (float)(tileY) * 2.0f - 0.1f;
        velocity_.y = 0;
    }
    
    // Ceiling collision
    if (terrain_.isSolid(tileX, tileY + 1)) {
        if (velocity_.y > 0) {
            velocity_.y = 0;
        }
    }
    
    // Wall collision
    if (terrain_.isSolid(tileX + 1, tileY) && velocity_.x > 0) {
        position_.x = (float)(tileX) * 2.0f + 1.0f;
        velocity_.x = 0;
    }
    if (terrain_.isSolid(tileX - 1, tileY) && velocity_.x < 0) {
        position_.x = (float)(tileX) * 2.0f + 1.0f;
        velocity_.x = 0;
    }
    
    // Keep in bounds
    if (position_.x < 0) position_.x = 0;
    if (position_.x > terrain_.getWidth() * 2.0f) position_.x = terrain_.getWidth() * 2.0f;
    if (position_.y < 0) {
        position_.y = 0;
        velocity_.y = 0;
    }
    
    // Update dragon animation
    Vec3 animVelocity = velocity_;
    animVelocity.z = 0; // No Z movement in 2D
    dragon_.setVelocity(animVelocity);
    
    // Set animation state
    if (!isGrounded_) {
        dragon_.setAnimState(DragonAnimState::FLYING); // Use flying for jumping
    }
    
    dragon_.update(deltaTime);
}

void PlayerController2D::render(Renderer& renderer) {
    // Render dragon at player position
    // Flip dragon based on facing direction
    dragon_.render(renderer, position_);
}

void PlayerController2D::setDragonColor(const Color& color) {
    dragon_.setColor(color);
}
