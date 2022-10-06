const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("NFT contract", function () {
  let NFT;
  let nftContract;
  let _name = "Hack3rsClub";
  let _symbol = "HC";
  let account1, otheraccounts;

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  beforeEach(async function () {
    NFT = await ethers.getContractFactory("NFT");
    [owner, account1, ...otheraccounts] = await ethers.getSigners();

    nftContract = await NFT.deploy(_name, _symbol);
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    it("Should has the correct name and symbol ", async function () {
      expect(await nftContract.name()).to.equal(_name);
      expect(await nftContract.symbol()).to.equal(_symbol);
    });

    it("Should start with supply of 0", async function () {
      expect(await nftContract.totalSupply()).to.equal(0);
    });

    it("Should fail to mint a token with token ID 1 to account1", async function () {
      const address1 = account1.address;
      await nftContract.connect(address1).mint(1, {
        value: ethers.utils.parseEther("1.0"),
      });
      expect(await nftContract.balanceOf(address1)).to.equal(0);
    });

    it("Should unpause contract", async function () {
      await nftContract.pause(false);
      expect(await nftContract.paused()).to.equal(false);
    });

    it("Should mint a token with token ID 1 & 2 to account1", async function () {
      const address1 = account1.address;
      await nftContract
        .connect(address1)
        .mint({ value: ethers.utils.parseEther("0.1") });
      expect(await nftContract.ownerOf(1)).to.equal(address1);

      await nftContract
        .connect(address1)
        .mint({ value: ethers.utils.parseEther("0.1") });
      expect(await nftContract.ownerOf(2)).to.equal(address1);

      expect(await nftContract.balanceOf(address1)).to.equal(2);
    });
  });
});
