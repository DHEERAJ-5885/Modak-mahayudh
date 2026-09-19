import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProfile, LeaderboardEntry, PlayerRankResult } from '../types';
import { leaderboardService } from '../services/leaderboardService';
import { AppIcon } from './AppIcon';

interface LeaderboardScreenProps {
  player: PlayerProfile;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ player }) => {
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<PlayerRankResult | null>(null);
  const [campuses, setCampuses] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load available campuses
  useEffect(() => {
    leaderboardService.getCampuses().then((list) => {
      setCampuses(list);
    });
  }, []);

  // Fetch leaderboard data reactively on filter change
  const refreshLeaderboard = useCallback(async () => {
    setIsLoading(true);
    const filter = {
      campus: selectedCampus,
      level: selectedLevel,
    };

    try {
      const [list, rank] = await Promise.all([
        leaderboardService.getLeaderboard(filter),
        leaderboardService.getPlayerRank(player.id || 'player_aryan_01', filter),
      ]);

      setEntries(list);
      setPlayerRank(rank);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampus, selectedLevel, player.id]);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  const displayedEntries = onlyVerified
    ? entries.filter((e) => !e.isDevMock)
    : entries;

  return (
    <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto pb-24 px-3.5 pt-3 select-none">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex flex-col">
          <span className="font-body text-[11px] text-[#ffb691] uppercase tracking-wider font-extrabold flex items-center gap-1">
            <AppIcon name="leaderboard" size={14} />
            Weekly Champions
          </span>
          <h2 className="font-display text-[22px] font-black text-[#ffdb3c] leading-tight">
            Temple Ranks
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-[#462856] px-3 py-0.5 rounded-full border border-[#ffe16d]/30 text-[#ffe16d] text-[11px] font-bold shadow-sm">
            Gold League
          </div>
          <span className="text-[9px] font-body text-[#e1bfb0]">
            Season Ends in 4d
          </span>
        </div>
      </div>

      {/* Player Rank Card */}
      <div className="bg-gradient-to-r from-[#552000] via-[#853500] to-[#552000] rounded-2xl p-3.5 border-2 border-[#ffdb3c] shadow-[0_8px_20px_rgba(255,111,0,0.5)] mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#ffdb3c] text-[#341100] flex flex-col items-center justify-center font-hud text-[17px] font-black shadow leading-none">
            <span>#{playerRank ? playerRank.rank : '--'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-body text-[10px] text-[#ffe16d] font-bold uppercase tracking-wider">
                YOUR STANDING
              </span>
              <span className="bg-[#ffdb3c]/20 text-[#ffe16d] text-[9px] px-1.5 py-0.2 rounded font-semibold">
                {player.campus || 'Mumbai Central'}
              </span>
            </div>
            <span className="font-display text-[15px] text-white font-extrabold leading-snug">
              {player.name}
            </span>
            <span className="font-body text-[11px] text-[#ffd9de]">
              Best: {(playerRank?.bestScore || player.highScore || 0).toLocaleString()} Pts • {playerRank?.obstaclesDefeated ?? 0} Purged
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end text-[11px] font-hud text-[#ffe16d] font-bold">
          <span>
            {playerRank ? `Rank #${playerRank.rank}` : 'Unranked'}
          </span>
          <span className="text-[9px] text-white font-normal">
            {playerRank && playerRank.rank <= 3
              ? '🥇 Maha Bhakta'
              : playerRank && playerRank.rank <= 10
              ? 'Pandal Sentinel'
              : 'Modak Seeker'}
          </span>
        </div>
      </div>

      {/* Filter Control Panels */}
      <div className="bg-[#240a33] border border-[#ffdb3c]/20 rounded-2xl p-2.5 mb-3 flex flex-col gap-2 shadow-sm">
        {/* Campus Filter Selector */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-body uppercase font-bold text-[#ffb691] flex items-center gap-1">
              <AppIcon name="domain" size={13} />
              Campus Filter
            </span>
            <span className="text-[10px] font-hud text-[#ffe16d]">
              {selectedCampus === 'all' ? 'All Campuses (Global)' : selectedCampus}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCampus('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCampus === 'all'
                  ? 'bg-gradient-to-r from-[#ffe16d] to-[#ff9800] text-[#341100] shadow-sm'
                  : 'bg-[#3a1d4a] text-[#e1bfb0] hover:bg-[#4a265e] border border-white/5'
              }`}
            >
              All Campuses
            </button>
            {campuses
              .filter((c) => c !== 'All Campuses')
              .map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCampus === campus
                      ? 'bg-gradient-to-r from-[#ffe16d] to-[#ff9800] text-[#341100] shadow-sm'
                      : 'bg-[#3a1d4a] text-[#e1bfb0] hover:bg-[#4a265e] border border-white/5'
                  }`}
                >
                  {campus}
                </button>
              ))}
          </div>
        </div>

        {/* Level Filter Selector */}
        <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-body uppercase font-bold text-[#ffb691] flex items-center gap-1">
              <AppIcon name="military_tech" size={13} />
              Level Filter
            </span>
            <span className="text-[10px] font-hud text-[#ffe16d]">
              {selectedLevel === 'all' ? 'All Levels (Cumulative)' : `Level ${selectedLevel}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedLevel === 'all'
                  ? 'bg-gradient-to-r from-[#ffe16d] to-[#ff9800] text-[#341100] shadow-sm'
                  : 'bg-[#3a1d4a] text-[#e1bfb0] hover:bg-[#4a265e] border border-white/5'
              }`}
            >
              All Levels
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-gradient-to-r from-[#ffe16d] to-[#ff9800] text-[#341100] shadow-sm'
                    : 'bg-[#3a1d4a] text-[#e1bfb0] hover:bg-[#4a265e] border border-white/5'
                }`}
              >
                Lvl {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Data Integrity Transparency Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[9px] font-body text-[#e1bfb0] flex items-center gap-1">
            <AppIcon name="verified_user" size={11} className="text-[#ffe16d]" />
            Real-time score sync
          </span>
          <button
            onClick={() => setOnlyVerified(!onlyVerified)}
            className={`text-[9px] px-2 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
              onlyVerified
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <span>{onlyVerified ? '✓ Verified Only' : 'Include Dev Mock'}</span>
          </button>
        </div>
      </div>

      {/* Rankings List */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#ffe16d] gap-2">
            <AppIcon name="refresh" size={28} className="animate-spin" />
            <span className="font-body text-[12px]">Consulting the Temple Ranks...</span>
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="bg-[#2b0e3b] border border-[#ffdb3c]/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <AppIcon name="military_tech" size={36} className="text-[#ffe16d] mb-1" />
            <h4 className="font-display text-[15px] text-white font-bold mb-1">
              No Warriors Found Here Yet!
            </h4>
            <p className="font-body text-[11px] text-[#e1bfb0] max-w-xs mb-3">
              {selectedLevel !== 'all'
                ? `Nobody has submitted a completed run for Level ${selectedLevel} in this campus.`
                : 'No players match the current campus filter.'}
            </p>
            <span className="text-[10px] bg-[#ffdb3c]/20 text-[#ffe16d] px-3 py-1 rounded-full font-bold">
              Clear this battle to claim #1!
            </span>
          </div>
        ) : (
          displayedEntries.map((w, index) => {
            const rank = index + 1;
            const isCurrentPlayer =
              w.playerId === player.id || w.playerId === 'player_aryan_01';

            return (
              <div
                key={w.id || w.playerId}
                className={`rounded-xl p-2.5 flex items-center justify-between border transition-all ${
                  isCurrentPlayer
                    ? 'bg-[#431d57] border-[#ffe16d] shadow-[0_0_12px_rgba(255,219,60,0.3)]'
                    : rank <= 3
                    ? 'bg-[#3a1d4a] border-[#ffdb3c]/40 shadow-md'
                    : 'bg-[#2b0e3b] border-white/10'
                }`}
              >
                {/* Left: Rank badge & details */}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-hud text-[13px] font-bold shrink-0 ${
                      rank === 1
                        ? 'bg-[#ffe16d] text-[#341100]'
                        : rank === 2
                        ? 'bg-gray-200 text-gray-800'
                        : rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#1c012d] text-gray-400'
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-[13px] text-white font-bold">
                        {w.playerName}
                      </span>
                      {isCurrentPlayer && (
                        <span className="bg-[#ffdb3c] text-[#341100] text-[8px] px-1 rounded font-black tracking-tight">
                          YOU
                        </span>
                      )}
                      {w.isDevMock && (
                        <span className="bg-purple-900/60 text-[#d8b4fe] border border-[#a855f7]/30 text-[7.5px] px-1 rounded font-bold uppercase tracking-wider">
                          Dev Mock
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#e1bfb0]">
                      <span>{w.campus}</span>
                      <span>•</span>
                      <span className="text-[#ffe16d] font-bold">Lvl {w.level}</span>
                      {w.completionTime && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400">{w.completionTime}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Obstacles and score */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-1 text-[#ffe16d]"
                    title="Vighnas Purged"
                  >
                    <AppIcon name="crisis_alert" size={15} />
                    <span className="font-hud text-[11px] font-bold">
                      {w.obstaclesDefeated}
                    </span>
                  </div>
                  <div className="flex flex-col items-end min-w-[60px]">
                    <span className="font-hud text-[13px] text-white font-bold text-right">
                      {w.score.toLocaleString()}
                    </span>
                    {w.bestScore > w.score && (
                      <span className="text-[8.5px] text-[#e1bfb0] font-hud">
                        Best: {w.bestScore.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
