const hre = require("hardhat");

async function main() {
  console.log("🐉 Deploying Dragon City NFT to LOCAL network...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy DragonCityNFT (all-in-one contract)
  console.log("\n🐉 Deploying DragonCityNFT...");
  const DragonCityNFT = await hre.ethers.getContractFactory("DragonCityNFT");
  const dragonCity = await DragonCityNFT.deploy();
  await dragonCity.waitForDeployment();
  const dragonCityAddress = await dragonCity.getAddress();
  console.log("✅ DragonCityNFT deployed to:", dragonCityAddress);

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("DragonCityNFT:", dragonCityAddress);
  console.log("=".repeat(60));

  console.log("\n🎮 Creating test data...");

  // Create 3 test dragons with different rarities
  console.log("\n1️⃣ Creating Common Fire Dragon...");
  const tx1 = await dragonCity.createDragon(0, 1, 0, { value: hre.ethers.parseEther("0.01") }); // Fire/Water, Common
  await tx1.wait();
  console.log("✅ Dragon #1 created (Common Fire/Water)");

  console.log("\n2️⃣ Creating Rare Dark Dragon...");
  const tx2 = await dragonCity.createDragon(4, 5, 1, { value: hre.ethers.parseEther("0.01") }); // Dark/Light, Rare
  await tx2.wait();
  console.log("✅ Dragon #2 created (Rare Dark/Light)");

  console.log("\n3️⃣ Creating Epic Electric Dragon...");
  const tx3 = await dragonCity.createDragon(9, 6, 2, { value: hre.ethers.parseEther("0.01") }); // Electric/Nature, Epic
  await tx3.wait();
  console.log("✅ Dragon #3 created (Epic Electric/Nature)");

  // Name the dragons
  console.log("\n📝 Naming dragons...");
  await dragonCity.nameDragon(1, "Flamewing");
  await dragonCity.nameDragon(2, "Shadowbane");
  await dragonCity.nameDragon(3, "Stormbringer");
  console.log("✅ Dragons named");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  
  console.log("\n📝 Update your .env.local file:");
  console.log(`NEXT_PUBLIC_DRAGON_CITY_LOCAL=${dragonCityAddress}`);
  
  console.log("\n💡 Test dragons created:");
  console.log("  1. Flamewing - Common Fire/Water Dragon");
  console.log("  2. Shadowbane - Rare Dark/Light Dragon");
  console.log("  3. Stormbringer - Epic Electric/Nature Dragon");

  console.log("\n🚀 Next steps:");
  console.log("  1. Copy the contract address to .env.local");
  console.log("  2. Start your Next.js app: npm run dev");
  console.log("  3. Try training and evolving your dragons!");
  console.log("  4. List dragons on the marketplace");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
