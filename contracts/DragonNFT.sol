// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DragonNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    
    struct Dragon {
        uint256 id;
        string name;
        uint8 element; // 0: Fire, 1: Water, 2: Earth, 3: Air, 4: Dark, 5: Light
        uint8 powerType; // 0: Single Power, 1: Dual Power, 2: Combined Power
        uint16 attack;
        uint16 defense;
        uint16 speed;
        uint8 level;
        uint256 experience;
        uint256 birthTime;
        uint256 parent1;
        uint256 parent2;
        uint256 originChainId; // Chain where dragon was born
        bool isStandby; // For P2P battles
    }
    
    mapping(uint256 => Dragon) public dragons;
    mapping(address => uint256[]) public userDragons;
    
    event DragonHatched(uint256 indexed tokenId, address indexed owner, uint8 element);
    event DragonBred(uint256 indexed newDragonId, uint256 indexed parent1, uint256 indexed parent2);
    event DragonLevelUp(uint256 indexed tokenId, uint8 newLevel);
    event StandbyStatusChanged(uint256 indexed tokenId, bool isStandby);
    
    constructor() ERC721("Dragon City Dragon", "DRAGON") Ownable(msg.sender) {}
    
    function hatchEgg(address to, uint8 element) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        // Random stats and power type based on element
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, tokenId, to)));
        
        // Determine power type: 60% single, 30% dual, 10% combined
        uint8 powerRoll = uint8((randomSeed >> 24) % 100);
        uint8 powerType;
        if (powerRoll < 60) {
            powerType = 0; // Single Power
        } else if (powerRoll < 90) {
            powerType = 1; // Dual Power
        } else {
            powerType = 2; // Combined Power
        }
        
        // Stats influenced by power type
        uint16 baseStat = powerType == 2 ? 70 : powerType == 1 ? 60 : 50;
        
        dragons[tokenId] = Dragon({
            id: tokenId,
            name: string(abi.encodePacked("Dragon #", toString(tokenId))),
            element: element,
            powerType: powerType,
            attack: baseStat + uint16((randomSeed % 50)),
            defense: baseStat + uint16(((randomSeed >> 8) % 50)),
            speed: baseStat + uint16(((randomSeed >> 16) % 50)),
            level: 1,
            experience: 0,
            birthTime: block.timestamp,
            parent1: 0,
            parent2: 0,
            originChainId: block.chainid,
            isStandby: false
        });
        
        userDragons[to].push(tokenId);
        emit DragonHatched(tokenId, to, element);
        
        return tokenId;
    }
    
    function breedDragons(uint256 parent1Id, uint256 parent2Id) external returns (uint256) {
        require(ownerOf(parent1Id) == msg.sender, "Not owner of parent1");
        require(ownerOf(parent2Id) == msg.sender, "Not owner of parent2");
        require(parent1Id != parent2Id, "Cannot breed same dragon");
        require(dragons[parent1Id].level >= 4, "Parent1 level too low");
        require(dragons[parent2Id].level >= 4, "Parent2 level too low");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        Dragon memory parent1 = dragons[parent1Id];
        Dragon memory parent2 = dragons[parent2Id];
        
        // Cross-chain breeding: combine elements from different chains
        uint8 childElement = uint8(uint256(keccak256(abi.encodePacked(parent1.element, parent2.element, block.timestamp))) % 6);
        
        // Power inheritance: combined power has higher chance if either parent has it
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, tokenId, msg.sender)));
        uint8 powerType;
        
        if (parent1.powerType == 2 || parent2.powerType == 2) {
            // If either parent is combined power, 40% chance for combined, 40% dual, 20% single
            uint8 powerRoll = uint8((randomSeed >> 24) % 100);
            if (powerRoll < 40) {
                powerType = 2; // Combined
            } else if (powerRoll < 80) {
                powerType = 1; // Dual
            } else {
                powerType = 0; // Single
            }
        } else if (parent1.powerType == 1 || parent2.powerType == 1) {
            // If either parent is dual power, 20% combined, 50% dual, 30% single
            uint8 powerRoll = uint8((randomSeed >> 24) % 100);
            if (powerRoll < 20) {
                powerType = 2;
            } else if (powerRoll < 70) {
                powerType = 1;
            } else {
                powerType = 0;
            }
        } else {
            // Both parents single power: 5% combined, 30% dual, 65% single
            uint8 powerRoll = uint8((randomSeed >> 24) % 100);
            if (powerRoll < 5) {
                powerType = 2;
            } else if (powerRoll < 35) {
                powerType = 1;
            } else {
                powerType = 0;
            }
        }
        
        // Inherit stats with some randomness and power type bonus
        uint16 baseBonus = powerType == 2 ? 30 : powerType == 1 ? 15 : 0;
        
        dragons[tokenId] = Dragon({
            id: tokenId,
            name: string(abi.encodePacked("Dragon #", toString(tokenId))),
            element: childElement,
            powerType: powerType,
            attack: uint16((parent1.attack + parent2.attack) / 2 + (randomSeed % 20) + baseBonus),
            defense: uint16((parent1.defense + parent2.defense) / 2 + ((randomSeed >> 8) % 20) + baseBonus),
            speed: uint16((parent1.speed + parent2.speed) / 2 + ((randomSeed >> 16) % 20) + baseBonus),
            level: 1,
            experience: 0,
            birthTime: block.timestamp,
            parent1: parent1Id,
            parent2: parent2Id,
            originChainId: block.chainid, // Born on current chain
            isStandby: false
        });
        
        userDragons[msg.sender].push(tokenId);
        emit DragonBred(tokenId, parent1Id, parent2Id);
        
        return tokenId;
    }
    
    function setStandbyStatus(uint256 tokenId, bool status) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        dragons[tokenId].isStandby = status;
        emit StandbyStatusChanged(tokenId, status);
    }
    
    function addExperience(uint256 tokenId, uint256 exp) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        dragons[tokenId].experience += exp;
        
        // Level up logic
        uint256 expNeeded = dragons[tokenId].level * 100;
        if (dragons[tokenId].experience >= expNeeded && dragons[tokenId].level < 50) {
            dragons[tokenId].level++;
            dragons[tokenId].attack += 5;
            dragons[tokenId].defense += 5;
            dragons[tokenId].speed += 3;
            emit DragonLevelUp(tokenId, dragons[tokenId].level);
        }
    }
    
    function getDragon(uint256 tokenId) external view returns (Dragon memory) {
        return dragons[tokenId];
    }
    
    function getUserDragons(address user) external view returns (uint256[] memory) {
        return userDragons[user];
    }
    
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
