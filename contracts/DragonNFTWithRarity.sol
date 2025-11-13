// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IEggNFT {
    enum Rarity { COMMON, RARE, UNIQUE, LEGENDARY }
    
    function eggs(uint256 tokenId) external view returns (
        Rarity rarity,
        uint256 batchId,
        bool isHatched,
        uint256 mintedAt
    );
    
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

/**
 * @title DragonNFTWithRarity
 * @dev Dragons inherit rarity from eggs, affecting stats and visuals
 * Supports OpenSea/Magic Eden metadata
 */
contract DragonNFTWithRarity is ERC721, Ownable {
    using Strings for uint256;

    enum Element { FIRE, WATER, EARTH, AIR, DARK, LIGHT }
    enum PowerType { PHYSICAL, MAGICAL, HYBRID }
    enum Rarity { COMMON, RARE, UNIQUE, LEGENDARY }

    struct Dragon {
        uint256 id;
        Element element;
        PowerType powerType;
        Rarity rarity; // Inherited from egg
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 level;
        uint256 experience;
        uint256 wins;
        uint256 losses;
        uint256 birthTime;
        uint256 parentEggId; // Track which egg it came from
    }

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    
    IEggNFT public eggNFT;
    address public leaderboardContract;

    // Rarity stat multipliers (basis points, 10000 = 1x)
    mapping(Rarity => uint256) public rarityMultipliers;

    // Dragon data
    mapping(uint256 => Dragon) public dragons;
    mapping(address => uint256[]) public userDragons;
    
    // Events
    event DragonHatched(uint256 indexed dragonId, address indexed owner, Element element, Rarity rarity);
    event DragonLevelUp(uint256 indexed dragonId, uint256 newLevel);
    event BattleResult(uint256 indexed winnerId, uint256 indexed loserId);

    constructor(address _eggNFT) ERC721("Dragon City Dragon", "DRAGON") Ownable(msg.sender) {
        _tokenIdCounter = 1;
        eggNFT = IEggNFT(_eggNFT);
        
        // Set rarity multipliers (basis points)
        rarityMultipliers[Rarity.COMMON] = 10000;    // 1.0x
        rarityMultipliers[Rarity.RARE] = 12500;      // 1.25x
        rarityMultipliers[Rarity.UNIQUE] = 15000;    // 1.5x
        rarityMultipliers[Rarity.LEGENDARY] = 20000; // 2.0x
    }

    // ============ ADMIN FUNCTIONS ============

    function setEggNFT(address _eggNFT) external onlyOwner {
        eggNFT = IEggNFT(_eggNFT);
    }

    function setLeaderboard(address _leaderboard) external onlyOwner {
        leaderboardContract = _leaderboard;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // ============ HATCHING ============

    /**
     * @dev Hatch an egg into a dragon (inherits rarity)
     */
    function hatchEgg(uint256 eggId) external returns (uint256) {
        require(eggNFT.ownerOf(eggId) == msg.sender, "Not egg owner");
        
        // Get egg rarity
        (IEggNFT.Rarity eggRarity, , bool isHatched, ) = eggNFT.eggs(eggId);
        require(!isHatched, "Egg already hatched");
        
        // Generate random element and power type
        Element element = Element(uint256(keccak256(abi.encodePacked(block.timestamp, eggId, msg.sender, "element"))) % 6);
        PowerType powerType = PowerType(uint256(keccak256(abi.encodePacked(block.timestamp, eggId, msg.sender, "power"))) % 3);
        
        // Convert egg rarity to dragon rarity
        Rarity dragonRarity = Rarity(uint8(eggRarity));
        
        // Calculate base stats with rarity multiplier
        uint256 baseAttack = _generateBaseStat(eggId, "attack");
        uint256 baseDefense = _generateBaseStat(eggId, "defense");
        uint256 baseSpeed = _generateBaseStat(eggId, "speed");
        
        uint256 multiplier = rarityMultipliers[dragonRarity];
        
        uint256 dragonId = _tokenIdCounter++;
        
        dragons[dragonId] = Dragon({
            id: dragonId,
            element: element,
            powerType: powerType,
            rarity: dragonRarity,
            attack: (baseAttack * multiplier) / 10000,
            defense: (baseDefense * multiplier) / 10000,
            speed: (baseSpeed * multiplier) / 10000,
            level: 1,
            experience: 0,
            wins: 0,
            losses: 0,
            birthTime: block.timestamp,
            parentEggId: eggId
        });
        
        userDragons[msg.sender].push(dragonId);
        _safeMint(msg.sender, dragonId);
        
        emit DragonHatched(dragonId, msg.sender, element, dragonRarity);
        
        return dragonId;
    }

    function _generateBaseStat(uint256 seed, string memory statName) private view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, seed, statName)));
        return 50 + (random % 51); // 50-100 base
    }

    // ============ BATTLE SYSTEM ============

    function recordBattleResult(uint256 winnerId, uint256 loserId, uint256 expGained) external {
        require(msg.sender == leaderboardContract || msg.sender == owner(), "Not authorized");
        
        dragons[winnerId].wins++;
        dragons[winnerId].experience += expGained;
        dragons[loserId].losses++;
        
        _checkLevelUp(winnerId);
        
        emit BattleResult(winnerId, loserId);
    }

    function _checkLevelUp(uint256 dragonId) private {
        Dragon storage dragon = dragons[dragonId];
        uint256 requiredExp = dragon.level * 100;
        
        while (dragon.experience >= requiredExp) {
            dragon.level++;
            dragon.attack += 5;
            dragon.defense += 5;
            dragon.speed += 3;
            
            emit DragonLevelUp(dragonId, dragon.level);
            requiredExp = dragon.level * 100;
        }
    }

    // ============ BREEDING ============

    function breedDragons(uint256 parent1Id, uint256 parent2Id) external returns (uint256) {
        require(ownerOf(parent1Id) == msg.sender, "Not owner of parent1");
        require(ownerOf(parent2Id) == msg.sender, "Not owner of parent2");
        require(dragons[parent1Id].level >= 4, "Parent1 level too low");
        require(dragons[parent2Id].level >= 4, "Parent2 level too low");
        
        Dragon memory parent1 = dragons[parent1Id];
        Dragon memory parent2 = dragons[parent2Id];
        
        // Child inherits higher rarity
        Rarity childRarity = parent1.rarity > parent2.rarity ? parent1.rarity : parent2.rarity;
        
        // Random element/power from parents
        Element childElement = (uint256(keccak256(abi.encodePacked(block.timestamp, parent1Id))) % 2 == 0) 
            ? parent1.element : parent2.element;
        PowerType childPower = (uint256(keccak256(abi.encodePacked(block.timestamp, parent2Id))) % 2 == 0)
            ? parent1.powerType : parent2.powerType;
        
        // Average stats with rarity boost
        uint256 avgAttack = (parent1.attack + parent2.attack) / 2;
        uint256 avgDefense = (parent1.defense + parent2.defense) / 2;
        uint256 avgSpeed = (parent1.speed + parent2.speed) / 2;
        
        uint256 multiplier = rarityMultipliers[childRarity];
        
        uint256 dragonId = _tokenIdCounter++;
        
        dragons[dragonId] = Dragon({
            id: dragonId,
            element: childElement,
            powerType: childPower,
            rarity: childRarity,
            attack: (avgAttack * multiplier) / 10000,
            defense: (avgDefense * multiplier) / 10000,
            speed: (avgSpeed * multiplier) / 10000,
            level: 1,
            experience: 0,
            wins: 0,
            losses: 0,
            birthTime: block.timestamp,
            parentEggId: 0 // Bred, not hatched
        });
        
        userDragons[msg.sender].push(dragonId);
        _safeMint(msg.sender, dragonId);
        
        emit DragonHatched(dragonId, msg.sender, childElement, childRarity);
        
        return dragonId;
    }

    // ============ VIEW FUNCTIONS ============

    function getDragon(uint256 dragonId) external view returns (Dragon memory) {
        return dragons[dragonId];
    }

    function getUserDragons(address user) external view returns (uint256[] memory) {
        return userDragons[user];
    }

    function getBattlePower(uint256 dragonId) external view returns (uint256) {
        Dragon memory dragon = dragons[dragonId];
        return (dragon.attack + dragon.defense + dragon.speed) * dragon.level;
    }

    // ============ METADATA (OpenSea/Magic Eden Compatible) ============

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token doesn't exist");
        
        if (bytes(_baseTokenURI).length == 0) {
            return _buildDefaultMetadata(tokenId);
        }
        
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function _buildDefaultMetadata(uint256 tokenId) private view returns (string memory) {
        Dragon memory dragon = dragons[tokenId];
        
        string memory elementStr = _elementToString(dragon.element);
        string memory rarityStr = _rarityToString(dragon.rarity);
        string memory powerStr = _powerTypeToString(dragon.powerType);
        
        return string(abi.encodePacked(
            'data:application/json;utf8,{"name":"',
            rarityStr,
            ' ',
            elementStr,
            ' Dragon #',
            tokenId.toString(),
            '","description":"A powerful dragon from Dragon City. Element: ',
            elementStr,
            ', Rarity: ',
            rarityStr,
            '","attributes":[',
            '{"trait_type":"Element","value":"', elementStr, '"},',
            '{"trait_type":"Rarity","value":"', rarityStr, '"},',
            '{"trait_type":"Power Type","value":"', powerStr, '"},',
            '{"trait_type":"Level","value":', dragon.level.toString(), '},',
            '{"trait_type":"Attack","value":', dragon.attack.toString(), '},',
            '{"trait_type":"Defense","value":', dragon.defense.toString(), '},',
            '{"trait_type":"Speed","value":', dragon.speed.toString(), '},',
            '{"trait_type":"Wins","value":', dragon.wins.toString(), '},',
            '{"trait_type":"Losses","value":', dragon.losses.toString(), '}',
            '],"image":"ipfs://QmYourImageHash/',
            rarityStr,
            '_',
            elementStr,
            '.png"}'
        ));
    }

    function _elementToString(Element element) private pure returns (string memory) {
        if (element == Element.FIRE) return "Fire";
        if (element == Element.WATER) return "Water";
        if (element == Element.EARTH) return "Earth";
        if (element == Element.AIR) return "Air";
        if (element == Element.DARK) return "Dark";
        return "Light";
    }

    function _rarityToString(Rarity rarity) private pure returns (string memory) {
        if (rarity == Rarity.LEGENDARY) return "Legendary";
        if (rarity == Rarity.UNIQUE) return "Unique";
        if (rarity == Rarity.RARE) return "Rare";
        return "Common";
    }

    function _powerTypeToString(PowerType powerType) private pure returns (string memory) {
        if (powerType == PowerType.PHYSICAL) return "Physical";
        if (powerType == PowerType.MAGICAL) return "Magical";
        return "Hybrid";
    }
}
