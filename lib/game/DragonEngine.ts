/**
 * Dragon City Game Engine
 * Core gameplay systems for dragon management, battles, breeding, and training
 */

import { Element, PowerType, Dragon } from '../types';

// Dragon Stats System
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

// Dragon Skills
export interface DragonSkill {
  id: string;
  name: string;
  element: Element;
  power: number;
  accuracy: number;
  cooldown: number;
  description: string;
}

// Battle System
export interface BattleState {
  attacker: DragonBattler;
  defender: DragonBattler;
  turn: number;
  phase: 'intro' | 'attack' | 'defend' | 'result';
  winner: 'attacker' | 'defender' | null;
  log: BattleLog[];
}

export interface DragonBattler {
  dragonId: bigint;
  stats: DragonStats;
  currentHp: number;
  element: Element;
  powerType: PowerType;
  skills: DragonSkill[];
  cooldowns: Map<string, number>;
}

export interface BattleLog {
  turn: number;
  action: string;
  damage?: number;
  healing?: number;
  effect?: string;
}

// Element Effectiveness Matrix
const ELEMENT_EFFECTIVENESS: Record<number, { strong: number[]; weak: number[] }> = {
  0: { strong: [2, 6], weak: [1, 8] },      // Fire > Earth, Nature | Fire < Water, Ice
  1: { strong: [0, 9], weak: [2, 6] },      // Water > Fire, Electric | Water < Earth, Nature
  2: { strong: [9, 7], weak: [0, 6] },      // Earth > Electric, Metal | Earth < Fire, Nature
  3: { strong: [2, 6], weak: [9, 8] },      // Air > Earth, Nature | Air < Electric, Ice
  4: { strong: [5, 3], weak: [5, 2] },      // Dark > Light, Air | Dark < Light, Earth
  5: { strong: [4, 3], weak: [4, 7] },      // Light > Dark, Air | Light < Dark, Metal
  6: { strong: [1, 2], weak: [0, 8] },      // Nature > Water, Earth | Nature < Fire, Ice
  7: { strong: [8, 6], weak: [0, 9] },      // Metal > Ice, Nature | Metal < Fire, Electric
  8: { strong: [2, 6], weak: [0, 7] },      // Ice > Earth, Nature | Ice < Fire, Metal
  9: { strong: [1, 3], weak: [2] },         // Electric > Water, Air | Electric < Earth
};

export class DragonGameEngine {
  // Calculate dragon stats based on base dragon data
  static calculateStats(dragon: Dragon, level: number = 1): DragonStats {
    const baseStat = 10;
    const elementBonus = Number(dragon.element) * 2;
    const powerMultiplier = dragon.powerType === 2 ? 1.5 : dragon.powerType === 1 ? 1.2 : 1.0;
    
    const baseHp = Math.floor((baseStat + elementBonus + 20) * powerMultiplier * level);
    const baseAttack = Math.floor((baseStat + elementBonus) * powerMultiplier * (level * 0.8));
    const baseDefense = Math.floor((baseStat + elementBonus * 0.7) * powerMultiplier * (level * 0.7));
    const baseSpeed = Math.floor((baseStat + Number(dragon.element)) * (level * 0.5));
    
    const expToNextLevel = Math.floor(100 * Math.pow(level, 1.5));
    
    return {
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAttack,
      defense: baseDefense,
      speed: baseSpeed,
      level,
      exp: 0,
      expToNextLevel,
    };
  }

  // Get element effectiveness multiplier
  static getElementMultiplier(attackerElement: Element, defenderElement: Element): number {
    const effectiveness = ELEMENT_EFFECTIVENESS[attackerElement];
    
    if (effectiveness.strong.includes(defenderElement)) {
      return 1.5; // Super effective
    }
    if (effectiveness.weak.includes(defenderElement)) {
      return 0.7; // Not very effective
    }
    return 1.0; // Normal
  }

  // Calculate damage
  static calculateDamage(
    attacker: DragonBattler,
    defender: DragonBattler,
    skill: DragonSkill,
    isCritical: boolean = false
  ): number {
    const baseDamage = attacker.stats.attack * (skill.power / 100);
    const elementMultiplier = this.getElementMultiplier(attacker.element, defender.element);
    const defenseReduction = Math.max(0, baseDamage - (defender.stats.defense * 0.5));
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const randomFactor = 0.85 + Math.random() * 0.3; // 85% to 115%
    
    return Math.floor(defenseReduction * elementMultiplier * critMultiplier * randomFactor);
  }

  // Check if attack hits
  static doesAttackHit(skill: DragonSkill): boolean {
    return Math.random() * 100 < skill.accuracy;
  }

  // Check if attack is critical
  static isCriticalHit(attackerSpeed: number, defenderSpeed: number): boolean {
    const critChance = Math.min(30, (attackerSpeed / (attackerSpeed + defenderSpeed)) * 25);
    return Math.random() * 100 < critChance;
  }

  // Generate dragon skills based on element
  static generateSkills(element: Element, powerType: PowerType): DragonSkill[] {
    const elementNames = ['Fire', 'Water', 'Earth', 'Air', 'Dark', 'Light', 'Nature', 'Metal', 'Ice', 'Electric'];
    const elementName = elementNames[element] || 'Dragon';
    const powerBonus = powerType === 2 ? 20 : powerType === 1 ? 10 : 0;

    const skills: DragonSkill[] = [
      {
        id: `${element}-basic`,
        name: `${elementName} Strike`,
        element,
        power: 50 + powerBonus,
        accuracy: 100,
        cooldown: 0,
        description: `A basic ${elementName.toLowerCase()} attack`,
      },
      {
        id: `${element}-special`,
        name: `${elementName} Blast`,
        element,
        power: 80 + powerBonus,
        accuracy: 90,
        cooldown: 2,
        description: `A powerful ${elementName.toLowerCase()} special attack`,
      },
      {
        id: `${element}-ultimate`,
        name: `${elementName} Fury`,
        element,
        power: 120 + powerBonus,
        accuracy: 75,
        cooldown: 4,
        description: `Ultimate ${elementName.toLowerCase()} technique`,
      },
    ];

    // Add heal skill for Light element
    if (element === 5) {
      skills.push({
        id: 'light-heal',
        name: 'Healing Light',
        element: 5,
        power: -50, // Negative = healing
        accuracy: 100,
        cooldown: 3,
        description: 'Restore HP with divine light',
      });
    }

    return skills;
  }

  // Initialize battle
  static initializeBattle(
    attackerDragon: Dragon,
    defenderDragon: Dragon,
    attackerStats: DragonStats,
    defenderStats: DragonStats
  ): BattleState {
    const attackerBattler: DragonBattler = {
      dragonId: attackerDragon.id,
      stats: attackerStats,
      currentHp: attackerStats.hp,
      element: attackerDragon.element as Element,
      powerType: attackerDragon.powerType as PowerType,
      skills: this.generateSkills(attackerDragon.element as Element, attackerDragon.powerType as PowerType),
      cooldowns: new Map(),
    };

    const defenderBattler: DragonBattler = {
      dragonId: defenderDragon.id,
      stats: defenderStats,
      currentHp: defenderStats.hp,
      element: defenderDragon.element as Element,
      powerType: defenderDragon.powerType as PowerType,
      skills: this.generateSkills(defenderDragon.element as Element, defenderDragon.powerType as PowerType),
      cooldowns: new Map(),
    };

    return {
      attacker: attackerBattler,
      defender: defenderBattler,
      turn: 1,
      phase: 'intro',
      winner: null,
      log: [],
    };
  }

  // Execute battle turn
  static executeTurn(battle: BattleState, attackerSkillId: string): BattleState {
    const newBattle = { ...battle };
    const skill = newBattle.attacker.skills.find(s => s.id === attackerSkillId);
    
    if (!skill) return battle;

    // Check cooldown
    const cooldown = newBattle.attacker.cooldowns.get(skill.id) || 0;
    if (cooldown > 0) {
      newBattle.log.push({
        turn: battle.turn,
        action: `${skill.name} is on cooldown!`,
      });
      return newBattle;
    }

    // Check if attack hits
    if (!this.doesAttackHit(skill)) {
      newBattle.log.push({
        turn: battle.turn,
        action: `${skill.name} missed!`,
      });
      this.decrementCooldowns(newBattle.attacker);
      this.switchTurns(newBattle);
      return newBattle;
    }

    // Check critical
    const isCrit = this.isCriticalHit(newBattle.attacker.stats.speed, newBattle.defender.stats.speed);
    
    // Calculate damage
    const damage = this.calculateDamage(newBattle.attacker, newBattle.defender, skill, isCrit);
    
    if (skill.power > 0) {
      // Damaging attack
      newBattle.defender.currentHp = Math.max(0, newBattle.defender.currentHp - damage);
      
      const elementMultiplier = this.getElementMultiplier(newBattle.attacker.element, newBattle.defender.element);
      let effectiveness = '';
      if (elementMultiplier > 1) effectiveness = ' (Super effective!)';
      if (elementMultiplier < 1) effectiveness = ' (Not very effective...)';
      
      newBattle.log.push({
        turn: battle.turn,
        action: `${skill.name} deals ${damage} damage${isCrit ? ' (Critical!)' : ''}${effectiveness}`,
        damage,
        effect: isCrit ? 'critical' : effectiveness ? 'effective' : undefined,
      });
    } else {
      // Healing skill
      const healing = Math.abs(skill.power);
      newBattle.attacker.currentHp = Math.min(
        newBattle.attacker.stats.maxHp,
        newBattle.attacker.currentHp + healing
      );
      
      newBattle.log.push({
        turn: battle.turn,
        action: `${skill.name} restores ${healing} HP`,
        healing,
      });
    }

    // Set cooldown
    if (skill.cooldown > 0) {
      newBattle.attacker.cooldowns.set(skill.id, skill.cooldown);
    }

    // Check if battle is over
    if (newBattle.defender.currentHp <= 0) {
      newBattle.phase = 'result';
      newBattle.winner = 'attacker';
      newBattle.log.push({
        turn: battle.turn,
        action: 'Victory!',
      });
    } else {
      // AI turn for defender
      this.decrementCooldowns(newBattle.attacker);
      this.switchTurns(newBattle);
      this.aiTurn(newBattle);
    }

    return newBattle;
  }

  // AI Turn
  private static aiTurn(battle: BattleState): void {
    // Find available skills (not on cooldown)
    const availableSkills = battle.defender.skills.filter(skill => {
      const cooldown = battle.defender.cooldowns.get(skill.id) || 0;
      return cooldown === 0;
    });

    if (availableSkills.length === 0) {
      battle.log.push({
        turn: battle.turn,
        action: 'Enemy passes turn (all skills on cooldown)',
      });
      this.decrementCooldowns(battle.defender);
      this.switchTurns(battle);
      return;
    }

    // Simple AI: Prefer healing if HP < 30%, otherwise strongest available attack
    let chosenSkill: DragonSkill;
    
    if (battle.defender.currentHp < battle.defender.stats.maxHp * 0.3) {
      const healSkill = availableSkills.find(s => s.power < 0);
      chosenSkill = healSkill || availableSkills.sort((a, b) => b.power - a.power)[0];
    } else {
      chosenSkill = availableSkills.sort((a, b) => b.power - a.power)[0];
    }

    // Execute AI attack
    if (!this.doesAttackHit(chosenSkill)) {
      battle.log.push({
        turn: battle.turn,
        action: `Enemy's ${chosenSkill.name} missed!`,
      });
      this.decrementCooldowns(battle.defender);
      this.switchTurns(battle);
      return;
    }

    const isCrit = this.isCriticalHit(battle.defender.stats.speed, battle.attacker.stats.speed);
    
    if (chosenSkill.power > 0) {
      const damage = this.calculateDamage(battle.defender, battle.attacker, chosenSkill, isCrit);
      battle.attacker.currentHp = Math.max(0, battle.attacker.currentHp - damage);
      
      battle.log.push({
        turn: battle.turn,
        action: `Enemy uses ${chosenSkill.name} for ${damage} damage${isCrit ? ' (Critical!)' : ''}`,
        damage,
      });

      if (battle.attacker.currentHp <= 0) {
        battle.phase = 'result';
        battle.winner = 'defender';
        battle.log.push({
          turn: battle.turn,
          action: 'Defeated...',
        });
      }
    } else {
      const healing = Math.abs(chosenSkill.power);
      battle.defender.currentHp = Math.min(
        battle.defender.stats.maxHp,
        battle.defender.currentHp + healing
      );
      
      battle.log.push({
        turn: battle.turn,
        action: `Enemy uses ${chosenSkill.name} and restores ${healing} HP`,
        healing,
      });
    }

    if (chosenSkill.cooldown > 0) {
      battle.defender.cooldowns.set(chosenSkill.id, chosenSkill.cooldown);
    }

    this.decrementCooldowns(battle.defender);
    this.switchTurns(battle);
  }

  // Helper: Decrement all cooldowns
  private static decrementCooldowns(battler: DragonBattler): void {
    battler.cooldowns.forEach((value, key) => {
      if (value > 0) {
        battler.cooldowns.set(key, value - 1);
      }
    });
  }

  // Helper: Switch turns
  private static switchTurns(battle: BattleState): void {
    battle.turn += 1;
  }

  // Calculate exp gained from battle
  static calculateExpGain(winner: DragonBattler, loser: DragonBattler): number {
    const baseExp = 50;
    const levelDiff = loser.stats.level - winner.stats.level;
    const levelBonus = Math.max(0, levelDiff * 10);
    return Math.floor(baseExp + levelBonus);
  }

  // Check if dragon levels up
  static checkLevelUp(stats: DragonStats, expGained: number): { leveledUp: boolean; newStats: DragonStats } {
    const newExp = stats.exp + expGained;
    
    if (newExp >= stats.expToNextLevel) {
      const newLevel = stats.level + 1;
      const newStats = {
        ...stats,
        level: newLevel,
        exp: newExp - stats.expToNextLevel,
        expToNextLevel: Math.floor(100 * Math.pow(newLevel, 1.5)),
      };
      
      // Increase stats on level up
      newStats.maxHp = Math.floor(newStats.maxHp * 1.1);
      newStats.hp = newStats.maxHp;
      newStats.attack = Math.floor(newStats.attack * 1.08);
      newStats.defense = Math.floor(newStats.defense * 1.08);
      newStats.speed = Math.floor(newStats.speed * 1.05);
      
      return { leveledUp: true, newStats };
    }
    
    return {
      leveledUp: false,
      newStats: { ...stats, exp: newExp },
    };
  }
}
