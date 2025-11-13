'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

interface VillageNavigationProps {
  onBack?: () => void;
  className?: string;
}

export default function VillageNavigation({ onBack, className = '' }: VillageNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBackToVillage = () => {
    if (onBack) {
      onBack();
    } else if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <motion.button
      onClick={handleBackToVillage}
      className={`group px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 
                  rounded-lg backdrop-blur-sm border-2 border-amber-400/50 transition-all shadow-lg
                  text-white font-bold flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
    </motion.button>
  );
}
