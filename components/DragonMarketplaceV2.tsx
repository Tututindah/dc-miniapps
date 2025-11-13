'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi';
import { parseEther, formatEther } from 'viem';
import { DragonCityImage } from '@/lib/dragonCityImage';
import VillageNavigation from './VillageNavigation';

const MARKETPLACE_ABI = [
  {
    inputs: [
      { name: 'dragonId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'acceptInstallments', type: 'bool' }
    ],
    name: 'listDragon',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'buyDragon',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'startInstallmentPurchase',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'payInstallment',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getActiveListings',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'listings',
    outputs: [{ 
      type: 'tuple',
      components: [
        { name: 'dragonId', type: 'uint256' },
        { name: 'seller', type: 'address' },
        { name: 'price', type: 'uint256' },
        { name: 'acceptsInstallments', type: 'bool' },
        { name: 'active', type: 'bool' },
        { name: 'listedAt', type: 'uint256' }
      ]
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'installmentPlans',
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'listingId', type: 'uint256' },
        { name: 'buyer', type: 'address' },
        { name: 'totalPrice', type: 'uint256' },
        { name: 'paidAmount', type: 'uint256' },
        { name: 'installmentsPaid', type: 'uint256' },
        { name: 'lastPaymentTime', type: 'uint256' },
        { name: 'completed', type: 'bool' }
      ]
    }],
    stateMutability: 'view',
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
  }
] as const;

const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const FORM_NAMES = ['Basic', 'Evolved', 'Advanced', 'Ultimate'];

interface DragonMarketplaceV2Props {
  onBack?: () => void;
  showNavigation?: boolean;
}

export default function DragonMarketplaceV2({ onBack, showNavigation = false }: DragonMarketplaceV2Props = {}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState<'browse' | 'sell' | 'myinstallments'>('browse');
  const [selectedDragon, setSelectedDragon] = useState<bigint | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [acceptInstallments, setAcceptInstallments] = useState(true);

  const contractAddress = chainId === 8453 
    ? CONTRACTS.base.dragonNFT 
    : chainId === 42220 
    ? CONTRACTS.celo.dragonNFT 
    : CONTRACTS.localhost.dragonNFT;

  const { data: activeListings } = useReadContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'getActiveListings',
  }) as { data: readonly bigint[] | undefined };

  const { data: myDragons } = useReadContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'getUserDragons',
    args: address ? [address] : undefined,
  }) as { data: readonly bigint[] | undefined };

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleList = () => {
    if (!selectedDragon || !listPrice) return;

    writeContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'listDragon',
      args: [selectedDragon, parseEther(listPrice), acceptInstallments],
    });
  };

  return (
    <div>
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-6 mb-6 border border-green-500/30">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🏪 Dragon Marketplace
          <span className="text-sm font-normal text-gray-400">(2.5% fee)</span>
        </h3>
        <p className="text-gray-300 text-sm">
          Buy and sell dragons with full payment or 3-installment plans (24h intervals)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            activeTab === 'browse'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🛍️ Browse ({activeListings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            activeTab === 'sell'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          💰 Sell Dragons
        </button>
        <button
          onClick={() => setActiveTab('myinstallments')}
          className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
            activeTab === 'myinstallments'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          📋 My Installments
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div>
          <h4 className="font-semibold mb-3 text-xl">Available Dragons</h4>
          {!activeListings || activeListings.length === 0 ? (
            <div className="bg-gray-800/30 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🐉</div>
              <p className="text-gray-400">No dragons listed yet</p>
              <p className="text-sm text-gray-500 mt-2">Be the first to list!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeListings.map((listingId) => (
                <ListingCard
                  key={listingId.toString()}
                  listingId={listingId}
                  contractAddress={contractAddress}
                  userAddress={address}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Tab */}
      {activeTab === 'sell' && (
        <div>
          <h4 className="font-semibold mb-3 text-xl">List Your Dragon</h4>
          
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
            <label className="block text-sm font-bold mb-3">Select Dragon</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {myDragons?.map((dragonId) => (
                <DragonSelectCard
                  key={dragonId.toString()}
                  dragonId={dragonId}
                  contractAddress={contractAddress}
                  selected={selectedDragon === dragonId}
                  onSelect={() => setSelectedDragon(dragonId)}
                />
              ))}
            </div>

            {selectedDragon && (
              <>
                <label className="block text-sm font-bold mb-2 mt-4">Price (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.5"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 rounded border border-gray-700 focus:border-green-500 focus:outline-none mb-4"
                />

                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptInstallments}
                    onChange={(e) => setAcceptInstallments(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">
                    Accept installment payments (3 payments over 72 hours)
                  </span>
                </label>

                {listPrice && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Sale Price:</span>
                      <span className="font-bold">{listPrice} ETH</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Marketplace Fee (2.5%):</span>
                      <span>-{(parseFloat(listPrice) * 0.025).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-500/30 pt-1 mt-1">
                      <span className="font-bold">You Receive:</span>
                      <span className="font-bold text-green-400">
                        {(parseFloat(listPrice) * 0.975).toFixed(4)} ETH
                      </span>
                    </div>
                    {acceptInstallments && (
                      <div className="mt-2 pt-2 border-t border-blue-500/30">
                        <div className="text-xs text-gray-400">Installment breakdown:</div>
                        <div className="text-xs">3 × {(parseFloat(listPrice) / 3).toFixed(4)} ETH</div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleList}
                  disabled={!listPrice || isPending}
                  className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg font-bold text-lg transition-all"
                >
                  {isPending ? '⏳ Listing...' : '📝 List for Sale'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* My Installments Tab */}
      {activeTab === 'myinstallments' && (
        <div>
          <h4 className="font-semibold mb-3 text-xl">My Active Installment Plans</h4>
          <div className="bg-gray-800/30 rounded-lg p-8 text-center">
            <p className="text-gray-400">View and manage your installment purchases here</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-300">
          ✅ Transaction successful!
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listingId,
  contractAddress,
  userAddress,
}: {
  listingId: bigint;
  contractAddress: `0x${string}`;
  userAddress: string | undefined;
}) {
  const [showInstallments, setShowInstallments] = useState(false);
  const { writeContract, isPending } = useWriteContract();

  const { data: listing } = useReadContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'listings',
    args: [listingId],
  }) as { data: any };

  const { data: dragon } = useReadContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'getDragon',
    args: listing ? [listing.dragonId] : undefined,
  }) as { data: any };

  if (!listing || !dragon || !listing.active) return null;

  const handleBuyNow = () => {
    writeContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'buyDragon',
      args: [listingId],
      value: listing.price,
    });
  };

  const handleStartInstallment = () => {
    const firstPayment = listing.price / BigInt(3);
    writeContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'startInstallmentPurchase',
      args: [listingId],
      value: firstPayment,
    });
  };

  const price = formatEther(listing.price);
  const installmentAmount = (parseFloat(price) / 3).toFixed(4);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-gray-700 hover:border-green-500 transition-all">
      <div className="flex justify-center mb-3">
        <DragonCityImage
          element={dragon.primary as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}
          rarity={dragon.rarity as 0 | 1 | 2 | 3 | 4}
          form={dragon.form as 0 | 1 | 2 | 3}
          size={120}
          animated={true}
        />
      </div>

      <div className="space-y-2 text-sm">
        <div className="font-bold text-center text-lg">{dragon.name}</div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-900/50 p-2 rounded">
            <div className="text-gray-400">Rarity</div>
            <div className="font-bold">{RARITY_NAMES[dragon.rarity]}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded">
            <div className="text-gray-400">Form</div>
            <div className="font-bold">{FORM_NAMES[dragon.form]}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 text-xs text-center">
          <div>
            <div className="text-gray-400">⚔️</div>
            <div className="font-bold">{dragon.attack.toString()}</div>
          </div>
          <div>
            <div className="text-gray-400">🛡️</div>
            <div className="font-bold">{dragon.defense.toString()}</div>
          </div>
          <div>
            <div className="text-gray-400">❤️</div>
            <div className="font-bold">{dragon.health.toString()}</div>
          </div>
          <div>
            <div className="text-gray-400">⚡</div>
            <div className="font-bold">{dragon.speed.toString()}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{price} ETH</div>
            <div className="text-xs text-gray-500">
              Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
            </div>
          </div>
        </div>

        <button
          onClick={handleBuyNow}
          disabled={isPending}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded font-bold transition-all"
        >
          {isPending ? '⏳ Buying...' : '💰 Buy Now'}
        </button>

        {listing.acceptsInstallments && (
          <>
            <button
              onClick={() => setShowInstallments(!showInstallments)}
              className="w-full px-4 py-2 bg-blue-600/50 hover:bg-blue-600 rounded text-sm transition-all"
            >
              {showInstallments ? '▼' : '▶'} Pay in Installments
            </button>

            {showInstallments && (
              <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 text-xs">
                <div className="font-bold mb-2">3-Payment Plan:</div>
                <div className="space-y-1">
                  <div>1st: {installmentAmount} ETH (now)</div>
                  <div>2nd: {installmentAmount} ETH (24h later)</div>
                  <div>3rd: {installmentAmount} ETH (48h later)</div>
                </div>
                <button
                  onClick={handleStartInstallment}
                  disabled={isPending}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded font-bold transition-all"
                >
                  {isPending ? '⏳ Starting...' : `Start Plan (${installmentAmount} ETH)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
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
    abi: MARKETPLACE_ABI,
    functionName: 'getDragon',
    args: [dragonId],
  }) as { data: any };

  if (!dragon) return null;

  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-green-500 bg-green-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex flex-col items-center">
        <DragonCityImage
          element={dragon.primary as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}
          rarity={dragon.rarity as 0 | 1 | 2 | 3 | 4}
          form={dragon.form as 0 | 1 | 2 | 3}
          size={70}
          animated={selected}
        />
        <div className="text-xs mt-2 font-bold truncate w-full">{dragon.name}</div>
        <div className="text-xs text-gray-400">Lv. {dragon.level.toString()}</div>
      </div>
    </button>
  );
}
