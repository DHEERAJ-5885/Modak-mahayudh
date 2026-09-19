import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProfile, LeaderboardEntry, PlayerRankResult } from '../types';
import { leaderboardService } from '../services/leaderboardService';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface LeaderboardScreenProps {
  player: PlayerProfile;
  onBack?: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ player, onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<PlayerRankResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, rank] = await Promise.all([
        leaderboardService.getLeaderboard(),
        leaderboardService.getPlayerRank(player.id || 'player_aryan_01'),
      ]);

      setEntries(list);
      setPlayerRank(rank);
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [player.id]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getAvatarIcon = (avatar?: string) => {
    switch (avatar) {
      case 'mushak':
        return { name: 'pets', color: '#ffb691', bg: 'bg-[#462856]' };
      case 'lotus':
        return { name: 'spa', color: '#ff6689', bg: 'bg-[#462856]' };
      case 'trident':
        return { name: 'flash_on', color: '#ffdb3c', bg: 'bg-[#462856]' };
      case 'diya':
        return { name: 'wb_incandescent', color: '#ffe16d', bg: 'bg-[#462856]' };
      default:
        return { name: 'temple_hindu', color: '#ffdb3c', bg: 'bg-[#462856]' };
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto pb-24 px-3.5 pt-3 select-none">
      {/* Top Header with Back / Close Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                playSound('click', player.soundEnabled);
                onBack();
              }}
              className="w-9 h-9 rounded-xl bg-[#2f123f] hover:bg-[#3a1d4a] border border-[#ffdb3c]/30 text-[#ffe16d] flex items-center justify-center cursor-pointer active:scale-95 transition shadow"
              title="Return to Home"
            >
              <AppIcon name="arrow_back" size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-body text-[10px] text-[#ffb691] uppercase tracking-wider font-extrabold flex items-center gap-1">
              <AppIcon name="emoji_events" size={13} />
              Temple Champions
            </span>
            <h1 className="font-display text-[22px] font-black text-[#ffdb3c] leading-tight">
              # Global Leaderboard
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            playSound('click', player.soundEnabled);
            fetchLeaderboard();
          }}
          className="p-2 rounded-xl bg-[#2f123f] hover:bg-[#3a1d4a] text-[#ffe16d] border border-[#ffdb3c]/20 flex items-center justify-center cursor-pointer active:scale-95 transition shadow"
          title="Refresh Scores"
        >
          <AppIcon name="refresh" size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Current Player's Highlighted Standing Card */}
      <div className="bg-gradient-to-r from-[#552000] via-[#853500] to-[#552000] rounded-2xl p-3.5 border-2 border-[#ffdb3c] shadow-[0_8px_20px_rgba(255,111,0,0.5)] mb-3 flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#ffdb3c] text-[#341100] flex flex-col items-center justify-center font-hud text-[17px] font-black shadow shrink-0 leading-none">
            <span>#{playerRank ? playerRank.rank : '--'}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-body text-[10px] text-[#ffe16d] font-bold uppercase tracking-wider">
                YOUR STANDING
              </span>
              <span className="bg-[#ffdb3c] text-[#341100] text-[9px] px-1.5 py-0.2 rounded font-black tracking-tight uppercase">
                YOU
              </span>
            </div>
            <span className="font-display text-[15px] text-white font-extrabold leading-snug truncate">
              {player.displayName || player.name}
            </span>
            <span className="font-body text-[11px] text-[#ffd9de]">
              Best Score:{' '}
              <strong className="text-[#ffdb3c] font-hud">
                {(playerRank?.bestScore || player.highScore || 0).toLocaleString()} Pts
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end text-[11px] font-hud text-[#ffe16d] font-bold shrink-0">
          <span>{playerRank ? `Rank #${playerRank.rank}` : 'Unranked'}</span>
          <span className="text-[9px] text-white font-normal">
            {playerRank && playerRank.rank <= 3
              ? '🥇 Maha Bhakta'
              : playerRank && playerRank.rank <= 10
              ? 'Pandal Sentinel'
              : 'Modak Seeker'}
          </span>
        </div>
      </div>

      {/* Info Pill */}
      <div className="flex items-center justify-between px-1 mb-2 text-[11px] text-[#e1bfb0] font-body">
        <span className="flex items-center gap-1">
          <AppIcon name="military_tech" size={14} className="text-[#ffdb3c]" />
          Top Devotees Worldwide
        </span>
        <span className="text-[#ffb691] font-hud text-[10px]">
          {entries.length} Warriors Ranked
        </span>
      </div>

      {/* Ranked List of Players */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#ffe16d] gap-2">
            <AppIcon name="refresh" size={28} className="animate-spin" />
            <span className="font-body text-[12px]">Retrieving Global Leaderboard...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-[#2b0e3b] border border-[#ffdb3c]/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <AppIcon name="military_tech" size={36} className="text-[#ffe16d] mb-1" />
            <h4 className="font-display text-[15px] text-white font-bold mb-1">
              No High Scores Yet
            </h4>
            <p className="font-body text-[11px] text-[#e1bfb0] max-w-xs mb-3">
              Play and complete battle levels to climb to the top of the Global Leaderboard!
            </p>
          </div>
        ) : (
          entries.map((w, index) => {
            const rank = index + 1;
            const isCurrentPlayer =
              w.playerId === player.id || w.playerId === 'player_aryan_01';
            const avatar = getAvatarIcon(w.playerAvatar);

            return (
              <div
                key={w.id || `${w.playerId}_${index}`}
                className={`rounded-2xl p-3 flex items-center justify-between border transition-all ${
                  isCurrentPlayer
                    ? 'bg-[#431d57] border-2 border-[#ffe16d] shadow-[0_0_16px_rgba(255,219,60,0.35)]'
                    : rank <= 3
                    ? 'bg-[#3a1d4a] border border-[#ffdb3c]/40 shadow-md'
                    : 'bg-[#2b0e3b] border border-white/10'
                }`}
              >
                {/* Left: Rank, Avatar, Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-hud text-[13px] font-black shrink-0 shadow ${
                      rank === 1
                        ? 'bg-gradient-to-br from-[#ffe16d] to-[#ff9800] text-[#341100] border border-white'
                        : rank === 2
                        ? 'bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800 border border-white'
                        : rank === 3
                        ? 'bg-gradient-to-br from-amber-500 to-orange-700 text-white border border-white/50'
                        : 'bg-[#1c012d] text-[#e1bfb0] border border-white/10'
                    }`}
                  >
                    {rank}
                  </span>

                  {/* Player Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl ${avatar.bg} border border-[#ffdb3c]/30 flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    <AppIcon name={avatar.name} size={18} className="text-white" fill={avatar.color} />
                  </div>

                  {/* Player Details */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-[13px] text-white font-extrabold truncate">
                        {w.playerName}
                      </span>
                      {isCurrentPlayer && (
                        <span className="bg-[#ffdb3c] text-[#341100] text-[8px] px-1 rounded font-black tracking-tight">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#e1bfb0]">
                      <span className="text-[#ffe16d] font-bold font-hud">
                        Level {w.level || 1}
                      </span>
                      {w.obstaclesDefeated ? (
                        <>
                          <span>•</span>
                          <span>{w.obstaclesDefeated} Purged</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right: Score */}
                <div className="flex flex-col items-end min-w-[75px] shrink-0">
                  <span className="font-hud text-[14px] text-[#ffe16d] font-black text-right drop-shadow-sm">
                    {w.score.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-body">Pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
