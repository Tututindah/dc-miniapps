'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { parseEther, formatEther } from 'viem';
import { DragonCityImage } from '@/lib/dragonCityImage';
import VillageNavigation from './VillageNavigation';
import TrainingMap3D from './TrainingMap3D';

const DRAGON_CITY_ABI = [
  {
    inputs: [{ name: 'dragonId', type: 'uint256' }, { name: 'stat', type: 'string' }],
    name: 'startTraining',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'dragonId', type: 'uint256' }],
    name: 'completeTraining',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'dragonId', type: 'uint256' }],
    name: 'evolveDragon',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'dragonId', type: 'uint256' }],
    name: 'getDragon',
    outputs: [{ type: 'tuple', components: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'primary', type: 'uint8' },
      { name: 'secondary', type: 'uint8' },
      { name: 'rarity', type: 'uint8' },
      { name: 'form', type: 'uint8' },
      { name: 'attack', type: 'uint256' },
      { name: 'defense', type: 'uint256' },
      { name: 'health', type: 'uint256' },
      { name: 'speed', type: 'uint256' },
      { name: 'level', type: 'uint256' },
      { name: 'experience', type: 'uint256' },
      { name: 'trainingCount', type: 'uint256' },
    ]}],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserDragons',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'baseTrainingFee',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'evolutionFee',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
] as const;

const STATS = ['attack', 'defense', 'health', 'speed'];
const STAT_ICONS = { attack: '⚔️', defense: '🛡️', health: '❤️', speed: '⚡' };
const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const FORM_NAMES = ['Basic', 'Evolved', 'Advanced', 'Ultimate'];

interface DragonTrainingProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function DragonTraining({ onBack, showNavigation = false }: DragonTrainingProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [selectedStat, setSelectedStat] = useState<string>('attack');
  const [activeTab, setActiveTab] = useState<'train' | 'evolve' | 'map'>('map');

  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220 
    ? CONTRACTS.celo.dragonNFT 
    : CONTRACTS.localhost.dragonNFT;

  const { data: userDragons } = useReadContract({
    address: contractAddress,
    abi: DRAGON_CITY_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  }) as { data: readonly bigint[] | undefined };

  const { data: baseTrainingFee } = useReadContract({
    address: contractAddress,
    abi: DRAGON_CITY_ABI,
    functionName: 'baseTrainingFee',
  }) as { data: bigint | undefined };

  const { data: evolutionFee } = useReadContract({
    address: contractAddress,
    abi: DRAGON_CITY_ABI,
    functionName: 'evolutionFee',
  }) as { data: bigint | undefined };

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleStartTraining = () => {
    if (!selectedDragon || !baseTrainingFee) return;

    writeContract({
      address: contractAddress,
      abi: DRAGON_CITY_ABI,
      functionName: 'startTraining',
      args: [selectedDragon, selectedStat],
      value: baseTrainingFee,
    });
  };

  const handleCompleteTraining = () => {
    if (!selectedDragon) return;

    writeContract({
      address: contractAddress,
      abi: DRAGON_CITY_ABI,
      functionName: 'completeTraining',
      args: [selectedDragon],
    });
  };

  const handleEvolve = () => {
    if (!selectedDragon || !evolutionFee) return;

    writeContract({
      address: contractAddress,
      abi: DRAGON_CITY_ABI,
      functionName: 'evolveDragon',
      args: [selectedDragon],
      value: evolutionFee,
    });
  };

  return (
    <div>
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6 mb-6 border border-purple-500/30">
        <h3 className="text-2xl font-bold mb-4">🏋️ Dragon Training & Evolution</h3>
        <p className="text-gray-300 text-sm">
          Train your dragons to increase their stats or evolve them to unlock new forms and abilities!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'map'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🗺️ Training Map
        </button>
        <button
          onClick={() => setActiveTab('train')}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'train'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          💪 Training
        </button>
        <button
          onClick={() => setActiveTab('evolve')}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'evolve'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ✨ Evolution
        </button>
      </div>

      {/* 3D Training Map Tab */}
      {activeTab === 'map' && (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
          <TrainingMap3D 
            onTileClick={(tile) => {
              console.log('Selected training zone:', tile);
              // You can add logic here to start training on specific terrain
              if (tile.element) {
                setActiveTab('train');
              }
            }}
          />
        </div>
      )}

      {/* Dragon Selection */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Select Dragon</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {userDragons?.map((dragonId) => (
            <DragonSelectCard
              key={dragonId.toString()}
              dragonId={dragonId}
              contractAddress={contractAddress}
              selected={selectedDragon === dragonId}
              onSelect={() => setSelectedDragon(dragonId)}
            />
          ))}
        </div>
        {(!userDragons || userDragons.length === 0) && (
          <p className="text-gray-400 text-sm">You don't have any dragons yet.</p>
        )}
      </div>

      {/* Training Tab */}
      {activeTab === 'train' && selectedDragon && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-bold text-xl mb-4">💪 Stat Training</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {STATS.map((stat) => (
              <button
                key={stat}
                onClick={() => setSelectedStat(stat)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedStat === stat
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">{STAT_ICONS[stat as keyof typeof STAT_ICONS]}</div>
                <div className="font-bold capitalize">{stat}</div>
              </button>
            ))}
          </div>

          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-300">
              <strong>Training Info:</strong>
            </p>
            <ul className="text-sm text-gray-300 mt-2 space-y-1">
              <li>• Duration: 1 hour</li>
              <li>• Cost: {baseTrainingFee ? formatEther(baseTrainingFee) : '0.001'} ETH (increases with level)</li>
              <li>• Stat Boost: +5 per training session</li>
              <li>• Earns 50 XP towards level up</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartTraining}
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-bold transition-all"
            >
              {isPending ? '⏳ Starting...' : '🏋️ Start Training'}
            </button>
            <button
              onClick={handleCompleteTraining}
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg font-bold transition-all"
            >
              {isPending ? '⏳ Completing...' : '✅ Complete Training'}
            </button>
          </div>
        </div>
      )}

      {/* Evolution Tab */}
      {activeTab === 'evolve' && selectedDragon && (
        <DragonEvolutionPanel
          dragonId={selectedDragon}
          contractAddress={contractAddress}
          evolutionFee={evolutionFee}
          onEvolve={handleEvolve}
          isPending={isPending}
        />
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-300">
          ✅ Action completed successfully!
        </div>
      )}
    </div>
  );
}

function DragonSelectCard({
  dragonId,
  contractAddress,
  selected,
  onSelect,
}: {
  dragonId: bigint;
  contractAddress: `0x${string}`;
  selected: boolean;
  onSelect: () => void;
}) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_CITY_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: any };

  if (!dragon) return null;

  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-purple-500 bg-purple-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex flex-col items-center">
        <DragonCityImage
          element={dragon.primary as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}
          rarity={dragon.rarity as 0 | 1 | 2 | 3 | 4}
          form={dragon.form as 0 | 1 | 2 | 3}
          size={80}
          animated={selected}
        />
        <div className="text-xs mt-2 font-bold">{dragon.name}</div>
        <div className="text-xs text-gray-400">Lv. {dragon.level.toString()}</div>
        <div className="text-xs text-purple-400">{FORM_NAMES[dragon.form]}</div>
      </div>
    </button>
  );
}

function DragonEvolutionPanel({
  dragonId,
  contractAddress,
  evolutionFee,
  onEvolve,
  isPending,
}: {
  dragonId: bigint;
  contractAddress: `0x${string}`;
  evolutionFee: bigint | undefined;
  onEvolve: () => void;
  isPending: boolean;
}) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_CITY_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: any };

  if (!dragon) return null;

  const currentForm = dragon.form;
  const canEvolve = currentForm < 3; // Not ULTIMATE
  const nextForm = Math.min(currentForm + 1, 3);

  const evolutionBoost = 20 + (dragon.rarity * 10);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <h4 className="font-bold text-xl mb-4">✨ Evolution System</h4>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Current Form */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="text-center mb-3">
            <div className="text-gray-400 text-sm mb-2">Current Form</div>
            <DragonCityImage
              element={dragon.primary as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}
              rarity={dragon.rarity as 0 | 1 | 2 | 3 | 4}
              form={currentForm as 0 | 1 | 2 | 3}
              size={120}
              animated={true}
            />
            <div className="font-bold mt-2">{FORM_NAMES[currentForm]}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>⚔️ {dragon.attack.toString()}</div>
            <div>🛡️ {dragon.defense.toString()}</div>
            <div>❤️ {dragon.health.toString()}</div>
            <div>⚡ {dragon.speed.toString()}</div>
          </div>
        </div>

        {/* Next Form */}
        {canEvolve && (
          <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/50">
            <div className="text-center mb-3">
              <div className="text-purple-400 text-sm mb-2">Next Form</div>
              <DragonCityImage
                element={dragon.primary as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}
                rarity={dragon.rarity as 0 | 1 | 2 | 3 | 4}
                form={nextForm as 0 | 1 | 2 | 3}
                size={120}
                animated={true}
              />
              <div className="font-bold mt-2 text-purple-300">{FORM_NAMES[nextForm]}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-400">
              <div>⚔️ {(parseInt(dragon.attack) + evolutionBoost).toString()} (+{evolutionBoost})</div>
              <div>🛡️ {(parseInt(dragon.defense) + evolutionBoost).toString()} (+{evolutionBoost})</div>
              <div>❤️ {(parseInt(dragon.health) + evolutionBoost * 2).toString()} (+{evolutionBoost * 2})</div>
              <div>⚡ {(parseInt(dragon.speed) + evolutionBoost).toString()} (+{evolutionBoost})</div>
            </div>
          </div>
        )}
      </div>

      {canEvolve ? (
        <>
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-purple-300">
              <strong>Evolution Benefits:</strong>
            </p>
            <ul className="text-sm text-gray-300 mt-2 space-y-1">
              <li>✨ Unlock new visual form</li>
              <li>📈 Major stat boost (+{evolutionBoost} per stat)</li>
              <li>🎨 Enhanced particle effects</li>
              <li>💎 Increased battle power</li>
              <li>💰 Higher resale value</li>
            </ul>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 mb-4 text-sm">
            <strong>Cost:</strong> {evolutionFee ? formatEther(evolutionFee) : '0.01'} ETH
          </div>

          <button
            onClick={onEvolve}
            disabled={isPending}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 rounded-lg font-bold text-lg transition-all"
          >
            {isPending ? '⏳ Evolving...' : `✨ Evolve to ${FORM_NAMES[nextForm]}`}
          </button>
        </>
      ) : (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
          <div className="text-4xl mb-2">👑</div>
          <div className="font-bold text-green-300">Maximum Evolution Reached!</div>
          <div className="text-sm text-gray-400 mt-2">This dragon has achieved its ultimate form.</div>
        </div>
      )}
    </div>
  );
}
