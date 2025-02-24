import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentProcessorProps {
  amount: number;
  currency: 'TON' | 'Stars';
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  currency,
  onSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!window.Telegram?.WebApp) {
        throw new Error('Telegram WebApp is not available');
      }

      // Request payment through Telegram Mini App
      const result = await window.Telegram.WebApp.requestPayment({
        amount,
        currency: currency.toLowerCase(),
      });

      if (result.success) {
        onSuccess();
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-primary/20 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold">Payment Details</h3>
            <p className="text-accent">
              {amount} {currency}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center text-2xl">
            {currency === 'TON' ? '💎' : '⭐'}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="flex space-x-4">
          <motion.button
            className="flex-1 py-3 bg-gray-500 rounded-xl font-bold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </motion.button>
          <motion.button
            className={`flex-1 py-3 rounded-xl font-bold ${
              isProcessing ? 'bg-gray-500' : 'bg-accent'
            }`}
            whileHover={!isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isProcessing ? { scale: 0.98 } : {}}
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Processing...</span>
              </div>
            ) : (
              'Pay Now'
            )}
          </motion.button>
        </div>
      </div>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary p-8 rounded-2xl text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <motion.div
                  className="absolute inset-0 border-4 border-accent/20 border-t-accent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {currency === 'TON' ? '💎' : '⭐'}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
              <p className="text-white/60">
                Please wait while we process your payment...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentProcessor;

// Add type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
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