// Mission System Manager - Client-side interface for smart contract

export enum MissionType {
  ADD_LIQUIDITY,
  SWAP_TOKENS,
  FOLLOW_FARCASTER,
  OPEN_MINIAPP,
  BATTLE_WIN,
  BREED_DRAGON,
  TRAIN_DRAGON,
  CUSTOM
}

export enum MissionStatus {
  ACTIVE,
  COMPLETED,
  EXPIRED,
  CANCELLED
}

export interface Mission {
  id: string;
  creator: string;
  creatorDragonId: string;
  missionType: MissionType;
  title: string;
  description: string;
  verificationData: MissionVerificationData;
  rewardETH: string;
  rewardTokens: string;
  expMultiplier: number;
  maxCompletions: number;
  completionsCount: number;
  expiresAt: number;
  status: MissionStatus;
  requiresVerification: boolean;
}

export interface MissionVerificationData {
  // For FOLLOW_FARCASTER
  fid?: string;
  farcasterUsername?: string;
  
  // For ADD_LIQUIDITY
  poolContract?: string;
  minAmount?: string;
  tokenA?: string;
  tokenB?: string;
  
  // For SWAP_TOKENS
  dexContract?: string;
  minSwapAmount?: string;
  fromToken?: string;
  toToken?: string;
  
  // For OPEN_MINIAPP
  miniAppUrl?: string;
  miniAppId?: string;
  minTimeSeconds?: number;
  
  // For BATTLE_WIN
  minWins?: number;
  minLevel?: number;
  
  // For BREED_DRAGON
  requiredElements?: number[];
  
  // For TRAIN_DRAGON
  targetLevel?: number;
  
  // For CUSTOM
  customInstructions?: string;
  customVerificationUrl?: string;
}

export interface MissionCompletion {
  missionId: string;
  player: string;
  completedAt: number;
  proofData: string;
  verified: boolean;
  rewardClaimed: boolean;
}

export interface CreateMissionParams {
  dragonId: bigint;
  missionType: MissionType;
  title: string;
  description: string;
  verificationData: MissionVerificationData;
  expMultiplier: number;
  maxCompletions: number;
  durationDays: number;
  requiresVerification: boolean;
  fundingETH?: string;
}

export class MissionSystemManager {
  private missionCreationFee = '0.001';

  // Mission templates for easy creation
  static MISSION_TEMPLATES = {
    FOLLOW_FARCASTER: {
      title: 'Follow on Farcaster',
      description: 'Follow my Farcaster profile and earn rewards!',
      missionType: MissionType.FOLLOW_FARCASTER,
      expMultiplier: 1500,
      maxCompletions: 100,
      durationDays: 30,
      requiresVerification: true
    },
    ADD_LIQUIDITY: {
      title: 'Add Liquidity to Pool',
      description: 'Add liquidity to the Dragon/ETH pool and earn trading fees + rewards!',
      missionType: MissionType.ADD_LIQUIDITY,
      expMultiplier: 3000,
      maxCompletions: 50,
      durationDays: 14,
      requiresVerification: true
    },
    SWAP_TOKENS: {
      title: 'Trade on DEX',
      description: 'Perform a swap on Uniswap and earn bonus rewards!',
      missionType: MissionType.SWAP_TOKENS,
      expMultiplier: 2000,
      maxCompletions: 200,
      durationDays: 7,
      requiresVerification: false
    },
    OPEN_MINIAPP: {
      title: 'Explore New MiniApp',
      description: 'Open and explore our partner MiniApp for at least 5 minutes!',
      missionType: MissionType.OPEN_MINIAPP,
      expMultiplier: 1200,
      maxCompletions: 500,
      durationDays: 60,
      requiresVerification: false
    },
    BATTLE_WIN: {
      title: 'Battle Master Challenge',
      description: 'Win 10 battles to prove your dragon training skills!',
      missionType: MissionType.BATTLE_WIN,
      expMultiplier: 2500,
      maxCompletions: 100,
      durationDays: 30,
      requiresVerification: false
    },
    BREED_DRAGON: {
      title: 'Breeding Expert Quest',
      description: 'Breed a Fire and Water dragon to create a Steam dragon!',
      missionType: MissionType.BREED_DRAGON,
      expMultiplier: 3000,
      maxCompletions: 50,
      durationDays: 21,
      requiresVerification: false
    }
  };

  /**
   * Verify Farcaster follow
   */
  async verifyFarcasterFollow(userFid: string, targetFid: string): Promise<boolean> {
    try {
      // Call Farcaster API to check if userFid follows targetFid
      const response = await fetch(`https://api.warpcast.com/v2/user-by-fid?fid=${userFid}`);
      const userData = await response.json();
      
      // Check if user follows target
      const followsResponse = await fetch(
        `https://api.warpcast.com/v2/following?fid=${userFid}&limit=1000`
      );
      const followsData = await followsResponse.json();
      
      return followsData.result.users.some((u: any) => u.fid.toString() === targetFid);
    } catch (error) {
      console.error('Failed to verify Farcaster follow:', error);
      return false;
    }
  }

  /**
   * Verify liquidity addition
   */
  async verifyLiquidityAddition(
    userAddress: string,
    poolContract: string,
    minAmount: string
  ): Promise<{ verified: boolean; txHash?: string }> {
    try {
      // Check blockchain for AddLiquidity event
      // This is a simplified example - implement with your Web3 library
      const provider = (window as any).ethereum;
      if (!provider) return { verified: false };

      // Query AddLiquidity events for user address
      // const events = await contract.queryFilter(
      //   contract.filters.AddLiquidity(userAddress),
      //   -1000 // Last 1000 blocks
      // );

      // For demo, return placeholder
      return {
        verified: true,
        txHash: '0x...'
      };
    } catch (error) {
      console.error('Failed to verify liquidity:', error);
      return { verified: false };
    }
  }

  /**
   * Verify token swap
   */
  async verifyTokenSwap(
    userAddress: string,
    dexContract: string,
    minSwapAmount: string
  ): Promise<{ verified: boolean; txHash?: string }> {
    try {
      // Check for Swap events on DEX contract
      // Similar to liquidity verification
      return {
        verified: true,
        txHash: '0x...'
      };
    } catch (error) {
      console.error('Failed to verify swap:', error);
      return { verified: false };
    }
  }

  /**
   * Track MiniApp visit
   */
  trackMiniAppVisit(miniAppId: string, startTime: number): void {
    const visitData = {
      miniAppId,
      startTime,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    localStorage.setItem(`miniapp_visit_${miniAppId}`, JSON.stringify(visitData));
  }

  /**
   * Verify MiniApp visit duration
   */
  verifyMiniAppVisit(miniAppId: string, minDurationSeconds: number): boolean {
    const visitDataStr = localStorage.getItem(`miniapp_visit_${miniAppId}`);
    if (!visitDataStr) return false;

    try {
      const visitData = JSON.parse(visitDataStr);
      const duration = (Date.now() - visitData.startTime) / 1000;
      return duration >= minDurationSeconds;
    } catch {
      return false;
    }
  }

  /**
   * Generate proof data for mission completion
   */
  generateProofData(missionType: MissionType, data: any): string {
    const proof = {
      type: MissionType[missionType],
      timestamp: Date.now(),
      ...data
    };

    return JSON.stringify(proof);
  }

  /**
   * Parse verification data from JSON string
   */
  parseVerificationData(jsonStr: string): MissionVerificationData {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  }

  /**
   * Format mission for display
   */
  formatMission(mission: Mission): {
    icon: string;
    color: string;
    category: string;
    difficulty: string;
  } {
    const typeMapping: Record<MissionType, any> = {
      [MissionType.ADD_LIQUIDITY]: {
        icon: '💧',
        color: 'blue',
        category: 'DeFi',
        difficulty: 'Hard'
      },
      [MissionType.SWAP_TOKENS]: {
        icon: '🔄',
        color: 'purple',
        category: 'DeFi',
        difficulty: 'Medium'
      },
      [MissionType.FOLLOW_FARCASTER]: {
        icon: '👥',
        color: 'pink',
        category: 'Social',
        difficulty: 'Easy'
      },
      [MissionType.OPEN_MINIAPP]: {
        icon: '🎮',
        color: 'green',
        category: 'Explore',
        difficulty: 'Easy'
      },
      [MissionType.BATTLE_WIN]: {
        icon: '⚔️',
        color: 'red',
        category: 'Battle',
        difficulty: 'Hard'
      },
      [MissionType.BREED_DRAGON]: {
        icon: '💕',
        color: 'pink',
        category: 'Breeding',
        difficulty: 'Medium'
      },
      [MissionType.TRAIN_DRAGON]: {
        icon: '🥋',
        color: 'yellow',
        category: 'Training',
        difficulty: 'Medium'
      },
      [MissionType.CUSTOM]: {
        icon: '✨',
        color: 'purple',
        category: 'Special',
        difficulty: 'Varies'
      }
    };

    return typeMapping[mission.missionType] || typeMapping[MissionType.CUSTOM];
  }

  /**
   * Calculate time remaining
   */
  getTimeRemaining(expiresAt: number): string {
    const now = Date.now() / 1000;
    const remaining = expiresAt - now;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /**
   * Calculate reward value in USD (mock)
   */
  calculateRewardValue(rewardETH: string, ethPriceUSD: number): number {
    const ethAmount = parseFloat(rewardETH);
    return ethAmount * ethPriceUSD;
  }
}

export const missionManager = new MissionSystemManager();
