# 🎮 Local Development Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Hardhat Node
Open a terminal and run:
```bash
npm run node
```
This starts a local blockchain at `http://127.0.0.1:8545`

### 3. Deploy Contracts (New Terminal)
```bash
npm run deploy:local
```

This will:
- Deploy DragonNFT, EggNFT, and BattleArena contracts
- Create test data (3 eggs, 2 hatched dragons)
- Output contract addresses

### 4. Update Environment Variables
Create `.env.local` file and add the contract addresses from step 3:
```bash
NEXT_PUBLIC_DRAGON_NFT_LOCAL=0x...
NEXT_PUBLIC_EGG_NFT_LOCAL=0x...
NEXT_PUBLIC_BATTLE_CONTRACT_LOCAL=0x...
```

### 5. Start Frontend
```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Connect Wallet
- Connect MetaMask or Coinbase Wallet
- Switch to "Localhost" network in the app
- Use test accounts from Hardhat node

## Testing

Run contract tests:
```bash
npm run test:local
```

This tests:
- Buying and hatching eggs
- Leveling up dragons
- Breeding mechanics
- Battle system
- Cross-chain features

## Default Test Accounts

Hardhat provides 20 test accounts with 10,000 ETH each:
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (deployer)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
...
```

## Features to Test

### 🥚 Hatchery
1. Buy eggs (0.01 ETH each)
2. View egg details (element, rarity)
3. Hatch eggs after cooldown

### 🐉 Dragon Collection
1. View all your dragons
2. See dragon images (2D SVG based on element/power)
3. Check stats and levels
4. View origin chain

### 💕 Breeding Room
1. Level up dragons to 4+
2. Breed two dragons
3. See power type inheritance
4. Cross-chain breeding support

### ⚔️ Battle Arena
1. Set dragons on standby
2. Challenge standby dragons
3. Off-chain battle simulation
4. Submit results on-chain
5. Earn EXP rewards

### ⬆️ Training Grounds
1. View level-up requirements
2. See stat bonuses per level

## Village Dashboard

The app now uses a village hub interface:
- Main village view with clickable buildings
- Each room has its own theme and function
- Smooth animations between rooms
- Back button to return to village

## Farcaster Frame Support

The app is configured to work as a Farcaster mini app:
- Frame metadata in `layout.tsx`
- Responsive design for mobile
- Wallet connection via wagmi
- Works in Farcaster clients

## Troubleshooting

### "Insufficient funds"
- Make sure you're using a test account from Hardhat
- Check you're connected to localhost network

### "Contract not found"
- Redeploy contracts: `npm run deploy:local`
- Update `.env.local` with new addresses

### Dragons not showing images
- Check browser console for errors
- SVG generation is client-side
- Try refreshing the page

### Can't connect wallet
- Make sure Hardhat node is running
- Add localhost network to MetaMask:
  - Network Name: Localhost
  - RPC URL: http://127.0.0.1:8545
  - Chain ID: 31337
  - Currency: ETH

## Development Workflow

1. Make contract changes in `contracts/`
2. Recompile: `npm run compile`
3. Redeploy: `npm run deploy:local`
4. Update `.env.local` with new addresses
5. Restart Next.js dev server
6. Test in browser

## Production Deployment

When ready for production:
1. Deploy to Base/Celo testnets
2. Update `.env` with testnet addresses
3. Test on testnets
4. Deploy to mainnet
5. Update production environment variables

---

🎮 **Happy Dragon Gaming!** 🐉
