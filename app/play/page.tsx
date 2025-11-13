'use client';

import WASMGame from '@/components/WASMGame'; // C++ WebAssembly Engine

export default function PlayPage() {
  // Skip login screen - automatically use Farcaster name and jump directly to game
  return <WASMGame />;
}
