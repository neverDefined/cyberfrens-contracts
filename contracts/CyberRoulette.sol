// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CyberRoulette {
  enum BetType {
    Color,
    Number
  }

  /**
     @dev choice: interpretation is based on BetType
     BetType.Color: 0=black, 1=red
     BetType.Number: -1=00, 0-36 for individual numbers
     */

  struct Bet {
    address user;
    uint256 amount;
    BetType betType;
    uint256 block;
    int256 choice;
  }

  uint256 public constant NUM_POCKETS = 38;
  // RED_NUMBERS and BLACK_NUMBERS are constant, but
  // Solidity doesn't support array constants yet so
  // we use storage arrays instead
  uint8[18] public RED_NUMBERS = [
    1,
    3,
    5,
    7,
    9,
    12,
    14,
    16,
    18,
    19,
    21,
    23,
    25,
    27,
    30,
    32,
    34,
    36
  ];
  uint8[18] public BLACK_NUMBERS = [
    2,
    4,
    6,
    8,
    10,
    11,
    13,
    15,
    17,
    20,
    22,
    24,
    26,
    28,
    29,
    31,
    33,
    35
  ];
  // maps wheel numbers to colors
  mapping(int256 => int256) public COLORS;
  address public owner;
  uint256 public counter = 0;
  mapping(uint256 => Bet) public bets;

  event BetPlaced(address user, uint256 amount, BetType betType, uint256 block, int256 choice);
  event Spin(uint256 id, int256 landed);

  constructor() {
    owner = msg.sender;
    for (uint256 i = 0; i < 18; i++) {
      uint256 temp = RED_NUMBERS[i];
      int256 _temp;
      _temp = int256(temp);
      COLORS[_temp] = 1;
    }
  }

  function wager(BetType betType, int256 choice) public payable {
    require(msg.value > 0);
    if (betType == BetType.Color) require(choice == 0 || choice == 1);
    else require(choice >= -1 && choice <= 36);
    counter++;
    bets[counter] = Bet(msg.sender, msg.value, betType, block.number + 3, choice);
    emit BetPlaced(msg.sender, msg.value, betType, block.number + 3, choice);
  }

  function spin(uint256 id) public {
    Bet storage bet = bets[id];
    require(msg.sender == bet.user);
    require(block.number >= bet.block);
    require(block.number <= bet.block + 255);
    bytes32 random = keccak256(abi.encodePacked(blockhash(bets[id].block), id));
    int256 landed = int256(uint256(random) % NUM_POCKETS) - 1;

    if (bet.betType == BetType.Color) {
      if (landed > 0 && COLORS[landed] == bet.choice)
        payable(msg.sender).transfer(bet.amount * 2);
    } else if (bet.betType == BetType.Number) {
      if (landed == bet.choice) payable(msg.sender).transfer(bet.amount * 35);
    }
    delete bets[id];
    emit Spin(id, landed);
  }

  function fund() public payable {}

  function kill() public {
    require(msg.sender == owner);
    selfdestruct(payable(owner));
  }
}
