'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import toast from 'react-hot-toast';

interface BalancePopupProps {
  minBalance?: number;
  onClose?: () => void;
}

interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function BalancePopup({ minBalance = 1000, onClose }: BalancePopupProps) {
  const { user } = useUser();
  const [message, setMessage] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show for users with balance above the minimum
    if (!user || user.balance < minBalance) {
      setIsVisible(false);
      return;
    }

    fetchActiveMessage();
  }, [user, minBalance]);

  const fetchActiveMessage = async () => {
    try {
      const response = await fetch('/api/admin/broadcast/active');
      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          setMessage(data.message);
        } else {
          // If no active broadcast message, use a default message based on user balance
          setMessage({
            id: 'default',
            title: 'Your MUSKY Balance',
            content: `You have ${user?.balance} MUSKY tokens! Consider staking them to earn more rewards.`,
            type: 'info',
            active: true,
            created_at: new Date().toISOString(),
            expires_at: null
          });
        }
      } else {
        // If API fails, use a default message
        setMessage({
          id: 'default',
          title: 'Welcome to MUSKY',
          content: 'Start earning and staking your MUSKY tokens today!',
          type: 'info',
          active: true,
          created_at: new Date().toISOString(),
          expires_at: null
        });
      }
    } catch (error) {
      console.error('Error fetching broadcast message:', error);
      // Use default message on error
      setMessage({
        id: 'default',
        title: 'Welcome to MUSKY',
        content: 'Start earning and staking your MUSKY tokens today!',
        type: 'info',
        active: true,
        created_at: new Date().toISOString(),
        expires_at: null
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleAction = () => {
    // Navigate to staking page or perform other actions
    window.location.href = '/staking';
    handleClose();
  };

  if (!isVisible || !message) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl shadow-2xl p-6 max-w-md w-full"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">{message.title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-200 mb-2">{message.content}</p>
            {user && (
              <div className="bg-blue-700 bg-opacity-30 rounded-lg p-3 mt-3">
                <p className="text-white font-medium">
                  Current Balance: <span className="font-bold">{user.balance} MUSKY</span>
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAction}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
            >
              Stake Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 