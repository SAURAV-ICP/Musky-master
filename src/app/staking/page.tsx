'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

// Staking plan definitions
const STAKING_PLANS = [
  {
    id: 1,
    name: 'Starter',
    duration: 7, // days
    apy: 5, // 5% APY
    minAmount: 1000, // Minimum 1000 MUSKY
    earlyWithdrawalFee: 20, // 20% fee for early withdrawal
    color: 'from-blue-500 to-blue-600',
    icon: '🔹',
  },
  {
    id: 2,
    name: 'Growth',
    duration: 30, // days
    apy: 12, // 12% APY
    minAmount: 5000, // Minimum 5000 MUSKY
    earlyWithdrawalFee: 15, // 15% fee for early withdrawal
    color: 'from-purple-500 to-purple-600',
    icon: '💠',
  },
  {
    id: 3,
    name: 'Premium',
    duration: 90, // days
    apy: 25, // 25% APY
    minAmount: 20000, // Minimum 20000 MUSKY
    earlyWithdrawalFee: 10, // 10% fee for early withdrawal
    color: 'from-orange-500 to-orange-600',
    icon: '🔶',
  },
  {
    id: 4,
    name: 'Diamond',
    duration: 180, // days
    apy: 40, // 40% APY
    minAmount: 50000, // Minimum 50000 MUSKY
    earlyWithdrawalFee: 5, // 5% fee for early withdrawal
    color: 'from-accent to-blue-400',
    icon: '💎',
  },
];

interface StakingPosition {
  id: string;
  user_id: string;
  plan_id: number;
  amount: number;
  start_date: string;
  end_date: string;
  claimed: boolean;
  created_at: string;
}

export default function StakingPage() {
  const { user, loading, mutate } = useUser();
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<typeof STAKING_PLANS[0] | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [positionToWithdraw, setPositionToWithdraw] = useState<StakingPosition | null>(null);

  // Fetch user's staking positions
  useEffect(() => {
    if (user?.user_id) {
      fetchStakingPositions();
    }
  }, [user]);

  const fetchStakingPositions = async () => {
    if (!user?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('staking_positions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStakingPositions(data || []);
    } catch (error) {
      console.error('Error fetching staking positions:', error);
      toast.error('Failed to load your staking positions');
    }
  };

  const handleStakeSubmit = async () => {
    if (!user || !selectedPlan) return;
    
    const amount = parseInt(stakeAmount);
    if (isNaN(amount) || amount < selectedPlan.minAmount) {
      toast.error(`Minimum stake amount is ${selectedPlan.minAmount} MUSKY`);
      return;
    }

    if (amount > user.balance) {
      toast.error('Insufficient MUSKY balance');
      return;
    }

    setIsStaking(true);
    try {
      // Calculate end date based on duration
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + selectedPlan.duration);

      // Create staking position
      const { error: stakingError } = await supabase
        .from('staking_positions')
        .insert({
          user_id: user.user_id,
          plan_id: selectedPlan.id,
          amount: amount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          claimed: false,
        });

      if (stakingError) throw stakingError;

      // Deduct MUSKY from user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: user.balance - amount })
        .eq('user_id', user.user_id);

      if (balanceError) throw balanceError;

      // Refresh user data and staking positions
      await mutate();
      await fetchStakingPositions();
      
      toast.success(`Successfully staked ${amount} MUSKY for ${selectedPlan.duration} days`);
      setSelectedPlan(null);
      setStakeAmount('');
    } catch (error) {
      console.error('Error staking MUSKY:', error);
      toast.error('Failed to stake MUSKY. Please try again.');
    } finally {
      setIsStaking(false);
    }
  };

  const handleWithdraw = async (position: StakingPosition) => {
    setPositionToWithdraw(position);
    setShowConfirmation(true);
  };

  const confirmWithdraw = async () => {
    if (!user || !positionToWithdraw) return;
    
    setIsClaiming(true);
    try {
      const currentDate = new Date();
      const endDate = new Date(positionToWithdraw.end_date);
      const isEarlyWithdrawal = currentDate < endDate;
      
      // Get plan details
      const plan = STAKING_PLANS.find(p => p.id === positionToWithdraw.plan_id);
      if (!plan) throw new Error('Staking plan not found');
      
      let returnAmount = positionToWithdraw.amount;
      
      // Calculate rewards or apply early withdrawal fee
      if (isEarlyWithdrawal) {
        // Apply early withdrawal fee
        const feeAmount = (returnAmount * plan.earlyWithdrawalFee) / 100;
        returnAmount -= feeAmount;
        
        toast(`Early withdrawal fee of ${plan.earlyWithdrawalFee}% applied`);
      } else {
        // Calculate rewards based on APY
        const daysStaked = plan.duration; // Full duration
        const dailyRate = plan.apy / 365 / 100;
        const rewards = positionToWithdraw.amount * dailyRate * daysStaked;
        returnAmount += rewards;
      }
      
      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: user.balance + returnAmount })
        .eq('user_id', user.user_id);
        
      if (balanceError) throw balanceError;
      
      // Delete staking position
      const { error: deleteError } = await supabase
        .from('staking_positions')
        .delete()
        .eq('id', positionToWithdraw.id);
        
      if (deleteError) throw deleteError;
      
      // Refresh user data and staking positions
      await mutate();
      await fetchStakingPositions();
      
      toast.success(`Successfully withdrawn ${returnAmount.toFixed(0)} MUSKY`);
    } catch (error) {
      console.error('Error withdrawing stake:', error);
      toast.error('Failed to withdraw. Please try again.');
    } finally {
      setIsClaiming(false);
      setShowConfirmation(false);
      setPositionToWithdraw(null);
    }
  };

  const calculateRewards = (position: StakingPosition) => {
    const plan = STAKING_PLANS.find(p => p.id === position.plan_id);
    if (!plan) return 0;
    
    const startDate = new Date(position.start_date);
    const endDate = new Date(position.end_date);
    const currentDate = new Date();
    
    // If not matured yet, calculate projected rewards
    if (currentDate < endDate) {
      const dailyRate = plan.apy / 365 / 100;
      const totalRewards = position.amount * dailyRate * plan.duration;
      return totalRewards;
    } else {
      // Full rewards for matured positions
      const dailyRate = plan.apy / 365 / 100;
      return position.amount * dailyRate * plan.duration;
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Matured';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${diffDays}d ${diffHours}h`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">MUSKY Staking</h1>
            <p className="text-white/60">Lock your MUSKY tokens to earn rewards</p>
          </div>
          <div className="bg-primary-dark p-3 rounded-xl">
            <p className="text-sm text-white/60">Your Balance</p>
            <p className="text-xl font-bold">{formatNumber(user?.balance || 0)} MUSKY</p>
          </div>
        </div>

        {/* Staking Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAKING_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              className={`bg-primary-dark rounded-xl overflow-hidden border-2 ${
                selectedPlan?.id === plan.id ? 'border-accent' : 'border-transparent'
              }`}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className={`bg-gradient-to-r ${plan.color} p-4`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <span className="text-2xl">{plan.icon}</span>
                </div>
                <p className="text-3xl font-bold mt-2">{plan.apy}% APY</p>
              </div>
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Lock Period</span>
                  <span className="font-medium">{plan.duration} days</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Min. Stake</span>
                  <span className="font-medium">{formatNumber(plan.minAmount)} MUSKY</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-white/60">Early Fee</span>
                  <span className="font-medium">{plan.earlyWithdrawalFee}%</span>
                </div>
                <button
                  className={`w-full py-2 rounded-lg font-bold ${
                    user?.balance && user.balance >= plan.minAmount
                      ? 'bg-accent hover:bg-accent/80'
                      : 'bg-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!user?.balance || user.balance < plan.minAmount}
                >
                  Select Plan
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Staking Form */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-dark rounded-xl p-6 mb-8"
          >
            <h2 className="text-xl font-bold mb-4">Stake MUSKY Tokens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Selected Plan: {selectedPlan.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-white/60">APY</span>
                    <span className="font-medium">{selectedPlan.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Lock Period</span>
                    <span className="font-medium">{selectedPlan.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Minimum Stake</span>
                    <span className="font-medium">{formatNumber(selectedPlan.minAmount)} MUSKY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Early Withdrawal Fee</span>
                    <span className="font-medium">{selectedPlan.earlyWithdrawalFee}%</span>
                  </div>
                </div>
                <button
                  className="text-sm text-accent underline"
                  onClick={() => setSelectedPlan(null)}
                >
                  Change Plan
                </button>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block text-white/60 mb-2">Amount to Stake</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder={`Min ${selectedPlan.minAmount} MUSKY`}
                      className="w-full bg-black/20 rounded-lg p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      className="absolute right-2 top-2 bg-black/30 text-white/80 px-3 py-1 rounded text-sm"
                      onClick={() => user?.balance && setStakeAmount(user.balance.toString())}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {stakeAmount && !isNaN(parseInt(stakeAmount)) && (
                  <div className="bg-black/20 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Reward Projection</h4>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/60">Principal</span>
                      <span>{formatNumber(parseInt(stakeAmount))} MUSKY</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/60">Estimated Reward</span>
                      <span className="text-green-400">
                        +{formatNumber(parseInt(stakeAmount) * (selectedPlan.apy / 100) * (selectedPlan.duration / 365))} MUSKY
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                      <span className="text-white/60">Total Return</span>
                      <span className="font-bold">
                        {formatNumber(
                          parseInt(stakeAmount) + 
                          parseInt(stakeAmount) * (selectedPlan.apy / 100) * (selectedPlan.duration / 365)
                        )} MUSKY
                      </span>
                    </div>
                  </div>
                )}

                <button
                  className={`w-full py-3 rounded-lg font-bold ${
                    isStaking || !stakeAmount || parseInt(stakeAmount) < selectedPlan.minAmount || parseInt(stakeAmount) > (user?.balance || 0)
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-accent hover:bg-accent/80'
                  }`}
                  disabled={isStaking || !stakeAmount || parseInt(stakeAmount) < selectedPlan.minAmount || parseInt(stakeAmount) > (user?.balance || 0)}
                  onClick={handleStakeSubmit}
                >
                  {isStaking ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                      Staking...
                    </span>
                  ) : (
                    'Stake MUSKY'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Staking Positions */}
        <h2 className="text-xl font-bold mb-4">Your Staking Positions</h2>
        {stakingPositions.length === 0 ? (
          <div className="bg-primary-dark rounded-xl p-6 text-center">
            <p className="text-white/60 mb-2">You don't have any active staking positions</p>
            <p className="text-sm">Select a plan above to start earning rewards</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stakingPositions.map((position) => {
              const plan = STAKING_PLANS.find(p => p.id === position.plan_id);
              if (!plan) return null;
              
              const isMatured = new Date() >= new Date(position.end_date);
              const rewards = calculateRewards(position);
              
              return (
                <motion.div
                  key={position.id}
                  className="bg-primary-dark rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`bg-gradient-to-r ${plan.color} p-4`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">{plan.name} Plan</h3>
                      <div className="bg-black/20 px-3 py-1 rounded-full">
                        <p className="text-sm font-medium">
                          {isMatured ? 'Matured' : `${calculateTimeRemaining(position.end_date)} left`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-white/60 text-sm">Staked Amount</p>
                        <p className="text-xl font-bold">{formatNumber(position.amount)} MUSKY</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Estimated Rewards</p>
                        <p className="text-xl font-bold text-green-400">+{formatNumber(rewards)} MUSKY</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Total Return</p>
                        <p className="text-xl font-bold">{formatNumber(position.amount + rewards)} MUSKY</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white/60 text-sm">Staked on {new Date(position.start_date).toLocaleDateString()}</p>
                        <p className="text-white/60 text-sm">
                          {isMatured ? 'Matured on' : 'Matures on'} {new Date(position.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        className={`px-4 py-2 rounded-lg font-bold ${
                          isClaiming
                            ? 'bg-gray-500 cursor-not-allowed'
                            : isMatured
                            ? 'bg-green-500 hover:bg-green-400'
                            : 'bg-orange-500 hover:bg-orange-400'
                        }`}
                        disabled={isClaiming}
                        onClick={() => handleWithdraw(position)}
                      >
                        {isClaiming ? 'Processing...' : isMatured ? 'Claim Rewards' : 'Withdraw Early'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmation && positionToWithdraw && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Confirm Withdrawal</h2>
                  
                  {new Date() < new Date(positionToWithdraw.end_date) && (
                    <div className="bg-orange-500/20 p-4 rounded-lg mb-4">
                      <p className="text-orange-400 font-medium mb-2">Early Withdrawal Warning</p>
                      <p className="text-sm">
                        Your staking position has not matured yet. Withdrawing early will incur a 
                        {STAKING_PLANS.find(p => p.id === positionToWithdraw.plan_id)?.earlyWithdrawalFee}% fee on your principal.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-white/60">Staked Amount</span>
                      <span className="font-medium">{formatNumber(positionToWithdraw.amount)} MUSKY</span>
                    </div>
                    
                    {new Date() < new Date(positionToWithdraw.end_date) ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-white/60">Early Withdrawal Fee</span>
                          <span className="text-orange-400">
                            -{formatNumber((positionToWithdraw.amount * (STAKING_PLANS.find(p => p.id === positionToWithdraw.plan_id)?.earlyWithdrawalFee || 0)) / 100)} MUSKY
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-white/10">
                          <span className="text-white/60">You'll Receive</span>
                          <span className="font-bold">
                            {formatNumber(positionToWithdraw.amount - (positionToWithdraw.amount * (STAKING_PLANS.find(p => p.id === positionToWithdraw.plan_id)?.earlyWithdrawalFee || 0)) / 100)} MUSKY
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-white/60">Rewards</span>
                          <span className="text-green-400">
                            +{formatNumber(calculateRewards(positionToWithdraw))} MUSKY
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-white/10">
                          <span className="text-white/60">You'll Receive</span>
                          <span className="font-bold">
                            {formatNumber(positionToWithdraw.amount + calculateRewards(positionToWithdraw))} MUSKY
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      className="flex-1 py-3 rounded-lg font-bold bg-gray-600 hover:bg-gray-500"
                      onClick={() => {
                        setShowConfirmation(false);
                        setPositionToWithdraw(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 py-3 rounded-lg font-bold bg-accent hover:bg-accent/80"
                      onClick={confirmWithdraw}
                    >
                      {isClaiming ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                          Processing...
                        </span>
                      ) : (
                        'Confirm Withdrawal'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
} 