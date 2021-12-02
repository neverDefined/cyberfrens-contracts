# cyberfrens-contracts

Using Hardhat Framework for compiling + testing.
Tests written in TS.

#Project
https://cyberfrens.co

# Credits

Contracts Inspired by http://ndl.ethernet.edu.et/bitstream/123456789/67251/1/415.pdf

# Game Design

White-List Dice Roll

-User will make a bet of a number from 0 to n, x. The prediction is that the random dice roll will be underneath the chosen number. The higher x, the lower the reward.

Price:

The Price Depends on the blocks that have elapsed. The earlier the Bet is made the cheaper. f(time) --> price in wei. The counter will start once the first bet is made.

|    Time    | Early OG Tax (contract deployed block=time + x) | Catching Up Tax (prev + x blocks) | Late Comer Tax (prev + x blocks) |
| :--------: | :---------------------------------------------: | :-------------------------------: | :------------------------------: |
| Tax in ETH |                        0                        |              0.0001               |              0.001               |

The Price for a bet is also dependant on the risk ticket that the user wants to buy. The riskier tranches may lead to a higher chance of winning a WL spot. These add a higher price to enter the bet.

| Bet Percentile risk | Low Risk Tranche chance of winning ~30%, winnings 1 WL spot | Med Risk Tranche chance of winning ~10%, winnings 5 WL spot | High Risk Tranche chance of winning ~1%, winnings 10 WL spot |
| :-----------------: | :---------------------------------------------------------: | :---------------------------------------------------------: | :----------------------------------------------------------: |
|     Tax in ETH      |                              0                              |                           0.0001                            |                            0.001                             |
