#include "blockchain.h"
#include <cmath>
#include <random>
#include <map>

namespace DragonCity {

static std::random_device rd;
static std::mt19937 gen(rd());

GameEngine::GameEngine() {
    initElementMatrix();
}

GameEngine::~GameEngine() {}

void GameEngine::initElementMatrix() {
    // Fire (0)
    elementMatrix_[0] = {{2, 6}, {1, 8}};  // Strong vs Earth,Nature | Weak vs Water,Ice
    // Water (1)
    elementMatrix_[1] = {{0, 9}, {2, 6}};  // Strong vs Fire,Electric | Weak vs Earth,Nature
    // Earth (2)
    elementMatrix_[2] = {{9, 7}, {0, 6}};  // Strong vs Electric,Metal | Weak vs Fire,Nature
    // Air (3)
    elementMatrix_[3] = {{2, 6}, {9, 8}};  // Strong vs Earth,Nature | Weak vs Electric,Ice
    // Dark (4)
    elementMatrix_[4] = {{5, 3}, {5, 2}};  // Strong vs Light,Air | Weak vs Light,Earth
    // Light (5)
    elementMatrix_[5] = {{4, 3}, {4, 7}};  // Strong vs Dark,Air | Weak vs Dark,Metal
    // Nature (6)
    elementMatrix_[6] = {{1, 2}, {0, 8}};  // Strong vs Water,Earth | Weak vs Fire,Ice
    // Metal (7)
    elementMatrix_[7] = {{8, 6}, {0, 9}};  // Strong vs Ice,Nature | Weak vs Fire,Electric
    // Ice (8)
    elementMatrix_[8] = {{2, 6}, {0, 7}};  // Strong vs Earth,Nature | Weak vs Fire,Metal
    // Electric (9)
    elementMatrix_[9] = {{1, 3}, {2}};     // Strong vs Water,Air | Weak vs Earth
}

int GameEngine::getBaseStat(int element, int powerType) {
    const int baseStat = 10;
    const int elementBonus = element * 2;
    const float powerMult = getPowerMultiplier(powerType);
    return static_cast<int>((baseStat + elementBonus) * powerMult);
}

float GameEngine::getPowerMultiplier(int powerType) {
    switch (powerType) {
        case 2: return 1.5f;  // Legendary
        case 1: return 1.2f;  // Rare
        default: return 1.0f; // Common
    }
}

GameStats GameEngine::calculateStats(const BlockchainDragon& dragon) {
    return calculateStatsSimple(dragon.element, dragon.powerType, dragon.level);
}

GameStats GameEngine::calculateStatsSimple(int element, int powerType, int level) {
    GameStats stats;
    
    const int baseValue = getBaseStat(element, powerType);
    
    // Scale stats with level
    stats.maxHp = static_cast<int>(baseValue * 10 * std::pow(1.1, level - 1));
    stats.hp = stats.maxHp;
    stats.attack = static_cast<int>(baseValue * std::pow(1.08, level - 1));
    stats.defense = static_cast<int>(baseValue * 0.8f * std::pow(1.08, level - 1));
    stats.speed = static_cast<int>(baseValue * 1.2f * std::pow(1.05, level - 1));
    stats.level = level;
    stats.exp = 0;
    stats.expToNextLevel = static_cast<int>(100 * std::pow(level, 1.5));
    
    return stats;
}

float GameEngine::getElementMultiplier(int attackerElement, int defenderElement) {
    if (attackerElement == defenderElement) {
        return 1.0f;
    }
    
    auto it = elementMatrix_.find(attackerElement);
    if (it != elementMatrix_.end()) {
        const auto& eff = it->second;
        
        // Check if super effective
        for (int elem : eff.strong) {
            if (elem == defenderElement) return 1.5f;
        }
        
        // Check if not very effective
        for (int elem : eff.weak) {
            if (elem == defenderElement) return 0.7f;
        }
    }
    
    return 1.0f; // Normal damage
}

BattleResult GameEngine::calculateDamage(int attack, int defense, int skillPower, 
                                        int attackerElement, int defenderElement) {
    BattleResult result;
    
    // Base damage
    float baseDamage = (attack * skillPower / 100.0f) - (defense * 0.5f);
    baseDamage = std::max(1.0f, baseDamage);
    
    // Element effectiveness
    float elementMult = getElementMultiplier(attackerElement, defenderElement);
    
    // Critical hit (15% chance)
    std::uniform_real_distribution<> critDist(0.0, 1.0);
    result.isCritical = critDist(gen) < 0.15;
    float critMult = result.isCritical ? 1.5f : 1.0f;
    
    // Random variance (85-115%)
    std::uniform_real_distribution<> varDist(0.85, 1.15);
    float randomFactor = varDist(gen);
    
    // Final damage
    result.damageDealt = static_cast<int>(baseDamage * elementMult * critMult * randomFactor);
    result.damageDealt = std::max(1, result.damageDealt);
    
    return result;
}

bool GameEngine::doesAttackHit(int accuracy) {
    std::uniform_int_distribution<> dist(0, 99);
    return dist(gen) < accuracy;
}

bool GameEngine::isCriticalHit(int attackerSpeed, int defenderSpeed) {
    float critChance = 0.05f + (attackerSpeed / static_cast<float>(defenderSpeed + attackerSpeed)) * 0.25f;
    critChance = std::min(0.3f, critChance); // Max 30%
    
    std::uniform_real_distribution<> dist(0.0, 1.0);
    return dist(gen) < critChance;
}

int GameEngine::calculateExpGain(int winnerLevel, int loserLevel) {
    const int baseExp = 50;
    const int levelDiff = std::max(0, loserLevel - winnerLevel);
    return baseExp + (levelDiff * 10);
}

bool GameEngine::checkLevelUp(GameStats& stats, int expGained) {
    stats.exp += expGained;
    
    if (stats.exp >= stats.expToNextLevel) {
        // Level up!
        stats.level++;
        stats.exp -= stats.expToNextLevel;
        
        // Increase stats
        stats.maxHp = static_cast<int>(stats.maxHp * 1.10);
        stats.hp = stats.maxHp; // Restore HP on level up
        stats.attack = static_cast<int>(stats.attack * 1.08);
        stats.defense = static_cast<int>(stats.defense * 1.08);
        stats.speed = static_cast<int>(stats.speed * 1.05);
        stats.expToNextLevel = static_cast<int>(100 * std::pow(stats.level, 1.5));
        
        return true;
    }
    
    return false;
}

std::vector<DragonSkill> GameEngine::generateSkills(int element) {
    std::vector<DragonSkill> skills;
    
    const char* elementNames[] = {
        "Fire", "Water", "Earth", "Air", "Dark", 
        "Light", "Nature", "Metal", "Ice", "Electric"
    };
    
    // Basic attack
    DragonSkill basic;
    basic.id = "basic_" + std::to_string(element);
    basic.name = "Basic Attack";
    basic.element = element;
    basic.power = 50;
    basic.accuracy = 100;
    basic.cooldown = 0;
    basic.type = "attack";
    skills.push_back(basic);
    
    // Special attack
    DragonSkill special;
    special.id = "special_" + std::to_string(element);
    special.name = std::string(elementNames[element]) + " Burst";
    special.element = element;
    special.power = 80;
    special.accuracy = 90;
    special.cooldown = 2;
    special.type = "attack";
    skills.push_back(special);
    
    // Ultimate attack
    DragonSkill ultimate;
    ultimate.id = "ultimate_" + std::to_string(element);
    ultimate.name = std::string(elementNames[element]) + " Storm";
    ultimate.element = element;
    ultimate.power = 120;
    ultimate.accuracy = 75;
    ultimate.cooldown = 4;
    ultimate.type = "attack";
    skills.push_back(ultimate);
    
    // Light element gets heal
    if (element == 5) {
        DragonSkill heal;
        heal.id = "heal_5";
        heal.name = "Healing Light";
        heal.element = 5;
        heal.power = 50;
        heal.accuracy = 100;
        heal.cooldown = 3;
        heal.type = "heal";
        skills.push_back(heal);
    }
    
    return skills;
}

std::string GameEngine::getAttackAnimation(int element, const std::string& skillType) {
    static const std::map<int, std::map<std::string, std::string>> animations = {
        {0, {{"ultimate", "fire_blast"}, {"basic", "fire_strike"}}},
        {1, {{"ultimate", "water_tsunami"}, {"basic", "water_splash"}}},
        {2, {{"ultimate", "earth_quake"}, {"basic", "rock_throw"}}},
        {3, {{"ultimate", "tornado"}, {"basic", "wind_slash"}}},
        {4, {{"ultimate", "dark_void"}, {"basic", "shadow_claw"}}},
        {5, {{"ultimate", "holy_beam"}, {"basic", "light_ray"}}},
        {6, {{"ultimate", "vine_whip"}, {"basic", "leaf_storm"}}},
        {7, {{"ultimate", "metal_burst"}, {"basic", "steel_edge"}}},
        {8, {{"ultimate", "blizzard"}, {"basic", "ice_shard"}}},
        {9, {{"ultimate", "thunderbolt"}, {"basic", "spark"}}}
    };
    
    auto elemIt = animations.find(element);
    if (elemIt != animations.end()) {
        auto skillIt = elemIt->second.find(skillType);
        if (skillIt != elemIt->second.end()) {
            return skillIt->second;
        }
    }
    
    return "basic_attack";
}

void GameEngine::updateDragonAnimation(uint64_t dragonId, float deltaTime) {
    // Animation state management
    // This would be called from the render loop
}

std::string GameEngine::getDragonAnimState(uint64_t dragonId) {
    auto it = dragonAnimStates_.find(dragonId);
    if (it != dragonAnimStates_.end()) {
        return it->second;
    }
    return "idle";
}

// Emscripten bindings for JavaScript
void initJSBindings() {
    using namespace emscripten;
    
    value_object<GameStats>("GameStats")
        .field("hp", &GameStats::hp)
        .field("maxHp", &GameStats::maxHp)
        .field("attack", &GameStats::attack)
        .field("defense", &GameStats::defense)
        .field("speed", &GameStats::speed)
        .field("level", &GameStats::level)
        .field("exp", &GameStats::exp)
        .field("expToNextLevel", &GameStats::expToNextLevel);
    
    value_object<DragonSkill>("DragonSkill")
        .field("id", &DragonSkill::id)
        .field("name", &DragonSkill::name)
        .field("element", &DragonSkill::element)
        .field("power", &DragonSkill::power)
        .field("accuracy", &DragonSkill::accuracy)
        .field("cooldown", &DragonSkill::cooldown)
        .field("type", &DragonSkill::type);
    
    value_object<BattleResult>("BattleResult")
        .field("attackerWon", &BattleResult::attackerWon)
        .field("damageDealt", &BattleResult::damageDealt)
        .field("damageTaken", &BattleResult::damageTaken)
        .field("isCritical", &BattleResult::isCritical)
        .field("expGained", &BattleResult::expGained)
        .field("leveledUp", &BattleResult::leveledUp)
        .field("animation", &BattleResult::animation);
    
    value_object<BlockchainDragon>("BlockchainDragon")
        .field("id", &BlockchainDragon::id)
        .field("name", &BlockchainDragon::name)
        .field("element", &BlockchainDragon::element)
        .field("powerType", &BlockchainDragon::powerType)
        .field("level", &BlockchainDragon::level)
        .field("experience", &BlockchainDragon::experience)
        .field("attack", &BlockchainDragon::attack)
        .field("defense", &BlockchainDragon::defense)
        .field("speed", &BlockchainDragon::speed)
        .field("health", &BlockchainDragon::health);
    
    class_<GameEngine>("GameEngine")
        .constructor<>()
        .function("calculateStatsSimple", &GameEngine::calculateStatsSimple)
        .function("calculateStats", &GameEngine::calculateStats)
        .function("getElementMultiplier", &GameEngine::getElementMultiplier)
        .function("calculateDamage", &GameEngine::calculateDamage)
        .function("doesAttackHit", &GameEngine::doesAttackHit)
        .function("calculateExpGain", &GameEngine::calculateExpGain)
        .function("checkLevelUp", &GameEngine::checkLevelUp)
        .function("generateSkills", &GameEngine::generateSkills)
        .function("getAttackAnimation", &GameEngine::getAttackAnimation);
    
    register_vector<DragonSkill>("VectorDragonSkill");
}

} // namespace DragonCity

EMSCRIPTEN_BINDINGS(dragon_city_engine) {
    DragonCity::initJSBindings();
}
