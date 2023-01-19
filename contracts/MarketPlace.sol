// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./NFTFactory.sol";
import "./SimpleNFT.sol";

// import "hardhat/console.sol";

// import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";

/// @title NFT marketplace project
/// @notice  Buy and sell NFTs + other future features.
contract MarketPlace is Ownable, ReentrancyGuard {

    // will allow to transfer fees to the market contract
    uint8 private _marketplaceFees;

    NFTFactory nftFactory;

    // Contain info of the NFT supported by the market
    // Can be extended to contain more informations
    struct NFTinfo {
        // IERC721 nft;
        // uint256 nftId;
        uint256 price;
        // bool forSale;
    }
    
    struct CollectionInfo {
        address creator;
        uint256 fees;
        uint price;
        bool forSale;
    }

    // Map NFT addresses to nftID and their nft informations
    // IERC721 => [tokenID => NFTinfo]
    //TODO: consider adding arrays for addresses for lookup
    mapping(address => mapping (uint256 => NFTinfo)) public NFTinfos;
    mapping(address => CollectionInfo) public CollectionInfos;

    event PutUpForSale( address indexed nft, uint256 nftId, uint price, address indexed nftOwner );
    event WithdrawnFromSale( address indexed nft, uint256 nftId, address indexed nftOwner );
    event Purchased(address indexed nft, uint256 nftId, uint price, address indexed from, address indexed to );

    /// @notice Check if the sender is the owner of the NFT token.
    /// @param nftAddress The NFT collection of the token for which the owner must be verified.
    /// @param nftId The ID of the NFT token for which the owner must be verified.
    modifier onlyNftOwner(address nftAddress, uint256 nftId) {
        require(IERC721(nftAddress).ownerOf(nftId) == msg.sender, "You are not the NFT owner");
        _;
    }

    /// @notice Check if the sender is the creator of the NFT collection.
    /// @param nftAddress The NFT collection of the token for which the creator must be verified.
    modifier onlyCreator(address nftAddress) {
        require(CollectionInfos[nftAddress].creator == msg.sender, "You are not the creator of this collection");
        _;
    }

    constructor(uint8 marketFees ) {
        _marketplaceFees = marketFees;
        nftFactory = new NFTFactory();
    }

    function createCollection(string calldata name, string calldata symbol, uint256 totalSupply, string calldata baseURI) external {
        nftFactory.deployToken(name, symbol, totalSupply, baseURI);
        address addrCollectionCreated = nftFactory.collections(nftFactory.getCount() - 1);

        CollectionInfos[addrCollectionCreated] = CollectionInfo(
            msg.sender,
            0,
            0,
            false
        );
        SimpleNFT(addrCollectionCreated).transferOwnership(msg.sender);
    }

    function getCollection(uint collectionId) external view returns (address) {
        return nftFactory.collections(collectionId);
    }

    function setCollectionPrice(address collectionAddress, uint newPrice) public onlyCreator(collectionAddress) {
        CollectionInfos[collectionAddress].price = newPrice;
    }

    function putCollectionForSale(address collectionAddress) public onlyCreator(collectionAddress) {
        require(CollectionInfos[collectionAddress].forSale == true, "Collection already for sale");
        CollectionInfos[collectionAddress].forSale = true;
    }

    /// @notice Allow the owner of a NFT token to put it for sell on the marketplace.
    /// @dev  The owner must set a price to put the NFT for sell.
    /// @param nftAddress The NFT collection of the token to be sold.
    /// @param nftId The Id of the NFT to be sold.
    /// @param newPrice The price of the NFT token to be sold.
    function setPrice(address nftAddress, uint256 nftId, uint newPrice) public onlyNftOwner(nftAddress, nftId) {
        require(newPrice > 0, "Price cannot be 0");
        NFTinfos[nftAddress][nftId] = NFTinfo(
            newPrice
        );
        emit PutUpForSale(nftAddress, nftId, newPrice, msg.sender);
    }

    /// @notice Allow the owner of a NFT token to remove withdrawn it from sell on the marketplace.
    /// @dev  The token is removed from sell by putting it's price to 0.
    /// @param nftAddress The NFT collection of the token to be withdrawn from sale.
    /// @param nftId The Id of the NFT token to be withdrawn from sale.
    function removePrice(address nftAddress, uint256 nftId) external onlyNftOwner(nftAddress, nftId) {
        require(NFTinfos[nftAddress][nftId].price > 0, "Price already at 0");
        NFTinfos[nftAddress][nftId] = NFTinfo (
            0
        );
        emit WithdrawnFromSale(nftAddress, nftId, msg.sender);
    }

    /// @notice Allow the purchase of a NFT token on the marketplace.
    /// @dev  Marketplace should be approved before calling this function.
    /// @param nftAddress The NFT collection of the token to be bought.
    /// @param nftId The Id of the NFT token to be bought.
    //Todo: check if nft id exist
    function buyNft(address nftAddress, uint256 nftId) external payable nonReentrant{
        require(IERC721(nftAddress).getApproved(nftId) == address(this), "We cannot sell you this NFT");
        uint256 originalPrice = NFTinfos[nftAddress][nftId].price;
        require( originalPrice > 0, "This NFT is not for sale");
        require( msg.value >=  originalPrice, "Incorrect amount");
        address originalOwner = IERC721(nftAddress).ownerOf(nftId);

        uint256 fees = (msg.value * _marketplaceFees)/100;
        
        //transfert the rest to the original owner
        (bool success2, ) = originalOwner.call{value: msg.value-fees}("");
        require(success2, "Transfer failed.");

        IERC721(nftAddress).safeTransferFrom(originalOwner, msg.sender, nftId);
        NFTinfos[nftAddress][nftId].price = 0;
        emit Purchased(nftAddress, nftId, originalPrice, originalOwner, msg.sender);
    }

    /// @notice Used by the marketplace owner to retrieve fees and ethers left on the contract.
    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}