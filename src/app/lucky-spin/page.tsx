'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

const SPIN_COST = 1000;
const MAX_STAMINA = 1200;
const STAMINA_REGEN_RATE = Math.floor(MAX_STAMINA / 12); // Regenerate full stamina in 12 hours

export default function LuckySpinPage() {
  const { user, mutate } = useUser();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<{ type: string; amount: number } | null>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [currentStamina, setCurrentStamina] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(1000);

  useEffect(() => {
    console.log('Current user data:', user);
    if (!user?.spin_energy) {
      console.log('No spin energy found, attempting to initialize...');
      mutate();
    }

    if (user?.spin_energy) {
      setCurrentStamina(user.spin_energy);
    }

    // Calculate time until next reset (skip for admin)
    if (user?.last_spin_energy_reset && !user?.is_admin) {
      const updateTimer = () => {
        const now = new Date();
        const lastReset = new Date(user.last_spin_energy_reset!);
        const nextResetTime = new Date(lastReset.getTime() + (12 * 60 * 60 * 1000));
        
        if (now >= nextResetTime) {
          setTimeUntilReset(null);
          mutate(); // Refresh user data when reset time is reached
          return;
        }

        const diff = nextResetTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilReset(`${hours}h ${minutes}m`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const prizes = [
    { type: 'SOL', amount: 1, chance: '0.1%', color: '#00ff00', emoji: '💎' },
    { type: 'SOL', amount: 0.5, chance: '0.5%', color: '#00cc00', emoji: '🌟' },
    { type: 'MUSKY', amount: 5000, chance: '1%', color: '#0099ff', emoji: '🚀' },
    { type: 'MUSKY', amount: 2000, chance: '3%', color: '#3366ff', emoji: '💫' },
    { type: 'MUSKY', amount: 1000, chance: '5%', color: '#6633ff', emoji: '✨' },
    { type: 'Energy', amount: 500, chance: '10%', color: '#9933ff', emoji: '⚡' },
    { type: 'MUSKY', amount: 500, chance: '80.4%', color: '#cc33ff', emoji: '💰' },
  ];

  const handleSpin = async () => {
    if (!user?.user_id || isSpinning) return;

    try {
      setIsSpinning(true);
      const startRotation = rotation;
      const spinRotation = 1800 + Math.random() * 360;
      setRotation(startRotation + spinRotation);

      const response = await fetch('/api/lucky-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to spin');
      }

      setTimeout(() => {
        setPrize(data.prize);
        setIsSpinning(false);
        mutate();
      }, 3000);

      if (data.next_reset) {
        setNextReset(data.next_reset);
      }

    } catch (error) {
      setIsSpinning(false);
      toast.error(error instanceof Error ? error.message : 'Failed to spin');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 flex flex-col items-center justify-start pt-8 relative">
        {/* Close Button */}
        <Link href="/" className="absolute top-4 right-4">
          <motion.button
            className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl hover:bg-accent/40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </Link>

        <h1 className="text-3xl font-bold text-center mb-8 text-white">Lucky Spin</h1>

        {/* Purchase Button */}
        <motion.button
          className="absolute top-4 left-4 px-4 py-2 bg-accent/20 rounded-full flex items-center space-x-2 hover:bg-accent/40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPurchasing(true)}
        >
          <motion.span
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ⚡
          </motion.span>
          <span className="font-semibold">{user?.spin_energy || 0}</span>
        </motion.button>

        {/* Stamina Bar */}
        <div className="w-full max-w-md mb-8 bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center">
              <motion.span
                className="text-xl mr-2"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ⚡
              </motion.span>
              <span className="text-sm font-semibold text-white/80">Stamina</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">
                {currentStamina}/{user?.is_admin ? '∞' : MAX_STAMINA}
              </span>
              {!user?.is_admin && (
                <div className="text-xs text-white/60">+{STAMINA_REGEN_RATE}/hour</div>
              )}
            </div>
          </div>
          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-yellow-400 rounded-full relative overflow-hidden"
              initial={{ width: "0%" }}
              animate={{ 
                width: user?.is_admin ? '100%' : `${(currentStamina / MAX_STAMINA) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          </div>
          {timeUntilReset && !user?.is_admin && (
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-white/60">Next reset in: {timeUntilReset}</p>
              <p className="text-sm text-accent">+{STAMINA_REGEN_RATE} stamina/hr</p>
            </div>
          )}
        </div>

        {/* Spin Wheel */}
        <div className="relative w-80 h-80 mb-8">
          <motion.div
            className="w-full h-full rounded-full border-4 border-accent relative overflow-hidden bg-black/30"
            style={{ transform: `rotate(${rotation}deg)` }}
            transition={{ duration: 3, ease: "easeOut" }}
          >
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${(index * 360) / prizes.length}deg)`,
                  transformOrigin: '50% 50%',
                }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 origin-bottom"
                  style={{ backgroundColor: prize.color }}
                />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl">
                  {prize.emoji}
                </div>
              </div>
            ))}
          </motion.div>
          
          {/* Center pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-8 bg-accent" 
               style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
        </div>

        {/* Spin Button */}
        <motion.button
          className={`px-8 py-3 rounded-xl font-bold text-lg mb-8 ${
            isSpinning || currentStamina < SPIN_COST
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-accent hover:bg-accent/80'
          }`}
          whileHover={!isSpinning && currentStamina >= SPIN_COST ? { scale: 1.05 } : {}}
          whileTap={!isSpinning && currentStamina >= SPIN_COST ? { scale: 0.95 } : {}}
          onClick={handleSpin}
          disabled={isSpinning || currentStamina < SPIN_COST}
        >
          {isSpinning ? 'Spinning...' : 'SPIN'}
        </motion.button>

        {/* Prize Pool */}
        <div className="w-full max-w-md bg-black/20 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4 text-white">Prize Pool</h2>
          <div className="space-y-2">
            {prizes.map((prize, index) => (
              <div key={index} className="flex justify-between items-center text-white/80">
                <div className="flex items-center space-x-2">
                  <span>{prize.emoji}</span>
                  <span>{prize.amount} {prize.type}</span>
                </div>
                <span className="text-accent">{prize.chance}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prize Animation */}
        <AnimatePresence>
          {prize && !isSpinning && (
            <motion.div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrize(null)}
            >
              <motion.div
                className="bg-primary p-8 rounded-2xl text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="text-6xl mb-4">
                  {prizes.find(p => 
                    p.type.toLowerCase() === prize.type && p.amount === prize.amount
                  )?.emoji || '🎉'}
                </div>
                <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                <p className="text-lg">
                  You won {prize.amount} {prize.type.toUpperCase()}!
                </p>
                <motion.button
                  className="mt-4 px-6 py-2 bg-accent rounded-full font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPrize(null)}
                >
                  Awesome!
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Purchase Modal */}
        <AnimatePresence>
          {isPurchasing && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPurchasing(false)}
            >
              <motion.div
                className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-md p-6"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Purchase Stamina</h2>
                  <button onClick={() => setIsPurchasing(false)}>✕</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Amount (1000-10000)</label>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="1000"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(parseInt(e.target.value))}
                      className="w-full h-2 bg-accent/20 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{purchaseAmount} Stamina</span>
                      <span>{Math.floor(purchaseAmount / 10)} Stars</span>
                    </div>
                  </div>

                  <motion.button
                    className="w-full py-3 bg-accent rounded-xl font-bold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/stamina/purchase', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            user_id: user?.user_id,
                            amount: purchaseAmount,
                            cost: Math.floor(purchaseAmount / 10)
                          })
                        });

                        if (!response.ok) throw new Error('Purchase failed');

                        toast.success('Stamina purchased successfully!');
                        mutate();
                        setIsPurchasing(false);
                      } catch (error) {
                        toast.error('Failed to purchase stamina');
                      }
                    }}
                  >
                    Purchase
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
} 