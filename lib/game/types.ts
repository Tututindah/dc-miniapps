/**
 * Dragon City Game Engine Types
 */

import type { Element, PowerType, Dragon } from '../types';

// Re-export common types
export type { Element, PowerType, Dragon };

// Game Stats
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

// Dragon Skill
export interface DragonSkill {
  id: string;
  name: string;
  element: number; // 0-9
  power: number;
  accuracy: number;
  cooldown: number;
  type: string;
}

// Blockchain Dragon (matches C++ struct)
export interface BlockchainDragon {
  id: bigint;
  element: number; // 0-9
  powerType: number; // 0-2
  level: number;
  experience: bigint;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  originChainId: number;
}

// Battle Result
export interface BattleResult {
  damage: number;
  isCritical: boolean;
}

// Level Up Result
export interface LevelUpResult {
  leveledUp: boolean;
  newStats: GameStats;
}
