'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI, BATTLE_ARENA_ABI } from '@/lib/contracts';
import { Dragon, Battle, ELEMENT_NAMES, ELEMENT_COLORS } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { useState } from 'react';
import { ArenaBackground } from './GameBackgrounds';
import VillageNavigation from './VillageNavigation';

interface BattleArenaProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function BattleArena({ onBack, showNavigation = false }: BattleArenaProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [activeTab, setActiveTab] = useState<'challenge' | 'mybattles'>('challenge');

  const dragonContract = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220
    ? CONTRACTS.celo.dragonNFT
    : CONTRACTS.localhost.dragonNFT;

  const battleContract = chainId === 8453 
    ? CONTRACTS.base.battleArena 
    : chainId === 42220
    ? CONTRACTS.celo.battleArena
    : CONTRACTS.localhost.battleArena;

  const { data: myDragons } = useReadContract({
    address: dragonContract,
    abi: DRAGON_NFT_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  });

  const { data: myBattles } = useReadContract({
    address: battleContract,
    abi: BATTLE_ARENA_ABI,
    functionName: 'getUserBattles',
    args: address ? [address] : undefined,
  });

  if (!address) {
    return (
      <div className="relative min-h-screen">
        <ArenaBackground />
        <div className="relative z-10">
          {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
          <div className="text-center py-20">
            <p className="text-white text-2xl drop-shadow-lg">Connect your wallet to enter the arena</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ArenaBackground />
      <div className="relative z-10">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <h2 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">⚔️ Battle Arena</h2>

        <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('challenge')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'challenge'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Challenge Standby Dragons
        </button>
        <button
          onClick={() => setActiveTab('mybattles')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'mybattles'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          My Battles ({myBattles?.length || 0})
        </button>
      </div>

      {activeTab === 'challenge' ? (
        <ChallengeView
          dragonContract={dragonContract}
          battleContract={battleContract}
          myDragons={myDragons || []}
          selectedDragon={selectedDragon}
          setSelectedDragon={setSelectedDragon}
        />
      ) : (
        <MyBattlesView
          battleContract={battleContract}
          battleIds={myBattles || []}
          userAddress={address}
        />
      )}
      </div>
    </div>
  );
}

function ChallengeView({
  dragonContract,
  battleContract,
  myDragons,
  selectedDragon,
  setSelectedDragon,
}: {
  dragonContract: `0x${string}`;
  battleContract: `0x${string}`;
  myDragons: readonly bigint[];
  selectedDragon: bigint | null;
  setSelectedDragon: (id: bigint | null) => void;
}) {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleChallenge = (opponentId: bigint) => {
    if (!selectedDragon) return;

    writeContract({
      address: battleContract,
      abi: BATTLE_ARENA_ABI,
      functionName: 'initiateBattle',
      args: [selectedDragon, opponentId],
    });
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-lg p-6 mb-6 border border-red-500/30">
        <h3 className="text-xl font-bold mb-4">How P2P Battles Work</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Players can set their dragons on "Standby" mode</li>
          <li>• Challenge any standby dragon - no need for opponent to be online!</li>
          <li>• Battle simulation considers attack, defense, speed, and element advantages</li>
          <li>• Winners earn experience points to level up their dragons</li>
          <li>• Fire {'>'} Earth {'>'} Air {'>'} Water {'>'} Fire (element advantage cycle)</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Select Your Dragon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myDragons.map((dragonId) => (
            <DragonBattleCard
              key={dragonId.toString()}
              dragonId={dragonId}
              contractAddress={dragonContract}
              selected={selectedDragon === dragonId}
              onSelect={() => setSelectedDragon(dragonId)}
            />
          ))}
        </div>
      </div>

      {selectedDragon && (
        <div>
          <h3 className="font-semibold mb-3">Available Opponents (Standby Dragons)</h3>
          <div className="text-gray-400 text-center py-8">
            <p>Standby dragons will appear here</p>
            <p className="text-sm mt-2">Set your dragons to standby to appear for others!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MyBattlesView({
  battleContract,
  battleIds,
  userAddress,
}: {
  battleContract: `0x${string}`;
  battleIds: readonly bigint[];
  userAddress: string;
}) {
  if (battleIds.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No battles yet</p>
        <p className="text-gray-500 text-sm mt-2">Challenge standby dragons to start battling!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {battleIds.map((battleId) => (
        <BattleCard
          key={battleId.toString()}
          battleId={battleId}
          contractAddress={battleContract}
          userAddress={userAddress}
        />
      ))}
    </div>
  );
}

function DragonBattleCard({
  dragonId,
  contractAddress,
  selected,
  onSelect,
}: {
  dragonId: bigint;
  contractAddress: `0x${string}`;
  selected: boolean;
  onSelect: () => void;
}) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragon) return null;

  const elementName = ELEMENT_NAMES[dragon.element];
  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];

  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        selected
          ? 'border-red-500 bg-red-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex justify-center mb-2">
        <DragonImage 
          element={dragon.element as 0 | 1 | 2 | 3 | 4 | 5} 
          powerType={dragon.powerType as 0 | 1 | 2} 
          size={80} 
        />
      </div>
      <div className="font-bold text-center">{dragon.name}</div>
      <div className="text-sm text-center" style={{ color: elementColor }}>
        {elementName} • Lv. {dragon.level}
      </div>
      <div className="flex gap-2 text-xs text-gray-400 mt-2 justify-center">
        <span>ATK: {dragon.attack}</span>
        <span>DEF: {dragon.defense}</span>
        <span>SPD: {dragon.speed}</span>
      </div>
    </button>
  );
}

function BattleCard({
  battleId,
  contractAddress,
  userAddress,
}: {
  battleId: bigint;
  contractAddress: `0x${string}`;
  userAddress: string;
}) {
  const chainId = useChainId();
  const dragonContract = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220
    ? CONTRACTS.celo.dragonNFT
    : CONTRACTS.localhost.dragonNFT;

  const { data: battle } = useReadContract({
    address: contractAddress,
    abi: BATTLE_ARENA_ABI,
    functionName: 'getBattle',
    args: [battleId],
  }) as { data: Battle | undefined };

  // Read both dragons for battle simulation
  const { data: challengerDragon } = useReadContract({
    address: dragonContract,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: battle ? [battle.challengerDragonId] : undefined,
  }) as { data: Dragon | undefined };

  const { data: opponentDragon } = useReadContract({
    address: dragonContract,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: battle ? [battle.opponentDragonId] : undefined,
  }) as { data: Dragon | undefined };

  const { writeContract } = useWriteContract();

  if (!battle) return null;

  const isChallenger = battle.challenger.toLowerCase() === userAddress.toLowerCase();
  const canExecute = !battle.completed && challengerDragon && opponentDragon;

  const handleExecute = async () => {
    if (!challengerDragon || !opponentDragon || !battle) return;

    // Simulate battle off-chain
    const { simulateBattle } = await import('@/lib/battleSimulator');
    const result = simulateBattle(
      challengerDragon,
      opponentDragon,
      battle.challenger,
      battle.opponent
    );

    // Submit result on-chain
    writeContract({
      address: contractAddress,
      abi: BATTLE_ARENA_ABI,
      functionName: 'submitBattleResult',
      args: [battleId, result.winner as `0x${string}`, BigInt(result.expGained)],
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-bold">Battle #{battleId.toString()}</div>
          <div className="text-sm text-gray-400">
            {isChallenger ? 'You challenged' : 'You were challenged'}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          battle.completed ? 'bg-gray-700 text-gray-300' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {battle.completed ? 'Completed' : 'Pending'}
        </div>
      </div>

      {canExecute && (
        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-2 text-center">Battle Preview</div>
          <div className="flex justify-around items-center gap-4">
            <div className="text-center">
              <div className="mb-2">⚔️</div>
              <div className="text-xs text-gray-300">Challenger</div>
            </div>
            <div className="text-2xl">VS</div>
            <div className="text-center">
              <div className="mb-2">🛡️</div>
              <div className="text-xs text-gray-300">Defender</div>
            </div>
          </div>
          <div className="text-xs text-center text-gray-500 mt-2">
            Dragons will transform during battle!
          </div>
        </div>
      )}

      {battle.completed && battle.winner && (
        <div className={`p-3 rounded ${
          battle.winner.toLowerCase() === userAddress.toLowerCase()
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {battle.winner.toLowerCase() === userAddress.toLowerCase() ? '🏆 Victory!' : '💔 Defeat'}
          {battle.expReward > 0 && <span className="ml-2">+{battle.expReward.toString()} EXP</span>}
        </div>
      )}

      {canExecute && (
        <button
          onClick={handleExecute}
          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg font-bold hover:from-red-600 hover:to-orange-700 transition-all"
        >
          ⚔️ Execute Battle (Dragons Transform!)
        </button>
      )}
    </div>
  );
}
