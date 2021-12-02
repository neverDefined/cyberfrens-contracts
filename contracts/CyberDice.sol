// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CyberDice {
  struct Bet {
    address user;
    uint256 block;
    uint256 cap;
    uint256 amount;
  }

  uint256 public constant FEE_NUMERATOR = 1;
  uint256 public constant FEE_DENOMINATOR = 100;
  uint256 public constant MAXIMUM_CAP = 100000;
  uint256 public constant MAXIMUM_BET_SIZE = 1e18;
  address public owner;
  uint256 public counter = 0;
  mapping(uint256 => Bet) public bets;

  event BetPlaced(uint256 _id, address _user, uint256 _cap, uint256 _amount);
  event Roll(uint256 _id, uint256 _rolled);

  constructor() {
    owner = msg.sender;
  }

  function wager(uint256 cap) public payable {
    require(cap <= MAXIMUM_CAP, 'Exeeds MAXIMUM_CAP');
    require(msg.value <= MAXIMUM_BET_SIZE);
    counter++;
    bets[counter] = Bet(msg.sender, block.number + 3, cap, msg.value);
    emit BetPlaced(counter, msg.sender, cap, msg.value);
  }

  function roll(uint256 id) public {
    require(msg.sender == bets[id].user, 'Roller Must have set Bet');
    require(block.number >= bets[id].block, 'Cant Roll Before 3 Block Wait');
    require(block.number <= bets[id].block + 255, 'Too Late');

    bytes32 random = keccak256(abi.encodePacked(blockhash(bets[id].block), id));
    uint256 rolled = uint256(random) % MAXIMUM_CAP;

    if (rolled < bets[id].cap) {
      uint256 payout = (bets[id].amount * MAXIMUM_CAP) / bets[id].cap;
      uint256 fee = (payout * FEE_NUMERATOR) / FEE_DENOMINATOR;
      payout -= fee;
      payable(msg.sender).transfer(payout);
      emit Roll(id, rolled);
      delete bets[id];
    }
  }

  function fund() public payable {}

  function kill() public {
    require(msg.sender == owner);
    selfdestruct(payable(owner));
  }
}
