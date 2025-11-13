'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, Element, PowerType } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { DragonGameEngine, DragonStats } from '@/lib/game/DragonEngine';
import { motion, AnimatePresence } from 'framer-motion';
import VillageNavigation from './VillageNavigation';
import { soundManager } from '@/lib/soundManager';

interface DragonTrainingProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function DragonTraining({ onBack, showNavigation = false }: DragonTrainingProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [trainingType, setTrainingType] = useState<'quick' | 'intensive' | 'extreme'>('quick');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [dragonStats, setDragonStats] = useState<Map<string, DragonStats>>(new Map());

  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220 
    ? CONTRACTS.celo.dragonNFT 
    : CONTRACTS.localhost.dragonNFT;

  const { data: userDragons } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  });

  const { data: selectedDragonData } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: selectedDragon ? [selectedDragon] : undefined,
  }) as { data: Dragon | undefined };

  useEffect(() => {
    if (selectedDragonData && !dragonStats.has(selectedDragonData.id.toString())) {
      const stats = DragonGameEngine.calculateStats(
        selectedDragonData, 
        Number(selectedDragonData.level) || 1
      );
      setDragonStats(new Map(dragonStats.set(selectedDragonData.id.toString(), stats)));
    }
  }, [selectedDragonData]);

  // Training simulation
  useEffect(() => {
    if (isTraining) {
      const interval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 100) {
            setIsTraining(false);
            handleTrainingComplete();
            return 0;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTraining]);

  const handleTrainingComplete = () => {
    if (!selectedDragonData) return;
    
    soundManager.play('training_complete', 1.0);
    
    // Calculate EXP gain based on training type
    const expGain = trainingType === 'quick' ? 50 : trainingType === 'intensive' ? 100 : 200;
    const currentStats = dragonStats.get(selectedDragonData.id.toString());
    
    if (currentStats) {
      const { leveledUp, newStats } = DragonGameEngine.checkLevelUp(currentStats, expGain);
      
      if (leveledUp && newStats) {
        soundManager.play('level_up', 1.0);
        setDragonStats(new Map(dragonStats.set(selectedDragonData.id.toString(), newStats)));
        // Show level up animation
        alert(`🎉 Level Up! Your dragon is now level ${newStats.level}!`);
      } else {
        const updatedStats = { ...currentStats, exp: currentStats.exp + expGain };
        setDragonStats(new Map(dragonStats.set(selectedDragonData.id.toString(), updatedStats)));
      }
    }
  };

  const startTraining = () => {
    if (!selectedDragon) return;
    soundManager.play('training_start', 0.8);
    setIsTraining(true);
    setTrainingProgress(0);
  };

  if (!address) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-orange-900 via-red-900 to-gray-900">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <div className="text-8xl mb-6 animate-bounce">🏋️</div>
          <p className="text-white text-2xl font-bold drop-shadow-lg">Connect your wallet to train dragons</p>
          <p className="text-gray-400 mt-2">Build strength and level up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-orange-900 via-red-900 to-gray-900">
      <div className="min-h-full p-4 sm:p-6">
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white drop-shadow-lg mb-2">🏋️ Training Dojo</h2>
        <p className="text-yellow-400 text-lg">Train your dragons to gain experience and level up!</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dragon Selection */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-orange-500/30">
          <h3 className="text-2xl font-bold text-orange-400 mb-4">🐉 Select Dragon</h3>
          {!userDragons || userDragons.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-lg">No dragons available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {userDragons.map((dragonId: bigint) => (
                <DragonSelector
                  key={dragonId.toString()}
                  dragonId={dragonId}
                  isSelected={selectedDragon === dragonId}
                  onClick={() => setSelectedDragon(dragonId)}
                  contractAddress={contractAddress}
                  dragonStats={dragonStats}
                  setDragonStats={setDragonStats}
                />
              ))}
            </div>
          )}
        </div>

        {/* Training Center */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-red-500/30">
          <h3 className="text-2xl font-bold text-red-400 mb-4">💪 Training Program</h3>
          
          {!selectedDragonData ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">👈</div>
              <p className="text-lg">Select a dragon to start training</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Dragon Info */}
              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/30">
                <div className="flex items-center gap-4">
                  <DragonImage 
                    element={selectedDragonData.element as Element} 
                    powerType={selectedDragonData.powerType as PowerType} 
                    size={80}
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">
                      {ELEMENT_NAMES[selectedDragonData.element]} Dragon
                    </h4>
                    {dragonStats.get(selectedDragonData.id.toString()) && (
                      <div className="text-sm text-gray-300 mt-1">
                        <div>Level {dragonStats.get(selectedDragonData.id.toString())!.level}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                              style={{ 
                                width: `${(dragonStats.get(selectedDragonData.id.toString())!.exp / 
                                         dragonStats.get(selectedDragonData.id.toString())!.expToNextLevel) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-purple-400 whitespace-nowrap">
                            {dragonStats.get(selectedDragonData.id.toString())!.exp} / 
                            {dragonStats.get(selectedDragonData.id.toString())!.expToNextLevel} EXP
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Training Types */}
              <div className="space-y-3">
                <TrainingOption
                  type="quick"
                  title="Quick Training"
                  duration="5 seconds"
                  exp={50}
                  cost={0}
                  icon="🏃"
                  selected={trainingType === 'quick'}
                  onClick={() => setTrainingType('quick')}
                  disabled={isTraining}
                />
                <TrainingOption
                  type="intensive"
                  title="Intensive Training"
                  duration="5 seconds"
                  exp={100}
                  cost={0}
                  icon="💪"
                  selected={trainingType === 'intensive'}
                  onClick={() => setTrainingType('intensive')}
                  disabled={isTraining}
                />
                <TrainingOption
                  type="extreme"
                  title="Extreme Training"
                  duration="5 seconds"
                  exp={200}
                  cost={0}
                  icon="🔥"
                  selected={trainingType === 'extreme'}
                  onClick={() => setTrainingType('extreme')}
                  disabled={isTraining}
                />
              </div>

              {/* Training Progress */}
              {isTraining && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-orange-900/50 to-red-900/50 rounded-xl p-4 border border-orange-500"
                >
                  <div className="text-center mb-3">
                    <div className="text-4xl animate-bounce mb-2">💦</div>
                    <p className="text-yellow-400 font-bold">Training in Progress...</p>
                  </div>
                  <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${trainingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-300 mt-2">{trainingProgress}%</p>
                </motion.div>
              )}

              {/* Start Button */}
              <button
                onClick={startTraining}
                disabled={isTraining}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-lg rounded-lg hover:from-orange-500 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isTraining ? '🏋️ Training...' : '🏋️ Start Training'}
              </button>

              {/* Stats Preview */}
              {dragonStats.get(selectedDragonData.id.toString()) && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-yellow-400 font-bold mb-3">📊 Current Stats</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <StatDisplay label="HP" value={dragonStats.get(selectedDragonData.id.toString())!.hp} icon="❤️" />
                    <StatDisplay label="Attack" value={dragonStats.get(selectedDragonData.id.toString())!.attack} icon="⚔️" />
                    <StatDisplay label="Defense" value={dragonStats.get(selectedDragonData.id.toString())!.defense} icon="🛡️" />
                    <StatDisplay label="Speed" value={dragonStats.get(selectedDragonData.id.toString())!.speed} icon="⚡" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// Dragon Selector Component
function DragonSelector({ 
  dragonId, 
  isSelected, 
  onClick, 
  contractAddress,
  dragonStats,
  setDragonStats
}: any) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  useEffect(() => {
    if (dragon && !dragonStats.has(dragon.id.toString())) {
      const stats = DragonGameEngine.calculateStats(dragon, Number(dragon.level) || 1);
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
          ? 'bg-gradient-to-br from-orange-600 to-red-600 border-2 border-yellow-400 shadow-2xl'
          : 'bg-gray-700/50 hover:bg-gray-600/50 border-2 border-gray-600'
      }`}
    >
      <div className="flex flex-col items-center">
        <DragonImage element={dragon.element as Element} powerType={dragon.powerType as PowerType} size={60} />
        <div className="text-xs text-white mt-2 text-center">
          <div className="font-bold" style={{ color: elementColor }}>
            {ELEMENT_NAMES[dragon.element]}
          </div>
          {stats && (
            <div className="text-gray-300 mt-1">
              <div>Lv.{stats.level}</div>
              <div>{stats.exp} EXP</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Training Option Component
function TrainingOption({ 
  type, 
  title, 
  duration, 
  exp, 
  cost, 
  icon, 
  selected, 
  onClick, 
  disabled 
}: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-xl transition-all transform hover:scale-105 text-left ${
        selected
          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 border-2 border-yellow-400 shadow-lg'
          : 'bg-gray-700/50 hover:bg-gray-600/50 border-2 border-gray-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center gap-3">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <div className="font-bold text-white text-lg">{title}</div>
          <div className="text-xs text-gray-300 mt-1">
            <div>⏱️ Duration: {duration}</div>
            <div>⭐ EXP Gain: +{exp}</div>
            {cost > 0 && <div>💰 Cost: {cost} gold</div>}
          </div>
        </div>
      </div>
    </button>
  );
}

// Stat Display Component
function StatDisplay({ label, value, icon }: any) {
  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-lg p-2">
      <span className="text-gray-400 text-xs flex items-center gap-1">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}
