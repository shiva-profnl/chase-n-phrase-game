
import React, { useEffect, useState } from "react";
import ChaserGame from "./pages/ChaserGame";
import { PhraserGameWrapper } from "./components/PhraserGameWrapper";
import { LoadingScreen } from "./components/LoadingScreen";
import { useCurrentUserId } from "./hooks/useCurrentUserId";

export const App = () => {
  const { userId: currentUserId, username: currentUsername } = useCurrentUserId();
  const [gameType, setGameType] = useState<string>("");
  const [postId, setPostId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [needsAssetLoading, setNeedsAssetLoading] = useState(false);

  useEffect(() => {
    async function fetchGameType() {
      try {
        // Detect postId and mode from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlPostId = urlParams.get('postId');
        const urlMode = urlParams.get('mode');

        let type = "chaser";
        let id = "";
        if (urlPostId) {
          id = urlPostId;
        }

        // If postId is present, fetch post data to determine gameType
        if (id) {
          const postRes = await fetch(`/api/get-post-data?postId=${id}`);
          if (postRes.ok) {
            const postData = await postRes.json();
            if (postData && postData.gameType) {
              setGameType(postData.gameType);
              setPostId(id);
              
              // Generate fallback user ID if none available
              const effectiveUserId = currentUserId || (() => {
                let persistentUserId = localStorage.getItem('chase-phrase-user-id');
                if (!persistentUserId) {
                  persistentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  localStorage.setItem('chase-phrase-user-id', persistentUserId);
                }
                return persistentUserId;
              })();
              
              // For phraser games, check if user has already played before loading assets
              console.log('=== APP.TSX DEBUG ===');
              console.log('Game type:', postData.gameType);
              console.log('Current user ID:', currentUserId);
              console.log('Effective user ID:', effectiveUserId);
              console.log('Is phraser game:', postData.gameType === 'phraser');
              console.log('Has user ID:', !!effectiveUserId);
              console.log('Condition met:', postData.gameType === 'phraser' && effectiveUserId);
              
              if (postData.gameType === 'phraser' && effectiveUserId) {
                console.log('=== PHRASER GAME DETECTED ===');
                console.log('PostId:', id, 'UserId:', effectiveUserId);
                try {
                  const statusRes = await fetch('/api/check-play-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId: id, userId: effectiveUserId })
                  });
                  
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    console.log('Play status response:', statusData);
                    // Only load assets if user can actually play
                    if (statusData.canPlay) {
                      console.log('User can play - loading assets');
                      setNeedsAssetLoading(true);
                      setShowLoadingScreen(true);
                    } else {
                      console.log('User has already played - skipping asset loading');
                      // User has already played - don't load assets
                      setNeedsAssetLoading(false);
                      setShowLoadingScreen(false);
                    }
                  } else {
                    console.log('Status check failed - loading assets to be safe');
                    // If we can't check status, load assets to be safe
                    setNeedsAssetLoading(true);
                    setShowLoadingScreen(true);
                  }
                } catch (err) {
                  console.log('Status check error - loading assets to be safe:', err);
                  // If check fails, load assets to be safe
                  setNeedsAssetLoading(true);
                  setShowLoadingScreen(true);
                }
              } else {
                // For chaser games or when no userId, always load assets
                console.log('=== ELSE CONDITION TRIGGERED ===');
                console.log('Not a phraser game or no userId - loading assets');
                console.log('Game type:', postData.gameType, 'Has userId:', !!currentUserId);
                setNeedsAssetLoading(true);
                setShowLoadingScreen(true);
              }
              
              setLoading(false);
              return;
            }
          }
        }

        // Fallback to backend init
        const res = await fetch(`/api/init?type=${type}${id ? `&postId=${id}` : ''}`);
        const data = await res.json();
        setGameType(data.gameType);
        setPostId(data.postId || id);
        
        // For non-phraser games or when no postId, always load assets
        setNeedsAssetLoading(true);
        setShowLoadingScreen(true);
      } catch (err) {
        setGameType("");
      } finally {
        setLoading(false);
      }
    }
    fetchGameType();
  }, [currentUserId]);

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
  };

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>Initializing...</div>;
  }

  if (showLoadingScreen && gameType && needsAssetLoading) {
    // Try to get the Reddit user ID from the URL context first
    let effectiveUserId = currentUserId;
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
      // Could not parse context, using currentUserId
    }
    
    // Fallback to localStorage if no Reddit user ID
    if (!effectiveUserId) {
      let persistentUserId = localStorage.getItem('chase-phrase-user-id');
      if (!persistentUserId) {
        persistentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chase-phrase-user-id', persistentUserId);
      }
      effectiveUserId = persistentUserId;
    }
    
    return <LoadingScreen 
      gameType={gameType as 'chaser' | 'phraser'} 
      onLoadingComplete={handleLoadingComplete} 
      postId={postId}
      userId={effectiveUserId}
    />;
  }

  // Show a simple loading message when checking play status for phraser games
  if (gameType === 'phraser' && !needsAssetLoading && !showLoadingScreen) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>Checking game status...</div>;
  }

  return (
    <div style={{ height: "100vh", background: "#111" }}>
      {gameType === "chaser" && <ChaserGame currentUserId={currentUserId} currentUsername={currentUsername} />}
      {gameType === "phraser" && postId && (
        <PhraserGameWrapper postId={postId} currentUserId={currentUserId} currentUsername={currentUsername} />
      )}
      {!gameType && (
        <div style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>
          Could not determine game type.
        </div>
      )}
    </div>
  );
};
