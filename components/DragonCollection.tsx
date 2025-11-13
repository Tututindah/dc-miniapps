'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, POWER_TYPE_NAMES, POWER_TYPE_COLORS, CHAIN_NAMES } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { DragonGameEngine, DragonStats } from '@/lib/game/DragonEngine';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import VillageNavigation from './VillageNavigation';

interface DragonCollectionProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function DragonCollection({ onBack, showNavigation = false }: DragonCollectionProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();

  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220
    ? CONTRACTS.celo.dragonNFT
    : CONTRACTS.localhost.dragonNFT;  const { data: dragonIds } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  });

  if (!address) {
    return (
      <div>
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Connect your wallet to view your dragons</p>
        </div>
      </div>
    );
  }

  if (!dragonIds || dragonIds.length === 0) {
    return (
      <div>
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">You don't have any dragons yet</p>
          <p className="text-gray-500">Visit the Egg Shop to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      <h2 className="text-2xl font-bold mb-6">My Dragon Collection</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dragonIds.map((dragonId) => (
          <DragonCard key={dragonId.toString()} dragonId={dragonId} contractAddress={contractAddress} />
        ))}
      </div>
    </div>
  );
}

function DragonCard({ dragonId, contractAddress }: { dragonId: bigint; contractAddress: `0x${string}` }) {
  const [stats, setStats] = useState<DragonStats | null>(null);
  
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  useEffect(() => {
    if (dragon) {
      // Calculate stats using game engine
      const calculatedStats = DragonGameEngine.calculateStats(dragon, Number(dragon.level) || 1);
      setStats(calculatedStats);
    }
  }, [dragon]);

  if (!dragon) return null;

  const elementName = ELEMENT_NAMES[dragon.element];
  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];
  const powerTypeName = POWER_TYPE_NAMES[dragon.powerType];
  const powerTypeColor = POWER_TYPE_COLORS[dragon.powerType as keyof typeof POWER_TYPE_COLORS];
  const chainName = CHAIN_NAMES[Number(dragon.originChainId)] || 'Unknown';

  // Calculate EXP percentage for progress bar
  const expPercent = stats ? (stats.exp / stats.expToNextLevel) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dragon-card relative overflow-hidden"
      style={{ borderColor: elementColor }}
    >
      <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-bold"
        style={{ backgroundColor: elementColor }}
      >
        {elementName}
      </div>
      
      <div className="absolute top-0 left-0 px-2 py-1 rounded-br-lg text-xs font-bold bg-gray-900/80">
        {chainName}
      </div>
      
      <div className="mt-8 mb-4 text-center">
        <div className="mb-4 flex justify-center">
          <DragonImage 
            element={dragon.element as 0 | 1 | 2 | 3 | 4 | 5} 
            powerType={dragon.powerType as 0 | 1 | 2} 
            size={150} 
          />
        </div>
        <h3 className="text-xl font-bold">{dragon.name}</h3>
        <p className="text-gray-400 text-sm">Level {stats?.level || dragon.level}</p>
        <div className="mt-2 px-2 py-1 rounded text-xs font-bold inline-block"
          style={{ backgroundColor: powerTypeColor }}
        >
          {powerTypeName}
        </div>
      </div>

      {stats && (
        <div className="space-y-2 text-sm mb-4">
          <StatBar label="HP" value={stats.hp} max={stats.maxHp} color="text-green-400" />
          <StatBar label="Attack" value={stats.attack} max={300} color="text-red-400" />
          <StatBar label="Defense" value={stats.defense} max={300} color="text-blue-400" />
          <StatBar label="Speed" value={stats.speed} max={300} color="text-yellow-400" />
          
          {/* EXP Bar */}
          <div className="pt-2">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-gray-400">EXP</span>
              <span className="text-purple-400">{stats.exp} / {stats.expToNextLevel}</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${Math.min(expPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Total EXP: {dragon.experience.toString()}</span>
          <span>ID: #{dragon.id.toString()}</span>
        </div>
        {dragon.isStandby && (
          <div className="mt-2 px-2 py-1 bg-green-500/20 border border-green-500 rounded text-xs text-green-400 text-center">
            ⚔️ On Standby for Battle
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={color}>{value}</span>
      </div>
      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} bg-current transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
