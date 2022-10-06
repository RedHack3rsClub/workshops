const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('NFT', function () {
  let NFT, nftContract, owner, addr1, addr2, addr3, addrs
  beforeEach(async function () {
    NFT = await ethers.getContractFactory('NFT')
    ;[owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners()
    nftContract = await NFT.deploy()
  })

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await nftContract.owner()).to.equal(owner.address)
    })
  })

  describe('setIsAllowListActive', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).setIsAllowListActive(true),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should should set isAllowListActive by owner', async function () {
      const expectedValue = true

      await nftContract.connect(owner).setIsAllowListActive(expectedValue)

      expect(await nftContract.isAllowListActive()).to.equal(expectedValue)
    })
  })

  describe('setAllowList', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).setAllowList([addr1.address], 10),
      ).to.be.revertedWith('caller is not the owner')
    })

    // THIS IS NOT WORKING, BECAUSE _allowList is private
    // it('Should should set _allowList by owner', async function () {
    //   const expectedValue = 10

    //   await nftContract
    //     .connect(owner)
    //     .setAllowList([addr1.address, addr2.address], expectedValue)

    //   expect(
    //     await nftContract.connect(owner)._allowList(addr1.address),
    //   ).to.equal(expectedValue)
    //   expect(
    //     await nftContract.connect(owner)._allowList(addr2.address),
    //   ).to.equal(expectedValue)
    // })

    it('Should should set _allowList by owner', async function () {
      const expectedValue = 10

      await nftContract
        .connect(owner)
        .setAllowList([addr1.address, addr2.address], expectedValue)

      expect(await nftContract.numAvailableToMint(addr1.address)).to.equal(
        expectedValue,
      )
      expect(await nftContract.numAvailableToMint(addr2.address)).to.equal(
        expectedValue,
      )
    })

    it('Should should set _allowList by owner', async function () {
      await nftContract.connect(owner).setIsAllowListActive(true)
      const overrides = {
        value: ethers.utils.parseEther('0.123'), // ether in this case MUST be a string
      }
      await expect(
        nftContract.connect(addr1).mintAllowList(1, overrides),
      ).to.be.revertedWith('Exceeded max available to purchase')

      await nftContract.connect(owner).setAllowList([addr1.address], 1)
      await nftContract.connect(addr1).mintAllowList(1, overrides)

      //assert
      expect(await nftContract.ownerOf(0)).to.equal(addr1.address)
      await expect(nftContract.ownerOf(1)).to.be.revertedWith(
        'URI query for nonexistent token',
      )
    })
  })

  describe('numAvailableToMint', function () {
    it('Should show numAvailableToMint', async function () {
      const expectedValue = 5

      await nftContract
        .connect(owner)
        .setAllowList([addr1.address, addr2.address], expectedValue)

      expect(await nftContract.numAvailableToMint(addr1.address)).to.equal(
        expectedValue,
      )
      expect(await nftContract.numAvailableToMint(addr2.address)).to.equal(
        expectedValue,
      )
      expect(await nftContract.numAvailableToMint(addr3.address)).to.equal(
        0,
      )
    })
  })

  describe('mintAllowList', function () {
    it('Should be reverted because the isAllowListActive is false', async function () {
      await nftContract.connect(owner).setIsAllowListActive(false)
      const overrides = {
        value: ethers.utils.parseEther('0.123'), // ether in this case MUST be a string
      }
      await nftContract.connect(owner).setAllowList([addr1.address], 1)
      await expect(
        nftContract.connect(addr1).mintAllowList(1, overrides),
      ).to.be.revertedWith('Allow list is not active')
    })

    it('Should be reverted if exceeded max available to purchase', async function () {
      await nftContract.connect(owner).setIsAllowListActive(true)
      const overrides = {
        value: ethers.utils.parseEther('0.246'), // ether in this case MUST be a string
      }
      await nftContract.connect(owner).setAllowList([addr1.address], 1)
      await expect(
        nftContract.connect(addr1).mintAllowList(2, overrides),
      ).to.be.revertedWith('Exceeded max available to purchase')
    })

    it('Should be reverted because the caller exceeds max token', async function () {
      await nftContract.connect(owner).setIsAllowListActive(true)
      const overrides = {
        value: ethers.utils.parseEther('24.6'), // ether in this case MUST be a string
      }
      //50*200 = 10000
      for (let i = 0; i < 50; i++) {
        await nftContract
          .connect(owner)
          .setAllowList([addrs[i].address], 200)
        await nftContract.connect(addrs[i]).mintAllowList(200, overrides)
      }
      await nftContract
        .connect(owner)
        .setAllowList([addrs[50].address], 200)
      await expect(
        nftContract.connect(addrs[50]).mintAllowList(1, overrides),
      ).to.be.revertedWith('Purchase would exceed max tokens')
    })

    it('Should be reverted because the caller do not have enough fund', async function () {
      await nftContract.connect(owner).setIsAllowListActive(true)

      const overrides = {
        value: ethers.utils.parseEther('0.122'), // ether in this case MUST be a string
      }
      await nftContract.connect(owner).setAllowList([addr1.address], 1)
      await expect(
        nftContract.connect(addr1).mintAllowList(1, overrides),
      ).to.be.revertedWith('Ether value sent is not correct')
    })

    it('Should mint token', async function () {
      const baseurl = 'ipfs://test.url/'
      nftContract.connect(owner).setBaseURI(baseurl)
      await nftContract.connect(owner).setIsAllowListActive(true)
      const overrides = {
        value: ethers.utils.parseEther('0.123'), // ether in this case MUST be a string
      }
      await nftContract.connect(owner).setAllowList([addr1.address], 1)
      await nftContract.connect(addr1).mintAllowList(1, overrides)

      expect(await nftContract.tokenURI(0)).to.equal(baseurl + '0') //ipfs://test.url/0
      expect(await nftContract.ownerOf(0)).to.equal(addr1.address)
    })
  })

  describe('setBaseURI', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).setBaseURI('url'),
      ).to.be.revertedWith('caller is not the owner')
    })

    it('Should set the baseTokenURI by owner', async function () {
      const baseurl = 'ipfs://test.url/'
      nftContract.connect(owner).setBaseURI(baseurl)
      const overrides = {
        value: ethers.utils.parseEther('0.123'), // ether in this case MUST be a string
      }
      await nftContract.connect(owner).setSaleState(true)
      await nftContract.connect(addr1).mint(1, overrides)

      expect(await nftContract.tokenURI(0)).to.equal(baseurl + '0')
      expect(await nftContract.ownerOf(0)).to.equal(addr1.address)
    })
  })

  describe('setProvenance', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).setProvenance('random hash'),
      ).to.be.revertedWith('caller is not the owner')
    })

    it('Should should set PROVENANCE by owner', async function () {
      const expectedValue = 'random hash'

      await nftContract.connect(owner).setProvenance(expectedValue)

      expect(await nftContract.PROVENANCE()).to.equal(expectedValue)
    })
  })

  describe('reserve', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).reserve(1),
      ).to.be.revertedWith('caller is not the owner')
    })

    it('Should reserve tokens by owner', async function () {
      const baseurl = 'ipfs://test.url/'
      nftContract.connect(owner).setBaseURI(baseurl)
      await nftContract.connect(owner).reserve(5)
      for (let i = 0; i < 5; i++) {
        expect(await nftContract.tokenURI(i)).to.equal(baseurl + i)
      }
    })
  })

  describe('setSaleState', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).setSaleState(true),
      ).to.be.revertedWith('caller is not the owner')
    })

    it('Should should set saleIsActive by owner', async function () {
      const expectedValue = true

      await nftContract.connect(owner).setSaleState(expectedValue)

      expect(await nftContract.saleIsActive()).to.equal(expectedValue)
    })
  })

  describe('mint', function () {
    it('Should be reverted because the saleIsActive is false', async function () {
      await nftContract.connect(owner).setSaleState(false)
      const overrides = {
        value: ethers.utils.parseEther('0.123'), // ether in this case MUST be a string
      }
      await expect(
        nftContract.connect(addr1).mint(1, overrides),
      ).to.be.revertedWith('Sale must be active to mint tokens')
    })

    it('Should be reverted if exceeded max token purchase', async function () {
      await nftContract.connect(owner).setSaleState(true)
      const overrides = {
        value: ethers.utils.parseEther('0.738'), // ether in this case MUST be a string
      }

      await expect(
        nftContract.connect(addr1).mint(6, overrides),
      ).to.be.revertedWith('Exceeded max token purchase')
    })

    it('Should be reverted because the caller exceeds max token', async function () {
      await nftContract.connect(owner).setSaleState(true)
      const overrides = {
        value: ethers.utils.parseEther('0.615'), // ether in this case MUST be a string
      }

      //5 token each time * 2000 = 10000
      for (let i = 0; i < 2000; i++) {
        await nftContract.connect(addr1).mint(5, overrides)
      }

      await expect(
        nftContract.connect(addr1).mint(1, overrides),
      ).to.be.revertedWith('Purchase would exceed max tokens')
    })

    it('Should be reverted because the caller do not have enough fund', async function () {
      await nftContract.connect(owner).setSaleState(true)

      const overrides = {
        value: ethers.utils.parseEther('0.122'), // ether in this case MUST be a string
      }
      await expect(
        nftContract.connect(addr1).mint(1, overrides),
      ).to.be.revertedWith('Ether value sent is not correct')
    })

    it('Should mint token', async function () {
      const baseurl = 'ipfs://test.url/'
      nftContract.connect(owner).setBaseURI(baseurl)
      await nftContract.connect(owner).setSaleState(true)
      const overrides = {
        value: ethers.utils.parseEther('0.123'), // ether in this case MUST be a string
      }
      await nftContract.connect(addr1).mint(1, overrides)

      expect(await nftContract.tokenURI(0)).to.equal(baseurl + '0')
      expect(await nftContract.ownerOf(0)).to.equal(addr1.address)
    })
  })

  describe('withdraw', function () {
    it('Should be reverted because the caller is not owner', async function () {
      await expect(
        nftContract.connect(addr1).withdraw(),
      ).to.be.revertedWith('caller is not the owner')
    })
    it('Should withdraw fund by the owner', async function () {
      await nftContract.connect(owner).withdraw()
    })

    it('Should withdraw fund by the owner', async function () {
      await nftContract.connect(owner).setSaleState(true)
      const overrides = {
        value: ethers.utils.parseEther('5'), // ether in this case MUST be a string
      }
      await nftContract.connect(addr1).mint(1, overrides)
      const accountBalanceBeforeWithdraw = ethers.utils.formatEther(
        await nftContract.provider.getBalance(owner.address),
      )

      await nftContract.connect(owner).withdraw()
      const accountBalanceAfterWithdraw = ethers.utils.formatEther(
        await nftContract.provider.getBalance(owner.address),
      )

      expect(
        parseInt(accountBalanceAfterWithdraw) >
          parseInt(accountBalanceBeforeWithdraw),
      ).to.be.true

      //get smart contract balance before withdraw and smart contract balance after withdraw
    })
  })
})
