// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EggNFT is ERC721, Ownable {
        struct EggType {
            uint8 element;
            uint8 rarity;
            string metadata;
        }
        mapping(uint256 => EggType) public eggTypes;
        function addEggType(uint256 typeId, uint8 element, uint8 rarity, string calldata metadata) external onlyOwner {
            eggTypes[typeId] = EggType({
                element: element,
                rarity: rarity,
                metadata: metadata
            });
        }
    uint256 private _nextTokenId;
    mapping(uint8 => uint256) public eggPrices;
    function setEggPrice(uint8 rarity, uint256 price) external onlyOwner {
        eggPrices[rarity] = price;
    }
    address public dragonNFT;
    
    struct Egg {
        uint256 id;
        uint8 element;
        uint8 rarity; // 0: Basic, 1: Rare, 2: Legendary
        uint256 purchaseTime;
        bool hatched;
    }
    
    mapping(uint256 => Egg) public eggs;

    function setDragonNFT(address _dragonNFT) external onlyOwner {
        dragonNFT = _dragonNFT;
    }
    
    event EggPurchased(uint256 indexed tokenId, address indexed buyer, uint8 element, uint8 rarity);
    event EggHatched(uint256 indexed tokenId, address indexed owner);
    
    constructor() ERC721("Dragon City Egg", "EGG") Ownable(msg.sender) {}
    
    function buyEgg() external payable returns (uint256) {
        // Random element and rarity
        uint256 tokenId = _nextTokenId;
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, tokenId, msg.sender)));
        uint8 element = uint8(randomSeed % 6);
        uint8 rarity = uint8((randomSeed >> 8) % 100);
        uint8 rarityTier;
        if (rarity < 60) {
            rarityTier = 0; // Basic 60%
        } else if (rarity < 90) {
            rarityTier = 1; // Rare 30%
        } else {
            rarityTier = 2; // Legendary 10%
        }
        require(msg.value >= eggPrices[rarityTier], "Insufficient payment");
        
        _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        eggs[tokenId] = Egg({
            id: tokenId,
            element: element,
            rarity: rarityTier,
            purchaseTime: block.timestamp,
            hatched: false
        });
        emit EggPurchased(tokenId, msg.sender, element, rarityTier);
        return tokenId;
    }
    
    function hatchEgg(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!eggs[tokenId].hatched, "Already hatched");
        require(block.timestamp >= eggs[tokenId].purchaseTime + 1 hours, "Egg not ready");
        
        eggs[tokenId].hatched = true;
        emit EggHatched(tokenId, msg.sender);
    }
    
    function getEgg(uint256 tokenId) external view returns (Egg memory) {
        return eggs[tokenId];
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
