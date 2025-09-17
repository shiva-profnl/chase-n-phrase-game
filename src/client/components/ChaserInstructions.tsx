import React, { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../utils/audioManager';

type InstructionCard = {
  id: string;
  image: string;
  instructions: string[];
};

type ChaserInstructionsProps = {
  onBack: () => void;
};

export const ChaserInstructions: React.FC<ChaserInstructionsProps> = ({ onBack }) => {
  const [cards, setCards] = useState<InstructionCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load instruction cards
  useEffect(() => {
    const loadInstructions = async () => {
      try {
        const response = await fetch('/chaser-game-instructions/instructions.json');
        const data = await response.json();
        setCards(data.cards);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load instruction cards:', error);
        setLoading(false);
      }
    };

    loadInstructions();
  }, []);

  // Handle navigation
  const goToPrevious = useCallback(() => {
    if (currentCardIndex > 0) {
      audioManager.playButtonClick();
      setCurrentCardIndex(prev => prev - 1);
    }
  }, [currentCardIndex]);

  const goToNext = useCallback(() => {
    if (currentCardIndex < cards.length - 1) {
      audioManager.playButtonClick();
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [currentCardIndex, cards.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        audioManager.playLetterType(); // Phraser letter typing sound for keyboard
        if (currentCardIndex > 0) {
          setCurrentCardIndex(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        audioManager.playLetterType(); // Phraser letter typing sound for keyboard
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex(prev => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentCardIndex, cards.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="text-center">
          <p className="text-xl mb-4">Loading instructions...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="text-center">
          <p className="text-xl mb-4">Failed to load instructions</p>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onBack();
            }}
            className="btn-back"
          />
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
      {/* Top Navigation Bar */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-50">
        {/* Left Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevious}
            disabled={currentCardIndex === 0}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
          >
            <img
              src={currentCardIndex === 0 
                ? "/buttons/how-to-play-buttons/left-inactive.png" 
                : "/buttons/how-to-play-buttons/left-active.png"
              }
              alt="Previous"
              className="w-full h-full object-contain"
            />
          </button>
          
          {/* Card Counter */}
          <div className="sub-bg-pink px-2 py-1 rounded-lg">
            <span className="text-xs sm:text-sm text-white">
              {currentCardIndex + 1}/{cards.length}
            </span>
          </div>
          
          <button
            onClick={goToNext}
            disabled={currentCardIndex === cards.length - 1}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
          >
            <img
              src={currentCardIndex === cards.length - 1 
                ? "/buttons/how-to-play-buttons/right-inactive.png" 
                : "/buttons/how-to-play-buttons/right-active.png"
              }
              alt="Next"
              className="w-full h-full object-contain"
            />
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            audioManager.playButtonClick();
            onBack();
          }}
          className="btn-back w-8 h-8 sm:w-10 sm:h-10"
        />
      </div>

      {/* Card Container */}
      <div className="w-full max-w-4xl mx-auto mt-16 px-4">
        {/* Card Image */}
        <div className="mb-3 flex justify-center">
          <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl">
            <div className="sub-bg-orange p-2 sm:p-3 rounded-lg">
              <img
                src={currentCard.image}
                alt={`Instruction ${currentCardIndex + 1}`}
                className="w-full h-auto max-h-52 sm:max-h-60 md:max-h-72 object-contain rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Instructions Text */}
        <div className="mb-3 flex justify-center">
          <div className="sub-bg-blue p-2 sm:p-3 rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg">
            <div className="min-h-16 sm:min-h-20 flex items-center justify-center">
              <div className="space-y-1">
                {currentCard.instructions.map((instruction, index) => (
                  <p key={index} className="text-xs sm:text-sm leading-relaxed text-center text-black">
                    {instruction}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
