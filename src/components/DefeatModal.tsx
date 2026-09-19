import React, { useEffect } from 'react';
import { ASSETS } from '../data/gameData';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface DefeatModalProps {
  score: number;
  vighnasDefeated: number;
  targetVighnas: number;
  soundEnabled: boolean;
  onRetry: () => void;
  onGoHome: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  score,
  vighnasDefeated,
  targetVighnas,
  soundEnabled,
  onRetry,
  onGoHome,
}) => {
  useEffect(() => {
    playSound('defeat', soundEnabled);
  }, [soundEnabled]);

  return (
    <div className="fixed inset-0 z-50 bg-[#1c012d]/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-gradient-to-b from-[#3a1d4a] via-[#2f123f] to-[#1c012d] border-2 border-red-500/60 w-full max-w-sm rounded-3xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(239,68,68,0.4)] relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        {/* Glow Header */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-red-600 to-rose-900 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(220,38,38,0.6)] -mt-12 mb-1.5 border-2 border-white">
          <AppIcon name="crisis_alert" size={34} className="text-white" />
        </div>

        <span className="font-body text-[11px] text-[#ffb691] uppercase tracking-widest font-extrabold">
          FESTIVAL AREA BREACHED
        </span>
        <h2 className="font-display text-[24px] font-black text-white leading-tight mt-0.5 mb-1">
          LEVEL FAILED
        </h2>
        <p className="font-body text-[12px] text-[#e1bfb0] mb-3">
          The mischievous Vighnas breached the pandal boundary. Re-channel your divine Prana and try again!
        </p>

        {/* Respectful Ganesha Inspiration Banner */}
        <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 border border-[#ffdb3c]/30 relative shadow-inner">
          <img
            src={ASSETS.ganeshaHero}
            alt="Lord Ganesha Inspires"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c012d] via-transparent to-transparent" />
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center">
            <span className="bg-[#1c012d]/90 px-3 py-0.5 rounded-full text-[11px] font-display font-extrabold text-[#ffe16d] border border-[#ffdb3c]/40">
              Shree Ganesha gives you strength 🪔
            </span>
          </div>
        </div>

        {/* Score & Defeats Cards */}
        <div className="grid grid-cols-2 gap-2 w-full mb-3 text-left">
          <div className="bg-[#1c012d]/80 border border-[#ffdb3c]/20 p-2.5 rounded-2xl flex flex-col">
            <span className="font-body text-[10px] text-[#e1bfb0]">Score Achieved</span>
            <span className="font-hud text-[18px] text-[#ffe16d] font-black">
              {score.toLocaleString()}
            </span>
            <span className="font-body text-[9px] text-gray-400">Keep practicing!</span>
          </div>

          <div className="bg-[#1c012d]/80 border border-red-500/30 p-2.5 rounded-2xl flex flex-col">
            <span className="font-body text-[10px] text-[#e1bfb0]">Vighnas Purged</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AppIcon name="crisis_alert" size={16} className="text-red-400" />
              <span className="font-hud text-[14px] text-white font-bold">
                {vighnasDefeated} / {targetVighnas}
              </span>
            </div>
            <span className="font-body text-[9px] text-amber-300 font-semibold">Almost there</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onRetry}
            className="w-full bg-gradient-to-b from-[#ffe16d] via-[#ff9800] to-[#ff6f00] py-3.5 rounded-2xl shadow-[0_8px_20px_rgba(255,111,0,0.6)] active:scale-95 transition-transform flex items-center justify-center gap-2 text-[#341100] font-display text-[16px] font-black border border-white/60 cursor-pointer"
          >
            <AppIcon name="replay" size={20} />
            <span>RETRY LEVEL</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-2.5 rounded-xl bg-[#2b0e3b] hover:bg-[#3a1d4a] text-[#ffe16d] font-body text-[12px] font-bold shadow active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer border border-[#ffe16d]/20"
          >
            <AppIcon name="map" size={16} />
            <span>Return to Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
