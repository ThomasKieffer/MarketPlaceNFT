const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
// const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ethersToWei = (num) => ethers.utils.parseUnits(num.toString(), "ether");

describe("MarkertPlace", function () {
  let NFT;
  let nft;
  let MarketPlace;
  let marketplace;
  let owner;
  let account1;
  let account2;
  let accounts;

  const marketPlaceFees = 2; // can be changed
  const nftPrice = ethersToWei(1); // can be changed
  const nftId = 0;

  beforeEach(async function () {
    NFT = await ethers.getContractFactory("SimpleNFT");
    MarketPlace = await ethers.getContractFactory("MarketPlace");
    [owner, account1, account2, ...accounts] = await ethers.getSigners();

    nft = await NFT.deploy();
    marketplace = await MarketPlace.deploy(marketPlaceFees);
  });

  describe("NFT deployment", function () {
    describe("test on success", function () {
      it("Should get the name and symbol of the NFT collection", async function () {
        expect(await nft.name()).to.equal("MyToken");
        expect(await nft.symbol()).to.equal("MTK");
      });
    });
  });

  describe("NFT minting", function () {
    describe("test on success", function () {
      it("Should mint 1 to account1, get NFT count", async function () {
        await nft.safeMint(account1.address);
        expect(await nft.getCount()).to.equal(1);
      });

      it("Should mint 1 to account1, get account1 balance", async function () {
        await nft.safeMint(account1.address);
        expect(await nft.balanceOf(account1.address)).to.equal(1);
      });

      it("Should mint 2 to account1 and 1 to account2, getBalances and NFT count", async function () {
        await nft.safeMint(account1.address);
        await nft.safeMint(account2.address);
        await nft.safeMint(account1.address);
        expect(await nft.getCount()).to.equal(3);
        expect(await nft.balanceOf(account1.address)).to.equal(2);
        expect(await nft.balanceOf(account2.address)).to.equal(1);
      });
    });
  });

  describe("MarketPlace setPrice", function () {
    beforeEach(async function () {
      await nft.safeMint(account1.address);
    });

    describe("test on success", function () {
      it("Should account1 setPrice, getPrice", async function () {
        await marketplace.connect(account1).setPrice(nft.address, nftId, nftPrice);
        expect(await marketplace.NFTinfos(nft.address, nftId)).to.equal(nftPrice);
      });

      it("Should account1 setPrice, emit PutUpForSale", async function () {
        await expect(marketplace.connect(account1).setPrice(nft.address, nftId, nftPrice)).to.emit(marketplace, "PutUpForSale").withArgs(nft.address, nftId, nftPrice, account1.address);
      });
    });

    describe("test on failure", function () {
      it("Should not setPrice if not the nft owner, revert", async function () {
        await expect(marketplace.connect(account2).setPrice(nft.address, nftId, nftPrice)).to.be.revertedWith("You are not the NFT owner");
      });

      it("Should not setPrice = 0, revert", async function () {
        await expect(marketplace.connect(account1).setPrice(nft.address, nftId, 0)).to.be.revertedWith("Price cannot be 0");
      });
    });
  });

  describe("MarketPlace removePrice", function () {
    beforeEach(async function () {
      await nft.safeMint(account1.address);
      await marketplace.connect(account1).setPrice(nft.address, nftId, nftPrice);
    });

    describe("test on success", function () {
      it("Should account1 removePrive, getPrice", async function () {
        await marketplace.connect(account1).removePrice(nft.address, nftId);
        expect(await marketplace.NFTinfos(nft.address, nftId)).to.equal(ethersToWei(0));
      });

      it("Should account1 removePrive, emit WithdrawnFromSale", async function () {
        await expect(marketplace.connect(account1).removePrice(nft.address, nftId)).to.emit(marketplace, "WithdrawnFromSale").withArgs(nft.address, nftId, account1.address);
      });
    });

    describe("test on failure", function () {
      it("Should not removePrice if not the nft owner, revert", async function () {
        await expect(marketplace.connect(account2).removePrice(nft.address, nftId)).to.be.revertedWith("You are not the NFT owner");
      });

      it("Should not removePrice if already at 0, revert", async function () {
        await nft.safeMint(account1.address);
        await expect(marketplace.connect(account1).removePrice(nft.address, 1)).to.be.revertedWith("Price already at 0");
      });
    });
  });

  describe("MarketPlace buyNft", function () {
    beforeEach(async function () {
      await nft.safeMint(account1.address);
      await nft.connect(account1).approve(marketplace.address, nftId);
      await marketplace.connect(account1).setPrice(nft.address, nftId, nftPrice);
    });

    describe("test on success", function () {
      it("Should buyNft, get nft owner", async function () {
        await marketplace.connect(account2).buyNft(nft.address, nftId, { value: nftPrice });
        expect(await nft.ownerOf(nftId)).to.equal(account2.address);
      });

      it("Should buyNft, get original nft owner balance", async function () {
        const originalSellerBalance = await account1.getBalance();
        await marketplace.connect(account2).buyNft(nft.address, nftId, { value: nftPrice });
        const newSellerBalance = await account1.getBalance();
        const fees = nftPrice.mul(marketPlaceFees).div(100);
        const priceSubFees = nftPrice.sub(fees);
        expect(newSellerBalance).to.be.equal(originalSellerBalance.add(priceSubFees));
      });

      it("Should buyNft, get new nft owner balance", async function () {
        const originalBuyerBalance = await account2.getBalance();
        const tx = await marketplace.connect(account2).buyNft(nft.address, nftId, { value: nftPrice });
        const newBuyerBalance = await account2.getBalance();
        const receipt = await tx.wait();
        const weiUsedForGas = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        expect(newBuyerBalance).to.be.equal(originalBuyerBalance.sub(nftPrice).sub(weiUsedForGas));
      });

      it("Should buyNft, get marketplace balance", async function () {
        const originalMarketPlaceBalance = await ethers.provider.getBalance(marketplace.address);
        await marketplace.connect(account2).buyNft(nft.address, 0, { value: nftPrice });
        const newMarketPlaceBalance = await ethers.provider.getBalance(marketplace.address);
        const fees = nftPrice.mul(marketPlaceFees).div(100);
        expect(newMarketPlaceBalance).to.be.equal(originalMarketPlaceBalance.add(fees));
      });

      it("Should buyNft, get new nft price", async function () {
        await marketplace.connect(account2).buyNft(nft.address, nftId, { value: nftPrice });
        expect(await marketplace.NFTinfos(nft.address, nftId)).to.equal(0);
      });

      it("Should buyNft, emit Purchased", async function () {
        await expect(await marketplace.connect(account2).buyNft(nft.address, nftId, { value: nftPrice }))
          .to.emit(marketplace, "Purchased")
          .withArgs(nft.address, nftId, nftPrice, account1.address, account2.address);
      });
    });

    describe("test on failure", function () {
      it("Should not buyNft if marketPlace not approved, revert", async function () {
        await nft.safeMint(account1.address);
        await expect(marketplace.connect(account2).buyNft(nft.address, 1, { value: nftPrice })).to.be.revertedWith("We cannot sell you this NFT");
      });

      it("Should not buyNft if not for sale, revert", async function () {
        await nft.safeMint(account1.address);
        await nft.connect(account1).approve(marketplace.address, 1);
        await expect(marketplace.connect(account2).buyNft(nft.address, 1, { value: nftPrice })).to.be.revertedWith("This NFT is not for sale");
      });

      it("Should not buyNft if amount too low, revert", async function () {
        await expect(marketplace.connect(account2).buyNft(nft.address, nftId, { value: ethersToWei(0) })).to.be.revertedWith("Incorrect amount");
      });
    });
  });

  describe("MarketPlace withdrawMoney", function () {
    beforeEach(async function () {
      await nft.safeMint(account1.address);
      await nft.connect(account1).approve(marketplace.address, nftId);
      await marketplace.connect(account1).setPrice(nft.address, nftId, nftPrice);
      await marketplace.connect(account2).buyNft(nft.address, nftId, { value: nftPrice });
    });

    describe("test on success", function () {
      it("Should withdraw the marketplace balance, get marketplace balance", async function () {
        const balanceMarketPlaceBeforeWithdraw = await ethers.provider.getBalance(marketplace.address);
        await marketplace.withdrawMoney();
        const balanceMarketPlaceAfterWithdraw = await ethers.provider.getBalance(marketplace.address);
        const fees = nftPrice.mul(marketPlaceFees).div(100);

        expect(balanceMarketPlaceAfterWithdraw).to.be.equal(balanceMarketPlaceBeforeWithdraw.sub(fees));
      });

      it("Should withdraw the marketplace balance, get owner balance", async function () {
        const balanceBeforeWithdraw = await owner.getBalance();
        const tx = await marketplace.withdrawMoney();
        const balanceAfterWithdraw = await owner.getBalance();
        const receipt = await tx.wait();
        const weiUsedForGas = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        const fees = nftPrice.mul(marketPlaceFees).div(100);

        expect(balanceAfterWithdraw).to.be.equal(balanceBeforeWithdraw.add(fees).sub(weiUsedForGas));
      });
    });

    describe("test on failure", function () {
      it("Should not withdraw marketplace balance if not owner, revert", async function () {
        await expect(marketplace.connect(account2).withdrawMoney()).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });
});
