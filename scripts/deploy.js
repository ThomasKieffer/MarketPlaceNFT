const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();

  const NFT = await ethers.getContractFactory("SimpleNFT");
  const MarketPlace = await ethers.getContractFactory("MarketPlace");

  const nft = await NFT.deploy();
  const marketplace = await MarketPlace.deploy(2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
