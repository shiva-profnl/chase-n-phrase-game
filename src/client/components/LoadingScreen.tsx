import React, { useState, useEffect, useCallback } from 'react';
import { OptimizedImageLoader } from '../utils/imageLoader';

type LoadingScreenProps = {
  gameType: 'chaser' | 'phraser';
  onLoadingComplete: () => void;
  postId?: string;
  userId?: string;
};

type AssetType = 'image' | 'audio' | 'gif';

interface AssetInfo {
  path: string;
  type: AssetType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  size?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ gameType, onLoadingComplete, postId, userId }) => {
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Asset loading cache to prevent re-loading
  const assetCache = useCallback(() => {
    const cache = new Map<string, boolean>();
    return {
      isLoaded: (path: string) => cache.get(path) || false,
      markLoaded: (path: string) => cache.set(path, true),
      clear: () => cache.clear()
    };
  }, []);

  // Optimized asset loader with retry logic and timeout
  const loadAsset = useCallback(async (asset: AssetInfo, timeoutMs: number = 10000): Promise<boolean> => {
    try {
      if (asset.type === 'audio') {
        return new Promise((resolve) => {
          const timer = setTimeout(() => {
            console.warn(`Audio loading timeout: ${asset.path}`);
            resolve(false);
          }, timeoutMs);

          const audio = new Audio();
          audio.oncanplaythrough = () => {
            clearTimeout(timer);
            resolve(true);
          };
          audio.onerror = () => {
            clearTimeout(timer);
            console.warn(`Failed to load audio: ${asset.path}`);
            resolve(false);
          };
          audio.src = asset.path;
        });
      } else {
        // Use optimized image loader for images and GIFs
        const imageLoader = OptimizedImageLoader.getInstance();
        const result = await imageLoader.loadImage(asset.path, {
          timeout: timeoutMs,
          retries: 2,
          useWebP: false
        });
        return result.success;
      }
    } catch (error) {
      console.warn(`Error loading asset ${asset.path}:`, error);
      return false;
    }
  }, []);

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

  // Detect iOS for special handling
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  // Optimized asset loading with priority system and caching
  useEffect(() => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingError(null);

    const loadAllAssets = async () => {
      try {
        // Check if user has already played (for phraser games)
        if (gameType === 'phraser' && postId && userId) {
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
                setCurrentAsset('Loading essential assets...');
                
                // Load only critical assets for already-played games
                const criticalAssets: AssetInfo[] = [
                  { path: '/backgrounds/main-bg.png', type: 'image', priority: 'critical' },
                  { path: '/backgrounds/sub-bg-blue.png', type: 'image', priority: 'critical' },
                  { path: '/backgrounds/sub-bg-orange.png', type: 'image', priority: 'critical' },
                  { path: '/game-elements/trophy.png', type: 'image', priority: 'critical' },
                  { path: '/ui/game-logo.gif', type: 'gif', priority: 'critical' }
                ];
                
                await loadAssetsByPriority(criticalAssets);
                setCurrentAsset('Game ready');
                setTimeout(onLoadingComplete, 100);
                return;
              }
            }
          } catch (error) {
            console.warn('Play status check failed, loading all assets:', error);
          }
        }

        // Define all assets with priority levels
        const allAssets = getAssetsByGameType(gameType);
        
        // Load assets by priority for optimal user experience
        await loadAssetsByPriority(allAssets);
        
        setCurrentAsset('Ready to play!');
        setProgress(100);
        setTimeout(onLoadingComplete, 300);
        
      } catch (error) {
        console.error('Asset loading failed:', error);
        setLoadingError('Failed to load some assets. Game may not work properly.');
        // Still complete loading to prevent infinite loading screen
        setTimeout(onLoadingComplete, 1000);
      }
    };

    const getAssetsByGameType = (gameType: 'chaser' | 'phraser'): AssetInfo[] => {
      const commonAssets: AssetInfo[] = [
        // Critical assets (load first)
        { path: '/backgrounds/main-bg.png', type: 'image', priority: 'critical' },
        { path: '/ui/game-logo.gif', type: 'gif', priority: 'critical' },
        { path: '/game-elements/trophy.png', type: 'image', priority: 'critical' },
        
        // High priority assets
        { path: '/backgrounds/sub-bg-orange.png', type: 'image', priority: 'high' },
        { path: '/backgrounds/sub-bg-blue.png', type: 'image', priority: 'high' },
        { path: '/backgrounds/sub-bg-pink.png', type: 'image', priority: 'high' },
        { path: '/buttons/navigation/how-to-play.png', type: 'image', priority: 'high' },
        { path: '/buttons/navigation/back.png', type: 'image', priority: 'high' },
        { path: '/buttons/sound-controls/sound-on.png', type: 'image', priority: 'high' },
        { path: '/buttons/sound-controls/sound-off.png', type: 'image', priority: 'high' },
        
        // Medium priority assets
        { path: '/buttons/how-to-play-buttons/left-active.png', type: 'image', priority: 'medium' },
        { path: '/buttons/how-to-play-buttons/left-inactive.png', type: 'image', priority: 'medium' },
        { path: '/buttons/how-to-play-buttons/right-active.png', type: 'image', priority: 'medium' },
        { path: '/buttons/how-to-play-buttons/right-inactive.png', type: 'image', priority: 'medium' },
        
        // Low priority assets (instruction images) - only load for current game type
        ...(gameType === 'chaser' ? Array.from({ length: 16 }, (_, i) => ({
          path: `/chaser-game-instructions/ch-ins-${i + 1}.jpg`,
          type: 'image' as AssetType,
          priority: 'low' as const
        })) : []),
        ...(gameType === 'phraser' ? Array.from({ length: 14 }, (_, i) => ({
          path: `/phraser-game-instructions/ph-ins-${i + 1}.jpg`,
          type: 'image' as AssetType,
          priority: 'low' as const
        })) : [])
      ];

      if (gameType === 'chaser') {
        return [
          ...commonAssets,
          // Chaser-specific high priority
          { path: '/buttons/share-controls/share-enabled.png', type: 'image', priority: 'high' },
          { path: '/buttons/share-controls/share-disabled.png', type: 'image', priority: 'high' },
          { path: '/buttons/share-controls/share-only-once.png', type: 'image', priority: 'high' },
          { path: '/buttons/leaderboard/chaser.png', type: 'image', priority: 'high' },
          { path: '/buttons/leaderboard/phraser.png', type: 'image', priority: 'high' },
          { path: '/buttons/leaderboard/sharer.png', type: 'image', priority: 'high' },
          { path: '/game-elements/track.png', type: 'image', priority: 'high' },
          { path: '/buttons/navigation/leaderboard.png', type: 'image', priority: 'high' },
          { path: '/buttons/rps-buttons/rock.png', type: 'image', priority: 'high' },
          { path: '/buttons/rps-buttons/paper.png', type: 'image', priority: 'high' },
          { path: '/buttons/rps-buttons/scissors.png', type: 'image', priority: 'high' },
          { path: '/buttons/game-controls/play-again.png', type: 'image', priority: 'high' },
          
          // Chaser-specific medium priority
          { path: '/game-elements/life-gain.png', type: 'image', priority: 'medium' },
          { path: '/game-elements/life-lost.png', type: 'image', priority: 'medium' },
          { path: '/chaser-game-instructions/chaser.gif', type: 'gif', priority: 'medium' },
          { path: '/chaser-game-instructions/instructions-chaser.png', type: 'image', priority: 'medium' },
          { path: '/chaser-game-instructions/who-beats-who.png', type: 'image', priority: 'medium' },
          
          // Chaser-specific audio (low priority)
          { path: '/sounds/chaser-swap-track.m4a', type: 'audio', priority: 'low' },
          { path: '/sounds/game-button-click.m4a', type: 'audio', priority: 'low' },
          { path: '/sounds/point.mp3', type: 'audio', priority: 'low' },
          { path: '/sounds/no-point.mp3', type: 'audio', priority: 'low' }
        ];
      } else {
        return [
          ...commonAssets,
          // Phraser-specific high priority
          { path: '/buttons/phraser-controls/letterbox.png', type: 'image', priority: 'high' },
          { path: '/buttons/phraser-controls/end-game.png', type: 'image', priority: 'high' },
          { path: '/buttons/phraser-controls/submit-enabled.png', type: 'image', priority: 'high' },
          { path: '/buttons/phraser-controls/submit-disabled.png', type: 'image', priority: 'high' },
          { path: '/buttons/phraser-controls/clear-enabled.png', type: 'image', priority: 'high' },
          { path: '/buttons/phraser-controls/clear-disabled.png', type: 'image', priority: 'high' },
          { path: '/buttons/game-controls/show-letters.png', type: 'image', priority: 'high' },
          { path: '/buttons/game-controls/start-game.png', type: 'image', priority: 'high' },
          
          // Phraser-specific medium priority
          { path: '/phraser-game-instructions/phraser.gif', type: 'gif', priority: 'medium' },
          { path: '/phraser-game-instructions/instructions-phraser.png', type: 'image', priority: 'medium' },
          
          // Phraser-specific audio (low priority)
          { path: '/sounds/phraser-letter-type.m4a', type: 'audio', priority: 'low' },
          { path: '/sounds/game-button-click.m4a', type: 'audio', priority: 'low' },
          { path: '/sounds/point.mp3', type: 'audio', priority: 'low' },
          { path: '/sounds/no-point.mp3', type: 'audio', priority: 'low' }
        ];
      }
    };

    const loadAssetsByPriority = async (assets: AssetInfo[]) => {
      const cache = assetCache();
      const priorityOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
      
      let totalLoaded = 0;
      const totalAssets = assets.length;
      
      // iOS-specific optimizations
      const isIOSDevice = isIOS();
      const iosTimeout = 5000; // Shorter timeout for iOS
      const normalTimeout = 8000;
      
      for (const priority of priorityOrder) {
        const priorityAssets = assets.filter(asset => asset.priority === priority);
        if (priorityAssets.length === 0) continue;
        
        setCurrentAsset(`Loading ${priority} priority assets...`);
        
        // Load assets in parallel batches for this priority level
        // Smaller batches on iOS to prevent memory issues
        const batchSize = isIOSDevice 
          ? (priority === 'critical' ? 2 : priority === 'high' ? 3 : 4)
          : (priority === 'critical' ? 3 : priority === 'high' ? 5 : 8);
        
        for (let i = 0; i < priorityAssets.length; i += batchSize) {
          const batch = priorityAssets.slice(i, i + batchSize);
          
          // Load batch in parallel with timeout
          const loadPromises = batch.map(async (asset) => {
            if (cache.isLoaded(asset.path)) {
              totalLoaded++;
              return true;
            }
            
            const timeout = isIOSDevice ? iosTimeout : normalTimeout;
            const success = await loadAsset(asset, timeout);
            if (success) {
              cache.markLoaded(asset.path);
            }
            totalLoaded++;
            
            const assetName = asset.path.split('/').pop()?.replace(/\.(png|gif|m4a|mp3)$/, '') || 'asset';
            setCurrentAsset(`Loading ${assetName}...`);
            setProgress((totalLoaded / totalAssets) * 100);
            
            return success;
          });
          
          await Promise.all(loadPromises);
          
          // Longer delay on iOS to prevent memory pressure
          if (i + batchSize < priorityAssets.length) {
            const delay = isIOSDevice ? 100 : 30;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    };

    loadAllAssets();
    
    return () => {
      setIsLoading(false);
    };
  }, [gameType, onLoadingComplete, postId, userId, loadAsset, assetCache]);

  return (
    <div className={`loading-screen fixed inset-0 flex flex-col items-center justify-center transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Game Logo - Centered */}
      <div className="mb-8 flex justify-center items-center w-full">
        <img 
          src="/ui/game-logo.gif" 
          alt="Chase n' Phrase Game Logo" 
          className="game-logo max-w-full h-auto"
          style={{ 
            maxWidth: '280px',
            width: '100%',
            height: 'auto'
          }}
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
        {loadingError && (
          <p className="text-sm text-yellow-400 mt-2" style={{ color: '#fbbf24' }}>
            ⚠️ {loadingError}
          </p>
        )}
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
