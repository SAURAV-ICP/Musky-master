import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'react-hot-toast';
import { Address } from '@ton/core';
import { useUser } from '@/contexts/UserContext';

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: {
    ton: number;
    stars_balance: number;
    musky_balance: number;
  };
}

const WalletConnect: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [telegramWallet, setTelegramWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: {
      ton: 0,
      stars_balance: 0,
      musky_balance: 0
    }
  });

  useEffect(() => {
    // Check if Telegram WebApp is available and initialize wallet
    if (window.Telegram?.WebApp && user?.user_id) {
      initTelegramWallet();
    }
  }, [user?.user_id]);

  const initTelegramWallet = async () => {
    if (!window.Telegram?.WebApp || !user?.user_id) {
      console.error('Telegram WebApp is not available or user is not logged in');
      return;
    }

    try {
      // Request wallet connection through Telegram Mini App
      const result = await window.Telegram.WebApp.requestWallet();
      if (result) {
        // Fetch user's balance from your backend
        const response = await fetch(`/api/user/balance?user_id=${user.user_id}`);
        const balanceData = await response.json();

        if (response.ok) {
          setTelegramWallet({
            connected: true,
            address: result.address,
            balance: {
              ton: parseFloat(result.balance.ton || '0'),
              stars_balance: balanceData.stars_balance || 0,
              musky_balance: balanceData.musky_balance || 0
            }
          });
        } else {
          throw new Error(balanceData.error || 'Failed to fetch balance');
        }
      }
    } catch (error) {
      console.error('Failed to connect Telegram wallet:', error);
      toast.error('Failed to connect Telegram wallet');
    }
  };

  const handleConnectTelegram = async () => {
    if (!telegramWallet.connected) {
      await initTelegramWallet();
    }
  };

  const handleWalletAction = async () => {
    try {
      setIsLoading(true);
      if (wallet) {
        await tonConnectUI.disconnect();
      } else {
        // First try to use Telegram Wallet if available
        if (window.Telegram?.WebApp) {
          await handleConnectTelegram();
        } else {
          // Fallback to TON Connect if Telegram Wallet is not available
          await tonConnectUI.connectWallet();
        }
      }
    } catch (error) {
      console.error('Wallet action failed:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format wallet address
  const formatAddress = (address: string) => {
    try {
      const tempAddress = Address.parse(address).toString();
      return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
    } catch (e) {
      // Fallback if Address parsing fails
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  };

  // Display a loading screen when in loading state
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="bg-primary/20 text-white font-bold py-2 px-4 rounded">
          Connecting wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Wallet Connection Button */}
      <motion.button
        className={`w-full py-3 px-4 ${wallet || telegramWallet.connected ? 'bg-primary/40' : 'bg-accent'} rounded-xl font-bold flex items-center justify-center space-x-2`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleWalletAction}
        disabled={isLoading || !user?.user_id}
      >
        <span>💎</span>
        <span>
          {!user?.user_id ? 'Please wait...' : 
            wallet || telegramWallet.connected ? 'Disconnect Wallet' : 'Connect Wallet'}
        </span>
      </motion.button>

      {(wallet || telegramWallet.connected) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/20 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                💎
              </div>
              <span className="text-sm font-mono">
                {formatAddress(wallet?.account.address || telegramWallet.address!)}
              </span>
            </div>
            <motion.button
              className="text-sm text-accent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const address = wallet?.account.address || telegramWallet.address!;
                navigator.clipboard.writeText(address);
                toast.success('Address copied to clipboard');
              }}
            >
              Copy
            </motion.button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-white/60">TON Balance</p>
              <p className="font-bold">{telegramWallet.balance.ton.toFixed(2)} TON</p>
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-white/60">Stars Balance</p>
              <p className="font-bold">{telegramWallet.balance.stars_balance} ⭐</p>
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-white/60">MUSKY Balance</p>
              <p className="font-bold">{telegramWallet.balance.musky_balance} 🐕</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletConnect; 