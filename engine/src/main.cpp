#include "renderer.h"
#include "camera.h"
#include "chunk_terrain.h"
#include "player.h"
#include "combat.h"
#include "entity.h"
#include "dragon_game.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

// Global game state for 3D world with chunk streaming
struct GameState {
    Renderer* renderer = nullptr;
    Camera* camera = nullptr;
    ChunkTerrain* terrain = nullptr; // Chunk-based infinite terrain
    PlayerController* player = nullptr;
    CombatComponent* playerCombat = nullptr;
    EntityManager* entities = nullptr;
    DragonGameManager* dragonGame = nullptr; // NEW: Dragon gameplay systems
    std::vector<Projectile*> projectiles;
    InputState input = {false, false, false, false, false, false};
    bool attackPressed = false;
    bool flyMode = false;
    float lastTime = 0;
    float cameraYaw = 0.0f;
    float cameraPitch = 0.0f;
    int chunksLoaded = 0;
    int chunksRendered = 0;
};

static GameState g_game;

extern "C" {

// Initialize the game - 3D chunk-based infinite world
void init_game(int width, int height) {
    emscripten_run_script("console.log('[C++] 🔧 Initializing infinite 3D world with chunk streaming...')");
    
    g_game.renderer = new Renderer();
    bool rendererOk = g_game.renderer->initialize(width, height);
    if (!rendererOk) {
        emscripten_run_script("console.error('[C++] ❌ Renderer initialization FAILED!')");
        return;
    }
    emscripten_run_script("console.log('[C++] ✅ Renderer initialized')");
    
    g_game.camera = new Camera();
    // Set initial camera position for 3D third-person view (higher and farther for open world)
    g_game.camera->setPosition(Vec3(0, 35, -45));
    g_game.camera->setTarget(Vec3(0, 10, 0));
    emscripten_run_script("console.log('[C++] ✅ 3D Camera created')");
    
    // Create chunk-based terrain (optimized for mobile - smaller chunks, close render distance)
    g_game.terrain = new ChunkTerrain(12, 20, 4);
    emscripten_run_script("console.log('[C++] ✅ Chunk terrain created (mobile optimized)')");
    emscripten_run_script("console.log('[C++] 📦 Chunk: 12x12 blocks, Load: 4 chunks, Render: 2 chunks only')");
    
    g_game.player = new PlayerController(*g_game.terrain);
    
    // Spawn player at world origin
    float spawnX = 0.0f;
    float spawnZ = 0.0f;
    float groundY = g_game.terrain->getHeightAt(spawnX, spawnZ);
    g_game.player->setPosition(Vec3(spawnX, groundY + 2.0f, spawnZ));
    emscripten_run_script(("console.log('[C++] ✅ Player spawned at: " + 
                          std::to_string(spawnX) + ", " + 
                          std::to_string(groundY + 2.0f) + ", " + 
                          std::to_string(spawnZ) + "')").c_str());
    
    // Initialize combat system
    g_game.playerCombat = new CombatComponent(100.0f);
    g_game.playerCombat->setWeapon(WeaponType::SWORD);
    emscripten_run_script("console.log('[C++] ⚔️ Combat system initialized')");
    
    // Initialize entity manager
    g_game.entities = new EntityManager();
    
    // Initialize dragon game systems (breeding, hatching, battle, training)
    g_game.dragonGame = new DragonGameManager();
    emscripten_run_script("console.log('[C++] 🐉 Dragon Game Systems initialized - Breed, Hatch, Battle, Train!')");
    
    emscripten_run_script("console.log('[C++] 🌍 Optimized 3D World ready - Smooth performance on mobile & desktop!')");
}

// Update game logic
void update_game(float currentTime) {
    float deltaTime = currentTime - g_game.lastTime;
    g_game.lastTime = currentTime;
    
    if (deltaTime > 0.1f) deltaTime = 0.016f; // Cap delta time
    
    // Update player combat
    g_game.playerCombat->update(deltaTime);
    
    // Update player
    g_game.player->update(deltaTime, g_game.input);
    Vec3 playerPos = g_game.player->getPosition();
    
    // Update chunk terrain based on player position (stream chunks)
    if (g_game.terrain) {
        g_game.terrain->update(playerPos);
    }
    
    // Update entities with player position for AI
    if (g_game.entities) {
        g_game.entities->update(deltaTime, playerPos);
    }
    
    // Update projectiles
    for (auto it = g_game.projectiles.begin(); it != g_game.projectiles.end();) {
        (*it)->update(deltaTime);
        if (!(*it)->isActive()) {
            delete *it;
            it = g_game.projectiles.erase(it);
        } else {
            ++it;
        }
    }
    
    // Handle player attack
    if (g_game.attackPressed && g_game.playerCombat->canAttack()) {
        // Trigger dragon attack animation
        g_game.player->getDragon().setAnimState(DragonAnimState::ATTACKING);
        
        g_game.playerCombat->performAttack(g_game.playerCombat->getWeapon());
        
        // Melee attack - check for nearby entities
        if (!g_game.playerCombat->isRangedWeapon()) {
            Entity* target = g_game.entities->getEntityInRange(
                playerPos,
                g_game.playerCombat->getAttackRange(),
                EntityType::PLAYER
            );
            
            if (target) {
                target->getCombat().takeDamage(g_game.playerCombat->getAttackDamage());
                emscripten_run_script("console.log('[C++] ⚔️ Hit enemy!')");
            }
        } else {
            // Ranged attack - create projectile
            Vec3 cameraDir = g_game.camera->getForward();
            Projectile* proj = new Projectile(
                Vec3(playerPos.x, playerPos.y + 1.5f, playerPos.z),
                cameraDir,
                g_game.playerCombat->getAttackDamage(),
                20.0f
            );
            g_game.projectiles.push_back(proj);
            emscripten_run_script("console.log('[C++] 🏹 Fired projectile!')");
        }
    }
    
    // Check projectile collisions with entities
    for (Projectile* proj : g_game.projectiles) {
        if (!proj->isActive()) continue;
        
        Entity* hit = g_game.entities->getEntityInRange(
            proj->getPosition(),
            0.5f,
            EntityType::PLAYER
        );
        
        if (hit) {
            hit->getCombat().takeDamage(proj->getDamage());
            proj->deactivate();
            emscripten_run_script("console.log('[C++] 💥 Projectile hit!')");
        }
    }
    
    // Update camera to follow player in 3D third-person
    Vec3 cameraOffset(0, 5, -15); // Behind and above player
    Vec3 targetCameraPos = playerPos + cameraOffset;
    
    // Smooth camera follow
    Vec3 currentCamPos = g_game.camera->getPosition();
    Vec3 smoothCamPos = currentCamPos + (targetCameraPos - currentCamPos) * 0.1f;
    
    g_game.camera->setPosition(smoothCamPos);
    g_game.camera->setTarget(playerPos + Vec3(0, 2, 0)); // Look at player's center
}

// Render game
void render_game() {
    if (!g_game.renderer) {
        emscripten_run_script("console.error('[C++] ❌ render_game: No renderer!')");
        return;
    }
    
    static int frameCount = 0;
    if (frameCount == 0) {
        emscripten_run_script("console.log('[C++] 🎬 First render_game() call')");
    }
    frameCount++;
    
    // Clear screen
    g_game.renderer->clear(Color(0.53f, 0.81f, 0.92f)); // Sky blue
    
    // Set camera matrices
    float viewMatrix[16];
    float projMatrix[16];
    
    g_game.camera->getViewMatrix(viewMatrix);
    // Force landscape aspect ratio (always use width > height)
    float w = static_cast<float>(g_game.renderer->getWidth());
    float h = static_cast<float>(g_game.renderer->getHeight());
    float aspect = w > h ? w / h : h / w; // Always landscape
    g_game.camera->getProjectionMatrix(projMatrix, aspect);
    
    g_game.renderer->setViewMatrix(viewMatrix);
    g_game.renderer->setProjectionMatrix(projMatrix);
    
    Vec3 playerPos = g_game.player->getPosition();
    Vec3 cameraPos = g_game.camera->getPosition();
    
    // Render chunk terrain (only visible chunks near camera for performance)
    if (g_game.terrain) {
        g_game.terrain->render(*g_game.renderer, cameraPos);
    }
    
    // Render entities
    if (g_game.entities) {
        g_game.entities->render(*g_game.renderer);
    }
    
    // Render projectiles
    for (Projectile* proj : g_game.projectiles) {
        proj->render(*g_game.renderer);
    }
    
    // Render player
    g_game.player->render(*g_game.renderer);
    
    g_game.renderer->present();
}

// Handle input for 3D movement (WASD + Flying)
void set_input(bool left, bool right, bool forward) {
    g_game.input.left = left;
    g_game.input.right = right;
    g_game.input.forward = forward;
}

// Set backward movement (S key)
void set_backward(bool backward) {
    g_game.input.backward = backward;
}

// Set jump/fly up (Space key)
void set_jump(bool jump) {
    g_game.input.jump = jump;
}

// Toggle fly mode (F key)
void set_fly_mode(bool flyMode) {
    g_game.flyMode = flyMode;
    g_game.input.fly = flyMode;
}

// Set dragon color from hex
void set_dragon_color(float r, float g, float b) {
    if (g_game.player) {
        g_game.player->setDragonColor(Color(r, g, b));
    }
}

// Handle attack input
void set_attack(bool attacking) {
    g_game.attackPressed = attacking;
}

// Change weapon
void set_weapon(int weaponType) {
    if (g_game.playerCombat) {
        g_game.playerCombat->setWeapon(static_cast<WeaponType>(weaponType));
    }
}

// Get player health for UI
float get_player_health() {
    return g_game.playerCombat ? g_game.playerCombat->getHealth() : 100.0f;
}

// Get player max health for UI
float get_player_max_health() {
    return g_game.playerCombat ? g_game.playerCombat->getMaxHealth() : 100.0f;
}

// Get current weapon type
int get_current_weapon() {
    return g_game.playerCombat ? static_cast<int>(g_game.playerCombat->getWeapon()) : 0;
}

// Texture loading for village buildings
int load_building_texture(int width, int height, const unsigned char* data) {
    if (!g_game.renderer) return 0;
    return g_game.renderer->loadTexture(width, height, data);
}

// Get entity count for UI
int get_entity_count() {
    return g_game.entities ? g_game.entities->getEntityCount() : 0;
}

// Get player position
void get_player_position(float* outX, float* outY, float* outZ) {
    Vec3 pos = g_game.player->getPosition();
    *outX = pos.x;
    *outY = pos.y;
    *outZ = pos.z;
}

// Cleanup
void cleanup_game() {
    delete g_game.dragonGame;
    delete g_game.playerCombat;
    delete g_game.entities;
    for (Projectile* proj : g_game.projectiles) {
        delete proj;
    }
    g_game.projectiles.clear();
    delete g_game.player;
    delete g_game.terrain;
    delete g_game.camera;
    delete g_game.renderer;
}

// ===== DRAGON GAME EXPORTS =====

// Egg System
int create_egg(int elementType, float r, float g, float b) {
    Element elem = static_cast<Element>(elementType);
    Color color(r, g, b);
    return g_game.dragonGame->createEgg(elem, color);
}

void update_egg(int eggId, float deltaTime) {
    g_game.dragonGame->updateEgg(eggId, deltaTime);
}

bool is_egg_ready(int eggId) {
    return g_game.dragonGame->isEggReadyToHatch(eggId);
}

int hatch_egg(int eggId) {
    return g_game.dragonGame->hatchEgg(eggId);
}

// Breeding System
int start_breeding(int dragon1Id, int dragon2Id) {
    return g_game.dragonGame->startBreeding(dragon1Id, dragon2Id);
}

void update_breeding(int pairId, float deltaTime) {
    g_game.dragonGame->updateBreeding(pairId, deltaTime);
}

bool is_breeding_complete(int pairId) {
    return g_game.dragonGame->isBreedingComplete(pairId);
}

int get_breeding_result_egg(int pairId) {
    DragonEgg* egg = g_game.dragonGame->getBreedingResult(pairId);
    return egg ? egg->id : -1;
}

// Battle System
void start_battle(int playerDragonId, int enemyDragonId) {
    g_game.dragonGame->startBattle(playerDragonId, enemyDragonId);
}

void update_battle(float deltaTime) {
    g_game.dragonGame->updateBattle(deltaTime);
}

void perform_battle_action(int actionType, int moveIndex) {
    BattleAction action = static_cast<BattleAction>(actionType);
    g_game.dragonGame->performBattleAction(action, moveIndex);
}

int get_battle_state() {
    return static_cast<int>(g_game.dragonGame->getBattleState());
}

// Training System
int start_training(int dragonId, int trainingType) {
    TrainingType type = static_cast<TrainingType>(trainingType);
    return g_game.dragonGame->startTraining(dragonId, type);
}

void update_training(int sessionId, float deltaTime) {
    g_game.dragonGame->updateTraining(sessionId, deltaTime);
}

bool is_training_complete(int sessionId) {
    return g_game.dragonGame->isTrainingComplete(sessionId);
}

void complete_training(int sessionId) {
    g_game.dragonGame->completeTraining(sessionId);
}

// Dragon Management
int create_dragon(int elementType, float r, float g, float b, int level) {
    Element elem = static_cast<Element>(elementType);
    Color color(r, g, b);
    return g_game.dragonGame->createDragon(elem, color, level);
}

int get_dragon_count() {
    return g_game.dragonGame->getAllDragons().size();
}

} // extern "C"

int main() {
    return 0;
}
