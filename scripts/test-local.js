const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Dragon City contracts on local network...\n");

  const [owner, user1, user2] = await hre.ethers.getSigners();
  console.log("Test accounts:");
  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Get deployed contracts (make sure to deploy first!)
  console.log("\n📜 Getting contract addresses...");
  const dragonAddress = process.env.NEXT_PUBLIC_DRAGON_NFT_LOCAL;
  const eggAddress = process.env.NEXT_PUBLIC_EGG_NFT_LOCAL;
  const battleAddress = process.env.NEXT_PUBLIC_BATTLE_CONTRACT_LOCAL;

  if (!dragonAddress || !eggAddress || !battleAddress) {
    console.error("❌ Contract addresses not found in .env.local");
    console.error("Run: npm run deploy:local first");
    process.exit(1);
  }

  const dragonNFT = await hre.ethers.getContractAt("DragonNFT", dragonAddress);
  const eggNFT = await hre.ethers.getContractAt("EggNFT", eggAddress);
  const battleArena = await hre.ethers.getContractAt("BattleArena", battleAddress);

  console.log("✅ Contracts loaded\n");

  // Test 1: Buy and hatch eggs
  console.log("TEST 1: Buying and hatching eggs");
  console.log("=".repeat(50));
  
  // User1 buys 2 eggs
  console.log("User1 buying 2 eggs...");
  for (let i = 0; i < 2; i++) {
    const tx = await eggNFT.connect(user1).buyEgg({ value: hre.ethers.parseEther("0.01") });
    const receipt = await tx.wait();
    console.log(`  ✅ Egg ${i} purchased`);
  }

  // User2 buys 1 egg
  console.log("User2 buying 1 egg...");
  const tx = await eggNFT.connect(user2).buyEgg({ value: hre.ethers.parseEther("0.01") });
  await tx.wait();
  console.log("  ✅ Egg purchased");

  // Hatch eggs into dragons
  console.log("\nHatching eggs...");
  for (let i = 0; i < 2; i++) {
    const egg = await eggNFT.getEgg(i);
    const tx = await dragonNFT.connect(user1).hatchEgg(user1.address, egg.element);
    await tx.wait();
    const dragon = await dragonNFT.getDragon(i);
    console.log(`  ✅ Dragon ${i} hatched:`);
    console.log(`     Element: ${dragon.element}, Power Type: ${dragon.powerType}`);
    console.log(`     Attack: ${dragon.attack}, Defense: ${dragon.defense}, Speed: ${dragon.speed}`);
  }

  // Test 2: Level up dragons
  console.log("\nTEST 2: Leveling up dragons");
  console.log("=".repeat(50));
  
  console.log("Adding experience to Dragon 0...");
  for (let i = 0; i < 4; i++) {
    const tx = await dragonNFT.connect(user1).addExperience(0, 100);
    await tx.wait();
    const dragon = await dragonNFT.getDragon(0);
    console.log(`  Level: ${dragon.level}, EXP: ${dragon.experience}`);
  }

  // Test 3: Breeding
  console.log("\nTEST 3: Breeding dragons");
  console.log("=".repeat(50));
  
  // Level up dragon 1 to level 4
  console.log("Leveling up Dragon 1 to level 4...");
  for (let i = 0; i < 3; i++) {
    await dragonNFT.connect(user1).addExperience(1, 100);
  }

  console.log("Breeding Dragon 0 and Dragon 1...");
  const breedTx = await dragonNFT.connect(user1).breedDragons(0, 1);
  await breedTx.wait();
  
  const offspring = await dragonNFT.getDragon(2);
  console.log("  ✅ Offspring created:");
  console.log(`     Element: ${offspring.element}, Power Type: ${offspring.powerType}`);
  console.log(`     Attack: ${offspring.attack}, Defense: ${offspring.defense}`);
  console.log(`     Parent1: ${offspring.parent1}, Parent2: ${offspring.parent2}`);

  // Test 4: Battle setup
  console.log("\nTEST 4: Battle system");
  console.log("=".repeat(50));
  
  console.log("Setting Dragon 0 to standby...");
  await dragonNFT.connect(user1).setStandbyStatus(0, true);
  const dragon0 = await dragonNFT.getDragon(0);
  console.log(`  Standby status: ${dragon0.isStandby}`);

  console.log("Initiating battle...");
  const battleTx = await battleArena.connect(user1).initiateBattle(1, 0);
  const battleReceipt = await battleTx.wait();
  console.log("  ✅ Battle initiated");

  // Get battle details
  const battle = await battleArena.getBattle(0);
  console.log("  Battle details:");
  console.log(`     Challenger: ${battle.challenger}`);
  console.log(`     Opponent: ${battle.opponent}`);
  console.log(`     Completed: ${battle.completed}`);

  // Simulate battle off-chain and submit result
  console.log("\nSubmitting battle result...");
  const resultTx = await battleArena.connect(user1).submitBattleResult(0, user1.address, 75);
  await resultTx.wait();
  
  const completedBattle = await battleArena.getBattle(0);
  console.log("  ✅ Battle completed");
  console.log(`     Winner: ${completedBattle.winner}`);
  console.log(`     EXP Reward: ${completedBattle.expReward}`);

  // Test 5: View user dragons
  console.log("\nTEST 5: User dragon collections");
  console.log("=".repeat(50));
  
  const user1Dragons = await dragonNFT.getUserDragons(user1.address);
  console.log(`User1 has ${user1Dragons.length} dragons:`);
  for (let i = 0; i < user1Dragons.length; i++) {
    const dragon = await dragonNFT.getDragon(user1Dragons[i]);
    console.log(`  Dragon ${user1Dragons[i]}: Level ${dragon.level}, Element ${dragon.element}, Power Type ${dragon.powerType}`);
  }

  console.log("\n✅ All tests passed!");
  console.log("🎮 Ready to start the frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
