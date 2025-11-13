#include "dragon_game.h"
#include <cmath>
#include <cstdlib>
#include <ctime>

DragonGameManager::DragonGameManager() 
    : battleState_(BattleState::IDLE), playerDragon_(nullptr), enemyDragon_(nullptr),
      selectedMoveIndex_(0), battleAnimTime_(0.0f) {
    
    // Initialize battle moves
    battleMoves_.push_back(BattleMove("Fire Breath", 25, Element::FIRE, 0.9f));
    battleMoves_.push_back(BattleMove("Ice Shard", 25, Element::ICE, 0.9f));
    battleMoves_.push_back(BattleMove("Thunder Strike", 30, Element::LIGHTNING, 0.85f));
    battleMoves_.push_back(BattleMove("Dragon Claw", 20, Element::NORMAL, 0.95f));
    battleMoves_.push_back(BattleMove("Tackle", 15, Element::NORMAL, 1.0f));
    
    srand(static_cast<unsigned>(time(nullptr)));
}

DragonGameManager::~DragonGameManager() {
    for (auto egg : eggs_) delete egg;
    for (auto pair : breedingPairs_) delete pair;
    for (auto dragon : dragons_) delete dragon;
    for (auto session : trainingSessions_) delete session;
}

// ===== EGG & HATCHING SYSTEM =====

int DragonGameManager::createEgg(Element element, const Color& shellColor) {
    DragonEgg* egg = new DragonEgg();
    egg->id = eggs_.size();
    egg->element = element;
    egg->shellColor = shellColor;
    egg->hatchTime = 60.0f; // 60 seconds to hatch
    egg->state = EggState::INCUBATING;
    
    eggs_.push_back(egg);
    return egg->id;
}

void DragonGameManager::updateEgg(int eggId, float deltaTime) {
    if (eggId < 0 || eggId >= eggs_.size()) return;
    
    DragonEgg* egg = eggs_[eggId];
    if (egg->state != EggState::INCUBATING) return;
    
    egg->elapsedTime += deltaTime;
    egg->incubationProgress = egg->elapsedTime / egg->hatchTime;
    
    if (egg->incubationProgress >= 1.0f) {
        egg->incubationProgress = 1.0f;
        egg->state = EggState::READY_TO_HATCH;
    }
}

bool DragonGameManager::isEggReadyToHatch(int eggId) {
    if (eggId < 0 || eggId >= eggs_.size()) return false;
    return eggs_[eggId]->state == EggState::READY_TO_HATCH;
}

int DragonGameManager::hatchEgg(int eggId) {
    if (eggId < 0 || eggId >= eggs_.size()) return -1;
    
    DragonEgg* egg = eggs_[eggId];
    if (egg->state != EggState::READY_TO_HATCH) return -1;
    
    // Create dragon from egg
    int dragonId = createDragon(egg->element, egg->shellColor, 1);
    egg->state = EggState::HATCHED;
    
    return dragonId;
}

void DragonGameManager::renderEgg(Renderer& renderer, int eggId) {
    if (eggId < 0 || eggId >= eggs_.size()) return;
    
    DragonEgg* egg = eggs_[eggId];
    Vec3 pos = egg->position;
    
    // Egg wobble animation
    float wobble = std::sin(egg->elapsedTime * 2.0f) * 0.1f * egg->incubationProgress;
    pos.x += wobble;
    
    // Render egg as oval
    float scale = 1.0f + (egg->incubationProgress * 0.2f); // Egg grows as it's ready
    renderEggModel(renderer, pos, egg->shellColor, scale);
    
    // Cracks appear when nearly ready
    if (egg->incubationProgress > 0.8f) {
        // Render cracks (darker lines)
        Color crackColor(0.3f, 0.3f, 0.3f);
        // Add visual cracks here
    }
}

void DragonGameManager::renderEggModel(Renderer& renderer, const Vec3& pos, const Color& color, float scale) {
    // Render egg as stacked cubes in oval shape
    for (int y = -2; y <= 2; y++) {
        float radius = 1.5f - std::abs(y) * 0.3f;
        for (int x = -1; x <= 1; x++) {
            for (int z = -1; z <= 1; z++) {
                float dist = std::sqrt(x*x + z*z);
                if (dist <= radius) {
                    Vec3 blockPos = pos + Vec3(x * 2.0f * scale, y * 2.0f * scale, z * 2.0f * scale);
                    renderer.addCubeToBatch(blockPos, Vec3(2 * scale, 2 * scale, 2 * scale), color);
                }
            }
        }
    }
}

// ===== BREEDING SYSTEM =====

int DragonGameManager::startBreeding(int dragon1Id, int dragon2Id) {
    if (dragon1Id < 0 || dragon1Id >= dragons_.size()) return -1;
    if (dragon2Id < 0 || dragon2Id >= dragons_.size()) return -1;
    if (dragon1Id == dragon2Id) return -1;
    
    BreedingPair* pair = new BreedingPair();
    pair->parent1Id = dragon1Id;
    pair->parent2Id = dragon2Id;
    pair->breedingTime = 30.0f; // 30 seconds
    
    breedingPairs_.push_back(pair);
    return breedingPairs_.size() - 1;
}

void DragonGameManager::updateBreeding(int pairId, float deltaTime) {
    if (pairId < 0 || pairId >= breedingPairs_.size()) return;
    
    BreedingPair* pair = breedingPairs_[pairId];
    if (pair->isComplete) return;
    
    pair->elapsedTime += deltaTime;
    pair->breedingProgress = pair->elapsedTime / pair->breedingTime;
    
    if (pair->breedingProgress >= 1.0f) {
        pair->breedingProgress = 1.0f;
        pair->isComplete = true;
        
        // Create result egg
        BattleDragon* parent1 = dragons_[pair->parent1Id];
        BattleDragon* parent2 = dragons_[pair->parent2Id];
        
        Element childElement = combineElements(parent1->element, parent2->element);
        Color childColor = combineColors(parent1->color, parent2->color);
        
        DragonEgg* egg = new DragonEgg();
        egg->id = eggs_.size();
        egg->element = childElement;
        egg->shellColor = childColor;
        egg->hatchTime = 60.0f;
        
        eggs_.push_back(egg);
        pair->resultEgg = egg;
    }
}

bool DragonGameManager::isBreedingComplete(int pairId) {
    if (pairId < 0 || pairId >= breedingPairs_.size()) return false;
    return breedingPairs_[pairId]->isComplete;
}

DragonEgg* DragonGameManager::getBreedingResult(int pairId) {
    if (pairId < 0 || pairId >= breedingPairs_.size()) return nullptr;
    return breedingPairs_[pairId]->resultEgg;
}

void DragonGameManager::renderBreeding(Renderer& renderer, int pairId) {
    if (pairId < 0 || pairId >= breedingPairs_.size()) return;
    
    BreedingPair* pair = breedingPairs_[pairId];
    BattleDragon* parent1 = dragons_[pair->parent1Id];
    BattleDragon* parent2 = dragons_[pair->parent2Id];
    
    // Render dragons facing each other
    Vec3 pos1(-5, 0, 0);
    Vec3 pos2(5, 0, 0);
    
    // Render breeding hearts
    renderBreedingHearts(renderer, Vec3(0, 5, 0));
}

void DragonGameManager::renderBreedingHearts(Renderer& renderer, const Vec3& center) {
    // Render floating hearts
    Color heartColor(1.0f, 0.2f, 0.4f);
    for (int i = 0; i < 5; i++) {
        float angle = (i / 5.0f) * 6.28f;
        float radius = 3.0f;
        Vec3 heartPos = center + Vec3(std::cos(angle) * radius, std::sin(angle * 2) * 2, std::sin(angle) * radius);
        renderer.addCubeToBatch(heartPos, Vec3(1, 1, 1), heartColor);
    }
}

// ===== BATTLE SYSTEM =====

void DragonGameManager::startBattle(int playerDragonId, int enemyDragonId) {
    if (playerDragonId < 0 || playerDragonId >= dragons_.size()) return;
    if (enemyDragonId < 0 || enemyDragonId >= dragons_.size()) return;
    
    playerDragon_ = dragons_[playerDragonId];
    enemyDragon_ = dragons_[enemyDragonId];
    
    battleState_ = BattleState::BATTLE_START;
    battleAnimTime_ = 0.0f;
}

void DragonGameManager::updateBattle(float deltaTime) {
    battleAnimTime_ += deltaTime;
    
    switch (battleState_) {
        case BattleState::BATTLE_START:
            if (battleAnimTime_ > 2.0f) {
                battleState_ = BattleState::PLAYER_TURN;
                battleAnimTime_ = 0.0f;
            }
            break;
            
        case BattleState::PLAYER_TURN:
            // Waiting for player action
            break;
            
        case BattleState::ENEMY_TURN:
            if (battleAnimTime_ > 1.0f) {
                // AI makes move
                int randomMove = rand() % battleMoves_.size();
                BattleMove move = battleMoves_[randomMove];
                int damage = calculateDamage(enemyDragon_, playerDragon_, move);
                playerDragon_->currentHP -= damage;
                
                if (playerDragon_->currentHP <= 0) {
                    battleState_ = BattleState::DEFEAT;
                } else {
                    battleState_ = BattleState::PLAYER_TURN;
                }
                battleAnimTime_ = 0.0f;
            }
            break;
            
        case BattleState::VICTORY:
        case BattleState::DEFEAT:
        case BattleState::BATTLE_END:
            // Battle over
            break;
    }
}

void DragonGameManager::performBattleAction(BattleAction action, int moveIndex) {
    if (battleState_ != BattleState::PLAYER_TURN) return;
    
    if (action == BattleAction::ATTACK && moveIndex >= 0 && moveIndex < battleMoves_.size()) {
        BattleMove move = battleMoves_[moveIndex];
        int damage = calculateDamage(playerDragon_, enemyDragon_, move);
        enemyDragon_->currentHP -= damage;
        
        if (enemyDragon_->currentHP <= 0) {
            battleState_ = BattleState::VICTORY;
            playerDragon_->level++;
        } else {
            battleState_ = BattleState::ENEMY_TURN;
        }
        battleAnimTime_ = 0.0f;
    }
}

int DragonGameManager::calculateDamage(BattleDragon* attacker, BattleDragon* defender, const BattleMove& move) {
    float baseDamage = move.damage + attacker->attack;
    float defense = defender->defense;
    float multiplier = getElementMultiplier(move.element, defender->element);
    
    float finalDamage = (baseDamage - defense * 0.5f) * multiplier;
    return std::max(1, static_cast<int>(finalDamage));
}

float DragonGameManager::getElementMultiplier(Element attackElement, Element defendElement) {
    // Fire > Ice > Lightning > Fire
    if (attackElement == Element::FIRE && defendElement == Element::ICE) return 1.5f;
    if (attackElement == Element::ICE && defendElement == Element::LIGHTNING) return 1.5f;
    if (attackElement == Element::LIGHTNING && defendElement == Element::FIRE) return 1.5f;
    
    if (attackElement == Element::ICE && defendElement == Element::FIRE) return 0.5f;
    if (attackElement == Element::LIGHTNING && defendElement == Element::ICE) return 0.5f;
    if (attackElement == Element::FIRE && defendElement == Element::LIGHTNING) return 0.5f;
    
    return 1.0f;
}

void DragonGameManager::renderBattle(Renderer& renderer) {
    if (!playerDragon_ || !enemyDragon_) return;
    
    // Render player dragon (left side)
    Vec3 playerPos(-10, 0, 0);
    renderer.addCubeToBatch(playerPos, Vec3(3, 4, 3), playerDragon_->color);
    renderHealthBar(renderer, playerPos + Vec3(0, 6, 0), 
                   static_cast<float>(playerDragon_->currentHP) / playerDragon_->maxHP, false);
    
    // Render enemy dragon (right side)
    Vec3 enemyPos(10, 0, 0);
    renderer.addCubeToBatch(enemyPos, Vec3(3, 4, 3), enemyDragon_->color);
    renderHealthBar(renderer, enemyPos + Vec3(0, 6, 0),
                   static_cast<float>(enemyDragon_->currentHP) / enemyDragon_->maxHP, true);
}

void DragonGameManager::renderHealthBar(Renderer& renderer, const Vec3& pos, float healthPercent, bool isEnemy) {
    // Background (gray)
    renderer.addCubeToBatch(pos, Vec3(6, 0.5f, 0.5f), Color(0.3f, 0.3f, 0.3f));
    
    // Health (green/red gradient)
    Color healthColor = healthPercent > 0.5f ? Color(0.2f, 1.0f, 0.2f) : 
                        healthPercent > 0.25f ? Color(1.0f, 1.0f, 0.2f) : Color(1.0f, 0.2f, 0.2f);
    
    float barWidth = 6.0f * healthPercent;
    Vec3 barPos = pos + Vec3((6.0f - barWidth) * -0.5f, 0, 0);
    renderer.addCubeToBatch(barPos, Vec3(barWidth, 0.6f, 0.6f), healthColor);
}

// ===== TRAINING SYSTEM =====

int DragonGameManager::startTraining(int dragonId, TrainingType type) {
    if (dragonId < 0 || dragonId >= dragons_.size()) return -1;
    
    TrainingSession* session = new TrainingSession();
    session->dragonId = dragonId;
    session->type = type;
    session->duration = 45.0f; // 45 seconds
    session->statGain = 5;
    
    trainingSessions_.push_back(session);
    return trainingSessions_.size() - 1;
}

void DragonGameManager::updateTraining(int sessionId, float deltaTime) {
    if (sessionId < 0 || sessionId >= trainingSessions_.size()) return;
    
    TrainingSession* session = trainingSessions_[sessionId];
    if (session->isComplete) return;
    
    session->elapsedTime += deltaTime;
    session->progress = session->elapsedTime / session->duration;
    
    if (session->progress >= 1.0f) {
        session->progress = 1.0f;
        session->isComplete = true;
    }
}

bool DragonGameManager::isTrainingComplete(int sessionId) {
    if (sessionId < 0 || sessionId >= trainingSessions_.size()) return false;
    return trainingSessions_[sessionId]->isComplete;
}

void DragonGameManager::completeTraining(int sessionId) {
    if (sessionId < 0 || sessionId >= trainingSessions_.size()) return;
    
    TrainingSession* session = trainingSessions_[sessionId];
    if (!session->isComplete) return;
    
    BattleDragon* dragon = dragons_[session->dragonId];
    
    switch (session->type) {
        case TrainingType::STRENGTH:
            dragon->attack += session->statGain;
            break;
        case TrainingType::DEFENSE:
            dragon->defense += session->statGain;
            break;
        case TrainingType::SPEED:
            dragon->speed += session->statGain;
            break;
        case TrainingType::SPECIAL:
            dragon->maxHP += session->statGain * 2;
            dragon->currentHP = dragon->maxHP;
            break;
    }
}

void DragonGameManager::renderTraining(Renderer& renderer, int sessionId) {
    if (sessionId < 0 || sessionId >= trainingSessions_.size()) return;
    
    TrainingSession* session = trainingSessions_[sessionId];
    BattleDragon* dragon = dragons_[session->dragonId];
    
    // Render training effects
    Color effectColor;
    switch (session->type) {
        case TrainingType::STRENGTH: effectColor = Color(1, 0, 0); break;
        case TrainingType::DEFENSE: effectColor = Color(0, 0, 1); break;
        case TrainingType::SPEED: effectColor = Color(1, 1, 0); break;
        case TrainingType::SPECIAL: effectColor = Color(1, 0, 1); break;
    }
    
    // Particles around dragon
    for (int i = 0; i < 8; i++) {
        float angle = (i / 8.0f) * 6.28f + session->elapsedTime;
        float radius = 5.0f;
        Vec3 particlePos = Vec3(std::cos(angle) * radius, std::sin(session->elapsedTime * 3) * 3, std::sin(angle) * radius);
        renderer.addCubeToBatch(particlePos, Vec3(0.5f, 0.5f, 0.5f), effectColor);
    }
}

// ===== DRAGON MANAGEMENT =====

int DragonGameManager::createDragon(Element element, const Color& color, int level) {
    BattleDragon* dragon = new BattleDragon();
    dragon->id = dragons_.size();
    dragon->element = element;
    dragon->color = color;
    dragon->level = level;
    dragon->maxHP = 100 + (level * 10);
    dragon->currentHP = dragon->maxHP;
    dragon->attack = 10 + (level * 2);
    dragon->defense = 5 + level;
    dragon->speed = 10 + level;
    dragon->isPlayer = true;
    
    dragons_.push_back(dragon);
    return dragon->id;
}

BattleDragon* DragonGameManager::getDragon(int dragonId) {
    if (dragonId < 0 || dragonId >= dragons_.size()) return nullptr;
    return dragons_[dragonId];
}

// ===== HELPER FUNCTIONS =====

Element DragonGameManager::combineElements(Element e1, Element e2) {
    if (e1 == e2) return e1;
    if ((e1 == Element::FIRE && e2 == Element::ICE) || (e1 == Element::ICE && e2 == Element::FIRE))
        return Element::WATER;
    if ((e1 == Element::FIRE && e2 == Element::LIGHTNING) || (e1 == Element::LIGHTNING && e2 == Element::FIRE))
        return Element::LIGHTNING;
    return Element::NORMAL;
}

Color DragonGameManager::combineColors(const Color& c1, const Color& c2) {
    return Color(
        (c1.r + c2.r) * 0.5f,
        (c1.g + c2.g) * 0.5f,
        (c1.b + c2.b) * 0.5f,
        1.0f
    );
}
