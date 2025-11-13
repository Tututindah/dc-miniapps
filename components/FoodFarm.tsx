'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import VillageNavigation from './VillageNavigation';

interface FoodFarmProps {
  onBack?: () => void;
  showNavigation?: boolean;
}

interface FoodItem {
  id: number;
  name: string;
  icon: string;
  growTime: number; // in seconds for demo
  goldCost: number;
  foodValue: number;
  level: number;
}

interface Farm {
  id: number;
  foodId: number | null;
  plantedAt: number | null;
  harvestTime: number | null;
  isGrowing: boolean;
}

const FOOD_ITEMS: FoodItem[] = [
  { id: 1, name: 'Dragon Fruit', icon: '🍎', growTime: 10, goldCost: 50, foodValue: 25, level: 1 },
  { id: 2, name: 'Magic Mushroom', icon: '🍄', growTime: 15, goldCost: 100, foodValue: 50, level: 1 },
  { id: 3, name: 'Crystal Berry', icon: '🍇', growTime: 20, goldCost: 200, foodValue: 100, level: 2 },
  { id: 4, name: 'Golden Apple', icon: '🍏', growTime: 30, goldCost: 500, foodValue: 250, level: 3 },
  { id: 5, name: 'Phoenix Pepper', icon: '🌶️', growTime: 45, goldCost: 1000, foodValue: 500, level: 5 },
  { id: 6, name: 'Star Melon', icon: '🍉', growTime: 60, goldCost: 2000, foodValue: 1000, level: 7 },
];

export default function FoodFarm({ onBack, showNavigation = false }: FoodFarmProps = {}) {
  const { address } = useAccount();
  const [gold, setGold] = useState(10000);
  const [food, setFood] = useState(500);
  const [farms, setFarms] = useState<Farm[]>([
    { id: 0, foodId: null, plantedAt: null, harvestTime: null, isGrowing: false },
    { id: 1, foodId: null, plantedAt: null, harvestTime: null, isGrowing: false },
    { id: 2, foodId: null, plantedAt: null, harvestTime: null, isGrowing: false },
    { id: 3, foodId: null, plantedAt: null, harvestTime: null, isGrowing: false },
  ]);
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for ready harvests
  useEffect(() => {
    const interval = setInterval(() => {
      setFarms(prevFarms => 
        prevFarms.map(farm => {
          if (farm.isGrowing && farm.harvestTime && Date.now() >= farm.harvestTime) {
            return { ...farm, isGrowing: false };
          }
          return farm;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const plantFood = (farmId: number, foodItem: FoodItem) => {
    if (gold < foodItem.goldCost) {
      alert('Not enough gold!');
      return;
    }

    const now = Date.now();
    const harvestTime = now + (foodItem.growTime * 1000);

    setGold(gold - foodItem.goldCost);
    setFarms(farms.map(farm => 
      farm.id === farmId 
        ? { ...farm, foodId: foodItem.id, plantedAt: now, harvestTime, isGrowing: true }
        : farm
    ));
    setSelectedFarm(null);
  };

  const harvest = (farmId: number) => {
    const farm = farms.find(f => f.id === farmId);
    if (!farm || !farm.foodId) return;

    const foodItem = FOOD_ITEMS.find(f => f.id === farm.foodId);
    if (!foodItem) return;

    setFood(food + foodItem.foodValue);
    setFarms(farms.map(f => 
      f.id === farmId 
        ? { ...f, foodId: null, plantedAt: null, harvestTime: null, isGrowing: false }
        : f
    ));
  };

  const speedUpGrowth = (farmId: number) => {
    const farm = farms.find(f => f.id === farmId);
    if (!farm || !farm.isGrowing) return;

    const speedUpCost = 500;
    if (gold < speedUpCost) {
      alert('Not enough gold!');
      return;
    }

    setGold(gold - speedUpCost);
    setFarms(farms.map(f => 
      f.id === farmId 
        ? { ...f, harvestTime: Date.now(), isGrowing: false }
        : f
    ));
  };

  const getTimeRemaining = (farm: Farm) => {
    if (!farm.harvestTime) return '';
    const remaining = Math.max(0, farm.harvestTime - currentTime);
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrowthProgress = (farm: Farm) => {
    if (!farm.plantedAt || !farm.harvestTime) return 0;
    const totalTime = farm.harvestTime - farm.plantedAt;
    const elapsed = currentTime - farm.plantedAt;
    return Math.min(100, (elapsed / totalTime) * 100);
  };

  if (!address) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-green-900 via-lime-900 to-gray-900">
        {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
        <div className="text-center py-20">
          <div className="text-8xl mb-6 animate-bounce">🌾</div>
          <p className="text-white text-2xl font-bold drop-shadow-lg">Connect your wallet to manage farms</p>
          <p className="text-gray-400 mt-2">Grow food to feed your dragons!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-green-900 via-lime-900 to-gray-900">
      <div className="min-h-full p-4 sm:p-6">
      {showNavigation && <VillageNavigation onBack={onBack} className="mb-6" />}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white drop-shadow-lg mb-2">🌾 Food Farm</h2>
        <p className="text-yellow-400 text-lg">Grow food to keep your dragons well-fed!</p>
      </div>

      {/* Resource Display */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 border-2 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-yellow-100">💰 Gold</div>
              <div className="text-3xl font-bold text-white">{gold.toLocaleString()}</div>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 border-2 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-green-100">🍎 Food</div>
              <div className="text-3xl font-bold text-white">{food.toLocaleString()}</div>
            </div>
            <div className="text-5xl">🍖</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farm Plots */}
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold text-white mb-4">🏡 Farm Plots</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {farms.map((farm) => (
              <FarmPlot
                key={farm.id}
                farm={farm}
                foodItem={farm.foodId ? FOOD_ITEMS.find(f => f.id === farm.foodId) : null}
                onPlant={() => setSelectedFarm(farm.id)}
                onHarvest={() => harvest(farm.id)}
                onSpeedUp={() => speedUpGrowth(farm.id)}
                timeRemaining={getTimeRemaining(farm)}
                progress={getGrowthProgress(farm)}
              />
            ))}
          </div>

          {/* Expand Farm */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl border-2 border-blue-400 hover:from-blue-500 hover:to-cyan-500 transition-all"
          >
            <div className="text-4xl mb-2">➕</div>
            <div className="text-white font-bold text-lg">Expand Farm</div>
            <div className="text-blue-100 text-sm">Add 2 more plots: 5,000 Gold</div>
          </motion.button>
        </div>

        {/* Food Shop */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">🛒 Seed Shop</h3>
          
          {selectedFarm !== null ? (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-green-400">Select Seeds</h4>
                <button
                  onClick={() => setSelectedFarm(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {FOOD_ITEMS.map((foodItem) => (
                  <FoodItemCard
                    key={foodItem.id}
                    foodItem={foodItem}
                    onSelect={() => plantFood(selectedFarm, foodItem)}
                    canAfford={gold >= foodItem.goldCost}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-600">
              <div className="text-center py-10 text-gray-400">
                <div className="text-6xl mb-4">👈</div>
                <p className="text-lg">Click an empty plot to plant seeds</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Food Usage Guide */}
      <div className="max-w-7xl mx-auto mt-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">📖 Food Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-green-400 font-bold mb-2">🍎 Feeding Dragons</div>
            <p>Feed your dragons to increase their happiness and earn bonus EXP!</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-yellow-400 font-bold mb-2">⚡ Speed Up</div>
            <p>Use 500 gold to instantly harvest any growing crop!</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-blue-400 font-bold mb-2">🌾 Production</div>
            <p>Higher level foods take longer but provide more value!</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// Farm Plot Component
function FarmPlot({ farm, foodItem, onPlant, onHarvest, onSpeedUp, timeRemaining, progress }: any) {
  const isEmpty = !farm.foodId;
  const isReady = !farm.isGrowing && farm.foodId;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative bg-gradient-to-br rounded-2xl p-6 border-2 transition-all ${
        isEmpty 
          ? 'from-gray-700 to-gray-800 border-gray-600 hover:border-green-400 cursor-pointer'
          : isReady
          ? 'from-green-700 to-emerald-800 border-green-400 animate-pulse'
          : 'from-amber-700 to-orange-800 border-amber-500'
      }`}
      onClick={isEmpty ? onPlant : undefined}
    >
      {isEmpty ? (
        <div className="text-center py-10">
          <div className="text-6xl mb-3">🌱</div>
          <div className="text-gray-300 font-bold">Empty Plot</div>
          <div className="text-gray-500 text-sm mt-1">Click to plant</div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">{foodItem?.icon}</div>
            <div className="text-white font-bold">{foodItem?.name}</div>
          </div>

          {farm.isGrowing ? (
            <div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Growing...</span>
                  <span>{timeRemaining}</span>
                </div>
                <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              <button
                onClick={onSpeedUp}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-sm"
              >
                ⚡ Speed Up (500g)
              </button>
            </div>
          ) : (
            <button
              onClick={onHarvest}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all animate-bounce"
            >
              🌾 Harvest (+{foodItem?.foodValue})
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Food Item Card
function FoodItemCard({ foodItem, onSelect, canAfford }: any) {
  return (
    <motion.button
      whileHover={{ scale: canAfford ? 1.02 : 1 }}
      whileTap={{ scale: canAfford ? 0.98 : 1 }}
      onClick={canAfford ? onSelect : undefined}
      disabled={!canAfford}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
        canAfford
          ? 'bg-gray-700/50 hover:bg-gray-600/50 border-2 border-gray-600 hover:border-green-400 cursor-pointer'
          : 'bg-gray-800/30 border border-gray-700 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="text-5xl">{foodItem.icon}</div>
      <div className="flex-1 text-left">
        <div className="font-bold text-white">{foodItem.name}</div>
        <div className="text-xs text-gray-400 mt-1">
          <div>⏱️ {foodItem.growTime}s</div>
          <div>🍖 +{foodItem.foodValue} Food</div>
          <div className="text-yellow-400">💰 {foodItem.goldCost} Gold</div>
        </div>
      </div>
      <div className="text-sm bg-purple-900/50 px-2 py-1 rounded">
        Lv.{foodItem.level}
      </div>
    </motion.button>
  );
}
