'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { parseEther } from 'viem';
import { useState } from 'react';
import { ELEMENT_NAMES, ELEMENT_COLORS, RARITY_NAMES } from '@/lib/types';
import VillageNavigation from './VillageNavigation';

// DragonCityNFT ABI for createDragon
const DRAGON_CITY_ABI = [
  {
    inputs: [
      { name: 'primary', type: 'uint8' },
      { name: 'secondary', type: 'uint8' },
      { name: 'rarity', type: 'uint8' }
    ],
    name: 'createDragon',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  }
] as const;

interface EggMarketplaceProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function EggMarketplace({ onBack, showNavigation = false }: EggMarketplaceProps = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [buying, setBuying] = useState(false);

  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonCity 
    : chainId === 42220
    ? CONTRACTS.celo.dragonCity
    : CONTRACTS.localhost.dragonCity; // Use DragonCityNFT

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleBuyEgg = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!contractAddress || contractAddress === '0x') {
      alert('Contract not deployed. Please check .env.local has NEXT_PUBLIC_DRAGON_CITY_LOCAL set');
      console.error('Contract address missing:', contractAddress);
      return;
    }
    
    // Random element and rarity for mystery egg
    const randomPrimary = Math.floor(Math.random() * 10); // 0-9 (10 elements)
    const randomSecondary = Math.floor(Math.random() * 10);
    
    // Rarity distribution: 60% Common, 30% Rare, 8% Epic, 2% Legendary
    const rand = Math.random() * 100;
    let rarity = 0; // COMMON
    if (rand > 98) rarity = 3; // LEGENDARY
    else if (rand > 90) rarity = 2; // EPIC  
    else if (rand > 60) rarity = 1; // RARE
    
    console.log('=== BUY EGG DEBUG ===');
    console.log('Wallet address:', address);
    console.log('Contract address:', contractAddress);
    console.log('Chain ID:', chainId);
    console.log('Network:', chainId === 31337 ? 'Hardhat Local' : chainId === 8453 ? 'Base' : chainId === 42220 ? 'Celo' : 'Unknown');
    console.log('Dragon params:', { primary: randomPrimary, secondary: randomSecondary, rarity });
    console.log('Cost: 0.01 ETH');
    
    setBuying(true);
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: DRAGON_CITY_ABI,
        functionName: 'createDragon',
        args: [randomPrimary, randomSecondary, rarity],
        value: parseEther('0.01'),
      });
      console.log('Transaction sent successfully');
    } catch (error: any) {
      console.error('=== ERROR BUYING EGG ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error cause:', error?.cause);
      
      // Show user-friendly error
      if (error?.message?.includes('insufficient')) {
        alert('Insufficient balance! You need at least 0.01 ETH. Current network: ' + 
              (chainId === 31337 ? 'Hardhat Local' : 'Unknown'));
      } else {
        alert('Transaction failed: ' + (error?.message || 'Unknown error'));
      }
    } finally {
      setBuying(false);
    }
  };

  if (!address) {
    return (
      <div className="relative">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20 bg-gradient-to-b from-purple-900/50 to-transparent rounded-lg border border-purple-500/30 p-8">
          <p className="text-white text-2xl mb-4">🔐 Wallet Not Connected</p>
          <p className="text-gray-300">Connect your wallet to buy dragon eggs</p>
        </div>
      </div>
    );
  }

  // Debug display
  const networkName = chainId === 31337 ? 'Hardhat Local' : 
                      chainId === 8453 ? 'Base' : 
                      chainId === 42220 ? 'Celo' : 
                      `Unknown (${chainId})`;

  return (
    <div className="relative">
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-black/50 rounded-lg border border-yellow-500/50 text-sm">
        <p className="text-yellow-300 font-bold mb-2">🔍 Debug Info:</p>
        <p className="text-white">Network: <span className="text-green-400">{networkName}</span></p>
        <p className="text-white">Wallet: <span className="text-green-400">{address?.slice(0, 6)}...{address?.slice(-4)}</span></p>
        <p className="text-white">Contract: <span className="text-green-400">{contractAddress || 'NOT SET'}</span></p>
        {!contractAddress && (
          <p className="text-red-400 mt-2">⚠️ Contract address missing! Check .env.local</p>
        )}
        {chainId !== 31337 && (
          <p className="text-orange-400 mt-2">⚠️ Not on Hardhat Local! Switch to network with Chain ID 31337</p>
        )}
      </div>
      <h2 className="text-2xl font-bold mb-6">🥚 Egg Marketplace</h2>
      
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6 mb-8 border border-purple-500/30">
        <h3 className="text-xl font-bold mb-4">Mystery Dragon Egg</h3>
        <p className="text-gray-300 mb-4">
          Each egg contains a random dragon with unique element and rarity!
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/30 rounded p-3 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xs text-gray-400">Fire</div>
          </div>
          <div className="bg-black/30 rounded p-3 text-center">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-xs text-gray-400">Water</div>
          </div>
          <div className="bg-black/30 rounded p-3 text-center">
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-xs text-gray-400">Earth</div>
          </div>
          <div className="bg-black/30 rounded p-3 text-center">
            <div className="text-2xl mb-1">💨</div>
            <div className="text-xs text-gray-400">Air</div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-2">Rarity Chances:</h4>
          <div className="space-y-2 text-sm">
            <RarityChance rarity="Basic" chance="60%" color="text-gray-400" />
            <RarityChance rarity="Rare" chance="30%" color="text-blue-400" />
            <RarityChance rarity="Legendary" chance="10%" color="text-yellow-400" />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-2">Power Types:</h4>
          <div className="space-y-2 text-sm">
            <RarityChance rarity="Single Power" chance="60%" color="text-gray-400" />
            <RarityChance rarity="Dual Power" chance="30%" color="text-purple-400" />
            <RarityChance rarity="Combined Power" chance="10%" color="text-red-400" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">0.01 ETH</div>
            <div className="text-sm text-gray-400">Per Egg</div>
          </div>
          
          <button
            onClick={handleBuyEgg}
            disabled={buying || isConfirming}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-bold hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Confirming...' : buying ? 'Buying...' : '🥚 Buy Egg'}
          </button>
        </div>

        {isSuccess && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            ✅ Egg purchased successfully! Wait 1 hour to hatch it.
          </div>
        )}
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">How it works:</h3>
        <ol className="space-y-3 text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <span>Purchase a mystery egg for 0.01 ETH</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <span>Wait 1 hour for the egg to be ready to hatch</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <span>Hatch your egg to reveal your dragon's element and rarity</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <span>Start battling and breeding to build your collection!</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function RarityChance({ rarity, chance, color }: { rarity: string; chance: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={color}>{rarity}</span>
      <span className="text-gray-400">{chance}</span>
    </div>
  );
}
