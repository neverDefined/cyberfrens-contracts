import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { CyberDiceWL, CyberDiceWL__factory } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network } from 'hardhat'
import '@nomiclabs/hardhat-ethers'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'

chai.use(chaiAsPromised)
const { expect } = chai

const nextDay = async () => {
  await network.provider.send('evm_increaseTime', [3600])
  await network.provider.send('evm_mine')
}

const getBlockTImeAtCurrentBlock = async () => {
  const blockNumber = await ethers.provider.getBlockNumber()
  const block = await ethers.provider.getBlock(blockNumber)
  return block.timestamp
}

const mineBlocks = async (numberOfBlocks: number) => {
  const startingBlock = await ethers.provider.getBlockNumber()
  const targetBlock = numberOfBlocks + startingBlock
  let currentBlock = startingBlock
  while (currentBlock < targetBlock) {
    await network.provider.send('evm_mine')
    currentBlock = await ethers.provider.getBlockNumber()
  }
}

const betAndRoll = async (
  riskLevel: number,
  contract: CyberDiceWL,
  player: SignerWithAddress,
) => {
  const betPrice = await checkExpectedPrice(riskLevel, 0, contract)
  const betPriceInWei = ethers.utils.parseEther(betPrice.toString())
  const betTx = await contract.connect(player).placeBet(riskLevel, { value: betPriceInWei })

  const betReceipt = await betTx.wait()
  const betEvent = betReceipt.events![0].args!
  const betID = betEvent[0].toNumber()

  await mineBlocks(4)
  const rollTx = await contract.connect(player).roll(betID)
  const rollReceipt = await rollTx.wait()
  const rollEvent = rollReceipt.events![0].args!
  const cap = rollEvent[1] as BigNumber
  const rolled = rollEvent[2] as BigNumber
  const winnings = rollEvent[3] as BigNumber

  if (cap.toNumber() >= rolled.toNumber()) {
    console.log('won bet, bet:', cap.toNumber(), ' rolled', rolled.toNumber())
    return true
  }
  return false
}

const rollTillWin = async (
  riskLevel: number,
  contract: CyberDiceWL,
  player: SignerWithAddress,
) => {
  let won = false
  while (won === false) {
    const wonGame = await betAndRoll(riskLevel, contract, player)
    won = wonGame
  }
}

const BetAndRollTillNumberOfWins = async (
  riskLevel: number,
  contract: CyberDiceWL,
  player: SignerWithAddress,
  numberOfWins: number,
) => {
  let numberOfWinsAccrued = 0

  while (numberOfWinsAccrued < numberOfWins) {
    await rollTillWin(riskLevel, contract, player)
    numberOfWinsAccrued++
  }
}

const checkExpectedPrice = async (
  riskLevel: number,
  timePeriod: number,
  contract: CyberDiceWL,
) => {
  //@ts-ignore
  const timeTax = (await contract.lateTaxes(timePeriod)) as BigNumberish
  const timeTaxNum = Number(ethers.utils.formatEther(timeTax))
  //@ts-ignore
  const riskTax = (await contract.riskTaxes(riskLevel)) as BigNumberish
  const riskTaxNum = Number(ethers.utils.formatEther(riskTax))
  const expectedPrice = (timeTaxNum + riskTaxNum).toFixed(4)
  const price = (await contract.getCurrentPrice(riskLevel)) as BigNumberish
  const priceNum = Number(ethers.utils.formatEther(price)).toFixed(4)

  expect(expectedPrice).to.equal(priceNum)
  return priceNum
}

describe('CyberDiceWL.sol', async () => {
  let contract: CyberDiceWL
  let admin: SignerWithAddress
  let player: SignerWithAddress

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    admin = signers[0]
    player = signers[1]

    const CyberDiceWLFactory = (await ethers.getContractFactory(
      'CyberDiceWL',
      admin,
    )) as CyberDiceWL__factory

    contract = (await CyberDiceWLFactory.deploy(2)) as CyberDiceWL
  })

  it('Get Correct Time Periods', async () => {
    const timePeriod = await contract.getCurrentTimePeriod()
    expect(timePeriod).to.equal(0)
    await nextDay()
    await nextDay()
    const secondDayTimePeriod = await contract.getCurrentTimePeriod()
    expect(secondDayTimePeriod).to.equal(1)
    await nextDay()
    const thirdDayTimePeriod = await contract.getCurrentTimePeriod()
    expect(thirdDayTimePeriod).to.equal(2)
  })

  it('Get Correct Prices', async () => {
    /**
     * @dev early
     */

    await checkExpectedPrice(0, 0, contract)
    await checkExpectedPrice(1, 0, contract)
    await checkExpectedPrice(2, 0, contract)

    /**
     * @dev med time
     */

    await nextDay()
    await nextDay()
    await checkExpectedPrice(0, 1, contract)
    await checkExpectedPrice(1, 1, contract)
    await checkExpectedPrice(2, 1, contract)

    /**
     * @dev late time
     */
    await nextDay()
    await checkExpectedPrice(0, 2, contract)
    await checkExpectedPrice(1, 2, contract)
    await checkExpectedPrice(2, 2, contract)
  })

  it('fails when placing bet with less than price', async () => {
    const price = await checkExpectedPrice(0, 0, contract)
    const smallerThanPriceNum = 0.007
    expect(Number(price) > smallerThanPriceNum).to.be.true

    const smallerThanPriceInWei = ethers.utils.parseEther(smallerThanPriceNum.toString())

    expect(contract.placeBet(0, { value: smallerThanPriceInWei })).to.revertedWith(
      'msg.value LESS THAN BET VALUE',
    )
  })

  it('fails roll if msg.sender was not bet setter', async () => {
    const betPrice = await checkExpectedPrice(0, 0, contract)
    const betPriceInWei = ethers.utils.parseEther(betPrice.toString())
    await contract.connect(player).placeBet(0, { value: betPriceInWei })

    expect(contract.roll(1)).to.revertedWith('ROLLER MUST HAVE SET BET')
  })

  it('roll fails if not 3 blocks since bet', async () => {
    const betPrice = await checkExpectedPrice(0, 0, contract)
    const betPriceInWei = ethers.utils.parseEther(betPrice.toString())
    await contract.connect(player).placeBet(0, { value: betPriceInWei })
    expect(contract.connect(player).roll(1)).to.revertedWith(
      'CANT ROLL BEFORE 3 BLOCKS SINCE BET',
    )
  })

  it('should fail if already out of WL spots', async () => {
    await BetAndRollTillNumberOfWins(0, contract, player, 2)
    expect(rollTillWin(0, contract, player)).to.revertedWith('WL SPOTS ALL WON')
  })

  it('roll should fail if 259 blocks since bet', async () => {
    const betPrice = await checkExpectedPrice(0, 0, contract)
    const betPriceInWei = ethers.utils.parseEther(betPrice.toString())
    await contract.connect(player).placeBet(0, { value: betPriceInWei })
    await mineBlocks(260)
    expect(contract.connect(player).roll(1)).to.revertedWith('TOO LATE')
  })
})
