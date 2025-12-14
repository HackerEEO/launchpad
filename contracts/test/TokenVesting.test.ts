import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("TokenVesting (minimal)", function () {
  async function deploySimple() {
    const [owner, beneficiary] = await ethers.getSigners();
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = (await MockERC20Factory.deploy("Vesting Token", "VEST", 18)) as any;
    await token.waitForDeployment();
    const TokenVestingFactory = await ethers.getContractFactory("TokenVesting");
    const vesting = (await TokenVestingFactory.deploy(await token.getAddress(), owner.address)) as any;
    await vesting.waitForDeployment();
    await token.mint(await vesting.getAddress(), ethers.parseEther("1000000"));
    return { vesting, token, owner, beneficiary };
  }

  it("deploys and has correct token", async function () {
    const { vesting, token } = await loadFixture(deploySimple);
    expect(await vesting.token()).to.equal(await token.getAddress());
  });
});

 
