# 🐉 Dragon City - OpenSea/Magic Eden Integration Guide

## Overview

This guide explains how to use **OpenSea** and **Magic Eden** instead of a custom marketplace, implement **installment payments** for egg purchases, and set up the **rarity system** with **leaderboard rewards**.

---

## 🎯 Key Changes

### 1. **No Custom Marketplace**
- ✅ Use OpenSea/Magic Eden for dragon trading
- ✅ Automatic listing on these platforms via proper metadata
- ❌ Remove DragonMarketplace.sol

### 2. **Batch Egg Minting (1000 NFTs)**
- 25 Legendary eggs
- 35 Unique eggs  
- 45 Rare eggs (first sale priority for 7 days)
- 895 Common eggs (gacha/raffle after first sale)

### 3. **Installment Payments**
- 3 payments over 72 hours (24-hour intervals)
- Buyers can pay 1/3 upfront, then 2 more payments
- Egg is locked until fully paid

### 4. **Rarity Inheritance**
- Dragons inherit rarity from eggs
- Rarity affects base stats:
  - Common: 1.0x multiplier
  - Rare: 1.25x multiplier
  - Unique: 1.5x multiplier
  - Legendary: 2.0x multiplier

### 5. **Leaderboard & Rewards**
- Points for battles, hatching, breeding
- Reward tiers: Bronze → Diamond
- ETH rewards for reaching milestones

---

## 📋 Smart Contracts

### New Contracts Created

| Contract | Purpose |
|----------|---------|
| `EggNFTBatch.sol` | Batch mint 1000 eggs with rarity + installments |
| `DragonNFTWithRarity.sol` | Dragons inherit egg rarity |
| `Leaderboard.sol` | Track points and distribute rewards |

### Removed Contracts
- ❌ `DragonMarketplace.sol` (use OpenSea instead)

---

## 🛒 OpenSea/Magic Eden Integration

### How It Works

1. **Automatic Listing**: Dragons/eggs automatically appear on OpenSea/Magic Eden once minted
2. **No Custom Marketplace Needed**: These platforms handle all trading
3. **Creator Royalties**: Set royalties in contract metadata (2.5% recommended)

### Implementation Steps

#### A. Update Contract Metadata

Both contracts (`EggNFTBatch.sol` and `DragonNFTWithRarity.sol`) include:

```solidity
function tokenURI(uint256 tokenId) public view returns (string memory) {
    // Returns OpenSea-compatible JSON metadata
    // Includes: name, description, image, attributes (traits)
}
```

#### B. Upload Metadata & Images to IPFS

1. **Create Metadata JSON** for each rarity/element combo:

```json
{
  "name": "Legendary Fire Dragon #1",
  "description": "A powerful legendary dragon from Dragon City",
  "image": "ipfs://QmYourHash/legendary_fire.png",
  "attributes": [
    {"trait_type": "Element", "value": "Fire"},
    {"trait_type": "Rarity", "value": "Legendary"},
    {"trait_type": "Power Type", "value": "Physical"},
    {"trait_type": "Level", "value": 1},
    {"trait_type": "Attack", "value": 120},
    {"trait_type": "Defense", "value": 100},
    {"trait_type": "Speed", "value": 80}
  ]
}
```

2. **Upload to IPFS**:
```bash
# Using Pinata, NFT.Storage, or web3.storage
npx pinata upload ./metadata
```

3. **Set Base URI** in contract:
```solidity
eggNFT.setBaseURI("ipfs://QmYourMetadataHash/");
dragonNFT.setBaseURI("ipfs://QmYourMetadataHash/");
```

#### C. OpenSea Collection Setup

1. Visit [OpenSea Testnet](https://testnets.opensea.io/) (Base Sepolia)
2. Find your collection (auto-created when first NFT mints)
3. Click "Edit Collection"
4. Set:
   - Collection name: "Dragon City Eggs" / "Dragon City Dragons"
   - Description
   - Logo image
   - Banner image
   - Creator earnings: 2.5%
   - Links (website, Twitter, Discord)

#### D. Magic Eden Setup

1. Visit [Magic Eden](https://magiceden.io/creators)
2. Submit your collection
3. Provide:
   - Contract address
   - Collection metadata
   - Verified social links

---

## 💰 Installment Payment System

### How It Works

1. **First Payment** (1/3 of price): Mints egg, creates installment plan
2. **Second Payment** (24 hours later): Pay next 1/3
3. **Third Payment** (48 hours after first): Pay final 1/3
4. **Unlock Hatching**: Once fully paid, egg can be hatched

### Code Example

```solidity
// Start installment plan
function mintEggWithInstallment(Rarity _rarity) external payable {
    uint256 totalPrice = getPriceForRarity(_rarity);
    uint256 firstPayment = totalPrice / 3;
    
    require(msg.value == firstPayment, "Incorrect payment");
    
    // Mint egg and create plan
    uint256 tokenId = _mintEggInternal(msg.sender, _rarity, true);
    
    installmentPlans[tokenId] = InstallmentPlan({
        buyer: msg.sender,
        eggId: tokenId,
        totalPrice: totalPrice,
        paidAmount: firstPayment,
        installmentsPaid: 1,
        lastPaymentTime: block.timestamp,
        isComplete: false,
        isActive: true
    });
}

// Make second/third payment
function payInstallment(uint256 tokenId) external payable {
    InstallmentPlan storage plan = installmentPlans[tokenId];
    
    require(block.timestamp >= plan.lastPaymentTime + 24 hours, "Too early");
    require(msg.value == plan.totalPrice / 3, "Incorrect amount");
    
    plan.paidAmount += msg.value;
    plan.installmentsPaid += 1;
    plan.lastPaymentTime = block.timestamp;
    
    if (plan.installmentsPaid == 3) {
        plan.isComplete = true; // Can now hatch
    }
}
```

### Pricing

| Rarity | Full Price | Per Installment |
|--------|------------|-----------------|
| Common | 0.05 ETH | 0.0167 ETH |
| Rare | 0.15 ETH | 0.05 ETH |
| Unique | 0.3 ETH | 0.1 ETH |
| Legendary | 0.5 ETH | 0.167 ETH |

---

## 🎲 First Sale & Gacha System

### First Sale (7 Days)

- **Who**: Early supporters
- **Access**: Rare, Unique, Legendary eggs only
- **Duration**: 7 days from contract deployment
- **Payment**: Full price or installments

### Gacha/Raffle (After First Sale)

- **Who**: Everyone
- **Access**: Common eggs only (random)
- **Price**: 0.05 ETH
- **Supply**: 895 common eggs

```solidity
function mintGachaEgg() external payable {
    require(!isFirstSaleActive, "First sale active");
    require(msg.value == COMMON_PRICE, "Incorrect payment");
    
    _mintEggInternal(msg.sender, Rarity.COMMON, false);
}
```

---

## 🏆 Leaderboard System

### Point Distribution

| Action | Points | Notes |
|--------|--------|-------|
| Win Battle | 100 | Per victory |
| Hatch Common | 50 | Basic hatch |
| Hatch Rare | 200 | 4x multiplier |
| Hatch Legendary | 500 | 10x multiplier |
| Breed Dragons | 150 | Requires Level 4+ |

### Reward Tiers

| Tier | Points Required | ETH Reward |
|------|----------------|------------|
| Bronze | 1,000 | 0.01 ETH |
| Silver | 5,000 | 0.05 ETH |
| Gold | 10,000 | 0.15 ETH |
| Platinum | 25,000 | 0.5 ETH |
| Diamond | 50,000 | 1.0 ETH |

### Integration

```solidity
// Award points automatically
function hatchEgg(uint256 eggId) external returns (uint256) {
    // ... hatching logic ...
    
    // Award points to leaderboard
    bool isRare = dragon.rarity == Rarity.RARE || dragon.rarity == Rarity.UNIQUE;
    bool isLegendary = dragon.rarity == Rarity.LEGENDARY;
    
    ILeaderboard(leaderboardContract).recordHatch(msg.sender, isRare, isLegendary);
}
```

---

## 🚀 Deployment Steps

### 1. Deploy Contracts

```bash
# Deploy to Base network
npx hardhat run scripts/deploy-opensea.js --network base
```

**Deploy order:**
1. EggNFTBatch
2. DragonNFTWithRarity
3. Leaderboard
4. Link contracts together

### 2. Set Base URIs

```bash
npx hardhat run scripts/set-metadata.js --network base
```

### 3. Fund Leaderboard

```bash
# Send ETH for rewards
npx hardhat run scripts/fund-leaderboard.js --network base
```

### 4. Verify on OpenSea

1. Mint first egg
2. Wait for OpenSea indexing (~5 mins)
3. Edit collection metadata
4. Set creator royalties

---

## 📱 Frontend Updates

### A. Remove Marketplace Component

```bash
# Delete old marketplace
rm components/DragonMarketplace.tsx
```

### B. Add OpenSea Links

```tsx
function DragonCard({ dragonId }) {
  const openSeaUrl = `https://opensea.io/assets/base/${CONTRACTS.base.dragonNFT}/${dragonId}`;
  
  return (
    <div>
      {/* Dragon details */}
      <a href={openSeaUrl} target="_blank">
        View on OpenSea →
      </a>
    </div>
  );
}
```

### C. Installment Payment UI

```tsx
function EggPurchase({ rarity }) {
  const [useInstallments, setUseInstallments] = useState(false);
  
  const fullPrice = getPriceForRarity(rarity);
  const installmentPrice = fullPrice / 3;
  
  const handleBuy = () => {
    if (useInstallments) {
      writeContract({
        functionName: 'mintEggWithInstallment',
        args: [rarity],
        value: parseEther(installmentPrice.toString())
      });
    } else {
      writeContract({
        functionName: 'mintEgg',
        args: [rarity],
        value: parseEther(fullPrice.toString())
      });
    }
  };
  
  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={useInstallments}
          onChange={(e) => setUseInstallments(e.target.checked)}
        />
        Pay in 3 installments (24h apart)
      </label>
      
      <button onClick={handleBuy}>
        Buy {useInstallments ? `(${installmentPrice} ETH now)` : `(${fullPrice} ETH)`}
      </button>
    </div>
  );
}
```

### D. Leaderboard UI

```tsx
function LeaderboardView() {
  const { data: topPlayers } = useReadContract({
    address: CONTRACTS.base.leaderboard,
    abi: LEADERBOARD_ABI,
    functionName: 'getTopPlayers',
    args: [10]
  });
  
  return (
    <div>
      <h2>🏆 Top Players</h2>
      {topPlayers?.addresses.map((address, i) => (
        <div key={address}>
          #{i + 1} - {address.slice(0, 6)}... 
          ({topPlayers.points[i]} points)
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist

### Smart Contracts
- [x] Create EggNFTBatch.sol
- [x] Create DragonNFTWithRarity.sol  
- [x] Create Leaderboard.sol
- [ ] Remove DragonMarketplace.sol
- [ ] Deploy to Base network
- [ ] Verify contracts on Basescan

### Metadata
- [ ] Generate metadata JSON for all combinations
- [ ] Create dragon images (24 combinations: 4 rarities × 6 elements)
- [ ] Upload to IPFS
- [ ] Set base URIs in contracts

### OpenSea
- [ ] Mint first NFTs
- [ ] Configure collection on OpenSea
- [ ] Set creator royalties (2.5%)
- [ ] Add social links

### Frontend
- [ ] Remove DragonMarketplace component
- [ ] Add OpenSea/Magic Eden links
- [ ] Build installment payment UI
- [ ] Create leaderboard page
- [ ] Update VillageDashboard

### Testing
- [ ] Test batch egg minting
- [ ] Test installment payments
- [ ] Test rarity inheritance
- [ ] Test leaderboard points
- [ ] Test on OpenSea testnet

---

## 🔧 Environment Variables

Update `.env.local`:

```bash
# Remove marketplace addresses
# NEXT_PUBLIC_MARKETPLACE_BASE=... (DELETE)

# Add leaderboard
NEXT_PUBLIC_LEADERBOARD_BASE=0x...
NEXT_PUBLIC_LEADERBOARD_CELO=0x...

# OpenSea API (optional for frontend features)
NEXT_PUBLIC_OPENSEA_API_KEY=your_key
```

---

## 📚 Resources

- [OpenSea Developer Docs](https://docs.opensea.io/)
- [Magic Eden API](https://docs.magiceden.io/)
- [IPFS Pinata](https://www.pinata.cloud/)
- [NFT.Storage](https://nft.storage/)
- [Base Network](https://docs.base.org/)

---

## 🎮 Gameplay Flow

1. **Buy Egg** (full or installments) → Get random element
2. **Complete Payments** (if installments) → 3 payments over 72 hours
3. **Hatch Egg** → Dragon inherits rarity
4. **Battle & Level Up** → Earn leaderboard points
5. **Breed Dragons** (Lv4+) → Earn points, create stronger dragons
6. **Climb Leaderboard** → Unlock reward tiers
7. **Claim Rewards** → Receive ETH prizes
8. **Trade on OpenSea** → Sell/buy dragons from other players

---

## 💡 Pro Tips

1. **Legendary eggs are rare**: Only 25 available
2. **First sale advantage**: Early access to Rare+ eggs
3. **Installments save gas**: Spread cost over 72 hours
4. **Rarity compounds**: Breed 2 legendaries = legendary child
5. **Leaderboard resets monthly**: Top players win bonus rewards

---

**Ready to launch! 🚀**

Next step: Deploy contracts and set up OpenSea collection.
