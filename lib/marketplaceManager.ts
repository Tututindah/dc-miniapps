// Dragon Marketplace Manager - Floor pricing and trade-in system

export interface DragonListing {
  dragonId: string;
  seller: string;
  price: string;
  isActive: boolean;
  listedAt: number;
  dragonData?: {
    element: number;
    rarity: number;
    level: number;
    imageUrl: string;
    name: string;
  };
}

export interface FloorPrice {
  element: number;
  rarity: number;
  floorPrice: string;
  lastUpdated: number;
}

export interface TradeOffer {
  offerId: string;
  offerer: string;
  offeredDragonId: string;
  target: string;
  targetDragonId: string;
  ethDifference: string;
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
  offeredDragonData?: any;
  targetDragonData?: any;
}

export interface TradeCalculation {
  offeredFloor: string;
  targetFloor: string;
  baseDifference: string;
  premium: string;
  totalETHRequired: string;
  sellerReceives: string;
  marketplaceFee: string;
}

export class DragonMarketplaceManager {
  private marketplaceFeePercent = 10; // 10%
  private tradeInFeePercent = 20; // 20%

  /**
   * Calculate trade-in values
   * Example: Dragon A floor = 1 ETH, Dragon B floor = 2 ETH
   * User A pays: (2 - 1) + (1 * 0.20) = 1.2 ETH
   * User B receives: 1.2 - (1.2 * 0.10) = 1.08 ETH
   */
  calculateTradeIn(
    offeredFloorETH: number,
    targetFloorETH: number
  ): TradeCalculation {
    let totalETHRequired = 0;
    let sellerReceives = 0;
    let baseDifference = 0;
    let premium = 0;

    if (targetFloorETH > offeredFloorETH) {
      baseDifference = targetFloorETH - offeredFloorETH;
      premium = baseDifference * (this.tradeInFeePercent / 100);
      totalETHRequired = baseDifference + premium;
      
      const marketplaceFee = totalETHRequired * (this.marketplaceFeePercent / 100);
      sellerReceives = totalETHRequired - marketplaceFee;

      return {
        offeredFloor: offeredFloorETH.toString(),
        targetFloor: targetFloorETH.toString(),
        baseDifference: baseDifference.toString(),
        premium: premium.toString(),
        totalETHRequired: totalETHRequired.toString(),
        sellerReceives: sellerReceives.toString(),
        marketplaceFee: marketplaceFee.toString()
      };
    }

    // Target is cheaper or equal - no ETH required
    return {
      offeredFloor: offeredFloorETH.toString(),
      targetFloor: targetFloorETH.toString(),
      baseDifference: '0',
      premium: '0',
      totalETHRequired: '0',
      sellerReceives: '0',
      marketplaceFee: '0'
    };
  }

  /**
   * Format trade calculation for UI display
   */
  formatTradeCalculation(calc: TradeCalculation): {
    youPay: string;
    theyReceive: string;
    savings: string;
    breakdown: string[];
  } {
    const baseDiff = parseFloat(calc.baseDifference);
    const premium = parseFloat(calc.premium);
    const total = parseFloat(calc.totalETHRequired);
    const sellerGets = parseFloat(calc.sellerReceives);

    const breakdown = [];
    
    if (baseDiff > 0) {
      breakdown.push(`Floor Price Difference: ${baseDiff.toFixed(4)} ETH`);
      breakdown.push(`Trade-in Premium (${this.tradeInFeePercent}%): ${premium.toFixed(4)} ETH`);
      breakdown.push(`Marketplace Fee (${this.marketplaceFeePercent}%): ${(total - sellerGets).toFixed(4)} ETH`);
    }

    return {
      youPay: `${total.toFixed(4)} ETH`,
      theyReceive: `${sellerGets.toFixed(4)} ETH`,
      savings: calc.baseDifference,
      breakdown
    };
  }

  /**
   * Get recommended trade offers based on user's dragons
   */
  findBestTradeOpportunities(
    userDragons: any[],
    availableDragons: any[],
    floorPrices: Map<string, number>
  ): Array<{
    offeredDragon: any;
    targetDragon: any;
    value: number;
    reason: string;
  }> {
    const opportunities = [];

    for (const userDragon of userDragons) {
      const userFloor = floorPrices.get(`${userDragon.element}_${userDragon.rarity}`) || 0;

      for (const targetDragon of availableDragons) {
        const targetFloor = floorPrices.get(`${targetDragon.element}_${targetDragon.rarity}`) || 0;

        // Find upgrade opportunities
        if (targetFloor > userFloor && targetFloor <= userFloor * 1.5) {
          const calc = this.calculateTradeIn(userFloor, targetFloor);
          
          opportunities.push({
            offeredDragon: userDragon,
            targetDragon: targetDragon,
            value: parseFloat(calc.totalETHRequired),
            reason: 'Affordable Upgrade'
          });
        }

        // Find element collection opportunities
        if (userDragon.element !== targetDragon.element) {
          const calc = this.calculateTradeIn(userFloor, targetFloor);
          
          opportunities.push({
            offeredDragon: userDragon,
            targetDragon: targetDragon,
            value: parseFloat(calc.totalETHRequired),
            reason: 'Complete Element Collection'
          });
        }
      }
    }

    // Sort by value (cheapest trades first)
    return opportunities.sort((a, b) => a.value - b.value).slice(0, 10);
  }

  /**
   * Calculate fair listing price based on floor
   */
  suggestListingPrice(
    element: number,
    rarity: number,
    level: number,
    floorPrice: number
  ): {
    floor: number;
    suggested: number;
    premium: number;
    reason: string;
  } {
    let premium = 0;
    let reason = 'Base floor price';

    // Add premium for high level
    if (level >= 10) {
      premium += floorPrice * 0.2; // +20%
      reason = 'High level (+20%)';
    } else if (level >= 5) {
      premium += floorPrice * 0.1; // +10%
      reason = 'Mid level (+10%)';
    }

    // Add premium for rare combinations
    if (rarity >= 3) {
      premium += floorPrice * 0.1; // +10%
      reason += ', Legendary (+10%)';
    }

    const suggested = floorPrice + premium;

    return {
      floor: floorPrice,
      suggested,
      premium,
      reason
    };
  }

  /**
   * Analyze market trends
   */
  analyzeMarketTrends(salesHistory: Array<{
    price: number;
    timestamp: number;
    element: number;
    rarity: number;
  }>): {
    trending: 'up' | 'down' | 'stable';
    avgPrice: number;
    volume24h: number;
    priceChange24h: number;
  } {
    const now = Date.now() / 1000;
    const last24h = salesHistory.filter(s => s.timestamp > now - 86400);
    const prev24h = salesHistory.filter(s => 
      s.timestamp > now - 172800 && s.timestamp <= now - 86400
    );

    const avg24h = last24h.reduce((sum, s) => sum + s.price, 0) / (last24h.length || 1);
    const avgPrev = prev24h.reduce((sum, s) => sum + s.price, 0) / (prev24h.length || 1);

    const priceChange = ((avg24h - avgPrev) / avgPrev) * 100;
    
    let trending: 'up' | 'down' | 'stable' = 'stable';
    if (priceChange > 5) trending = 'up';
    if (priceChange < -5) trending = 'down';

    return {
      trending,
      avgPrice: avg24h,
      volume24h: last24h.length,
      priceChange24h: priceChange
    };
  }

  /**
   * Format dragon listing for display
   */
  formatListing(listing: DragonListing, floorPrice?: number): {
    priceETH: string;
    priceUSD: string;
    isGoodDeal: boolean;
    discount: number;
  } {
    const priceETH = parseFloat(listing.price);
    const priceUSD = priceETH * 2000; // Mock ETH price

    let isGoodDeal = false;
    let discount = 0;

    if (floorPrice) {
      discount = ((floorPrice - priceETH) / floorPrice) * 100;
      isGoodDeal = discount > 10; // More than 10% below floor
    }

    return {
      priceETH: priceETH.toFixed(4),
      priceUSD: `$${priceUSD.toFixed(2)}`,
      isGoodDeal,
      discount
    };
  }

  /**
   * Get element and rarity names
   */
  getElementName(element: number): string {
    const elements = ['Fire', 'Water', 'Ice', 'Lightning', 'Nature', 'Shadow', 'Light', 'Cosmic'];
    return elements[element] || 'Unknown';
  }

  getRarityName(rarity: number): string {
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    return rarities[rarity] || 'Unknown';
  }

  getRarityColor(rarity: number): string {
    const colors = [
      'gray',    // Common
      'green',   // Uncommon
      'blue',    // Rare
      'purple',  // Epic
      'orange',  // Legendary
      'red'      // Mythic
    ];
    return colors[rarity] || 'gray';
  }

  /**
   * Validate trade offer
   */
  validateTradeOffer(
    offeredDragon: any,
    targetDragon: any,
    userAddress: string,
    targetOwner: string
  ): { valid: boolean; error?: string } {
    if (!offeredDragon) {
      return { valid: false, error: 'Offered dragon not found' };
    }

    if (!targetDragon) {
      return { valid: false, error: 'Target dragon not found' };
    }

    if (offeredDragon.id === targetDragon.id) {
      return { valid: false, error: 'Cannot trade same dragon' };
    }

    if (offeredDragon.owner !== userAddress) {
      return { valid: false, error: 'You do not own the offered dragon' };
    }

    if (targetDragon.owner !== targetOwner) {
      return { valid: false, error: 'Target owner mismatch' };
    }

    return { valid: true };
  }

  /**
   * Format time remaining for offer
   */
  getOfferTimeRemaining(expiresAt: number): string {
    const now = Date.now() / 1000;
    const remaining = expiresAt - now;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }
}

export const marketplaceManager = new DragonMarketplaceManager();
