// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DragonCityNFT
 * @dev Full Dragon City implementation:
 * - Training & Evolution system
 * - Stat-based progression
 * - User-created dragons via evolution
 * - Marketplace with installment payments
 * - Tokenomics via training fees
 */
contract DragonCityNFT is ERC721, Ownable, ReentrancyGuard {
    
    // ============ ENUMS ============
    
    enum Element { FIRE, WATER, EARTH, AIR, DARK, LIGHT, NATURE, METAL, ICE, ELECTRIC }
    enum Rarity { COMMON, RARE, EPIC, LEGENDARY, MYTHIC }
    enum DragonForm { BASIC, EVOLVED1, EVOLVED2, ULTIMATE }
    
    // ============ STRUCTS ============
    
    struct Dragon {
        uint256 id;
        string name; // User can name their dragon
        Element primary;
        Element secondary; // Dual elements like real Dragon City
        Rarity rarity;
        DragonForm form;
        
        // Stats (increase with training)
        uint256 attack;
        uint256 defense;
        uint256 health;
        uint256 speed;
        
        // Progression
        uint256 level;
        uint256 experience;
        uint256 trainingCount;
        
        // Battle records
        uint256 wins;
        uint256 losses;
        
        // Metadata
        uint256 birthTime;
        uint256 lastTrainingTime;
        uint256 parentId1;
        uint256 parentId2;
        bool isEvolved;
    }
    
    struct TrainingSession {
        uint256 dragonId;
        uint256 startTime;
        uint256 duration; // Training takes time
        uint256 feePaid;
        string statToTrain; // "attack", "defense", "health", "speed"
        bool completed;
    }
    
    struct MarketListing {
        uint256 dragonId;
        address seller;
        uint256 price;
        bool acceptsInstallments;
        bool active;
        uint256 listedAt;
    }
    
    struct InstallmentPlan {
        uint256 listingId;
        address buyer;
        uint256 totalPrice;
        uint256 paidAmount;
        uint256 installmentsPaid; // 0, 1, 2, 3
        uint256 lastPaymentTime;
        bool completed;
    }
    
    // ============ STATE VARIABLES ============
    
    uint256 private _tokenIdCounter = 1;
    uint256 private _listingIdCounter = 1;
    
    // Training costs (in wei or token)
    uint256 public baseTrainingFee = 0.001 ether;
    uint256 public evolutionFee = 0.01 ether;
    
    // Training duration
    uint256 public constant TRAINING_DURATION = 1 hours;
    uint256 public constant EVOLUTION_DURATION = 24 hours;
    
    // Marketplace
    uint256 public constant MARKETPLACE_FEE = 250; // 2.5%
    uint256 public constant INSTALLMENT_COUNT = 3;
    uint256 public constant PAYMENT_INTERVAL = 24 hours;
    
    // Token for training fees (optional, can use ETH)
    IERC20 public gameToken;
    bool public useTokenForFees;
    
    // Mappings
    mapping(uint256 => Dragon) public dragons;
    mapping(address => uint256[]) public userDragons;
    mapping(uint256 => TrainingSession) public activeSessions;
    mapping(uint256 => MarketListing) public listings;
    mapping(uint256 => InstallmentPlan) public installmentPlans;
    mapping(address => uint256[]) public userListings;
    
    uint256[] public activeListingIds;
    
    // Evolution requirements
    mapping(Rarity => uint256) public evolutionLevelRequired;
    
    // ============ EVENTS ============
    
    event DragonBorn(uint256 indexed dragonId, address indexed owner, Element primary, Element secondary);
    event DragonNamed(uint256 indexed dragonId, string name);
    event TrainingStarted(uint256 indexed dragonId, string stat, uint256 duration);
    event TrainingCompleted(uint256 indexed dragonId, string stat, uint256 improvement);
    event DragonEvolved(uint256 indexed dragonId, DragonForm newForm);
    event DragonListed(uint256 indexed listingId, uint256 indexed dragonId, uint256 price);
    event DragonSold(uint256 indexed dragonId, address from, address to, uint256 price);
    event InstallmentPayment(uint256 indexed listingId, address buyer, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor() ERC721("Dragon City", "DRAGON") Ownable(msg.sender) {
        // Set evolution requirements
        evolutionLevelRequired[Rarity.COMMON] = 10;
        evolutionLevelRequired[Rarity.RARE] = 15;
        evolutionLevelRequired[Rarity.EPIC] = 20;
        evolutionLevelRequired[Rarity.LEGENDARY] = 30;
        evolutionLevelRequired[Rarity.MYTHIC] = 50;
    }
    
    // ============ DRAGON CREATION ============
    
    /**
     * @dev Create initial dragon (from egg hatching)
     */
    function createDragon(
        Element primary,
        Element secondary,
        Rarity rarity
    ) external payable returns (uint256) {
        require(msg.value >= 0.01 ether, "Creation fee required");
        
        uint256 dragonId = _tokenIdCounter++;
        
        // Base stats depend on rarity
        uint256 baseStats = _getBaseStatsForRarity(rarity);
        
        dragons[dragonId] = Dragon({
            id: dragonId,
            name: string(abi.encodePacked("Dragon #", _toString(dragonId))),
            primary: primary,
            secondary: secondary,
            rarity: rarity,
            form: DragonForm.BASIC,
            attack: baseStats,
            defense: baseStats,
            health: baseStats * 2,
            speed: baseStats,
            level: 1,
            experience: 0,
            trainingCount: 0,
            wins: 0,
            losses: 0,
            birthTime: block.timestamp,
            lastTrainingTime: 0,
            parentId1: 0,
            parentId2: 0,
            isEvolved: false
        });
        
        userDragons[msg.sender].push(dragonId);
        _safeMint(msg.sender, dragonId);
        
        emit DragonBorn(dragonId, msg.sender, primary, secondary);
        
        return dragonId;
    }
    
    /**
     * @dev Breed two dragons to create new one
     */
    function breedDragons(uint256 parent1Id, uint256 parent2Id) external payable nonReentrant returns (uint256) {
        require(ownerOf(parent1Id) == msg.sender, "Not owner of parent 1");
        require(ownerOf(parent2Id) == msg.sender, "Not owner of parent 2");
        require(dragons[parent1Id].level >= 4, "Parent 1 level too low");
        require(dragons[parent2Id].level >= 4, "Parent 2 level too low");
        require(msg.value >= 0.05 ether, "Breeding fee required");
        
        Dragon memory p1 = dragons[parent1Id];
        Dragon memory p2 = dragons[parent2Id];
        
        // Child inherits elements from parents
        Element childPrimary = p1.primary;
        Element childSecondary = p2.primary;
        
        // Higher rarity parent determines child rarity
        Rarity childRarity = p1.rarity > p2.rarity ? p1.rarity : p2.rarity;
        
        uint256 dragonId = _tokenIdCounter++;
        uint256 baseStats = _getBaseStatsForRarity(childRarity);
        
        // Inherit some parent stats
        uint256 inheritedAttack = (p1.attack + p2.attack) / 2;
        uint256 inheritedDefense = (p1.defense + p2.defense) / 2;
        
        dragons[dragonId] = Dragon({
            id: dragonId,
            name: string(abi.encodePacked("Dragon #", _toString(dragonId))),
            primary: childPrimary,
            secondary: childSecondary,
            rarity: childRarity,
            form: DragonForm.BASIC,
            attack: (baseStats + inheritedAttack) / 2,
            defense: (baseStats + inheritedDefense) / 2,
            health: baseStats * 2,
            speed: baseStats,
            level: 1,
            experience: 0,
            trainingCount: 0,
            wins: 0,
            losses: 0,
            birthTime: block.timestamp,
            lastTrainingTime: 0,
            parentId1: parent1Id,
            parentId2: parent2Id,
            isEvolved: false
        });
        
        userDragons[msg.sender].push(dragonId);
        _safeMint(msg.sender, dragonId);
        
        emit DragonBorn(dragonId, msg.sender, childPrimary, childSecondary);
        
        return dragonId;
    }
    
    // ============ NAMING ============
    
    function nameDragon(uint256 dragonId, string memory newName) external {
        require(ownerOf(dragonId) == msg.sender, "Not owner");
        require(bytes(newName).length > 0 && bytes(newName).length <= 32, "Invalid name length");
        
        dragons[dragonId].name = newName;
        emit DragonNamed(dragonId, newName);
    }
    
    // ============ TRAINING SYSTEM ============
    
    /**
     * @dev Start training session (tokenomics - fees required)
     */
    function startTraining(uint256 dragonId, string memory stat) external payable nonReentrant {
        require(ownerOf(dragonId) == msg.sender, "Not owner");
        require(activeSessions[dragonId].completed || activeSessions[dragonId].startTime == 0, "Training in progress");
        
        uint256 fee = baseTrainingFee * (dragons[dragonId].level / 10 + 1);
        require(msg.value >= fee, "Insufficient training fee");
        
        activeSessions[dragonId] = TrainingSession({
            dragonId: dragonId,
            startTime: block.timestamp,
            duration: TRAINING_DURATION,
            feePaid: msg.value,
            statToTrain: stat,
            completed: false
        });
        
        emit TrainingStarted(dragonId, stat, TRAINING_DURATION);
    }
    
    /**
     * @dev Complete training and apply stat boost
     */
    function completeTraining(uint256 dragonId) external {
        require(ownerOf(dragonId) == msg.sender, "Not owner");
        
        TrainingSession storage session = activeSessions[dragonId];
        require(session.startTime > 0, "No training session");
        require(!session.completed, "Already completed");
        require(block.timestamp >= session.startTime + session.duration, "Training not finished");
        
        Dragon storage dragon = dragons[dragonId];
        
        // Calculate improvement based on fee paid and level
        uint256 improvement = (session.feePaid / baseTrainingFee) * 5;
        
        // Apply to correct stat
        if (keccak256(bytes(session.statToTrain)) == keccak256(bytes("attack"))) {
            dragon.attack += improvement;
        } else if (keccak256(bytes(session.statToTrain)) == keccak256(bytes("defense"))) {
            dragon.defense += improvement;
        } else if (keccak256(bytes(session.statToTrain)) == keccak256(bytes("health"))) {
            dragon.health += improvement;
        } else if (keccak256(bytes(session.statToTrain)) == keccak256(bytes("speed"))) {
            dragon.speed += improvement;
        }
        
        dragon.trainingCount++;
        dragon.lastTrainingTime = block.timestamp;
        session.completed = true;
        
        // Gain XP from training
        dragon.experience += 50;
        _checkLevelUp(dragonId);
        
        emit TrainingCompleted(dragonId, session.statToTrain, improvement);
    }
    
    // ============ EVOLUTION SYSTEM ============
    
    /**
     * @dev Evolve dragon to next form (user creates new dragon variant)
     */
    function evolveDragon(uint256 dragonId) external payable nonReentrant {
        require(ownerOf(dragonId) == msg.sender, "Not owner");
        
        Dragon storage dragon = dragons[dragonId];
        require(dragon.form != DragonForm.ULTIMATE, "Already ultimate form");
        require(dragon.level >= evolutionLevelRequired[dragon.rarity], "Level too low");
        require(msg.value >= evolutionFee, "Insufficient evolution fee");
        
        // Upgrade form
        if (dragon.form == DragonForm.BASIC) dragon.form = DragonForm.EVOLVED1;
        else if (dragon.form == DragonForm.EVOLVED1) dragon.form = DragonForm.EVOLVED2;
        else if (dragon.form == DragonForm.EVOLVED2) dragon.form = DragonForm.ULTIMATE;
        
        // Stat boost on evolution
        uint256 boost = 20 + (uint256(dragon.rarity) * 10);
        dragon.attack += boost;
        dragon.defense += boost;
        dragon.health += boost * 2;
        dragon.speed += boost;
        dragon.isEvolved = true;
        
        emit DragonEvolved(dragonId, dragon.form);
    }
    
    // ============ MARKETPLACE WITH INSTALLMENTS ============
    
    /**
     * @dev List dragon for sale
     */
    function listDragon(uint256 dragonId, uint256 price, bool acceptInstallments) external {
        require(ownerOf(dragonId) == msg.sender, "Not owner");
        require(price > 0, "Invalid price");
        
        uint256 listingId = _listingIdCounter++;
        
        listings[listingId] = MarketListing({
            dragonId: dragonId,
            seller: msg.sender,
            price: price,
            acceptsInstallments: acceptInstallments,
            active: true,
            listedAt: block.timestamp
        });
        
        activeListingIds.push(listingId);
        userListings[msg.sender].push(listingId);
        
        // Transfer dragon to contract for escrow
        _transfer(msg.sender, address(this), dragonId);
        
        emit DragonListed(listingId, dragonId, price);
    }
    
    /**
     * @dev Buy dragon with full payment
     */
    function buyDragon(uint256 listingId) external payable nonReentrant {
        MarketListing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        uint256 fee = (listing.price * MARKETPLACE_FEE) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        address seller = listing.seller;
        uint256 dragonId = listing.dragonId;
        
        listing.active = false;
        
        // Transfer dragon to buyer
        _transfer(address(this), msg.sender, dragonId);
        
        // Pay seller
        payable(seller).transfer(sellerAmount);
        
        emit DragonSold(dragonId, seller, msg.sender, listing.price);
    }
    
    /**
     * @dev Start installment purchase (3 payments)
     */
    function startInstallmentPurchase(uint256 listingId) external payable nonReentrant {
        MarketListing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(listing.acceptsInstallments, "Installments not accepted");
        
        uint256 firstPayment = listing.price / INSTALLMENT_COUNT;
        require(msg.value >= firstPayment, "Insufficient first payment");
        
        installmentPlans[listingId] = InstallmentPlan({
            listingId: listingId,
            buyer: msg.sender,
            totalPrice: listing.price,
            paidAmount: msg.value,
            installmentsPaid: 1,
            lastPaymentTime: block.timestamp,
            completed: false
        });
        
        emit InstallmentPayment(listingId, msg.sender, msg.value);
    }
    
    /**
     * @dev Continue installment payments
     */
    function payInstallment(uint256 listingId) external payable nonReentrant {
        InstallmentPlan storage plan = installmentPlans[listingId];
        require(plan.buyer == msg.sender, "Not buyer");
        require(!plan.completed, "Already completed");
        require(block.timestamp >= plan.lastPaymentTime + PAYMENT_INTERVAL, "Too soon");
        
        uint256 paymentAmount = plan.totalPrice / INSTALLMENT_COUNT;
        require(msg.value >= paymentAmount, "Insufficient payment");
        
        plan.paidAmount += msg.value;
        plan.installmentsPaid++;
        plan.lastPaymentTime = block.timestamp;
        
        emit InstallmentPayment(listingId, msg.sender, msg.value);
        
        // Complete if all paid
        if (plan.installmentsPaid >= INSTALLMENT_COUNT) {
            plan.completed = true;
            _completeInstallmentSale(listingId);
        }
    }
    
    function _completeInstallmentSale(uint256 listingId) private {
        MarketListing storage listing = listings[listingId];
        InstallmentPlan storage plan = installmentPlans[listingId];
        
        uint256 fee = (listing.price * MARKETPLACE_FEE) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        address seller = listing.seller;
        uint256 dragonId = listing.dragonId;
        
        listing.active = false;
        
        // Transfer dragon to buyer
        _transfer(address(this), plan.buyer, dragonId);
        
        // Pay seller
        payable(seller).transfer(sellerAmount);
        
        emit DragonSold(dragonId, seller, plan.buyer, listing.price);
    }
    
    /**
     * @dev Cancel listing
     */
    function cancelListing(uint256 listingId) external {
        MarketListing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Not active");
        
        listing.active = false;
        
        // Return dragon to seller
        _transfer(address(this), msg.sender, listing.dragonId);
    }
    
    // ============ INTERNAL HELPERS ============
    
    function _getBaseStatsForRarity(Rarity rarity) private pure returns (uint256) {
        if (rarity == Rarity.COMMON) return 50;
        if (rarity == Rarity.RARE) return 75;
        if (rarity == Rarity.EPIC) return 100;
        if (rarity == Rarity.LEGENDARY) return 150;
        return 200; // MYTHIC
    }
    
    function _checkLevelUp(uint256 dragonId) private {
        Dragon storage dragon = dragons[dragonId];
        uint256 requiredXP = dragon.level * 100;
        
        while (dragon.experience >= requiredXP) {
            dragon.level++;
            dragon.attack += 3;
            dragon.defense += 3;
            dragon.health += 5;
            dragon.speed += 2;
            requiredXP = dragon.level * 100;
        }
    }
    
    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
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
    
    // ============ VIEW FUNCTIONS ============
    
    function getDragon(uint256 dragonId) external view returns (Dragon memory) {
        return dragons[dragonId];
    }
    
    function getUserDragons(address user) external view returns (uint256[] memory) {
        return userDragons[user];
    }
    
    function getActiveListings() external view returns (uint256[] memory) {
        return activeListingIds;
    }
    
    function getBattlePower(uint256 dragonId) external view returns (uint256) {
        Dragon memory d = dragons[dragonId];
        return (d.attack + d.defense + d.speed) * d.level;
    }
    
    // ============ ADMIN ============
    
    function setGameToken(address _token) external onlyOwner {
        gameToken = IERC20(_token);
    }
    
    function setTrainingFee(uint256 _fee) external onlyOwner {
        baseTrainingFee = _fee;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
