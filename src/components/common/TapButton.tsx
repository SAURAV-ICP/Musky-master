import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface TapButtonProps {
  onClick: () => void;
  isAnimating: boolean;
  isLoading: boolean;
  currentEnergy: number;
  maxEnergy: number;
  timeUntilReset: string | null;
}

const TapButton: React.FC<TapButtonProps> = ({ 
  onClick, 
  isAnimating, 
  isLoading, 
  currentEnergy, 
  maxEnergy,
  timeUntilReset
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  const handleTap = () => {
    if (isLoading || currentEnergy <= 0) return;
    
    createParticles();
    onClick();
  };

  const createParticles = () => {
    const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB6C1', '#90EE90', '#87CEEB'];
    const newParticles = Array.from({ length: 20 }, () => ({
      id: Math.random(),
      x: (Math.random() - 0.5) * 400,
      y: -300 - Math.random() * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 1000);
  };

  const disabled = isLoading || currentEnergy <= 0;

  return (
    <motion.div
      className="relative mb-12 touch-none select-none"
      whileTap={{ scale: 0.95 }}
      onClick={handleTap}
      style={{ 
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {/* Pulsing background effect */}
      <motion.div
        className="absolute -inset-4 rounded-full bg-accent/30 blur-xl z-0"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="w-72 h-72 rounded-full bg-accent/20 backdrop-blur-lg flex items-center justify-center cursor-pointer relative overflow-hidden shimmer-effect touch-none z-10"
        animate={isAnimating ? { 
          scale: [1, 0.95, 1],
          rotate: [0, -5, 5, 0],
        } : {}}
        transition={{ duration: 0.15 }}
        style={{ 
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          opacity: disabled ? 0.7 : 1
        }}
      >
        {/* Rotating glow effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent/30 to-transparent"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        <Image
          src="/assets/TILTED_MUSKY.png"
          alt="MUSKY Coin"
          width={240}
          height={240}
          className="object-contain transform hover:scale-105 transition-transform duration-300 pointer-events-none relative z-20"
          draggable="false"
        />
      </motion.div>
      
      {/* Particles */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: particle.color,
              }}
              initial={{ scale: 0 }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TapButton; 