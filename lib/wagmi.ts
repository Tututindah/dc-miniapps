import { createConfig, http } from 'wagmi';
import { base, celo, localhost } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

export const config = createConfig({
  chains: isDev ? [localhost, base, celo] : [base, celo],
  connectors: [
    farcasterMiniApp(),
    injected(),
    coinbaseWallet({ appName: 'Dragon City' }),
  ],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
    [base.id]: http(),
    [celo.id]: http(),
  },
  ssr: true,
});

export const CONTRACTS = {
  localhost: {
    dragonCity: (process.env.NEXT_PUBLIC_DRAGON_CITY_LOCAL || process.env.NEXT_PUBLIC_DRAGON_NFT_LOCAL || '') as `0x${string}`,
    dragonNFT: (process.env.NEXT_PUBLIC_DRAGON_NFT_LOCAL || '') as `0x${string}`,
    eggNFT: (process.env.NEXT_PUBLIC_EGG_NFT_LOCAL || '') as `0x${string}`,
    battleArena: (process.env.NEXT_PUBLIC_BATTLE_CONTRACT_LOCAL || '') as `0x${string}`,
    marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE_LOCAL || '') as `0x${string}`,
  },
  base: {
    dragonCity: (process.env.NEXT_PUBLIC_DRAGON_CITY_BASE || process.env.NEXT_PUBLIC_DRAGON_NFT_BASE || '') as `0x${string}`,
    dragonNFT: (process.env.NEXT_PUBLIC_DRAGON_NFT_BASE || '') as `0x${string}`,
    eggNFT: (process.env.NEXT_PUBLIC_EGG_NFT_BASE || '') as `0x${string}`,
    battleArena: (process.env.NEXT_PUBLIC_BATTLE_CONTRACT_BASE || '') as `0x${string}`,
    marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE_BASE || '') as `0x${string}`,
  },
  celo: {
    dragonCity: (process.env.NEXT_PUBLIC_DRAGON_CITY_CELO || process.env.NEXT_PUBLIC_DRAGON_NFT_CELO || '') as `0x${string}`,
    dragonNFT: (process.env.NEXT_PUBLIC_DRAGON_NFT_CELO || '') as `0x${string}`,
    eggNFT: (process.env.NEXT_PUBLIC_EGG_NFT_CELO || '') as `0x${string}`,
    battleArena: (process.env.NEXT_PUBLIC_BATTLE_CONTRACT_CELO || '') as `0x${string}`,
    marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE_CELO || '') as `0x${string}`,
  },
};
