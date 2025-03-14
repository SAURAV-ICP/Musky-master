'use client';

import React, { useState } from 'react';
import { useTonConnectUI, CHAIN } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';

interface PaymentProcessorProps {
  amount: number;
  currency: 'TON' | 'Stars' | 'MUSKY';
  itemType: 'RTX4070' | 'RTX4090' | 'RTX5070' | 'RTX5090' | 'hero' | 'superhero' | 'stamina';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentProcessor({
  amount,
  currency,
  itemType,
  onSuccess,
  onCancel
}: PaymentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  
  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      if (currency === 'TON') {
        // Check if wallet is connected
        if (!tonConnectUI.connected) {
          await tonConnectUI.connectWallet();
          return; // Return after connecting wallet, user needs to try payment again
        }

        // Request TON payment through TonConnect
        const transaction = await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
          network: CHAIN.MAINNET,
          messages: [
            {
              address: process.env.NEXT_PUBLIC_TON_ADDRESS as string,
              amount: (amount * 1000000000).toString(), // Convert to nanoTONs
            },
          ],
        });

        // Verify payment on backend
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: transaction.boc, // Use transaction boc as ID
            amount,
            currency,
            item_type: itemType
          }),
        });

        if (response.ok) {
          toast.success('Payment successful!');
          onSuccess();
        } else {
          throw new Error('Payment verification failed');
        }
      } else if (currency === 'Stars') {
        // Handle Telegram Stars payment
        if (!window.Telegram?.WebApp) {
          throw new Error('Telegram WebApp is not available');
        }

        const result = await window.Telegram.WebApp.requestPayment({
          amount,
          currency: 'STARS',
        });

        if (result.success) {
          toast.success('Payment successful!');
          onSuccess();
        } else {
          throw new Error('Stars payment failed or cancelled');
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-primary/90 backdrop-blur-lg rounded-xl p-6 max-w-md w-full border border-white/10">
        <h2 className="text-xl font-bold mb-4 text-center">Complete Payment</h2>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg">Amount: {amount} {currency}</p>
            {currency === 'TON' && !tonConnectUI.connected && (
              <p className="text-sm text-gray-300 mt-2">
                You need to connect your TON wallet first
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all
                ${isProcessing 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
            >
              {isProcessing ? 'Processing...' : `Pay with ${currency}`}
            </button>
            
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-red-600 
                hover:bg-red-700 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 