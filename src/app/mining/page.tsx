'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GpuDetailsModal from '@/components/mining/GpuDetailsModal';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import PaymentProcessor from '@/components/common/PaymentProcessor';

interface GPU {
  id: number;
  name: string;
  hashrate: string;
  duration: string;
  price: {
    musky?: number;
    ton: number;
    stars: number;
  };
  specs: {
    cores: number;
    memory: string;
    power: string;
    efficiency: string;
  };
  image: string;
  description: string;
  maxPurchase: number;
  miningRatePerDay: number;
}

// GPU data based on LOGIC_PAYMENT.md
const gpus: GPU[] = [
  {
    id: 1,
    name: 'RTX4070',
    hashrate: '0.03 SOL/day',
    duration: '30 days',
    price: {
      musky: 40000,
      ton: 5,
      stars: 2500
    },
    specs: {
      cores: 5888,
      memory: '12GB GDDR6X',
      power: '200W',
      efficiency: '0.00015 SOL/W/day'
    },
    image: '/components/assets/4070TI.jpg',
    description: 'Entry-level mining GPU with reliable performance. Mines 0.03 SOL per day for 30 days (total 0.9 SOL).',
    maxPurchase: 2,
    miningRatePerDay: 0.03
  },
  {
    id: 2,
    name: 'RTX4090',
    hashrate: '0.08 SOL/day',
    duration: '30 days',
    price: {
      musky: 70000,
      ton: 9,
      stars: 5000
    },
    specs: {
      cores: 16384,
      memory: '24GB GDDR6X',
      power: '450W',
      efficiency: '0.00018 SOL/W/day'
    },
    image: '/components/assets/4090ti.jpg',
    description: 'High-performance GPU for serious miners. Mines 0.08 SOL per day for 30 days (total 2.4 SOL).',
    maxPurchase: 2,
    miningRatePerDay: 0.08
  },
  {
    id: 3,
    name: 'RTX5070',
    hashrate: '0.25 SOL/day',
    duration: '30 days',
    price: {
      musky: 125000,
      ton: 25,
      stars: 12500
    },
    specs: {
      cores: 7680,
      memory: '16GB GDDR7',
      power: '220W',
      efficiency: '0.00114 SOL/W/day'
    },
    image: '/components/assets/5070ti.jpg',
    description: 'Next-gen mining GPU with enhanced efficiency. Mines 0.25 SOL per day for 30 days (total 7.5 SOL).',
    maxPurchase: 2,
    miningRatePerDay: 0.25
  },
  {
    id: 4,
    name: 'RTX5090',
    hashrate: '0.5 SOL/day',
    duration: '30 days',
    price: {
      musky: 250000,
      ton: 50,
      stars: 25000
    },
    specs: {
      cores: 18432,
      memory: '32GB GDDR7',
      power: '500W',
      efficiency: '0.001 SOL/W/day'
    },
    image: '/components/assets/5090ti.mov',
    description: 'Ultimate mining GPU for maximum returns. Mines 0.5 SOL per day for 30 days (total 15 SOL).',
    maxPurchase: 2,
    miningRatePerDay: 0.5
  }
];

export default function MiningPage() {
  const { user, mutate } = useUser();
  const [selectedGPU, setSelectedGPU] = useState<GPU | null>(null);
  const [userGPUs, setUserGPUs] = useState<{ [key: string]: number }>({});
  const [activeGPUs, setActiveGPUs] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'TON' | 'Stars' | 'MUSKY'>('TON');
  const [isLoading, setIsLoading] = useState(true);
  const [miningRate, setMiningRate] = useState(0);
  const [solanaBalance, setSolanaBalance] = useState(0);
  const [miningPerSecond, setMiningPerSecond] = useState(0);
  const [miningPerMinute, setMiningPerMinute] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isAdmin, setIsAdmin] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [lastServerUpdate, setLastServerUpdate] = useState(Date.now());
  const [nextServerUpdate, setNextServerUpdate] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserGPUs();
      // Check if user is admin (based on user_id)
      setIsAdmin(user.user_id === 'admin' || user.is_admin);
      
      const interval = setInterval(() => {
        fetchUserGPUs();
        setLastServerUpdate(Date.now());
        setNextServerUpdate(10 * 60 * 1000); // 10 minutes in milliseconds
      }, 10 * 60 * 1000); // Update every 10 minutes
      
      // Update mining progress in real-time
      const miningInterval = setInterval(() => {
        updateMiningProgress();
      }, 1000); // Update every second
      
      return () => {
        clearInterval(interval);
        clearInterval(miningInterval);
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setMiningRate(user.mining_rate || 0);
      setSolanaBalance(user.solana_balance || 0);
      
      // Calculate mining rates
      const perDay = user.mining_rate || 0;
      setMiningPerSecond(perDay / (24 * 60 * 60));
      setMiningPerMinute(perDay / (24 * 60));
      setLastUpdateTime(Date.now());
      setNextServerUpdate(10 * 60 * 1000); // 10 minutes in milliseconds
    }
  }, [user]);

  const updateMiningProgress = () => {
    const now = Date.now();
    const secondsElapsed = (now - lastUpdateTime) / 1000;
    
    if (miningRate > 0) {
      // Update Solana balance based on mining rate
      const newBalance = solanaBalance + (miningPerSecond * secondsElapsed);
      setSolanaBalance(newBalance);
      
      // Calculate progress for the progress bar (resets every 10 minutes)
      const millisSinceLastServerUpdate = now - lastServerUpdate;
      const progressPercent = (millisSinceLastServerUpdate / (10 * 60 * 1000)) * 100;
      setMiningProgress(Math.min(progressPercent, 100));
      
      // Update next server update countdown
      const remainingTime = Math.max(0, 10 * 60 * 1000 - millisSinceLastServerUpdate);
      setNextServerUpdate(remainingTime);
    }
    
    setLastUpdateTime(now);
  };

  const fetchUserGPUs = async () => {
    if (!user?.user_id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/mining/gpus?user_id=${user.user_id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Ensure we're getting valid GPU data
        if (data.gpus) {
          setUserGPUs(data.gpus);
          setActiveGPUs(data.activeCount || 0);
        }
        
        // Update mining rates
        if (data.miningRate !== undefined) {
          setMiningRate(data.miningRate);
          const perDay = data.miningRate;
          setMiningPerSecond(perDay / (24 * 60 * 60));
          setMiningPerMinute(perDay / (24 * 60));
        }
        
        // Update Solana balance
        if (data.solanaBalance !== undefined) {
          setSolanaBalance(data.solanaBalance);
        }
        
        setLastUpdateTime(Date.now());
        setLastServerUpdate(Date.now());
        setNextServerUpdate(10 * 60 * 1000); // 10 minutes in milliseconds
      }
    } catch (error) {
      console.error('Failed to fetch GPU data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canPurchaseGPU = (gpu: GPU) => {
    if (!user) return false;
    
    // Admin can always purchase GPUs
    if (isAdmin) return true;
    
    const currentGPUCount = userGPUs[gpu.name] || 0;
    
    // For RTX4070 and RTX4090, no prerequisites
    if (gpu.name === 'RTX4070' || gpu.name === 'RTX4090') {
      return currentGPUCount < gpu.maxPurchase && activeGPUs < 8;
    }
    
    // For RTX5070, need at least one RTX4090
    if (gpu.name === 'RTX5070') {
      return (userGPUs['RTX4090'] || 0) > 0 && 
             currentGPUCount < gpu.maxPurchase && 
             activeGPUs < 8;
    }
    
    // For RTX5090, need at least one RTX5070
    if (gpu.name === 'RTX5090') {
      return (userGPUs['RTX5070'] || 0) > 0 && 
             currentGPUCount < gpu.maxPurchase && 
             activeGPUs < 8;
    }
    
    return false;
  };

  const handlePurchase = async (gpu: GPU) => {
    if (!canPurchaseGPU(gpu)) {
      toast.error('Purchase previous GPUs first or max limit reached');
      return;
    }

    setSelectedGPU(gpu);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    
    try {
      await fetchUserGPUs();
      await mutate(); // Update user data
      toast.success(`${selectedGPU?.name} purchased successfully!`);
    } catch (error) {
      console.error('Error updating after purchase:', error);
    }
    
    setSelectedGPU(null);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedGPU(null);
  };

  const formatSolana = (value: number) => {
    return value.toFixed(6);
  };

  // Calculate USD value of Solana
  const solanaToUSD = (sol: number) => {
    const solPrice = 150; // $150 per SOL
    return sol * solPrice;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mining Farm</h1>
            <p className="text-white/60">Active GPUs: {activeGPUs}/8</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">Mining Power</p>
            <p className="text-xl font-bold">{miningRate.toFixed(4)} SOL/day</p>
            <div className="text-xs text-accent">
              {miningPerSecond.toFixed(8)} SOL/sec • {miningPerMinute.toFixed(6)} SOL/min
            </div>
          </div>
        </div>

        <div className="bg-primary/20 backdrop-blur-lg rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Solana Balance</h2>
              <p className="text-sm text-white/60">Mined SOL</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">{formatSolana(solanaBalance)} SOL</p>
              <p className="text-sm text-green-400">≈ ${solanaToUSD(solanaBalance).toFixed(2)} USD</p>
            </div>
          </div>
          
          {/* Live mining progress */}
          {miningRate > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <p className="text-sm text-white/60">Live Mining</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <p className="text-sm text-green-400">Active</p>
                </div>
              </div>
              <div className="mt-2 bg-black/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ 
                    width: `${miningProgress}%`,
                    transition: 'width 1s linear'
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-white/40">+{(miningPerSecond * 60).toFixed(6)} SOL/min</p>
                <p className="text-xs text-white/40">
                  Next update: {Math.floor(nextServerUpdate / 60000)}m {Math.floor((nextServerUpdate % 60000) / 1000)}s
                </p>
              </div>
            </div>
          )}
        </div>

        {/* GPU Summary */}
        {activeGPUs > 0 && (
          <div className="bg-primary/20 backdrop-blur-lg rounded-xl p-4 border border-white/10 mb-6">
            <h2 className="text-lg font-semibold mb-3">Your Mining Equipment</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(userGPUs).map(([gpuName, count]) => {
                if (count > 0) {
                  const gpuInfo = gpus.find(g => g.name === gpuName);
                  return (
                    <div key={gpuName} className="bg-black/20 rounded-lg p-3">
                      <p className="font-bold">{gpuName}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-white/60">Count: {count}/2</p>
                        <p className="text-sm text-green-400">+{gpuInfo ? (gpuInfo.miningRatePerDay * count).toFixed(3) : '0.000'} SOL/day</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            
            {/* Total Mining Summary */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white/60">Total Mining (30 days)</p>
                  <p className="font-bold text-green-400">{(miningRate * 30).toFixed(2)} SOL</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">Estimated Value</p>
                  <p className="font-bold text-green-400">${(miningRate * 30 * 150).toFixed(2)} USD</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gpus.map((gpu) => (
            <motion.div
              key={gpu.id}
              className={`bg-primary/20 backdrop-blur-lg rounded-xl p-4 border-2 ${
                canPurchaseGPU(gpu)
                  ? 'border-accent/30 hover:border-accent'
                  : 'border-white/10 opacity-70'
              }`}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedGPU(gpu)}
            >
              <div className="relative h-48 mb-4">
                {gpu.name === 'RTX5090' ? (
                  <video
                    src={gpu.image}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={gpu.image}
                    alt={gpu.name}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{gpu.name}</h3>
                  <p className="text-accent">{gpu.hashrate}</p>
                  <p className="text-xs text-white/60">Duration: {gpu.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">Owned</p>
                  <p className="font-bold">{userGPUs[gpu.name] || 0}/2</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-white/60">Price:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {gpu.price.musky && (
                    <span className="text-xs bg-black/20 px-2 py-1 rounded">{gpu.price.musky.toLocaleString()} MUSKY</span>
                  )}
                  <span className="text-xs bg-black/20 px-2 py-1 rounded">{gpu.price.ton} TON</span>
                  <span className="text-xs bg-black/20 px-2 py-1 rounded">{gpu.price.stars.toLocaleString()} Stars</span>
                </div>
              </div>

              <motion.button
                className={`w-full py-2 rounded-lg font-bold ${
                  canPurchaseGPU(gpu)
                    ? 'bg-orange-500 hover:bg-orange-400'
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
                whileHover={canPurchaseGPU(gpu) ? { scale: 1.02 } : {}}
                whileTap={canPurchaseGPU(gpu) ? { scale: 0.98 } : {}}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canPurchaseGPU(gpu)) {
                    handlePurchase(gpu);
                  }
                }}
              >
                {canPurchaseGPU(gpu) ? 'Purchase' : 'Locked'}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {selectedGPU && !showPayment && (
          <GpuDetailsModal
            gpu={selectedGPU}
            onClose={() => setSelectedGPU(null)}
            onPurchase={(gpu) => handlePurchase(gpu as GPU)}
            canPurchase={canPurchaseGPU(selectedGPU)}
            owned={userGPUs[selectedGPU.name] || 0}
          />
        )}

        {selectedGPU && showPayment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Purchase {selectedGPU.name}</h2>
                  <button
                    onClick={handlePaymentCancel}
                    className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:bg-black/40 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <PaymentProcessor
                  amount={selectedGPU.price[selectedCurrency.toLowerCase() as 'ton' | 'stars' | 'musky'] || selectedGPU.price.ton}
                  currency={selectedCurrency}
                  itemType={selectedGPU.name as any}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 