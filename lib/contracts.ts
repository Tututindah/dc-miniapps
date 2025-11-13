export const DRAGON_NFT_ABI = [
  {
    "inputs": [{"internalType": "address","name": "to","type": "address"},{"internalType": "uint8","name": "element","type": "uint8"}],
    "name": "hatchEgg",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "parent1Id","type": "uint256"},{"internalType": "uint256","name": "parent2Id","type": "uint256"}],
    "name": "breedDragons",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"},{"internalType": "bool","name": "status","type": "bool"}],
    "name": "setStandbyStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "getDragon",
    "outputs": [{"components": [{"internalType": "uint256","name": "id","type": "uint256"},{"internalType": "string","name": "name","type": "string"},{"internalType": "uint8","name": "element","type": "uint8"},{"internalType": "uint8","name": "powerType","type": "uint8"},{"internalType": "uint16","name": "attack","type": "uint16"},{"internalType": "uint16","name": "defense","type": "uint16"},{"internalType": "uint16","name": "speed","type": "uint16"},{"internalType": "uint8","name": "level","type": "uint8"},{"internalType": "uint256","name": "experience","type": "uint256"},{"internalType": "uint256","name": "birthTime","type": "uint256"},{"internalType": "uint256","name": "parent1","type": "uint256"},{"internalType": "uint256","name": "parent2","type": "uint256"},{"internalType": "uint256","name": "originChainId","type": "uint256"},{"internalType": "bool","name": "isStandby","type": "bool"}],"internalType": "struct DragonNFT.Dragon","name": "","type": "tuple"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getUserDragons",
    "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "owner","type": "address"},{"internalType": "address","name": "operator","type": "address"}],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "operator","type": "address"},{"internalType": "bool","name": "approved","type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address","name": "","type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "owner","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const EGG_NFT_ABI = [
  {
    "inputs": [],
    "name": "buyEgg",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "hatchEgg",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "getEgg",
    "outputs": [{"components": [{"internalType": "uint256","name": "id","type": "uint256"},{"internalType": "uint8","name": "element","type": "uint8"},{"internalType": "uint8","name": "rarity","type": "uint8"},{"internalType": "uint256","name": "purchaseTime","type": "uint256"},{"internalType": "bool","name": "hatched","type": "bool"}],"internalType": "struct EggNFT.Egg","name": "","type": "tuple"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "EGG_PRICE",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const BATTLE_ARENA_ABI = [
  {
    "inputs": [{"internalType": "uint256","name": "myDragonId","type": "uint256"},{"internalType": "uint256","name": "opponentDragonId","type": "uint256"}],
    "name": "initiateBattle",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "battleId","type": "uint256"},{"internalType": "address","name": "winner","type": "address"},{"internalType": "uint256","name": "expGained","type": "uint256"}],
    "name": "submitBattleResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "battleId","type": "uint256"}],
    "name": "getBattle",
    "outputs": [{"components": [{"internalType": "uint256","name": "id","type": "uint256"},{"internalType": "address","name": "challenger","type": "address"},{"internalType": "uint256","name": "challengerDragonId","type": "uint256"},{"internalType": "address","name": "opponent","type": "address"},{"internalType": "uint256","name": "opponentDragonId","type": "uint256"},{"internalType": "uint256","name": "timestamp","type": "uint256"},{"internalType": "address","name": "winner","type": "address"},{"internalType": "bool","name": "completed","type": "bool"},{"internalType": "uint256","name": "expReward","type": "uint256"}],"internalType": "struct BattleArena.Battle","name": "","type": "tuple"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getUserBattles",
    "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const MARKETPLACE_ABI = [
  {
    "inputs": [{"internalType": "uint256","name": "dragonId","type": "uint256"},{"internalType": "uint256","name": "price","type": "uint256"}],
    "name": "listDragon",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "dragonId","type": "uint256"}],
    "name": "buyDragon",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "dragonId","type": "uint256"}],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "dragonId","type": "uint256"},{"internalType": "uint256","name": "newPrice","type": "uint256"}],
    "name": "updatePrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveListings",
    "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "dragonId","type": "uint256"}],
    "name": "getListing",
    "outputs": [{"components": [{"internalType": "uint256","name": "dragonId","type": "uint256"},{"internalType": "address","name": "seller","type": "address"},{"internalType": "uint256","name": "price","type": "uint256"},{"internalType": "bool","name": "active","type": "bool"},{"internalType": "uint256","name": "listedAt","type": "uint256"}],"internalType": "struct DragonMarketplace.Listing","name": "","type": "tuple"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "dragonId","type": "uint256"}],
    "name": "isListed",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveListingsCount",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MARKETPLACE_FEE",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
