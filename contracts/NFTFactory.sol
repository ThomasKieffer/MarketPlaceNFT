// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./SimpleNFT.sol";

contract NFTFactory {
    using Counters for Counters.Counter;

    Counters.Counter private _collectionCount;
    mapping (uint => address) public collections;

    event CollectionDeployed(string name, uint collectionId, address indexed tokenAddress);

    constructor() {}
    

    function deployToken(string calldata name, string calldata symbol, uint256 totalSupply, string calldata baseURI) public {
        SimpleNFT collection = new SimpleNFT(name, symbol, totalSupply, baseURI);
        SimpleNFT(collection).transferOwnership(msg.sender);
        uint collectionId = _collectionCount.current();
        collections[collectionId] = address(collection);
        _collectionCount.increment();

        emit CollectionDeployed(name, collectionId, address(collection));
    }

    function getCount() public view returns (uint256) {
        return _collectionCount.current();
    }
    
}

        // //old
        // bytes memory bytecode = type(SimpleNFT).creationCode;
        // bytes memory collectionByteCode = abi.encodePacked(bytecode, abi.encode(name, symbol, totalSupply, baseURI));
        // bytes32 salt = keccak256(abi.encodePacked(name, symbol, totalSupply, baseURI));
        // assembly {
        //     collectionAddress := create2(0, add(collectionByteCode, 0x20), mload(collectionByteCode), salt)

        //     if iszero(extcodesize(collectionAddress)) {
        //         revert(0, 0)
        //     }
        // }