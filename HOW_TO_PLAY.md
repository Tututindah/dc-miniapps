# 🎮 Dragon City - Complete Gameplay Guide

## 🚀 Quick Start

Your test account already has:
- ✅ 1 unhatched egg (ID #3)
- ✅ 2 dragons (ID #1: Earth element, ID #2: Dark element)

So you can start playing immediately!

---

## 1️⃣ HATCHING EGGS 🥚

### What You Already Have:
The deployment script bought 3 eggs and hatched 2, leaving you with **1 egg ready to hatch**.

### Steps to Hatch:

1. **Open the app**: http://localhost:3000
2. **Connect your MetaMask**:
   - Make sure you're on "Hardhat Local" network (Chain ID 31337)
   - Use Account #0 (address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
3. **Navigate to "🥚 Hatchery"** (click the Hatchery button in the village)
4. **Look for "My Eggs" section** - you should see 1 egg
5. **Click "Hatch Egg"** button
6. **Approve the transaction** in MetaMask
7. **Wait a moment** - your dragon will appear!
8. **Check what element you got**:
   - 🔥 Fire (red)
   - 💧 Water (blue)
   - 🌍 Earth (green)
   - 💨 Air (yellow)
   - 🌑 Dark (purple)
   - ✨ Light (pink)

### Want More Eggs?

1. In the Hatchery, find the **"Buy Egg"** section
2. Click **"Buy Egg"** button
3. Pay **0.01 ETH** (you have 10,000 ETH in test account)
4. Confirm transaction in MetaMask
5. Your new egg appears in "My Eggs"
6. Hatch it following the steps above!

---

## 2️⃣ VIEWING YOUR DRAGONS 📚

### See Your Collection:

1. **Navigate to "📚 Dragon Collection"**
2. You'll see **all your dragons** with their pixel art
3. **Click on any dragon** to see detailed stats:
   - **Name** (auto-generated)
   - **Element** (Fire, Water, Earth, etc.)
   - **Power Type**:
     - Single Power (gray) - Basic
     - Dual Power (purple) - 15% stronger, has aura
     - Combined Power (red) - 30% stronger, epic effects
   - **Stats**:
     - Attack (ATK)
     - Defense (DEF)
     - Speed (SPD)
   - **Level & Experience**
   - **Parents** (if bred)
   - **Birth time**
   - **Origin chain**

### Understanding Stats:

- **Attack**: Damage in battles
- **Defense**: Reduces damage taken
- **Speed**: Tiebreaker if battle is draw
- **Level**: Starts at 1, increases with battles
- **Experience**: Gain 100 EXP per win, level up every 100 EXP

---

## 3️⃣ BATTLING DRAGONS ⚔️

### Requirements:
- You need at least 1 dragon (you have 2!)
- Opponent dragons must be on "standby" mode

### How to Battle:

1. **Navigate to "⚔️ Battle Arena"**
2. **Select YOUR dragon**:
   - Click on one of your dragons in the "Select Your Dragon" section
   - The card will highlight in red when selected
3. **Find an opponent**:
   - Scroll to "Standby Dragons" section
   - See dragons from other players (or your own if you set them to standby)
4. **Challenge**:
   - Click "Challenge" on an opponent dragon
   - Confirm transaction in MetaMask
5. **Watch the battle!**:
   - Battle simulates off-chain (instant)
   - See which dragon wins based on:
     - Attack vs Defense
     - Element advantages
     - Random luck factor (±10%)
6. **Check results**:
   - Winner gets **100 EXP**
   - Go to "My Battles" tab to see results
   - Execute the battle to finalize (submit result on-chain)

### Element Advantages (20% bonus):

```
🔥 Fire    → beats → 🌍 Earth
🌍 Earth   → beats → 💨 Air
💨 Air     → beats → 💧 Water
💧 Water   → beats → 🔥 Fire
🌑 Dark    → beats → ✨ Light
✨ Light   → beats → 🌑 Dark
```

### Setting Dragon to Standby:

1. Go to "📚 Dragon Collection"
2. Click on your dragon
3. Toggle "Standby Mode" switch
4. Now other players can challenge this dragon!

### Leveling Up:

- Win 1 battle = 100 EXP
- 100 EXP = Level up!
- Higher levels = stronger stats
- **Level 4+ required for breeding**

**Quick leveling tip**: Battle 4 times to reach Level 4, then you can breed!

---

## 4️⃣ BREEDING DRAGONS 💕

### Requirements:
- **2 dragons at Level 4 or higher**
- Both dragons must have finished cooldown (instant in local mode)
- Breeding cost (varies by power type)

### How to Get Dragons to Level 4:

Since your 2 dragons start at Level 1, you need to battle 4 times each:

1. Go to **Battle Arena**
2. Select your **Dragon #1** (Earth element)
3. Find a standby dragon
4. **Challenge and win** (repeat 4 times)
5. Dragon #1 is now Level 4!
6. Repeat with **Dragon #2** (Dark element)
7. Both dragons now ready to breed!

### Breeding Process:

1. **Navigate to "💕 Breeding Room"**
2. **Select Parent 1**:
   - Click on your first Level 4+ dragon
   - Card will highlight
3. **Select Parent 2**:
   - Click on your second Level 4+ dragon
   - Card will highlight
4. **Preview the child**:
   - See potential element combinations
   - Check breeding cost
5. **Click "Breed Dragons"**
6. **Confirm transaction** in MetaMask
7. **Wait for breeding** (instant in local mode)
8. **Receive baby dragon!**:
   - Appears as new NFT
   - Inherits traits from parents
   - Has unique stats

### Breeding Outcomes:

**Element Inheritance**:
- Same elements → Same element child
- Different elements → Random parent element OR rare hybrid!

**Power Type Probability**:
- Single × Single = mostly Single Power
- Dual × Dual = chance of Combined Power!
- Combined × Combined = high chance of Combined!

**Breeding Costs** (auto-calculated):
- Single Power parents: ~0.001 ETH
- Dual Power parents: ~0.002 ETH
- Combined Power parents: ~0.003 ETH

---

## 🎯 Complete Walkthrough Example

Let me show you a full gameplay session:

### Session 1: First 10 Minutes

```
✅ DONE - Start with 2 dragons (Earth & Dark) + 1 egg
```

**1. Hatch your egg** (2 min)
   - Go to Hatchery
   - Click "Hatch Egg"
   - Confirm transaction
   - **Result**: Now have 3 dragons!

**2. Battle to level up** (5 min)
   - Go to Battle Arena
   - Select Dragon #1
   - Challenge standby dragon
   - Win battle → +100 EXP
   - **Repeat 3 more times**
   - **Result**: Dragon #1 is Level 4!

**3. Level up Dragon #2** (3 min)
   - Select Dragon #2
   - Battle 4 times
   - **Result**: Dragon #2 is Level 4!

### Session 2: Breeding Time

**4. Breed your dragons** (2 min)
   - Go to Breeding Room
   - Select Dragon #1 (Earth, Level 4)
   - Select Dragon #2 (Dark, Level 4)
   - Click "Breed Dragons"
   - Pay breeding cost
   - **Result**: Baby dragon #4 born!

**5. Check your new dragon** (1 min)
   - Go to Collection
   - See baby dragon
   - Check its element and power type
   - Hope for Combined Power! 🤞

### Session 3: Advanced Play

**6. Buy more eggs** (1 min each)
   - Go to Hatchery
   - Buy 3 more eggs (0.03 ETH total)
   - Hatch all 3
   - **Result**: 6 dragons total!

**7. Build your team**
   - Battle all dragons to Level 4
   - Breed different combinations
   - Try to get all 6 elements
   - Hunt for Combined Power dragons

**8. Test attack animations**
   - Visit http://localhost:3000/demo
   - Select each element
   - Click "Attack!"
   - See fire, water, earth, storm, dark, and light effects

---

## 🎨 See Attack Animations

Want to see the cool attack effects?

1. **Visit**: http://localhost:3000/demo
2. **Select element** from dropdown:
   - 🔥 Fire: Flame cone attack
   - 💧 Water: Wave splash
   - 🌍 Earth: Rock shards
   - ⚡ Storm: Lightning + wind spirals
   - 🌑 Dark: Shadow tendrils
   - ✨ Light: Radiant star beams
3. **Click "Attack!" button**
4. **Watch** the 60 FPS canvas animation!

---

## 📊 Dragon Stats Explained

### Base Stats by Element:

All dragons start with random stats in these ranges:
- **Attack**: 50-100
- **Defense**: 50-100  
- **Speed**: 50-100

### Power Type Multipliers:

- **Single Power**: Base stats (1x)
- **Dual Power**: Base stats + 15%
- **Combined Power**: Base stats + 30%

### Level Bonuses (per level):

- **Attack**: +5
- **Defense**: +5
- **Speed**: +3

**Example**: 
- Level 1 dragon: ATK 60
- Level 5 dragon: ATK 60 + (4 × 5) = ATK 80

---

## 💡 Pro Tips

### Battling:
1. **Check element advantage** before challenging
2. **Use Combined Power dragons** for better win rate
3. **Level up fast** by battling repeatedly
4. **Set weak dragons to standby** so others can level up against them

### Breeding:
1. **Wait for Level 4** - worth the patience
2. **Breed same-element pairs** for consistent results
3. **Breed Dual + Dual** for chance of Combined Power
4. **Cross-breed elements** for variety

### Collection Strategy:
1. **Get all 6 elements** first
2. **Focus on Combined Power dragons**
3. **Level everything to 4+** for breeding
4. **Keep track of bloodlines** (check parents)

### Economy:
- Test account has 10,000 ETH - plenty for experimenting!
- Eggs cost 0.01 ETH
- Breeding costs 0.001-0.003 ETH
- Gas is nearly free on localhost

---

## 🐛 Troubleshooting

### "No standby dragons available"
**Solution**: Set one of your own dragons to standby mode

### "Dragon not eligible for breeding"
**Solution**: Battle 4 times to reach Level 4

### "Transaction failed"
**Solution**: 
- Check you're on Hardhat Local network
- Make sure you selected dragons
- Try refreshing the page

### "Can't see my dragons"
**Solution**:
- Wait a few seconds after hatching
- Refresh the page
- Check browser console (F12) for errors

### "Battle didn't work"
**Solution**:
- Make sure opponent is on standby
- Check you selected your dragon first
- Execute the battle in "My Battles" tab

---

## 🎯 Achievement Checklist

- [ ] Hatch your first egg
- [ ] Win your first battle
- [ ] Reach Level 4 with a dragon
- [ ] Breed two dragons
- [ ] Get a Combined Power dragon
- [ ] Collect all 6 elements
- [ ] Win 10 battles
- [ ] Breed a second generation dragon
- [ ] See all attack animations
- [ ] Build a team of 6 Level 4+ dragons

---

## 🚀 Ready to Play?

1. Open http://localhost:3000
2. Connect MetaMask (Hardhat Local network)
3. Import test account: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Start with Hatchery to hatch your egg!
5. Then battle your way to Level 4
6. Finally breed for more dragons!

**Have fun! 🐉⚔️**

