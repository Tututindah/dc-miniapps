import { motion } from 'framer-motion';
import { DragonImage } from '@/lib/dragonImage';
import { ELEMENT_NAMES, ELEMENT_COLORS, POWER_TYPE_NAMES } from '@/lib/types';

interface DragonCardProps {
  dragonId: bigint;
  element: number;
  powerType: number;
  level: number;
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  exp?: number;
  expToNext?: number;
  isSelected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function DragonCard({
  dragonId,
  element,
  powerType,
  level,
  hp,
  maxHp,
  attack,
  defense,
  speed,
  exp,
  expToNext,
  isSelected = false,
  onClick,
  showStats = true,
  size = 'medium'
}: DragonCardProps) {
  const elementColor = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS];
  const sizeClass = {
    small: 'w-32',
    medium: 'w-48',
    large: 'w-64'
  }[size];

  const imageSize = {
    small: 60,
    medium: 100,
    large: 140
  }[size];

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.05 : 1, y: onClick ? -5 : 0 }}
      whileTap={{ scale: onClick ? 0.95 : 1 }}
      onClick={onClick}
      className={`${sizeClass} ${onClick ? 'cursor-pointer' : ''} relative`}
      style={{ perspective: '1000px' }}
    >
      {/* Cardboard Card Container */}
      <div
        className={`
          relative rounded-2xl overflow-hidden
          bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100
          border-4 border-amber-900
          shadow-[0_8px_0_rgba(120,53,15,0.5),0_12px_20px_rgba(0,0,0,0.3)]
          ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
          transition-all duration-200
        `}
        style={{
          transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(120,53,15,0.03) 10px, rgba(120,53,15,0.03) 20px),
            repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(120,53,15,0.02) 10px, rgba(120,53,15,0.02) 20px)
          `
        }}
      >
        {/* Tape Effect at Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-yellow-200/60 border-l-2 border-r-2 border-yellow-300 z-10" 
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
        />

        {/* Element Badge - Top Right */}
        <div 
          className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white z-20 shadow-lg"
          style={{ 
            backgroundColor: elementColor,
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          {ELEMENT_NAMES[element]}
        </div>

        {/* Level Badge - Top Left */}
        <div className="absolute top-2 left-2 bg-amber-900 text-yellow-100 px-2 py-1 rounded-full text-xs font-bold z-20 shadow-lg border-2 border-yellow-400">
          Lv.{level}
        </div>

        {/* Dragon Image on Cardboard */}
        <div className="pt-8 pb-4 px-4 flex justify-center items-center bg-gradient-to-b from-transparent to-amber-100/50">
          <div className="relative">
            {/* Shadow under dragon */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/20 rounded-full blur-sm" />
            <DragonImage 
              element={element as 0 | 1 | 2 | 3 | 4 | 5} 
              powerType={powerType as 0 | 1 | 2} 
              size={imageSize}
            />
          </div>
        </div>

        {/* Power Type Ribbon */}
        <div className="relative -mt-2 mb-3">
          <div 
            className="mx-auto w-3/4 py-1 px-3 text-center rounded-md text-xs font-bold text-white shadow-md"
            style={{
              background: powerType === 2 
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : powerType === 1
                ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
                : 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
              border: '2px solid rgba(255,255,255,0.4)'
            }}
          >
            {POWER_TYPE_NAMES[powerType]}
          </div>
        </div>

        {/* Stats Section */}
        {showStats && (hp !== undefined) && (
          <div className="px-4 pb-4 space-y-2">
            {/* HP Bar */}
            <div className="bg-amber-200/50 rounded-lg p-2 border-2 border-amber-800/30">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-red-700">❤️ HP</span>
                <span className="text-xs font-bold text-amber-900">{hp}/{maxHp}</span>
              </div>
              <div className="bg-amber-300 rounded-full h-2 overflow-hidden border border-amber-900/30">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${(hp / (maxHp || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Combat Stats */}
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-amber-200/50 rounded-md p-1.5 border-2 border-amber-800/30 text-center">
                <div className="text-xs font-bold text-orange-700">⚔️</div>
                <div className="text-xs font-bold text-amber-900">{attack}</div>
              </div>
              <div className="bg-amber-200/50 rounded-md p-1.5 border-2 border-amber-800/30 text-center">
                <div className="text-xs font-bold text-blue-700">🛡️</div>
                <div className="text-xs font-bold text-amber-900">{defense}</div>
              </div>
              <div className="bg-amber-200/50 rounded-md p-1.5 border-2 border-amber-800/30 text-center">
                <div className="text-xs font-bold text-yellow-700">⚡</div>
                <div className="text-xs font-bold text-amber-900">{speed}</div>
              </div>
            </div>

            {/* EXP Bar */}
            {exp !== undefined && expToNext !== undefined && (
              <div className="bg-amber-200/50 rounded-lg p-2 border-2 border-amber-800/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-purple-700">✨ EXP</span>
                  <span className="text-xs text-amber-900">{exp}/{expToNext}</span>
                </div>
                <div className="bg-amber-300 rounded-full h-1.5 overflow-hidden border border-amber-900/30">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${(exp / (expToNext || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cardboard texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Corner staples effect */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-gray-400 rounded-full shadow-inner" />
        <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full shadow-inner" />
        <div className="absolute bottom-1 left-1 w-2 h-2 bg-gray-400 rounded-full shadow-inner" />
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-400 rounded-full shadow-inner" />
      </div>

      {/* Card shadow base */}
      <div className="absolute -bottom-1 left-1 right-1 h-3 bg-gradient-to-b from-amber-900/40 to-transparent rounded-b-2xl -z-10" />
    </motion.div>
  );
}
