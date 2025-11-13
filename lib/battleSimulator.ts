import { Dragon } from './types';

export interface BattleResult {
  winner: string;
  winnerDragonId: bigint;
  loser: string;
  loserDragonId: bigint;
  expGained: number;
  battleLog: string[];
}

export function simulateBattle(
  dragon1: Dragon,
  dragon2: Dragon,
  owner1: string,
  owner2: string
): BattleResult {
  const battleLog: string[] = [];
  
  battleLog.push(`⚔️ Battle Start: ${dragon1.name} vs ${dragon2.name}`);
  
  // Calculate base power with power type multiplier
  let power1 = calculatePower(dragon1);
  let power2 = calculatePower(dragon2);
  
  battleLog.push(`💪 ${dragon1.name} Power: ${power1}`);
  battleLog.push(`💪 ${dragon2.name} Power: ${power2}`);
  
  // Apply element advantage
  const advantage = getElementAdvantage(dragon1.element, dragon2.element);
  if (advantage > 0) {
    power1 = Math.floor(power1 * 1.2); // 20% bonus
    battleLog.push(`🔥 ${dragon1.name} has element advantage! +20%`);
  } else if (advantage < 0) {
    power2 = Math.floor(power2 * 1.2);
    battleLog.push(`🔥 ${dragon2.name} has element advantage! +20%`);
  }
  
  // Add controlled randomness (±10%)
  const random1 = 0.9 + Math.random() * 0.2;
  const random2 = 0.9 + Math.random() * 0.2;
  power1 = Math.floor(power1 * random1);
  power2 = Math.floor(power2 * random2);
  
  battleLog.push(`🎲 After luck factor: ${dragon1.name}=${power1}, ${dragon2.name}=${power2}`);
  
  // Determine winner
  let winner: string;
  let winnerDragonId: bigint;
  let loser: string;
  let loserDragonId: bigint;
  
  if (power1 > power2) {
    winner = owner1;
    winnerDragonId = dragon1.id;
    loser = owner2;
    loserDragonId = dragon2.id;
    battleLog.push(`🏆 ${dragon1.name} wins!`);
  } else if (power2 > power1) {
    winner = owner2;
    winnerDragonId = dragon2.id;
    loser = owner1;
    loserDragonId = dragon1.id;
    battleLog.push(`🏆 ${dragon2.name} wins!`);
  } else {
    // Tie - use speed as tiebreaker
    if (dragon1.speed > dragon2.speed) {
      winner = owner1;
      winnerDragonId = dragon1.id;
      loser = owner2;
      loserDragonId = dragon2.id;
      battleLog.push(`⚡ Tie! ${dragon1.name} wins by speed!`);
    } else {
      winner = owner2;
      winnerDragonId = dragon2.id;
      loser = owner1;
      loserDragonId = dragon1.id;
      battleLog.push(`⚡ Tie! ${dragon2.name} wins by speed!`);
    }
  }
  
  // Calculate experience reward
  const expGained = calculateExpReward(power1, power2);
  battleLog.push(`✨ Winner gains ${expGained} EXP`);
  
  return {
    winner,
    winnerDragonId,
    loser,
    loserDragonId,
    expGained,
    battleLog,
  };
}

function calculatePower(dragon: Dragon): number {
  // Base power from stats
  let basePower = dragon.attack * 2 + dragon.defense + dragon.speed;
  
  // Power type multiplier
  // Combined Power: 1.5x, Dual Power: 1.25x, Single Power: 1x
  const powerMultiplier = dragon.powerType === 2 ? 1.5 : dragon.powerType === 1 ? 1.25 : 1;
  
  // Level bonus
  const levelBonus = dragon.level * 5;
  
  return Math.floor((basePower * powerMultiplier) + levelBonus);
}

function getElementAdvantage(element1: number, element2: number): number {
  // 0: Fire, 1: Water, 2: Earth, 3: Air, 4: Dark, 5: Light
  // Fire > Earth > Air > Water > Fire
  // Light <> Dark
  
  if (element1 === element2) return 0;
  
  const advantages: { [key: string]: number } = {
    '0-2': 1, // Fire > Earth
    '2-3': 1, // Earth > Air
    '3-1': 1, // Air > Water
    '1-0': 1, // Water > Fire
    '5-4': 1, // Light > Dark
    '4-5': 1, // Dark > Light
  };
  
  const key = `${element1}-${element2}`;
  const reverseKey = `${element2}-${element1}`;
  
  if (advantages[key]) return 1;
  if (advantages[reverseKey]) return -1;
  
  return 0;
}

function calculateExpReward(winnerPower: number, loserPower: number): number {
  // Base exp: 50-150
  const baseExp = 50;
  
  // Bonus for defeating stronger opponent
  const powerDiff = loserPower - winnerPower;
  const diffBonus = powerDiff > 0 ? Math.floor(powerDiff / 10) : 0;
  
  // Random variance: ±20
  const variance = Math.floor(Math.random() * 41) - 20;
  
  const totalExp = Math.max(30, Math.min(200, baseExp + diffBonus + variance));
  
  return totalExp;
}
