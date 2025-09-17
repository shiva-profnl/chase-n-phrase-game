import React from 'react';
import { ChaserInstructions } from './ChaserInstructions';
import { PhraserInstructions } from './PhraserInstructions';

type InstructionsProps = {
  onBack: () => void;
  gameType?: 'chaser' | 'phraser';
};

export const Instructions: React.FC<InstructionsProps> = ({ onBack, gameType = 'chaser' }) => {
  if (gameType === 'phraser') {
    return <PhraserInstructions onBack={onBack} />;
  }
  
  return <ChaserInstructions onBack={onBack} />;
};
