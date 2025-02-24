import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WithdrawManagerProps {
  currentAddress?: string;
  withdrawableBalance: number;
  minWithdraw: number;
}

const WithdrawManager: React.FC<WithdrawManagerProps> = ({
  currentAddress,
  withdrawableBalance,
  minWithdraw
}) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState(currentAddress || '');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState(Boolean(currentAddress));

  const validateSolanaAddress = (address: string) => {
    // Basic Solana address validation (44 characters, base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{44}$/;
    return base58Regex.test(address);
  };

  const handleAddressChange = (address: string) => {
    setSolanaAddress(address);
    setIsValidAddress(validateSolanaAddress(address));
  };

  const handleUpdateAddress = () => {
    if (!isValidAddress) return;
    // Implement address update logic here
    setShowAddressModal(false);
  };

  const handleWithdraw = () => {
    if (!isValidAddress || Number(withdrawAmount) < minWithdraw) return;
    // Implement withdrawal logic here
    setShowWithdrawModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Solana Address Section */}
      <div className="bg-primary/20 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Solana Address</h3>
          <motion.button
            className="text-sm text-accent"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddressModal(true)}
          >
            {currentAddress ? 'Update' : 'Add'}
          </motion.button>
        </div>
        <p className="text-sm text-white/60 break-all">
          {currentAddress || 'No address set'}
        </p>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-primary/20 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold">Available Balance</h3>
            <p className="text-accent">{withdrawableBalance} SOL</p>
          </div>
          <motion.button
            className={`px-4 py-2 rounded-xl font-bold ${
              withdrawableBalance >= minWithdraw && isValidAddress
                ? 'bg-accent'
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            whileHover={withdrawableBalance >= minWithdraw ? { scale: 1.05 } : {}}
            whileTap={withdrawableBalance >= minWithdraw ? { scale: 0.95 } : {}}
            onClick={() => setShowWithdrawModal(true)}
            disabled={withdrawableBalance < minWithdraw || !isValidAddress}
          >
            Withdraw
          </motion.button>
        </div>
        <p className="text-sm text-white/60">
          Minimum withdrawal: {minWithdraw} SOL
        </p>
      </div>

      {/* Address Update Modal */}
      <AnimatePresence>
        {showAddressModal && (
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
              <h3 className="text-xl font-bold mb-4">Update Solana Address</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={solanaAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter Solana address"
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  />
                  {solanaAddress && !isValidAddress && (
                    <p className="text-red-400 text-sm mt-1">
                      Invalid Solana address
                    </p>
                  )}
                </div>
                <div className="flex space-x-4">
                  <motion.button
                    className="flex-1 py-3 bg-gray-500 rounded-xl font-bold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddressModal(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className={`flex-1 py-3 rounded-xl font-bold ${
                      isValidAddress ? 'bg-accent' : 'bg-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={isValidAddress ? { scale: 1.02 } : {}}
                    whileTap={isValidAddress ? { scale: 0.98 } : {}}
                    onClick={handleUpdateAddress}
                    disabled={!isValidAddress}
                  >
                    Update
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
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
              <h3 className="text-xl font-bold mb-4">Withdraw SOL</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={minWithdraw}
                    max={withdrawableBalance}
                    step="0.01"
                    placeholder={`Min ${minWithdraw} SOL`}
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  />
                </div>
                <div className="bg-background/50 p-4 rounded-lg">
                  <p className="text-sm text-white/60">Withdrawal Address</p>
                  <p className="font-mono text-sm break-all">{solanaAddress}</p>
                </div>
                <div className="flex space-x-4">
                  <motion.button
                    className="flex-1 py-3 bg-gray-500 rounded-xl font-bold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowWithdrawModal(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className={`flex-1 py-3 rounded-xl font-bold ${
                      Number(withdrawAmount) >= minWithdraw
                        ? 'bg-accent'
                        : 'bg-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={Number(withdrawAmount) >= minWithdraw ? { scale: 1.02 } : {}}
                    whileTap={Number(withdrawAmount) >= minWithdraw ? { scale: 0.98 } : {}}
                    onClick={handleWithdraw}
                    disabled={Number(withdrawAmount) < minWithdraw}
                  >
                    Withdraw
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WithdrawManager; 