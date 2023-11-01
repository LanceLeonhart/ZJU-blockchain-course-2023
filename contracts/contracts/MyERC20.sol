// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {
    mapping(address => bool) claimedAirdropPlayerList;

    constructor() ERC20("my_token", "MTK") {

    }

    function airdrop() external {
        require(claimedAirdropPlayerList[msg.sender] == false, "This user has claimed airdrop already");
        _mint(msg.sender, 1000);
        claimedAirdropPlayerList[msg.sender] = true;
    }
}
