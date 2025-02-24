import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
  if (!gpu) return null;

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
          {/* Header with Image */}
          <div className="relative h-48 bg-gradient-to-b from-accent/20 to-primary/20">
            <Image
              src={gpu.image}
              alt={gpu.name}
              fill
              className="object-contain p-4"
            />
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
                {gpu.duration && (
                  <p className="text-sm text-white/60">Duration: {gpu.duration}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">Owned</p>
                <p className="font-bold text-lg">{owned}/{gpu.maxPurchase}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-sm text-white/60">CUDA Cores</p>
                  <p className="font-bold">{gpu.specs.cores}</p>
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
              <div className="flex justify-between text-sm text-white/60">
                <span>Price</span>
                <div className="text-right">
                  {gpu.price.musky && (
                    <p className="text-sm text-white/80">{gpu.price.musky} MUSKY</p>
                  )}
                  <p className="text-sm text-white/80">{gpu.price.ton} TON</p>
                  <p className="text-sm text-white/80">{gpu.price.stars} Stars</p>
                </div>
              </div>

              <motion.button
                className={`w-full py-3 rounded-lg font-bold ${
                  canPurchase
                    ? 'bg-orange-500 hover:bg-orange-400'
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
                whileHover={canPurchase ? { scale: 1.02 } : {}}
                whileTap={canPurchase ? { scale: 0.98 } : {}}
                onClick={() => canPurchase && onPurchase(gpu)}
              >
                {canPurchase ? 'Purchase' : 'Locked'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GpuDetailsModal; 