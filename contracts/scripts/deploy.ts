import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    Whitelist: string;
    TokenVesting: string;
    LaunchpadFactory: string;
    MockERC20?: string;
  };
  txHashes: {
    Whitelist: string;
    TokenVesting: string;
    LaunchpadFactory: string;
    MockERC20?: string;
  };
}

async function main() {
  console.log("🚀 Starting Launchpad Deployment...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const networkName = network.name;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("🌐 Network:", networkName);
  console.log("🔗 Chain ID:", chainId.toString());
  console.log("");

  // Deployment configuration
  const feeCollector = deployer.address; // Change in production
  const platformFee = 250; // 2.5%

  const deployment: DeploymentInfo = {
    network: networkName,
    chainId: Number(chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      Whitelist: "",
      TokenVesting: "",
      LaunchpadFactory: "",
    },
    txHashes: {
      Whitelist: "",
      TokenVesting: "",
      LaunchpadFactory: "",
    },
  };

  // 1. Deploy Whitelist
  console.log("📋 Deploying Whitelist...");
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await Whitelist.deploy(deployer.address);
  await whitelist.waitForDeployment();
  const whitelistAddress = await whitelist.getAddress();
  deployment.contracts.Whitelist = whitelistAddress;
  deployment.txHashes.Whitelist = whitelist.deploymentTransaction()?.hash || "";
  console.log("✅ Whitelist deployed to:", whitelistAddress);

  // 2. Deploy a sample token for vesting (or use existing token in production)
  let vestingToken: string;
  
  if (networkName === "hardhat" || networkName === "localhost" || networkName === "sepolia") {
    console.log("\n🪙 Deploying MockERC20 for testing...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Launch Token", "LAUNCH", 18);
    await mockToken.waitForDeployment();
    vestingToken = await mockToken.getAddress();
    deployment.contracts.MockERC20 = vestingToken;
    deployment.txHashes.MockERC20 = mockToken.deploymentTransaction()?.hash || "";
    console.log("✅ MockERC20 deployed to:", vestingToken);
    
    // Mint tokens to deployer
    await mockToken.mint(deployer.address, ethers.parseEther("10000000"));
    console.log("   Minted 10,000,000 tokens to deployer");
  } else {
    // For mainnet, use an existing token address
    vestingToken = process.env.VESTING_TOKEN_ADDRESS || "";
    if (!vestingToken) {
      throw new Error("VESTING_TOKEN_ADDRESS required for mainnet deployment");
    }
  }

  // 3. Deploy TokenVesting
  console.log("\n⏰ Deploying TokenVesting...");
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.deploy(vestingToken, deployer.address);
  await tokenVesting.waitForDeployment();
  const tokenVestingAddress = await tokenVesting.getAddress();
  deployment.contracts.TokenVesting = tokenVestingAddress;
  deployment.txHashes.TokenVesting = tokenVesting.deploymentTransaction()?.hash || "";
  console.log("✅ TokenVesting deployed to:", tokenVestingAddress);

  // 4. Deploy LaunchpadFactory
  console.log("\n🏭 Deploying LaunchpadFactory...");
  const LaunchpadFactory = await ethers.getContractFactory("LaunchpadFactory");
  const factory = await LaunchpadFactory.deploy(
    deployer.address,
    feeCollector,
    platformFee
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  deployment.contracts.LaunchpadFactory = factoryAddress;
  deployment.txHashes.LaunchpadFactory = factory.deploymentTransaction()?.hash || "";
  console.log("✅ LaunchpadFactory deployed to:", factoryAddress);

  // 5. Configure factory with default whitelist
  console.log("\n⚙️  Configuring factory...");
  const setWhitelistTx = await factory.setDefaultWhitelist(whitelistAddress);
  await setWhitelistTx.wait();
  console.log("   Set default whitelist on factory");

  // 6. Verify contracts (if not local network)
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await run("verify:verify", {
        address: whitelistAddress,
        constructorArguments: [deployer.address],
      });
      console.log("   ✅ Whitelist verified");
    } catch (e: any) {
      console.log("   ⚠️  Whitelist verification failed:", e.message);
    }

    try {
      await run("verify:verify", {
        address: tokenVestingAddress,
        constructorArguments: [vestingToken, deployer.address],
      });
      console.log("   ✅ TokenVesting verified");
    } catch (e: any) {
      console.log("   ⚠️  TokenVesting verification failed:", e.message);
    }

    try {
      await run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [deployer.address, feeCollector, platformFee],
      });
      console.log("   ✅ LaunchpadFactory verified");
    } catch (e: any) {
      console.log("   ⚠️  LaunchpadFactory verification failed:", e.message);
    }

    if (deployment.contracts.MockERC20) {
      try {
        await run("verify:verify", {
          address: deployment.contracts.MockERC20,
          constructorArguments: ["Launch Token", "LAUNCH", 18],
        });
        console.log("   ✅ MockERC20 verified");
      } catch (e: any) {
        console.log("   ⚠️  MockERC20 verification failed:", e.message);
      }
    }
  }

  // 7. Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(`\n📁 Deployment info saved to: ${deploymentFile}`);

  // 8. Generate frontend addresses file
  const frontendAddresses = `// Auto-generated contract addresses for ${networkName}
// Generated at: ${deployment.timestamp}

export const CONTRACT_ADDRESSES = {
  WHITELIST: "${whitelistAddress}" as const,
  TOKEN_VESTING: "${tokenVestingAddress}" as const,
  LAUNCHPAD_FACTORY: "${factoryAddress}" as const,
  ${deployment.contracts.MockERC20 ? `MOCK_TOKEN: "${deployment.contracts.MockERC20}" as const,` : ""}
} as const;

export const CHAIN_ID = ${chainId};
export const NETWORK_NAME = "${networkName}";
`;

  const frontendFile = path.join(deploymentsDir, `addresses-${networkName}.ts`);
  fs.writeFileSync(frontendFile, frontendAddresses);
  console.log(`📄 Frontend addresses saved to: ${frontendFile}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network:          ${networkName}`);
  console.log(`Chain ID:         ${chainId}`);
  console.log(`Deployer:         ${deployer.address}`);
  console.log("");
  console.log("Contracts:");
  console.log(`  Whitelist:        ${whitelistAddress}`);
  console.log(`  TokenVesting:     ${tokenVestingAddress}`);
  console.log(`  LaunchpadFactory: ${factoryAddress}`);
  if (deployment.contracts.MockERC20) {
    console.log(`  MockERC20:        ${deployment.contracts.MockERC20}`);
  }
  console.log("=".repeat(60));
  console.log("\n🎉 Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
