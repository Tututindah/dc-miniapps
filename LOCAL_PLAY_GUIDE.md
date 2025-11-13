# 🐉 Dragon City - Quick Start Guide for Local Testing

## ✅ Setup Complete!

Your local Dragon City is now running with:
- **Hardhat Node**: http://127.0.0.1:8545 
- **Next.js App**: http://localhost:3000

## 📜 Deployed Contracts

```
DragonNFT:    0x5FbDB2315678afecb367f032d93F642f64180aa3
EggNFT:       0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
BattleArena:  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

## 🎮 How to Play

### Step 1: Set up MetaMask for Local Network

1. Open MetaMask
2. Click the network dropdown → "Add Network" → "Add a network manually"
3. Fill in:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
4. Click "Save"

### Step 2: Import Test Account

Import one of the Hardhat test accounts into MetaMask:

**Account #0** (Recommended - already has test eggs):
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

To import:
1. MetaMask → Click account icon → "Import Account"
2. Paste the private key above
3. Click "Import"

⚠️ **IMPORTANT**: These are TEST accounts. Never use these keys on mainnet!

### Step 3: Connect to Dragon City

1. Visit: http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask
4. Make sure you're on "Hardhat Local" network
5. Approve the connection

### Step 4: Play the Game!

#### 🥚 Hatchery - Buy & Hatch Eggs

1. Navigate to "🥚 Hatchery"
2. Click "Buy Egg" (costs 0.01 ETH)
3. Confirm the transaction in MetaMask
4. Your egg will appear in "My Eggs"
5. Click "Hatch Egg" to get a dragon!
6. Each dragon has a random element: 🔥 Fire, 💧 Water, 🌍 Earth, 💨 Air, 🌑 Dark, or ✨ Light

#### 📚 Collection - View Your Dragons

1. Navigate to "📚 Dragon Collection"
2. See all your hatched dragons
3. Click on any dragon to see full stats
4. Check their:
   - Element type
   - Power type (Single/Dual/Combined)
   - Attack, Defense, Speed
   - Level and Experience
   - Birth time and parent info

#### 💕 Breeding - Create New Dragons

1. Navigate to "💕 Breeding Room"
2. You need 2 dragons at Level 4+ to breed
3. Select Dragon 1 and Dragon 2
4. Click "Breed Dragons"
5. Pay breeding cost (varies by dragon power)
6. Wait for cooldown (instant in local mode)
7. New dragon inherits traits from parents!

#### ⚔️ Battle Arena - Fight & Level Up

1. Navigate to "⚔️ Battle Arena"
2. Select your dragon
3. Choose an opponent dragon (must be on standby)
4. Click "Challenge"
5. Battle simulates off-chain
6. Winner earns 100 EXP
7. Level up every 100 EXP!

**Element Advantages**:
- 🔥 Fire beats 🌍 Earth
- 🌍 Earth beats 💨 Air
- 💨 Air beats 💧 Water
- 💧 Water beats 🔥 Fire
- 🌑 Dark beats ✨ Light
- ✨ Light beats 🌑 Dark

## 🎨 Features to Test

### Pixel Art Dragons
- Each element has unique 25x25 pixel art
- Dragons transform to skeletons during battles
- Smooth canvas rendering

### Elemental Attack Animations
- Visit `/demo` to see all 6 attack types:
  - 🔥 Fire: Flame cone
  - 💧 Water: Wave splash
  - 🌍 Earth: Rock shards
  - ⚡ Storm (Air): Lightning + wind
  - 🌑 Dark: Shadow tendrils
  - ✨ Light: Radiant beams

### Power Types
- **Single Power**: Basic stats
- **Dual Power**: 15% bonus, special aura
- **Combined Power**: 30% bonus, epic effects

### Cross-Chain (Simulated)
- Switch between "Base" and "Celo" in MetaMask network dropdown
- Dragons remember their origin chain

## 🛠️ Terminal Commands Reference

```powershell
# Terminal 1: Hardhat Node
npx hardhat node

# Terminal 2: Next.js Dev Server  
npm run dev

# Deploy contracts (if needed)
npm run deploy:local

# Run tests
npm run test:local
```

## 🐛 Troubleshooting

### "Transaction reverted" or "Gas estimation failed"

**Fix**: Make sure you're connected to "Hardhat Local" network in MetaMask

### "Contract not found"

**Fix**: Restart Hardhat node and redeploy:
```powershell
# Stop current node (Ctrl+C)
# Start fresh
npx hardhat node

# In new terminal
npm run deploy:local
```

### Wallet not connecting

**Fix**: 
1. Check MetaMask is on "Hardhat Local" network
2. Try refreshing the page
3. Clear MetaMask activity data (Settings → Advanced → Clear activity tab data)

### Dragons not showing up

**Fix**:
1. Check you're on the correct network
2. Refresh the page
3. Check browser console for errors (F12)

## 📊 Test Data

The deployment script already created:
- ✅ 3 test eggs purchased
- ✅ 2 dragons hatched (Earth and Dark elements)
- ✅ All using Account #0

So you can start playing immediately!

## 🎯 Testing Checklist

- [ ] Connect wallet to local network
- [ ] Buy an egg
- [ ] Hatch the egg
- [ ] View dragon in collection
- [ ] Level up dragon to Level 4 (battle 4 times)
- [ ] Breed two Level 4+ dragons
- [ ] Battle with another dragon
- [ ] Win a battle and earn EXP
- [ ] Check attack animations at `/demo`
- [ ] Test element advantages in battles
- [ ] Try switching between pixel and skeleton modes

## 💡 Pro Tips

1. **Fast leveling**: Battle repeatedly with the same dragon
2. **Rare dragons**: Keep breeding to find Combined Power types
3. **Element strategy**: Choose dragons with advantage against opponents
4. **Test attacks**: Visit http://localhost:3000/demo to see all animations

## 🚀 Next Steps

Once you're happy with local testing:
1. Deploy contracts to testnet (Base Sepolia / Celo Alfajores)
2. Deploy frontend to Vercel
3. Integrate with Farcaster Mini Apps
4. Share with friends!

---

**Happy dragon collecting! 🐉⚔️**

Need help? Check the browser console (F12) or Hardhat node terminal for error messages.
