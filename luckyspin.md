// LuckySpin.tsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Styled components for the wheel and button
const WheelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #1a1a1a;
`;

const SpinWheel = styled.div<{ rotate: number }>`
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: conic-gradient(
    #ffd700 0% 0.01%, // 1 SOL (yellow for gold)
    #ffcc00 0.01% 0.11%, // 0.5 SOL
    #ffeb3b 0.11% 1.11%, // 0.1 SOL
    #ff4444 1.11% 51.11%, // 1000 musky (red)
    #ff6666 51.11% 76.11%, // 2000 musky
    #ff8888 76.11% 91.11%, // 5000 musky
    #ffaaaa 91.11% 96.11%, // 10000 musky
    #00ff00 96.11% 99.11%, // 0.01 SOL remaining (green)
    #00cc00 99.11% 100% // 1000 energy (greenish)
  );
  transition: transform 4s ease-out;
  transform: rotate(${props => props.rotate}deg);
`;

const SpinButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;

const PrizeText = styled.div`
  margin-top: 20px;
  font-size: 18px;
  color: white;
`;

// Prize data with probabilities (in percentages, summing to 100%)
const prizes = [
  { name: '1 SOL', probability: 0.01, value: 1 }, // 0.01%
  { name: '0.5 SOL', probability: 0.1, value: 0.5 }, // 0.1%
  { name: '0.1 SOL', probability: 1, value: 0.1 }, // 1%
  { name: '1000 musky', probability: 50, value: 1000 }, // 50%
  { name: '2000 musky', probability: 25, value: 2000 }, // 25%
  { name: '5000 musky', probability: 15, value: 5000 }, // 15%
  { name: '10000 musky', probability: 5, value: 10000 }, // 5%
  { name: '0.01 SOL remaining', probability: 3.89, value: 0.01 }, // 3.89%
  { name: '1000 energy', probability: 1, value: 1000 }, // 1% (new prize)
];

// Function to pick a prize based on probabilities
const pickPrize = () => {
  const random = Math.random() * 100; // 0 to 100
  let cumulative = 0;

  for (const prize of prizes) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      return prize;
    }
  }
  return prizes[prizes.length - 1]; // Fallback (shouldn't happen with correct probabilities)
};

// Spinning sound (add your audio file to /public/spin.mp3)
const SpinSound = () => {
  const audio = new Audio('/spin.mp3'); // Ensure you have a spin.mp3 file in /public
  return { play: () => audio.play() };
};

const LuckySpin: React.FC = () => {
  const [rotate, setRotate] = useState(0);
  const [prize, setPrize] = useState<string | null>(null);
  const spinSound = SpinSound();

  const handleSpin = () => {
    const randomRotation = Math.floor(Math.random() * 360) + 720; // At least 2 full rotations
    setRotate(prev => prev + randomRotation);
    spinSound.play(); // Play spinning sound

    // Simulate delay for spin animation
    setTimeout(() => {
      const wonPrize = pickPrize();
      setPrize(wonPrize.name);
    }, 4000); // Match the transition duration (4s)
  };

  return (
    <WheelContainer>
      <SpinWheel rotate={rotate}>
        {/* You can add an arrow or pointer image here for the wheel */}
        <div style={{ 
          position: 'absolute', 
          top: '-10px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '0', 
          height: '0', 
          borderLeft: '10px solid transparent', 
          borderRight: '10px solid transparent', 
          borderBottom: '20px solid red' 
        }} />
      </SpinWheel>
      <SpinButton onClick={handleSpin} disabled={rotate > 0}>
        SPIN
      </SpinButton>
      {prize && <PrizeText>You won: {prize}!</PrizeText>}
    </WheelContainer>
  );
};

export default LuckySpin;