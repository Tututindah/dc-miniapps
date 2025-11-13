// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DragonMarketplace
 * @dev NFT marketplace with floor pricing and trade-in (tukar tambah) system
 * Example: Dragon A floor = 1 ETH, Dragon B floor = 2 ETH
 * User A wants B: pays 1.2 ETH (B floor - A floor + 20% fee)
 * User B receives: 1.1 ETH (0.1 ETH marketplace fee)
 */
contract DragonMarketplace is Ownable, ReentrancyGuard {
    
    IERC721 public dragonNFT;
    
    // Marketplace fee: 1000 = 10%
    uint256 public marketplaceFee = 1000;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Trade-in fee: 2000 = 20% premium on top of floor difference
    uint256 public tradeInFee = 2000;
    
    struct Listing {
        uint256 dragonId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }
    
    struct FloorPrice {
        uint256 element;        // Fire, Water, Ice, etc.
        uint256 rarity;         // Common, Rare, Legendary, etc.
        uint256 floorPrice;     // Current floor price
        uint256 lastUpdated;
    }
    
    struct TradeOffer {
        uint256 offerId;
        address offerer;
        uint256 offeredDragonId;
        address target;
        uint256 targetDragonId;
        uint256 ethDifference;  // ETH to pay/receive
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    // Listings
    mapping(uint256 => Listing) public listings;
    uint256[] public activeListings;
    
    // Floor prices by element and rarity
    mapping(uint256 => mapping(uint256 => FloorPrice)) public floorPrices;
    
    // Trade offers
    uint256 private tradeOfferCounter;
    mapping(uint256 => TradeOffer) public tradeOffers;
    mapping(uint256 => uint256[]) public dragonTradeOffers; // Dragon ID => offer IDs
    
    // Sales history for floor price calculation
    struct Sale {
        uint256 dragonId;
        uint256 price;
        uint256 timestamp;
        uint256 element;
        uint256 rarity;
    }
    
    Sale[] public salesHistory;
    
    // Events
    event DragonListed(uint256 indexed dragonId, address indexed seller, uint256 price);
    event DragonSold(uint256 indexed dragonId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed dragonId, address indexed seller);
    event FloorPriceUpdated(uint256 indexed element, uint256 indexed rarity, uint256 newFloor);
    event TradeOfferCreated(uint256 indexed offerId, address offerer, uint256 offeredDragon, uint256 targetDragon, uint256 ethDifference);
    event TradeOfferAccepted(uint256 indexed offerId, address indexed seller, address indexed buyer);
    event TradeOfferCancelled(uint256 indexed offerId);

    constructor(address _dragonNFT) {
        dragonNFT = IERC721(_dragonNFT);
        
        // Initialize default floor prices (in wei)
        // Common dragons
        _setFloorPrice(0, 1, 0.01 ether);  // Fire Common
        _setFloorPrice(1, 1, 0.01 ether);  // Water Common
        _setFloorPrice(2, 1, 0.01 ether);  // Ice Common
        
        // Rare dragons
        _setFloorPrice(0, 2, 0.1 ether);   // Fire Rare
        _setFloorPrice(1, 2, 0.1 ether);   // Water Rare
        
        // Legendary dragons
        _setFloorPrice(0, 3, 1 ether);     // Fire Legendary
        _setFloorPrice(1, 3, 1 ether);     // Water Legendary
    }

    /**
     * @dev List dragon for sale
     */
    function listDragon(uint256 dragonId, uint256 price) external nonReentrant {
        require(dragonNFT.ownerOf(dragonId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        require(!listings[dragonId].isActive, "Already listed");
        
        // Transfer dragon to marketplace
        dragonNFT.transferFrom(msg.sender, address(this), dragonId);
        
        listings[dragonId] = Listing({
            dragonId: dragonId,
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });
        
        activeListings.push(dragonId);
        
        emit DragonListed(dragonId, msg.sender, price);
    }

    /**
     * @dev Buy listed dragon
     */
    function buyDragon(uint256 dragonId) external payable nonReentrant {
        Listing storage listing = listings[dragonId];
        require(listing.isActive, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Calculate fees
        uint256 fee = (price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerProceeds = price - fee;
        
        // Mark as sold
        listing.isActive = false;
        
        // Transfer dragon to buyer
        dragonNFT.transferFrom(address(this), msg.sender, dragonId);
        
        // Pay seller
        (bool success, ) = seller.call{value: sellerProceeds}("");
        require(success, "Payment failed");
        
        // Refund excess
        if (msg.value > price) {
            (success, ) = msg.sender.call{value: msg.value - price}("");
            require(success, "Refund failed");
        }
        
        // Record sale for floor price calculation
        // TODO: Get element and rarity from dragon NFT
        salesHistory.push(Sale({
            dragonId: dragonId,
            price: price,
            timestamp: block.timestamp,
            element: 0, // Placeholder
            rarity: 1   // Placeholder
        }));
        
        emit DragonSold(dragonId, seller, msg.sender, price);
    }

    /**
     * @dev Cancel listing
     */
    function cancelListing(uint256 dragonId) external nonReentrant {
        Listing storage listing = listings[dragonId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Not seller");
        
        listing.isActive = false;
        
        // Return dragon to seller
        dragonNFT.transferFrom(address(this), msg.sender, dragonId);
        
        emit ListingCancelled(dragonId, msg.sender);
    }

    /**
     * @dev Create trade offer (tukar tambah)
     * @param offeredDragonId Dragon you're offering
     * @param targetDragonId Dragon you want
     * @param targetOwner Owner of target dragon
     */
    function createTradeOffer(
        uint256 offeredDragonId,
        uint256 targetDragonId,
        address targetOwner,
        uint256 offeredElement,
        uint256 offeredRarity,
        uint256 targetElement,
        uint256 targetRarity
    ) external payable nonReentrant returns (uint256) {
        require(dragonNFT.ownerOf(offeredDragonId) == msg.sender, "Not owner of offered dragon");
        require(dragonNFT.ownerOf(targetDragonId) == targetOwner, "Target owner mismatch");
        require(offeredDragonId != targetDragonId, "Cannot trade same dragon");
        
        // Get floor prices
        uint256 offeredFloor = floorPrices[offeredElement][offeredRarity].floorPrice;
        uint256 targetFloor = floorPrices[targetElement][targetRarity].floorPrice;
        
        require(offeredFloor > 0 && targetFloor > 0, "Floor price not set");
        
        uint256 ethDifference = 0;
        
        if (targetFloor > offeredFloor) {
            // Offerer must pay difference + premium
            uint256 baseDifference = targetFloor - offeredFloor;
            uint256 premium = (baseDifference * tradeInFee) / FEE_DENOMINATOR;
            ethDifference = baseDifference + premium;
            
            require(msg.value >= ethDifference, "Insufficient ETH for trade");
        }
        
        // Transfer offered dragon to escrow
        dragonNFT.transferFrom(msg.sender, address(this), offeredDragonId);
        
        tradeOfferCounter++;
        uint256 offerId = tradeOfferCounter;
        
        tradeOffers[offerId] = TradeOffer({
            offerId: offerId,
            offerer: msg.sender,
            offeredDragonId: offeredDragonId,
            target: targetOwner,
            targetDragonId: targetDragonId,
            ethDifference: ethDifference,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 7 days
        });
        
        dragonTradeOffers[targetDragonId].push(offerId);
        
        emit TradeOfferCreated(offerId, msg.sender, offeredDragonId, targetDragonId, ethDifference);
        
        return offerId;
    }

    /**
     * @dev Accept trade offer
     */
    function acceptTradeOffer(uint256 offerId) external nonReentrant {
        TradeOffer storage offer = tradeOffers[offerId];
        require(offer.isActive, "Offer not active");
        require(offer.target == msg.sender, "Not the target");
        require(block.timestamp < offer.expiresAt, "Offer expired");
        require(dragonNFT.ownerOf(offer.targetDragonId) == msg.sender, "Don't own target dragon");
        
        offer.isActive = false;
        
        // Transfer target dragon to offerer
        dragonNFT.transferFrom(msg.sender, offer.offerer, offer.targetDragonId);
        
        // Transfer offered dragon to target
        dragonNFT.transferFrom(address(this), msg.sender, offer.offeredDragonId);
        
        // Handle ETH payment
        if (offer.ethDifference > 0) {
            // Calculate marketplace fee
            uint256 fee = (offer.ethDifference * marketplaceFee) / FEE_DENOMINATOR;
            uint256 sellerReceives = offer.ethDifference - fee;
            
            // Pay target (seller)
            (bool success, ) = msg.sender.call{value: sellerReceives}("");
            require(success, "ETH transfer failed");
        }
        
        emit TradeOfferAccepted(offerId, msg.sender, offer.offerer);
    }

    /**
     * @dev Cancel trade offer
     */
    function cancelTradeOffer(uint256 offerId) external nonReentrant {
        TradeOffer storage offer = tradeOffers[offerId];
        require(offer.isActive, "Offer not active");
        require(offer.offerer == msg.sender, "Not offerer");
        
        offer.isActive = false;
        
        // Return offered dragon
        dragonNFT.transferFrom(address(this), msg.sender, offer.offeredDragonId);
        
        // Return ETH
        if (offer.ethDifference > 0) {
            (bool success, ) = msg.sender.call{value: offer.ethDifference}("");
            require(success, "ETH refund failed");
        }
        
        emit TradeOfferCancelled(offerId);
    }

    /**
     * @dev Get trade offers for a dragon
     */
    function getTradeOffersForDragon(uint256 dragonId) external view returns (uint256[] memory) {
        return dragonTradeOffers[dragonId];
    }

    /**
     * @dev Get all active listings
     */
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (listings[activeListings[i]].isActive) {
                activeCount++;
            }
        }
        
        Listing[] memory active = new Listing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (listings[activeListings[i]].isActive) {
                active[index] = listings[activeListings[i]];
                index++;
            }
        }
        
        return active;
    }

    /**
     * @dev Update floor price (owner or automated)
     */
    function updateFloorPrice(uint256 element, uint256 rarity, uint256 newFloor) external onlyOwner {
        _setFloorPrice(element, rarity, newFloor);
    }

    function _setFloorPrice(uint256 element, uint256 rarity, uint256 price) internal {
        floorPrices[element][rarity] = FloorPrice({
            element: element,
            rarity: rarity,
            floorPrice: price,
            lastUpdated: block.timestamp
        });
        
        emit FloorPriceUpdated(element, rarity, price);
    }

    /**
     * @dev Calculate floor price from recent sales
     */
    function calculateFloorPrice(uint256 element, uint256 rarity) public view returns (uint256) {
        uint256 recentSales = 0;
        uint256 totalPrice = 0;
        uint256 cutoffTime = block.timestamp - 7 days;
        
        for (uint256 i = salesHistory.length; i > 0; i--) {
            Sale memory sale = salesHistory[i - 1];
            
            if (sale.timestamp < cutoffTime) break;
            
            if (sale.element == element && sale.rarity == rarity) {
                totalPrice += sale.price;
                recentSales++;
            }
            
            if (recentSales >= 10) break; // Use last 10 sales
        }
        
        if (recentSales == 0) {
            return floorPrices[element][rarity].floorPrice;
        }
        
        return totalPrice / recentSales;
    }

    /**
     * @dev Update marketplace fee
     */
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 2000, "Fee too high"); // Max 20%
        marketplaceFee = newFee;
    }

    /**
     * @dev Update trade-in fee
     */
    function setTradeInFee(uint256 newFee) external onlyOwner {
        require(newFee <= 5000, "Fee too high"); // Max 50%
        tradeInFee = newFee;
    }

    /**
     * @dev Withdraw marketplace fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        
        // Calculate locked ETH in active trade offers
        uint256 lockedETH = 0;
        for (uint256 i = 1; i <= tradeOfferCounter; i++) {
            if (tradeOffers[i].isActive) {
                lockedETH += tradeOffers[i].ethDifference;
            }
        }
        
        uint256 withdrawable = balance - lockedETH;
        require(withdrawable > 0, "No fees to withdraw");
        
        (bool success, ) = owner().call{value: withdrawable}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
