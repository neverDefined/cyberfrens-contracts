# cyberfrens-contracts

Using Hardhat Framework for compiling + testing.
Tests written in TS in node env.

#Project
https://cyberfrens.co

# Credits

Contracts Inspired by http://ndl.ethernet.edu.et/bitstream/123456789/67251/1/415.pdf

# Game Design

White-List Dice Roll

-User will make a bet of a number from 0 to n, x. The prediction is that the random dice roll will be underneath the chosen number. The higher x, the lower the reward.

Price: \*\* using arbitrary prices in ETH (no calculations made yet on risk/reward)

The Price Depends on the blocks that have elapsed. The earlier the Bet is made the cheaper. f(time) --> price in wei. The counter will start once the first bet is made.

|    Time    | Early OG Tax (contract deployed block-number + x) | Catching Up Tax (prev + x blocks) | Late Comer Tax (prev + x blocks) |
| :--------: | :-----------------------------------------------: | :-------------------------------: | :------------------------------: |
| Tax in ETH |                         0                         |               0.002               |              0.004               |

The Price for a bet is also dependant on the risk ticket that the user wants to buy. The riskier bets may lead to winning WL spots for a smaller fee, but if won lead to a larger payout.

| Bet Percentile risk | Low Risk Tranche chance of winning ~30%, winnings 1 WL spot | Med Risk Tranche chance of winning ~10%, winnings 5 WL spot | High Risk Tranche chance of winning ~1%, winnings 10 WL spot |
| :-----------------: | :---------------------------------------------------------: | :---------------------------------------------------------: | :----------------------------------------------------------: |
|     Tax in ETH      |                            0.008                            |                            0.005                            |                            0.001                             |

Price(blockNumber, numberOfBetters) ----> OG Tax + Risk Tranche Tax
RiskReward (unit-chance-of-win WL spot / ETH) ---> (PotentialWLSpots \* Chance of Winning) / Price of Bet

# Why need a fee to play the game

There needs to be a bit of sacrifice for betters or a bot could make a million bets. The fees can be used to bootstrap the DAO, finance development or given back to token holders.

# Utility

The basic utility of the game is to foster a community around a collection by already having interactions to the art via the artist created casino, and also reward early supporters of the project. The nfts that will be minted via this game should also maybe get special perks, that the outside world knows these are degens.
