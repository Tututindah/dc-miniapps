'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { DRAGON_NFT_ABI } from '@/lib/contracts';
import { Dragon, ELEMENT_NAMES, ELEMENT_COLORS } from '@/lib/types';
import { DragonImage } from '@/lib/dragonImage';
import { useState } from 'react';
import VillageNavigation from './VillageNavigation';

interface BreedingLabProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function BreedingLab({ onBack, showNavigation = false }: BreedingLabProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [parent1, setParent1] = useState<bigint | null>(null);
  const [parent2, setParent2] = useState<bigint | null>(null);

  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220
    ? CONTRACTS.celo.dragonNFT
    : CONTRACTS.localhost.dragonNFT;

  const { data: dragonIds } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleBreed = async () => {
    if (!parent1 || !parent2) return;

    writeContract({
      address: contractAddress,
      abi: DRAGON_NFT_ABI,
      functionName: 'breedDragons',
      args: [parent1, parent2],
    });
  };

  if (!address) {
    return (
      <div>
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Connect your wallet to breed dragons</p>
        </div>
      </div>
    );
  }

  const breedableDragons = dragonIds?.filter((id) => {
    // Filter logic could check level >= 4
    return true;
  }) || [];

  if (breedableDragons.length < 2) {
    return (
      <div>
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">You need at least 2 dragons to breed</p>
          <p className="text-gray-500">Both dragons must be level 4 or higher</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      <h2 className="text-2xl font-bold mb-6">💕 Breeding Laboratory</h2>

      <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-lg p-6 mb-8 border border-pink-500/30">
        <h3 className="text-xl font-bold mb-4">How Breeding Works</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Both parent dragons must be level 4 or higher</li>
          <li>• The offspring inherits traits from both parents</li>
          <li>• Element can be inherited or mutate into a hybrid type</li>
          <li>• Stats are averaged from parents with random variation</li>
          <li>• Offspring starts at level 1</li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-4">Select Parent 1</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {breedableDragons.map((dragonId) => (
              <DragonSelector
                key={dragonId.toString()}
                dragonId={dragonId}
                contractAddress={contractAddress}
                selected={parent1 === dragonId}
                onSelect={() => setParent1(dragonId)}
                disabled={parent2 === dragonId}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Select Parent 2</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {breedableDragons.map((dragonId) => (
              <DragonSelector
                key={dragonId.toString()}
                dragonId={dragonId}
                contractAddress={contractAddress}
                selected={parent2 === dragonId}
                onSelect={() => setParent2(dragonId)}
                disabled={parent1 === dragonId}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleBreed}
          disabled={!parent1 || !parent2 || isConfirming}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? 'Breeding...' : '🥚 Breed Dragons'}
        </button>

        {isSuccess && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 inline-block">
            ✅ New dragon hatched! Check your collection.
          </div>
        )}
      </div>
    </div>
  );
}

function DragonSelector({
  dragonId,
  contractAddress,
  selected,
  onSelect,
  disabled,
}: {
  dragonId: bigint;
  contractAddress: `0x${string}`;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: DRAGON_NFT_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: Dragon | undefined };

  if (!dragon) return null;

  const elementName = ELEMENT_NAMES[dragon.element];
  const elementColor = ELEMENT_COLORS[dragon.element as keyof typeof ELEMENT_COLORS];
  const canBreed = dragon.level >= 4;

  return (
    <button
      onClick={onSelect}
      disabled={disabled || !canBreed}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        selected
          ? 'border-purple-500 bg-purple-500/20'
          : disabled || !canBreed
          ? 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-4">
        <div>
          <DragonImage 
            element={dragon.element as 0 | 1 | 2 | 3 | 4 | 5} 
            powerType={dragon.powerType as 0 | 1 | 2} 
            size={60} 
          />
        </div>
        <div className="flex-1">
          <div className="font-bold">{dragon.name}</div>
          <div className="flex gap-4 text-sm text-gray-400">
            <span style={{ color: elementColor }}>{elementName}</span>
            <span>Lv. {dragon.level}</span>
            <span>ATK: {dragon.attack}</span>
          </div>
          {!canBreed && (
            <div className="text-xs text-red-400 mt-1">Level 4 required</div>
          )}
        </div>
      </div>
    </button>
  );
}
