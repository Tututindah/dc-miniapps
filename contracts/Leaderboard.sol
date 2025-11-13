// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Leaderboard
 * @dev Track player points and distribute rewards
 * Points earned from: battles, breeding, hatching
 */
contract Leaderboard is Ownable {
    struct PlayerStats {
        uint256 totalPoints;
        uint256 battlesWon;
        uint256 dragonsHatched;
        uint256 dragonsBred;
        uint256 rewardsClaimed;
        uint256 lastActivityTime;
        uint256 rank;
    }

    struct RewardTier {
        uint256 minPoints;
        uint256 rewardAmount;
        string tierName;
    }

    // Points configuration
    uint256 public constant POINTS_PER_WIN = 100;
    uint256 public constant POINTS_PER_HATCH = 50;
    uint256 public constant POINTS_PER_BREED = 150;
    uint256 public constant POINTS_PER_RARE_HATCH = 200;
    uint256 public constant POINTS_PER_LEGENDARY_HATCH = 500;

    // State
    mapping(address => PlayerStats) public playerStats;
    address[] public players;
    mapping(address => bool) public isPlayer;
    
    RewardTier[] public rewardTiers;
    mapping(address => uint256) public claimableRewards;
    
    address public dragonNFTContract;
    address public rewardToken; // Optional ERC20 reward token
    
    bool public rewardsEnabled;
    uint256 public totalPointsDistributed;
    
    // Events
    event PointsAwarded(address indexed player, uint256 points, string reason);
    event RewardClaimed(address indexed player, uint256 amount);
    event RankUpdated(address indexed player, uint256 newRank);
    event NewLeader(address indexed player, uint256 totalPoints);

    constructor() Ownable(msg.sender) {
        // Initialize default reward tiers
        rewardTiers.push(RewardTier(1000, 0.01 ether, "Bronze"));
        rewardTiers.push(RewardTier(5000, 0.05 ether, "Silver"));
        rewardTiers.push(RewardTier(10000, 0.15 ether, "Gold"));
        rewardTiers.push(RewardTier(25000, 0.5 ether, "Platinum"));
        rewardTiers.push(RewardTier(50000, 1 ether, "Diamond"));
    }

    // ============ ADMIN FUNCTIONS ============

    function setDragonNFTContract(address _dragonNFT) external onlyOwner {
        dragonNFTContract = _dragonNFT;
    }

    function setRewardToken(address _token) external onlyOwner {
        rewardToken = _token;
    }

    function setRewardsEnabled(bool _enabled) external onlyOwner {
        rewardsEnabled = _enabled;
    }

    function addRewardTier(uint256 minPoints, uint256 rewardAmount, string memory tierName) external onlyOwner {
        rewardTiers.push(RewardTier(minPoints, rewardAmount, tierName));
    }

    function fundRewards() external payable onlyOwner {
        require(msg.value > 0, "No funds sent");
    }

    // ============ POINT TRACKING ============

    function recordBattleWin(address player) external {
        require(msg.sender == dragonNFTContract || msg.sender == owner(), "Not authorized");
        
        _addPlayer(player);
        
        playerStats[player].battlesWon++;
        playerStats[player].totalPoints += POINTS_PER_WIN;
        playerStats[player].lastActivityTime = block.timestamp;
        
        totalPointsDistributed += POINTS_PER_WIN;
        
        _updateRanking();
        _checkRewardEligibility(player);
        
        emit PointsAwarded(player, POINTS_PER_WIN, "Battle Win");
    }

    function recordHatch(address player, bool isRare, bool isLegendary) external {
        require(msg.sender == dragonNFTContract || msg.sender == owner(), "Not authorized");
        
        _addPlayer(player);
        
        uint256 points = POINTS_PER_HATCH;
        if (isLegendary) points = POINTS_PER_LEGENDARY_HATCH;
        else if (isRare) points = POINTS_PER_RARE_HATCH;
        
        playerStats[player].dragonsHatched++;
        playerStats[player].totalPoints += points;
        playerStats[player].lastActivityTime = block.timestamp;
        
        totalPointsDistributed += points;
        
        _updateRanking();
        _checkRewardEligibility(player);
        
        emit PointsAwarded(player, points, isLegendary ? "Legendary Hatch" : isRare ? "Rare Hatch" : "Hatch");
    }

    function recordBreed(address player) external {
        require(msg.sender == dragonNFTContract || msg.sender == owner(), "Not authorized");
        
        _addPlayer(player);
        
        playerStats[player].dragonsBred++;
        playerStats[player].totalPoints += POINTS_PER_BREED;
        playerStats[player].lastActivityTime = block.timestamp;
        
        totalPointsDistributed += POINTS_PER_BREED;
        
        _updateRanking();
        _checkRewardEligibility(player);
        
        emit PointsAwarded(player, POINTS_PER_BREED, "Breeding");
    }

    function _addPlayer(address player) private {
        if (!isPlayer[player]) {
            players.push(player);
            isPlayer[player] = true;
        }
    }

    function _updateRanking() private {
        // Simple bubble sort for top players (optimize for production)
        for (uint256 i = 0; i < players.length && i < 100; i++) {
            for (uint256 j = i + 1; j < players.length && j < 100; j++) {
                if (playerStats[players[j]].totalPoints > playerStats[players[i]].totalPoints) {
                    address temp = players[i];
                    players[i] = players[j];
                    players[j] = temp;
                }
            }
        }
        
        // Update ranks
        for (uint256 i = 0; i < players.length && i < 100; i++) {
            uint256 newRank = i + 1;
            if (playerStats[players[i]].rank != newRank) {
                playerStats[players[i]].rank = newRank;
                emit RankUpdated(players[i], newRank);
                
                if (newRank == 1) {
                    emit NewLeader(players[i], playerStats[players[i]].totalPoints);
                }
            }
        }
    }

    function _checkRewardEligibility(address player) private {
        if (!rewardsEnabled) return;
        
        uint256 points = playerStats[player].totalPoints;
        
        for (uint256 i = rewardTiers.length; i > 0; i--) {
            RewardTier memory tier = rewardTiers[i - 1];
            if (points >= tier.minPoints) {
                uint256 potentialReward = tier.rewardAmount;
                if (potentialReward > claimableRewards[player]) {
                    claimableRewards[player] = potentialReward;
                }
                break;
            }
        }
    }

    // ============ REWARD CLAIMING ============

    function claimReward() external {
        require(rewardsEnabled, "Rewards not enabled");
        
        uint256 reward = claimableRewards[msg.sender];
        require(reward > 0, "No rewards available");
        require(address(this).balance >= reward, "Insufficient contract balance");
        
        claimableRewards[msg.sender] = 0;
        playerStats[msg.sender].rewardsClaimed += reward;
        
        payable(msg.sender).transfer(reward);
        
        emit RewardClaimed(msg.sender, reward);
    }

    // ============ VIEW FUNCTIONS ============

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function getTopPlayers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 length = count > players.length ? players.length : count;
        address[] memory topAddresses = new address[](length);
        uint256[] memory topPoints = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            topAddresses[i] = players[i];
            topPoints[i] = playerStats[players[i]].totalPoints;
        }
        
        return (topAddresses, topPoints);
    }

    function getPlayerRank(address player) external view returns (uint256) {
        return playerStats[player].rank;
    }

    function getRewardTiers() external view returns (RewardTier[] memory) {
        return rewardTiers;
    }

    function getTotalPlayers() external view returns (uint256) {
        return players.length;
    }

    // ============ WITHDRAWAL ============

    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner()).transfer(balance);
    }

    receive() external payable {}
}
