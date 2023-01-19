// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleNFT is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private tokenIdCounter;
    uint256 public totalSupply;
    string public baseURI;

    constructor(string memory name, string memory symbol, uint256 _totalSupply, string memory baseURI_) ERC721(name, symbol) {
        require(bytes(baseURI_).length > 0, "URI cannot be empty");
        require(_totalSupply > 0, "TotalSupply cannot be empty");
        baseURI = baseURI_;
        totalSupply = _totalSupply;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function safeMint(address to, uint256 _tokenId) public onlyOwner {
        require(tokenIdCounter.current() < totalSupply, "Cannot mint anymore");
        require(_tokenId < totalSupply, "Invalid token id");
        _safeMint(to, _tokenId);
        tokenIdCounter.increment();
    }

    function getCount() public view returns (uint256) {
        return tokenIdCounter.current();
    }

    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}