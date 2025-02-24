import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: {
    ton: number;
    stars: number;
  };
}

const WalletConnect: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    balance: {
      ton: 0,
      stars: 0
    }
  });

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram?.WebApp) {
      initTelegramWallet();
    }
  }, []);

  const initTelegramWallet = async () => {
    if (!window.Telegram?.WebApp) {
      console.error('Telegram WebApp is not available');
      return;
    }

    try {
      // Request wallet connection through Telegram Mini App
      const result = await window.Telegram.WebApp.requestWallet();
      if (result) {
        setWalletState({
          connected: true,
          address: result.address,
          balance: {
            ton: parseFloat(result.balance.ton || '0'),
            stars: parseInt(result.balance.stars || '0')
          }
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleConnect = async () => {
    if (!walletState.connected) {
      await initTelegramWallet();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full">
      {!walletState.connected ? (
        <motion.button
          className="w-full py-3 px-4 bg-accent rounded-xl font-bold flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConnect}
        >
          <span>🔗</span>
          <span>Connect Wallet</span>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/20 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                👛
              </div>
              <span className="text-sm font-mono">
                {formatAddress(walletState.address!)}
              </span>
            </div>
            <motion.button
              className="text-sm text-accent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigator.clipboard.writeText(walletState.address!)}
            >
              Copy
            </motion.button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-white/60">TON Balance</p>
              <p className="font-bold">{walletState.balance.ton.toFixed(2)} TON</p>
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-white/60">Stars Balance</p>
              <p className="font-bold">{walletState.balance.stars} ⭐</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletConnect;

// Add type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        requestWallet: () => Promise<{
          address: string;
          balance: {
            ton?: string;
            stars?: string;
          };
        }>;
        requestPayment: (params: {
          amount: number;
          currency: string;
        }) => Promise<{
          success: boolean;
        }>;
      };
    };
  }
} 