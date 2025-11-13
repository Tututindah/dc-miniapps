// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MissionSystem
 * @dev Allows unique dragon owners to create missions for other players
 * Mission types: Add Liquidity, Swap, Follow on Farcaster, Open MiniApp, etc.
 */
contract MissionSystem is Ownable, ReentrancyGuard {
    
    enum MissionType {
        ADD_LIQUIDITY,      // Add liquidity to DEX
        SWAP_TOKENS,        // Perform token swap
        FOLLOW_FARCASTER,   // Follow on Farcaster
        OPEN_MINIAPP,       // Open specific mini app
        BATTLE_WIN,         // Win X battles
        BREED_DRAGON,       // Breed a dragon
        TRAIN_DRAGON,       // Train dragon to level X
        CUSTOM              // Custom mission
    }

    enum MissionStatus {
        ACTIVE,
        COMPLETED,
        EXPIRED,
        CANCELLED
    }

    struct Mission {
        uint256 id;
        address creator;            // Dragon owner who created mission
        uint256 creatorDragonId;    // Dragon NFT ID (must be unique/legendary)
        MissionType missionType;
        string title;
        string description;
        string verificationData;    // JSON: { fid: "123", contract: "0x...", amount: "1.0" }
        uint256 rewardETH;          // ETH reward
        uint256 rewardTokens;       // ERC20 token reward
        uint256 expMultiplier;      // EXP multiplier (1000 = 1x, 2000 = 2x)
        uint256 maxCompletions;     // Max number of players who can complete
        uint256 completionsCount;
        uint256 expiresAt;
        MissionStatus status;
        bool requiresVerification;  // If true, creator must verify completion
    }

    struct MissionCompletion {
        uint256 missionId;
        address player;
        uint256 completedAt;
        string proofData;           // Proof of completion (tx hash, screenshot URL, etc)
        bool verified;
        bool rewardClaimed;
    }

    // Dragon NFT contract
    IERC721 public dragonNFT;
    
    // Minimum dragon rarity to create missions
    uint256 public constant MIN_RARITY_FOR_MISSIONS = 80; // Legendary/Unique only
    
    // Mission storage
    uint256 private missionCounter;
    mapping(uint256 => Mission) public missions;
    mapping(uint256 => MissionCompletion[]) public missionCompletions;
    mapping(address => uint256[]) public playerMissions; // Player => mission IDs they created
    mapping(address => uint256[]) public playerCompletedMissions;
    
    // Mission creation fee
    uint256 public missionCreationFee = 0.001 ether;
    
    // Events
    event MissionCreated(
        uint256 indexed missionId,
        address indexed creator,
        uint256 creatorDragonId,
        MissionType missionType,
        uint256 rewardETH
    );
    
    event MissionCompleted(
        uint256 indexed missionId,
        address indexed player,
        uint256 completionIndex
    );
    
    event MissionVerified(
        uint256 indexed missionId,
        address indexed player,
        bool approved
    );
    
    event RewardClaimed(
        uint256 indexed missionId,
        address indexed player,
        uint256 rewardETH,
        uint256 rewardTokens
    );

    constructor(address _dragonNFT) Ownable(msg.sender) {
        dragonNFT = IERC721(_dragonNFT);
    }

    /**
     * @dev Create a new mission (only unique dragon owners)
     */
    function createMission(
        uint256 dragonId,
        MissionType missionType,
        string memory title,
        string memory description,
        string memory verificationData,
        uint256 expMultiplier,
        uint256 maxCompletions,
        uint256 durationDays,
        bool requiresVerification
    ) external payable nonReentrant returns (uint256) {
        require(dragonNFT.ownerOf(dragonId) == msg.sender, "Not dragon owner");
        require(msg.value >= missionCreationFee, "Insufficient creation fee");
        require(maxCompletions > 0, "Max completions must be > 0");
        require(durationDays > 0 && durationDays <= 365, "Invalid duration");
        
        // TODO: Check dragon rarity (require legendary/unique)
        // This would need to be implemented in the Dragon NFT contract
        
        missionCounter++;
        uint256 missionId = missionCounter;
        
        missions[missionId] = Mission({
            id: missionId,
            creator: msg.sender,
            creatorDragonId: dragonId,
            missionType: missionType,
            title: title,
            description: description,
            verificationData: verificationData,
            rewardETH: 0, // Set when funding mission
            rewardTokens: 0,
            expMultiplier: expMultiplier,
            maxCompletions: maxCompletions,
            completionsCount: 0,
            expiresAt: block.timestamp + (durationDays * 1 days),
            status: MissionStatus.ACTIVE,
            requiresVerification: requiresVerification
        });
        
        playerMissions[msg.sender].push(missionId);
        
        emit MissionCreated(missionId, msg.sender, dragonId, missionType, 0);
        
        return missionId;
    }

    /**
     * @dev Fund mission with ETH rewards
     */
    function fundMission(uint256 missionId) external payable nonReentrant {
        Mission storage mission = missions[missionId];
        require(mission.creator == msg.sender, "Not mission creator");
        require(mission.status == MissionStatus.ACTIVE, "Mission not active");
        require(msg.value > 0, "Must send ETH");
        
        mission.rewardETH += msg.value;
    }

    /**
     * @dev Complete a mission
     */
    function completeMission(
        uint256 missionId,
        string memory proofData
    ) external nonReentrant {
        Mission storage mission = missions[missionId];
        require(mission.status == MissionStatus.ACTIVE, "Mission not active");
        require(block.timestamp < mission.expiresAt, "Mission expired");
        require(mission.completionsCount < mission.maxCompletions, "Mission full");
        
        // Check if player already completed this mission
        MissionCompletion[] storage completions = missionCompletions[missionId];
        for (uint i = 0; i < completions.length; i++) {
            require(completions[i].player != msg.sender, "Already completed");
        }
        
        // Add completion record
        completions.push(MissionCompletion({
            missionId: missionId,
            player: msg.sender,
            completedAt: block.timestamp,
            proofData: proofData,
            verified: !mission.requiresVerification, // Auto-verify if not required
            rewardClaimed: false
        }));
        
        mission.completionsCount++;
        playerCompletedMissions[msg.sender].push(missionId);
        
        emit MissionCompleted(missionId, msg.sender, completions.length - 1);
        
        // Auto-claim reward if no verification needed
        if (!mission.requiresVerification) {
            _claimReward(missionId, completions.length - 1);
        }
    }

    /**
     * @dev Verify mission completion (creator only)
     */
    function verifyCompletion(
        uint256 missionId,
        address player,
        bool approved
    ) external nonReentrant {
        Mission storage mission = missions[missionId];
        require(mission.creator == msg.sender, "Not mission creator");
        require(mission.requiresVerification, "No verification needed");
        
        MissionCompletion[] storage completions = missionCompletions[missionId];
        
        // Find player's completion
        for (uint i = 0; i < completions.length; i++) {
            if (completions[i].player == player) {
                require(!completions[i].verified, "Already verified");
                
                completions[i].verified = approved;
                
                emit MissionVerified(missionId, player, approved);
                
                // Auto-claim if approved
                if (approved && !completions[i].rewardClaimed) {
                    _claimReward(missionId, i);
                }
                
                return;
            }
        }
        
        revert("Completion not found");
    }

    /**
     * @dev Claim mission reward
     */
    function claimReward(uint256 missionId) external nonReentrant {
        MissionCompletion[] storage completions = missionCompletions[missionId];
        
        for (uint i = 0; i < completions.length; i++) {
            if (completions[i].player == msg.sender && !completions[i].rewardClaimed) {
                _claimReward(missionId, i);
                return;
            }
        }
        
        revert("No claimable reward");
    }

    /**
     * @dev Internal claim reward function
     */
    function _claimReward(uint256 missionId, uint256 completionIndex) internal {
        Mission storage mission = missions[missionId];
        MissionCompletion[] storage completions = missionCompletions[missionId];
        MissionCompletion storage completion = completions[completionIndex];
        
        require(completion.verified, "Not verified");
        require(!completion.rewardClaimed, "Already claimed");
        
        completion.rewardClaimed = true;
        
        // Calculate reward per player
        uint256 rewardPerPlayer = mission.rewardETH / mission.maxCompletions;
        
        if (rewardPerPlayer > 0) {
            (bool success, ) = completion.player.call{value: rewardPerPlayer}("");
            require(success, "ETH transfer failed");
        }
        
        emit RewardClaimed(missionId, completion.player, rewardPerPlayer, mission.rewardTokens);
    }

    /**
     * @dev Cancel mission (creator only)
     */
    function cancelMission(uint256 missionId) external nonReentrant {
        Mission storage mission = missions[missionId];
        require(mission.creator == msg.sender, "Not mission creator");
        require(mission.status == MissionStatus.ACTIVE, "Mission not active");
        
        mission.status = MissionStatus.CANCELLED;
        
        // Refund remaining rewards
        uint256 claimedRewards = mission.completionsCount * (mission.rewardETH / mission.maxCompletions);
        uint256 refund = mission.rewardETH - claimedRewards;
        
        if (refund > 0) {
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Get all active missions
     */
    function getActiveMissions() external view returns (Mission[] memory) {
        uint256 activeCount = 0;
        
        // Count active missions
        for (uint256 i = 1; i <= missionCounter; i++) {
            if (missions[i].status == MissionStatus.ACTIVE && 
                block.timestamp < missions[i].expiresAt) {
                activeCount++;
            }
        }
        
        Mission[] memory activeMissions = new Mission[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= missionCounter; i++) {
            if (missions[i].status == MissionStatus.ACTIVE && 
                block.timestamp < missions[i].expiresAt) {
                activeMissions[index] = missions[i];
                index++;
            }
        }
        
        return activeMissions;
    }

    /**
     * @dev Get player's completed missions
     */
    function getPlayerCompletedMissions(address player) external view returns (uint256[] memory) {
        return playerCompletedMissions[player];
    }

    /**
     * @dev Get mission completions
     */
    function getMissionCompletions(uint256 missionId) external view returns (MissionCompletion[] memory) {
        return missionCompletions[missionId];
    }

    /**
     * @dev Update mission creation fee
     */
    function setMissionCreationFee(uint256 newFee) external onlyOwner {
        missionCreationFee = newFee;
    }

    /**
     * @dev Withdraw protocol fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        
        // Calculate total locked rewards
        uint256 lockedRewards = 0;
        for (uint256 i = 1; i <= missionCounter; i++) {
            if (missions[i].status == MissionStatus.ACTIVE) {
                lockedRewards += missions[i].rewardETH;
            }
        }
        
        uint256 withdrawable = balance - lockedRewards;
        require(withdrawable > 0, "No fees to withdraw");
        
        (bool success, ) = owner().call{value: withdrawable}("");
        require(success, "Withdraw failed");
    }
}
