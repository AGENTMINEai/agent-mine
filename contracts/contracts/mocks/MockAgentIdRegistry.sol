// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Test-only stand-in for Binance's SPACE ID Agent ID registry.
contract MockAgentIdRegistry {
    mapping(address => uint256) public balanceOf;

    function mint(address to) external {
        balanceOf[to] = 1;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] = amount;
    }

    function burn(address from) external {
        balanceOf[from] = 0;
    }
}
