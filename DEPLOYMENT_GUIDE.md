# Deployment Guide for Base Sepolia Testnet

## Prerequisites

1. **Get Base Sepolia ETH**
   - Visit https://www.alchemy.com/faucets/base-sepolia
   - Or use https://faucet.quicknode.com/base/sepolia
   - Request testnet ETH for your wallet

2. **Setup Environment Variables**
   Create a `.env.local` file with:
   ```bash
   PRIVATE_KEY=your_wallet_private_key_here
   BASESCAN_API_KEY=your_basescan_api_key_optional
   ```

   ⚠️ **NEVER commit your private key to git!**

## Deployment Steps

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Deploy to Base Sepolia
```bash
npx hardhat run scripts/deploy-base-sepolia.js --network baseSepolia
```

This will:
- Deploy EggNFT contract
- Deploy DragonNFTWithRarity contract
- Deploy Leaderboard contract
- Deploy MissionSystem contract
- Deploy DragonMarketplace contract
- Set egg prices to 0.000000000001 ETH
- Configure all contract connections
- Verify contracts on BaseScan
- Save deployment addresses to `deployments-base-sepolia.json`

### 3. Update Frontend Configuration

After deployment, update your `.env.local` with the deployed addresses:

```bash
# Copy from deployments-base-sepolia.json
NEXT_PUBLIC_DRAGON_NFT_BASE_SEPOLIA=0x...
NEXT_PUBLIC_EGG_NFT_BASE_SEPOLIA=0x...
NEXT_PUBLIC_LEADERBOARD_BASE_SEPOLIA=0x...
NEXT_PUBLIC_MISSION_SYSTEM_BASE_SEPOLIA=0x...
NEXT_PUBLIC_MARKETPLACE_BASE_SEPOLIA=0x...
```

### 4. Build Frontend
```bash
npm run build
```

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Testing on Base Sepolia

1. **Connect Wallet**
   - Use MetaMask or Rainbow Wallet
   - Switch to Base Sepolia network
   - Network Details:
     - Network Name: Base Sepolia
     - RPC URL: https://sepolia.base.org
     - Chain ID: 84532
     - Currency Symbol: ETH
     - Block Explorer: https://sepolia.basescan.org

2. **Buy Eggs**
   - Navigate to Hatchery
   - Purchase eggs for 0.000000000001 ETH each
   - Wait for transaction confirmation

3. **Hatch Dragons**
   - Go to Dragon Collection
   - Hatch your eggs
   - View your dragons

4. **Create Missions**
   - Own a unique dragon (check rarity)
   - Go to Mission Board → Story tab for AI missions
   - Go to Mission Board → My Missions to create custom missions
   - Set rewards and objectives

5. **Use Marketplace**
   - List your dragons for sale
   - Create trade offers
   - Trade dragons with automatic price calculations

## Contract Prices

All prices are set to minimal amounts for testing:

- **Egg Price**: 0.000000000001 ETH (1000 wei)
- **Dragon Floor Price**: 0.000000000001 ETH (1000 wei)
- **Trade Premium**: 20% above price difference
- **Marketplace Fee**: 10% of trade value

## Features to Test

### ✅ Sound System
- Village ambient music
- Dragon roars
- Battle sounds
- UI clicks and hovers
- Mute/unmute button

### ✅ Voice Chat (in Play mode)
- Microphone toggle
- Deafen button
- Spatial audio
- Speaking indicators

### ✅ AI Story Missions
- Discovery missions (find new dragons)
- Ridge missions (build habitats)
- Chaos missions (control rampaging dragons)
- Evolution missions (evolve dragons)
- Prophecy missions (legendary quests)

### ✅ User Missions
- Follow on Farcaster
- Add liquidity to DEX
- Swap tokens
- Open mini apps
- Win battles
- Breed dragons

### ✅ Marketplace
- List dragons
- Create trade offers
- Trade-in system (Dragon A + Dragon B = price difference + 20% premium)
- Automatic fee calculation

### ✅ Landscape Mode
- Game automatically switches to landscape
- Rotation prompt on mobile portrait mode
- Optimized UI for wide screens

### ✅ Cartoonish Dragons
- Smooth rendering (no pixelation)
- Vibrant colors
- Animated sprites
- Floating effects

## Troubleshooting

### Issue: "Insufficient funds"
**Solution**: Get more testnet ETH from faucets listed above

### Issue: "Nonce too high"
**Solution**: Reset your wallet account in MetaMask (Settings → Advanced → Reset Account)

### Issue: "Contract not verified"
**Solution**: Wait 30 seconds after deployment, verification runs automatically

### Issue: "Dragons not showing"
**Solution**: Check console for errors, ensure wallet is connected to Base Sepolia

### Issue: "Voice chat not working"
**Solution**: Grant microphone permissions in browser settings

### Issue: "Landscape mode not working"
**Solution**: Clear browser cache, ensure landscape.css is loaded

## Development Workflow

```bash
# 1. Make code changes
# Edit files in components/, lib/, contracts/

# 2. Recompile if contracts changed
npm run compile

# 3. Rebuild frontend
npm run build

# 4. Test locally
npm run dev

# 5. Deploy to Base Sepolia (if contracts changed)
npx hardhat run scripts/deploy-base-sepolia.js --network baseSepolia

# 6. Deploy to production (Vercel/Netlify)
git push origin main
```

## Production Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables for Production
```
NEXT_PUBLIC_DRAGON_NFT_BASE_SEPOLIA=...
NEXT_PUBLIC_EGG_NFT_BASE_SEPOLIA=...
NEXT_PUBLIC_LEADERBOARD_BASE_SEPOLIA=...
NEXT_PUBLIC_MISSION_SYSTEM_BASE_SEPOLIA=...
NEXT_PUBLIC_MARKETPLACE_BASE_SEPOLIA=...
PRIVATE_KEY=... (for server-side operations only)
```

## Monitoring

- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Transaction Status**: Check wallet or explorer
- **Contract Events**: View on BaseScan under "Events" tab
- **Frontend Logs**: Open browser DevTools console

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify wallet network (Base Sepolia)
3. Confirm contract addresses in .env.local
4. Ensure sufficient testnet ETH
5. Try in incognito mode to rule out cache issues

## Next Steps

After successful deployment:
1. Share the app URL with testers
2. Monitor contract interactions
3. Gather user feedback
4. Iterate on features
5. Deploy to Base mainnet when ready

---

🐉 Happy Dragon Training!
