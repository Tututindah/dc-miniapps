'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/soundManager';
import { getElementRGB, getElementRGBNormalized, rgbToCss } from '@/lib/dragonUtils';

interface BreedingLabWASMProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function BreedingLabWASM({ onBack, showNavigation = false }: BreedingLabWASMProps) {
  const { address } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moduleRef = useRef<any>(null);
  const wrappedFunctionsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const breedingPairIdRef = useRef<number>(-1);
  
  const [parent1, setParent1] = useState<bigint | null>(null);
  const [parent2, setParent2] = useState<bigint | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);
  const [breedingProgress, setBreedingProgress] = useState(0);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [showCardSelection, setShowCardSelection] = useState<'parent1' | 'parent2' | null>(null);
  const [resultEgg, setResultEgg] = useState<number | null>(null);

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

  // Load WASM Engine
  useEffect(() => {
    const loadEngine = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

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
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const module = await EngineFactory({
          canvas,
          print: console.log,
          printErr: console.error,
        });

        moduleRef.current = module;
        
        // Wrap C++ functions
        wrappedFunctionsRef.current = {
          createDragon: module.cwrap('create_dragon', 'number', ['number', 'number', 'number', 'number', 'number']),
          startBreeding: module.cwrap('start_breeding', 'number', ['number', 'number']),
          updateBreeding: module.cwrap('update_breeding', null, ['number', 'number']),
          isBreedingComplete: module.cwrap('is_breeding_complete', 'number', ['number']),
          getBreedingResultEgg: module.cwrap('get_breeding_result_egg', 'number', ['number']),
          updateEgg: module.cwrap('update_egg', null, ['number', 'number']),
          isEggReady: module.cwrap('is_egg_ready', 'number', ['number']),
          renderFrame: module.cwrap('render_frame', null, []),
          initGame: module.cwrap('init_game', null, ['number', 'number']),
        };

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        
        wrappedFunctionsRef.current.initGame(canvas.width, canvas.height);
        setIsEngineReady(true);
        
        console.log('🐉 WASM Breeding Engine loaded!');
      } catch (error) {
        console.error('Failed to load WASM engine:', error);
      }
    };

    loadEngine();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Render loop
  useEffect(() => {
    if (!isEngineReady || !wrappedFunctionsRef.current) return;

    let lastTime = 0;
    const render = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (breedingPairIdRef.current >= 0 && isBreeding) {
        wrappedFunctionsRef.current.updateBreeding(breedingPairIdRef.current, deltaTime);
        
        const complete = wrappedFunctionsRef.current.isBreedingComplete(breedingPairIdRef.current);
        if (complete) {
          const eggId = wrappedFunctionsRef.current.getBreedingResultEgg(breedingPairIdRef.current);
          setResultEgg(eggId);
          setIsBreeding(false);
          soundManager.play('quest_complete', 1.0);
        } else {
          setBreedingProgress(Math.min((deltaTime * 30), 1)); // Update progress
        }
      }

      wrappedFunctionsRef.current.renderFrame();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEngineReady, isBreeding]);

  const handleStartBreeding = () => {
    if (!parent1 || !parent2 || !dragon1Data || !dragon2Data || !wrappedFunctionsRef.current) return;

    soundManager.play('dragon_roar', 0.8);

    // Create dragons in C++ engine
    const color1 = getElementRGBNormalized(dragon1Data.element);
    const color2 = getElementRGBNormalized(dragon2Data.element);
    
    const dragon1Id = wrappedFunctionsRef.current.createDragon(
      dragon1Data.element,
      color1.r / 255, color1.g / 255, color1.b / 255,
      Number(dragon1Data.level)
    );

    const dragon2Id = wrappedFunctionsRef.current.createDragon(
      dragon2Data.element,
      color2.r / 255, color2.g / 255, color2.b / 255,
      Number(dragon2Data.level)
    );

    // Start breeding in engine
    const pairId = wrappedFunctionsRef.current.startBreeding(dragon1Id, dragon2Id);
    breedingPairIdRef.current = pairId;
    
    setIsBreeding(true);
    setBreedingProgress(0);
    setResultEgg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 via-purple-900 to-black p-6 landscape-grid">
      {/* Header */}
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 
                      text-white font-bold rounded-lg transition-all"
          >
            ← Back to Village
          </button>
        )}
        <h1 className="text-5xl font-bold text-white mb-2">💕 Breeding Lab (WASM)</h1>
        <p className="text-gray-300">Breed dragons with real-time 3D engine rendering!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Canvas */}
        <div className="bg-black/50 rounded-xl p-6 border-2 border-pink-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">🎮 Live 3D Breeding</h2>
          <canvas
            ref={canvasRef}
            className="w-full h-[500px] rounded-lg bg-gradient-to-b from-purple-950 to-black dragon-render"
          />
          {isBreeding && (
            <div className="mt-4">
              <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${breedingProgress * 100}%` }}
                />
              </div>
              <p className="text-center text-white mt-2">Breeding... {Math.floor(breedingProgress * 100)}%</p>
            </div>
          )}
          {resultEgg !== null && (
            <div className="mt-4 text-center">
              <div className="text-6xl mb-2">🥚</div>
              <p className="text-green-400 font-bold text-xl">Breeding Complete!</p>
              <p className="text-gray-300">Egg #{resultEgg} created</p>
            </div>
          )}
        </div>

        {/* Selection Panel */}
        <div className="space-y-6">
          {/* Parent 1 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Parent 1</h3>
            {dragon1Data ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full" style={{ backgroundColor: rgbToCss(getElementRGB(dragon1Data.element)) }} />
                <div>
                  <div className="text-white font-bold">{ELEMENT_NAMES[dragon1Data.element]} Dragon</div>
                  <div className="text-gray-400 text-sm">Level {Number(dragon1Data.level)}</div>
                </div>
                <button
                  onClick={() => setParent1(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCardSelection('parent1')}
                className="w-full py-8 border-2 border-dashed border-white/30 rounded-lg hover:border-pink-400/50 transition-all text-gray-400 hover:text-white"
              >
                + Select Dragon
              </button>
            )}
          </div>

          {/* Parent 2 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Parent 2</h3>
            {dragon2Data ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full" style={{ backgroundColor: rgbToCss(getElementRGB(dragon2Data.element)) }} />
                <div>
                  <div className="text-white font-bold">{ELEMENT_NAMES[dragon2Data.element]} Dragon</div>
                  <div className="text-gray-400 text-sm">Level {Number(dragon2Data.level)}</div>
                </div>
                <button
                  onClick={() => setParent2(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCardSelection('parent2')}
                className="w-full py-8 border-2 border-dashed border-white/30 rounded-lg hover:border-pink-400/50 transition-all text-gray-400 hover:text-white"
              >
                + Select Dragon
              </button>
            )}
          </div>

          {/* Breed Button */}
          <button
            onClick={handleStartBreeding}
            disabled={!parent1 || !parent2 || isBreeding || !isEngineReady}
            className="w-full py-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 
                      disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-xl rounded-lg 
                      transition-all shadow-lg disabled:cursor-not-allowed"
          >
            {isBreeding ? '💕 Breeding...' : isEngineReady ? '💕 Start Breeding' : '⏳ Loading Engine...'}
          </button>
        </div>
      </div>

      {/* Dragon Selection Modal */}
      <AnimatePresence>
        {showCardSelection && userDragons && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCardSelection(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-purple-900 to-black rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-white mb-6">Select Dragon</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(userDragons as bigint[]).map((dragonId) => (
                  <DragonCard
                    key={dragonId.toString()}
                    dragonId={dragonId}
                    onSelect={(id) => {
                      if (showCardSelection === 'parent1') setParent1(id);
                      else setParent2(id);
                      setShowCardSelection(null);
                      soundManager.play('click', 0.8);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DragonCard({ dragonId, onSelect }: { dragonId: bigint; onSelect: (id: bigint) => void }) {
  const contractAddress = CONTRACTS.localhost.dragonNFT;

  const { data: dragonData } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragonData) return null;

  const color = getElementRGB(dragonData.element);

  return (
    <button
      onClick={() => onSelect(dragonId)}
      className="bg-white/10 hover:bg-white/20 rounded-lg p-4 border-2 border-white/20 hover:border-pink-400/50 transition-all text-left"
    >
      <div
        className="w-full h-32 rounded-lg mb-3 dragon-vibrant"
        style={{ backgroundColor: rgbToCss(color) }}
      />
      <div className="text-white font-bold">{ELEMENT_NAMES[dragonData.element]}</div>
      <div className="text-gray-400 text-sm">Level {Number(dragonData.level)}</div>
    </button>
  );
}
