#pragma once

#include "renderer.h"
#include "dragon.h"
#include <vector>
#include <string>

// Element types for dragons
enum class Element {
    NORMAL,
    FIRE,
    WATER,
    ICE,
    LIGHTNING,
    NATURE,
    SHADOW,
    LIGHT
};

// Dragon Egg System
enum class EggState {
    INCUBATING,
    READY_TO_HATCH,
    HATCHED
};

struct DragonEgg {
    int id;
    Color shellColor;
    EggState state;
    float incubationProgress; // 0.0 to 1.0
    float hatchTime; // seconds needed
    float elapsedTime;
    Vec3 position;
    Element element;
    
    DragonEgg() : id(0), shellColor(0.9f, 0.9f, 0.9f), state(EggState::INCUBATING),
                  incubationProgress(0.0f), hatchTime(60.0f), elapsedTime(0.0f),
                  position(0, 0, 0), element(Element::FIRE) {}
};

// Dragon Breeding System
struct BreedingPair {
    int parent1Id;
    int parent2Id;
    float breedingProgress; // 0.0 to 1.0
    float breedingTime;
    float elapsedTime;
    bool isComplete;
    DragonEgg* resultEgg;
    
    BreedingPair() : parent1Id(-1), parent2Id(-1), breedingProgress(0.0f),
                     breedingTime(30.0f), elapsedTime(0.0f), isComplete(false),
                     resultEgg(nullptr) {}
};

// Dragon Battle System
enum class BattleState {
    IDLE,
    SELECTING_DRAGON,
    BATTLE_START,
    PLAYER_TURN,
    ENEMY_TURN,
    BATTLE_END,
    VICTORY,
    DEFEAT
};

enum class BattleAction {
    ATTACK,
    DEFEND,
    SPECIAL_MOVE,
    USE_ITEM,
    RUN
};

struct BattleDragon {
    int id;
    std::string name;
    Element element;
    int level;
    int currentHP;
    int maxHP;
    int attack;
    int defense;
    int speed;
    Color color;
    bool isPlayer;
    
    BattleDragon() : id(0), name("Dragon"), element(Element::FIRE), level(1),
                     currentHP(100), maxHP(100), attack(10), defense(5), speed(10),
                     color(1, 0, 0), isPlayer(true) {}
};

struct BattleMove {
    std::string name;
    int damage;
    Element element;
    float accuracy; // 0.0 to 1.0
    
    BattleMove() : name("Tackle"), damage(10), element(Element::NORMAL), accuracy(0.95f) {}
    BattleMove(const char* n, int dmg, Element elem, float acc) 
        : name(n), damage(dmg), element(elem), accuracy(acc) {}
};

// Dragon Training System
enum class TrainingType {
    STRENGTH,
    DEFENSE,
    SPEED,
    SPECIAL
};

struct TrainingSession {
    int dragonId;
    TrainingType type;
    float progress; // 0.0 to 1.0
    float duration;
    float elapsedTime;
    int statGain;
    bool isComplete;
    
    TrainingSession() : dragonId(-1), type(TrainingType::STRENGTH),
                       progress(0.0f), duration(45.0f), elapsedTime(0.0f),
                       statGain(5), isComplete(false) {}
};

// Main Dragon Game Manager
class DragonGameManager {
public:
    DragonGameManager();
    ~DragonGameManager();
    
    // Egg & Hatching
    int createEgg(Element element, const Color& shellColor);
    void updateEgg(int eggId, float deltaTime);
    bool isEggReadyToHatch(int eggId);
    int hatchEgg(int eggId); // Returns dragon ID
    void renderEgg(Renderer& renderer, int eggId);
    
    // Breeding
    int startBreeding(int dragon1Id, int dragon2Id);
    void updateBreeding(int pairId, float deltaTime);
    bool isBreedingComplete(int pairId);
    DragonEgg* getBreedingResult(int pairId);
    void renderBreeding(Renderer& renderer, int pairId);
    
    // Battle
    void startBattle(int playerDragonId, int enemyDragonId);
    void updateBattle(float deltaTime);
    void performBattleAction(BattleAction action, int moveIndex = 0);
    BattleState getBattleState() const { return battleState_; }
    void renderBattle(Renderer& renderer);
    
    // Training
    int startTraining(int dragonId, TrainingType type);
    void updateTraining(int sessionId, float deltaTime);
    bool isTrainingComplete(int sessionId);
    void completeTraining(int sessionId);
    void renderTraining(Renderer& renderer, int sessionId);
    
    // Dragon Management
    int createDragon(Element element, const Color& color, int level = 1);
    BattleDragon* getDragon(int dragonId);
    std::vector<BattleDragon*> getAllDragons() { return dragons_; }
    
private:
    std::vector<DragonEgg*> eggs_;
    std::vector<BreedingPair*> breedingPairs_;
    std::vector<BattleDragon*> dragons_;
    std::vector<TrainingSession*> trainingSessions_;
    std::vector<BattleMove> battleMoves_;
    
    // Battle state
    BattleState battleState_;
    BattleDragon* playerDragon_;
    BattleDragon* enemyDragon_;
    int selectedMoveIndex_;
    float battleAnimTime_;
    
    // Helper functions
    Element combineElements(Element e1, Element e2);
    Color combineColors(const Color& c1, const Color& c2);
    int calculateDamage(BattleDragon* attacker, BattleDragon* defender, const BattleMove& move);
    float getElementMultiplier(Element attackElement, Element defendElement);
    
    // Rendering helpers
    void renderEggModel(Renderer& renderer, const Vec3& pos, const Color& color, float scale);
    void renderBreedingHearts(Renderer& renderer, const Vec3& center);
    void renderBattleUI(Renderer& renderer);
    void renderHealthBar(Renderer& renderer, const Vec3& pos, float healthPercent, bool isEnemy);
};
