import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentProcessor from '../common/PaymentProcessor';

interface TaskSubmission {
  title: string;
  description: string;
  type: 'telegram' | 'twitter' | 'youtube' | 'website';
  clicks: number;
  reward: number;
  link: string;
}

const CLICK_PRICE = {
  TON: 0.01, // 10 TON per 1000 clicks
  STARS: 2, // 2000 stars per 1000 clicks
};

const TaskMarketplace = () => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [taskSubmission, setTaskSubmission] = useState<TaskSubmission>({
    title: '',
    description: '',
    type: 'telegram',
    clicks: 1000,
    reward: 0,
    link: '',
  });

  const calculatePrice = (clicks: number, currency: 'TON' | 'STARS') => {
    const basePrice = currency === 'TON' ? CLICK_PRICE.TON : CLICK_PRICE.STARS;
    return (clicks * basePrice).toFixed(2);
  };

  const handleSubmit = () => {
    if (validateSubmission()) {
      setShowPaymentModal(true);
    }
  };

  const validateSubmission = () => {
    return (
      taskSubmission.title.length > 0 &&
      taskSubmission.description.length > 0 &&
      taskSubmission.link.length > 0 &&
      taskSubmission.clicks >= 1000 &&
      taskSubmission.clicks <= 200000 &&
      taskSubmission.reward > 0
    );
  };

  const handlePaymentSuccess = () => {
    // Submit task to backend
    setShowPaymentModal(false);
    setShowSubmitModal(false);
    // Reset form
    setTaskSubmission({
      title: '',
      description: '',
      type: 'telegram',
      clicks: 1000,
      reward: 0,
      link: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Submit Task Button */}
      <motion.button
        className="w-full py-3 bg-accent rounded-xl font-bold flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowSubmitModal(true)}
      >
        <span>➕</span>
        <span>Submit New Task</span>
      </motion.button>

      {/* Task Submission Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary p-6 rounded-2xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Submit Task</h2>
                <motion.button
                  className="text-white/60"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSubmitModal(false)}
                >
                  ✕
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Task Type
                  </label>
                  <select
                    value={taskSubmission.type}
                    onChange={(e) => setTaskSubmission(prev => ({
                      ...prev,
                      type: e.target.value as TaskSubmission['type']
                    }))}
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  >
                    <option value="telegram">Telegram</option>
                    <option value="twitter">Twitter</option>
                    <option value="youtube">YouTube</option>
                    <option value="website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskSubmission.title}
                    onChange={(e) => setTaskSubmission(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Enter task title"
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Description
                  </label>
                  <textarea
                    value={taskSubmission.description}
                    onChange={(e) => setTaskSubmission(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter task description"
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Link
                  </label>
                  <input
                    type="url"
                    value={taskSubmission.link}
                    onChange={(e) => setTaskSubmission(prev => ({
                      ...prev,
                      link: e.target.value
                    }))}
                    placeholder="Enter task link"
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Required Clicks
                  </label>
                  <input
                    type="number"
                    value={taskSubmission.clicks}
                    onChange={(e) => setTaskSubmission(prev => ({
                      ...prev,
                      clicks: Math.max(1000, Math.min(200000, parseInt(e.target.value)))
                    }))}
                    min="1000"
                    max="200000"
                    step="1000"
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  />
                  <p className="text-sm text-white/60 mt-1">
                    Cost: {calculatePrice(taskSubmission.clicks, 'TON')} TON or {calculatePrice(taskSubmission.clicks, 'STARS')} Stars
                  </p>
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-2">
                    Reward per Click (MUSKY)
                  </label>
                  <input
                    type="number"
                    value={taskSubmission.reward}
                    onChange={(e) => setTaskSubmission(prev => ({
                      ...prev,
                      reward: parseFloat(e.target.value)
                    }))}
                    min="0"
                    step="0.1"
                    className="w-full bg-background/50 rounded-lg p-3 text-white outline-none"
                  />
                  <p className="text-sm text-white/60 mt-1">
                    Total Reward Pool: {(taskSubmission.reward * taskSubmission.clicks).toFixed(2)} MUSKY
                  </p>
                </div>

                <motion.button
                  className={`w-full py-3 rounded-xl font-bold ${
                    validateSubmission() ? 'bg-accent' : 'bg-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={validateSubmission() ? { scale: 1.02 } : {}}
                  whileTap={validateSubmission() ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!validateSubmission()}
                >
                  Submit Task
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
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
              <PaymentProcessor
                amount={parseFloat(calculatePrice(taskSubmission.clicks, 'TON'))}
                currency="TON"
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentModal(false)}
                itemType="hero"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskMarketplace; 