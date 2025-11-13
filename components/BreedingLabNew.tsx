'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, POWER_TYPE_NAMES, Element, PowerType } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { DragonGameEngine, DragonStats } from '@/lib/game/DragonEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface BreedingLabProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function BreedingLab({ onBack, showNavigation = false }: BreedingLabProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [parent1, setParent1] = useState<bigint | null>(null);
  const [parent2, setParent2] = useState<bigint | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);
  const [breedingProgress, setBreedingProgress] = useState(0);
  const [predictedOffspring, setPredictedOffspring] = useState<any>(null);
  const [showCardSelect, setShowCardSelect] = useState<'parent1' | 'parent2' | null>(null);

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

  const { data: dragon1Data } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: parent1 ? [parent1] : undefined,
  }) as { data: Dragon | undefined };

  const { data: dragon2Data } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: parent2 ? [parent2] : undefined,
  }) as { data: Dragon | undefined };

  // Predict offspring when both parents selected
  useEffect(() => {
    if (dragon1Data && dragon2Data) {
      const offspring = predictBreedingResult(dragon1Data, dragon2Data);
      setPredictedOffspring(offspring);
    } else {
      setPredictedOffspring(null);
    }
  }, [dragon1Data, dragon2Data]);

  // Breeding simulation
  useEffect(() => {
    if (isBreeding) {
      const interval = setInterval(() => {
        setBreedingProgress((prev) => {
          if (prev >= 100) {
            setIsBreeding(false);
            handleBreedingComplete();
            return 0;
          }
          return prev + 1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isBreeding]);

  const predictBreedingResult = (parent1: Dragon, parent2: Dragon) => {
    // Element inheritance - 50% chance from each parent or rare hybrid
    const elementOptions = [parent1.element, parent2.element];
    const element = elementOptions[Math.floor(Math.random() * elementOptions.length)];
    
    // Power type - inherit higher rarity with slight chance of upgrade
    const higherPower = Math.max(parent1.powerType, parent2.powerType);
    const upgradChance = Math.random();
    let powerType = higherPower;
    if (upgradChance < 0.1 && higherPower < 2) {
      powerType = higherPower + 1; // 10% chance to upgrade rarity
    }

    // Stats - average of parents + random bonus
    const avgLevel = Math.floor((Number(parent1.level) + Number(parent2.level)) / 2);
    
    return {
      element,
      powerType,
      level: 1, // Babies always start at level 1
      parentLevel: avgLevel,
      chanceUpgrade: upgradChance < 0.1
    };
  };

  const handleBreedingComplete = () => {
    alert('🥚 Breeding successful! Check your collection for the new dragon!');
    setParent1(null);
    setParent2(null);
    setPredictedOffspring(null);
  };

  const startBreeding = () => {
    if (!parent1 || !parent2) return;
    setIsBreeding(true);
    setBreedingProgress(0);
  };

  if (!address) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden"
        style={{
          backgroundImage: 'url(https://png.pngtree.com/thumb_back/fw800/background/20240104/pngtree-cartoon-dirt-ground-layer-fun-game-texture-for-level-design-image_13880734.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="fixed top-4 left-4 z-50 px-4 py-2 bg-white/20 backdrop-blur-md text-white font-bold rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
          >
            ← Back
          </button>
        )}
        
        <div className="flex items-center justify-center h-full">
          <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-12 border-4 border-pink-500/50 text-center">
            <div className="text-8xl mb-6 animate-pulse">🧬</div>
            <p className="text-white text-3xl font-bold drop-shadow-lg">Connect Wallet</p>
            <p className="text-pink-300 mt-3 text-lg">Start breeding powerful dragons!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{
        backgroundImage: 'url(https://png.pngtree.com/thumb_back/fw800/background/20240104/pngtree-cartoon-dirt-ground-layer-fun-game-texture-for-level-design-image_13880734.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-pink-900/30 to-transparent" />

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-gradient-to-r from-pink-900/80 to-purple-900/80 border-b border-white/20 shadow-lg"
        style={{ height: '60px' }}>
        <div className="h-full px-6 flex justify-between items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
            >
              ← Back to Village
            </button>
          )}
          <h1 className="text-2xl font-bold text-white drop-shadow-lg flex items-center gap-3">
            💕 Breeding Cave 🧬
          </h1>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold text-white">
              <span className="text-yellow-300">✨ Breed Count:</span> {isBreeding ? '⏳' : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Breeding Area - Landscape Layout */}
      <div className="relative w-full h-full pt-[60px] overflow-hidden">
        <div className="flex items-center justify-center h-full px-8">
          
          {/* LEFT PARENT - Parent 1 */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-md">
            <AnimatePresence mode="wait">
              {parent1 && dragon1Data ? (
                <motion.div
                  key="parent1-selected"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="relative"
                >
                  {/* Nest for Parent 1 */}
                  <img src="/assets/breeding/nest.svg" alt="Nest" className="w-64 h-48 mb-4" />
                  
                  {/* Dragon on nest */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2">
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: isBreeding ? [0, -5, 5, 0] : 0
                      }}
                      transition={{ 
                        duration: isBreeding ? 0.5 : 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="relative">
                        <DragonImage 
                          element={dragon1Data.element as unknown as Element} 
                          powerType={dragon1Data.powerType as unknown as PowerType} 
                          size={120}
                        />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Dragon Info Card */}
                  <div className="mt-32 bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-lg rounded-2xl p-4 border-2 border-blue-400/50 shadow-2xl">
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: ELEMENT_COLORS[dragon1Data.element as keyof typeof ELEMENT_COLORS] }}>
                        {ELEMENT_NAMES[dragon1Data.element]}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">Level {dragon1Data.level.toString()}</div>
                      <div className="text-xs text-yellow-400 mt-1">{POWER_TYPE_NAMES[dragon1Data.powerType]}</div>
                      <button
                        onClick={() => setParent1(null)}
                        className="mt-3 px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="parent1-empty"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowCardSelect('parent1')}
                  className="bg-gradient-to-br from-blue-600/50 to-blue-800/50 backdrop-blur-lg border-4 border-dashed border-blue-400 rounded-3xl p-12 hover:border-blue-300 transition-all shadow-2xl"
                >
                  <div className="text-8xl mb-4">🐉</div>
                  <div className="text-white text-2xl font-bold">Select Parent 1</div>
                  <div className="text-blue-200 text-sm mt-2">Click to choose dragon</div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* CENTER - Breeding Result */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-lg px-8">
            <AnimatePresence mode="wait">
              {isBreeding ? (
                <motion.div
                  key="breeding"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  {/* Hearts animation during breeding */}
                  <img src="/assets/breeding/hearts.svg" alt="Hearts" className="w-48 h-48 mb-4" />
                  
                  {/* Progress bar */}
                  <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border-2 border-pink-500">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">💝</div>
                      <p className="text-pink-400 font-bold text-xl">Breeding Magic...</p>
                    </div>
                    <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${breedingProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-center text-white font-bold mt-3 text-lg">{breedingProgress}%</p>
                  </div>
                </motion.div>
              ) : predictedOffspring ? (
                <motion.div
                  key="prediction"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="relative"
                >
                  {/* Egg incubator */}
                  <img src="/assets/breeding/egg-incubator.svg" alt="Incubator" className="w-64 h-64 mb-4" />
                  
                  {/* Prediction info */}
                  <div className="bg-gradient-to-br from-pink-900/90 to-purple-900/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-pink-400/50 shadow-2xl">
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold mb-3 text-lg">🔮 Predicted Offspring</div>
                      <div className="text-2xl font-bold mb-2" style={{ color: ELEMENT_COLORS[predictedOffspring.element as keyof typeof ELEMENT_COLORS] }}>
                        {ELEMENT_NAMES[predictedOffspring.element]}
                      </div>
                      <div className="text-sm text-gray-300">{POWER_TYPE_NAMES[predictedOffspring.powerType]}</div>
                      {predictedOffspring.chanceUpgrade && (
                        <div className="mt-2 px-3 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-sm font-bold">
                          ✨ Rarity Upgrade! ✨
                        </div>
                      )}
                      
                      {/* Breed Button */}
                      <button
                        onClick={startBreeding}
                        className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg"
                      >
                        💕 Start Breeding
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-9xl mb-6 opacity-30">❓</div>
                  <div className="text-white/50 text-xl font-bold">Select Both Parents</div>
                  <div className="text-white/30 text-sm mt-2">To see breeding prediction</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PARENT - Parent 2 */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-md">
            <AnimatePresence mode="wait">
              {parent2 && dragon2Data ? (
                <motion.div
                  key="parent2-selected"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  className="relative"
                >
                  {/* Nest for Parent 2 */}
                  <img src="/assets/breeding/nest.svg" alt="Nest" className="w-64 h-48 mb-4" />
                  
                  {/* Dragon on nest */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2">
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: isBreeding ? [0, 5, -5, 0] : 0
                      }}
                      transition={{ 
                        duration: isBreeding ? 0.5 : 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="relative">
                        <DragonImage 
                          element={dragon2Data.element as unknown as Element} 
                          powerType={dragon2Data.powerType as unknown as PowerType} 
                          size={120}
                        />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Dragon Info Card */}
                  <div className="mt-32 bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-2xl p-4 border-2 border-purple-400/50 shadow-2xl">
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: ELEMENT_COLORS[dragon2Data.element as keyof typeof ELEMENT_COLORS] }}>
                        {ELEMENT_NAMES[dragon2Data.element]}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">Level {dragon2Data.level.toString()}</div>
                      <div className="text-xs text-yellow-400 mt-1">{POWER_TYPE_NAMES[dragon2Data.powerType]}</div>
                      <button
                        onClick={() => setParent2(null)}
                        className="mt-3 px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="parent2-empty"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowCardSelect('parent2')}
                  className="bg-gradient-to-br from-purple-600/50 to-purple-800/50 backdrop-blur-lg border-4 border-dashed border-purple-400 rounded-3xl p-12 hover:border-purple-300 transition-all shadow-2xl"
                >
                  <div className="text-8xl mb-4">🐉</div>
                  <div className="text-white text-2xl font-bold">Select Parent 2</div>
                  <div className="text-purple-200 text-sm mt-2">Click to choose dragon</div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Dragon Selection Popup Modal */}
      <AnimatePresence>
        {showCardSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCardSelect(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border-4 border-yellow-400/50 shadow-2xl max-w-4xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">
                  Select {showCardSelect === 'parent1' ? 'Parent 1' : 'Parent 2'} 🐉
                </h2>
                <button
                  onClick={() => setShowCardSelect(null)}
                  className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full text-white font-bold text-xl"
                >
                  ✕
                </button>
              </div>
              
              {userDragons && (userDragons as bigint[]).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(userDragons as bigint[])
                    .filter((id: bigint) => {
                      const excludeId = showCardSelect === 'parent1' ? parent2 : parent1;
                      return !excludeId || id !== excludeId;
                    })
                    .map((dragonId: bigint) => (
                      <DragonSelectCard
                        key={dragonId.toString()}
                        dragonId={dragonId}
                        contractAddress={contractAddress}
                        onSelect={(id: bigint) => {
                          if (showCardSelect === 'parent1') {
                            setParent1(id);
                          } else {
                            setParent2(id);
                          }
                          setShowCardSelect(null);
                        }}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">🐉</div>
                  <p className="text-white/70 text-xl">No dragons available</p>
                  <p className="text-white/50 text-sm mt-2">Get some dragons first!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dragon Selection Component - REMOVED (now using popup modal)

// Dragon Select Card - Enhanced with Clash of Clans style
function DragonSelectCard({ dragonId, contractAddress, onSelect }: { 
  dragonId: bigint; 
  contractAddress: string; 
  onSelect: (id: bigint) => void 
}) {
  const { data: dragon } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragon) return null;

  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];

  return (
    <motion.button
      onClick={() => onSelect(dragonId)}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border-2 border-yellow-600/50 hover:border-yellow-400 transition-all shadow-xl overflow-hidden"
    >
      {/* Card glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      
      {/* Rarity badge */}
      <div className="absolute top-2 right-2 bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full">
        {POWER_TYPE_NAMES[dragon.powerType]}
      </div>
      
      {/* Dragon image */}
      <div className="relative z-10 flex justify-center mb-3">
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-3">
          <DragonImage element={dragon.element as unknown as Element} powerType={dragon.powerType as unknown as PowerType} size={80} />
        </div>
      </div>
      
      {/* Dragon info */}
      <div className="relative z-10 text-center">
        <div className="text-lg font-bold mb-1" style={{ color: elementColor }}>
          {ELEMENT_NAMES[dragon.element]}
        </div>
        <div className="text-sm text-gray-400">Level {dragon.level.toString()}</div>
      </div>
      
      {/* Selection indicator */}
      <div className="mt-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-sm font-bold">
        Select Dragon
      </div>
    </motion.button>
  );
}

// REMOVED: ParentDisplay - integrated into main component
// REMOVED: OffspringPreview - integrated into main component
// REMOVED: DragonSelection - replaced with popup modal
