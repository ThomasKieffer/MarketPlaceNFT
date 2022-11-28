// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleNFT is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("MyToken", "MTK") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function getCount() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}


// pragma solidity 0.8.14;

// import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";
// import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";


// contract TestNFT is ERC721, Ownable, ReentrancyGuard{
//     uint256 private _tokenIDs;
//     uint256 priceMin;
//     uint256 totalSup;
//     mapping (address => bool) hasNFT;
//     constructor() ERC721("ChienChat", "CC") {}

//     function setPrice(uint256 _price) public onlyOwner {
//         priceMin = _price;
//     }

//     function totalSupply() public onlyOwner view returns(uint256) {
//         return totalSup;
//     }

//     function mint(uint256 _quantity) public payable returns (uint256) {
//         require(msg.value >= priceMin, "Not the correct amount.");
//         require(hasNFT[msg.sender]==false, "You already own a NFT.");
//         require(totalSupply() + _quantity <= 30, "Max supply exceeded");
        
//         hasNFT[msg.sender] = true;
//         _tokenIDs += 1;
//         _mint(msg.sender, _tokenIDs);
//         return _tokenIDs;
//     }

//     function tokenURI(uint256 _tokenID) override public pure returns(string memory) {
//         return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/QmRB7QtR3ausdsk6Ln3B5FsPD463r9RrTzAF2cUB64DDw9/", Strings.toString(_tokenID), ".json"));
//     }

//     function withdrawMoney() external onlyOwner nonReentrant {
//         (bool success, ) = msg.sender.call{value: address(this).balance}("");
//         require(success, "Transfer failed.");
//     }
// }