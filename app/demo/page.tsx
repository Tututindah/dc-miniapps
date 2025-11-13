'use client';

import { useState } from 'react';
import { DragonBattleSprite } from '@/lib/dragonImage';
import { Element } from '@/lib/types';

export default function AttackDemo() {
  const [selectedElement, setSelectedElement] = useState<Element>(0);
  const [isAttacking, setIsAttacking] = useState(false);

  const elements: { id: Element; name: string; emoji: string; description: string }[] = [
    { id: 0, name: 'Fire', emoji: '🔥', description: 'Flame cone attack' },
    { id: 1, name: 'Water', emoji: '💧', description: 'Wave splash' },
    { id: 2, name: 'Earth', emoji: '🌿', description: 'Rock shards' },
    { id: 3, name: 'Storm', emoji: '⚡', description: 'Lightning bolts' },
    { id: 4, name: 'Dark', emoji: '🌑', description: 'Shadow tendrils' },
    { id: 5, name: 'Light', emoji: '✨', description: 'Radiant beams' },
  ];

  const handleAttack = () => {
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          🐉 Dragon Attack Effects Demo
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Click elements to see different attack animations!
        </p>

        {/* Element Selector */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {elements.map((element) => (
            <button
              key={element.id}
              onClick={() => setSelectedElement(element.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedElement === element.id
                  ? 'border-purple-500 bg-purple-500/20 scale-105'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-4xl mb-2">{element.emoji}</div>
              <div className="text-sm font-bold text-white">{element.name}</div>
              <div className="text-xs text-gray-400 mt-1">{element.description}</div>
            </button>
          ))}
        </div>

        {/* Dragon Display */}
        <div className="bg-gray-800/50 rounded-lg p-12 border-2 border-gray-700 mb-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <DragonBattleSprite
              element={selectedElement}
              powerType={2} // Combined power for best visuals
              isAttacking={isAttacking}
              showAttackEffect={true}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="text-center space-y-4">
          <button
            onClick={handleAttack}
            disabled={isAttacking}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg font-bold text-xl hover:from-red-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isAttacking ? '⚔️ Attacking...' : '⚔️ ATTACK!'}
          </button>

          <div className="text-gray-400 text-sm">
            {isAttacking ? (
              <p className="animate-pulse">Watch the {elements[selectedElement].name} attack!</p>
            ) : (
              <p>Click ATTACK to see the dragon unleash its power!</p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 p-6 bg-gray-800/30 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white">How it works:</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>✅ Dragons transform into <strong>skeletons</strong> when attacking</li>
            <li>✅ Each element has a unique <strong>attack animation</strong></li>
            <li>✅ Canvas-based rendering for <strong>60 FPS</strong> smooth effects</li>
            <li>✅ Procedurally generated - <strong>no image files</strong></li>
            <li>✅ Works perfectly in <strong>Farcaster Mini Apps</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
