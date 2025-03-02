'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/components/layout/Layout';

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
  const [loading, setLoading] = useState(true);
  const BOT_LINK = 'https://t.me/MUSKY_ON_SOL_BOT';

  useEffect(() => {
    if (user?.user_id) {
      fetchReferralStats();
    }
  }, [user?.user_id]);

  const fetchReferralStats = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/referrals/${user.user_id}`);
      
      if (response.ok) {
        const data = await response.json();
        data.referralLink = `${BOT_LINK}?start=ref_${user.user_id}`;
        setStats(data);
      } else {
        throw new Error('Failed to fetch referral stats');
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!stats?.referralLink) return;
    
    navigator.clipboard.writeText(stats.referralLink)
      .then(() => {
        toast.success('Referral link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  const shareToTelegram = () => {
    if (!stats?.referralLink) return;
    
    const shareText = `Join me on Musky and earn MUSKY tokens! Use my referral link:`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(telegramShareUrl, '_blank');
  };

  const openReferralBot = () => {
    if (!user?.user_id) return;
    
    const referralLink = `${BOT_LINK}?start=ref_${user.user_id}`;
    window.open(referralLink, '_blank');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Refer & Earn</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-accent rounded-full"></div>
              <div className="h-3 w-3 bg-accent rounded-full"></div>
              <div className="h-3 w-3 bg-accent rounded-full"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-primary/20 rounded-xl p-6 mb-6 border border-white/10">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background/30 p-4 rounded-lg text-center">
                  <p className="text-white/60 text-sm mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                </div>
                <div className="bg-background/30 p-4 rounded-lg text-center">
                  <p className="text-white/60 text-sm mb-1">Total Earned</p>
                  <p className="text-2xl font-bold">{stats?.totalEarned || 0} MUSKY</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-white/60 text-sm mb-2">Your Referral Link</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={stats?.referralLink || ''}
                    readOnly
                    className="flex-1 bg-background/50 border border-white/10 rounded-l-lg py-2 px-3 text-sm"
                  />
                  <motion.button
                    className="bg-accent py-2 px-4 rounded-r-lg text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copyToClipboard}
                  >
                    Copy
                  </motion.button>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <motion.button
                  className="flex-1 bg-primary/40 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={shareToTelegram}
                >
                  <span>📱</span>
                  <span>Share on Telegram</span>
                </motion.button>
                <motion.button
                  className="flex-1 bg-accent/80 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openReferralBot}
                >
                  <span>🤖</span>
                  <span>Open Bot</span>
                </motion.button>
              </div>
            </div>
            
            <div className="bg-primary/20 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Share your referral link</p>
                    <p className="text-white/60 text-sm">Send your unique referral link to friends via Telegram</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Friends join $Musky platform</p>
                    <p className="text-white/60 text-sm">When they join using your link, they become your referral, you Get instantly 2000 $MUSKY</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Earn Additional rewards</p>
                    <p className="text-white/60 text-sm">Get 10% of all MUSKY your referrals earn</p>
                  </div>
                </div>
              </div>
            </div>
            
            {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
              <div className="bg-primary/20 rounded-xl p-6 mt-6 border border-white/10">
                <h2 className="text-xl font-bold mb-4">Recent Referrals</h2>
                <div className="space-y-3">
                  {stats.recentReferrals.map((referral, index) => (
                    <div key={index} className="bg-background/30 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{referral.username}</p>
                        <p className="text-white/60 text-xs">{referral.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">+{referral.earned} MUSKY</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 