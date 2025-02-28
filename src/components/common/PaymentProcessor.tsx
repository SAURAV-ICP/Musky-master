import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';

interface PaymentProcessorProps {
  amount: number;
  currency: 'TON' | 'Stars' | 'MUSKY';
  itemType: 'RTX4070' | 'RTX4090' | 'RTX5070' | 'RTX5090' | 'hero' | 'superhero' | 'stamina';
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  currency,
  itemType,
  onSuccess,
  onCancel
}) => {
  const { user, mutate } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!user) {
      setError('User not found. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // For TON and Stars, we need to use the Telegram Mini App API
      if (currency === 'TON' || currency === 'Stars') {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          try {
            // Request payment through Telegram
            const result = await window.Telegram.WebApp.requestPayment({
              amount: amount,
              currency: currency === 'TON' ? 'TON' : 'STARS'
            });

            if (result.success) {
              // Payment successful, now record it in our backend
              const response = await fetch('/api/payments/process', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: user.user_id,
                  amount: amount,
                  currency: currency,
                  item_type: itemType,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                setIsSuccess(true);
                // Update user data
                mutate();
                // Notify parent component
                setTimeout(() => {
                  onSuccess();
                }, 1500);
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to process payment');
              }
            } else {
              setError('Payment was cancelled or failed');
            }
          } catch (e) {
            console.error('Telegram payment error:', e);
            setError('Failed to process Telegram payment');
          }
        } else {
          setError('Telegram Web App is not available');
        }
      } else if (currency === 'MUSKY') {
        // For MUSKY, we just need to check balance and process internally
        if (user.balance < amount) {
          setError('Insufficient MUSKY balance');
          return;
        }

        // Process MUSKY payment
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.user_id,
            amount: amount,
            currency: 'MUSKY',
            item_type: itemType,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsSuccess(true);
          // Update user data
          mutate();
          // Notify parent component
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to process payment');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Automatically start payment process when component mounts
  useEffect(() => {
    // Small delay to allow UI to render
    const timer = setTimeout(() => {
      handlePayment();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Helper function to get equivalent amounts in other currencies
  const getEquivalentAmounts = () => {
    const equivalents: { [key: string]: number } = {};
    
    if (currency === 'TON') {
      // Convert TON to other currencies
      equivalents.MUSKY = amount * 8000; // 1 TON = 8000 MUSKY
      equivalents.Stars = amount * 500; // 1 TON = 500 Stars
    } else if (currency === 'Stars') {
      // Convert Stars to other currencies
      equivalents.MUSKY = amount * 16; // 1 Star = 16 MUSKY
      equivalents.TON = amount / 500; // 500 Stars = 1 TON
    } else if (currency === 'MUSKY') {
      // Convert MUSKY to other currencies
      equivalents.TON = amount / 8000; // 8000 MUSKY = 1 TON
      equivalents.Stars = amount / 16; // 16 MUSKY = 1 Star
    }
    
    return equivalents;
  };

  const equivalents = getEquivalentAmounts();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
        <p className="text-white/60">
          {isProcessing ? 'Processing your payment...' : 
           isSuccess ? 'Payment successful!' : 
           error ? 'Payment failed' : 
           `Paying ${amount} ${currency} for ${itemType}`}
        </p>
      </div>

      <div className="bg-black/20 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/60">Amount:</span>
          <span className="font-bold">{amount} {currency}</span>
        </div>
        
        {/* Show equivalent amounts */}
        <div className="space-y-1 text-sm text-white/60">
          {currency !== 'MUSKY' && (
            <div className="flex justify-between">
              <span>Equivalent MUSKY:</span>
              <span>{equivalents.MUSKY.toLocaleString()} MUSKY</span>
            </div>
          )}
          {currency !== 'TON' && (
            <div className="flex justify-between">
              <span>Equivalent TON:</span>
              <span>{equivalents.TON.toFixed(4)} TON</span>
            </div>
          )}
          {currency !== 'Stars' && (
            <div className="flex justify-between">
              <span>Equivalent Stars:</span>
              <span>{equivalents.Stars.toLocaleString()} Stars</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-accent border-white/20 rounded-full animate-spin mb-4"></div>
            <p className="text-white/60">Processing payment...</p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400">Payment successful!</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 mb-2">{error}</p>
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-accent border-white/20 rounded-full animate-spin mb-4"></div>
            <p className="text-white/60">Initializing payment...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessor; 