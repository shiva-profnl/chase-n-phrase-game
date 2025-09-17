import React, { useState, useEffect } from 'react';

interface DebugInfoProps {
  gridColumns: number;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ gridColumns }) => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [actualSizes, setActualSizes] = useState({
    letterboxSize: '0px',
    textSize: '0px'
  });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });

      // Get actual computed sizes from CSS
      const tempElement = document.createElement('div');
      tempElement.className = 'btn-letterbox';
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.top = '-9999px';
      document.body.appendChild(tempElement);
      
      const letterboxComputedStyle = window.getComputedStyle(tempElement);
      const letterboxSize = letterboxComputedStyle.width;
      
      tempElement.className = 'text-responsive';
      const textComputedStyle = window.getComputedStyle(tempElement);
      const textSize = textComputedStyle.fontSize;
      
      document.body.removeChild(tempElement);
      
      setActualSizes({
        letterboxSize,
        textSize
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getResponsiveBreakpoint = () => {
    if (windowSize.width >= 1441) return 'Fullscreen (≥1441px)';
    if (windowSize.width >= 1025) return 'Desktop (1025-1440px)';
    if (windowSize.width >= 769) return 'Tablet (769-1024px)';
    return 'Mobile (≤768px)';
  };

  const getExpectedSizes = () => {
    if (windowSize.width >= 1441) return { letterbox: '4.5rem', text: '3.2rem' };
    if (windowSize.width >= 1025) return { letterbox: '4rem', text: '2.5rem' };
    if (windowSize.width >= 769) return { letterbox: '3.5rem', text: '2.1rem' };
    return { letterbox: '3rem', text: '1.8rem' };
  };

  const expected = getExpectedSizes();

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono max-w-sm z-50 border border-gray-600">
      <div className="mb-2 font-bold text-yellow-400">🔍 DEBUG INFO</div>
      
      <div className="mb-2">
        <div className="text-green-400">📱 Screen Size:</div>
        <div>• {windowSize.width} × {windowSize.height} px</div>
        <div>• {windowSize.width / 16} × {windowSize.height / 16} rem</div>
        <div>• {getResponsiveBreakpoint()}</div>
      </div>

      <div className="mb-2">
        <div className="text-blue-400">🎯 Grid Columns:</div>
        <div>• {gridColumns} letters per row</div>
        <div>• Expected: {windowSize.width >= 1441 ? 6 : windowSize.width >= 1025 ? 5 : 4}</div>
      </div>

      <div className="mb-2">
        <div className="text-purple-400">📦 Letterbox Size:</div>
        <div>• Actual: {actualSizes.letterboxSize}</div>
        <div>• Expected: {expected.letterbox} ({parseFloat(expected.letterbox) * 16}px)</div>
        <div>• % of width: {parseFloat(actualSizes.letterboxSize) / windowSize.width * 100}%</div>
      </div>

      <div className="mb-2">
        <div className="text-orange-400">📝 Text Size:</div>
        <div>• Actual: {actualSizes.textSize}</div>
        <div>• Expected: {expected.text} ({parseFloat(expected.text) * 16}px)</div>
        <div>• % of width: {parseFloat(actualSizes.textSize) / windowSize.width * 100}%</div>
      </div>

      <div className="mb-2">
        <div className="text-red-400">📐 Viewport Units:</div>
        <div>• 1vw = {windowSize.width / 100}px</div>
        <div>• 1vh = {windowSize.height / 100}px</div>
        <div>• 1rem = 16px</div>
      </div>

      <div className="mb-2">
        <div className="text-cyan-400">🎨 CSS Media Query:</div>
        <div>• Current breakpoint: {getResponsiveBreakpoint()}</div>
        <div>• Grid columns: {gridColumns}</div>
      </div>

      <div className="text-gray-400 text-xs">
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};
