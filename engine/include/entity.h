#pragma once

#include "renderer.h"
#include "combat.h"
#include <vector>

// Entity types
enum class EntityType {
    PLAYER,
    FRIENDLY_DRAGON,
    ENEMY_DRAGON,
    ENEMY_GOBLIN,
    NPC_VILLAGER
};

// AI States
enum class AIState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK,
    FLEE
};

// Base Entity class
class Entity {
public:
    Entity(EntityType type, const Vec3& position);
    virtual ~Entity() = default;
    
    // Core properties
    Vec3 getPosition() const { return position_; }
    void setPosition(const Vec3& pos) { position_ = pos; }
    EntityType getType() const { return type_; }
    bool isAlive() const { return combat_.getHealth() > 0; }
    
    // Combat
    CombatComponent& getCombat() { return combat_; }
    const CombatComponent& getCombat() const { return combat_; }
    
    // Update & Render
    virtual void update(float deltaTime, const Vec3& playerPos);
    virtual void render(class Renderer& renderer);
    
    // AI
    AIState getAIState() const { return aiState_; }
    void setAIState(AIState state) { aiState_ = state; }
    
protected:
    EntityType type_;
    Vec3 position_;
    Vec3 velocity_;
    CombatComponent combat_;
    AIState aiState_;
    float aiTimer_;
    Vec3 patrolTarget_;
    
    // AI behaviors
    void updateAI(float deltaTime, const Vec3& playerPos);
    void moveTowards(const Vec3& target, float speed, float deltaTime);
    float distanceTo(const Vec3& target) const;
};

// Dragon Entity (can be friendly or enemy)
class DragonEntity : public Entity {
public:
    DragonEntity(EntityType type, const Vec3& position, const Color& color);
    
    void render(Renderer& renderer) override;
    void setColor(const Color& color) { color_ = color; }
    
private:
    Color color_;
    float wingFlap_;
};

// Goblin Enemy
class GoblinEntity : public Entity {
public:
    GoblinEntity(const Vec3& position);
    void render(Renderer& renderer) override;
    
private:
    float animTimer_;
};

// Entity Manager
class EntityManager {
public:
    EntityManager();
    ~EntityManager();
    
    // Entity management
    void addDragon(EntityType type, const Vec3& position, const Color& color);
    void addGoblin(const Vec3& position);
    void removeDeadEntities();
    
    // Update & Render
    void update(float deltaTime, const Vec3& playerPos);
    void render(Renderer& renderer);
    
    // Collision/Attack
    Entity* getEntityInRange(const Vec3& position, float range, EntityType excludeType);
    std::vector<Entity*> getEntitiesInRange(const Vec3& position, float range);
    
    // Queries
    int getEntityCount() const { return entities_.size(); }
    Entity* getEntity(int index);
    
private:
    std::vector<Entity*> entities_;
};
