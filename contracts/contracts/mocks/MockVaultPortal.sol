// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IFlapMiningVaultFactory {
    function newVault(
        address taxToken,
        address quoteToken,
        address creator,
        bytes calldata vaultData
    ) external returns (address);
}

/// @notice Test-only stand-in for FLAP's VaultPortal.
contract MockVaultPortal {
    function createVault(
        address factory,
        address taxToken,
        address creator,
        bytes calldata vaultData
    ) external returns (address) {
        return IFlapMiningVaultFactory(factory).newVault(taxToken, address(0), creator, vaultData);
    }
}
