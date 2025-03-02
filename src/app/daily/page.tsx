'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

// Daily rewards configuration
const DAILY_REWARDS = [
  { day: 1, amount: 100, label: 'Day 1' },
  { day: 2, amount: 200, label: 'Day 2' },
  { day: 3, amount: 300, label: 'Day 3' },
  { day: 4, amount: 400, label: 'Day 4' },
  { day: 5, amount: 500, label: 'Day 5' },
  { day: 6, amount: 750, label: 'Day 6' },
  { day: 7, amount: 1000, label: 'Day 7 - Weekly Bonus!' },
  { day: 8, amount: 500, label: 'Day 8' },
  { day: 9, amount: 600, label: 'Day 9' },
  { day: 10, amount: 700, label: 'Day 10' },
  { day: 11, amount: 800, label: 'Day 11' },
  { day: 12, amount: 900, label: 'Day 12' },
  { day: 13, amount: 1000, label: 'Day 13' },
  { day: 14, amount: 2000, label: 'Day 14 - Bi-weekly Bonus!' },
  { day: 15, amount: 1000, label: 'Day 15' },
  { day: 16, amount: 1100, label: 'Day 16' },
  { day: 17, amount: 1200, label: 'Day 17' },
  { day: 18, amount: 1300, label: 'Day 18' },
  { day: 19, amount: 1400, label: 'Day 19' },
  { day: 20, amount: 1500, label: 'Day 20' },
  { day: 21, amount: 3000, label: 'Day 21 - Triple Week Bonus!' },
  { day: 22, amount: 1500, label: 'Day 22' },
  { day: 23, amount: 1600, label: 'Day 23' },
  { day: 24, amount: 1700, label: 'Day 24' },
  { day: 25, amount: 1800, label: 'Day 25' },
  { day: 26, amount: 1900, label: 'Day 26' },
  { day: 27, amount: 2000, label: 'Day 27' },
  { day: 28, amount: 5000, label: 'Day 28 - Monthly Bonus!' },
  { day: 29, amount: 2000, label: 'Day 29' },
  { day: 30, amount: 2500, label: 'Day 30 - Monthly Finale!' },
];

// After 30 days, the rewards cycle repeats but with a 10% increase
const getRewardForDay = (day: number) => {
  if (day <= 30) {
    return DAILY_REWARDS[day - 1];
  }
  
  // For days beyond 30, cycle back but with increased rewards
  const cycleNumber = Math.floor((day - 1) / 30);
  const dayInCycle = ((day - 1) % 30) + 1;
  const baseReward = DAILY_REWARDS[dayInCycle - 1];
  
  // Increase reward by 10% for each completed cycle
  const multiplier = 1 + (cycleNumber * 0.1);
  return {
    day: dayInCycle,
    amount: Math.floor(baseReward.amount * multiplier),
    label: baseReward.label + ` (Cycle ${cycleNumber + 1})`
  };
};

export default function DailyClaimPage() {
  const { user, loading, mutate } = useUser();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [nextReward, setNextReward] = useState<{ day: number; amount: number; label: string } | null>(null);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>('');
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  
  useEffect(() => {
    if (user?.user_id) {
      fetchDailyClaimData();
    }
  }, [user]);
  
  useEffect(() => {
    // Update countdown timer every second
    const timer = setInterval(() => {
      updateTimeUntilNextClaim();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [user]);
  
  const fetchDailyClaimData = async () => {
    if (!user?.user_id) return;
    
    try {
      // Get user's daily claim data
      const { data, error } = await supabase
        .from('daily_claims')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      if (error) {
        // If no record exists, create one
        if (error.code === 'PGRST116') {
          const { data: newData, error: createError } = await supabase
            .from('daily_claims')
            .insert({
              user_id: user.user_id,
              current_streak: 0,
              last_claim_date: null,
              total_claims: 0
            })
            .select()
            .single();
          
          if (createError) throw createError;
          
          setCurrentStreak(0);
          setNextReward(getRewardForDay(1));
          setCanClaim(true);
          return;
        }
        throw error;
      }
      
      // Calculate if user can claim today
      const lastClaimDate = data.last_claim_date ? new Date(data.last_claim_date) : null;
      const now = new Date();
      
      if (!lastClaimDate) {
        // First time claiming
        setCurrentStreak(0);
        setNextReward(getRewardForDay(1));
        setCanClaim(true);
      } else {
        // Check if last claim was yesterday or earlier today
        const lastClaimDay = new Date(lastClaimDate.setHours(0, 0, 0, 0));
        const today = new Date(now.setHours(0, 0, 0, 0));
        const timeDiff = today.getTime() - lastClaimDay.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24);
        
        if (dayDiff === 0) {
          // Already claimed today
          setCurrentStreak(data.current_streak);
          setNextReward(getRewardForDay(data.current_streak + 1));
          setCanClaim(false);
          
          // Calculate time until next claim (next day at 00:00)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          updateTimeUntilNextClaim(tomorrow);
        } else if (dayDiff === 1) {
          // Can claim today and continue streak
          setCurrentStreak(data.current_streak);
          setNextReward(getRewardForDay(data.current_streak + 1));
          setCanClaim(true);
        } else {
          // Streak broken
          setCurrentStreak(0);
          setNextReward(getRewardForDay(1));
          setCanClaim(true);
        }
      }
    } catch (error) {
      console.error('Error fetching daily claim data:', error);
      toast.error('Failed to load daily claim data');
    }
  };
  
  const updateTimeUntilNextClaim = (targetDate?: Date) => {
    if (!canClaim) {
      const now = new Date();
      const target = targetDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCanClaim(true);
        setTimeUntilNextClaim('');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilNextClaim(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };
  
  const handleClaim = async () => {
    if (!user?.user_id || !canClaim || !nextReward) return;
    
    setIsClaiming(true);
    try {
      // Get current streak data
      const { data: currentData, error: fetchError } = await supabase
        .from('daily_claims')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      const now = new Date();
      const newStreak = currentData ? currentData.current_streak + 1 : 1;
      const reward = getRewardForDay(newStreak);
      
      // Update daily claim record
      const { error: updateError } = await supabase
        .from('daily_claims')
        .upsert({
          user_id: user.user_id,
          current_streak: newStreak,
          last_claim_date: now.toISOString(),
          total_claims: (currentData?.total_claims || 0) + 1
        });
      
      if (updateError) throw updateError;
      
      // Add MUSKY to user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          balance: user.balance + reward.amount 
        })
        .eq('user_id', user.user_id);
      
      if (balanceError) throw balanceError;
      
      // Show claim animation
      setClaimedAmount(reward.amount);
      setShowAnimation(true);
      
      // Update UI state
      setCurrentStreak(newStreak);
      setNextReward(getRewardForDay(newStreak + 1));
      setCanClaim(false);
      
      // Calculate time until next claim
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      updateTimeUntilNextClaim(tomorrow);
      
      // Refresh user data
      await mutate();
      
      // Hide animation after 3 seconds
      setTimeout(() => {
        setShowAnimation(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      toast.error('Failed to claim daily reward');
    } finally {
      setIsClaiming(false);
    }
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
            <h1 className="text-2xl font-bold">Daily Rewards</h1>
            <p className="text-white/60">Claim MUSKY tokens every day to build your streak</p>
          </div>
          <div className="bg-primary-dark p-3 rounded-xl">
            <p className="text-sm text-white/60">Your Balance</p>
            <p className="text-xl font-bold">{formatNumber(user?.balance || 0)} MUSKY</p>
          </div>
        </div>
        
        {/* Current Streak */}
        <div className="bg-primary-dark rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold mb-2">Current Streak</h2>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-accent">{currentStreak}</span>
                <span className="text-white/60 ml-2">days</span>
              </div>
              {currentStreak > 0 && (
                <p className="text-sm text-white/60 mt-1">
                  Keep your streak going by claiming daily!
                </p>
              )}
            </div>
            
            <div className="text-center">
              {canClaim ? (
                <div>
                  <p className="text-sm text-white/60 mb-2">Today's Reward</p>
                  <p className="text-2xl font-bold text-green-400 mb-3">
                    {nextReward ? formatNumber(nextReward.amount) : 0} MUSKY
                  </p>
                  <motion.button
                    className="px-6 py-3 bg-accent hover:bg-accent/80 rounded-lg font-bold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isClaiming}
                    onClick={handleClaim}
                  >
                    {isClaiming ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Claiming...
                      </span>
                    ) : (
                      'Claim Reward'
                    )}
                  </motion.button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/60 mb-2">Next Reward Available In</p>
                  <p className="text-2xl font-bold mb-3">{timeUntilNextClaim}</p>
                  <p className="text-sm text-white/60">Come back tomorrow!</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Upcoming Rewards */}
        <h2 className="text-xl font-bold mb-4">Upcoming Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, index) => {
            const day = currentStreak + index + 1;
            const reward = getRewardForDay(day);
            const isNextReward = index === 0;
            
            return (
              <div 
                key={index}
                className={`bg-primary-dark rounded-xl p-4 ${isNextReward ? 'border-2 border-accent' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/60">{reward.label}</span>
                  {isNextReward && (
                    <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">Next</span>
                  )}
                </div>
                <p className="text-xl font-bold">{formatNumber(reward.amount)} MUSKY</p>
              </div>
            );
          })}
        </div>
        
        {/* Reward Calendar */}
        <h2 className="text-xl font-bold mb-4">30-Day Reward Calendar</h2>
        <div className="bg-primary-dark rounded-xl p-6 overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {DAILY_REWARDS.map((reward, index) => {
              const isPast = reward.day <= currentStreak;
              const isCurrent = reward.day === currentStreak + 1;
              const isSpecialDay = reward.day % 7 === 0; // Weekly bonuses
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    isPast 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : isCurrent
                      ? 'bg-accent/20 border-2 border-accent'
                      : isSpecialDay
                      ? 'bg-orange-500/20 border border-orange-500/30'
                      : 'bg-black/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs ${isPast ? 'text-green-400' : isCurrent ? 'text-accent' : 'text-white/60'}`}>
                      Day {reward.day}
                    </span>
                    {isPast && (
                      <span className="text-xs bg-green-500/30 text-green-400 px-1.5 py-0.5 rounded-full">
                        Claimed
                      </span>
                    )}
                  </div>
                  <p className={`font-bold ${
                    isPast 
                      ? 'text-green-400' 
                      : isCurrent
                      ? 'text-accent'
                      : isSpecialDay
                      ? 'text-orange-400'
                      : 'text-white'
                  }`}>
                    {formatNumber(reward.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Claim Animation */}
        {showAnimation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 1, 0],
                y: [0, -50, -100]
              }}
              transition={{ duration: 3, times: [0, 0.3, 0.8, 1] }}
              className="text-4xl font-bold text-green-400 bg-black/50 px-6 py-3 rounded-xl backdrop-blur-sm"
            >
              +{formatNumber(claimedAmount)} MUSKY
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
} 