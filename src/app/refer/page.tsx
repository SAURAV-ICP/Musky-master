'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { toast } from 'react-hot-toast';

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  referralLink: string;
  recentReferrals: {
    username: string;
    date: string;
    earned: number;
  }[];
}

export default function ReferPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`/api/referrals/${user?.user_id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setShowCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <motion.h1
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Invite Friends
            </motion.h1>
            <motion.p
              className="text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Earn 2000 MUSKY for each friend you invite
            </motion.p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm text-white/60 mb-1">Total Referrals</h3>
              <p className="text-3xl font-bold">{stats?.totalReferrals || 0}</p>
            </motion.div>
            <motion.div
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm text-white/60 mb-1">Total Earned</h3>
              <p className="text-3xl font-bold">{stats?.totalEarned || 0} MUSKY</p>
            </motion.div>
          </div>

          {/* Referral Link */}
          <motion.div
            className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-bold mb-4">Your Referral Link</h3>
            <div className="relative">
              <div className="bg-background/50 rounded-lg p-4 pr-24 font-mono text-sm break-all">
                {stats?.referralLink || 'Loading...'}
              </div>
              <motion.button
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-accent rounded-lg font-bold text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
              >
                {showCopied ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Referrals */}
          <motion.div
            className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-bold mb-4">Recent Referrals</h3>
            <div className="space-y-4">
              {stats?.recentReferrals?.map((referral, index) => (
                <motion.div
                  key={index}
                  className="bg-background/50 rounded-lg p-4 flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div>
                    <p className="font-bold">{referral.username}</p>
                    <p className="text-sm text-white/60">{referral.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent font-bold">+{referral.earned} MUSKY</p>
                  </div>
                </motion.div>
              ))}
              {(!stats?.recentReferrals || stats.recentReferrals.length === 0) && (
                <div className="text-center text-white/60 py-4">
                  No referrals yet
                </div>
              )}
            </div>
          </motion.div>

          {/* How it Works */}
          <motion.div
            className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-bold mb-4">How it Works</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold">Share Your Link</p>
                  <p className="text-sm text-white/60">
                    Share your unique referral link with friends
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold">Friends Join</p>
                  <p className="text-sm text-white/60">
                    Your friends join using your referral link
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold">Earn Rewards</p>
                  <p className="text-sm text-white/60">
                    Both you and your friend receive 2000 MUSKY
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 