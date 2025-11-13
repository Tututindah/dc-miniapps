// Element types (0-5 representing Fire, Water, Earth, Air, Dark, Light)
export type Element = 0 | 1 | 2 | 3 | 4 | 5;
// Power types (0 = Single, 1 = Dual, 2 = Combined)
export type PowerType = 0 | 1 | 2;

export interface Dragon {
  id: bigint;
  name: string;
  element: number;
  powerType: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  experience: bigint;
  birthTime: bigint;
  parent1: bigint;
  parent2: bigint;
  originChainId: bigint;
  isStandby: boolean;
}

export interface Egg {
  id: bigint;
  element: number;
  rarity: number;
  purchaseTime: bigint;
  hatched: boolean;
}

export interface Battle {
  id: bigint;
  challenger: string;
  challengerDragonId: bigint;
  opponent: string;
  opponentDragonId: bigint;
  timestamp: bigint;
  winner: string;
  completed: boolean;
  expReward: bigint;
}

export const ELEMENT_NAMES = ['Fire', 'Water', 'Earth', 'Air', 'Dark', 'Light'];
export const ELEMENT_COLORS = {
  0: '#FF4500', // Fire - red-orange
  1: '#1E90FF', // Water - blue
  2: '#8B4513', // Earth - brown
  3: '#87CEEB', // Air - sky blue
  4: '#4B0082', // Dark - indigo
  5: '#FFD700', // Light - gold
};

export const RARITY_NAMES = ['Basic', 'Rare', 'Legendary'];
export const RARITY_COLORS = {
  0: '#9CA3AF', // Basic - gray
  1: '#3B82F6', // Rare - blue
  2: '#F59E0B', // Legendary - gold
};

export const POWER_TYPE_NAMES = ['Single Power', 'Dual Power', 'Combined Power'];
export const POWER_TYPE_COLORS = {
  0: '#6B7280', // Single - gray
  1: '#8B5CF6', // Dual - purple
  2: '#EF4444', // Combined - red
};

export const CHAIN_NAMES: { [key: number]: string } = {
  8453: 'Base',
  42220: 'Celo',
  84532: 'Base Sepolia',
  44787: 'Celo Alfajores',
};
