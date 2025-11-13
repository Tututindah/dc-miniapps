'use client';

import { useState, useEffect } from 'react';
import { Dragon } from '@/lib/types';
import { DragonBattleSprite } from '@/lib/dragonImage';

interface BattleSimulationProps {
  attacker: Dragon;
  defender: Dragon;
  onComplete: (winner: Dragon) => void;
}

export function BattleSimulation({ attacker, defender, onComplete }: BattleSimulationProps) {
  const [phase, setPhase] = useState<'intro' | 'attacker-turn' | 'defender-turn' | 'result'>('intro');
  const [attackerAttacking, setAttackerAttacking] = useState(false);
  const [defenderAttacking, setDefenderAttacking] = useState(false);
  const [winner, setWinner] = useState<Dragon | null>(null);

  useEffect(() => {
    const sequence = async () => {
      // Intro
      await delay(1000);
      
      // Attacker's turn
      setPhase('attacker-turn');
      setAttackerAttacking(true);
      await delay(1500);
      setAttackerAttacking(false);
      await delay(500);
      
      // Defender's turn
      setPhase('defender-turn');
      setDefenderAttacking(true);
      await delay(1500);
      setDefenderAttacking(false);
      await delay(500);
      
      // Determine winner (simplified)
      const attackerPower = calculatePower(attacker);
      const defenderPower = calculatePower(defender);
      const battleWinner = attackerPower > defenderPower ? attacker : defender;
      
      setWinner(battleWinner);
      setPhase('result');
      
      await delay(2000);
      onComplete(battleWinner);
    };

    sequence();
  }, [attacker, defender, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="max-w-4xl w-full p-8">
        {/* Battle Arena */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg p-8 border-4 border-yellow-500">
          <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400">
            ⚔️ BATTLE! ⚔️
          </h2>
          
          {/* Combatants */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Attacker */}
            <div className="text-center">
              <div className="mb-4 flex justify-center relative">
                <div className={`transition-all duration-300 ${attackerAttacking ? 'scale-110' : 'scale-100'}`}>
                  <DragonBattleSprite
                    element={attacker.element as 0 | 1 | 2 | 3 | 4 | 5}
                    powerType={attacker.powerType as 0 | 1 | 2}
                    isAttacking={attackerAttacking}
                    showAttackEffect={attackerAttacking}
                  />
                </div>
              </div>
              <div className="font-bold text-xl text-white">{attacker.name}</div>
              <div className="text-sm text-gray-400">Level {attacker.level}</div>
              <div className="mt-2 text-xs text-gray-500">
                ATK: {attacker.attack} | DEF: {attacker.defense} | SPD: {attacker.speed}
              </div>
            </div>
            
            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-6xl font-bold text-red-500 animate-pulse">
                VS
              </div>
            </div>

            {/* Defender */}
            <div className="text-center">
              <div className="mb-4 flex justify-center relative">
                <div className={`transition-all duration-300 ${defenderAttacking ? 'scale-110' : 'scale-100'}`}>
                  <DragonBattleSprite
                    element={defender.element as 0 | 1 | 2 | 3 | 4 | 5}
                    powerType={defender.powerType as 0 | 1 | 2}
                    isAttacking={defenderAttacking}
                    showAttackEffect={defenderAttacking}
                  />
                </div>
              </div>
              <div className="font-bold text-xl text-white">{defender.name}</div>
              <div className="text-sm text-gray-400">Level {defender.level}</div>
              <div className="mt-2 text-xs text-gray-500">
                ATK: {defender.attack} | DEF: {defender.defense} | SPD: {defender.speed}
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="bg-black/50 rounded-lg p-4 min-h-32">
            {phase === 'intro' && (
              <p className="text-center text-yellow-400 animate-pulse">
                Battle is about to begin...
              </p>
            )}
            {phase === 'attacker-turn' && (
              <div className="text-center space-y-2">
                <p className="text-green-400 font-bold">{attacker.name} attacks!</p>
                <p className="text-gray-300 text-sm">
                  {getElementAttackText(attacker.element)}
                </p>
              </div>
            )}
            {phase === 'defender-turn' && (
              <div className="text-center space-y-2">
                <p className="text-blue-400 font-bold">{defender.name} counter-attacks!</p>
                <p className="text-gray-300 text-sm">
                  {getElementAttackText(defender.element)}
                </p>
              </div>
            )}
            {phase === 'result' && winner && (
              <div className="text-center space-y-3">
                <p className="text-3xl font-bold text-yellow-400">
                  {winner.name === attacker.name ? '🎉 VICTORY! 🎉' : '💔 DEFEAT 💔'}
                </p>
                <p className="text-xl text-white">
                  {winner.name} wins!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculatePower(dragon: Dragon): number {
  const powerMultiplier = dragon.powerType === 2 ? 1.5 : dragon.powerType === 1 ? 1.25 : 1;
  return (dragon.attack + dragon.defense + dragon.speed) * powerMultiplier * dragon.level;
}

function getElementAttackText(element: number): string {
  const attacks = {
    0: '🔥 Unleashes a torrent of flames!',
    1: '💧 Summons a massive water wave!',
    2: '🌿 Hurls sharp rock shards!',
    3: '⚡ Calls down a powerful storm!',
    4: '🌑 Casts dark shadow tendrils!',
    5: '✨ Fires radiant light beams!',
  };
  return attacks[element as keyof typeof attacks] || 'Attacks!';
}
