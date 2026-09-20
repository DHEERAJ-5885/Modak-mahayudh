import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ASSETS } from '../data/gameData';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface VictoryModalProps {
  score: number;
  movesLeft: number;
  starsEarned: number;
  soundEnabled: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onGoHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  movesLeft,
  starsEarned,
  soundEnabled,
  onNextLevel,
  onReplay,
  onGoHome,
}) => {
  useEffect(() => {
    playSound('victory', soundEnabled);

    // Burst festive confetti
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffdb3c', '#ff6f00', '#ff6689', '#ffffff', '#22c55e'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffe16d', '#ff9100', '#ffd9de'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffe16d', '#ff9100', '#ffd9de'],
        });
      }, 400);
    } catch {
      // Ignore if confetti fails
    }
  }, [soundEnabled]);

  return (
    <div className="fixed inset-0 z-50 bg-[#1c012d]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-gradient-to-b from-[#3a1d4a] via-[#2f123f] to-[#1c012d] border-2 border-[#ffdb3c]/60 w-full max-w-sm rounded-3xl p-4 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(255,219,60,0.4)] relative flex flex-col items-center text-center max-h-[min(92dvh,640px)] overflow-y-auto my-auto animate-in fade-in zoom-in duration-300">
        {/* Glow Header */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffe16d] via-[#ff6f00] to-[#b71c1c] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(255,111,0,0.6)] -mt-12 mb-1.5 border-2 border-white">
          <AppIcon name="celebration" size={36} className="text-white" />
        </div>

        <span className="font-body text-[11px] text-[#ffe16d] uppercase tracking-widest font-extrabold">
          PANDAL DEFENSE SECURED
        </span>
        <h2 className="font-display text-[26px] font-black text-white leading-tight mt-0.5 mb-1">
          VICTORY! <span className="text-[#ffdb3c]">🪔</span>
        </h2>
        <p className="font-body text-[12px] text-[#e1bfb0] mb-3">
          The mischievous Vighnas have been purified by Lord Ganesha!
        </p>

        {/* 3 Glow Stars */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[1, 2, 3].map((starIndex) => {
            const isEarned = starIndex <= starsEarned;
            return (
              <div
                key={starIndex}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  isEarned
                    ? 'bg-gradient-to-b from-[#ffe16d] to-[#ff6f00] text-white shadow-[0_0_15px_#ffdb3c] scale-110'
                    : 'bg-[#2b0e3b] text-gray-500'
                }`}
              >
                <AppIcon
                  name="star"
                  size={24}
                  className={isEarned ? 'text-white' : 'text-gray-500'}
                  fill={isEarned ? 'currentColor' : 'none'}
                />
              </div>
            );
          })}
        </div>

        {/* Celebration Illustration Banner */}
        <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 border border-[#ffdb3c]/30 relative shadow-inner">
          <img
            src={ASSETS.ganeshaHome}
            alt="Lord Ganesha Celebrates"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c012d] via-transparent to-transparent" />
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center">
            <span className="bg-[#1c012d]/90 px-3 py-0.5 rounded-full text-[11px] font-display font-extrabold text-[#ffe16d] border border-[#ffdb3c]/40">
              Prasadam Blessed by Shree Ganesha 🥟
            </span>
          </div>
        </div>

        {/* Score & Rewards Cards */}
        <div className="grid grid-cols-2 gap-2 w-full mb-3 text-left">
          <div className="bg-[#1c012d]/80 border border-[#ffdb3c]/20 p-2.5 rounded-2xl flex flex-col">
            <span className="font-body text-[10px] text-[#e1bfb0]">Total Score</span>
            <span className="font-hud text-[18px] text-[#ffe16d] font-black">
              {score.toLocaleString()}
            </span>
            <span className="font-body text-[9px] text-emerald-400 font-bold">
              +{movesLeft * 50} Moves Bonus
            </span>
          </div>

          <div className="bg-[#1c012d]/80 border border-[#ff6689]/20 p-2.5 rounded-2xl flex flex-col">
            <span className="font-body text-[10px] text-[#e1bfb0]">Divine Prasadam</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AppIcon name="monetization_on" size={16} className="text-[#ffe16d]" />
              <span className="font-hud text-[14px] text-white font-bold">+150 Coins</span>
            </div>
            <span className="font-body text-[9px] text-[#ffb691] font-semibold">+3 Stars Added</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onNextLevel}
            className="w-full bg-gradient-to-b from-[#ffe16d] via-[#ff9800] to-[#ff6f00] py-3.5 rounded-2xl shadow-[0_8px_20px_rgba(255,111,0,0.6)] active:scale-95 transition-transform flex items-center justify-center gap-2 text-[#341100] font-display text-[16px] font-black border border-white/60 cursor-pointer"
          >
            <span>NEXT LEVEL</span>
            <AppIcon name="arrow_forward" size={22} />
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onReplay}
              className="py-2.5 rounded-xl bg-[#462856] hover:bg-[#57336b] text-white font-body text-[12px] font-bold shadow active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer border border-white/10"
            >
              <AppIcon name="replay" size={16} />
              <span>Play Again</span>
            </button>
            <button
              onClick={onGoHome}
              className="py-2.5 rounded-xl bg-[#2b0e3b] hover:bg-[#3a1d4a] text-[#ffe16d] font-body text-[12px] font-bold shadow active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer border border-[#ffe16d]/20"
            >
              <AppIcon name="map" size={16} />
              <span>Level Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
