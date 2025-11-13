// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDragonNFT {
    struct Dragon {
        uint256 id;
        string name;
        uint8 element;
        uint8 powerType;
        uint16 attack;
        uint16 defense;
        uint16 speed;
        uint8 level;
        uint256 experience;
        uint256 birthTime;
        uint256 parent1;
        uint256 parent2;
        uint256 originChainId;
        bool isStandby;
    }
    
    function getDragon(uint256 tokenId) external view returns (Dragon memory);
    function ownerOf(uint256 tokenId) external view returns (address);
    function addExperience(uint256 tokenId, uint256 exp) external;
}

contract BattleArena {
    IDragonNFT public dragonContract;
    
    struct Battle {
        uint256 id;
        address challenger;
        uint256 challengerDragonId;
        address opponent;
        uint256 opponentDragonId;
        uint256 timestamp;
        address winner;
        bool completed;
        uint256 expReward;
    }
    
    mapping(uint256 => Battle) public battles;
    mapping(address => uint256[]) public userBattles;
    
    uint256 private _nextBattleId;
    
    event BattleInitiated(uint256 indexed battleId, address indexed challenger, uint256 challengerDragon, uint256 opponentDragon);
    event BattleCompleted(uint256 indexed battleId, address indexed winner, uint256 expGained);
    
    constructor(address _dragonContract) {
        dragonContract = IDragonNFT(_dragonContract);
    }
    
    // Initiate battle (no computation, just record intent)
    function initiateBattle(uint256 myDragonId, uint256 opponentDragonId) external returns (uint256) {
        require(dragonContract.ownerOf(myDragonId) == msg.sender, "Not your dragon");
        
        IDragonNFT.Dragon memory opponentDragon = dragonContract.getDragon(opponentDragonId);
        require(opponentDragon.isStandby, "Opponent dragon not on standby");
        
        address opponentOwner = dragonContract.ownerOf(opponentDragonId);
        require(opponentOwner != msg.sender, "Cannot battle your own dragon");
        
        uint256 battleId = _nextBattleId++;
        
        battles[battleId] = Battle({
            id: battleId,
            challenger: msg.sender,
            challengerDragonId: myDragonId,
            opponent: opponentOwner,
            opponentDragonId: opponentDragonId,
            timestamp: block.timestamp,
            winner: address(0),
            completed: false,
            expReward: 0
        });
        
        userBattles[msg.sender].push(battleId);
        userBattles[opponentOwner].push(battleId);
        
        emit BattleInitiated(battleId, msg.sender, myDragonId, opponentDragonId);
        
        return battleId;
    }
    
    // Submit battle result (computed off-chain, verified on-chain)
    function submitBattleResult(
        uint256 battleId,
        address winner,
        uint256 expGained
    ) external {
        Battle storage battle = battles[battleId];
        require(!battle.completed, "Battle already completed");
        require(msg.sender == battle.challenger || msg.sender == battle.opponent, "Not participant");
        require(winner == battle.challenger || winner == battle.opponent, "Invalid winner");
        require(expGained > 0 && expGained <= 200, "Invalid exp amount");
        
        battle.winner = winner;
        battle.completed = true;
        battle.expReward = expGained;
        
        emit BattleCompleted(battleId, winner, expGained);
    }
    
    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }
    
    function getUserBattles(address user) external view returns (uint256[] memory) {
        return userBattles[user];
    }
}
