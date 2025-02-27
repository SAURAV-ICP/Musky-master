'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { PaymentOptions } from '@/components/earn/PaymentOptions';

export default function EarnPage() {
  const { user, mutate } = useUser();
  const [activeTab, setActiveTab] = useState<'payments' | 'stake' | 'withdraw'>('payments');
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState(user?.solana_address || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.solana_address) {
      setSolanaAddress(user.solana_address);
    }
  }, [user?.solana_address]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          amount: parseFloat(stakeAmount),
        }),
      });

      if (response.ok) {
        mutate();
        setStakeAmount('');
        toast.success('Successfully staked MUSKY');
      } else {
        toast.error('Failed to stake MUSKY');
      }
    } catch (error) {
      toast.error('Failed to stake MUSKY');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.solana_address) {
      toast.error('Please set your Solana wallet address first');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 2) {
      toast.error('Minimum withdrawal is 2 SOL');
      return;
    }

    if (amount > (user?.solana_balance || 0)) {
      toast.error('Insufficient SOL balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/withdraw/solana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          amount,
          solana_address: user.solana_address,
          username: user.username || 'Anonymous'
        }),
      });

      if (response.ok) {
        mutate(); // Refresh user data
        setWithdrawAmount('');
        toast.success('Withdrawal request sent to admin for approval');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWallet = async () => {
    if (!walletAddress) {
      toast.error('Please enter a valid Solana wallet address');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          solana_address: walletAddress,
        }),
      });

      if (response.ok) {
        mutate();
        toast.success('Wallet address updated successfully');
      } else {
        toast.error('Failed to update wallet address');
      }
    } catch (error) {
      toast.error('Failed to update wallet address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSolanaAddress = async () => {
    if (!user?.user_id || !solanaAddress) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/update-solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          solana_address: solanaAddress
        }),
      });

      if (!response.ok) throw new Error('Failed to update Solana address');

      await mutate(); // Refresh user data
      toast.success('Solana address updated successfully');
    } catch (error) {
      console.error('Error updating Solana address:', error);
      toast.error('Failed to update Solana address');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Earn & Withdraw</h1>
          <p className="text-white/60">Purchase items, stake MUSKY and withdraw SOL</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <motion.button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-3 rounded-xl font-bold ${
              activeTab === 'payments'
                ? 'bg-accent text-white'
                : 'bg-primary/20 text-white/60'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Purchase
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('stake')}
            className={`flex-1 py-3 rounded-xl font-bold ${
              activeTab === 'stake'
                ? 'bg-accent text-white'
                : 'bg-primary/20 text-white/60'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Stake
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 rounded-xl font-bold ${
              activeTab === 'withdraw'
                ? 'bg-accent text-white'
                : 'bg-primary/20 text-white/60'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Withdraw
          </motion.button>
        </div>

        {/* Payments Section */}
        {activeTab === 'payments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PaymentOptions />
          </motion.div>
        )}

        {/* Staking Section */}
        {activeTab === 'stake' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Staking Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-accent/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent mb-2">2x</div>
                  <div className="text-white">Mining Rate</div>
                </div>
                <div className="bg-accent/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent mb-2">50%</div>
                  <div className="text-white">Energy Boost</div>
                </div>
                <div className="bg-accent/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent mb-2">10%</div>
                  <div className="text-white">Referral Bonus</div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Available MUSKY:</span>
                  <span className="text-white font-bold">{user?.balance ?? 0} MUSKY</span>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Amount to Stake</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40"
                    />
                    <motion.button
                      onClick={handleStake}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-accent rounded-lg font-semibold text-white disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Stake
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Withdraw Section */}
        {activeTab === 'withdraw' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Withdraw SOL</h2>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/80">Available SOL:</span>
                  <span className="text-white font-bold">{user?.solana_balance?.toFixed(4) ?? 0} SOL</span>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm text-white/80 mb-2">Solana Wallet Address</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={solanaAddress}
                      onChange={(e) => setSolanaAddress(e.target.value)}
                      placeholder="Enter Solana address"
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40"
                    />
                    <motion.button
                      onClick={handleUpdateSolanaAddress}
                      disabled={isUpdating || !solanaAddress}
                      className="px-4 py-2 bg-accent rounded-lg font-semibold text-white disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Update
                    </motion.button>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Make sure to enter a valid Solana address</p>
                </div>
                
                <div>
                  <label className="block text-sm text-white/80 mb-2">Amount to Withdraw</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40"
                    />
                    <motion.button
                      onClick={handleWithdraw}
                      disabled={isSubmitting || !user?.solana_address}
                      className="px-4 py-2 bg-accent rounded-lg font-semibold text-white disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Withdraw
                    </motion.button>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Minimum withdrawal: 2 SOL</p>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Withdrawal Information</h3>
                <ul className="space-y-1 text-xs text-white/60">
                  <li>• Withdrawals are processed manually within 24 hours</li>
                  <li>• Make sure your Solana address is correct</li>
                  <li>• Minimum withdrawal amount is 2 SOL</li>
                  <li>• You can only withdraw to your own wallet</li>
                </ul>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}