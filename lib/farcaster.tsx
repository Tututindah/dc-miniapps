'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useConnect, useAccount } from 'wagmi';

interface FarcasterContextType {
  isMiniApp: boolean;
  isAutoConnecting: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isMiniApp: false,
  isAutoConnecting: false,
});

export function useFarcaster() {
  return useContext(FarcasterContext);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Check if running in Farcaster Mini App
        const context = await sdk.context;
        setIsMiniApp(true);

        console.log('🟣 Farcaster Mini App SDK loaded', context);

        // Auto-connect wallet if not already connected
        if (!isConnected && connectors.length > 0) {
          setIsAutoConnecting(true);
          
          // The farcasterMiniApp() connector should be first in the list
          // as configured in wagmi.ts
          const connectorToUse = connectors[0];
          
          if (connectorToUse) {
            try {
              console.log('🔌 Auto-connecting with:', connectorToUse.name);
              await connect({ connector: connectorToUse });
              console.log('✅ Auto-connected wallet successfully');
            } catch (error) {
              console.error('❌ Auto-connect failed:', error);
            } finally {
              setIsAutoConnecting(false);
            }
          } else {
            console.warn('⚠️ No connector available for auto-connect');
            setIsAutoConnecting(false);
          }
        }

        // Signal that the app is ready to display
        await sdk.actions.ready();
        console.log('✅ Mini App ready signal sent');
      } catch (error) {
        console.log('ℹ️ Not running in Farcaster Mini App context', error);
        setIsMiniApp(false);
        setIsAutoConnecting(false);
      }
    };

    initializeMiniApp();
  }, [connect, connectors, isConnected]);

  return (
    <FarcasterContext.Provider value={{ isMiniApp, isAutoConnecting }}>
      {children}
    </FarcasterContext.Provider>
  );
}
