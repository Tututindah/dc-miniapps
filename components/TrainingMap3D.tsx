'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface MapTile {
  type: 'grass' | 'mountain' | 'water' | 'volcano' | 'ice' | 'forest' | 'desert' | 'sky';
  x: number;
  y: number;
  height: number;
  element?: string;
  occupied?: boolean;
}

const TILE_COLORS = {
  grass: { base: '#22c55e', mid: '#16a34a', dark: '#15803d', light: '#4ade80' },
  mountain: { base: '#78716c', mid: '#57534e', dark: '#44403c', light: '#a8a29e' },
  water: { base: '#0ea5e9', mid: '#0284c7', dark: '#0369a1', light: '#38bdf8' },
  volcano: { base: '#dc2626', mid: '#b91c1c', dark: '#991b1b', light: '#ef4444' },
  ice: { base: '#67e8f9', mid: '#22d3ee', dark: '#06b6d4', light: '#a5f3fc' },
  forest: { base: '#059669', mid: '#047857', dark: '#065f46', light: '#10b981' },
  desert: { base: '#f59e0b', mid: '#d97706', dark: '#b45309', light: '#fbbf24' },
  sky: { base: '#3b82f6', mid: '#2563eb', dark: '#1d4ed8', light: '#60a5fa' },
};

export default function TrainingMap3D({ 
  onTileClick 
}: { 
  onTileClick?: (tile: MapTile) => void 
}) {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Generate 3D isometric map (8x8 grid)
  const generateMap = (): MapTile[] => {
    const map: MapTile[] = [];
    const size = 8;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Create varied terrain
        let type: MapTile['type'] = 'grass';
        let height = 1;
        let element = undefined;
        
        // Center volcano
        if (x >= 3 && x <= 4 && y >= 3 && y <= 4) {
          type = 'volcano';
          height = 4;
          element = 'Fire';
        }
        // Top mountains
        else if (y < 2) {
          type = 'mountain';
          height = 2 + Math.floor(Math.random() * 2);
          element = 'Earth';
        }
        // Water areas
        else if ((x === 0 || x === 7) && y > 2) {
          type = 'water';
          height = 0;
          element = 'Water';
        }
        // Ice zone
        else if (x < 2 && y > 5) {
          type = 'ice';
          height = 1;
          element = 'Ice';
        }
        // Forest zone
        else if (x > 5 && y < 3) {
          type = 'forest';
          height = 1;
          element = 'Nature';
        }
        // Desert zone
        else if (x > 5 && y > 5) {
          type = 'desert';
          height = 1;
          element = 'Light';
        }
        // Sky platforms (floating)
        else if ((x === 2 && y === 6) || (x === 5 && y === 2)) {
          type = 'sky';
          height = 3;
          element = 'Air';
        }
        
        map.push({ type, x, y, height, element });
      }
    }
    
    return map;
  };

  const map = generateMap();

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="relative" style={{ perspective: '1200px' }}>
        {/* Map Title */}
        <motion.h2 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold text-white text-center mb-8 drop-shadow-lg"
        >
          🗺️ Dragon Training Grounds 🗺️
        </motion.h2>

        {/* 3D Isometric Grid */}
        <div 
          className="relative"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(60deg) rotateZ(-45deg) scale(1.2)',
          }}
        >
          {map.map((tile, idx) => {
            const colors = TILE_COLORS[tile.type];
            const isHovered = hoveredTile?.x === tile.x && hoveredTile?.y === tile.y;
            
            return (
              <motion.div
                key={`tile-${tile.x}-${tile.y}`}
                initial={{ scale: 0, opacity: 0, rotateX: 90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
                className="absolute cursor-pointer"
                style={{
                  left: `${tile.x * 60}px`,
                  top: `${tile.y * 60}px`,
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={() => setHoveredTile({ x: tile.x, y: tile.y })}
                onMouseLeave={() => setHoveredTile(null)}
                onClick={() => onTileClick?.(tile)}
              >
                {/* Stacked layers for height */}
                {[...Array(tile.height + 1)].map((_, layerIdx) => (
                  <div
                    key={layerIdx}
                    className="absolute"
                    style={{
                      width: '56px',
                      height: '56px',
                      transform: `translateZ(${layerIdx * 8}px)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Top face */}
                    <div
                      className="absolute inset-0 transition-all duration-200"
                      style={{
                        background: layerIdx === tile.height 
                          ? `linear-gradient(135deg, ${colors.light} 0%, ${colors.mid} 50%, ${colors.base} 100%)`
                          : `linear-gradient(135deg, ${colors.mid} 0%, ${colors.base} 100%)`,
                        boxShadow: isHovered 
                          ? `0 0 20px ${colors.light}, 0 4px 0 ${colors.dark}`
                          : `0 2px 0 ${colors.dark}`,
                        transform: isHovered ? 'translateZ(4px)' : 'translateZ(0)',
                      }}
                    >
                      {/* Pixel grid texture */}
                      {layerIdx === tile.height && (
                        <div className="absolute inset-0 opacity-30" style={{
                          backgroundImage: `
                            repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(0,0,0,0.2) 7px, rgba(0,0,0,0.2) 8px),
                            repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(0,0,0,0.2) 7px, rgba(0,0,0,0.2) 8px)
                          `
                        }} />
                      )}
                      
                      {/* Element icon on top layer */}
                      {layerIdx === tile.height && tile.element && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div 
                            className="text-2xl drop-shadow-lg"
                            animate={{
                              y: isHovered ? [-2, -8, -2] : [0, -3, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            {tile.type === 'volcano' && '🔥'}
                            {tile.type === 'water' && '💧'}
                            {tile.type === 'ice' && '❄️'}
                            {tile.type === 'forest' && '🌲'}
                            {tile.type === 'desert' && '☀️'}
                            {tile.type === 'mountain' && '⛰️'}
                            {tile.type === 'sky' && '☁️'}
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {/* Left face */}
                    <div
                      className="absolute top-0 left-0 h-full"
                      style={{
                        width: '8px',
                        background: `linear-gradient(to bottom, ${colors.base}, ${colors.dark})`,
                        transform: 'rotateY(-90deg) translateX(-8px)',
                        transformOrigin: 'left',
                      }}
                    />

                    {/* Right face */}
                    <div
                      className="absolute top-0 right-0 h-full"
                      style={{
                        width: '8px',
                        background: `linear-gradient(to bottom, ${colors.mid}, ${colors.dark})`,
                        transform: 'rotateY(90deg) translateX(8px)',
                        transformOrigin: 'right',
                      }}
                    />

                    {/* Front face */}
                    <div
                      className="absolute bottom-0 left-0 w-full"
                      style={{
                        height: '8px',
                        background: `linear-gradient(to right, ${colors.dark}, ${colors.base})`,
                        transform: 'rotateX(-90deg) translateY(8px)',
                        transformOrigin: 'bottom',
                      }}
                    />

                    {/* Back face */}
                    <div
                      className="absolute top-0 left-0 w-full"
                      style={{
                        height: '8px',
                        background: `linear-gradient(to right, ${colors.base}, ${colors.mid})`,
                        transform: 'rotateX(90deg) translateY(-8px)',
                        transformOrigin: 'top',
                      }}
                    />
                  </div>
                ))}

                {/* Hover indicator */}
                {isHovered && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/80 px-2 py-1 rounded whitespace-nowrap"
                    style={{
                      transform: 'rotateX(-60deg) rotateZ(45deg) translateX(-50%)',
                      transformOrigin: 'center',
                    }}
                  >
                    {tile.element || tile.type.toUpperCase()}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Map Legend */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-black/50 backdrop-blur-md rounded-lg p-4 border border-white/20"
        >
          <h3 className="text-white font-bold mb-2 text-center">Training Zones</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {Object.entries(TILE_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-white/30" 
                  style={{ background: colors.mid }}
                />
                <span className="text-white/80 capitalize">{type}</span>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs mt-2 text-center">
            Click on tiles to send your dragon for training!
          </p>
        </motion.div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xl pointer-events-none"
            style={{
              left: `${Math.random() * 500}px`,
              top: `${Math.random() * 500}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>
    </div>
  );
}
