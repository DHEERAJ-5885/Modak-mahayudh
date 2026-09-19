import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface OutOfLivesModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onRequestLives: () => void;
  onInviteFriends: () => void;
  onGainLife: () => void;
}

export const OutOfLivesModal: React.FC<OutOfLivesModalProps> = ({
  player,
  isOpen,
  onClose,
  onRequestLives,
  onInviteFriends,
  onGainLife,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(860); // ~14 mins
  const [isPraying, setIsPraying] = useState(false);
  const [prayed, setPrayed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDivinePrayer = () => {
    if (prayed || isPraying) return;
    setIsPraying(true);
    playSound('victory', player.soundEnabled);
    setTimeout(() => {
      setIsPraying(false);
      setPrayed(true);
      onGainLife();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-[400px] bg-gradient-to-b from-[#3a1d4a] via-[#2a0e3b] to-[#1a0128] border-2 border-rose-500/60 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(244,63,94,0.35)] overflow-hidden flex flex-col p-5 text-center animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            playSound('click', player.soundEnabled);
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#1c012d] hover:bg-[#2b0e3b] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow"
          title="Close"
        >
          <AppIcon name="close" size={16} />
        </button>

        {/* Top Floating Glow Heart Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-600 via-red-600 to-amber-700 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(225,29,72,0.6)] mx-auto -mt-10 mb-2 border-2 border-white">
          <AppIcon name="favorite_border" size={32} className="text-white animate-pulse" />
        </div>

        {/* Lives Counter Banner */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <span className="text-rose-500 text-lg">❤️</span>
          <span className="font-hud text-[20px] font-black text-white">0 / 5 Lives</span>
        </div>

        <span className="font-body text-[11px] text-[#ffb691] uppercase tracking-widest font-extrabold">
          SACRED PRANA DEPLETED
        </span>
        <h2 className="font-display text-[24px] font-black text-white leading-tight mt-0.5 mb-1.5">
          You&apos;re out of lives!
        </h2>
        <p className="font-body text-[12px] text-[#e1bfb0] mb-4 max-w-xs mx-auto">
          You need at least 1 heart to challenge the Vighnas. Request lives from your temple friends, invite new devotees, or wait for divine recovery!
        </p>

        {/* Actions Container */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Option 1: Request Lives */}
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onRequestLives();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#ff4d75] to-[#ff6f00] hover:brightness-110 shadow-[0_6px_16px_rgba(255,77,117,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2 text-white font-display text-[15px] font-black border border-white/40 cursor-pointer"
          >
            <AppIcon name="volunteer_activism" size={20} className="text-white" />
            <span>Request Lives from Friends</span>
          </button>

          {/* Option 2: Invite Friends */}
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onInviteFriends();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#2f123f] hover:bg-[#3a1d4a] border border-[#ffdb3c]/40 text-[#ffdb3c] font-display text-[14px] font-extrabold shadow active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <AppIcon name="person_add" size={18} className="text-[#ffdb3c]" />
            <span>Invite Friends</span>
          </button>

          {/* Option 3: Wait for Next Life */}
          <div className="bg-[#1c012d]/85 rounded-2xl p-3 border border-[#ffdb3c]/20 flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full text-[11px] text-[#e1bfb0] px-1">
              <span className="flex items-center gap-1">
                <AppIcon name="schedule" size={13} className="text-[#ffe16d]" />
                Next Divine Life in:
              </span>
              <span className="font-hud text-[#ffe16d] font-bold text-[13px]">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            <button
              onClick={handleDivinePrayer}
              disabled={prayed || isPraying}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-[#341100] font-body text-[12px] font-black shadow active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <AppIcon name="self_improvement" size={16} />
              <span>
                {isPraying
                  ? 'Praying for Prana...'
                  : prayed
                  ? 'Blessing Granted (+1 ❤️)'
                  : 'Pray for Free Life (+1 ❤️)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
