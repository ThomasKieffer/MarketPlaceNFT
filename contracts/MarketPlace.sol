// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";

/// @title NFT marketplace project
/// @notice  Buy and sell NFTs + other future features.
contract MarketPlace is Ownable, ReentrancyGuard {

    // will allow to transfer fees to the market contract
    // To be implemented
    uint256 private marketplaceFees;

    // Contain info of the NFT supported by the market
    // Can be extended to contain more informations
    struct NFTinfo {
        // IERC721 nft;
        // uint256 nftId;
        uint256 price;
        // bool forSale;
    }

    // Map NFT addresses to nftID and their nft informations
    // IERC721 => [tokenID => NFTinfo] 
    mapping(address => mapping (uint256 => NFTinfo)) public NFTinfos;

    event PutUpForSale( address indexed nft, uint256 nftId, uint price, address indexed nftOwner );
    event WithdrawnFromSale( address indexed nft, uint256 nftId, address indexed nftOwner );
    event Purchased(address indexed nft, uint256 nftId, uint price, address indexed from, address indexed to );

    /// @notice Check if the sender is the owner of the NFT token.
    /// @param nft The NFT collection of the token for which the owner must be verified.
    /// @param nftId The ID of the NFT token for which the owner must be verified.
    modifier onlyNftOwner(IERC721 nft, uint256 nftId) {
        require(nft.ownerOf(nftId) == msg.sender, "You are not the NFT owner");
        _;
    }

    constructor() {}

    /// @notice Allow the owner of a NFT token to put it for sell on the marketplace.
    /// @dev  The owner must set a price to put the NFT for sell.
    /// @param nft The NFT collection of the token to be sold.
    /// @param nftId The Id of the NFT to be sold.
    /// @param newPrice The price of the NFT token to be sold.
    function setPrice(IERC721 nft, uint256 nftId, uint newPrice) external onlyNftOwner(nft, nftId) {
        // require(nft.ownerOf(nftId) == msg.sender, "You are not the owner of this nft");
        require(newPrice > 0, "Price cannot be 0");
        NFTinfos[address(nft)][nftId] = NFTinfo (
            newPrice
        );
        emit PutUpForSale(address(nft), nftId, newPrice, msg.sender);
    }

    /// @notice Allow the owner of a NFT token to remove withdrawn it from sell on the marketplace.
    /// @dev  The token is removed from sell by putting it's price to 0.
    /// @param nft The NFT collection of the token to be withdrawn from sale.
    /// @param nftId The Id of the NFT token to be withdrawn from sale.
    function removePrice(IERC721 nft, uint256 nftId) public onlyNftOwner(nft, nftId) {
        // require(nft.ownerOf(nftId) == msg.sender, "You are not the owner of this nft");
        require(NFTinfos[address(nft)][nftId].price > 0, "Price already at 0");
        NFTinfos[address(nft)][nftId] = NFTinfo (
            0
        );
        emit WithdrawnFromSale(address(nft), nftId, msg.sender);
    }

    /// @notice Allow the purchase of a NFT token on the marketplace.
    /// @dev  Marketplace should be approved before calling this function.
    /// @param nft The NFT collection of the token to be bought.
    /// @param nftId The Id of the NFT token to be bought.
    function buyNft(IERC721 nft, uint256 nftId) external payable nonReentrant{
        require(nft.getApproved(nftId) == address(this), "We cannot sell you this NFT");
        uint256 originalPrice = NFTinfos[address(nft)][nftId].price;
        require( originalPrice > 0, "This NFT is not for sale");
        require( msg.value >=  originalPrice, "Incorrect amount");
        address originalOwner = nft.ownerOf(nftId);

        (bool success, ) = originalOwner.call{value: msg.value}("");
        require(success, "Transfer failed.");

        nft.safeTransferFrom(originalOwner, msg.sender, nftId);
        NFTinfos[address(nft)][nftId].price = 0;
        emit Purchased(address(nft), nftId, originalPrice, originalOwner, msg.sender);
    }

    /// @notice Used by the marketplace owner to retrieve fees and ethers left on the contract.
    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}