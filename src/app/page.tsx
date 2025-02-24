'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import BufferScreen from '@/components/common/BufferScreen';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const { user, mutate } = useUser();
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [tapCount, setTapCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSpinOpen, setIsSpinOpen] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [lastTapTime, setLastTapTime] = useState<Date | null>(null);
  const [showBuffer, setShowBuffer] = useState(true);
  const [floatingNumbers, setFloatingNumbers] = useState<Array<{ id: number; value: number; x: number; y: number }>>([]);
  const [backgroundParticles, setBackgroundParticles] = useState<Array<{ id: number; delay: number; left: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(user?.energy || 2000);
  const [maxEnergy] = useState(2000);
  const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);

  useEffect(() => {
    if (user?.energy !== undefined) {
      setCurrentEnergy(user.energy);
    }
  }, [user?.energy]);

  useEffect(() => {
    // Refresh user data periodically to get updated energy
    const interval = setInterval(() => {
      mutate();
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [mutate]);

  useEffect(() => {
    if (user?.last_tap_time) {
      setLastTapTime(new Date(user.last_tap_time));
      calculateEnergy();
    }
    const interval = setInterval(calculateEnergy, 1000);
    return () => clearInterval(interval);
  }, [user?.last_tap_time]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBuffer(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Create initial background particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      left: `${Math.random() * 100}%`,
    }));
    setBackgroundParticles(particles);
  }, []);

  const calculateEnergy = () => {
    if (!lastTapTime || !user?.energy) {
      return;
    }

    const now = new Date();
    const timeSinceLastTap = now.getTime() - lastTapTime.getTime();
    const fourHours = 4 * 60 * 60 * 1000;
    const energyPerHour = maxEnergy / 4; // Full regeneration in 4 hours
    const energyGained = Math.floor((timeSinceLastTap / (60 * 60 * 1000)) * energyPerHour);
    
    // Calculate new energy based on time elapsed
    const newEnergy = Math.min(maxEnergy, user.energy + energyGained);

    if (newEnergy !== currentEnergy) {
      setCurrentEnergy(newEnergy);
      
      // Update the database with new energy if significantly different
      if (Math.abs(newEnergy - currentEnergy) >= 10) {
        supabase
          .from('users')
          .update({ 
            energy: newEnergy,
            last_tap_time: now.toISOString() 
          })
          .eq('user_id', user?.user_id)
          .then(() => mutate());
      }
    }
    
    if (newEnergy < maxEnergy) {
      const timeLeft = fourHours - (timeSinceLastTap % fourHours);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeUntilReset(null);
    }
  };

  const handleTap = async () => {
    if (isLoading || currentEnergy <= 0) return;
    setIsLoading(true);
    setIsAnimating(true);

    try {
      const now = new Date();
      // Only decrease energy by 1
      const newEnergy = Math.max(0, currentEnergy - 1);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          balance: (user?.balance || 0) + 1,
          last_tap_time: now.toISOString(),
          energy: newEnergy
        })
        .eq('user_id', user?.user_id)
        .select()
        .single();

      if (error) throw error;

      setCurrentEnergy(newEnergy);
      mutate();

      // Show +1 animation
      const tapArea = document.querySelector('.w-72.h-72');
      if (tapArea) {
        const rect = tapArea.getBoundingClientRect();
        const x = Math.min(rect.right - 20, window.innerWidth - 50);
        const y = rect.top + rect.height / 2;
        
        const particle = document.createElement('div');
        particle.className = 'floating-number';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.fontSize = '32px';
        particle.textContent = '+1';
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process tap');
    } finally {
      setIsLoading(false);
      setIsAnimating(false);
    }
  };

  const createParticles = () => {
    const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB6C1', '#90EE90', '#87CEEB'];
    const particles = Array.from({ length: 20 }, () => ({
      id: Math.random(),
      x: (Math.random() - 0.5) * 400,
      y: -300 - Math.random() * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles(prev => [...prev, ...particles]);
    setTimeout(() => {
      setParticles([]);
    }, 1000);
  };

  if (showBuffer) {
    return <BufferScreen onLoadingComplete={() => setShowBuffer(false)} />;
  }

  return (
    <Layout>
      {/* Background Particles */}
      <div className="particle-container">
        {backgroundParticles.map(particle => (
          <div
            key={particle.id}
            className="background-particle"
            style={{
              left: particle.left,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-b from-primary/20 to-background/20">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* Profile Button */}
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center space-x-3 text-white/80 hover:text-white"
            >
              <div className="w-10 h-10 relative">
                <Image
                  src="/assets/MUSKY.png"
                  alt="MUSKY"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">{user?.balance ?? 0} MUSKY</div>
                <div className="text-xs text-white/60 flex items-center">
                  {user?.solana_balance ?? 0}
                  <Image
                    src="/assets/SOLANA.png"
                    alt="SOL"
                    width={14}
                    height={14}
                    className="ml-1"
                  />
                </div>
              </div>
            </button>

            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setIsSpinOpen(true)}
                className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Image
                  src="/assets/Lucky_spin.png"
                  alt="Lucky Spin"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </motion.button>
              <motion.button
                onClick={() => setIsUpgradeOpen(true)}
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⭐
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20">
          {/* Tap Button */}
          <motion.div
            className="relative mb-12 touch-none select-none"
            whileTap={{ scale: 0.95 }}
            onClick={handleTap}
            style={{ 
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            <motion.div
              className="w-72 h-72 rounded-full bg-accent/20 backdrop-blur-lg flex items-center justify-center cursor-pointer relative overflow-hidden shimmer-effect touch-none"
              animate={isAnimating ? { 
                scale: [1, 0.95, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
              transition={{ duration: 0.15 }}
              style={{ 
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              <Image
                src="/assets/TILTED_MUSKY.png"
                alt="MUSKY Coin"
                width={240}
                height={240}
                className="object-contain transform hover:scale-105 transition-transform duration-300 pointer-events-none"
                draggable="false"
              />
            </motion.div>
          </motion.div>

          {/* Energy Bar */}
          <div className="space-y-3 text-center mb-8 bg-primary/20 backdrop-blur-lg rounded-xl p-6 w-full max-w-xs border border-white/10">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-white/80">Energy</span>
              <span className="text-sm font-bold">{currentEnergy}/{maxEnergy}</span>
            </div>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-accent rounded-full relative overflow-hidden"
                initial={{ width: "100%" }}
                animate={{ width: `${(currentEnergy / maxEnergy) * 100}%` }}
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
            {timeUntilReset && (
              <p className="text-sm text-white/60">
                Next reset in: {timeUntilReset}
              </p>
            )}
          </div>

          {/* Bottom Buttons */}
          <div className="fixed bottom-20 left-0 right-0 flex justify-between px-8">
            <motion.button
              onClick={() => setIsSpinOpen(true)}
              className="w-16 h-16 rounded-full bg-accent shadow-lg flex items-center justify-center text-2xl"
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              🎰
            </motion.button>
            <motion.button
              onClick={() => setIsUpgradeOpen(true)}
              className="w-16 h-16 rounded-full bg-accent shadow-lg flex items-center justify-center text-2xl"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              ⭐
            </motion.button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-md m-4 p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Profile</h2>
                <button onClick={() => setIsProfileOpen(false)}>✕</button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-sm text-white/60">MUSKY Balance</div>
                  <div className="text-2xl font-bold">{user?.balance ?? 0} MUSKY</div>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-sm text-white/60">Solana Balance</div>
                  <div className="text-2xl font-bold">{user?.solana_balance ?? 0} SOL</div>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-sm text-white/60">Mining Rate</div>
                  <div className="text-2xl font-bold">1000 MUSKY/24hr</div>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-sm text-white/60">Level</div>
                  <div className="text-2xl font-bold">{user?.level ?? 'Basic'} Musky</div>
                </div>
              </div>

              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-full mt-6 py-3 bg-accent rounded-xl font-bold"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-md m-4 p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Upgrade Status</h2>
                <button onClick={() => setIsUpgradeOpen(false)}>✕</button>
              </div>

              <div className="space-y-4">
                <motion.div
                  className="bg-black/20 rounded-lg p-6 premium-gradient premium-border shimmer-effect cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/upgrade', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          user_id: user?.user_id,
                          level: 'hero',
                        }),
                      });

                      if (response.ok) {
                        await mutate();
                        toast.success('Successfully upgraded to Hero Musky!');
                      } else {
                        toast.error('Failed to upgrade');
                      }
                    } catch (error) {
                      toast.error('Failed to upgrade');
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Hero Musky</h3>
                    <motion.div
                      className="text-2xl"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      ⭐
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">2x Mining Rate</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">50% Energy Boost</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">Exclusive Hero Badge</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <span>500</span>
                      <span className="text-xl">⭐</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>1</span>
                      <Image
                        src="/assets/ton-logo.png"
                        alt="TON"
                        width={16}
                        height={16}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-black/20 rounded-lg p-6 premium-gradient premium-border shimmer-effect cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/upgrade', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          user_id: user?.user_id,
                          level: 'superhero',
                        }),
                      });

                      if (response.ok) {
                        await mutate();
                        toast.success('Successfully upgraded to Superhero Musky!');
                      } else {
                        toast.error('Failed to upgrade');
                      }
                    } catch (error) {
                      toast.error('Failed to upgrade');
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Superhero Musky</h3>
                    <motion.div
                      className="text-2xl"
                      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                      transition={{
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      🌟
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">4x Mining Rate</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">100% Energy Boost</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">Exclusive Superhero Effects</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-accent rounded-full" />
                      <p className="text-white/80">Priority Support</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <span>1000</span>
                      <span className="text-xl">⭐</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>2</span>
                      <Image
                        src="/assets/ton-logo.png"
                        alt="TON"
                        width={16}
                        height={16}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lucky Spin Modal */}
      <AnimatePresence>
        {isSpinOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-md m-4 p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Lucky Spin</h2>
                <button onClick={() => setIsSpinOpen(false)}>✕</button>
              </div>

              <Link href="/lucky-spin" className="block">
                <motion.button
                  className="w-full py-3 bg-accent rounded-xl font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSpinOpen(false)}
                >
                  Go to Lucky Spin
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}