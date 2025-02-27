import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import PaymentProcessor from '@/components/common/PaymentProcessor';
import Image from 'next/image';

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  prices: {
    ton: number;
    stars: number;
  };
  duration: string;
  image: string;
}

const upgradeOptions: UpgradeOption[] = [
  {
    id: 'hero',
    name: 'Hero Musky',
    description: 'Become a Hero Musky and enjoy enhanced mining and energy benefits',
    benefits: [
      '2x Mining rate for 3 Days',
      '50% energy boost for 3 days',
      'Hero Musky badge',
      'Profile image changes to HERO.png'
    ],
    prices: {
      ton: 1,
      stars: 500
    },
    duration: '3 days',
    image: '/images/hero-musky.png'
  },
  {
    id: 'superhero',
    name: 'Superhero Musky',
    description: 'Upgrade to Superhero Musky for maximum benefits',
    benefits: [
      '4x Mining Rate for 3 Days',
      '100% energy boost for 3 days',
      'Superhero Musky badge',
      'Profile image changes to SUPERHERO.png'
    ],
    prices: {
      ton: 2,
      stars: 1000
    },
    duration: '3 days',
    image: '/images/superhero-musky.png'
  }
];

const minerOptions: UpgradeOption[] = [
  {
    id: 'RTX4070',
    name: 'RTX 4070 Miner',
    description: 'Start mining with the RTX 4070',
    benefits: [
      'Mines 0.03 Solana Per day',
      'Lasts for 30 Days',
      'Total collection: 0.9 Solana',
      'Buy 2 to unlock RTX 4090'
    ],
    prices: {
      ton: 5,
      stars: 2500
    },
    duration: '30 days',
    image: '/images/rtx4070.png'
  },
  {
    id: 'RTX4090',
    name: 'RTX 4090 Miner',
    description: 'Upgrade to the powerful RTX 4090',
    benefits: [
      'Mines 0.08 Solana Per day',
      'Lasts for 30 Days',
      'Total collection: 2.4 Solana',
      'Buy 2 to unlock RTX 5070'
    ],
    prices: {
      ton: 9,
      stars: 5000
    },
    duration: '30 days',
    image: '/images/rtx4090.png'
  },
  {
    id: 'RTX5070',
    name: 'RTX 5070 Miner',
    description: 'Advanced RTX 5070 mining hardware',
    benefits: [
      'Mines 0.25 Solana Per day',
      'Lasts for 30 Days',
      'Total collection: 7.5 Solana',
      'Buy 2 to unlock RTX 5090'
    ],
    prices: {
      ton: 25,
      stars: 12500
    },
    duration: '30 days',
    image: '/images/rtx5070.png'
  },
  {
    id: 'RTX5090',
    name: 'RTX 5090 Miner',
    description: 'Ultimate RTX 5090 mining hardware',
    benefits: [
      'Mines 0.5 Solana Per day',
      'Lasts for 30 Days',
      'Total collection: 15 Solana',
      'Maximum 2 purchases allowed'
    ],
    prices: {
      ton: 50,
      stars: 25000
    },
    duration: '30 days',
    image: '/images/rtx5090.png'
  }
];

const staminaOptions = [
  {
    id: 'stamina',
    amount: 1000,
    price: 100
  },
  {
    id: 'stamina',
    amount: 5000,
    price: 500
  },
  {
    id: 'stamina',
    amount: 10000,
    price: 1000
  }
];

export const PaymentOptions = () => {
  const { user, mutate } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<'upgrade' | 'miner' | 'stamina'>('upgrade');
  const [selectedOption, setSelectedOption] = useState<UpgradeOption | null>(null);
  const [selectedStamina, setSelectedStamina] = useState<{id: string, amount: number, price: number} | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<'TON' | 'Stars'>('TON');

  const handleSelectOption = (option: UpgradeOption) => {
    setSelectedOption(option);
    setShowPayment(true);
  };

  const handleSelectStamina = (option: {id: string, amount: number, price: number}) => {
    setSelectedStamina(option);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    await mutate();
    setShowPayment(false);
    setSelectedOption(null);
    setSelectedStamina(null);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <motion.button
          onClick={() => setSelectedCategory('upgrade')}
          className={`flex-1 py-3 rounded-xl font-bold ${
            selectedCategory === 'upgrade'
              ? 'bg-accent text-white'
              : 'bg-primary/20 text-white/60'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Upgrade Status
        </motion.button>
        <motion.button
          onClick={() => setSelectedCategory('miner')}
          className={`flex-1 py-3 rounded-xl font-bold ${
            selectedCategory === 'miner'
              ? 'bg-accent text-white'
              : 'bg-primary/20 text-white/60'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Buy Miners
        </motion.button>
        <motion.button
          onClick={() => setSelectedCategory('stamina')}
          className={`flex-1 py-3 rounded-xl font-bold ${
            selectedCategory === 'stamina'
              ? 'bg-accent text-white'
              : 'bg-primary/20 text-white/60'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Buy Stamina
        </motion.button>
      </div>

      {/* Upgrade Options */}
      {selectedCategory === 'upgrade' && !showPayment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upgradeOptions.map((option) => (
            <motion.div
              key={option.id}
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-accent/50 transition-all"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mr-4">
                  {option.image ? (
                    <Image src={option.image} alt={option.name} width={48} height={48} />
                  ) : (
                    <span className="text-2xl">👑</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{option.name}</h3>
                  <p className="text-white/60 text-sm">{option.duration}</p>
                </div>
              </div>
              
              <p className="text-white/80 mb-4">{option.description}</p>
              
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Benefits:</h4>
                <ul className="space-y-1">
                  {option.benefits.map((benefit, index) => (
                    <li key={index} className="text-white/70 text-sm flex items-center">
                      <span className="text-accent mr-2">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-white">
                  <span className="text-white/60 text-sm">Price: </span>
                  <span className="font-bold">{option.prices.ton} TON</span>
                  <span className="text-white/60 text-sm"> or </span>
                  <span className="font-bold">{option.prices.stars} Stars</span>
                </div>
                <motion.button
                  onClick={() => handleSelectOption(option)}
                  className="px-4 py-2 bg-accent rounded-lg font-semibold text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Purchase
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Miner Options */}
      {selectedCategory === 'miner' && !showPayment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {minerOptions.map((option) => (
            <motion.div
              key={option.id}
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-accent/50 transition-all"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mr-4">
                  {option.image ? (
                    <Image src={option.image} alt={option.name} width={48} height={48} />
                  ) : (
                    <span className="text-2xl">⛏️</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{option.name}</h3>
                  <p className="text-white/60 text-sm">{option.duration}</p>
                </div>
              </div>
              
              <p className="text-white/80 mb-4">{option.description}</p>
              
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Benefits:</h4>
                <ul className="space-y-1">
                  {option.benefits.map((benefit, index) => (
                    <li key={index} className="text-white/70 text-sm flex items-center">
                      <span className="text-accent mr-2">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-white">
                  <span className="text-white/60 text-sm">Price: </span>
                  <span className="font-bold">{option.prices.ton} TON</span>
                  <span className="text-white/60 text-sm"> or </span>
                  <span className="font-bold">{option.prices.stars} Stars</span>
                </div>
                <motion.button
                  onClick={() => handleSelectOption(option)}
                  className="px-4 py-2 bg-accent rounded-lg font-semibold text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Purchase
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stamina Options */}
      {selectedCategory === 'stamina' && !showPayment && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {staminaOptions.map((option, index) => (
            <motion.div
              key={index}
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-accent/50 transition-all"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-bold text-white">{option.amount} Stamina</h3>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-white/80">Boost your lucky spin energy</p>
                <p className="text-white/60 text-sm">Resets every 12 hours</p>
              </div>
              
              <div className="flex justify-center mt-4">
                <motion.button
                  onClick={() => handleSelectStamina(option)}
                  className="px-4 py-2 bg-accent rounded-lg font-semibold text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Buy for {option.price} Stars
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Processor */}
      {showPayment && selectedOption && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-primary p-6 rounded-2xl w-full max-w-md"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
              <button
                onClick={handlePaymentCancel}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedOption.name}</h3>
              <p className="text-white/70">{selectedOption.description}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Item:</span>
                <span className="text-white font-semibold">{selectedOption.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Duration:</span>
                <span className="text-white font-semibold">{selectedOption.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Price:</span>
                <span className="text-white font-semibold">
                  {paymentCurrency === 'TON' 
                    ? `${selectedOption.prices.ton} TON` 
                    : `${selectedOption.prices.stars} Stars`}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-2 mb-4">
                <motion.button
                  onClick={() => setPaymentCurrency('TON')}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    paymentCurrency === 'TON'
                      ? 'bg-accent text-white'
                      : 'bg-white/10 text-white/60'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Pay with TON
                </motion.button>
                <motion.button
                  onClick={() => setPaymentCurrency('Stars')}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    paymentCurrency === 'Stars'
                      ? 'bg-accent text-white'
                      : 'bg-white/10 text-white/60'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Pay with Stars
                </motion.button>
              </div>
              
              <PaymentProcessor
                amount={paymentCurrency === 'TON' ? selectedOption.prices.ton : selectedOption.prices.stars}
                currency={paymentCurrency}
                itemType={selectedOption.id as any}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Stamina Payment Processor */}
      {showPayment && selectedStamina && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-primary p-6 rounded-2xl w-full max-w-md"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
              <button
                onClick={handlePaymentCancel}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedStamina.amount} Stamina</h3>
              <p className="text-white/70">Boost your lucky spin energy</p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-white/70">Amount:</span>
                <span className="text-white font-semibold">{selectedStamina.amount} Stamina</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Price:</span>
                <span className="text-white font-semibold">{selectedStamina.price} Stars</span>
              </div>
            </div>
            
            <div className="mb-4">
              <PaymentProcessor
                amount={selectedStamina.price}
                currency="Stars"
                itemType="stamina"
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}; 