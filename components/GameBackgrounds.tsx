// Battle Arena Background Component
export function ArenaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Arena Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-stone-900 via-stone-800 to-transparent">
        {/* Floor tiles pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.3) 50px, rgba(0,0,0,0.3) 51px),
            repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.3) 50px, rgba(0,0,0,0.3) 51px)
          `
        }}></div>
      </div>

      {/* Arena Pillars */}
      {[-15, 15, -45, 45].map((pos, i) => (
        <div
          key={i}
          className="absolute bottom-0 h-[70%] w-16 bg-gradient-to-b from-stone-600 to-stone-800 opacity-60"
          style={{
            left: pos < 0 ? `${10}%` : 'auto',
            right: pos > 0 ? `${10}%` : 'auto',
            transform: `translateX(${pos}%) perspective(1000px) rotateY(${pos > 0 ? '-15deg' : '15deg'})`,
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.5)'
          }}
        >
          {/* Pillar details */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-stone-700 border-b-4 border-stone-900"></div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-stone-700 border-t-4 border-stone-900"></div>
        </div>
      ))}

      {/* Spectator stands */}
      <div className="absolute top-20 left-0 right-0 h-32 bg-gradient-to-b from-amber-900/40 to-transparent 
                    border-b-2 border-amber-700/30">
        {/* Crowd silhouettes */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-4 h-8 bg-black/50 rounded-t-full"
            style={{
              left: `${(i * 3.3)}%`,
              height: `${20 + Math.random() * 20}px`,
            }}
          ></div>
        ))}
      </div>

      {/* Torches */}
      {[10, 30, 70, 90].map((pos, i) => (
        <div key={i} className="absolute top-40" style={{ left: `${pos}%` }}>
          <div className="relative">
            {/* Torch pole */}
            <div className="w-3 h-32 bg-gradient-to-b from-amber-900 to-amber-950 mx-auto"></div>
            {/* Flame */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <div className="relative w-8 h-12 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-600 via-yellow-500 to-yellow-300 
                              rounded-full blur-sm animate-bounce" 
                     style={{ animationDuration: '0.5s' }}></div>
                <div className="absolute inset-1 bg-gradient-to-t from-red-500 via-orange-400 to-yellow-200 
                              rounded-full opacity-80"></div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Battle circle in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-96 h-48 border-4 border-yellow-600/30 rounded-full
                    shadow-[0_0_100px_rgba(234,179,8,0.2)] bg-yellow-600/5"></div>

      {/* Lightning effects */}
      <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-purple-400/0 via-purple-400/30 to-purple-400/0 
                    animate-pulse" style={{ animationDuration: '2s' }}></div>
      <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-blue-400/0 via-blue-400/30 to-blue-400/0 
                    animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
    </div>
  );
}

// Training Hall Background
export function TrainingHallBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Training Equipment */}
      <div className="absolute bottom-0 left-10 w-32 h-40">
        {/* Punching Bag */}
        <div className="absolute bottom-0 left-0 w-16 h-32 bg-gradient-to-b from-red-800 to-red-950 
                      rounded-full border-4 border-black/30 shadow-2xl"></div>
        <div className="absolute -top-8 left-0 w-16 h-2 bg-gray-800"></div>
        <div className="absolute -top-32 left-7 w-2 h-32 bg-gray-700"></div>
      </div>

      {/* Weight Rack */}
      <div className="absolute bottom-0 right-10 w-40 h-32">
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 rounded"></div>
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute bottom-4 h-24 w-12 bg-gradient-to-b from-gray-700 to-gray-900 rounded"
               style={{ left: `${i * 14}px` }}>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-16 h-16 
                          bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border-4 border-gray-900"></div>
          </div>
        ))}
      </div>

      {/* Training Mat */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-64 
                    bg-gradient-to-b from-blue-900/40 to-blue-950/60 
                    border-8 border-yellow-600/30 shadow-2xl"></div>

      {/* Motivational Banners */}
      {['TRAIN', 'EVOLVE', 'DOMINATE'].map((text, i) => (
        <div key={i} className="absolute top-20 bg-gradient-to-r from-red-900/80 to-orange-900/80 
                              px-8 py-4 border-4 border-yellow-600/50 shadow-2xl"
             style={{ left: `${20 + i * 30}%` }}>
          <p className="text-2xl font-bold text-yellow-200">{text}</p>
        </div>
      ))}
    </div>
  );
}

// Marketplace Background
export function MarketplaceBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Market Stalls */}
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute bottom-0 h-64 w-48"
             style={{ left: `${10 + i * 30}%` }}>
          {/* Canopy */}
          <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b 
                         ${i === 0 ? 'from-red-600 to-red-800' : i === 1 ? 'from-blue-600 to-blue-800' : 'from-green-600 to-green-800'}
                         clip-path-polygon`}
               style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-24 bg-amber-900"></div>
          </div>
          
          {/* Counter */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-800 to-amber-950 
                        border-4 border-amber-950"></div>
          
          {/* Items on display */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-4xl animate-bounce"
               style={{ animationDuration: `${2 + i}s` }}>
            {['💎', '⚔️', '🛡️'][i]}
          </div>
        </div>
      ))}

      {/* Hanging Lanterns */}
      {[20, 50, 80].map((pos, i) => (
        <div key={i} className="absolute top-10" style={{ left: `${pos}%` }}>
          <div className="w-12 h-16 bg-gradient-to-b from-yellow-600 to-orange-700 rounded-lg 
                        shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-swing"
               style={{ animationDuration: `${3 + i * 0.5}s` }}>
            <div className="absolute inset-2 bg-yellow-300/80 rounded"></div>
          </div>
        </div>
      ))}

      {/* Gold coins scattered */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="absolute w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 
                              rounded-full border-2 border-yellow-700 shadow-lg"
             style={{
               left: `${Math.random() * 100}%`,
               bottom: `${Math.random() * 20 + 10}%`,
               transform: `rotate(${Math.random() * 360}deg)`
             }}>
          <div className="absolute inset-1 bg-yellow-200 rounded-full opacity-50"></div>
        </div>
      ))}
    </div>
  );
}

// CSS for animations - add to global styles instead
