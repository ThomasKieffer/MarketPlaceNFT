import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SimpleNFT, SimpleNFT__factory, NFTFactory} from "../typechain-types";

describe("Factory tests", function () {
  let factory: NFTFactory;
  let SimpleNFT: SimpleNFT__factory;
  let simpleNFT: SimpleNFT;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let accounts: SignerWithAddress[];

  const nftName: string = "MyToken";
  const nftSymbol: string = "MTK";
  const nftTotalSupply: number = 5000;
  const nftBaseURI: string = "https://gateway.pinata.cloud/ipfs/ExempleURI/";

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("NFTFactory");
    SimpleNFT = await ethers.getContractFactory("SimpleNFT");
    [owner, account1, account2, ...accounts] = await ethers.getSigners();
    factory = await Factory.deploy();
  });

  describe("Factory deployToken", function () {
    describe("test on success", function () {
      it("Should create a collection, get count", async function () {
        await factory.deployToken(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        expect(await factory.getCount()).to.equal(1);
      });

      it("Should create a collection, get address", async function () {
        await factory.deployToken(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        const collectionID = await factory.getCount();
        expect(await factory.collections(collectionID)).to.not.equal(0);
      });

      it("Should create a collection, get collection infos", async function () {
        await factory.deployToken(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        const collectionAddress = await factory.collections(0);
        simpleNFT = SimpleNFT.attach(collectionAddress);
        expect(await simpleNFT.name()).to.equal(nftName);
        expect(await simpleNFT.symbol()).to.equal(nftSymbol);
        expect(await simpleNFT.totalSupply()).to.equal(nftTotalSupply);
        expect(await simpleNFT.baseURI()).to.equal(nftBaseURI);
      });

      it("Should create a collection, get collection owner", async function () {
        await factory.connect(account1).deployToken(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        const collectionAddress = await factory.collections(0);
        simpleNFT = SimpleNFT.attach(collectionAddress);
        expect(await simpleNFT.owner()).to.equal(account1.address);
      });

      it("Should create a collection, emit CollectionDeployed", async function () {
        const tx = await factory.connect(account1).deployToken(nftName, nftSymbol, nftTotalSupply, nftBaseURI);
        const collectionAddress = await factory.collections(0);
        await expect(tx).to.emit(factory, "CollectionDeployed").withArgs(nftName, 0, collectionAddress);
      });
    });

    //     // describe("test on failure", function () {});
  });
});
