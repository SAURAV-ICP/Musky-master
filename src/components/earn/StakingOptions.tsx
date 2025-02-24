import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StakingOption {
  id: number;
  duration: number; // in days
  apr: number;
  minAmount: number;
  icon: string;
}

const stakingOptions: StakingOption[] = [
  {
    id: 1,
    duration: 7,
    apr: 0.5, // 0.5% daily
    minAmount: 1000,
    icon: '📈'
  },
  {
    id: 2,
    duration: 30,
    apr: 1, // 1% daily
    minAmount: 5000,
    icon: '🚀'
  },
  {
    id: 3,
    duration: 90,
    apr: 2.5, // 2.5% daily
    minAmount: 10000,
    icon: '💎'
  }
];

const StakingOptions = () => {
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  const calculateRewards = (amount: number, apr: number, days: number) => {
    return (amount * (apr / 100) * days).toFixed(2);
  };

  const handleStake = () => {
    if (!selectedOption || !stakeAmount) return;
    setShowConfirm(true);
  };

  return (
    <div className="space-y-6">
      {/* Staking Options */}
      <div className="grid gap-4">
        {stakingOptions.map((option) => (
          <motion.div
            key={option.id}
            className={`p-4 rounded-xl border-2 transition-colors ${
              selectedOption?.id === option.id
                ? 'border-accent bg-accent/20'
                : 'border-white/10 hover:border-white/30'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOption(option)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center text-2xl">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-bold">{option.duration} Days</h3>
                  <p className="text-accent text-sm">{option.apr}% Daily APR</p>
                </div>
              </div>
              <div className="text-right text-sm text-white/60">
                Min. {option.minAmount} MUSKY
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staking Amount Input */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-primary/20 rounded-xl p-4 border border-white/10">
            <label className="text-sm text-white/60 block mb-2">
              Amount to Stake (MUSKY)
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              min={selectedOption.minAmount}
              placeholder={`Min ${selectedOption.minAmount} MUSKY`}
              className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
            />
          </div>

          {stakeAmount && Number(stakeAmount) >= selectedOption.minAmount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-primary/20 rounded-xl p-4 border border-white/10"
            >
              <h4 className="font-bold mb-2">Estimated Rewards</h4>
              <p className="text-accent text-lg">
                +{calculateRewards(Number(stakeAmount), selectedOption.apr, selectedOption.duration)} MUSKY
              </p>
              <p className="text-sm text-white/60">
                After {selectedOption.duration} days
              </p>
            </motion.div>
          )}

          <motion.button
            className={`w-full py-3 rounded-xl font-bold ${
              Number(stakeAmount) >= selectedOption.minAmount
                ? 'bg-accent'
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            whileHover={Number(stakeAmount) >= selectedOption.minAmount ? { scale: 1.02 } : {}}
            whileTap={Number(stakeAmount) >= selectedOption.minAmount ? { scale: 0.98 } : {}}
            onClick={handleStake}
            disabled={Number(stakeAmount) < selectedOption.minAmount}
          >
            Stake Now
          </motion.button>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary p-6 rounded-2xl w-full max-w-md m-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-xl font-bold mb-4">Confirm Staking</h3>
              <div className="space-y-4">
                <div className="bg-background/50 p-4 rounded-lg">
                  <p className="text-sm text-white/60">Amount to Stake</p>
                  <p className="font-bold">{stakeAmount} MUSKY</p>
                </div>
                <div className="bg-background/50 p-4 rounded-lg">
                  <p className="text-sm text-white/60">Duration</p>
                  <p className="font-bold">{selectedOption?.duration} Days</p>
                </div>
                <div className="bg-background/50 p-4 rounded-lg">
                  <p className="text-sm text-white/60">Expected Returns</p>
                  <p className="font-bold text-accent">
                    +{calculateRewards(Number(stakeAmount), selectedOption!.apr, selectedOption!.duration)} MUSKY
                  </p>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <motion.button
                  className="flex-1 py-3 bg-gray-500 rounded-xl font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="flex-1 py-3 bg-accent rounded-xl font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Implement staking logic here
                    setShowConfirm(false);
                  }}
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StakingOptions; 