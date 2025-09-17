import React, { useState, useEffect } from 'react';
import { audioManager } from '../utils/audioManager';

type PhraserInstructionsProps = {
  onBack: () => void;
};

interface InstructionCard {
  id: string;
  image: string;
  instructions: string[];
}

export const PhraserInstructions: React.FC<PhraserInstructionsProps> = ({ onBack }) => {
  const [cards, setCards] = useState<InstructionCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInstructions = async () => {
      try {
        const response = await fetch('/phraser-game-instructions/instructions.json');
        const data = await response.json();
        setCards(data.cards);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load phraser instructions:', error);
        setLoading(false);
      }
    };

    loadInstructions();
  }, []);

  const goToPrevious = () => {
    if (currentCardIndex > 0) {
      audioManager.playButtonClick();
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentCardIndex < cards.length - 1) {
      audioManager.playButtonClick();
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
        audioManager.playLetterType();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
        audioManager.playLetterType();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentCardIndex, cards.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="text-center">
          <p className="text-lg">Loading phraser instructions...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen main-bg text-white p-4">
        <div className="text-center">
          <p className="text-lg">Failed to load instructions</p>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onBack();
            }}
            className="btn-back mt-4"
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