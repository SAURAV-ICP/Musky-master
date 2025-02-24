import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Prize {
  id: number;
  amount: number;
  type: string;
  probability: string;
  icon: string;
}

const prizes: Prize[] = [
  { id: 1, amount: 1, type: 'SOL', probability: '0.1%', icon: '💎' },
  { id: 2, amount: 0.5, type: 'SOL', probability: '0.5%', icon: '🌟' },
  { id: 3, amount: 5000, type: 'MUSKY', probability: '1%', icon: '🚀' },
  { id: 4, amount: 2000, type: 'MUSKY', probability: '3%', icon: '🎁' },
  { id: 5, amount: 1000, type: 'MUSKY', probability: '5%', icon: '✨' },
];

const LuckySpin = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [canSpin, setCanSpin] = useState(true);

  useEffect(() => {
    // Check last spin time from localStorage
    const lastSpinTime = localStorage.getItem('lastSpinTime');
    if (lastSpinTime) {
      const timeDiff = Date.now() - parseInt(lastSpinTime);
      if (timeDiff < 24 * 60 * 60 * 1000) { // 24 hours
        setCanSpin(false);
        updateTimeLeft(parseInt(lastSpinTime));
      }
    }
  }, []);

  const updateTimeLeft = (lastTime: number) => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = 24 * 60 * 60 * 1000 - (now - lastTime);
      
      if (diff <= 0) {
        setCanSpin(true);
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleSpin = () => {
    if (!canSpin) return;
    
    setIsSpinning(true);
    
    // Store spin time
    localStorage.setItem('lastSpinTime', Date.now().toString());
    setCanSpin(false);
    updateTimeLeft(Date.now());

    // Simulate spin result after animation
    setTimeout(() => {
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
      setSelectedPrize(randomPrize);
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="relative">
      {/* Spin Wheel */}
      <motion.div 
        className="relative w-64 h-64 mx-auto mb-8"
        animate={isSpinning ? { 
          rotate: [0, 1800 + Math.random() * 360],
        } : {}}
        transition={isSpinning ? { 
          duration: 3,
          ease: "easeOut"
        } : {}}
      >
        <div className="absolute inset-0 rounded-full border-4 border-accent overflow-hidden">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              className="absolute w-full h-full origin-center"
              style={{
                transform: `rotate(${(index * 360) / prizes.length}deg)`,
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-32 flex flex-col items-center justify-start pt-4">
                <span className="text-2xl mb-1">{prize.icon}</span>
                <span className="text-xs text-white/80">
                  {prize.amount} {prize.type}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Center pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-accent transform rotate-45"></div>
      </motion.div>

      {/* Spin Button */}
      <motion.button
        className={`w-full py-3 rounded-xl text-white font-bold ${
          canSpin ? 'bg-accent' : 'bg-gray-500'
        }`}
        whileHover={canSpin ? { scale: 1.02 } : {}}
        whileTap={canSpin ? { scale: 0.98 } : {}}
        onClick={handleSpin}
        disabled={!canSpin}
      >
        {canSpin ? 'Spin Now!' : `Next spin in ${timeLeft}`}
      </motion.button>

      {/* Prize Animation */}
      <AnimatePresence>
        {selectedPrize && !isSpinning && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary p-8 rounded-2xl text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <span className="text-6xl mb-4 block">{selectedPrize.icon}</span>
              <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
              <p className="text-lg">
                You won {selectedPrize.amount} {selectedPrize.type}!
              </p>
              <motion.button
                className="mt-4 px-6 py-2 bg-accent rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPrize(null)}
              >
                Claim
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckySpin; 