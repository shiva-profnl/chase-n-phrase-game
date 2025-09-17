import React, { useState, useEffect } from 'react';
import { audioManager } from '../utils/audioManager';
import type { LeaderboardEntry, LeaderboardType } from '../../shared/types/leaderboard';

type LeaderboardProps = {
  onBack: () => void;
  currentUserId?: string;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('chaser');
  const [leaderboardData, setLeaderboardData] = useState<{
    entries: LeaderboardEntry[];
    userRank?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (type: LeaderboardType) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${type}&currentUserId=${currentUserId || ''}`);
      const data = await response.json();
      if (data.success) {
        setLeaderboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab, currentUserId]);

  const handleTabChange = (tab: LeaderboardType) => {
    audioManager.playButtonClick();
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    audioManager.playButtonClick();
    onBack();
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <div key={entry.userId} className="leaderboard-row flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="font-semibold text-black body-text">{entry.username}</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-black score-text">{entry.score}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-screen main-bg flex flex-col items-center justify-start p-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header - Optimized height */}
        <div className="flex justify-between items-center mb-1 h-12">
          <div className="flex items-center gap-2">
            <div className="trophy-icon"></div>
            <h1 className="page-title text-black">Leaderboard</h1>
          </div>
          <button
            onClick={handleBackClick}
            className="btn-back"
          />
        </div>

        {/* Tabs - Reduced height to match button height */}
        <div className="flex gap-1 mb-1 px-4 h-12 items-center">
          {[
            { key: 'chaser', label: 'Chaser', className: 'btn-chaser' },
            { key: 'phraser', label: 'Phraser', className: 'btn-phraser' },
            { key: 'sharer', label: 'Sharer', className: 'btn-sharer' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as LeaderboardType)}
              className={`${tab.className} transition-all transform hover:scale-105 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'opacity-100'
                  : 'opacity-60 hover:opacity-80'
              }`}
            />
          ))}
        </div>

        {/* User Rank */}
        {leaderboardData?.userRank && leaderboardData.userRank > 0 && (
          <div className="mb-2 p-2 sub-bg-orange rounded-lg text-black font-semibold small-text">
            Your Rank: #{leaderboardData.userRank}
          </div>
        )}

        {/* Content - Reduced height with scroll */}
        <div className="sub-bg-blue rounded-lg p-3 w-full max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="text-black body-text">Loading...</div>
            </div>
          ) : (
            <div>
              <h2 className="section-title text-black mb-2">
                Top 10 {activeTab === 'chaser' ? 'Chasers' : activeTab === 'phraser' ? 'Phrasers' : 'Sharers'}
              </h2>
              <div className="space-y-1">
                {leaderboardData?.entries && leaderboardData.entries.length > 0 ? (
                  leaderboardData.entries.map(renderLeaderboardEntry)
                ) : (
                  <div className="text-center py-4 text-black body-text">No scores recorded yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
