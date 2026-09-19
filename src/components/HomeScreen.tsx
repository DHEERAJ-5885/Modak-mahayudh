import React, { useState } from 'react';
import { Screen, PlayerProfile, LevelConfig } from '../types';
import { ASSETS } from '../data/gameData';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface HomeScreenProps {
  player: PlayerProfile;
  activeLevel: LevelConfig;
  onStartBattle: (levelId: number) => void;
  onNavigate: (screen: Screen) => void;
  onClaimQuest: () => void;
  questClaimed: boolean;
  questProgress: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  player,
  activeLevel,
  onStartBattle,
  onNavigate,
  onClaimQuest,
  questClaimed,
  questProgress,
}) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound('victory', player.soundEnabled);
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Create festive sparkle burst
    const colors = ['#ffdb3c', '#ffb691', '#ffe16d', '#ff6f00', '#ffd9de'];
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: rect.left + Math.random() * rect.width,
      y: rect.top + Math.random() * rect.height,
      color: colors[i % colors.length],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1200);

    setTimeout(() => {
      onStartBattle(activeLevel.id);
    }, 250);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto pb-24 relative select-none overflow-x-hidden">
      {/* Sparkle burst container */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed w-3 h-3 rounded-full pointer-events-none z-50 animate-ping shadow-[0_0_10px_#ffdb3c]"
          style={{ left: `${p.x}px`, top: `${p.y}px`, backgroundColor: p.color }}
        />
      ))}

      {/* TOP HERO GANESHA BANNER */}
      <div className="relative w-full rounded-b-[2rem] overflow-hidden bg-gradient-to-b from-[#1c012d] via-[#2f123f] to-[#1c012d] shadow-[0_16px_36px_rgba(10,0,20,0.85)] border-b border-[#ff6f00]/30">
        <div className="relative w-full aspect-[4/3] max-h-[320px] sm:max-h-[360px]">
          <img
            src={ASSETS.ganeshaHome}
            alt="Jai Deva Ganesha"
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Gradients over image for high readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c012d] via-[#1c012d]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c012d]/60 via-transparent to-transparent" />

          {/* Festival Live Pill */}
          <div className="absolute top-3 left-3 sm:left-4 flex items-center gap-1.5 bg-[#462856]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-[#ffdb3c]/40">
            <span className="w-2 h-2 rounded-full bg-[#ffdb3c] animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffdb3c] -ml-2.5" />
            <span className="font-body text-[10px] sm:text-[11px] text-[#ffdb3c] uppercase tracking-wider font-extrabold">
              Chaturthi Utsav Live
            </span>
          </div>

          {/* Bottom Title & Streak Pill */}
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-end justify-between gap-2 pointer-events-none">
            <div className="flex flex-col drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] min-w-0">
              <span className="font-body text-[10px] sm:text-[11px] text-[#ffb691] font-bold uppercase tracking-widest truncate">
                Shree Ganesh Kripa
              </span>
              <h2 className="font-display text-[18px] sm:text-[22px] font-black text-[#ffdb3c] tracking-tight leading-tight truncate">
                Jai Deva Ganesha
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-[#1c012d]/90 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-full shadow-inner border border-[#ffe16d]/30 shrink-0">
              <AppIcon name="local_fire_department" size={14} className="text-[#ffe16d]" fill="#ffe16d" />
              <span className="font-hud text-[11px] sm:text-[12px] text-white font-bold whitespace-nowrap">
                Day {player.streakDays}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SLABS */}
      <div className="px-2.5 sm:px-3.5 flex flex-col gap-3 -mt-3 relative z-10 w-full">
        {/* World Progress Milestone Card */}
        <div className="bg-[#3a1d4a] rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex flex-col gap-2 relative overflow-hidden border border-[#ff6f00]/30 w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#462856] flex items-center justify-center text-[#ffb691] shadow-inner border border-[#ff6f00]/30 shrink-0">
                <AppIcon name="temple_hindu" size={20} className="text-[#ffb691]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body text-[9px] sm:text-[10px] text-[#ffb691] uppercase tracking-wider font-extrabold truncate">
                  World 1: Festival Begins
                </span>
                <span className="font-display text-[13px] sm:text-[15px] text-white font-black truncate">
                  Level {activeLevel.id} <span className="font-body text-[11px] sm:text-[12px] text-gray-300 font-normal">of 10</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#1c012d]/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-inner border border-[#ffe16d]/30 shrink-0">
              <AppIcon name="star" size={14} className="text-[#ffe16d]" fill="#ffe16d" />
              <span className="font-hud text-[12px] sm:text-[13px] text-[#ffe16d] font-bold whitespace-nowrap">
                {player.stars}<span className="text-gray-400 text-[10px]">/30</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full pt-1">
            <div className="flex items-center justify-between font-body text-[10px] sm:text-[11px] text-[#e1bfb0]">
              <span>World Milestone Progress</span>
              <span className="text-[#ffdb3c] font-bold">
                {Math.round((activeLevel.id / 10) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#1c012d] p-0.5 shadow-inner overflow-hidden border border-[#ffdb3c]/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff6f00] via-[#ffdb3c] to-[#ffe16d] transition-all duration-700 shadow-[0_0_8px_rgba(255,219,60,0.6)]"
                style={{ width: `${Math.max(10, Math.round((activeLevel.id / 10) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* GIANT JUICY 3D "PLAY BATTLE" CTA BUTTON */}
        <div className="relative w-full my-0.5">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6f00] via-[#ffdb3c] to-[#ff6f00] rounded-full blur-md opacity-50 animate-pulse pointer-events-none" />
          <button
            onClick={handlePlayClick}
            className="relative w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-full bg-gradient-to-b from-[#ff9100] via-[#ff6f00] to-[#b71c1c] shadow-[0_6px_0_#591a05,0_14px_24px_rgba(255,111,0,0.5)] active:translate-y-1 active:shadow-[0_3px_0_#591a05,0_6px_12px_rgba(255,111,0,0.3)] transition-all flex items-center justify-between group cursor-pointer border border-[#ffe16d]/50 box-border"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#ffdb3c]/30 flex items-center justify-center text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform shrink-0">
                <AppIcon name="play_arrow" size={22} className="text-white translate-x-0.5" fill="white" />
              </span>
              <div className="flex flex-col items-start leading-tight min-w-0 text-left">
                <span className="font-display text-[16px] sm:text-[19px] font-black text-[#fff9ef] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide uppercase truncate">
                  Play Battle
                </span>
                <span className="font-body text-[10px] sm:text-[11px] text-[#ffe16d] tracking-wider font-bold truncate">
                  {activeLevel.title}
                </span>
              </div>
            </div>
            <AppIcon name="keyboard_double_arrow_right" size={20} className="text-white animate-bounce shrink-0" />
          </button>
        </div>

        {/* 4-COLUMN SHORTCUT TILES */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onNavigate('map');
            }}
            className="flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-xl bg-[#2f123f] hover:bg-[#3a1d4a] transition-all shadow-md text-center active:scale-95 border border-[#ff6f00]/20 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#462856] flex items-center justify-center text-[#ffb691] shadow-inner shrink-0">
              <AppIcon name="map" size={18} className="text-[#ffb691]" />
            </div>
            <span className="font-body text-[10px] sm:text-[11px] text-white font-bold truncate w-full">World Map</span>
          </button>

          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onNavigate('powers');
            }}
            className="flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-xl bg-[#2f123f] hover:bg-[#3a1d4a] transition-all shadow-md text-center active:scale-95 border border-[#ff6f00]/20 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#462856] flex items-center justify-center text-[#ffdb3c] shadow-inner shrink-0">
              <AppIcon name="auto_awesome" size={18} className="text-[#ffdb3c]" fill="#ffdb3c" />
            </div>
            <span className="font-body text-[10px] sm:text-[11px] text-white font-bold truncate w-full">Upgrades</span>
          </button>

          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onNavigate('ranks');
            }}
            className="flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-xl bg-[#2f123f] hover:bg-[#3a1d4a] transition-all shadow-md text-center active:scale-95 border border-[#ff6f00]/20 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#462856] flex items-center justify-center text-[#ff6689] shadow-inner shrink-0">
              <AppIcon name="emoji_events" size={18} className="text-[#ff6689]" />
            </div>
            <span className="font-body text-[10px] sm:text-[11px] text-white font-bold truncate w-full">Ranks</span>
          </button>

          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onNavigate('rewards');
            }}
            className="relative flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-xl bg-[#2f123f] hover:bg-[#3a1d4a] transition-all shadow-md text-center active:scale-95 border border-[#ff6f00]/20 cursor-pointer min-w-0"
          >
            <span className="absolute -top-1 -right-0.5 bg-[#ff6689] text-white font-body text-[8px] font-bold px-1 py-0.2 rounded-full shadow animate-pulse pointer-events-none">
              1 Free
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#462856] flex items-center justify-center text-[#ffe16d] shadow-inner shrink-0">
              <AppIcon name="featured_seasonal_and_gifts" size={18} className="text-[#ffe16d]" />
            </div>
            <span className="font-body text-[10px] sm:text-[11px] text-white font-bold truncate w-full">Daily Gift</span>
          </button>
        </div>

        {/* DAILY BHAKTI QUEST CARD */}
        <div className="bg-gradient-to-r from-[#2b0e3b] via-[#3a1d4a] to-[#2b0e3b] rounded-2xl p-3 sm:p-3.5 shadow-lg flex flex-col gap-2 relative overflow-hidden border border-[#ffdb3c]/30 w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AppIcon name="stars" size={18} className="text-[#ffdb3c]" fill="#ffdb3c" />
              <h3 className="font-display text-[13px] sm:text-[14px] font-extrabold text-[#ffdb3c] truncate">
                Daily Bhakti Quest
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-[#1c012d] px-2 py-0.5 rounded-full text-[#ffe16d] border border-[#ffe16d]/30 shrink-0">
              <AppIcon name="monetization_on" size={12} className="text-[#ffe16d]" fill="#ffe16d" />
              <span className="font-hud text-[10px] sm:text-[11px] font-bold">+100</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-white font-body text-[12px] sm:text-[13px]">
            <span className="truncate mr-2">Match 25 Golden Kesar Modaks</span>
            <span className="font-hud text-[12px] sm:text-[13px] text-[#ffb691] font-bold shrink-0">
              {questProgress} <span className="text-gray-400 font-normal">/ 25</span>
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#1c012d] p-0.5 shadow-inner overflow-hidden border border-[#ffdb3c]/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff6f00] via-[#ffdb3c] to-[#ffe16d] transition-all duration-500 shadow-[0_0_8px_rgba(255,111,0,0.5)]"
              style={{ width: `${Math.min(100, Math.round((questProgress / 25) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-0.5 font-body text-[10px] sm:text-[11px] text-[#e1bfb0]">
            <span>Resets in 05h 42m</span>
            {questClaimed ? (
              <span className="text-emerald-400 font-bold uppercase">Claimed!</span>
            ) : questProgress >= 25 ? (
              <button
                onClick={() => {
                  playSound('victory', player.soundEnabled);
                  onClaimQuest();
                }}
                className="bg-[#ffdb3c] hover:bg-[#ffe16d] text-[#3a3000] font-extrabold px-3 py-1 rounded-full shadow active:scale-95 cursor-pointer text-[10px]"
              >
                CLAIM +100
              </button>
            ) : (
              <span className="text-[#ffb691] font-bold uppercase">In Progress</span>
            )}
          </div>
        </div>

        {/* CURRENT LEAGUE STANDING CARD */}
        <div
          onClick={() => {
            playSound('click', player.soundEnabled);
            onNavigate('ranks');
          }}
          className="bg-[#2b0e3b] rounded-2xl p-3 shadow-md flex items-center justify-between gap-2 border border-[#ff6f00]/20 hover:border-[#ffdb3c]/50 cursor-pointer active:scale-98 transition-all w-full"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#462856] flex items-center justify-center text-[#ffe16d] shadow-inner border border-[#ffdb3c]/30 shrink-0">
              <AppIcon name="military_tech" size={22} className="text-[#ffe16d]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[9px] sm:text-[10px] text-[#ffb691] uppercase tracking-wider font-extrabold truncate">
                Current League
              </span>
              <span className="font-display text-[13px] sm:text-[14px] text-white font-extrabold truncate">
                Siddhivinayak Divya Club
              </span>
              <span className="font-body text-[10px] sm:text-[11px] text-[#e1bfb0] truncate">
                Rank #42 amongst temple warriors
              </span>
            </div>
          </div>
          <AppIcon name="chevron_right" size={18} className="text-[#e1bfb0] shrink-0" />
        </div>
      </div>
    </div>
  );
};
