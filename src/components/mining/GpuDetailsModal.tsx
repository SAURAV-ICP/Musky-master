import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import PaymentProcessor from '../common/PaymentProcessor';

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

interface GpuDetailsModalProps {
  gpu: GPU | null;
  onClose: () => void;
  onPurchase: (gpu: GPU) => Promise<void>;
  canPurchase: boolean;
  owned: number;
}

const GpuDetailsModal: React.FC<GpuDetailsModalProps> = ({
  gpu,
  onClose,
  onPurchase,
  canPurchase,
  owned,
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'TON' | 'Stars' | 'MUSKY'>('TON');

  if (!gpu) return null;

  const handlePurchaseClick = () => {
    if (!canPurchase) return;
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    await onPurchase(gpu);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  // Calculate mining rates
  const miningPerSecond = gpu.miningRatePerDay / (24 * 60 * 60);
  const miningPerMinute = gpu.miningRatePerDay / (24 * 60);
  const miningPerHour = gpu.miningRatePerDay / 24;
  const totalMining = gpu.miningRatePerDay * 30; // 30 days

  // Calculate USD value
  const solPrice = 150; // $150 per SOL
  const totalUsdValue = totalMining * solPrice;
  
  // Calculate ROI (Return on Investment)
  const tonPrice = 6.5; // $6.5 per TON
  const investmentUsd = gpu.price.ton * tonPrice;
  const roiDays = investmentUsd / (gpu.miningRatePerDay * solPrice);
  const roiPercentage = (totalUsdValue / investmentUsd) * 100 - 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-primary/90 backdrop-blur-xl rounded-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {showPayment ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Purchase {gpu.name}</h2>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:bg-black/40 transition-colors"
                >
                  ←
                </button>
              </div>
              <PaymentProcessor
                amount={gpu.price[selectedCurrency.toLowerCase() as 'ton' | 'stars' | 'musky'] || gpu.price.ton}
                currency={selectedCurrency}
                itemType={gpu.name as any}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          ) : (
            <>
              {/* Header with Image */}
              <div className="relative h-48 bg-gradient-to-b from-accent/20 to-primary/20">
                {gpu.image.endsWith('.mov') ? (
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
                    className="object-contain p-4"
                  />
                )}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:bg-black/40 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{gpu.name}</h2>
                    <p className="text-accent text-lg">{gpu.hashrate}</p>
                    <p className="text-sm text-white/60">Duration: {gpu.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60">Owned</p>
                    <p className="font-bold text-lg">{owned}/{gpu.maxPurchase}</p>
                  </div>
                </div>

                {/* Mining Rates */}
                <div className="mb-6 bg-black/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Mining Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/60">Per Second</p>
                      <p className="font-bold text-green-400">{miningPerSecond.toFixed(8)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Per Minute</p>
                      <p className="font-bold text-green-400">{miningPerMinute.toFixed(6)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Per Hour</p>
                      <p className="font-bold text-green-400">{miningPerHour.toFixed(4)} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Per Day</p>
                      <p className="font-bold text-green-400">{gpu.miningRatePerDay.toFixed(2)} SOL</p>
                    </div>
                  </div>
                  
                  {/* Total Mining Potential */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-white/60">Total Mining (30 days)</p>
                        <p className="font-bold text-green-400">{totalMining.toFixed(2)} SOL</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/60">Estimated Value</p>
                        <p className="font-bold text-green-400">${totalUsdValue.toFixed(2)} USD</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ROI Information */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-white/60">ROI Period</p>
                        <p className="font-bold text-accent">{roiDays.toFixed(1)} days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/60">ROI Percentage</p>
                        <p className="font-bold text-accent">+{roiPercentage.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-white/60">CUDA Cores</p>
                      <p className="font-bold">{gpu.specs.cores.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-white/60">Memory</p>
                      <p className="font-bold">{gpu.specs.memory}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-white/60">Power Draw</p>
                      <p className="font-bold">{gpu.specs.power}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-white/60">Mining Efficiency</p>
                      <p className="font-bold">{gpu.specs.efficiency}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {gpu.description}
                  </p>
                </div>

                {/* Purchase Options */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-2">Payment Options</h3>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {gpu.price.ton && (
                      <motion.button
                        className={`py-2 px-3 rounded-lg text-center ${
                          selectedCurrency === 'TON' 
                            ? 'bg-accent text-white' 
                            : 'bg-black/20 text-white/70'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCurrency('TON')}
                      >
                        <div className="font-bold">{gpu.price.ton} TON</div>
                      </motion.button>
                    )}
                    
                    {gpu.price.stars && (
                      <motion.button
                        className={`py-2 px-3 rounded-lg text-center ${
                          selectedCurrency === 'Stars' 
                            ? 'bg-accent text-white' 
                            : 'bg-black/20 text-white/70'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCurrency('Stars')}
                      >
                        <div className="font-bold">{gpu.price.stars.toLocaleString()} Stars</div>
                      </motion.button>
                    )}
                    
                    {gpu.price.musky && (
                      <motion.button
                        className={`py-2 px-3 rounded-lg text-center ${
                          selectedCurrency === 'MUSKY' 
                            ? 'bg-accent text-white' 
                            : 'bg-black/20 text-white/70'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCurrency('MUSKY')}
                      >
                        <div className="font-bold">{gpu.price.musky.toLocaleString()} MUSKY</div>
                      </motion.button>
                    )}
                  </div>

                  <motion.button
                    className={`w-full py-3 rounded-lg font-bold ${
                      canPurchase
                        ? 'bg-orange-500 hover:bg-orange-400'
                        : 'bg-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={canPurchase ? { scale: 1.02 } : {}}
                    whileTap={canPurchase ? { scale: 0.98 } : {}}
                    onClick={handlePurchaseClick}
                  >
                    {canPurchase ? `Purchase with ${selectedCurrency}` : 'Locked'}
                  </motion.button>
                  
                  {!canPurchase && owned < gpu.maxPurchase && (
                    <p className="text-xs text-orange-400 mt-2 text-center">
                      {gpu.name === 'RTX5070' ? 'You need to own at least one RTX4090 first' : 
                       gpu.name === 'RTX5090' ? 'You need to own at least one RTX5070 first' : 
                       'Maximum GPU limit reached (8)'}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GpuDetailsModal; 