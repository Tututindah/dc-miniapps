// TypeScript wrapper for WASM Game Engine
export class DragonEngineWASM {
  private static wasmModule: any = null;
  private static isInitialized = false;

  static async initialize() {
    if (this.isInitialized) return;

    try {
      // Load WASM module
      const response = await fetch('/wasm/DragonEngine.wasm');
      const wasmBytes = await response.arrayBuffer();
      const wasmModule = await WebAssembly.instantiate(wasmBytes);
      
      this.wasmModule = wasmModule.instance.exports;
      this.isInitialized = true;
      console.log('✅ Dragon Engine WASM initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WASM:', error);
      // Fallback to TypeScript implementation
      this.isInitialized = false;
    }
  }

  static calculateStats(element: number, powerType: number, level: number): DragonStats {
    if (!this.isInitialized || !this.wasmModule) {
      return this.calculateStatsJS(element, powerType, level);
    }

    try {
      const result = this.wasmModule.CalculateStats(element, powerType, level);
      const [hp, maxHp, attack, defense, speed, lvl, exp, expToNext] = result.split(',').map(Number);
      
      return {
        hp,
        maxHp,
        attack,
        defense,
        speed,
        level: lvl,
        exp,
        expToNextLevel: expToNext
      };
    } catch (error) {
      console.warn('WASM call failed, using JS fallback:', error);
      return this.calculateStatsJS(element, powerType, level);
    }
  }

  static getElementMultiplier(attackerElement: number, defenderElement: number): number {
    if (!this.isInitialized || !this.wasmModule) {
      return this.getElementMultiplierJS(attackerElement, defenderElement);
    }

    return this.wasmModule.GetElementMultiplier(attackerElement, defenderElement);
  }

  static calculateDamage(
    attack: number,
    defense: number,
    skillPower: number,
    attackerElement: number,
    defenderElement: number
  ): { damage: number; isCritical: boolean } {
    if (!this.isInitialized || !this.wasmModule) {
      return this.calculateDamageJS(attack, defense, skillPower, attackerElement, defenderElement);
    }

    const isCritical = Math.random() < 0.15;
    const damage = this.wasmModule.CalculateDamage(
      attack,
      defense,
      skillPower,
      attackerElement,
      defenderElement,
      isCritical
    );

    return { damage, isCritical };
  }

  static getAttackAnimation(element: number, skillType: string): string {
    if (!this.isInitialized || !this.wasmModule) {
      return this.getAttackAnimationJS(element, skillType);
    }

    return this.wasmModule.GetAttackAnimation(element, skillType);
  }

  static generateSkills(element: number): DragonSkill[] {
    if (!this.isInitialized || !this.wasmModule) {
      return this.generateSkillsJS(element);
    }

    const result = this.wasmModule.GenerateSkills(element);
    const skillStrings = result.split('|');
    
    return skillStrings.map((skillStr: string) => {
      const [id, name, elem, power, accuracy, cooldown, type] = skillStr.split(',');
      return {
        id,
        name,
        element: Number(elem),
        power: Number(power),
        accuracy: Number(accuracy),
        cooldown: Number(cooldown),
        currentCooldown: 0,
        type
      };
    });
  }

  // JavaScript fallback implementations
  private static calculateStatsJS(element: number, powerType: number, level: number): DragonStats {
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
        currentCooldown: 0,
        type: 'attack'
      },
      {
        id: `special_${element}`,
        name: `${elementNames[element]} Burst`,
        element,
        power: 80,
        accuracy: 90,
        cooldown: 2,
        currentCooldown: 0,
        type: 'attack'
      },
      {
        id: `ultimate_${element}`,
        name: `${elementNames[element]} Storm`,
        element,
        power: 120,
        accuracy: 75,
        cooldown: 4,
        currentCooldown: 0,
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
        currentCooldown: 0,
        type: 'heal'
      });
    }

    return skills;
  }
}

export interface DragonStats {
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
  currentCooldown: number;
  type: string;
}
