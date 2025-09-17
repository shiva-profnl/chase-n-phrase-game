import { useEffect, useRef } from 'react';

export function useTouchInput(
  onMove: (direction: 'left' | 'right') => void,
  isActive: boolean
) {
  const touchStartRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0]!.clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartRef.current === null) return;
      
      const touchEndX = e.changedTouches[0]!.clientX;
      const diff = touchEndX - touchStartRef.current;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          onMove('right');
        } else {
          onMove('left');
        }
      }
      
      touchStartRef.current = null;
    };

    const area = gameAreaRef.current;
    if (area) {
      area.addEventListener("touchstart", handleTouchStart);
      area.addEventListener("touchend", handleTouchEnd);
      
      return () => {
        area.removeEventListener("touchstart", handleTouchStart);
        area.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isActive, onMove]);

  return gameAreaRef;
}
