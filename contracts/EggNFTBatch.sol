// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title EggNFTBatch
 * @dev Batch mint 1000 eggs with rarity tiers for Dragon City game
 * Supports installment payments (3 payments over 72 hours)
 * OpenSea/Magic Eden compatible metadata
 */
contract EggNFTBatch is ERC721, Ownable {
    using Strings for uint256;

    // Rarity tiers
    enum Rarity { COMMON, RARE, UNIQUE, LEGENDARY }
    
    struct Egg {
        Rarity rarity;
        uint256 batchId;
        bool isHatched;
        uint256 mintedAt;
    }

    struct InstallmentPlan {
        address buyer;
        uint256 eggId;
        uint256 totalPrice;
        uint256 paidAmount;
        uint256 installmentsPaid; // 0, 1, 2, or 3 (complete)
        uint256 lastPaymentTime;
        bool isComplete;
        bool isActive;
    }

    // Constants
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant LEGENDARY_COUNT = 25;
    uint256 public constant UNIQUE_COUNT = 35;
    uint256 public constant RARE_COUNT = 45;
    uint256 public constant COMMON_COUNT = 895;
    
    uint256 public constant INSTALLMENT_COUNT = 3;
    uint256 public constant PAYMENT_INTERVAL = 24 hours;
    
    // Pricing (in wei)
    uint256 public constant LEGENDARY_PRICE = 0.5 ether;
    uint256 public constant UNIQUE_PRICE = 0.3 ether;
    uint256 public constant RARE_PRICE = 0.15 ether;
    uint256 public constant COMMON_PRICE = 0.05 ether;

    // State
    uint256 private _tokenIdCounter;
    uint256 public legendaryMinted;
    uint256 public uniqueMinted;
    uint256 public rareMinted;
    uint256 public commonMinted;
    
    bool public isFirstSaleActive = true; // Priority sale for Rare+ eggs
    uint256 public firstSaleEndTime;
    
    string private _baseTokenURI;
    address public dragonNFTContract;

    // Mappings
    mapping(uint256 => Egg) public eggs;
    mapping(uint256 => InstallmentPlan) public installmentPlans;
    mapping(address => uint256[]) public userInstallments;
    
    // Events
    event EggMinted(address indexed buyer, uint256 indexed tokenId, Rarity rarity, bool isInstallment);
    event InstallmentPayment(address indexed buyer, uint256 indexed eggId, uint256 payment, uint256 installmentNumber);
    event InstallmentCompleted(address indexed buyer, uint256 indexed eggId);
    event EggHatched(uint256 indexed tokenId, address indexed owner);
    event FirstSaleEnded();

    constructor() ERC721("Dragon Egg", "DREGG") Ownable(msg.sender) {
        _tokenIdCounter = 1;
        firstSaleEndTime = block.timestamp + 7 days; // 1 week first sale
    }

    // ============ ADMIN FUNCTIONS ============

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setDragonContract(address _dragonContract) external onlyOwner {
        dragonNFTContract = _dragonContract;
    }

    function endFirstSale() external onlyOwner {
        isFirstSaleActive = false;
        emit FirstSaleEnded();
    }

    // ============ MINTING FUNCTIONS ============

    /**
     * @dev Direct purchase - full payment
     */
    function mintEgg(Rarity _rarity) external payable {
        require(_tokenIdCounter <= MAX_SUPPLY, "All eggs minted");
        require(msg.value == getPriceForRarity(_rarity), "Incorrect payment");
        
        if (isFirstSaleActive) {
            require(_rarity != Rarity.COMMON, "First sale: Rare+ only");
        }
        
        _mintEggInternal(msg.sender, _rarity, false);
    }

    /**
     * @dev Start installment plan - first payment
     */
    function mintEggWithInstallment(Rarity _rarity) external payable {
        require(_tokenIdCounter <= MAX_SUPPLY, "All eggs minted");
        
        uint256 totalPrice = getPriceForRarity(_rarity);
        uint256 installmentAmount = totalPrice / INSTALLMENT_COUNT;
        
        require(msg.value == installmentAmount, "Incorrect first payment");
        
        if (isFirstSaleActive) {
            require(_rarity != Rarity.COMMON, "First sale: Rare+ only");
        }
        
        uint256 tokenId = _mintEggInternal(msg.sender, _rarity, true);
        
        // Create installment plan
        installmentPlans[tokenId] = InstallmentPlan({
            buyer: msg.sender,
            eggId: tokenId,
            totalPrice: totalPrice,
            paidAmount: installmentAmount,
            installmentsPaid: 1,
            lastPaymentTime: block.timestamp,
            isComplete: false,
            isActive: true
        });
        
        userInstallments[msg.sender].push(tokenId);
        
        emit InstallmentPayment(msg.sender, tokenId, installmentAmount, 1);
    }

    /**
     * @dev Make installment payment
     */
    function payInstallment(uint256 tokenId) external payable {
        InstallmentPlan storage plan = installmentPlans[tokenId];
        
        require(plan.isActive, "No active plan");
        require(plan.buyer == msg.sender, "Not your plan");
        require(!plan.isComplete, "Already complete");
        require(plan.installmentsPaid < INSTALLMENT_COUNT, "All paid");
        require(
            block.timestamp >= plan.lastPaymentTime + PAYMENT_INTERVAL,
            "Too early for next payment"
        );
        
        uint256 installmentAmount = plan.totalPrice / INSTALLMENT_COUNT;
        require(msg.value == installmentAmount, "Incorrect payment");
        
        plan.paidAmount += installmentAmount;
        plan.installmentsPaid += 1;
        plan.lastPaymentTime = block.timestamp;
        
        emit InstallmentPayment(msg.sender, tokenId, installmentAmount, plan.installmentsPaid);
        
        if (plan.installmentsPaid == INSTALLMENT_COUNT) {
            plan.isComplete = true;
            emit InstallmentCompleted(msg.sender, tokenId);
        }
    }

    /**
     * @dev Batch mint for owner (airdrops, rewards)
     */
    function batchMint(address[] memory recipients, Rarity[] memory rarities) external onlyOwner {
        require(recipients.length == rarities.length, "Length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
            _mintEggInternal(recipients[i], rarities[i], false);
        }
    }

    /**
     * @dev Gacha/Raffle - random common egg
     */
    function mintGachaEgg() external payable {
        require(!isFirstSaleActive, "First sale active");
        require(msg.value == COMMON_PRICE, "Incorrect payment");
        require(commonMinted < COMMON_COUNT, "No common eggs left");
        
        _mintEggInternal(msg.sender, Rarity.COMMON, false);
    }

    // ============ HATCHING ============

    function hatchEgg(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not egg owner");
        require(!eggs[tokenId].isHatched, "Already hatched");
        
        // Check installment is complete if applicable
        InstallmentPlan memory plan = installmentPlans[tokenId];
        if (plan.isActive) {
            require(plan.isComplete, "Complete payments first");
        }
        
        eggs[tokenId].isHatched = true;
        
        emit EggHatched(tokenId, msg.sender);
    }

    // ============ INTERNAL ============

    function _mintEggInternal(address to, Rarity rarity, bool isInstallment) private returns (uint256) {
        require(_canMintRarity(rarity), "Rarity limit reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _incrementRarityCount(rarity);
        
        eggs[tokenId] = Egg({
            rarity: rarity,
            batchId: 1, // First batch
            isHatched: false,
            mintedAt: block.timestamp
        });
        
        _safeMint(to, tokenId);
        
        emit EggMinted(to, tokenId, rarity, isInstallment);
        
        return tokenId;
    }

    function _canMintRarity(Rarity rarity) private view returns (bool) {
        if (rarity == Rarity.LEGENDARY) return legendaryMinted < LEGENDARY_COUNT;
        if (rarity == Rarity.UNIQUE) return uniqueMinted < UNIQUE_COUNT;
        if (rarity == Rarity.RARE) return rareMinted < RARE_COUNT;
        return commonMinted < COMMON_COUNT;
    }

    function _incrementRarityCount(Rarity rarity) private {
        if (rarity == Rarity.LEGENDARY) legendaryMinted++;
        else if (rarity == Rarity.UNIQUE) uniqueMinted++;
        else if (rarity == Rarity.RARE) rareMinted++;
        else commonMinted++;
    }

    // ============ VIEW FUNCTIONS ============

    function getPriceForRarity(Rarity rarity) public pure returns (uint256) {
        if (rarity == Rarity.LEGENDARY) return LEGENDARY_PRICE;
        if (rarity == Rarity.UNIQUE) return UNIQUE_PRICE;
        if (rarity == Rarity.RARE) return RARE_PRICE;
        return COMMON_PRICE;
    }

    function getInstallmentAmount(Rarity rarity) public pure returns (uint256) {
        return getPriceForRarity(rarity) / INSTALLMENT_COUNT;
    }

    function getEgg(uint256 tokenId) external view returns (Egg memory) {
        return eggs[tokenId];
    }

    function getUserInstallments(address user) external view returns (uint256[] memory) {
        return userInstallments[user];
    }

    function getInstallmentStatus(uint256 tokenId) external view returns (
        uint256 paidAmount,
        uint256 remainingAmount,
        uint256 nextPaymentDue,
        bool isComplete
    ) {
        InstallmentPlan memory plan = installmentPlans[tokenId];
        
        paidAmount = plan.paidAmount;
        remainingAmount = plan.totalPrice - plan.paidAmount;
        nextPaymentDue = plan.lastPaymentTime + PAYMENT_INTERVAL;
        isComplete = plan.isComplete;
    }

    function getRaritySupply() external view returns (
        uint256 legendary,
        uint256 unique,
        uint256 rare,
        uint256 common
    ) {
        legendary = legendaryMinted;
        unique = uniqueMinted;
        rare = rareMinted;
        common = commonMinted;
    }

    // ============ METADATA (OpenSea Compatible) ============

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token doesn't exist");
        
        if (bytes(_baseTokenURI).length == 0) {
            return _buildDefaultMetadata(tokenId);
        }
        
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function _buildDefaultMetadata(uint256 tokenId) private view returns (string memory) {
        Egg memory egg = eggs[tokenId];
        string memory rarityStr = _rarityToString(egg.rarity);
        
        // OpenSea-compatible JSON
        return string(abi.encodePacked(
            'data:application/json;utf8,{"name":"Dragon Egg #',
            tokenId.toString(),
            '","description":"A mystical dragon egg from Dragon City. Rarity: ',
            rarityStr,
            '","attributes":[{"trait_type":"Rarity","value":"',
            rarityStr,
            '"},{"trait_type":"Status","value":"',
            egg.isHatched ? "Hatched" : "Unhatched",
            '"},{"trait_type":"Batch","value":',
            egg.batchId.toString(),
            '}],"image":"ipfs://QmYourImageHash/',
            rarityStr,
            '.png"}'
        ));
    }

    function _rarityToString(Rarity rarity) private pure returns (string memory) {
        if (rarity == Rarity.LEGENDARY) return "Legendary";
        if (rarity == Rarity.UNIQUE) return "Unique";
        if (rarity == Rarity.RARE) return "Rare";
        return "Common";
    }

    // ============ WITHDRAWAL ============

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner()).transfer(balance);
    }
}
