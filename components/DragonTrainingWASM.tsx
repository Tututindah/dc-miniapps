'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS } from '@/lib/types';
import { motion } from 'framer-motion';
import { soundManager } from '@/lib/soundManager';
import { getElementRGB, getElementRGBNormalized, rgbToCss } from '@/lib/dragonUtils';

interface DragonTrainingWASMProps {
  onBack?: () => void;
}

enum TrainingType {
  STRENGTH = 0,
  DEFENSE = 1,
  SPEED = 2,
  SPECIAL = 3
}

export default function DragonTrainingWASM({ onBack }: DragonTrainingWASMProps) {
  const { address } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moduleRef = useRef<any>(null);
  const wrappedFunctionsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const trainingSessionIdRef = useRef<number>(-1);
  
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [trainingType, setTrainingType] = useState<TrainingType>(TrainingType.STRENGTH);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
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
          startTraining: module.cwrap('start_training', 'number', ['number', 'number']),
          updateTraining: module.cwrap('update_training', null, ['number', 'number']),
          isTrainingComplete: module.cwrap('is_training_complete', 'number', ['number']),
          completeTraining: module.cwrap('complete_training', null, ['number']),
          renderFrame: module.cwrap('render_frame', null, []),
          initGame: module.cwrap('init_game', null, ['number', 'number']),
        };

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        
        wrappedFunctionsRef.current.initGame(canvas.width, canvas.height);
        setIsEngineReady(true);
        
        console.log('🥋 WASM Training Engine loaded!');
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

      if (trainingSessionIdRef.current >= 0 && isTraining) {
        wrappedFunctionsRef.current.updateTraining(trainingSessionIdRef.current, deltaTime);
        
        const complete = wrappedFunctionsRef.current.isTrainingComplete(trainingSessionIdRef.current);
        if (complete) {
          wrappedFunctionsRef.current.completeTraining(trainingSessionIdRef.current);
          setIsTraining(false);
          setTrainingProgress(1);
          soundManager.play('quest_complete', 1.0);
        } else {
          setTrainingProgress((prev) => Math.min(prev + deltaTime / 45, 1)); // 45 seconds
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
  }, [isEngineReady, isTraining]);

  const handleStartTraining = () => {
    if (!selectedDragonData || !wrappedFunctionsRef.current) return;

    soundManager.play('dragon_roar', 0.8);

    const color = getElementRGBNormalized(selectedDragonData.element);
    const dragonId = wrappedFunctionsRef.current.createDragon(
      selectedDragonData.element,
      color.r, color.g, color.b,
      Number(selectedDragonData.level)
    );

    const sessionId = wrappedFunctionsRef.current.startTraining(dragonId, trainingType);
    trainingSessionIdRef.current = sessionId;
    
    setIsTraining(true);
    setTrainingProgress(0);
  };

  const trainingTypes = [
    { type: TrainingType.STRENGTH, name: 'Strength Training', icon: '💪', color: 'red', stat: '+5 Attack' },
    { type: TrainingType.DEFENSE, name: 'Defense Training', icon: '🛡️', color: 'blue', stat: '+5 Defense' },
    { type: TrainingType.SPEED, name: 'Speed Training', icon: '⚡', color: 'yellow', stat: '+3 Speed' },
    { type: TrainingType.SPECIAL, name: 'Special Training', icon: '✨', color: 'purple', stat: '+5 Power' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-cyan-900 to-black p-6">
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
        <h1 className="text-5xl font-bold text-white mb-2">🥋 Training Dojo (WASM)</h1>
        <p className="text-gray-300">Train your dragons with real-time 3D animations!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Training Canvas */}
        <div className="bg-black/50 rounded-xl p-6 border-2 border-cyan-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">🎮 Live 3D Training</h2>
          <canvas
            ref={canvasRef}
            className="w-full h-[500px] rounded-lg bg-gradient-to-b from-blue-950 to-black dragon-render"
          />
          {isTraining && (
            <div className="mt-4">
              <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${trainingProgress * 100}%` }}
                />
              </div>
              <p className="text-center text-white mt-2">Training... {Math.floor(trainingProgress * 100)}%</p>
            </div>
          )}
          {trainingProgress >= 1 && !isTraining && (
            <div className="mt-4 text-center">
              <div className="text-6xl mb-2">🏆</div>
              <p className="text-green-400 font-bold text-xl">Training Complete!</p>
            </div>
          )}
        </div>

        {/* Training Controls */}
        <div className="space-y-6">
          {/* Dragon Selection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Select Dragon</h3>
            {selectedDragonData ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full dragon-vibrant" style={{ backgroundColor: rgbToCss(getElementRGB(selectedDragonData.element)) }} />
                  <div>
                  <div className="text-white font-bold">{ELEMENT_NAMES[selectedDragonData.element]}</div>
                  <div className="text-gray-400 text-sm">Level {Number(selectedDragonData.level)}</div>
                </div>
                <button
                  onClick={() => setSelectedDragon(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDragonSelect(true)}
                className="w-full py-8 border-2 border-dashed border-white/30 rounded-lg hover:border-cyan-400/50 transition-all text-gray-400 hover:text-white"
              >
                + Select Dragon
              </button>
            )}
          </div>

          {/* Training Type Selection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Training Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {trainingTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => {
                    setTrainingType(type.type);
                    soundManager.play('click', 0.5);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    trainingType === type.type
                      ? `border-${type.color}-400 bg-${type.color}-900/30`
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-white font-bold text-sm">{type.name}</div>
                  <div className="text-gray-400 text-xs">{type.stat}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Training Button */}
          <button
            onClick={handleStartTraining}
            disabled={!selectedDragon || isTraining || !isEngineReady}
            className="w-full py-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 
                      disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-xl rounded-lg 
                      transition-all shadow-lg disabled:cursor-not-allowed"
          >
            {isTraining ? '🥋 Training...' : isEngineReady ? '🥋 Start Training' : '⏳ Loading Engine...'}
          </button>
        </div>
      </div>

      {/* Dragon Selection Modal */}
      {showDragonSelect && userDragons && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowDragonSelect(false)}
        >
          <div
            className="bg-gradient-to-br from-cyan-900 to-black rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-auto"
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
      className="bg-white/10 hover:bg-white/20 rounded-lg p-4 border-2 border-white/20 hover:border-blue-400/50 transition-all text-left"
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
