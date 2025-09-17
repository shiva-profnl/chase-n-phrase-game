import React, { useState, useEffect } from 'react';

type LoadingScreenProps = {
  gameType: 'chaser' | 'phraser';
  onLoadingComplete: () => void;
  postId?: string;
  userId?: string;
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ gameType, onLoadingComplete, postId, userId }) => {
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Detect dark/light mode
  useEffect(() => {
    const checkDarkMode = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    };

    checkDarkMode();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // Pre-load all assets for the entire game flow
  useEffect(() => {
    // Prevent multiple loading attempts
    if (isLoading) return;
    setIsLoading(true);

    const loadAllAssets = async () => {
      // For phraser games, check if user has already played
      if (gameType === 'phraser' && postId && userId) {
        // Try to get the Reddit user ID from the URL context first
        let effectiveUserId = userId;
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const contextParam = urlParams.get('context');
          if (contextParam) {
            const context = JSON.parse(decodeURIComponent(contextParam));
            if (context.userId) {
              effectiveUserId = context.userId;
            }
          }
        } catch (e) {
          // Could not parse context, using provided userId
        }
        
        try {
          const statusRes = await fetch('/api/check-play-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, userId: effectiveUserId })
          });
          
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            
            if (!statusData.canPlay) {
              setCurrentAsset('Loading essential backgrounds...');
              
              // Load only essential backgrounds for already-played games
              const essentialAssets = [
                '/backgrounds/main-bg.png',
                '/backgrounds/sub-bg-blue.png', 
                '/backgrounds/sub-bg-orange.png',
                '/game-elements/trophy.png'
              ];
              
              let loadedCount = 0;
              for (const asset of essentialAssets) {
                try {
                  await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                      loadedCount++;
                      setProgress((loadedCount / essentialAssets.length) * 100);
                      setCurrentAsset(`Loaded ${asset.split('/').pop()}`);
                      resolve(img);
                    };
                    img.onerror = reject;
                    img.src = asset;
                  });
                } catch (error) {
                  console.warn(`Failed to load ${asset}:`, error);
                  loadedCount++;
                  setProgress((loadedCount / essentialAssets.length) * 100);
                }
              }
              
              setCurrentAsset('Game ready');
              setTimeout(onLoadingComplete, 100);
              return;
            }
          }
        } catch (error) {
          // Play status check failed, loading assets anyway
        }
      }      
      // Define common assets that both games need
      const commonAssets = [
        '/backgrounds/main-bg.png',
        '/backgrounds/sub-bg-orange.png',
        '/backgrounds/sub-bg-blue.png',
        '/backgrounds/sub-bg-pink.png',
        '/ui/game-logo.gif',
        '/game-elements/trophy.png',
        '/buttons/navigation/how-to-play.png',
        '/buttons/navigation/back.png',
        // Sound control buttons
        '/buttons/sound-controls/sound-on.png',
        '/buttons/sound-controls/sound-off.png',
        // Navigation buttons
        '/buttons/how-to-play-buttons/left-active.png',
        '/buttons/how-to-play-buttons/left-inactive.png',
        '/buttons/how-to-play-buttons/right-active.png',
        '/buttons/how-to-play-buttons/right-inactive.png',
      ];

      // Define game-specific assets
      let gameSpecificAssets: string[] = [];
      
      if (gameType === 'chaser') {
        gameSpecificAssets = [
          '/buttons/share-controls/share-enabled.png',
          '/buttons/share-controls/share-disabled.png',
          '/buttons/share-controls/share-only-once.png',
          '/buttons/leaderboard/chaser.png',
          '/buttons/leaderboard/phraser.png',
          '/buttons/leaderboard/sharer.png',
          '/game-elements/track.png',
          '/game-elements/life-gain.png',
          '/game-elements/life-lost.png',
          '/buttons/navigation/leaderboard.png',
          '/buttons/rps-buttons/rock.png',
          '/buttons/rps-buttons/paper.png',
          '/buttons/rps-buttons/scissors.png',
          '/buttons/game-controls/play-again.png',
          // Chaser-specific sounds
          '/sounds/chaser-swap-track.m4a',
          '/sounds/game-button-click.m4a',
          '/sounds/point.mp3',
          '/sounds/no-point.mp3',
          // Chaser instruction images
          '/chaser-game-instructions/chaser.gif',
          '/chaser-game-instructions/instructions-chaser.png',
          '/chaser-game-instructions/who-beats-who.png',
          '/chaser-game-instructions/ch-ins-1.jpg',
          '/chaser-game-instructions/ch-ins-2.jpg',
          '/chaser-game-instructions/ch-ins-3.jpg',
          '/chaser-game-instructions/ch-ins-4.jpg',
          '/chaser-game-instructions/ch-ins-5.jpg',
          '/chaser-game-instructions/ch-ins-6.jpg',
          '/chaser-game-instructions/ch-ins-7.jpg',
          '/chaser-game-instructions/ch-ins-8.jpg',
          '/chaser-game-instructions/ch-ins-9.jpg',
          '/chaser-game-instructions/ch-ins-10.jpg',
          '/chaser-game-instructions/ch-ins-11.jpg',
          '/chaser-game-instructions/ch-ins-12.jpg',
          '/chaser-game-instructions/ch-ins-13.jpg',
          '/chaser-game-instructions/ch-ins-14.jpg',
          '/chaser-game-instructions/ch-ins-15.jpg',
          '/chaser-game-instructions/ch-ins-16.jpg'
        ];
      } else {
        gameSpecificAssets = [
          '/buttons/phraser-controls/letterbox.png',
          '/buttons/phraser-controls/end-game.png',
          '/buttons/phraser-controls/submit-enabled.png',
          '/buttons/phraser-controls/submit-disabled.png',
          '/buttons/phraser-controls/clear-enabled.png',
          '/buttons/phraser-controls/clear-disabled.png',
          '/buttons/game-controls/show-letters.png',
          '/buttons/game-controls/start-game.png',
          // Phraser-specific sounds
          '/sounds/phraser-letter-type.m4a',
          '/sounds/game-button-click.m4a',
          '/sounds/point.mp3',
          '/sounds/no-point.mp3',
          // Phraser instruction images
          '/phraser-game-instructions/phraser.gif',
          '/phraser-game-instructions/instructions-phraser.png',
          '/phraser-game-instructions/ph-ins-1.jpg',
          '/phraser-game-instructions/ph-ins-2.jpg',
          '/phraser-game-instructions/ph-ins-3.jpg',
          '/phraser-game-instructions/ph-ins-4.jpg',
          '/phraser-game-instructions/ph-ins-5.jpg',
          '/phraser-game-instructions/ph-ins-6.jpg',
          '/phraser-game-instructions/ph-ins-7.jpg',
          '/phraser-game-instructions/ph-ins-8.jpg',
          '/phraser-game-instructions/ph-ins-9.jpg',
          '/phraser-game-instructions/ph-ins-10.jpg',
          '/phraser-game-instructions/ph-ins-11.jpg',
          '/phraser-game-instructions/ph-ins-12.jpg',
          '/phraser-game-instructions/ph-ins-13.jpg',
          '/phraser-game-instructions/ph-ins-14.jpg'
        ];
      }

      // Combine all assets
      const allAssets = [...commonAssets, ...gameSpecificAssets];
      const totalAssets = allAssets.length;
      
      // Load assets in parallel batches for much faster loading
      const batchSize = 5; // Load 5 assets at a time
      let loadedCount = 0;
      
      for (let i = 0; i < allAssets.length; i += batchSize) {
        const batch = allAssets.slice(i, i + batchSize);
                
        // Load batch in parallel
        await Promise.all(batch.map(async (asset) => {
          if (!asset) return;
          
          const assetName = asset.split('/').pop()?.replace('.png', '').replace('.gif', '').replace('.m4a', '').replace('.mp3', '') || 'asset';
          
          // Check if it's an audio file
          if (asset.endsWith('.m4a') || asset.endsWith('.mp3')) {
            const audio = new Audio();
            await new Promise<void>((resolve) => {
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => resolve(); // Continue even if asset fails to load
              audio.src = asset;
            });
          } else {
            // It's an image file
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if asset fails to load
              img.src = asset;
            });
          }
          
          loadedCount++;
          setCurrentAsset(`Loading ${assetName}...`);
          setProgress((loadedCount / totalAssets) * 100);
        }));
        
        // Small delay between batches to prevent overwhelming the browser
        if (i + batchSize < allAssets.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      setCurrentAsset('Ready to play!');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      onLoadingComplete();
    };

    loadAllAssets();
    
    // Cleanup function
    return () => {
      setIsLoading(false);
    };
  }, [gameType, onLoadingComplete]);

  return (
    <div className={`loading-screen fixed inset-0 flex flex-col items-center justify-center transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Game Logo */}
      <div className="mb-8">
        <img 
          src="/ui/game-logo.gif" 
          alt="Chase n' Phrase Game Logo" 
          className="game-logo"
        />
      </div>

      {/* Progress Bar */}
      <div className="w-80 max-w-md mb-4">
        <div className={`w-full h-2 rounded-full ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isDarkMode ? 'bg-white' : 'bg-black'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Loading Status */}
      <div className="text-center">
        <p className="text-lg font-semibold mb-2 text-white" style={{ color: 'white' }}>
          {currentAsset || 'Preparing game assets...'}
        </p>
        <p className="text-sm text-gray-300" style={{ color: '#d1d5db' }}>
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Game Type Indicator */}
      <div className="mt-8">
        <p className="text-sm text-gray-400" style={{ color: '#9ca3af' }}>
          Loading {gameType === 'chaser' ? 'Chaser' : 'Phraser'} Game...
        </p>
      </div>
    </div>
  );
};
