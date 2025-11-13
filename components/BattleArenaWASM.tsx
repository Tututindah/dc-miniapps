'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS } from '@/lib/types';
import { motion } from 'framer-motion';
import { soundManager } from '@/lib/soundManager';
import { getElementRGB, getElementRGBNormalized, rgbToCss } from '@/lib/dragonUtils';

interface BattleArenaWASMProps {
  onBack?: () => void;
}

enum BattleState {
  IDLE = 0,
  SELECTING_DRAGON = 1,
  BATTLE_START = 2,
  PLAYER_TURN = 3,
  ENEMY_TURN = 4,
  BATTLE_END = 5,
  VICTORY = 6,
  DEFEAT = 7
}

enum BattleAction {
  ATTACK = 0,
  DEFEND = 1,
  SPECIAL_MOVE = 2,
  USE_ITEM = 3,
  RUN = 4
}

export default function BattleArenaWASM({ onBack }: BattleArenaWASMProps) {
  const { address } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moduleRef = useRef<any>(null);
  const wrappedFunctionsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [battleState, setBattleState] = useState<BattleState>(BattleState.IDLE);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [showDragonSelect, setShowDragonSelect] = useState(false);

  const contractAddress = CONTRACTS.localhost.dragonNFT;

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
        
        wrappedFunctionsRef.current = {
          createDragon: module.cwrap('create_dragon', 'number', ['number', 'number', 'number', 'number', 'number']),
          startBattle: module.cwrap('start_battle', null, ['number', 'number']),
          updateBattle: module.cwrap('update_battle', null, ['number']),
          performBattleAction: module.cwrap('perform_battle_action', null, ['number', 'number']),
          getBattleState: module.cwrap('get_battle_state', 'number', []),
          renderFrame: module.cwrap('render_frame', null, []),
          initGame: module.cwrap('init_game', null, ['number', 'number']),
        };

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        
        wrappedFunctionsRef.current.initGame(canvas.width, canvas.height);
        setIsEngineReady(true);
        
        console.log('⚔️ WASM Battle Engine loaded!');
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

      if (battleState !== BattleState.IDLE && battleState !== BattleState.SELECTING_DRAGON) {
        wrappedFunctionsRef.current.updateBattle(deltaTime);
        const newState = wrappedFunctionsRef.current.getBattleState();
        setBattleState(newState);

        if (newState === BattleState.VICTORY) {
          soundManager.play('quest_complete', 1.0);
        } else if (newState === BattleState.DEFEAT) {
          soundManager.play('error', 0.8);
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
  }, [isEngineReady, battleState]);

  const handleStartBattle = () => {
    if (!selectedDragonData || !wrappedFunctionsRef.current) return;

    soundManager.play('dragon_roar', 1.0);

    // Create player dragon
    const color = getElementRGBNormalized(selectedDragonData.element);
    const playerDragonId = wrappedFunctionsRef.current.createDragon(
      selectedDragonData.element,
      color.r, color.g, color.b,
      Number(selectedDragonData.level)
    );

    // Create enemy dragon (random)
    const enemyElement = Math.floor(Math.random() * 8);
    const enemyColor = getElementRGBNormalized(enemyElement);
    const enemyDragonId = wrappedFunctionsRef.current.createDragon(
      enemyElement,
      enemyColor.r, enemyColor.g, enemyColor.b,
      Math.max(1, Number(selectedDragonData.level) - 2 + Math.floor(Math.random() * 5))
    );

    wrappedFunctionsRef.current.startBattle(playerDragonId, enemyDragonId);
    setBattleState(BattleState.BATTLE_START);
  };

  const handleAttack = (moveIndex: number) => {
    if (!wrappedFunctionsRef.current) return;
    soundManager.play('fire_breath', 0.9);
    wrappedFunctionsRef.current.performBattleAction(BattleAction.ATTACK, moveIndex);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-orange-900 to-black p-6">
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
        <h1 className="text-5xl font-bold text-white mb-2">⚔️ Battle Arena (WASM)</h1>
        <p className="text-gray-300">Real-time 3D dragon battles!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Battle Canvas */}
        <div className="lg:col-span-2 bg-black/50 rounded-xl p-6 border-2 border-red-400/30">
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] rounded-lg bg-gradient-to-b from-red-950 to-black dragon-render"
          />
        </div>

        {/* Battle Controls */}
        <div className="space-y-4">
          {battleState === BattleState.IDLE && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Select Your Dragon</h3>
              {selectedDragonData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full dragon-vibrant" style={{ backgroundColor: rgbToCss(getElementRGB(selectedDragonData.element)) }} />
                    <div>
                      <div className="text-white font-bold">{ELEMENT_NAMES[selectedDragonData.element]}</div>
                      <div className="text-gray-400 text-sm">Level {Number(selectedDragonData.level)}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleStartBattle}
                    disabled={!isEngineReady}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 
                              disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all shadow-lg"
                  >
                    {isEngineReady ? '⚔️ Start Battle!' : '⏳ Loading...'}
                  </button>
                  <button
                    onClick={() => setSelectedDragon(null)}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  >
                    Change Dragon
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDragonSelect(true)}
                  className="w-full py-8 border-2 border-dashed border-white/30 rounded-lg hover:border-red-400/50 transition-all text-gray-400 hover:text-white"
                >
                  + Select Dragon
                </button>
              )}
            </div>
          )}

          {battleState === BattleState.PLAYER_TURN && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Your Turn!</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleAttack(0)}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 
                            text-white font-bold rounded-lg transition-all"
                >
                  🔥 Fire Breath
                </button>
                <button
                  onClick={() => handleAttack(1)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 
                            text-white font-bold rounded-lg transition-all"
                >
                  ❄️ Ice Shard
                </button>
                <button
                  onClick={() => handleAttack(2)}
                  className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 
                            text-white font-bold rounded-lg transition-all"
                >
                  ⚡ Thunder Strike
                </button>
                <button
                  onClick={() => handleAttack(3)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                            text-white font-bold rounded-lg transition-all"
                >
                  💫 Dragon Claw
                </button>
              </div>
            </div>
          )}

          {battleState === BattleState.ENEMY_TURN && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Enemy Turn...</h3>
              <div className="text-center text-gray-400">
                <div className="animate-pulse text-4xl mb-2">⚔️</div>
                <p>Enemy is attacking!</p>
              </div>
            </div>
          )}

          {battleState === BattleState.VICTORY && (
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400/50">
              <h3 className="text-3xl font-bold text-green-400 mb-4 text-center">🏆 VICTORY!</h3>
              <p className="text-white text-center mb-4">You won the battle!</p>
              <button
                onClick={() => {
                  setBattleState(BattleState.IDLE);
                  setSelectedDragon(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 
                          text-white font-bold rounded-lg transition-all"
              >
                Battle Again
              </button>
            </div>
          )}

          {battleState === BattleState.DEFEAT && (
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50">
              <h3 className="text-3xl font-bold text-red-400 mb-4 text-center">💀 DEFEAT</h3>
              <p className="text-white text-center mb-4">You lost the battle...</p>
              <button
                onClick={() => {
                  setBattleState(BattleState.IDLE);
                  setSelectedDragon(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 
                          text-white font-bold rounded-lg transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dragon Selection Modal */}
      {showDragonSelect && userDragons && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowDragonSelect(false)}
        >
          <div
            className="bg-gradient-to-br from-red-900 to-black rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-white mb-6">Select Dragon</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(userDragons as bigint[]).map((dragonId) => (
                <DragonCard
                  key={dragonId.toString()}
                  dragonId={dragonId}
                  onSelect={(id) => {
                    setSelectedDragon(id);
                    setShowDragonSelect(false);
                    soundManager.play('click', 0.8);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
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
      className="bg-white/10 hover:bg-white/20 rounded-lg p-4 border-2 border-white/20 hover:border-red-400/50 transition-all text-left"
    >
      <div
        className="w-full h-32 rounded-lg mb-3 dragon-vibrant"
        style={{ backgroundColor: rgbToCss(color) }}
      />
      <div className="text-white font-bold">{ELEMENT_NAMES[dragonData.element]}</div>
      <div className="text-gray-400 text-sm">Level {Number(dragonData.level)}</div>
      <div className="text-gray-400 text-sm">Attack: {Number(dragonData.attack)}</div>
    </button>
  );
}
