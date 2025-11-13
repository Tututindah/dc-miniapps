const hre = require("hardhat");

async function main() {
  console.log("Deploying Dragon City contracts...");

  // Deploy DragonNFT
  const DragonNFT = await hre.ethers.getContractFactory("DragonNFT");
  const dragonNFT = await DragonNFT.deploy();
  await dragonNFT.waitForDeployment();
  const dragonAddress = await dragonNFT.getAddress();
  console.log("DragonNFT deployed to:", dragonAddress);

  // Deploy EggNFT
  const EggNFT = await hre.ethers.getContractFactory("EggNFT");
  const eggNFT = await EggNFT.deploy();
  await eggNFT.waitForDeployment();
  const eggAddress = await eggNFT.getAddress();
  console.log("EggNFT deployed to:", eggAddress);

  // Deploy BattleArena
  const BattleArena = await hre.ethers.getContractFactory("BattleArena");
  const battleArena = await BattleArena.deploy(dragonAddress);
  await battleArena.waitForDeployment();
  const battleAddress = await battleArena.getAddress();
  console.log("BattleArena deployed to:", battleAddress);

  console.log("\n📝 Update your .env file with these addresses:");
  console.log(`NEXT_PUBLIC_DRAGON_NFT_BASE=${dragonAddress}`);
  console.log(`NEXT_PUBLIC_EGG_NFT_BASE=${eggAddress}`);
  console.log(`NEXT_PUBLIC_BATTLE_CONTRACT_BASE=${battleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
