#pragma once

#include "renderer.h"

// Weapon types
enum class WeaponType {
    FIST,
    SWORD,
    BOW,
    STAFF
};

// Attack data
struct Attack {
    WeaponType weapon;
    float damage;
    float range;
    float cooldown;
    bool isRanged;
};

// Combat component for entities
class CombatComponent {
public:
    CombatComponent(float maxHealth = 100.0f);
    
    // Health management
    void takeDamage(float amount);
    void heal(float amount);
    bool isDead() const { return health_ <= 0; }
    float getHealth() const { return health_; }
    float getMaxHealth() const { return maxHealth_; }
    float getHealthPercent() const { return health_ / maxHealth_; }
    
    // Combat actions
    bool canAttack() const;
    void performAttack(WeaponType weapon);
    void update(float deltaTime);
    
    // Weapon management
    void setWeapon(WeaponType weapon) { currentWeapon_ = weapon; }
    WeaponType getWeapon() const { return currentWeapon_; }
    float getAttackDamage() const;
    float getAttackRange() const;
    bool isRangedWeapon() const;
    
private:
    float health_;
    float maxHealth_;
    WeaponType currentWeapon_;
    float attackCooldown_;
    float lastAttackTime_;
    
    Attack getWeaponStats(WeaponType weapon) const;
};

// Projectile for ranged attacks
class Projectile {
public:
    Projectile(const Vec3& pos, const Vec3& dir, float damage, float speed);
    
    void update(float deltaTime);
    void render(class Renderer& renderer);
    
    Vec3 getPosition() const { return position_; }
    float getDamage() const { return damage_; }
    bool isActive() const { return active_; }
    void deactivate() { active_ = false; }
    
private:
    Vec3 position_;
    Vec3 direction_;
    Vec3 velocity_;
    float damage_;
    float lifetime_;
    bool active_;
};
