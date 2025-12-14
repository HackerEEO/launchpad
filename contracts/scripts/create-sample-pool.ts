import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to create a sample IDO pool for testing
 * Run after deploying core contracts
 */
async function main() {
  console.log("🎯 Creating Sample IDO Pool...\n");

  const [deployer, user1] = await ethers.getSigners();
  const networkName = network.name;

  // Load deployment
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployments",
    `${networkName}.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(
      `No deployment found for ${networkName}. Run deploy.ts first.`
    );
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("📍 Using contracts from deployment:");
  console.log("   Factory:", deployment.contracts.LaunchpadFactory);
  console.log("   Whitelist:", deployment.contracts.Whitelist);
  console.log("");

  // Get contracts
  const factory = await ethers.getContractAt(
    "LaunchpadFactory",
    deployment.contracts.LaunchpadFactory
  );
  const whitelist = await ethers.getContractAt(
    "Whitelist",
    deployment.contracts.Whitelist
  );

  // Deploy a sale token for the pool
  console.log("🪙 Deploying Sale Token...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const saleToken = await MockERC20.deploy("DeFi Nexus", "DNX", 18);
  await saleToken.waitForDeployment();
  const saleTokenAddress = await saleToken.getAddress();
  console.log("   Sale Token deployed to:", saleTokenAddress);

  // Pool parameters
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300; // 5 minutes from now
  const endTime = startTime + 7 * 24 * 60 * 60; // 7 days

  const poolParams = {
    name: "DeFi Nexus IDO",
    saleToken: saleTokenAddress,
    tokenPrice: ethers.parseEther("0.0005"), // 0.0005 ETH per token
    hardCap: ethers.parseEther("50"), // 50 ETH
    softCap: ethers.parseEther("10"), // 10 ETH
    minInvestment: ethers.parseEther("0.01"), // 0.01 ETH
    maxInvestment: ethers.parseEther("5"), // 5 ETH
    startTime,
    endTime,
    tgePercent: 25, // 25% at TGE
    cliffDuration: 30 * 24 * 60 * 60, // 30 days
    vestingDuration: 90 * 24 * 60 * 60, // 90 days
  };

  console.log("\n📊 Pool Parameters:");
  console.log("   Name:", poolParams.name);
  console.log("   Token Price:", ethers.formatEther(poolParams.tokenPrice), "ETH");
  console.log("   Hard Cap:", ethers.formatEther(poolParams.hardCap), "ETH");
  console.log("   Soft Cap:", ethers.formatEther(poolParams.softCap), "ETH");
  console.log("   Min Investment:", ethers.formatEther(poolParams.minInvestment), "ETH");
  console.log("   Max Investment:", ethers.formatEther(poolParams.maxInvestment), "ETH");
  console.log("   Start Time:", new Date(startTime * 1000).toISOString());
  console.log("   End Time:", new Date(endTime * 1000).toISOString());
  console.log("   TGE Percent:", poolParams.tgePercent + "%");
  console.log("   Cliff Duration:", poolParams.cliffDuration / (24 * 60 * 60), "days");
  console.log("   Vesting Duration:", poolParams.vestingDuration / (24 * 60 * 60), "days");

  // Create pool
  console.log("\n🏊 Creating IDO Pool...");
  const tx = await factory.createPool(
    poolParams.name,
    poolParams.saleToken,
    poolParams.tokenPrice,
    poolParams.hardCap,
    poolParams.softCap,
    poolParams.minInvestment,
    poolParams.maxInvestment,
    poolParams.startTime,
    poolParams.endTime,
    poolParams.tgePercent,
    poolParams.cliffDuration,
    poolParams.vestingDuration
  );

  const receipt = await tx.wait();
  console.log("   Transaction hash:", tx.hash);

  // Get pool address from event
  const pools = await factory.getAllPools();
  const poolAddress = pools[pools.length - 1];
  console.log("   Pool created at:", poolAddress);

  // Fund pool with tokens
  console.log("\n💰 Funding pool with sale tokens...");
  const totalTokens = poolParams.hardCap / poolParams.tokenPrice * BigInt(10 ** 18);
  await saleToken.mint(poolAddress, totalTokens);
  console.log("   Minted", ethers.formatEther(totalTokens), "DNX tokens to pool");

  // Add test users to whitelist
  if (user1) {
    console.log("\n📋 Adding test users to whitelist...");
    await whitelist.addToWhitelist(deployer.address);
    await whitelist.addToWhitelist(user1.address);
    console.log("   Added:", deployer.address);
    console.log("   Added:", user1.address);
  }

  // Save pool info
  const poolInfo = {
    poolAddress,
    saleToken: saleTokenAddress,
    name: poolParams.name,
    hardCap: poolParams.hardCap.toString(),
    softCap: poolParams.softCap.toString(),
    startTime,
    endTime,
    createdAt: new Date().toISOString(),
    txHash: tx.hash,
  };

  const poolsDir = path.join(__dirname, "..", "deployments", "pools");
  if (!fs.existsSync(poolsDir)) {
    fs.mkdirSync(poolsDir, { recursive: true });
  }

  const poolFile = path.join(poolsDir, `pool-${poolAddress.slice(0, 10)}.json`);
  fs.writeFileSync(poolFile, JSON.stringify(poolInfo, null, 2));
  console.log(`\n📁 Pool info saved to: ${poolFile}`);

  console.log("\n✅ Sample IDO pool created successfully!");
  console.log("\n🔗 Pool Address:", poolAddress);
  console.log("🪙 Sale Token:", saleTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
