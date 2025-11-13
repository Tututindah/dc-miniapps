#pragma once

#include <string>
#include <vector>
#include <emscripten/bind.h>
#include <emscripten/val.h>

namespace DragonCity {

// Dragon blockchain data structure
struct BlockchainDragon {
    uint64_t id;
    std::string name;
    uint8_t element;        // 0-9 (Fire, Water, Earth, Air, Dark, Light, Nature, Metal, Ice, Electric)
    uint8_t powerType;      // 0-2 (Common, Rare, Legendary)
    uint16_t level;
    uint32_t experience;
    uint16_t attack;
    uint16_t defense;
    uint16_t speed;
    uint16_t health;
    bool isStandby;
    uint64_t originChainId;
    
    BlockchainDragon() 
        : id(0), name(""), element(0), powerType(0), level(1), 
          experience(0), attack(0), defense(0), speed(0), health(100),
          isStandby(false), originChainId(0) {}
};

// Game stats calculated from blockchain data
struct GameStats {
    int hp;
    int maxHp;
    int attack;
    int defense;
    int speed;
    int level;
    int exp;
    int expToNextLevel;
};

// Battle result
struct BattleResult {
    bool attackerWon;
    int damageDealt;
    int damageTaken;
    bool isCritical;
    int expGained;
    bool leveledUp;
    std::string animation;
};

// Skill data
struct DragonSkill {
    std::string id;
    std::string name;
    int element;
    int power;
    int accuracy;
    int cooldown;
    std::string type;  // "attack", "heal", "buff"
};

class GameEngine {
public:
    GameEngine();
    ~GameEngine();
    
    // Stats calculation from blockchain data
    GameStats calculateStats(const BlockchainDragon& dragon);
    GameStats calculateStatsSimple(int element, int powerType, int level);
    
    // Element effectiveness
    float getElementMultiplier(int attackerElement, int defenderElement);
    
    // Battle mechanics
    BattleResult calculateDamage(int attack, int defense, int skillPower, 
                                int attackerElement, int defenderElement);
    
    bool doesAttackHit(int accuracy);
    bool isCriticalHit(int attackerSpeed, int defenderSpeed);
    
    // EXP and leveling
    int calculateExpGain(int winnerLevel, int loserLevel);
    bool checkLevelUp(GameStats& stats, int expGained);
    
    // Skills
    std::vector<DragonSkill> generateSkills(int element);
    std::string getAttackAnimation(int element, const std::string& skillType);
    
    // Animation states
    void updateDragonAnimation(uint64_t dragonId, float deltaTime);
    std::string getDragonAnimState(uint64_t dragonId);
    
private:
    struct ElementEffectiveness {
        std::vector<int> strong;
        std::vector<int> weak;
    };
    
    std::map<int, ElementEffectiveness> elementMatrix_;
    std::map<uint64_t, std::string> dragonAnimStates_;
    
    void initElementMatrix();
    int getBaseStat(int element, int powerType);
    float getPowerMultiplier(int powerType);
};

// JavaScript bindings
void initJSBindings();

} // namespace DragonCity
