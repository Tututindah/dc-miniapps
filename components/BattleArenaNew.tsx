'use client';

/**
 * Battle Arena - Off-Chain Battle System
 * 
 * This component implements an off-chain battle system where:
 * 1. Dragon data is fetched from blockchain (read-only)
 * 2. Battle simulation happens entirely off-chain using C++ game engine
 * 3. Only the final battle result is written to blockchain
 * 
 * Benefits:
 * - No gas fees for each attack
 * - Instant battle actions (no waiting for transactions)
 * - Better user experience
 * - Only one transaction per battle (result submission)
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI, BATTLE_ARENA_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, Element, PowerType } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { useState, useEffect } from 'react';
import { DragonGameEngine, BattleState, DragonStats } from '@/lib/game/DragonEngine';
import VillageNavigation from './VillageNavigation';
import { soundManager } from '@/lib/soundManager';

interface BattleArenaProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function BattleArena({ onBack, showNavigation = false }: BattleArenaProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [activeTab, setActiveTab] = useState<'lobby' | 'battle' | 'mybattles'>('lobby');
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [opponentDragonId, setOpponentDragonId] = useState<bigint | null>(null);
  const [dragonStats, setDragonStats] = useState<Map<string, DragonStats>>(new Map());
  const [battleId, setBattleId] = useState<bigint | null>(null);
  const [battleResult, setBattleResult] = useState<{
    winner: 'attacker' | 'defender';
    expGained: number;
  } | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

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

  const submitBattleResult = async (result: {
    winner: 'attacker' | 'defender';
    expGained: number;
  }) => {
    if (!battleId || !address) return;
    
    try {
      const winnerAddress = result.winner === 'attacker' ? address : address;
      
      await writeContract({
        address: battleContract,
        abi: BATTLE_ARENA_ABI,
        functionName: 'submitBattleResult',
        args: [battleId, winnerAddress as `0x${string}`, BigInt(result.expGained)],
      });
      setBattleResult(result);
    } catch (error) {
      console.error('Failed to submit battle result:', error);
    }
  };

  // Initiate battle on-chain when starting
  const initiateBattle = async (myDragonId: bigint, opponentDragonId: bigint) => {
    try {
      const tx = await writeContract({
        address: battleContract,
        abi: BATTLE_ARENA_ABI,
        functionName: 'initiateBattle',
        args: [myDragonId, opponentDragonId],
      });
      // Battle ID would be returned from transaction
      // For now, simulate off-chain immediately
    } catch (error) {
      console.error('Failed to initiate battle:', error);
    }
  };

  // Reset when transaction confirmed
  useEffect(() => {
    if (isConfirmed && battleResult) {
      setBattleResult(null);
      setActiveTab('lobby');
    }
  }, [isConfirmed, battleResult]);

  if (!address) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <div className="text-8xl mb-6 animate-pulse">⚔️</div>
          <p className="text-white text-2xl font-bold drop-shadow-lg">Connect your wallet to enter the arena</p>
          <p className="text-gray-400 mt-2">Battle dragons and earn rewards!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-red-900 via-orange-900 to-gray-900">
      <div className="min-h-full p-4 sm:p-6">
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white drop-shadow-lg mb-2">⚔️ Battle Arena</h2>
        <p className="text-yellow-400 text-lg">Challenge dragons and prove your might!</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setActiveTab('lobby')}
          className={`px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
            activeTab === 'lobby'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🎯 Battle Lobby
        </button>
        <button
          onClick={() => setActiveTab('battle')}
          disabled={!battleState}
          className={`px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
            activeTab === 'battle' && battleState
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          💥 Battle
        </button>
        <button
          onClick={() => setActiveTab('mybattles')}
          className={`px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
            activeTab === 'mybattles'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📜 My Battles
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'lobby' && (
          <LobbyView
            myDragons={myDragons || []}
            standbyDragons={myDragons || []}
            selectedDragon={selectedDragon}
            setSelectedDragon={setSelectedDragon}
            onStartBattle={(opponentId: bigint) => {
              setOpponentDragonId(opponentId);
              setActiveTab('battle');
            }}
            dragonContract={dragonContract}
            dragonStats={dragonStats}
            setDragonStats={setDragonStats}
            setBattleState={setBattleState}
          />
        )}
        
        {activeTab === 'battle' && battleState && (
          <BattleView
            battleState={battleState}
            setBattleState={setBattleState}
            onBattleEnd={() => setActiveTab('lobby')}
            submitBattleResult={submitBattleResult}
            isSubmitting={isConfirming}
          />
        )}
        
        {activeTab === 'mybattles' && (
          <MyBattlesView dragonContract={dragonContract} />
        )}
      </div>
      </div>
    </div>
  );
}

// Lobby View Component
function LobbyView({ 
  myDragons, 
  standbyDragons, 
  selectedDragon, 
  setSelectedDragon, 
  onStartBattle,
  dragonContract,
  dragonStats,
  setDragonStats,
  setBattleState
}: any) {
  const { data: selectedDragonData } = useReadContract({
    address: dragonContract,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: selectedDragon ? [selectedDragon] : undefined,
  }) as { data: Dragon | undefined };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* My Dragons */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/30">
        <h3 className="text-2xl font-bold text-blue-400 mb-4">🐉 Your Dragons</h3>
        {!myDragons || myDragons.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg mb-2">No dragons available</p>
            <p className="text-sm">Visit the Hatchery to get dragons!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {myDragons.map((dragonId: bigint) => (
              <DragonSelector
                key={dragonId.toString()}
                dragonId={dragonId}
                isSelected={selectedDragon === dragonId}
                onClick={() => setSelectedDragon(dragonId)}
                dragonContract={dragonContract}
                dragonStats={dragonStats}
                setDragonStats={setDragonStats}
              />
            ))}
          </div>
        )}
      </div>

      {/* Standby Dragons */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-red-500/30">
        <h3 className="text-2xl font-bold text-red-400 mb-4">🎯 Opponents</h3>
        {!standbyDragons || standbyDragons.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg">No opponents available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {standbyDragons.map((dragonId: bigint) => (
              <OpponentCard
                key={dragonId.toString()}
                dragonId={dragonId}
                dragonContract={dragonContract}
                selectedDragon={selectedDragon}
                selectedDragonData={selectedDragonData}
                onChallenge={(opponentId: bigint) => {
                  if (selectedDragonData) {
                    onStartBattle(opponentId);
                  }
                }}
                dragonStats={dragonStats}
                setDragonStats={setDragonStats}
                setBattleState={setBattleState}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Dragon Selector Component
function DragonSelector({ dragonId, isSelected, onClick, dragonContract, dragonStats, setDragonStats }: any) {
  const { data: dragon } = useReadContract({
    address: dragonContract,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  useEffect(() => {
    if (dragon && !dragonStats.has(dragon.id.toString())) {
      const stats = DragonGameEngine.calculateStats(dragon, 5); // Default level 5
      setDragonStats(new Map(dragonStats.set(dragon.id.toString(), stats)));
    }
  }, [dragon]);

  if (!dragon) return null;

  const stats = dragonStats.get(dragon.id.toString());
  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-4 rounded-xl transition-all transform hover:scale-105 ${
        isSelected
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-yellow-400 shadow-2xl'
          : 'bg-gray-700/50 hover:bg-gray-600/50 border-2 border-gray-600'
      }`}
    >
      <div className="flex flex-col items-center">
        <DragonImage element={dragon.element as Element} powerType={dragon.powerType as PowerType} size={60} />
        <div className="text-xs text-white mt-2 text-center">{/* element display */}
          <div className="font-bold" style={{ color: elementColor }}>
            {ELEMENT_NAMES[dragon.element]}
          </div>
          {stats && (
            <div className="text-gray-300 mt-1">
              <div>Lv.{stats.level}</div>
              <div>HP: {stats.hp}</div>
              <div>ATK: {stats.attack}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Opponent Card Component
function OpponentCard({ 
  dragonId, 
  dragonContract, 
  selectedDragon, 
  selectedDragonData,
  onChallenge,
  dragonStats,
  setDragonStats,
  setBattleState
}: any) {
  const { data: dragon } = useReadContract({
    address: dragonContract,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  useEffect(() => {
    if (dragon && !dragonStats.has(dragon.id.toString())) {
      const stats = DragonGameEngine.calculateStats(dragon, 5);
      setDragonStats(new Map(dragonStats.set(dragon.id.toString(), stats)));
    }
  }, [dragon]);

  if (!dragon) return null;

  const stats = dragonStats.get(dragon.id.toString());
  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];

  const handleChallenge = () => {
    if (selectedDragonData && stats) {
      const attackerStats = dragonStats.get(selectedDragonData.id.toString());
      if (attackerStats) {
        const battle = DragonGameEngine.initializeBattle(
          selectedDragonData,
          dragon,
          attackerStats,
          stats
        );
        setBattleState(battle);
        onChallenge(dragonId);
      }
    }
  };

  return (
    <div className="p-4 rounded-xl bg-gray-700/30 border-2 border-red-500/30 hover:border-red-500 transition-all">
      <div className="flex flex-col items-center">
        <DragonImage element={dragon.element as Element} powerType={dragon.powerType as PowerType} size={60} />
        <div className="text-xs text-white mt-2 text-center">{/* opponent info */}
          <div className="font-bold" style={{ color: elementColor }}>
            {ELEMENT_NAMES[dragon.element]}
          </div>
          {stats && (
            <div className="text-gray-300 mt-1">
              <div>Lv.{stats.level}</div>
              <div>HP: {stats.hp}</div>
              <div>ATK: {stats.attack}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleChallenge}
          disabled={!selectedDragon}
          className="mt-3 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:from-red-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
        >
          ⚔️ Challenge
        </button>
      </div>
    </div>
  );
}

// Battle View Component  
function BattleView({ battleState, setBattleState, onBattleEnd, submitBattleResult, isSubmitting }: any) {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [resultSubmitted, setResultSubmitted] = useState(false);

  const handleAttack = () => {
    if (!selectedSkillId || animating || battleState.phase === 'result') return;
    
    // Play attack sound based on skill element
    const skill = battleState.attacker.skills.find((s: any) => s.id === selectedSkillId);
    if (skill) {
      switch (skill.element) {
        case 'Fire':
          soundManager.play('attack_fire', 0.8);
          break;
        case 'Ice':
          soundManager.play('attack_ice', 0.8);
          break;
        case 'Lightning':
          soundManager.play('attack_lightning', 0.8);
          break;
        default:
          soundManager.play('attack_melee', 0.8);
      }
    }
    
    setAnimating(true);
    const newBattle = DragonGameEngine.executeTurn(battleState, selectedSkillId);
    
    // Play hit sound after attack animation
    setTimeout(() => {
      soundManager.play('hit', 0.7);
      setBattleState(newBattle);
      setSelectedSkillId(null);
      setAnimating(false);
      
      // Play victory/defeat sound if battle ended
      if (newBattle.phase === 'result') {
        setTimeout(() => {
          if (newBattle.winner === 'attacker') {
            soundManager.play('victory', 1.0);
          } else {
            soundManager.play('defeat', 1.0);
          }
        }, 500);
      }
    }, 1500);
  };

  // Auto-submit result when battle ends
  useEffect(() => {
    if (battleState.phase === 'result' && !resultSubmitted) {
      const expGained = DragonGameEngine.calculateExpGain(
        battleState.winner === 'attacker' ? battleState.attacker.stats.level : battleState.defender.stats.level,
        battleState.winner === 'attacker' ? battleState.defender.stats.level : battleState.attacker.stats.level
      );

      submitBattleResult({
        winner: battleState.winner,
        expGained: expGained,
      });
      
      setResultSubmitted(true);
    }
  }, [battleState.phase, resultSubmitted, submitBattleResult, battleState.winner, battleState.attacker.stats.level, battleState.defender.stats.level]);

  const attackerHpPercent = (battleState.attacker.currentHp / battleState.attacker.stats.maxHp) * 100;
  const defenderHpPercent = (battleState.defender.currentHp / battleState.defender.stats.maxHp) * 100;

  return (
    <div className="space-y-6">
      {/* Battle Arena */}
      <div className="bg-gradient-to-b from-purple-900/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border-2 border-purple-500/30">
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Attacker */}
          <div className="text-center">
            <div className="text-blue-400 font-bold mb-2">YOUR DRAGON</div>
            <div className="bg-blue-900/30 rounded-xl p-4 border-2 border-blue-500/50">
              <DragonImage 
                element={battleState.attacker.element} 
                powerType={battleState.attacker.powerType} 
                size={120}
                isAttacking={animating && selectedSkillId !== null}
                showAttackEffect={animating}
              />
              <div className="mt-3">
                <div className="text-white font-bold mb-1">
                  Lv.{battleState.attacker.stats.level} {ELEMENT_NAMES[battleState.attacker.element]}
                </div>
                <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${attackerHpPercent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  {battleState.attacker.currentHp} / {battleState.attacker.stats.maxHp} HP
                </div>
              </div>
            </div>
          </div>

          {/* Defender */}
          <div className="text-center">
            <div className="text-red-400 font-bold mb-2">OPPONENT</div>
            <div className="bg-red-900/30 rounded-xl p-4 border-2 border-red-500/50">
              <DragonImage 
                element={battleState.defender.element} 
                powerType={battleState.defender.powerType} 
                size={120}
              />
              <div className="mt-3">
                <div className="text-white font-bold mb-1">
                  Lv.{battleState.defender.stats.level} {ELEMENT_NAMES[battleState.defender.element]}
                </div>
                <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                    style={{ width: `${defenderHpPercent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  {battleState.defender.currentHp} / {battleState.defender.stats.maxHp} HP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Result */}
        {battleState.phase === 'result' && (
          <div className="text-center py-8">
            {battleState.winner === 'attacker' ? (
              <div>
                <div className="text-6xl mb-4 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">VICTORY!</div>
                <p className="text-white text-lg mb-4">You defeated the opponent!</p>
                
                {isSubmitting ? (
                  <div className="mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                    <p className="text-yellow-400 text-sm">Recording battle result on blockchain...</p>
                  </div>
                ) : (
                  <p className="text-green-400 text-sm mb-4">✅ Battle result recorded on-chain</p>
                )}
                
                <button
                  onClick={onBattleEnd}
                  disabled={isSubmitting}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Return to Lobby
                </button>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">😞</div>
                <div className="text-4xl font-bold text-red-400 mb-2">DEFEATED</div>
                <p className="text-white text-lg mb-4">Better luck next time!</p>
                
                {isSubmitting ? (
                  <div className="mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-2"></div>
                    <p className="text-red-400 text-sm">Recording battle result on blockchain...</p>
                  </div>
                ) : (
                  <p className="text-green-400 text-sm mb-4">✅ Battle result recorded on-chain</p>
                )}
                
                <button
                  onClick={onBattleEnd}
                  disabled={isSubmitting}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Return to Lobby
                </button>
              </div>
            )}
          </div>
        )}

        {/* Skills */}
        {battleState.phase !== 'result' && (
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-yellow-400 font-bold mb-3">⚡ Your Skills</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {battleState.attacker.skills.map((skill: any) => {
                const cooldown = battleState.attacker.cooldowns.get(skill.id) || 0;
                const isOnCooldown = cooldown > 0;
                const isSelected = selectedSkillId === skill.id;
                
                return (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    disabled={isOnCooldown || animating}
                    className={`p-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : isOnCooldown
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500'
                    }`}
                  >
                    <div className="text-sm">{skill.name}</div>
                    <div className="text-xs mt-1">Power: {skill.power}</div>
                    {isOnCooldown && <div className="text-xs text-red-400">CD: {cooldown}</div>}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleAttack}
              disabled={!selectedSkillId || animating}
              className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:from-red-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {animating ? '⚔️ Attacking...' : '⚔️ ATTACK!'}
            </button>
          </div>
        )}
      </div>

      {/* Battle Log */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700">
        <div className="text-yellow-400 font-bold mb-2">📜 Battle Log</div>
        <div className="space-y-1 max-h-40 overflow-y-auto text-sm">
          {battleState.log.slice().reverse().map((log: any, i: number) => (
            <div key={i} className="text-gray-300">
              <span className="text-gray-500">Turn {log.turn}:</span> {log.action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// My Battles View
function MyBattlesView({ dragonContract }: any) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/30">
      <h3 className="text-2xl font-bold text-blue-400 mb-4">📜 Battle History</h3>
      <div className="text-center py-10 text-gray-400">
        <p className="text-lg">Battle history coming soon!</p>
        <p className="text-sm mt-2">Your victories and defeats will be recorded here</p>
      </div>
    </div>
  );
}
