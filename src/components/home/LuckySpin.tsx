import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

// Styled components for the wheel and button
const WheelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
`;

const SpinWheel = styled.div<{ rotate: number }>`
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: conic-gradient(
    #ffd700 0% 0.1%, // 1 SOL (0.1%)
    #ffcc00 0.1% 0.6%, // 0.5 SOL (0.5%)
    #ffeb3b 0.6% 1.6%, // 0.2 SOL (1%)
    #ff4444 1.6% 13.6%, // 10000 MUSKY (12%)
    #ff6666 13.6% 33.6%, // 5000 MUSKY (20%)
    #ff8888 33.6% 58.6%, // 2000 MUSKY (25%)
    #00ff00 58.6% 100% // 10000 ENERGY (41.4%)
  );
  transition: transform 4s ease-out;
  transform: rotate(${props => props.rotate}deg);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  border: 4px solid #2196F3;
`;

const SpinButton = styled.button<{ disabled: boolean }>`
  margin-top: 20px;
  padding: 12px 30px;
  font-size: 18px;
  font-weight: bold;
  background-color: ${props => props.disabled ? '#666' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.disabled ? '#666' : '#1976D2'};
    transform: ${props => props.disabled ? 'none' : 'scale(1.05)'};
  }
`;

const PrizeText = styled.div`
  margin-top: 20px;
  font-size: 18px;
  color: white;
  text-align: center;
`;

const EnergyText = styled.div`
  margin-top: 10px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

const ResetTimer = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #4CAF50;
  text-align: center;
`;

// Prize data with probabilities
const prizes = [
  { name: '1 SOL', type: 'solana', probability: 0.1, value: 1 },
  { name: '0.5 SOL', type: 'solana', probability: 0.5, value: 0.5 },
  { name: '0.2 SOL', type: 'solana', probability: 1, value: 0.2 },
  { name: '10000 MUSKY', type: 'musky', probability: 12, value: 10000 },
  { name: '5000 MUSKY', type: 'musky', probability: 20, value: 5000 },
  { name: '2000 MUSKY', type: 'musky', probability: 25, value: 2000 },
  { name: '10000 ENERGY', type: 'energy', probability: 41.4, value: 10000 },
];

interface LuckySpinProps {
  onSpin: () => Promise<{
    type: string;
    amount: number;
  }>;
  spinEnergy: number;
  nextReset?: string;
  disabled?: boolean;
}

const ENERGY_COST = 1000;

// Function to format time remaining
function formatTimeRemaining(nextReset: string): string {
  const reset = new Date(nextReset).getTime();
  const now = Date.now();
  const diff = reset - now;
  
  if (diff <= 0) return 'Energy will reset soon';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `Energy resets in ${hours}h ${minutes}m`;
}

const LuckySpin: React.FC<LuckySpinProps> = ({ onSpin, spinEnergy, nextReset, disabled }): JSX.Element => {
  const [rotate, setRotate] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (nextReset) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(nextReset));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [nextReset]);

  const handleSpin = async () => {
    if (isSpinning || disabled || spinEnergy < ENERGY_COST) {
      if (spinEnergy < ENERGY_COST) {
        toast.error(`Not enough spin energy! Need ${ENERGY_COST} energy to spin.`);
      }
      return;
    }

    setIsSpinning(true);
    setPrize(null);

    // Random rotation (at least 5 full spins)
    const randomRotation = Math.floor(Math.random() * 360) + 1800;
    setRotate(prev => prev + randomRotation);

    try {
      const result = await onSpin();
      
      // Wait for wheel animation
      setTimeout(() => {
        setPrize(`${result.amount} ${result.type.toUpperCase()}`);
        setIsSpinning(false);
      }, 4000);
    } catch (error) {
      console.error('Spin error:', error);
      setIsSpinning(false);
      // Error toast is handled by the page component
    }
  };

  return (
    <WheelContainer>
      <SpinWheel rotate={rotate}>
        {/* Pointer */}
        <div style={{ 
          position: 'absolute', 
          top: '-20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '0', 
          height: '0', 
          borderLeft: '15px solid transparent', 
          borderRight: '15px solid transparent', 
          borderBottom: '30px solid #2196F3',
          zIndex: 10
        }} />
      </SpinWheel>
      
      <EnergyText>
        Spin Energy Cost: {ENERGY_COST} | Your Spin Energy: {spinEnergy}
      </EnergyText>
      
      {nextReset && <ResetTimer>{timeRemaining}</ResetTimer>}
      
      <SpinButton 
        onClick={handleSpin} 
        disabled={isSpinning || disabled || spinEnergy < ENERGY_COST}
      >
        {isSpinning ? 'Spinning...' : 'SPIN'}
      </SpinButton>
      
      {prize && <PrizeText>You won: {prize}!</PrizeText>}
    </WheelContainer>
  );
};

export default LuckySpin; 