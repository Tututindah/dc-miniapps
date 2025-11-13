'use client';

import { useState } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS, Element, PowerType } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { motion, AnimatePresence } from 'framer-motion';
import VillageNavigation from './VillageNavigation';

interface HabitatManagementProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

interface Habitat {
  id: number;
  name: string;
  element: number;
  capacity: number;
  level: number;
  goldProduction: number;
  bonus: string;
  dragons: bigint[];
  icon: string;
  upgradeCost: number;
}

export default function HabitatManagement({ onBack, showNavigation = false }: HabitatManagementProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedHabitat, setSelectedHabitat] = useState<number | null>(null);
  const [habitats, setHabitats] = useState<Habitat[]>([
    {
      id: 0,
      name: 'Fire Habitat',
      element: 0,
      capacity: 4,
      level: 1,
      goldProduction: 100,
      bonus: '+10% ATK for Fire dragons',
      dragons: [],
      icon: '🔥',
      upgradeCost: 1000
    },
    {
      id: 1,
      name: 'Water Habitat',
      element: 1,
      capacity: 4,
      level: 1,
      goldProduction: 100,
      bonus: '+10% DEF for Water dragons',
      dragons: [],
      icon: '💧',
      upgradeCost: 1000
    },
    {
      id: 2,
      name: 'Earth Habitat',
      element: 2,
      capacity: 4,
      level: 1,
      goldProduction: 100,
      bonus: '+10% HP for Earth dragons',
      dragons: [],
      icon: '🌍',
      upgradeCost: 1000
    },
    {
      id: 3,
      name: 'Air Habitat',
      element: 3,
      capacity: 4,
      level: 1,
      goldProduction: 100,
      bonus: '+10% SPD for Air dragons',
      dragons: [],
      icon: '💨',
      upgradeCost: 1000
    },
  ]);

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

  const assignDragonToHabitat = (habitatId: number, dragonId: bigint) => {
    setHabitats(habitats.map(h => {
      // Remove dragon from all habitats first
      const withoutDragon = { ...h, dragons: h.dragons.filter(d => d !== dragonId) };
      
      // Add to selected habitat if it matches and has capacity
      if (h.id === habitatId && h.dragons.length < h.capacity) {
        return { ...withoutDragon, dragons: [...withoutDragon.dragons, dragonId] };
      }
      return withoutDragon;
    }));
  };

  const removeDragonFromHabitat = (dragonId: bigint) => {
    setHabitats(habitats.map(h => ({
      ...h,
      dragons: h.dragons.filter(d => d !== dragonId)
    })));
  };

  const upgradeHabitat = (habitatId: number) => {
    setHabitats(habitats.map(h => {
      if (h.id === habitatId) {
        return {
          ...h,
          level: h.level + 1,
          capacity: h.capacity + 2,
          goldProduction: Math.floor(h.goldProduction * 1.5),
          upgradeCost: Math.floor(h.upgradeCost * 2)
        };
      }
      return h;
    }));
  };

  const getTotalGoldProduction = () => {
    return habitats.reduce((total, h) => total + (h.dragons.length * h.goldProduction), 0);
  };

  const getAssignedDragons = () => {
    return habitats.flatMap(h => h.dragons);
  };

  if (!address) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-green-900 via-blue-900 to-gray-900">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <div className="text-8xl mb-6 animate-bounce">🏠</div>
          <p className="text-white text-2xl font-bold drop-shadow-lg">Connect your wallet to manage habitats</p>
          <p className="text-gray-400 mt-2">House your dragons and earn gold!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-green-900 via-blue-900 to-gray-900">
      <div className="min-h-full p-4 sm:p-6">
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white drop-shadow-lg mb-2">🏠 Habitat Management</h2>
        <p className="text-yellow-400 text-lg">House your dragons and boost their abilities!</p>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 border-2 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-yellow-100">💰 Gold Production</div>
              <div className="text-2xl font-bold text-white">{getTotalGoldProduction()}/hour</div>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 border-2 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-100">🏠 Total Habitats</div>
              <div className="text-2xl font-bold text-white">{habitats.length}</div>
            </div>
            <div className="text-4xl">🏘️</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 border-2 border-purple-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-100">🐉 Housed Dragons</div>
              <div className="text-2xl font-bold text-white">
                {getAssignedDragons().length} / {habitats.reduce((sum, h) => sum + h.capacity, 0)}
              </div>
            </div>
            <div className="text-4xl">🐲</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habitats List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-2xl font-bold text-white mb-4">🏘️ Your Habitats</h3>
          {habitats.map((habitat) => (
            <HabitatCard
              key={habitat.id}
              habitat={habitat}
              isSelected={selectedHabitat === habitat.id}
              onClick={() => setSelectedHabitat(habitat.id)}
              onUpgrade={() => upgradeHabitat(habitat.id)}
              onRemoveDragon={removeDragonFromHabitat}
              contractAddress={contractAddress}
            />
          ))}
          
          {/* Add New Habitat Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl border-2 border-green-400 hover:from-green-500 hover:to-emerald-500 transition-all"
          >
            <div className="text-4xl mb-2">➕</div>
            <div className="text-white font-bold text-lg">Build New Habitat</div>
            <div className="text-green-100 text-sm">Cost: 5,000 Gold</div>
          </motion.button>
        </div>

        {/* Unassigned Dragons */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-600">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">🐉 Unassigned Dragons</h3>
          
          {!userDragons || userDragons.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No dragons available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {userDragons
                .filter((id: bigint) => !getAssignedDragons().includes(id))
                .map((dragonId: bigint) => (
                  <UnassignedDragonCard
                    key={dragonId.toString()}
                    dragonId={dragonId}
                    contractAddress={contractAddress}
                    onAssign={(id: bigint) => {
                      if (selectedHabitat !== null) {
                        assignDragonToHabitat(selectedHabitat, id);
                      }
                    }}
                    canAssign={selectedHabitat !== null && 
                      habitats.find(h => h.id === selectedHabitat)!.dragons.length < 
                      habitats.find(h => h.id === selectedHabitat)!.capacity}
                  />
                ))}
              
              {userDragons.filter((id: bigint) => !getAssignedDragons().includes(id)).length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-2">✅</div>
                  <p>All dragons are housed!</p>
                </div>
              )}
            </div>
          )}
          
          {selectedHabitat !== null && (
            <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 text-xs text-blue-300">
              💡 Selected: <span className="font-bold">{habitats.find(h => h.id === selectedHabitat)?.name}</span>
              <br />
              Click a dragon above to assign it to this habitat
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// Habitat Card Component
function HabitatCard({ habitat, isSelected, onClick, onUpgrade, onRemoveDragon, contractAddress }: any) {
  const elementColor = ELEMENT_COLORS[habitat.element as keyof typeof ELEMENT_COLORS];
  const capacityPercent = (habitat.dragons.length / habitat.capacity) * 100;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'border-yellow-400 shadow-2xl shadow-yellow-400/20' 
          : 'border-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{habitat.icon}</div>
          <div>
            <h4 className="text-2xl font-bold text-white">{habitat.name}</h4>
            <p className="text-sm text-gray-400">Level {habitat.level}</p>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade();
          }}
          className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all text-sm"
        >
          ⬆️ Upgrade
          <div className="text-xs">💰 {habitat.upgradeCost}g</div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{habitat.capacity}</div>
          <div className="text-xs text-gray-400">Capacity</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{habitat.goldProduction}g</div>
          <div className="text-xs text-gray-400">Per Dragon/hr</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{habitat.dragons.length}/{habitat.capacity}</div>
          <div className="text-xs text-gray-400">Occupied</div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Occupancy</span>
          <span>{Math.round(capacityPercent)}%</span>
        </div>
        <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Bonus */}
      <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
        <div className="text-xs text-purple-300">
          ✨ <span className="font-bold">{habitat.bonus}</span>
        </div>
      </div>

      {/* Housed Dragons */}
      {habitat.dragons.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">🐉 Housed Dragons:</div>
          <div className="grid grid-cols-4 gap-2">
            {habitat.dragons.map((dragonId: bigint) => (
              <HousedDragonIcon
                key={dragonId.toString()}
                dragonId={dragonId}
                contractAddress={contractAddress}
                onRemove={onRemoveDragon}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Housed Dragon Icon
function HousedDragonIcon({ dragonId, contractAddress, onRemove }: any) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragon) return null;

  return (
    <div className="relative group">
      <div className="bg-gray-700 rounded-lg p-2 border border-gray-600 hover:border-yellow-400 transition-all">
        <DragonImage element={dragon.element as Element} powerType={dragon.powerType as PowerType} size={40} />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(dragonId);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        ✕
      </button>
    </div>
  );
}

// Unassigned Dragon Card
function UnassignedDragonCard({ dragonId, contractAddress, onAssign, canAssign }: any) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragon) return null;

  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];

  return (
    <motion.button
      whileHover={{ scale: canAssign ? 1.02 : 1 }}
      whileTap={{ scale: canAssign ? 0.98 : 1 }}
      onClick={() => canAssign && onAssign(dragonId)}
      disabled={!canAssign}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        canAssign
          ? 'bg-gray-700/50 hover:bg-gray-600/50 border-2 border-gray-600 hover:border-yellow-400 cursor-pointer'
          : 'bg-gray-800/30 border border-gray-700 opacity-50 cursor-not-allowed'
      }`}
    >
      <DragonImage element={dragon.element as Element} powerType={dragon.powerType as PowerType} size={50} />
      <div className="flex-1 text-left">
        <div className="font-bold text-white text-sm" style={{ color: elementColor }}>
          {ELEMENT_NAMES[dragon.element]}
        </div>
        <div className="text-xs text-gray-400">Level {dragon.level.toString()}</div>
      </div>
      {canAssign && <div className="text-yellow-400">→</div>}
    </motion.button>
  );
}
