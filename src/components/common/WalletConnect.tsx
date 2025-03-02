'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { useUser } from '@/contexts/UserContext';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isLoading: boolean;
}

export default function WalletConnect() {
  const { user, updateWalletAddress } = useUser();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isLoading: false,
  });

  // Initialize wallet connection when Telegram WebApp is available and user is logged in
  useEffect(() => {
    if (user && typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Check if we already have a wallet connection
      if (wallet && wallet.account) {
        handleWalletConnected(wallet.account.address, false);
      } else {
        // Don't show errors on initial load
        initTelegramWallet(false);
      }
    }
  }, [user, wallet]);

  // Update wallet state when wallet changes
  useEffect(() => {
    if (wallet && wallet.account) {
      handleWalletConnected(wallet.account.address, false);
      
      // Try to get balance if available
      try {
        // The wallet object might have balance in different formats depending on the version
        // We'll try to handle different possibilities
        const rawBalance = (wallet as any).balance;
        if (rawBalance) {
          const balanceInTON = Number(rawBalance) / 1000000000; // Convert from nanoTON to TON
          if (!isNaN(balanceInTON)) {
            setWalletState(prev => ({
              ...prev,
              balance: balanceInTON
            }));
          }
        }
      } catch (error) {
        console.error('Error getting wallet balance:', error);
      }
    } else if (walletState.isConnected) {
      // Reset state if wallet disconnected
      setWalletState({
        isConnected: false,
        address: null,
        balance: null,
        isLoading: false,
      });
    }
  }, [wallet]);

  const initTelegramWallet = async (showErrors = true) => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        if (showErrors) {
          toast.error('Telegram WebApp is not available');
        }
        return;
      }

      if (!user) {
        if (showErrors) {
          toast.error('Please log in first');
        }
        return;
      }

      // Request wallet connection through Telegram Mini App
      await tonConnectUI.openModal();
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (showErrors) {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleWalletConnected = async (address: string, showToast = true) => {
    try {
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address,
        isLoading: false,
      }));

      // Update user's wallet address in database if it's different
      if (user && (user as any).ton_address !== address) {
        const success = await updateWalletAddress(address);
        if (success && showToast) {
          toast.success('Wallet connected successfully');
        }
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error);
      if (showToast) {
        toast.error('Failed to update TON wallet information');
      }
    }
  };

  const handleConnectTelegram = async () => {
    await initTelegramWallet(true);
  };

  const handleWalletAction = () => {
    if (walletState.isConnected && walletState.address) {
      // Copy address to clipboard
      navigator.clipboard.writeText(walletState.address)
        .then(() => toast.success('Address copied to clipboard'))
        .catch(() => toast.error('Failed to copy address'));
    } else {
      handleConnectTelegram();
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: number | null) => {
    if (balance === null) return '0';
    return balance.toFixed(4);
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-4 rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        onClick={handleWalletAction}
        className={`flex items-center justify-center px-4 py-2 rounded-full text-white font-medium transition-all ${
          walletState.isConnected 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={walletState.isLoading}
      >
        {walletState.isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : walletState.isConnected && walletState.address ? (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {formatAddress(walletState.address)}
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
            Connect Wallet
          </span>
        )}
      </motion.button>
      
      {walletState.isConnected && (
        <motion.div 
          className="mt-2 text-sm text-gray-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Balance: {formatBalance(walletState.balance)} TON
        </motion.div>
      )}
    </motion.div>
  );
} 