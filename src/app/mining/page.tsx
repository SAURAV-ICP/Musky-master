'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GpuDetailsModal from '@/components/mining/GpuDetailsModal';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';

interface GPU {
  id: number;
  name: string;
  hashrate: string;
  duration?: string;
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
}

// Remove the imports and use direct paths to public directory
const gpus: GPU[] = [
  {
    id: 1,
    name: 'RTX 4070',
    hashrate: '0.03 SOL/day',
    price: {
      musky: 40000,
      ton: 5,
      stars: 12000
    },
    specs: {
      cores: 5888,
      memory: '12GB GDDR6X',
      power: '200W',
      efficiency: '0.00015 SOL/W/day'
    },
    image: '/components/assets/4070TI.jpg',
    description: 'Entry-level mining GPU with reliable performance.',
    maxPurchase: 2
  },
  {
    id: 2,
    name: 'RTX 4090',
    hashrate: '0.08 SOL/day',
    price: {
      musky: 75000,
      ton: 10,
      stars: 25000
    },
    specs: {
      cores: 16384,
      memory: '24GB GDDR6X',
      power: '450W',
      efficiency: '0.00018 SOL/W/day'
    },
    image: '/components/assets/4090ti.jpg',
    description: 'High-performance GPU for serious miners.',
    maxPurchase: 2
  },
  {
    id: 3,
    name: 'RTX 5070',
    hashrate: '0.25 SOL/day',
    duration: '10 days',
    price: {
      ton: 25,
      stars: 60000
    },
    specs: {
      cores: 7680,
      memory: '16GB GDDR7',
      power: '220W',
      efficiency: '0.00114 SOL/W/day'
    },
    image: '/components/assets/5070ti.jpg',
    description: 'Next-gen mining GPU with enhanced efficiency.',
    maxPurchase: 2
  },
  {
    id: 4,
    name: 'RTX 5090 MAX',
    hashrate: '0.5 SOL/day',
    duration: '10 days',
    price: {
      ton: 50,
      stars: 120000
    },
    specs: {
      cores: 18432,
      memory: '32GB GDDR7',
      power: '500W',
      efficiency: '0.001 SOL/W/day'
    },
    image: '/components/assets/5090ti.mov',
    description: 'Ultimate mining GPU for maximum returns.',
    maxPurchase: 2
  }
];

export default function MiningPage() {
  const { user, mutate } = useUser();
  const [selectedGPU, setSelectedGPU] = useState<GPU | null>(null);
  const [userGPUs, setUserGPUs] = useState<{ [key: string]: number }>({});
  const [activeGPUs, setActiveGPUs] = useState(0);

  useEffect(() => {
    const fetchUserGPUs = async () => {
      try {
        const response = await fetch(`/api/mining/gpus?user_id=${user?.user_id}`);
        if (response.ok) {
          const data = await response.json();
          setUserGPUs(data.gpus);
          setActiveGPUs(data.activeCount);
        }
      } catch (error) {
        console.error('Failed to fetch GPU data:', error);
      }
    };

    if (user) {
      fetchUserGPUs();
    }
  }, [user]);

  const canPurchaseGPU = (gpu: GPU) => {
    const currentGPUCount = userGPUs[gpu.id.toString()] || 0;
    const previousGPUsFull = gpus
      .filter(g => g.id < gpu.id)
      .every(g => (userGPUs[g.id.toString()] || 0) >= 2);
    
    return previousGPUsFull && currentGPUCount < gpu.maxPurchase && activeGPUs < 8;
  };

  const handlePurchase = async (gpu: GPU) => {
    if (!canPurchaseGPU(gpu)) {
      toast.error('Purchase previous GPUs first or max limit reached');
      return;
    }

    try {
      const response = await fetch('/api/mining/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          gpu_id: gpu.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Purchase failed');
      }

      const data = await response.json();
      setUserGPUs(data.gpus);
      setActiveGPUs(data.activeCount);
      mutate();
      toast.success('GPU purchased successfully!');
    } catch (error) {
      toast.error('Failed to purchase GPU');
    }
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
            <p className="text-xl font-bold">{user?.mining_rate || 0} SOL/day</p>
          </div>
        </div>

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
                {gpu.name === 'RTX 5090 MAX' ? (
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
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">Owned</p>
                  <p className="font-bold">{userGPUs[gpu.id.toString()] || 0}/2</p>
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

        <GpuDetailsModal
          gpu={selectedGPU}
          onClose={() => setSelectedGPU(null)}
          onPurchase={handlePurchase}
          canPurchase={selectedGPU ? canPurchaseGPU(selectedGPU) : false}
          owned={selectedGPU ? userGPUs[selectedGPU.id.toString()] || 0 : 0}
        />
      </div>
    </Layout>
  );
} 