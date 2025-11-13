#pragma once

#include "renderer.h"
#include "dragon.h"
#include "terrain.h"
#include "chunk_terrain.h"

struct InputState {
    bool forward;
    bool backward;
    bool left;
    bool right;
    bool jump;
    bool fly;
};

class PlayerController {
public:
    PlayerController(ChunkTerrain& terrain);
    ~PlayerController();
    
    void update(float deltaTime, const InputState& input);
    void render(Renderer& renderer);
    
    Vec3 getPosition() const { return position_; }
    void setPosition(const Vec3& pos) { position_ = pos; }
    
    VoxelDragon& getDragon() { return dragon_; }
    
    void setDragonColor(const Color& color);
    
private:
    ChunkTerrain& terrain_;
    VoxelDragon dragon_;
    
    Vec3 position_;
    Vec3 velocity_;
    
    float moveSpeed_;
    float flySpeed_;
    float gravity_;
    float jumpForce_;
    
    bool isFlying_;
    bool isGrounded_;
};
