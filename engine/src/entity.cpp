#include "entity.h"
#include "renderer.h"
#include <cmath>
#include <algorithm>

// Entity base implementation
Entity::Entity(EntityType type, const Vec3& position)
    : type_(type)
    , position_(position)
    , velocity_(0, 0, 0)
    , combat_(100.0f)
    , aiState_(AIState::IDLE)
    , aiTimer_(0.0f)
    , patrolTarget_(position)
{
    // Set health based on type
    switch (type) {
        case EntityType::FRIENDLY_DRAGON:
            combat_ = CombatComponent(200.0f);
            break;
        case EntityType::ENEMY_DRAGON:
            combat_ = CombatComponent(150.0f);
            break;
        case EntityType::ENEMY_GOBLIN:
            combat_ = CombatComponent(50.0f);
            break;
        default:
            combat_ = CombatComponent(100.0f);
    }
}

void Entity::update(float deltaTime, const Vec3& playerPos) {
    combat_.update(deltaTime);
    
    // Only enemy entities use AI
    if (type_ == EntityType::ENEMY_DRAGON || type_ == EntityType::ENEMY_GOBLIN) {
        updateAI(deltaTime, playerPos);
    }
    
    // Apply gravity and velocity
    velocity_.y -= 9.8f * deltaTime;
    position_.x += velocity_.x * deltaTime;
    position_.y += velocity_.y * deltaTime;
    position_.z += velocity_.z * deltaTime;
    
    // Simple ground collision
    if (position_.y < 1.0f) {
        position_.y = 1.0f;
        velocity_.y = 0;
    }
}

void Entity::updateAI(float deltaTime, const Vec3& playerPos) {
    aiTimer_ += deltaTime;
    float distToPlayer = distanceTo(playerPos);
    
    switch (aiState_) {
        case AIState::IDLE:
            // Switch to patrol after random time
            if (aiTimer_ > 3.0f) {
                aiState_ = AIState::PATROL;
                aiTimer_ = 0;
                // Random patrol point
                patrolTarget_ = Vec3(
                    position_.x + (rand() % 20 - 10),
                    position_.y,
                    position_.z + (rand() % 20 - 10)
                );
            }
            
            // If player close, chase
            if (distToPlayer < 15.0f) {
                aiState_ = AIState::CHASE;
                aiTimer_ = 0;
            }
            break;
            
        case AIState::PATROL:
            moveTowards(patrolTarget_, 3.0f, deltaTime);
            
            // Reached patrol point
            if (distanceTo(patrolTarget_) < 2.0f) {
                aiState_ = AIState::IDLE;
                aiTimer_ = 0;
            }
            
            // Player detected
            if (distToPlayer < 15.0f) {
                aiState_ = AIState::CHASE;
                aiTimer_ = 0;
            }
            break;
            
        case AIState::CHASE:
            moveTowards(playerPos, 5.0f, deltaTime);
            
            // In attack range
            if (distToPlayer < combat_.getAttackRange()) {
                aiState_ = AIState::ATTACK;
                aiTimer_ = 0;
            }
            
            // Lost player
            if (distToPlayer > 25.0f) {
                aiState_ = AIState::IDLE;
                aiTimer_ = 0;
            }
            break;
            
        case AIState::ATTACK:
            // Stop moving, face player
            velocity_.x *= 0.9f;
            velocity_.z *= 0.9f;
            
            // Attack if possible
            if (combat_.canAttack()) {
                combat_.performAttack(combat_.getWeapon());
                // Damage would be applied by collision detection
            }
            
            // Player moved away
            if (distToPlayer > combat_.getAttackRange() * 1.5f) {
                aiState_ = AIState::CHASE;
                aiTimer_ = 0;
            }
            break;
            
        case AIState::FLEE:
            // Move away from player
            Vec3 fleeDir = Vec3(
                position_.x - playerPos.x,
                0,
                position_.z - playerPos.z
            );
            float len = std::sqrt(fleeDir.x * fleeDir.x + fleeDir.z * fleeDir.z);
            if (len > 0.001f) {
                velocity_.x = (fleeDir.x / len) * 6.0f;
                velocity_.z = (fleeDir.z / len) * 6.0f;
            }
            
            // Safe distance
            if (distToPlayer > 20.0f) {
                aiState_ = AIState::IDLE;
                aiTimer_ = 0;
            }
            break;
    }
}

void Entity::moveTowards(const Vec3& target, float speed, float deltaTime) {
    Vec3 dir = Vec3(target.x - position_.x, 0, target.z - position_.z);
    float len = std::sqrt(dir.x * dir.x + dir.z * dir.z);
    
    if (len > 0.1f) {
        velocity_.x = (dir.x / len) * speed;
        velocity_.z = (dir.z / len) * speed;
    } else {
        velocity_.x = 0;
        velocity_.z = 0;
    }
}

float Entity::distanceTo(const Vec3& target) const {
    float dx = target.x - position_.x;
    float dy = target.y - position_.y;
    float dz = target.z - position_.z;
    return std::sqrt(dx*dx + dy*dy + dz*dz);
}

void Entity::render(Renderer& renderer) {
    // Base entity renders as simple cube
    Color entityColor(0.5f, 0.5f, 0.5f);
    renderer.drawCube(position_, Vec3(1, 2, 1), entityColor);
}

// DragonEntity implementation
DragonEntity::DragonEntity(EntityType type, const Vec3& position, const Color& color)
    : Entity(type, position)
    , color_(color)
    , wingFlap_(0.0f)
{
    combat_.setWeapon(WeaponType::FIST);
}

void DragonEntity::render(Renderer& renderer) {
    // Dragon parts added to batch (no beginBatch here - done in EntityManager)
    Vec3 pos = position_;
    
    // Body
    renderer.addCubeToBatch(Vec3(pos.x, pos.y + 1, pos.z), Vec3(2, 1.5f, 3), color_);
    
    // Head
    Color headColor(color_.r * 0.9f, color_.g * 0.9f, color_.b * 0.9f);
    renderer.addCubeToBatch(Vec3(pos.x, pos.y + 1.5f, pos.z + 2), Vec3(1.2f, 1.2f, 1.2f), headColor);
    
    // Eyes
    Color eyeColor(1, 1, 0);
    renderer.addCubeToBatch(Vec3(pos.x - 0.3f, pos.y + 1.7f, pos.z + 2.5f), Vec3(0.2f, 0.2f, 0.2f), eyeColor);
    renderer.addCubeToBatch(Vec3(pos.x + 0.3f, pos.y + 1.7f, pos.z + 2.5f), Vec3(0.2f, 0.2f, 0.2f), eyeColor);
    
    // Tail
    renderer.addCubeToBatch(Vec3(pos.x, pos.y + 0.5f, pos.z - 2), Vec3(0.5f, 0.5f, 1.5f), color_);
    
    // Wings (simple)
    float wingOffset = std::sin(wingFlap_) * 0.3f;
    Color wingColor(color_.r * 0.7f, color_.g * 0.7f, color_.b * 0.7f);
    renderer.addCubeToBatch(Vec3(pos.x - 1.5f, pos.y + 1.5f + wingOffset, pos.z), Vec3(1, 0.1f, 2), wingColor);
    renderer.addCubeToBatch(Vec3(pos.x + 1.5f, pos.y + 1.5f - wingOffset, pos.z), Vec3(1, 0.1f, 2), wingColor);
    
    wingFlap_ += 0.1f;
}

// GoblinEntity implementation
GoblinEntity::GoblinEntity(const Vec3& position)
    : Entity(EntityType::ENEMY_GOBLIN, position)
    , animTimer_(0.0f)
{
    combat_.setWeapon(WeaponType::SWORD);
}

void GoblinEntity::render(Renderer& renderer) {
    Vec3 pos = position_;
    Color goblinGreen(0.2f, 0.6f, 0.2f);
    
    // Body
    renderer.addCubeToBatch(Vec3(pos.x, pos.y + 0.5f, pos.z), Vec3(0.6f, 0.8f, 0.4f), goblinGreen);
    
    // Head
    renderer.addCubeToBatch(Vec3(pos.x, pos.y + 1.2f, pos.z), Vec3(0.5f, 0.5f, 0.5f), goblinGreen);
    
    // Eyes (red)
    Color redEye(1, 0, 0);
    renderer.addCubeToBatch(Vec3(pos.x - 0.15f, pos.y + 1.3f, pos.z + 0.2f), Vec3(0.1f, 0.1f, 0.1f), redEye);
    renderer.addCubeToBatch(Vec3(pos.x + 0.15f, pos.y + 1.3f, pos.z + 0.2f), Vec3(0.1f, 0.1f, 0.1f), redEye);
    
    // Arms
    renderer.addCubeToBatch(Vec3(pos.x - 0.5f, pos.y + 0.6f, pos.z), Vec3(0.2f, 0.6f, 0.2f), goblinGreen);
    renderer.addCubeToBatch(Vec3(pos.x + 0.5f, pos.y + 0.6f, pos.z), Vec3(0.2f, 0.6f, 0.2f), goblinGreen);
}

// EntityManager implementation
EntityManager::EntityManager() {}

EntityManager::~EntityManager() {
    for (Entity* entity : entities_) {
        delete entity;
    }
    entities_.clear();
}

void EntityManager::addDragon(EntityType type, const Vec3& position, const Color& color) {
    entities_.push_back(new DragonEntity(type, position, color));
}

void EntityManager::addGoblin(const Vec3& position) {
    entities_.push_back(new GoblinEntity(position));
}

void EntityManager::removeDeadEntities() {
    auto it = entities_.begin();
    while (it != entities_.end()) {
        if (!(*it)->isAlive()) {
            delete *it;
            it = entities_.erase(it);
        } else {
            ++it;
        }
    }
}

void EntityManager::update(float deltaTime, const Vec3& playerPos) {
    for (Entity* entity : entities_) {
        entity->update(deltaTime, playerPos);
    }
    removeDeadEntities();
}

void EntityManager::render(Renderer& renderer) {
    renderer.beginBatch(); // Start batching all entities
    
    for (Entity* entity : entities_) {
        entity->render(renderer);
    }
    
    renderer.endBatch(); // Single draw call for ALL entities!
}

Entity* EntityManager::getEntityInRange(const Vec3& position, float range, EntityType excludeType) {
    for (Entity* entity : entities_) {
        if (entity->getType() == excludeType) continue;
        if (!entity->isAlive()) continue;
        
        Vec3 ePos = entity->getPosition();
        float dx = ePos.x - position.x;
        float dy = ePos.y - position.y;
        float dz = ePos.z - position.z;
        float dist = std::sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist <= range) {
            return entity;
        }
    }
    return nullptr;
}

std::vector<Entity*> EntityManager::getEntitiesInRange(const Vec3& position, float range) {
    std::vector<Entity*> result;
    for (Entity* entity : entities_) {
        if (!entity->isAlive()) continue;
        
        Vec3 ePos = entity->getPosition();
        float dx = ePos.x - position.x;
        float dy = ePos.y - position.y;
        float dz = ePos.z - position.z;
        float dist = std::sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist <= range) {
            result.push_back(entity);
        }
    }
    return result;
}

Entity* EntityManager::getEntity(int index) {
    if (index >= 0 && index < entities_.size()) {
        return entities_[index];
    }
    return nullptr;
}
