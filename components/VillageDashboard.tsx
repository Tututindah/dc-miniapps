'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DragonCollection from './DragonCollection';
import EggMarketplace from './EggMarketplace';
import BreedingLabWASM from './BreedingLabWASM';
import BattleArenaWASM from './BattleArenaWASM';
import DragonTrainingWASM from './DragonTrainingWASM';
import DragonMarketplaceV2 from './DragonMarketplaceV2';
import HabitatManagement from './HabitatManagement';
import MissionBoard from './MissionBoard';
import { useRouter } from 'next/navigation';
import { soundManager } from '@/lib/soundManager';

type Room = 'village' | 'hatchery' | 'breeding' | 'collection' | 'battle' | 'upgrade' | 'training' | 'marketplace' | 'missions' | 'play';

export default function VillageDashboard() {
  const [currentRoom, setCurrentRoom] = useState<Room>('village');
  const [isMuted, setIsMuted] = useState(false);
  const router = useRouter();

  // Initialize sounds on mount
  useEffect(() => {
    const timestamp = new Date().getTime();
    console.log('VillageDashboard v2.0 loaded at:', timestamp);
    
    // Initialize sound manager
    soundManager.initSounds();
    
    // Play village ambient music when on village screen
    if (currentRoom === 'village') {
      soundManager.playMusic('village_ambient');
    }

    return () => {
      soundManager.stopMusic();
    };
  }, []);

  // Update music when room changes
  useEffect(() => {
    if (currentRoom === 'village') {
      soundManager.playMusic('village_ambient');
    } else {
      soundManager.stopMusic();
    }
  }, [currentRoom]);

  const handleNavigate = (room: Room) => {
    soundManager.play('click', 0.8);
    if (room === 'play') {
      router.push('/play');
    } else {
      setCurrentRoom(room);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {currentRoom === 'village' ? (
        <VillageHub onNavigate={handleNavigate} isMuted={isMuted} onToggleMute={handleToggleMute} />
      ) : currentRoom !== 'play' ? (
        <RoomView room={currentRoom} onBack={() => { soundManager.play('click', 0.8); setCurrentRoom('village'); }} />
      ) : null}
    </div>
  );
}

function VillageHub({ onNavigate, isMuted, onToggleMute }: { onNavigate: (room: Room) => void; isMuted: boolean; onToggleMute: () => void }) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Grid positions - Clash of Clans diamond layout
  const rooms = [
    { 
      id: 'collection' as Room, 
      name: 'Dragon Habitat',
      icon: '🏝️',
      image: '/assets/buildings/castle.png',
      grid: { row: -1, col: 2 },
      size: { w: 140, h: 160 }
    },
    { 
      id: 'breeding' as Room, 
      name: 'Breeding Cave',
      icon: '💕',
      image: '/assets/buildings/temple.png',
      grid: { row: 1, col: 1 },
      size: { w: 140, h: 160 }
    },
    { 
      id: 'hatchery' as Room, 
      name: 'Hatchery', 
      icon: '🥚',
      image: '/assets/buildings/farm.png',
      grid: { row: -1, col: 1 },
      size: { w: 130, h: 150 }
    },
    { 
      id: 'battle' as Room, 
      name: 'Battle Arena',
      icon: '⚔️',
      image: '/assets/buildings/fortress.png',
      grid: { row: 1, col: 2 },
      size: { w: 140, h: 160 }
    },
    { 
      id: 'training' as Room, 
      name: 'Training Dojo',
      icon: '🥋',
      image: '/assets/buildings/tower.png',
      grid: { row: 0, col: 3 },
      size: { w: 120, h: 170 }
    },
    { 
      id: 'marketplace' as Room, 
      name: 'Trading Post',
      icon: '🏪',
      image: '/assets/buildings/farm.png',
      grid: { row: -2, col: 3 },
      size: { w: 130, h: 150 }
    },
    { 
      id: 'missions' as Room, 
      name: 'Mission Board',
      icon: '🎯',
      image: '/assets/buildings/tower.png',
      grid: { row: 0, col: 1 },
      size: { w: 120, h: 160 }
    },
    { 
      id: 'play' as Room, 
      name: 'Hangout Zone',
      icon: '🎮',
      image: '/assets/buildings/fortress.png',
      grid: { row: 2, col: 3 },
      size: { w: 140, h: 160 }
    },
  ];

  // Isometric grid converter - Clash of Clans diamond centered
  const gridToIso = (row: number, col: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    // Diamond isometric spacing
    const tileWidth = isMobile ? 100 : 140;
    const tileHeight = isMobile ? 50 : 70;
    const offsetX = 50; // Center horizontal
    const offsetY = isMobile ? 40 : 45; // Center vertical
    
    // Classic isometric diamond formula
    const x = offsetX + (col - 2) * (tileWidth / 4); // col 2 = center (0 offset)
    const y = offsetY + (row * (tileHeight / 4)) + ((col - 2) * (tileHeight / 8));
    
    return { x, y };
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Top Navigation Bar */}
    <div 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg"
      style={{ height: '50px' }}
    >
      <div className="h-full px-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-white drop-shadow-sm">
          Dragon Village
        </h1>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
            <span>💎</span>
            <span>500</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
            <span>🪙</span>
            <span>1,250</span>
          </div>
          <button 
            onClick={onToggleMute}
            className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all"
          >
            {isMuted ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>

      {/* ISOMETRIC MAP - Dirt terrain */}
      <div 
        className="fixed left-0 right-0 bg-gray-100 overflow-hidden"
        style={{
          top: '50px',
          bottom: 0,
          backgroundImage: 'url(https://png.pngtree.com/thumb_back/fw800/background/20240104/pngtree-cartoon-dirt-ground-layer-fun-game-texture-for-level-design-image_13880734.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20" />

        {/* Buildings on isometric grid */}
        <div className="relative w-full h-full">
          {rooms.map((room, index) => {
            const pos = gridToIso(room.grid.row, room.grid.col);
            const zIndex = room.grid.row + room.grid.col;
            
            return (
              <div
                key={room.id}
                className="absolute cursor-pointer group transition-transform duration-200 hover:scale-110 hover:-translate-y-2"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${room.size.w}px`,
                  height: `${room.size.h}px`,
                  zIndex: zIndex * 10,
                  transform: 'translateX(-50%) translateY(-50%)',
                }}
                onClick={() => onNavigate(room.id)}
                onMouseEnter={() => {
                  setHoveredRoom(room.id);
                  soundManager.play('hover', 0.5);
                }}
                onMouseLeave={() => setHoveredRoom(null)}
              >
              {/* Shadow */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 bg-black/40 rounded-full blur-lg"
                style={{ 
                  bottom: '-10px',
                  width: '80%',
                  height: '15px',
                  zIndex: -1,
                }}
              />
              
              {/* Building image */}
              <img 
                src={`${room.image}?v=3`}
                alt={room.name}
                className="w-full h-full object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 12px 25px rgba(0,0,0,0.5))',
                }}
              />
              
              {/* Name label on hover */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-amber-400/50 shadow-xl">
                  <span className="text-white font-bold text-xs">{room.name}</span>
                </div>
              </div>

              {/* Level badge */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white rounded-full w-6 h-6 flex items-center justify-center text-[9px] font-bold text-white shadow-lg">
                1
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

function RoomView({ room, onBack }: { room: Exclude<Room, 'village' | 'play'>; onBack: () => void }) {
  const roomConfig: Record<Exclude<Room, 'village' | 'play'>, { title: string; component: JSX.Element; bg: string }> = {
    hatchery: {
      title: '🥚 Hatchery',
      component: <EggMarketplace />,
      bg: 'from-yellow-900 to-orange-900'
    },
    breeding: {
      title: '💕 Breeding Cave',
      component: <BreedingLabWASM showNavigation={false} onBack={onBack} />,
      bg: 'from-pink-900 to-purple-900'
    },
    collection: {
      title: '🏝️ Dragon Habitat',
      component: <HabitatManagement showNavigation={false} onBack={onBack} />,
      bg: 'from-blue-900 to-cyan-900'
    },
    battle: {
      title: '⚔️ Battle Arena',
      component: <BattleArenaWASM onBack={onBack} />,
      bg: 'from-red-900 to-orange-900'
    },
    training: {
      title: '🥋 Training Dojo',
      component: <DragonTrainingWASM onBack={onBack} />,
      bg: 'from-blue-900 to-cyan-900'
    },
    marketplace: {
      title: '🏪 Dragon Marketplace',
      component: <DragonMarketplaceV2 />,
      bg: 'from-green-900 to-emerald-900'
    },
    missions: {
      title: '🎯 Mission Board',
      component: <MissionBoard canCreateMissions={true} />,
      bg: 'from-purple-900 to-blue-900'
    },
    upgrade: {
      title: '⬆️ Training Grounds',
      component: <DragonUpgrade />,
      bg: 'from-purple-900 to-pink-900'
    }
  };

  const config = roomConfig[room];

  return (
    <div className={`fixed inset-0 w-full h-full overflow-x-hidden overflow-y-auto bg-gradient-to-br ${config.bg}`}
    >
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6 mt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="group px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 
                        rounded-lg backdrop-blur-sm border-2 border-amber-400/50 transition-all shadow-lg
                        text-white font-bold flex items-center gap-2"
            >
              <svg 
                className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              <span>Back to Village</span>
            </button>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">{config.title}</h1>
          </div>
        </div>
        <div>
          {config.component}
        </div>
      </div>
    </div>
  );
}

function DragonUpgrade() {
  return (
    <div className="text-white">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
        <h2 className="text-2xl font-bold mb-4">⬆️ Training Grounds</h2>
        <p className="text-white/80 mb-6">Level up your dragons by battling and earning experience!</p>
        
        <div className="grid gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="font-bold mb-2">💪 How to Level Up:</h3>
            <ul className="text-sm text-white/70 space-y-2">
              <li>• Win battles to earn experience points</li>
              <li>• Each 100 EXP increases your dragon's level</li>
              <li>• Higher levels unlock breeding (Level 4+)</li>
              <li>• Stats increase with each level</li>
            </ul>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="font-bold mb-2">🎯 Level Bonuses:</h3>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Attack: +5 per level</li>
              <li>• Defense: +5 per level</li>
              <li>• Speed: +3 per level</li>
              <li>• Battle Power: +5 per level</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
