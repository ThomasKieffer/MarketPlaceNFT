import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SimpleNFT, SimpleNFT__factory} from "../typechain-types";

describe("SimpleNFT tests", function () {
  let NFT: SimpleNFT__factory;
  let nft: SimpleNFT;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let accounts: SignerWithAddress[];

  const nftName = "MyToken";
  const nftSymbol = "MTK";
  const nftTotalSupply = 5000;
  const nftBaseURI = "https://gateway.pinata.cloud/ipfs/ExempleURI/";

  beforeEach(async function () {
    NFT = await ethers.getContractFactory("SimpleNFT");
    [owner, account1, account2, ...accounts] = await ethers.getSigners();
  });

  describe("NFT deployment", function () {
    describe("test on success", function () {
      it("Should deploy collection, get informations", async function () {
        nft = await NFT.deploy(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        expect(await nft.name()).to.equal(nftName);
        expect(await nft.symbol()).to.equal(nftSymbol);
        expect(await nft.totalSupply()).to.equal(nftTotalSupply);
        expect(await nft.baseURI()).to.equal(nftBaseURI);
      });
    });

    describe("test on failure", function () {
      it("Should not deploy if URI empty, revert", async function () {
        await expect(NFT.deploy(nftName, nftSymbol, nftTotalSupply, "")).to.be.revertedWith("URI cannot be empty");
      });

      it("Should not deploy if totalSupply is 0, revert", async function () {
        await expect(NFT.deploy(nftName, nftSymbol, 0, nftBaseURI)).to.be.revertedWith("TotalSupply cannot be empty");
      });
    });
  });

  describe("NFT minting", function () {
    describe("test on success", function () {
      beforeEach(async function () {
        nft = await NFT.deploy(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
      });

      it("Should mint 1 to account1, get NFT count", async function () {
        await nft.safeMint(account1.address, 0);
        expect(await nft.getCount()).to.equal(1);
      });

      it("Should mint 1 to account1, get account1 balance", async function () {
        await nft.safeMint(account1.address, 0);
        expect(await nft.balanceOf(account1.address)).to.equal(1);
      });

      it("Should mint 2 to account1 and 1 to account2, getBalances and NFT count", async function () {
        await nft.safeMint(account1.address, 0);
        await nft.safeMint(account2.address, 1);
        await nft.safeMint(account1.address, 2);
        expect(await nft.getCount()).to.equal(3);
        expect(await nft.balanceOf(account1.address)).to.equal(2);
        expect(await nft.balanceOf(account2.address)).to.equal(1);
      });
    });

    describe("test on failure", function () {
      it("Should not mint if tokenId > totalSupply, revert", async function () {
        nft = await NFT.deploy(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        await expect(nft.safeMint(account1.address, nftTotalSupply + 1)).to.be.revertedWith("Invalid token id");
      });

      it("Should not mint if totalSupply already minted, revert", async function () {
        nft = await NFT.deploy(nftName, nftSymbol, 2, nftBaseURI);
        await nft.safeMint(account1.address, 0);
        await nft.safeMint(account1.address, 1);
        await expect(nft.safeMint(account1.address, 2)).to.be.revertedWith("Cannot mint anymore");
      });

      it("Should not mint if token already minted, revert", async function () {
        nft = await NFT.deploy(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        await nft.safeMint(account1.address, 0);
        await expect(nft.safeMint(account1.address, 0)).to.be.revertedWith("ERC721: token already minted");
      });
    });
  });
});
