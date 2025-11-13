#include "combat.h"
#include "renderer.h"
#include <algorithm>

// CombatComponent implementation
CombatComponent::CombatComponent(float maxHealth)
    : health_(maxHealth)
    , maxHealth_(maxHealth)
    , currentWeapon_(WeaponType::FIST)
    , attackCooldown_(0.0f)
    , lastAttackTime_(0.0f)
{}

void CombatComponent::takeDamage(float amount) {
    health_ = std::max(0.0f, health_ - amount);
}

void CombatComponent::heal(float amount) {
    health_ = std::min(maxHealth_, health_ + amount);
}

bool CombatComponent::canAttack() const {
    return attackCooldown_ <= 0.0f;
}

void CombatComponent::performAttack(WeaponType weapon) {
    if (!canAttack()) return;
    
    Attack weaponStats = getWeaponStats(weapon);
    attackCooldown_ = weaponStats.cooldown;
}

void CombatComponent::update(float deltaTime) {
    if (attackCooldown_ > 0.0f) {
        attackCooldown_ -= deltaTime;
    }
}

float CombatComponent::getAttackDamage() const {
    return getWeaponStats(currentWeapon_).damage;
}

float CombatComponent::getAttackRange() const {
    return getWeaponStats(currentWeapon_).range;
}

bool CombatComponent::isRangedWeapon() const {
    return getWeaponStats(currentWeapon_).isRanged;
}

Attack CombatComponent::getWeaponStats(WeaponType weapon) const {
    switch (weapon) {
        case WeaponType::FIST:
            return {WeaponType::FIST, 5.0f, 2.0f, 0.5f, false};
        case WeaponType::SWORD:
            return {WeaponType::SWORD, 15.0f, 3.0f, 0.8f, false};
        case WeaponType::BOW:
            return {WeaponType::BOW, 20.0f, 30.0f, 1.0f, true};
        case WeaponType::STAFF:
            return {WeaponType::STAFF, 25.0f, 15.0f, 1.5f, true};
        default:
            return {WeaponType::FIST, 5.0f, 2.0f, 0.5f, false};
    }
}

// Projectile implementation
Projectile::Projectile(const Vec3& pos, const Vec3& dir, float damage, float speed)
    : position_(pos)
    , direction_(dir)
    , damage_(damage)
    , lifetime_(5.0f)
    , active_(true)
{
    // Normalize direction
    float len = std::sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    if (len > 0.0001f) {
        velocity_ = Vec3(dir.x / len * speed, dir.y / len * speed, dir.z / len * speed);
    } else {
        velocity_ = Vec3(0, 0, speed);
    }
}

void Projectile::update(float deltaTime) {
    if (!active_) return;
    
    position_.x += velocity_.x * deltaTime;
    position_.y += velocity_.y * deltaTime;
    position_.z += velocity_.z * deltaTime;
    
    lifetime_ -= deltaTime;
    if (lifetime_ <= 0.0f) {
        active_ = false;
    }
}

void Projectile::render(Renderer& renderer) {
    if (!active_) return;
    
    // Render as small glowing cube
    Color projectileColor(1.0f, 0.8f, 0.2f); // Yellow/gold
    renderer.drawCube(position_, Vec3(0.3f, 0.3f, 0.3f), projectileColor);
}
