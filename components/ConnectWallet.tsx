'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { base, celo, localhost } from 'wagmi/chains';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <select
          value={chainId}
          onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
          className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm"
        >
          {process.env.NODE_ENV === 'development' && (
            <option value={localhost.id}>Localhost</option>
          )}
          <option value={base.id}>Base</option>
          <option value={celo.id}>Celo</option>
        </select>
        
        <div className="px-4 py-2 bg-gray-700 rounded-lg border border-gray-600">
          <div className="text-xs text-gray-400">Connected</div>
          <div className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg font-medium transition-all"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
