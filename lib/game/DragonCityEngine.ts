/**
 * Dragon City Game Engine - TypeScript Wrapper for C++ WASM
 * Provides JavaScript bindings with automatic fallback
 */
import type { Dragon } from './types';

export interface GameStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  exp: number;
  expToNextLevel: number;
}

export interface DragonSkill {
  id: string;
  name: string;
  element: number;
  power: number;
  accuracy: number;
  cooldown: number;
  type: string;
}

interface WASMModule {
  GameEngine: {
    new(): GameEngineInstance;
  };
}

interface GameEngineInstance {
  calculateStatsSimple(element: number, powerType: number, level: number): GameStats;
  getElementMultiplier(attackerElement: number, defenderElement: number): number;
  calculateDamage(
    attack: number,
    defense: number,
    skillPower: number,
    attackerElement: number,
    defenderElement: number,
    isCritical: { value: boolean }
  ): number;
  doesAttackHit(accuracy: number): boolean;
  calculateExpGain(winnerLevel: number, loserLevel: number): number;
  checkLevelUp(stats: GameStats, expGained: number): boolean;
  generateSkills(element: number): DragonSkill[];
  getAttackAnimation(element: number, skillType: string): string;
  delete(): void;
}

export class DragonCityEngine {
  private static wasmModule: WASMModule | null = null;
  private static engineInstance: GameEngineInstance | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('🎮 Loading Dragon City C++ Engine...');
      
      const DragonCityEngineModule = await import('../../public/wasm/dragon_city.js');
      const instance = await DragonCityEngineModule.default() as unknown as WASMModule;
      
      this.wasmModule = instance;
      this.engineInstance = new instance.GameEngine();
      this.isInitialized = true;
      
      console.log('✅ C++ Game Engine initialized successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize C++ Engine:', error);
      console.warn('⚠️ Falling back to JavaScript implementation');
      this.isInitialized = false;
      return false;
    }
  }

  static calculateStats(dragon: Dragon): GameStats;
  static calculateStats(element: number, powerType: number, level: number): GameStats;
  static calculateStats(
    dragonOrElement: Dragon | number,
    powerType?: number,
    level?: number
  ): GameStats {
    if (typeof dragonOrElement === 'object') {
      const dragon = dragonOrElement;
      return this.calculateStats(
        dragon.element,
        dragon.powerType,
        Number(dragon.level) || 1
      );
    }

    const element = dragonOrElement;
    if (!this.engineInstance) {
      return this.calculateStatsJS(element, powerType!, level!);
    }

    try {
      return this.engineInstance.calculateStatsSimple(element, powerType!, level!);
    } catch (error) {
      console.warn('WASM call failed, using JS fallback:', error);
      return this.calculateStatsJS(element, powerType!, level!);
    }
  }

  static getElementMultiplier(attackerElement: number, defenderElement: number): number {
    if (!this.engineInstance) {
      return this.getElementMultiplierJS(attackerElement, defenderElement);
    }

    try {
      return this.engineInstance.getElementMultiplier(attackerElement, defenderElement);
    } catch (error) {
      return this.getElementMultiplierJS(attackerElement, defenderElement);
    }
  }

  static calculateDamage(
    attack: number,
    defense: number,
    skillPower: number,
    attackerElement: number,
    defenderElement: number
  ): { damage: number; isCritical: boolean } {
    if (!this.engineInstance) {
      return this.calculateDamageJS(attack, defense, skillPower, attackerElement, defenderElement);
    }

    try {
      const critRef = { value: false };
      const damage = this.engineInstance.calculateDamage(
        attack,
        defense,
        skillPower,
        attackerElement,
        defenderElement,
        critRef
      );
      return { damage, isCritical: critRef.value };
    } catch (error) {
      return this.calculateDamageJS(attack, defense, skillPower, attackerElement, defenderElement);
    }
  }

  static generateSkills(element: number): DragonSkill[] {
    if (!this.engineInstance) {
      return this.generateSkillsJS(element);
    }

    try {
      return this.engineInstance.generateSkills(element);
    } catch (error) {
      return this.generateSkillsJS(element);
    }
  }

  static getAttackAnimation(element: number, skillType: string): string {
    if (!this.engineInstance) {
      return this.getAttackAnimationJS(element, skillType);
    }

    try {
      return this.engineInstance.getAttackAnimation(element, skillType);
    } catch (error) {
      return this.getAttackAnimationJS(element, skillType);
    }
  }

  static calculateExpGain(winnerLevel: number, loserLevel: number): number {
    if (!this.engineInstance) {
      return 50 + Math.max(0, loserLevel - winnerLevel) * 10;
    }

    try {
      return this.engineInstance.calculateExpGain(winnerLevel, loserLevel);
    } catch (error) {
      return 50 + Math.max(0, loserLevel - winnerLevel) * 10;
    }
  }

  static checkLevelUp(stats: GameStats, expGained: number): { leveledUp: boolean; newStats: GameStats } {
    const newStats = { ...stats };
    newStats.exp += expGained;

    if (!this.engineInstance) {
      const leveledUp = newStats.exp >= newStats.expToNextLevel;
      if (leveledUp) {
        newStats.level++;
        newStats.exp -= newStats.expToNextLevel;
        newStats.maxHp = Math.floor(newStats.maxHp * 1.10);
        newStats.hp = newStats.maxHp;
        newStats.attack = Math.floor(newStats.attack * 1.08);
        newStats.defense = Math.floor(newStats.defense * 1.08);
        newStats.speed = Math.floor(newStats.speed * 1.05);
        newStats.expToNextLevel = Math.floor(100 * Math.pow(newStats.level, 1.5));
      }
      return { leveledUp, newStats };
    }

    try {
      const leveledUp = this.engineInstance.checkLevelUp(newStats, expGained);
      return { leveledUp, newStats };
    } catch (error) {
      // JS fallback already handled above
      const leveledUp = newStats.exp >= newStats.expToNextLevel;
      return { leveledUp, newStats };
    }
  }

  // JavaScript fallback implementations
  private static calculateStatsJS(element: number, powerType: number, level: number): GameStats {
    const baseStat = 10;
    const elementBonus = element * 2;
    const powerMultiplier = powerType === 2 ? 1.5 : powerType === 1 ? 1.2 : 1.0;
    const baseValue = Math.floor((baseStat + elementBonus) * powerMultiplier);

    const maxHp = Math.floor(baseValue * 10 * Math.pow(1.1, level - 1));
    return {
      hp: maxHp,
      maxHp,
      attack: Math.floor(baseValue * Math.pow(1.08, level - 1)),
      defense: Math.floor(baseValue * 0.8 * Math.pow(1.08, level - 1)),
      speed: Math.floor(baseValue * 1.2 * Math.pow(1.05, level - 1)),
      level,
      exp: 0,
      expToNextLevel: Math.floor(100 * Math.pow(level, 1.5))
    };
  }

  private static getElementMultiplierJS(attackerElement: number, defenderElement: number): number {
    const effectiveness: Record<number, { strong: number[]; weak: number[] }> = {
      0: { strong: [2, 6], weak: [1, 8] },
      1: { strong: [0, 9], weak: [2, 6] },
      2: { strong: [9, 7], weak: [0, 6] },
      3: { strong: [2, 6], weak: [9, 8] },
      4: { strong: [5, 3], weak: [5, 2] },
      5: { strong: [4, 3], weak: [4, 7] },
      6: { strong: [1, 2], weak: [0, 8] },
      7: { strong: [8, 6], weak: [0, 9] },
      8: { strong: [2, 6], weak: [0, 7] },
      9: { strong: [1, 3], weak: [2] }
    };

    if (attackerElement === defenderElement) return 1.0;

    const data = effectiveness[attackerElement];
    if (data?.strong.includes(defenderElement)) return 1.5;
    if (data?.weak.includes(defenderElement)) return 0.7;

    return 1.0;
  }

  private static calculateDamageJS(
    attack: number,
    defense: number,
    skillPower: number,
    attackerElement: number,
    defenderElement: number
  ): { damage: number; isCritical: boolean } {
    let baseDamage = (attack * skillPower / 100) - (defense * 0.5);
    baseDamage = Math.max(1, baseDamage);

    const elementMultiplier = this.getElementMultiplierJS(attackerElement, defenderElement);
    const isCritical = Math.random() < 0.15;
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const randomFactor = 0.85 + Math.random() * 0.3;

    const damage = Math.max(1, Math.floor(baseDamage * elementMultiplier * critMultiplier * randomFactor));
    return { damage, isCritical };
  }

  private static generateSkillsJS(element: number): DragonSkill[] {
    const elementNames = ['Fire', 'Water', 'Earth', 'Air', 'Dark', 'Light', 'Nature', 'Metal', 'Ice', 'Electric'];
    const skills: DragonSkill[] = [
      {
        id: `basic_${element}`,
        name: 'Basic Attack',
        element,
        power: 50,
        accuracy: 100,
        cooldown: 0,
        type: 'attack'
      },
      {
        id: `special_${element}`,
        name: `${elementNames[element]} Burst`,
        element,
        power: 80,
        accuracy: 90,
        cooldown: 2,
        type: 'attack'
      },
      {
        id: `ultimate_${element}`,
        name: `${elementNames[element]} Storm`,
        element,
        power: 120,
        accuracy: 75,
        cooldown: 4,
        type: 'attack'
      }
    ];

    if (element === 5) {
      skills.push({
        id: `heal_${element}`,
        name: 'Healing Light',
        element,
        power: 50,
        accuracy: 100,
        cooldown: 3,
        type: 'heal'
      });
    }

    return skills;
  }

  private static getAttackAnimationJS(element: number, skillType: string): string {
    const animations: Record<number, Record<string, string>> = {
      0: { ultimate: 'fire_blast', basic: 'fire_strike' },
      1: { ultimate: 'water_tsunami', basic: 'water_splash' },
      2: { ultimate: 'earth_quake', basic: 'rock_throw' },
      3: { ultimate: 'tornado', basic: 'wind_slash' },
      4: { ultimate: 'dark_void', basic: 'shadow_claw' },
      5: { ultimate: 'holy_beam', basic: 'light_ray' },
      6: { ultimate: 'vine_whip', basic: 'leaf_storm' },
      7: { ultimate: 'metal_burst', basic: 'steel_edge' },
      8: { ultimate: 'blizzard', basic: 'ice_shard' },
      9: { ultimate: 'thunderbolt', basic: 'spark' }
    };

    return animations[element]?.[skillType] || 'basic_attack';
  }

  static cleanup() {
    if (this.engineInstance) {
      this.engineInstance.delete();
      this.engineInstance = null;
    }
    this.isInitialized = false;
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  DragonCityEngine.initialize().catch(console.error);
}
