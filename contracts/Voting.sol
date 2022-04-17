// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
  address public owner;

  constructor()  {
    owner = msg.sender;
  }

  modifier requireOwner() {
    require(owner == msg.sender, "No access");
    _;
  }
}
