import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUser } from '@/contexts/UserContext';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, mutate } = useUser();

  const handlePayment = async () => {
    if (!user) {
      toast.error('You must be logged in to make a purchase');
      onCancel();
      return;
    }

    setIsProcessing(true);

    try {
      if (currency === 'TON') {
        // Handle TON payment through Telegram Mini App
        if (!window.Telegram?.WebApp) {
          toast.error('Telegram WebApp is not available');
          setIsProcessing(false);
          onCancel();
          return;
        }

        // Request payment through Telegram
        const result = await window.Telegram.WebApp.requestPayment({
          amount: amount,
          currency: 'TON'
        });

        if (result.success) {
          // Payment successful, now record the purchase in your backend
          const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: user.user_id,
              amount: amount,
              currency: 'TON',
              item_type: itemType
            })
          });

          if (response.ok) {
            toast.success('Payment successful!');
            // Refresh user data to get updated balances
            await mutate();
            onSuccess();
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to process payment');
          }
        } else {
          throw new Error('Payment was not completed');
        }
      } else if (currency === 'MUSKY') {
        // Handle MUSKY payment (internal balance)
        if (!user || user.balance < amount) {
          toast.error('Insufficient MUSKY balance');
          setIsProcessing(false);
          onCancel();
          return;
        }

        // Process the MUSKY payment through your backend
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.user_id,
            amount: amount,
            currency: 'MUSKY',
            item_type: itemType
          })
        });

        if (response.ok) {
          toast.success('Purchase successful!');
          // Refresh user data to get updated balances
          await mutate();
          onSuccess();
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to process purchase');
        }
      } else if (currency === 'Stars') {
        // Handle Stars payment through Telegram Mini App
        if (!window.Telegram?.WebApp) {
          toast.error('Telegram WebApp is not available');
          setIsProcessing(false);
          onCancel();
          return;
        }

        // Request payment through Telegram
        const result = await window.Telegram.WebApp.requestPayment({
          amount: amount,
          currency: 'STARS'
        });

        if (result.success) {
          // Payment successful, now record the purchase in your backend
          const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: user.user_id,
              amount: amount,
              currency: 'Stars',
              item_type: itemType
            })
          });

          if (response.ok) {
            toast.success('Payment successful!');
            // Refresh user data to get updated balances
            await mutate();
            onSuccess();
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to process payment');
          }
        } else {
          throw new Error('Payment was not completed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate equivalent amounts in other currencies for display
  const getEquivalentAmounts = () => {
    // These are example conversion rates - you should use real rates
    const tonToMusky = 10000; // 1 TON = 10,000 MUSKY
    const starsToMusky = 100;  // 1 Star = 100 MUSKY

    if (currency === 'TON') {
      return {
        musky: amount * tonToMusky,
        stars: amount * (tonToMusky / starsToMusky)
      };
    } else if (currency === 'Stars') {
      return {
        musky: amount * starsToMusky,
        ton: amount / (tonToMusky / starsToMusky)
      };
    } else { // MUSKY
      return {
        ton: amount / tonToMusky,
        stars: amount / starsToMusky
      };
    }
  };

  const equivalentAmounts = getEquivalentAmounts();

  return (
    <div className="w-full max-w-md mx-auto bg-primary/20 p-6 rounded-xl border border-white/10">
      <h2 className="text-xl font-bold text-center mb-6">Confirm Payment</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-white/70">Item:</span>
          <span className="font-bold">{itemType}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/70">Amount:</span>
          <span className="font-bold">{amount} {currency}</span>
        </div>

        {/* Show equivalent amounts in other currencies */}
        <div className="bg-background/30 p-3 rounded-lg mt-4">
          <p className="text-sm text-white/60 mb-2">Equivalent to:</p>
          {currency !== 'TON' && equivalentAmounts.ton !== undefined && (
            <p className="text-sm">{equivalentAmounts.ton.toFixed(4)} TON</p>
          )}
          {currency !== 'Stars' && equivalentAmounts.stars !== undefined && (
            <p className="text-sm">{equivalentAmounts.stars.toFixed(2)} Stars</p>
          )}
          {currency !== 'MUSKY' && equivalentAmounts.musky !== undefined && (
            <p className="text-sm">{equivalentAmounts.musky.toFixed(0)} MUSKY</p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <motion.button
          className="flex-1 py-3 bg-gray-600/50 rounded-lg font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </motion.button>
        
        <motion.button
          className="flex-1 py-3 bg-accent rounded-lg font-medium flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Pay with ${currency}`
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default PaymentProcessor; 