'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, Element, PowerType } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { motion, AnimatePresence } from 'framer-motion';
import VillageNavigation from './VillageNavigation';
import { soundManager } from '@/lib/soundManager';

// Enhanced Breeding Lab with C++ WASM Engine and Clash of Clans style UI

interface BreedingLabEnhancedProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

interface BreedingResult {
  element: number;
  powerType: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  successRate: number;
}

export default function BreedingLabEnhanced({ onBack, showNavigation = false }: BreedingLabEnhancedProps = {}) {
  const { address } = useAccount();
  const [parent1, setParent1] = useState<bigint | null>(null);
  const [parent2, setParent2] = useState<bigint | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);
  const [breedingProgress, setBreedingProgress] = useState(0);
  const [predictedOffspring, setPredictedOffspring] = useState<BreedingResult | null>(null);
  const [showCardSelection, setShowCardSelection] = useState<'parent1' | 'parent2' | null>(null);
  const [heartAnimation, setHeartAnimation] = useState(false);
  
  // C++ Engine reference
  const engineRef = useRef<any>(null);

  const contractAddress = CONTRACTS.localhost.dragonNFT;

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

  // Load C++ WASM Engine
  useEffect(() => {
    const loadEngine = async () => {
      try {
        let EngineFactory: any = (window as any).DragonCityEngine;
        if (!EngineFactory) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `/wasm/dragon_city.js?v=${Date.now()}`;
            script.async = true;
            script.onload = () => {
              EngineFactory = (window as any).DragonCityEngine;
              if (!EngineFactory) return reject(new Error('DragonCityEngine not found'));
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load WASM'));
            document.head.appendChild(script);
          });
        }

        const wasmModule = await EngineFactory();
        engineRef.current = wasmModule;
        console.log('✅ C++ Breeding Engine loaded');
      } catch (error) {
        console.error('Failed to load C++ engine:', error);
      }
    };

    loadEngine();
  }, []);

  // Predict offspring using C++ engine
  useEffect(() => {
    if (dragon1Data && dragon2Data && engineRef.current) {
      const result = predictBreedingWithCPP(dragon1Data, dragon2Data);
      setPredictedOffspring(result);
    } else {
      setPredictedOffspring(null);
    }
  }, [dragon1Data, dragon2Data]);

  // Breeding animation
  useEffect(() => {
    if (isBreeding) {
      const interval = setInterval(() => {
        setBreedingProgress((prev) => {
          if (prev >= 100) {
            setIsBreeding(false);
            handleBreedingComplete();
            return 0;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isBreeding]);

  const predictBreedingWithCPP = (parent1: Dragon, parent2: Dragon): BreedingResult => {
    if (!engineRef.current) {
      // Fallback to JavaScript calculation
      return {
        element: Math.random() > 0.5 ? parent1.element : parent2.element,
        powerType: Math.max(parent1.powerType, parent2.powerType),
        hp: 100,
        attack: 50,
        defense: 50,
        speed: 50,
        successRate: 0.85
      };
    }

    // Use C++ engine for breeding calculation
    try {
      const GameEngine = engineRef.current.GameEngine;
      const engine = new GameEngine();
      
      // Calculate stats using C++ breeding algorithm
      const p1Stats = engine.calculateStatsSimple(
        Number(parent1.level),
        parent1.element,
        parent1.powerType
      );
      
      const p2Stats = engine.calculateStatsSimple(
        Number(parent2.level),
        parent2.element,
        parent2.powerType
      );

      // Breeding logic
      const element = Math.random() > 0.5 ? parent1.element : parent2.element;
      const powerType = Math.max(parent1.powerType, parent2.powerType);
      
      // Average stats with random variation
      const avgHp = (p1Stats.hp + p2Stats.hp) / 2;
      const avgAttack = (p1Stats.attack + p2Stats.attack) / 2;
      const avgDefense = (p1Stats.defense + p2Stats.defense) / 2;
      const avgSpeed = (p1Stats.speed + p2Stats.speed) / 2;

      const variation = 0.9 + Math.random() * 0.2; // 90% - 110%
      
      // Calculate success rate based on parent compatibility
      const elementCompatibility = parent1.element === parent2.element ? 1.0 : 0.85;
      const levelFactor = Math.min(Number(parent1.level) + Number(parent2.level), 20) / 20;
      const successRate = Math.min(0.95, 0.7 + (elementCompatibility * 0.2) + (levelFactor * 0.05));

      engine.delete();

      return {
        element,
        powerType,
        hp: Math.floor(avgHp * variation),
        attack: Math.floor(avgAttack * variation),
        defense: Math.floor(avgDefense * variation),
        speed: Math.floor(avgSpeed * variation),
        successRate
      };
    } catch (error) {
      console.error('C++ breeding calculation failed:', error);
      return {
        element: parent1.element,
        powerType: parent1.powerType,
        hp: 100,
        attack: 50,
        defense: 50,
        speed: 50,
        successRate: 0.85
      };
    }
  };

  const handleBreedingComplete = () => {
    soundManager.play('hatch_complete', 1.0);
    setHeartAnimation(false);
    alert('🥚 Breeding successful! A new dragon egg is ready to hatch!');
    setParent1(null);
    setParent2(null);
    setPredictedOffspring(null);
  };

  const startBreeding = () => {
    if (!parent1 || !parent2 || !predictedOffspring) return;
    soundManager.play('breeding_start', 0.9);
    setIsBreeding(true);
    setHeartAnimation(true);
    setBreedingProgress(0);
  };

  const selectDragon = (dragonId: bigint, parentSlot: 'parent1' | 'parent2') => {
    if (parentSlot === 'parent1') {
      setParent1(dragonId);
    } else {
      setParent2(dragonId);
    }
    setShowCardSelection(null);
  };

  if (!address) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-purple-900 via-pink-900 to-orange-900">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <div className="text-8xl mb-6 animate-pulse">🧬</div>
          <p className="text-white text-2xl font-bold drop-shadow-lg">Connect Wallet to Access Breeding Lab</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-purple-900 via-pink-900 to-orange-900">
      <div className="min-h-full">
      {showNavigation && <VillageNavigation onBack={onBack} className="absolute top-4 left-4 z-50" />}
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-8 pb-6">
        <motion.h1 
          className="text-4xl sm:text-6xl font-bold text-white drop-shadow-2xl mb-3"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          🧬 Dragon Breeding Laboratory
        </motion.h1>
        <motion.p 
          className="text-yellow-300 text-lg sm:text-xl font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Powered by C++ WebAssembly Engine
        </motion.p>
      </div>

      {/* Main Breeding Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-2 sm:px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          
          {/* LEFT DRAGON - Parent 1 */}
          <div className="lg:col-span-4">
            <motion.div
              className="relative"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Dragon Platform */}
              <div className="relative bg-gradient-to-br from-blue-900/40 to-blue-700/40 backdrop-blur-xl rounded-3xl p-6 border-4 border-blue-400/50 shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-2 rounded-full border-2 border-blue-300">
                  <span className="text-white font-bold">💙 Parent 1</span>
                </div>

                {parent1 && dragon1Data ? (
                  <div className="pt-6">
                    {/* Animated Dragon with 3D effects */}
                    <motion.div
                      className="relative mx-auto mb-4"
                      animate={{ 
                        y: [0, -12, 0],
                        rotate: isBreeding ? [0, -3, 3, 0] : [0, -1, 1, 0]
                      }}
                      transition={{ 
                        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: isBreeding ? 0.8 : 4, repeat: Infinity }
                      }}
                    >
                      <div className="w-48 h-48 mx-auto relative">
                        {/* Elemental glow aura */}
                        <motion.div
                          className="absolute inset-0 rounded-full blur-xl -z-10"
                          style={{
                            background: `radial-gradient(circle, ${ELEMENT_COLORS[dragon1Data.element as 0 | 1 | 2 | 3 | 4 | 5].replace('bg-', '').replace('-500', '')}40 0%, transparent 70%)`
                          }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        {/* Breathing animation */}
                        <motion.div
                          animate={{ scale: isBreeding ? [1, 1.05, 1] : [1, 1.02, 1] }}
                          transition={{ duration: isBreeding ? 1 : 2, repeat: Infinity }}
                        >
                          <DragonImage 
                            element={dragon1Data.element as Element}
                            powerType={dragon1Data.powerType as PowerType}
                            size={192}
                          />
                        </motion.div>
                      </div>
                      {isBreeding && (
                        <>
                          <motion.div
                            className="absolute -right-4 -top-4 text-4xl"
                            animate={{ scale: [1, 1.3, 1], rotate: [0, 360] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            ✨
                          </motion.div>
                          <motion.div
                            className="absolute -left-4 bottom-1/4 text-3xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                          >
                            💫
                          </motion.div>
                        </>
                      )}
                    </motion.div>

                    {/* Dragon Info Card */}
                    <div className="bg-blue-950/60 rounded-2xl p-4 border-2 border-blue-400/30">
                      <h3 className="text-xl font-bold text-blue-300 mb-3">Dragon #{parent1.toString()}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Element:</span>
                          <span className={`font-bold px-3 py-1 rounded-full ${ELEMENT_COLORS[dragon1Data.element as 0 | 1 | 2 | 3 | 4 | 5]}`}>
                            {ELEMENT_NAMES[dragon1Data.element] as string}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Level:</span>
                          <span className="text-yellow-400 font-bold">{dragon1Data.level.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Rarity:</span>
                          <span className="text-purple-400 font-bold">
                            {'⭐'.repeat(dragon1Data.powerType + 1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setParent1(null)}
                      className="w-full mt-4 px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-all font-semibold"
                    >
                      ❌ Remove
                    </button>
                  </div>
                ) : (
                  <div className="pt-6">
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-6xl mb-4 opacity-50">🐉</div>
                      <p className="mb-6">No Dragon Selected</p>
                    </div>
                    <button
                      onClick={() => setShowCardSelection('parent1')}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      Choose Dragon
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* CENTER - Breeding Display */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-pink-900/40 to-purple-900/40 backdrop-blur-xl rounded-3xl p-6 border-4 border-pink-400/50 shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-2 rounded-full border-2 border-pink-300">
                  <span className="text-white font-bold">🥚 Offspring</span>
                </div>

                <div className="pt-8">
                  {/* Heart Animation */}
                  <AnimatePresence>
                    {heartAnimation && (
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl z-20"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.7, 1] }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        💝
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {predictedOffspring ? (
                    <div className="space-y-4">
                      {/* Predicted Dragon - Animated 3D */}
                      <motion.div
                        className="relative"
                        animate={{ 
                          y: isBreeding ? [0, -10, 0] : 0,
                          scale: isBreeding ? [1, 1.05, 1] : 1
                        }}
                        transition={{ duration: 2, repeat: isBreeding ? Infinity : 0 }}
                      >
                        <div className="w-56 h-56 mx-auto relative">
                          {/* Glowing aura effect */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${ELEMENT_COLORS[predictedOffspring.element as 0 | 1 | 2 | 3 | 4 | 5].replace('bg-', '').replace('-500', '')}40 0%, transparent 70%)`
                            }}
                            animate={{ scale: isBreeding ? [1, 1.2, 1] : 1, opacity: isBreeding ? [0.3, 0.6, 0.3] : 0.3 }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          
                          {/* 3D Dragon with idle animation */}
                          <motion.div
                            animate={{
                              rotate: isBreeding ? [0, 5, -5, 0] : [0, 2, -2, 0],
                              y: [0, -5, 0]
                            }}
                            transition={{
                              rotate: { duration: isBreeding ? 1 : 3, repeat: Infinity },
                              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                          >
                            <DragonImage 
                              element={predictedOffspring.element as Element}
                              powerType={predictedOffspring.powerType as PowerType}
                              size={224}
                            />
                          </motion.div>

                          {/* Sparkles and effects */}
                          {isBreeding && (
                            <>
                              <motion.div
                                className="absolute -right-6 top-1/4 text-4xl"
                                animate={{ scale: [1, 1.3, 1], rotate: [0, 360], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                ✨
                              </motion.div>
                              <motion.div
                                className="absolute -left-6 top-1/4 text-4xl"
                                animate={{ scale: [1, 1.3, 1], rotate: [360, 0], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                              >
                                ✨
                              </motion.div>
                              <motion.div
                                className="absolute left-1/2 -translate-x-1/2 bottom-0 text-3xl"
                                animate={{ y: [0, -20], opacity: [1, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                💫
                              </motion.div>
                            </>
                          )}
                        </div>
                      </motion.div>

                      {/* Predicted Stats */}
                      <div className="bg-pink-950/60 rounded-2xl p-4 border-2 border-pink-400/30">
                        <h4 className="text-lg font-bold text-pink-300 mb-3 text-center">Predicted Stats</h4>
                        <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Element:</span>
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${ELEMENT_COLORS[predictedOffspring.element as 0 | 1 | 2 | 3 | 4 | 5]}`}>
                            {ELEMENT_NAMES[predictedOffspring.element] as string}
                          </span>
                        </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">HP:</span>
                            <span className="text-green-400 font-bold">{predictedOffspring.hp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Attack:</span>
                            <span className="text-red-400 font-bold">{predictedOffspring.attack}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Defense:</span>
                            <span className="text-blue-400 font-bold">{predictedOffspring.defense}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Speed:</span>
                            <span className="text-yellow-400 font-bold">{predictedOffspring.speed}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-pink-400/30">
                            <span className="text-gray-300">Success Rate:</span>
                            <span className="text-green-300 font-bold">{(predictedOffspring.successRate * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Breeding Progress */}
                      {isBreeding && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-pink-900/80 to-purple-900/80 rounded-xl p-4 border-2 border-pink-500"
                        >
                          <div className="text-center mb-3">
                            <p className="text-pink-300 font-bold text-lg">Breeding... {breedingProgress}%</p>
                          </div>
                          <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"
                              style={{ width: `${breedingProgress}%` }}
                              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Breed Button */}
                      {!isBreeding && parent1 && parent2 && (
                        <motion.button
                          onClick={startBreeding}
                          className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-2xl"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          💕 Start Breeding
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-400">
                      <div className="text-7xl mb-4 opacity-50">❓</div>
                      <p>Select both parents</p>
                      <p className="text-sm mt-2">to see prediction</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT DRAGON - Parent 2 */}
          <div className="lg:col-span-4">
            <motion.div
              className="relative"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Dragon Platform */}
              <div className="relative bg-gradient-to-br from-purple-900/40 to-purple-700/40 backdrop-blur-xl rounded-3xl p-6 border-4 border-purple-400/50 shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 px-6 py-2 rounded-full border-2 border-purple-300">
                  <span className="text-white font-bold">💜 Parent 2</span>
                </div>

                {parent2 && dragon2Data ? (
                  <div className="pt-6">
                    {/* Animated Dragon */}
                    <motion.div
                      className="relative mx-auto mb-4"
                      animate={{ 
                        y: [0, -15, 0],
                        rotate: isBreeding ? [0, 5, -5, 0] : 0
                      }}
                      transition={{ 
                        y: { duration: 2, repeat: Infinity, delay: 0.5 },
                        rotate: { duration: 0.5, repeat: Infinity }
                      }}
                    >
                      <div className="w-48 h-48 mx-auto">
                        <DragonImage 
                          element={dragon2Data.element as Element}
                          powerType={dragon2Data.powerType as PowerType}
                          size={192}
                        />
                      </div>
                      {isBreeding && (
                        <motion.div
                          className="absolute -left-4 -top-4 text-4xl"
                          animate={{ scale: [1, 1.3, 1], rotate: [0, -360] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ✨
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Dragon Info Card */}
                    <div className="bg-purple-950/60 rounded-2xl p-4 border-2 border-purple-400/30">
                      <h3 className="text-xl font-bold text-purple-300 mb-3">Dragon #{parent2.toString()}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Element:</span>
                          <span className={`font-bold px-3 py-1 rounded-full ${ELEMENT_COLORS[dragon2Data.element as 0 | 1 | 2 | 3 | 4 | 5]}`}>
                            {ELEMENT_NAMES[dragon2Data.element] as string}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Level:</span>
                          <span className="text-yellow-400 font-bold">{dragon2Data.level.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Rarity:</span>
                          <span className="text-purple-400 font-bold">
                            {'⭐'.repeat(dragon2Data.powerType + 1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setParent2(null)}
                      className="w-full mt-4 px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-all font-semibold"
                    >
                      ❌ Remove
                    </button>
                  </div>
                ) : (
                  <div className="pt-6">
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-6xl mb-4 opacity-50">🐉</div>
                      <p className="mb-6">No Dragon Selected</p>
                    </div>
                    <button
                      onClick={() => setShowCardSelection('parent2')}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      Choose Dragon
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Breeding Tips */}
        <motion.div
          className="mt-8 bg-gradient-to-r from-orange-900/30 via-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-orange-400/30"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">📖 Breeding Tips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-4 border border-blue-400/30">
              <div className="text-3xl mb-2">🎲</div>
              <div className="text-blue-300 font-bold mb-1">Element Mix</div>
              <p className="text-gray-300">Same element = Higher success rate!</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-4 border border-purple-400/30">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-purple-300 font-bold mb-1">Rarity Boost</div>
              <p className="text-gray-300">Higher rarity parents = Better offspring</p>
            </div>
            <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/50 rounded-xl p-4 border border-pink-400/30">
              <div className="text-3xl mb-2">💪</div>
              <div className="text-pink-300 font-bold mb-1">Stat Average</div>
              <p className="text-gray-300">Stats inherited with ±10% variation</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-4 border border-green-400/30">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-green-300 font-bold mb-1">C++ Engine</div>
              <p className="text-gray-300">Ultra-fast breeding calculations!</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Card Selection Modal */}
      <AnimatePresence>
        {showCardSelection && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCardSelection(null)}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto border-4 border-yellow-400/50 shadow-2xl"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-yellow-400">
                  {showCardSelection === 'parent1' ? '💙 Select Parent 1' : '💜 Select Parent 2'}
                </h2>
                <button
                  onClick={() => setShowCardSelection(null)}
                  className="text-white bg-red-600 hover:bg-red-500 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Dragon Cards Grid - Clash of Clans / Dragon City Style */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(userDragons || []).map((dragonId: bigint) => {
                  // Skip if already selected as other parent
                  const otherParent = showCardSelection === 'parent1' ? parent2 : parent1;
                  if (otherParent && otherParent === dragonId) return null;

                  return (
                    <DragonCard
                      key={dragonId.toString()}
                      dragonId={dragonId}
                      contractAddress={contractAddress}
                      onSelect={() => selectDragon(dragonId, showCardSelection)}
                    />
                  );
                })}
              </div>

              {(!userDragons || userDragons.length === 0) && (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-6xl mb-4">🐉</div>
                  <p className="text-xl">No dragons found</p>
                  <p className="text-sm mt-2">Mint your first dragon to start breeding!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

// Dragon Card Component - Clash of Clans Style
function DragonCard({ 
  dragonId, 
  contractAddress, 
  onSelect 
}: { 
  dragonId: bigint; 
  contractAddress: `0x${string}`; 
  onSelect: () => void;
}) {
  const { data: dragonData } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragonData) {
    return (
      <div className="bg-gray-800/50 rounded-2xl p-4 animate-pulse">
        <div className="w-full aspect-square bg-gray-700 rounded-xl mb-3"></div>
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border-2 border-gray-600 hover:border-yellow-400 cursor-pointer group transition-all shadow-lg hover:shadow-2xl"
      onClick={onSelect}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Card Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Rarity Border Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity ${
        dragonData.powerType === 2 ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30' :
        dragonData.powerType === 1 ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30' :
        'bg-gradient-to-br from-gray-500/20 to-gray-400/20'
      }`}></div>

      <div className="relative p-4">
        {/* Rarity Stars */}
        <div className="absolute top-2 right-2 flex gap-0.5">
          {Array.from({ length: dragonData.powerType + 1 }).map((_, i) => (
            <span key={i} className="text-yellow-400 text-lg drop-shadow-lg">⭐</span>
          ))}
        </div>

        {/* Dragon Image */}
        <div className="relative mb-3">
          <div className={`absolute inset-0 blur-xl opacity-50 ${ELEMENT_COLORS[dragonData.element as 0 | 1 | 2 | 3 | 4 | 5]}`}></div>
          <div className="w-full aspect-square relative z-10">
            <DragonImage
              element={dragonData.element as Element}
              powerType={dragonData.powerType as PowerType}
              size={200}
            />
          </div>
        </div>

        {/* Dragon Info */}
        <div className="space-y-2">
          <h3 className="text-white font-bold text-sm truncate">Dragon #{dragonId.toString()}</h3>
          
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-1 rounded-full font-semibold ${ELEMENT_COLORS[dragonData.element as 0 | 1 | 2 | 3 | 4 | 5]}`}>
              {ELEMENT_NAMES[dragonData.element] as string}
            </span>
            <span className="text-yellow-400 font-bold">Lv.{dragonData.level.toString()}</span>
          </div>

          {/* Stats Mini Bar */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-gray-700/50 rounded px-2 py-1">
              <span className="text-gray-400">Lv:</span>
              <span className="text-yellow-400 font-bold ml-1">
                {dragonData.level.toString()}
              </span>
            </div>
            <div className="bg-gray-700/50 rounded px-2 py-1">
              <span className="text-gray-400">⭐:</span>
              <span className="text-purple-400 font-bold ml-1">
                {dragonData.powerType + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Select Button Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <span className="text-white font-bold text-lg drop-shadow-lg">SELECT</span>
        </div>
      </div>
    </motion.div>
  );
}
