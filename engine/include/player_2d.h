#pragma once

#include "renderer.h"
#include "dragon.h"
#include "terrain_2d.h"

struct InputState {
    bool left;
    bool right;
    bool jump;
};

class PlayerController2D {
public:
    PlayerController2D(Terrain2D& terrain);
    ~PlayerController2D();
    
    void update(float deltaTime, const InputState& input);
    void render(Renderer& renderer);
    
    Vec3 getPosition() const { return position_; }
    void setPosition(const Vec3& pos) { position_ = pos; }
    
    VoxelDragon& getDragon() { return dragon_; }
    void setDragonColor(const Color& color);
    
private:
    Terrain2D& terrain_;
    VoxelDragon dragon_;
    
    Vec3 position_;
    Vec3 velocity_;
    
    float moveSpeed_;
    float gravity_;
    float jumpForce_;
    
    bool isGrounded_;
    bool facingRight_;
};
