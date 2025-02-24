import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeOption {
  id: number;
  name: string;
  icon: string;
  farmRate: string;
  prices: {
    stars: number;
    ton: number;
  };
  benefits: string[];
  status: 'available' | 'upcoming';
}

const upgradeOptions: UpgradeOption[] = [
  {
    id: 1,
    name: 'Hero Musky',
    icon: '🦸‍♂️',
    farmRate: '2x Base Rate',
    prices: {
      stars: 500,
      ton: 1
    },
    benefits: [
      'Increased farming rate',
      'Access to exclusive tasks',
      'Special profile badge'
    ],
    status: 'available'
  },
  {
    id: 2,
    name: 'Superhero Musky',
    icon: '⚡',
    farmRate: '4x Base Rate',
    prices: {
      stars: 1000,
      ton: 2
    },
    benefits: [
      'Maximum farming rate',
      'Priority withdrawal',
      'VIP support access',
      'Exclusive NFT rewards'
    ],
    status: 'available'
  },
  {
    id: 3,
    name: 'Mystic Musky',
    icon: '🔮',
    farmRate: '8x Base Rate',
    prices: {
      stars: 2000,
      ton: 4
    },
    benefits: [
      'Enhanced mining power',
      'Exclusive mystic rewards',
      'Special effects',
      'Premium support'
    ],
    status: 'upcoming'
  },
  {
    id: 4,
    name: 'Legendary Musky',
    icon: '👑',
    farmRate: '16x Base Rate',
    prices: {
      stars: 5000,
      ton: 10
    },
    benefits: [
      'Ultimate mining power',
      'Legendary rewards',
      'Custom profile effects',
      'Priority features access'
    ],
    status: 'upcoming'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedPayment, setSelectedPayment] = useState<'stars' | 'ton'>('stars');
  const [selectedTier, setSelectedTier] = useState<UpgradeOption | null>(null);

  const handleUpgrade = () => {
    if (!selectedTier) return;
    // Implement upgrade logic here
    console.log(`Upgrading to ${selectedTier.name} with ${selectedPayment}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-primary/90 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upgrade Status</h2>
              <motion.button
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
              >
                ✕
              </motion.button>
            </div>

            {/* Tier Selection */}
            <div className="space-y-4 mb-6">
              {upgradeOptions.map((option) => (
                <motion.div
                  key={option.id}
                  className={`p-4 rounded-xl border-2 transition-colors relative overflow-hidden ${
                    option.status === 'upcoming'
                      ? 'border-white/10 opacity-70'
                      : selectedTier?.id === option.id
                      ? 'border-accent bg-accent/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  whileHover={option.status === 'available' ? { scale: 1.02 } : {}}
                  whileTap={option.status === 'available' ? { scale: 0.98 } : {}}
                  onClick={() => option.status === 'available' && setSelectedTier(option)}
                >
                  {option.status === 'upcoming' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/10 rounded-full text-xs">
                      Coming Soon
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <motion.span 
                      className="text-4xl"
                      animate={option.status === 'available' ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {option.icon}
                    </motion.span>
                    <div>
                      <h3 className="font-bold">{option.name}</h3>
                      <p className="text-accent text-sm">{option.farmRate}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {option.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-sm text-white/60">
                        <span className="mr-2">✓</span>
                        {benefit}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between text-sm">
                    <span>{option.prices.stars} Stars</span>
                    <span>{option.prices.ton} TON</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Payment Selection */}
            {selectedTier && selectedTier.status === 'available' && (
              <div className="mb-6">
                <h3 className="text-sm text-white/60 mb-2">Select Payment Method</h3>
                <div className="flex space-x-4">
                  <motion.button
                    className={`flex-1 py-2 rounded-xl border-2 transition-colors ${
                      selectedPayment === 'stars'
                        ? 'border-accent bg-accent/20'
                        : 'border-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPayment('stars')}
                  >
                    ⭐ Stars
                  </motion.button>
                  <motion.button
                    className={`flex-1 py-2 rounded-xl border-2 transition-colors ${
                      selectedPayment === 'ton'
                        ? 'border-accent bg-accent/20'
                        : 'border-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPayment('ton')}
                  >
                    💎 TON
                  </motion.button>
                </div>
              </div>
            )}

            {/* Upgrade Button */}
            {selectedTier && selectedTier.status === 'available' && (
              <motion.button
                className="w-full py-3 rounded-xl font-bold bg-orange-500 hover:bg-orange-400"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
              >
                {`Upgrade for ${
                  selectedPayment === 'stars'
                    ? `${selectedTier.prices.stars} Stars`
                    : `${selectedTier.prices.ton} TON`
                }`}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal; 