'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

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
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState<BroadcastMessage | null>(null);
  const [hasSeenMessage, setHasSeenMessage] = useState(false);

  useEffect(() => {
    // Check if user has sufficient balance and hasn't seen the message yet
    if (user && user.balance >= minBalance && !hasSeenMessage) {
      fetchActiveMessage();
    }
  }, [user, minBalance, hasSeenMessage]);

  const fetchActiveMessage = async () => {
    try {
      // Get the most recent active broadcast message
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error fetching broadcast message:', error);
        }
        return;
      }

      // Check if user has already seen this message
      if (data) {
        const messageKey = `seen_message_${data.id}`;
        const hasSeenThisMessage = localStorage.getItem(messageKey) === 'true';
        
        if (!hasSeenThisMessage) {
          setMessage(data);
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error in fetchActiveMessage:', error);
    }
  };

  const handleClose = () => {
    if (message) {
      // Mark message as seen in local storage
      localStorage.setItem(`seen_message_${message.id}`, 'true');
    }
    
    setShowPopup(false);
    setHasSeenMessage(true);
    
    if (onClose) {
      onClose();
    }
  };

  // If no message or user doesn't have enough balance, don't render anything
  if (!message || !user || user.balance < minBalance || !showPopup) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden"
          >
            <div className={`p-1 ${
              message.type === 'info' ? 'bg-blue-500' :
              message.type === 'success' ? 'bg-green-500' :
              message.type === 'warning' ? 'bg-orange-500' :
              'bg-red-500'
            }`}>
              <div className="bg-primary p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <h2 className={`text-xl font-bold ${
                    message.type === 'info' ? 'text-blue-400' :
                    message.type === 'success' ? 'text-green-400' :
                    message.type === 'warning' ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {message.title}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:bg-black/40 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className={`px-6 py-2 rounded-lg font-bold ${
                      message.type === 'info' ? 'bg-blue-500 hover:bg-blue-400' :
                      message.type === 'success' ? 'bg-green-500 hover:bg-green-400' :
                      message.type === 'warning' ? 'bg-orange-500 hover:bg-orange-400' :
                      'bg-red-500 hover:bg-red-400'
                    }`}
                  >
                    Got it
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 