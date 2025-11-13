const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Dragon City contracts to LOCAL network...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy DragonNFT
  console.log("\n📜 Deploying DragonNFT...");
  const DragonNFT = await hre.ethers.getContractFactory("DragonNFT");
  const dragonNFT = await DragonNFT.deploy();
  await dragonNFT.waitForDeployment();
  const dragonAddress = await dragonNFT.getAddress();
  console.log("✅ DragonNFT deployed to:", dragonAddress);

  // Deploy EggNFT
  console.log("\n🥚 Deploying EggNFT...");
  const EggNFT = await hre.ethers.getContractFactory("EggNFT");
  const eggNFT = await EggNFT.deploy();
  await eggNFT.waitForDeployment();
  const eggAddress = await eggNFT.getAddress();
  console.log("✅ EggNFT deployed to:", eggAddress);

  // Deploy BattleArena
  console.log("\n⚔️ Deploying BattleArena...");
  const BattleArena = await hre.ethers.getContractFactory("BattleArena");
  const battleArena = await BattleArena.deploy(dragonAddress);
  await battleArena.waitForDeployment();
  const battleAddress = await battleArena.getAddress();
  console.log("✅ BattleArena deployed to:", battleAddress);

  // Deploy DragonMarketplace
  console.log("\n🛒 Deploying DragonMarketplace...");
  const DragonMarketplace = await hre.ethers.getContractFactory("DragonMarketplace");
  const marketplace = await DragonMarketplace.deploy(dragonAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ DragonMarketplace deployed to:", marketplaceAddress);

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`DragonNFT:         ${dragonAddress}`);
  console.log(`EggNFT:            ${eggAddress}`);
  console.log(`BattleArena:       ${battleAddress}`);
  console.log(`DragonMarketplace: ${marketplaceAddress}`);
  console.log("=".repeat(60));

  console.log("\n📝 Update your .env.local file with these addresses:");
  console.log(`NEXT_PUBLIC_DRAGON_NFT_LOCAL=${dragonAddress}`);
  console.log(`NEXT_PUBLIC_EGG_NFT_LOCAL=${eggAddress}`);
  console.log(`NEXT_PUBLIC_BATTLE_CONTRACT_LOCAL=${battleAddress}`);
  console.log(`NEXT_PUBLIC_MARKETPLACE_LOCAL=${marketplaceAddress}`);

  // Create test data
  console.log("\n🧪 Creating test data...");
  
  // Buy 3 eggs
  console.log("\n1️⃣ Buying 3 test eggs...");
  for (let i = 0; i < 3; i++) {
    const tx = await eggNFT.buyEgg({ value: hre.ethers.parseEther("0.01") });
    await tx.wait();
    console.log(`   Egg ${i + 1} purchased!`);
  }

  // Hatch 2 eggs (wait is disabled for testing)
  console.log("\n2️⃣ Hatching 2 eggs...");
  for (let i = 0; i < 2; i++) {
    const egg = await eggNFT.getEgg(i);
    const tx = await dragonNFT.hatchEgg(deployer.address, egg.element);
    await tx.wait();
    console.log(`   Dragon ${i + 1} hatched with element ${egg.element}!`);
  }

  console.log("\n✅ Local deployment complete!");
  console.log("🎮 Start the app: npm run dev");
  console.log("💡 Make sure to update your .env.local file first!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
