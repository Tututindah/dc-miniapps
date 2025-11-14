# 🐉 Dragon City - Farcaster Mini App

A cross-chain dragon breeding and battling game built as a Farcaster mini app. Collect pixelated dragons, breed them across Base and Celo networks, and engage in async P2P battles!

![Dragon City](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge&logo=next.js)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)
![Farcaster](https://img.shields.io/badge/Farcaster-Frame-8A63D2?style=for-the-badge)
![C++](https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=cplusplus&logoColor=white)
## ✨ Features

### 🎨 Pixelated Dragons
- **25x25 pixel art** with unique designs for each element
- **Skeleton mode** during battles (glowing red eyes!)
- **6 elements**: Fire 🔥, Water 💧, Earth 🌍, Wind 💨, Dark 🌙, Light ☀️
- **3 power types**: Single, Dual, Combined

### ⚔️ Elemental Attack Animations
- **Fire**: Flame cone attack with orange/yellow particles
- **Water**: Wave splash with blue droplets
- **Earth**: Rotating rock shards
- **Storm**: Lightning bolts + wind spirals
- **Dark**: Shadow tendrils with purple waves
- **Light**: Radiant beams with star-burst effect
- **60 FPS** canvas-based animations

### 🔗 Farcaster Integration
- **Auto-connect wallet** - no manual connection needed
- **Official Mini App SDK** (`@farcaster/miniapp-sdk`)
- **Mobile optimized** for Farcaster mobile app
- **One-click play** from any cast
- **Developer mode** compatible

### Async P2P Battles
- Challenge any dragon on standby
- **Off-chain simulation** (no server required!)
- **On-chain results** for transparency
- **Elemental attack effects** - see fire, water, lightning, etc.!
- **Full battle animations** with skeleton transformations
- Earn EXP and level up
- Element advantage system

### 💕 Cross-Chain Breeding
- Breed dragons across **Base** and **Celo**
- Intelligent trait inheritance
- Power type mutations
- Creates unique offspring

### 🏘️ Village Dashboard
- Interactive village hub
- 5 themed rooms (Hatchery, Breeding, Collection, Battle, Training)
- Smooth animations
- Intuitive navigation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or Coinbase Wallet
- ETH for gas fees

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/dc-miniapps.git
cd dc-miniapps

# Install dependencies
npm install

# Start local Hardhat node (Terminal 1)
npm run node

# Deploy contracts (Terminal 2)
npm run deploy:local

# Copy .env.example to .env.local and add contract addresses
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### 🎯 Try Attack Demo
Visit `http://localhost:3000/demo` to see all elemental attack animations!

---

## 📱 Deploy to Farcaster

### 1. Build for Production
```bash
npm run build
```

### 2. Deploy to Vercel
```bash
vercel deploy
```

### 3. Update Frame Metadata
Edit `app/layout.tsx`:
```typescript
'fc:frame:image': 'https://your-domain.com/og-image.png',
'fc:frame:button:1:target': 'https://your-domain.com',
```

### 4. Share in Farcaster
Post your URL in a cast. Users click "Play Dragon City" and it auto-connects!

---

## 🎮 How to Play

1. **Connect Wallet** (automatic in Farcaster!)
2. **Buy Eggs** from the Hatchery (0.01 ETH)
3. **Hatch Dragons** after cooldown
4. **Battle** to earn EXP and level up
5. **Breed** level 4+ dragons for offspring
6. **Collect** rare dragons with unique traits!

---

## 🏗️ Architecture

### Smart Contracts
- **DragonNFT.sol** - ERC721 dragon tokens with stats
- **EggNFT.sol** - ERC721 egg tokens with rarity
- **BattleArena.sol** - Battle coordination and results

### Frontend
- **Next.js 14** - React framework
- **Wagmi** - Ethereum React hooks
- **Farcaster Frame SDK** - Mini app integration
- **Canvas API** - Pixel art rendering
- **Framer Motion** - Animations

### Networks
- **Base** (ChainID 8453) - L2 for low fees
- **Celo** (ChainID 42220) - Mobile-first blockchain
- **Localhost** (ChainID 31337) - Development

---

## 📂 Project Structure

```
dc-miniapps/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment and testing
├── lib/                # Utils, configs, types
├── components/         # React components
├── app/                # Next.js app router
├── hardhat.config.js   # Hardhat configuration
└── package.json        # Dependencies
```

---

## 🎨 Dragon System

### Elements
| Element | Color | Strength | Weakness |
|---------|-------|----------|----------|
| Fire 🔥 | Red | Earth | Water |
| Water 💧 | Blue | Fire | Earth |
| Earth 🌍 | Green | Wind | Fire |
| Wind 💨 | Yellow | Water | Earth |
| Dark 🌙 | Purple | Light | - |
| Light ☀️ | Pink | - | Dark |

### Power Types
- **Single** (60%) - 1.0x multiplier
- **Dual** (30%) - 1.25x multiplier
- **Combined** (10%) - 1.5x multiplier

### Stats
- **Attack** - Damage dealt
- **Defense** - Damage reduction
- **Speed** - Turn order priority

---

## 🛠️ Development

### Available Scripts

```bash
npm run node          # Start Hardhat node
npm run compile       # Compile contracts
npm run deploy:local  # Deploy to localhost
npm run test:local    # Run contract tests
npm run dev           # Start Next.js dev server
npm run build         # Build for production
```

### Environment Variables

Create `.env.local`:
```env
# Local (Hardhat)
NEXT_PUBLIC_DRAGON_NFT_LOCAL=0x...
NEXT_PUBLIC_EGG_NFT_LOCAL=0x...
NEXT_PUBLIC_BATTLE_CONTRACT_LOCAL=0x...

# Base
NEXT_PUBLIC_DRAGON_NFT_BASE=0x...
NEXT_PUBLIC_EGG_NFT_BASE=0x...
NEXT_PUBLIC_BATTLE_CONTRACT_BASE=0x...

# Celo
NEXT_PUBLIC_DRAGON_NFT_CELO=0x...
NEXT_PUBLIC_EGG_NFT_CELO=0x...
NEXT_PUBLIC_BATTLE_CONTRACT_CELO=0x...
```

---

## 🧪 Testing

### Run Contract Tests
```bash
npm run test:local
```

Tests include:
- Buying and hatching eggs
- Dragon stat inheritance
- Breeding mechanics
- Battle simulation
- Cross-chain functionality

---

## 📚 Documentation

- [**IMPLEMENTATION_GUIDE.md**](./IMPLEMENTATION_GUIDE.md) - Complete setup guide
- [**LOCAL_SETUP.md**](./LOCAL_SETUP.md) - Local development guide
- [**FARCASTER_SETUP.md**](./FARCASTER_SETUP.md) - Farcaster integration
- [**FARCASTER_ATTACKS_UPDATE.md**](./FARCASTER_ATTACKS_UPDATE.md) - Attack animations
- [**COMPLETE_FEATURES.md**](./COMPLETE_FEATURES.md) - Full feature list
- [**DRAGON_SPRITES.md**](./DRAGON_SPRITES.md) - Pixel art guide

---

## 🐛 Troubleshooting

### Dragons not showing
- Clear browser cache
- Check console for errors
- Verify contract addresses in `.env.local`

### Auto-connect not working
- Only works inside Farcaster Frame
- Ensure Frame SDK is loaded
- Check wallet is installed

### Transaction fails
- Check you have enough ETH
- Verify you're on correct network
- Ensure dragon meets requirements (e.g., level 4 for breeding)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

- [Farcaster](https://www.farcaster.xyz/) - Frame SDK
- [OpenZeppelin](https://www.openzeppelin.com/) - Smart contract library
- [Wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [Next.js](https://nextjs.org/) - React framework
- [Base](https://base.org/) - Layer 2 network
- [Celo](https://celo.org/) - Mobile-first blockchain

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/dc-miniapps/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/dc-miniapps/discussions)
- **Farcaster**: [@yourhandle](https://warpcast.com/yourhandle)

---

## 🗺️ Roadmap

- [x] Core smart contracts
- [x] Frontend UI with village
- [x] Pixel art dragons
- [x] Skeleton battle animations
- [x] **Elemental attack effects (NEW!)**
- [x] Farcaster Mini App SDK integration
- [x] Auto-connect wallet
- [ ] Testnet deployment
- [ ] Mainnet deployment
- [ ] Leaderboards
- [ ] Tournament system
- [ ] Dragon marketplace
- [ ] Achievement badges
- [ ] Sound effects

---

**Built with ❤️ for the Farcaster community!**

🐉 **Start your dragon adventure today!** 💀
