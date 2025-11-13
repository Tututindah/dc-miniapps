'use client';

import { ConnectWallet } from '@/components/ConnectWallet';
import VillageDashboard from '@/components/VillageDashboard';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/lib/farcaster';
import { DragonImage } from '@/lib/dragonImage';
import { motion } from 'framer-motion';

export default function Home() {
  const { isConnected } = useAccount();
  const { isMiniApp } = useFarcaster();

  if (isMiniApp) {
    return <VillageDashboard />;
  }

  return (
    <main className="min-h-screen">
      <header className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">🏠</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                🐉 Dragon City
              </h1>
              <p className="text-gray-300 text-sm">
                Cross-Chain Dragon Game {isMiniApp && '• Farcaster Mini App'}
              </p>
            </div>
          </button>
          {!isMiniApp && <ConnectWallet />}
        </div>
      </header>
      {!isConnected && !isMiniApp ? (
        <HeroSection isMiniApp={isMiniApp} />
      ) : (
        <VillageDashboard />
      )}
    </main>
  );
}

function HeroSection({ isMiniApp }: { isMiniApp: boolean }) {
  const features = [
    {
      icon: '🐉',
      title: 'Collect Dragons',
      description: '6 unique elements with pixel art design',
      gradient: 'from-red-500 to-orange-500',
      dragon: { element: 0 as const, powerType: 2 as const }, // Fire
    },
    {
      icon: '🥚',
      title: 'Hatch Eggs',
      description: 'Buy eggs and discover rare dragons',
      gradient: 'from-yellow-500 to-orange-500',
      dragon: { element: 5 as const, powerType: 1 as const }, // Light
    },
    {
      icon: '💕',
      title: 'Breed Dragons',
      description: 'Cross-chain breeding on Base & Celo',
      gradient: 'from-pink-500 to-purple-500',
      dragon: { element: 1 as const, powerType: 2 as const }, // Water
    },
    {
      icon: '⚔️',
      title: 'Epic Battles',
      description: 'P2P battles with elemental attacks',
      gradient: 'from-red-600 to-purple-600',
      dragon: { element: 4 as const, powerType: 2 as const }, // Dark
    },
    {
      icon: '🏆',
      title: 'Win & Level Up',
      description: 'Earn EXP and become champion',
      gradient: 'from-yellow-500 to-green-500',
      dragon: { element: 2 as const, powerType: 2 as const }, // Earth
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center gap-4 mb-6">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <DragonImage element={0} powerType={2} size={120} />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ 
                duration: 3,
                delay: 0.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <DragonImage element={1} powerType={2} size={120} />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -25, 0],
                rotate: [0, 15, -15, 0]
              }}
              transition={{ 
                duration: 3,
                delay: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <DragonImage element={4} powerType={2} size={120} />
            </motion.div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Dragon City
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4">
            Breed, Battle, and Collect Pixel Art Dragons
          </p>
          <p className="text-lg text-white/70 mb-8">
            Cross-chain NFT game on Base & Celo • Powered by Farcaster
          </p>
          
          {!isMiniApp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-block"
            >
              <ConnectWallet />
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all h-full">
                <div className="flex flex-col items-center text-center">
                  {/* Dragon Display */}
                  <div className="mb-4 relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                    <DragonImage 
                      element={feature.dragon.element} 
                      powerType={feature.dragon.powerType} 
                      size={100} 
                    />
                  </div>
                  
                  {/* Feature Info */}
                  <div className={`text-4xl mb-3 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Game Features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
                6
              </div>
              <div className="text-white/70">Elements</div>
              <div className="text-xs text-white/50">Fire, Water, Earth, Air, Dark, Light</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                25×25
              </div>
              <div className="text-white/70">Pixel Art</div>
              <div className="text-xs text-white/50">Unique designs per element</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                2
              </div>
              <div className="text-white/70">Blockchains</div>
              <div className="text-xs text-white/50">Base & Celo support</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                ∞
              </div>
              <div className="text-white/70">Possibilities</div>
              <div className="text-xs text-white/50">Breed & battle forever</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
