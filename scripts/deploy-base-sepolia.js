const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying to Base Sepolia...");
  console.log("Network:", hre.network.name);

  // Check if we have signers
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("❌ ERROR: No signers available!");
    console.error("Please set PRIVATE_KEY in .env.local file");
    process.exit(1);
  }

  const [deployer] = signers;
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Check if we have enough balance
  if (balance === 0n) {
    console.error("❌ ERROR: Account has 0 ETH!");
    console.error("Get testnet ETH from:");
    console.error("  - https://www.alchemy.com/faucets/base-sepolia");
    console.error("  - https://faucet.quicknode.com/base/sepolia");
    process.exit(1);
  }

  // Minimal prices for testing: 0.000000000001 ETH (1 Gwei)
  const EGG_PRICE = ethers.parseUnits("0.000000000001", "ether"); // 1000 wei
  const DRAGON_FLOOR_PRICE = ethers.parseUnits("0.000000000001", "ether"); // 1000 wei

  console.log("\n=== Deploying EggNFT ===");
  const EggNFT = await ethers.getContractFactory("EggNFT");
  const eggNFT = await EggNFT.deploy();
  await eggNFT.waitForDeployment();
  const eggNFTAddress = await eggNFT.getAddress();
  console.log("EggNFT deployed to:", eggNFTAddress);

  console.log("\n=== Deploying DragonNFTWithRarity ===");
  const DragonNFT = await ethers.getContractFactory("DragonNFTWithRarity");
  const dragonNFT = await DragonNFT.deploy(eggNFTAddress);
  await dragonNFT.waitForDeployment();
  const dragonNFTAddress = await dragonNFT.getAddress();
  console.log("DragonNFT deployed to:", dragonNFTAddress);

  console.log("\n=== Deploying Leaderboard ===");
  const Leaderboard = await ethers.getContractFactory("Leaderboard");
  const leaderboard = await Leaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("Leaderboard deployed to:", leaderboardAddress);

  console.log("\n=== Deploying MissionSystem ===");
  const MissionSystem = await ethers.getContractFactory("MissionSystem");
  const missionSystem = await MissionSystem.deploy(dragonNFTAddress);
  await missionSystem.waitForDeployment();
  const missionSystemAddress = await missionSystem.getAddress();
  console.log("MissionSystem deployed to:", missionSystemAddress);

  console.log("\n=== Deploying DragonMarketplace ===");
  const DragonMarketplace = await ethers.getContractFactory("DragonMarketplace");
  const marketplace = await DragonMarketplace.deploy(dragonNFTAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("DragonMarketplace deployed to:", marketplaceAddress);

  // Configure EggNFT
  console.log("\n=== Configuring EggNFT ===");
  await eggNFT.setDragonNFT(dragonNFTAddress);
  console.log("Set DragonNFT address in EggNFT");

  // Set minimal egg prices
  await eggNFT.setEggPrice(0, EGG_PRICE); // Common
  await eggNFT.setEggPrice(1, EGG_PRICE); // Rare
  await eggNFT.setEggPrice(2, EGG_PRICE); // Epic
  await eggNFT.setEggPrice(3, EGG_PRICE); // Legendary
  console.log("Set egg prices to", ethers.formatEther(EGG_PRICE), "ETH");

  // Add egg types
  console.log("\n=== Adding Egg Types ===");
  const eggTypes = [
    { rarity: 0, name: "Fire Dragon Egg", image: "ipfs://fire-egg", element: 0 },
    { rarity: 0, name: "Water Dragon Egg", image: "ipfs://water-egg", element: 1 },
    { rarity: 0, name: "Earth Dragon Egg", image: "ipfs://earth-egg", element: 2 },
    { rarity: 1, name: "Lightning Dragon Egg", image: "ipfs://lightning-egg", element: 3 },
    { rarity: 1, name: "Ice Dragon Egg", image: "ipfs://ice-egg", element: 4 },
    { rarity: 2, name: "Shadow Dragon Egg", image: "ipfs://shadow-egg", element: 5 },
    { rarity: 2, name: "Light Dragon Egg", image: "ipfs://light-egg", element: 6 },
    { rarity: 3, name: "Chaos Dragon Egg", image: "ipfs://chaos-egg", element: 7 },
  ];

  for (let i = 0; i < eggTypes.length; i++) {
    const egg = eggTypes[i];
    const metadata = JSON.stringify({ name: egg.name, image: egg.image });
    await eggNFT.addEggType(i, egg.element, egg.rarity, metadata);
    console.log(`Added ${egg.name}`);
  }

  // Configure DragonNFT
  console.log("\n=== Configuring DragonNFT ===");
  await dragonNFT.setEggNFT(eggNFTAddress);
  console.log("Set EggNFT address in DragonNFT");

  // Grant marketplace approval for trading
  console.log("\n=== Setting up Marketplace Permissions ===");
  // Users will need to approve marketplace themselves for their NFTs

  console.log("\n=== Deployment Summary ===");
  console.log("EggNFT:", eggNFTAddress);
  console.log("DragonNFT:", dragonNFTAddress);
  console.log("Leaderboard:", leaderboardAddress);
  console.log("MissionSystem:", missionSystemAddress);
  console.log("DragonMarketplace:", marketplaceAddress);
  console.log("\nEgg Price:", ethers.formatEther(EGG_PRICE), "ETH");
  console.log("Dragon Floor Price:", ethers.formatEther(DRAGON_FLOOR_PRICE), "ETH");

  // Save deployment addresses to file
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      EggNFT: eggNFTAddress,
      DragonNFT: dragonNFTAddress,
      Leaderboard: leaderboardAddress,
      MissionSystem: missionSystemAddress,
      DragonMarketplace: marketplaceAddress
    },
    config: {
      eggPrice: ethers.formatEther(EGG_PRICE),
      dragonFloorPrice: ethers.formatEther(DRAGON_FLOOR_PRICE)
    }
  };

  fs.writeFileSync(
    'deployments-base-sepolia.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to deployments-base-sepolia.json");

  // Verify contracts on BaseScan
  if (hre.network.name === "baseSepolia") {
    console.log("\n=== Waiting for block confirmations ===");
    console.log("Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("\n=== Verifying contracts on BaseScan ===");
    
    try {
      await hre.run("verify:verify", {
        address: eggNFTAddress,
        constructorArguments: [],
      });
      console.log("EggNFT verified");
    } catch (error) {
      console.log("EggNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: dragonNFTAddress,
        constructorArguments: [eggNFTAddress],
      });
      console.log("DragonNFT verified");
    } catch (error) {
      console.log("DragonNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: leaderboardAddress,
        constructorArguments: [],
      });
      console.log("Leaderboard verified");
    } catch (error) {
      console.log("Leaderboard verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: missionSystemAddress,
        constructorArguments: [dragonNFTAddress],
      });
      console.log("MissionSystem verified");
    } catch (error) {
      console.log("MissionSystem verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [dragonNFTAddress],
      });
      console.log("DragonMarketplace verified");
    } catch (error) {
      console.log("DragonMarketplace verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
