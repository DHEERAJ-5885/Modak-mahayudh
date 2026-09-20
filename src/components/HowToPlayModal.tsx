import React, { useState } from 'react';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
}

type GuideTab = 'all' | 'matching' | 'powers' | 'demons' | 'rules';

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  soundEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('all');

  if (!isOpen) return null;

  const handleTabChange = (tab: GuideTab) => {
    playSound('click', soundEnabled);
    setActiveTab(tab);
  };

  const handleClose = () => {
    playSound('click', soundEnabled);
    onClose();
  };

  return (
    <div
      id="how-to-play-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      <div
        id="how-to-play-modal-card"
        className="relative w-full max-w-[480px] bg-[#1c012d] border-2 border-[#ffdb3c]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(255,219,60,0.2)] overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[86vh]"
      >
        {/* STICKY HEADER */}
        <div className="relative bg-gradient-to-r from-[#2b0e3b] via-[#3a1d4a] to-[#2b0e3b] p-3.5 sm:p-4 flex items-center justify-between border-b border-[#ff6f00]/30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff9100] to-[#ff6f00] flex items-center justify-center text-white shadow-md border border-[#ffe16d]/50 shrink-0">
              <AppIcon name="help" size={20} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[10px] text-[#ffb691] font-bold uppercase tracking-wider">
                Sanctum Guide
              </span>
              <h2 className="font-display text-[16px] sm:text-[18px] font-black text-[#ffdb3c] tracking-tight leading-tight truncate">
                How to Play Modak Mahayudh
              </h2>
            </div>
          </div>

          <button
            id="how-to-play-close-btn"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#1c012d] hover:bg-[#2b0e3b] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow border border-white/10 shrink-0"
            aria-label="Close Guide"
          >
            <AppIcon name="close" size={16} />
          </button>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="bg-[#150022] px-3 py-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-body font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#2c0e00] shadow-md'
                : 'bg-[#2b0e3b] text-[#e1bfb0] hover:text-white'
            }`}
          >
            All Topics
          </button>
          <button
            onClick={() => handleTabChange('matching')}
            className={`px-3 py-1 rounded-full text-[11px] font-body font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'matching'
                ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#2c0e00] shadow-md'
                : 'bg-[#2b0e3b] text-[#e1bfb0] hover:text-white'
            }`}
          >
            🍬 Matching & Specials
          </button>
          <button
            onClick={() => handleTabChange('powers')}
            className={`px-3 py-1 rounded-full text-[11px] font-body font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'powers'
                ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#2c0e00] shadow-md'
                : 'bg-[#2b0e3b] text-[#e1bfb0] hover:text-white'
            }`}
          >
            ⚡ Divine Powers
          </button>
          <button
            onClick={() => handleTabChange('demons')}
            className={`px-3 py-1 rounded-full text-[11px] font-body font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'demons'
                ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#2c0e00] shadow-md'
                : 'bg-[#2b0e3b] text-[#e1bfb0] hover:text-white'
            }`}
          >
            👹 Demons & Pandal
          </button>
          <button
            onClick={() => handleTabChange('rules')}
            className={`px-3 py-1 rounded-full text-[11px] font-body font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#2c0e00] shadow-md'
                : 'bg-[#2b0e3b] text-[#e1bfb0] hover:text-white'
            }`}
          >
            🏆 Win & Strategy
          </button>
        </div>

        {/* VERTICALLY SCROLLABLE CONTENT */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto flex flex-col gap-3.5 text-left text-white touch-pan-y">
          {/* SECTION 1: CORE OBJECTIVE OVERVIEW */}
          {(activeTab === 'all' || activeTab === 'rules') && (
            <div className="bg-gradient-to-br from-[#2f123f] to-[#1c012d] border border-[#ffdb3c]/30 rounded-2xl p-3.5 shadow-md flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪔</span>
                <h3 className="font-display text-[15px] font-black text-[#ffdb3c] tracking-tight">
                  The Sacred Mission
                </h3>
              </div>
              <p className="font-body text-[12px] text-[#e1bfb0] leading-relaxed">
                Demons and Vighna obstacles are marching in real time along 3 sacred lanes to breach Lord Ganesha&apos;s holy Pandal. Swap and match festive Modaks on the 7×7 grid to channel <strong className="text-[#ffdb3c]">Divine Prana</strong> and unleash heavenly powers to purge all incoming Vighnas before they destroy the Pandal!
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-[#150022]/80 border border-emerald-500/30 p-2 rounded-xl flex flex-col">
                  <span className="font-display text-[11px] font-extrabold text-emerald-300">VICTORY GOAL</span>
                  <span className="font-body text-[10px] text-gray-300 mt-0.5">
                    Purge all required Vighnas (e.g. 5 demons) before your moves run out.
                  </span>
                </div>
                <div className="bg-[#150022]/80 border border-rose-500/30 p-2 rounded-xl flex flex-col">
                  <span className="font-display text-[11px] font-extrabold text-rose-300">DEFEAT DANGER</span>
                  <span className="font-body text-[10px] text-gray-300 mt-0.5">
                    Pandal Protection drops to 0% from demon strikes OR you exhaust all moves.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: MATCH-3 & SPECIAL PIECES */}
          {(activeTab === 'all' || activeTab === 'matching') && (
            <div className="bg-gradient-to-br from-[#2f123f] to-[#1c012d] border border-[#ffdb3c]/30 rounded-2xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍬</span>
                <h3 className="font-display text-[15px] font-black text-[#ffdb3c] tracking-tight">
                  Modak Matching & Specials
                </h3>
              </div>
              <p className="font-body text-[12px] text-[#e1bfb0] leading-relaxed">
                Click or drag adjacent Modaks horizontally or vertically to create lines of 3 or more of the same color:
              </p>

              <div className="flex flex-col gap-2">
                {/* 3-Match */}
                <div className="bg-[#150022]/80 border border-white/10 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-display font-black text-[13px] shrink-0 border border-amber-500/40">
                    3×
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-[12px] font-extrabold text-white">
                      Standard 3-Match
                    </span>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Clears 3 Modaks. Awards <strong className="text-[#ffe16d]">+60 points</strong> and <strong className="text-[#ffe16d]">+10 Divine Prana</strong>.
                    </span>
                  </div>
                </div>

                {/* 4-Match -> Chakra */}
                <div className="bg-[#150022]/80 border border-[#ff9100]/40 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-display font-black text-[14px] shrink-0 shadow border border-amber-300/50">
                    ⚡
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-[12px] font-extrabold text-[#ffe16d] flex items-center gap-1">
                      4-Match → Divine Chakra Beam
                    </span>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Forges a <strong>Chakra Modak</strong> (+25 Prana). When triggered, fires cross-beams clearing the entire row & column! <em className="text-amber-300">Also triggers Ganesha Smite for 1 free demon damage!</em>
                    </span>
                  </div>
                </div>

                {/* 5-Match -> Trishul */}
                <div className="bg-[#150022]/80 border border-[#ff6689]/40 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 via-amber-400 to-indigo-500 text-white flex items-center justify-center font-display font-black text-[14px] shrink-0 shadow border border-pink-300/50">
                    🔱
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-[12px] font-extrabold text-[#ffb691] flex items-center gap-1">
                      5-in-a-Row → Trishul Rainbow Modak
                    </span>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Forges a <strong>Trishul Modak</strong> (+50 Prana). Swap with any Modak to banish ALL Modaks of that color! Swap two Trishuls to cleanse the entire 49-tile board!
                    </span>
                  </div>
                </div>

                {/* L or T Match -> Surya Blast */}
                <div className="bg-[#150022]/80 border border-[#ffdb3c]/40 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-red-600 text-white flex items-center justify-center font-display font-black text-[14px] shrink-0 shadow border border-amber-300/50">
                    💥
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-[12px] font-extrabold text-[#ffdb3c] flex items-center gap-1">
                      L or T Match → Sacred Surya Blast
                    </span>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Forges a <strong>Surya Blast Modak</strong> (+35 Prana). Detonates a radiant 3×3 square explosion around itself!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: DIVINE POWERS */}
          {(activeTab === 'all' || activeTab === 'powers') && (
            <div className="bg-gradient-to-br from-[#2f123f] to-[#1c012d] border border-[#ffdb3c]/30 rounded-2xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="font-display text-[15px] font-black text-[#ffdb3c] tracking-tight">
                  Divine Prana & Sacred Powers
                </h3>
              </div>
              <p className="font-body text-[12px] text-[#e1bfb0] leading-relaxed">
                Matches fill your central <strong className="text-[#ffe16d]">Divine Prana Energy Meter (0 to 100)</strong>. When full at 100, powers illuminate with <span className="text-[#ffe16d] font-bold">READY!</span> Tap to cast:
              </p>

              <div className="flex flex-col gap-2">
                {/* Trident */}
                <div className="bg-[#150022]/80 border border-[#ffb691]/30 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#462856] flex items-center justify-center text-[#ffe16d] font-display font-black text-[16px] shrink-0 border border-[#ffe16d]/30">
                    🔱
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[12px] font-extrabold text-white">
                        Trident Strike
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold">Level 1+</span>
                    </div>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Fires a divine spear at the foremost or tapped demon. Deals <strong className="text-red-400">3 HP damage</strong> and knocks them backward by 16% distance!
                    </span>
                  </div>
                </div>

                {/* Blast */}
                <div className="bg-[#150022]/80 border border-[#ff6f00]/30 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#462856] flex items-center justify-center text-[#ff9100] font-display font-black text-[16px] shrink-0 border border-[#ff9100]/30">
                    💥
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[12px] font-extrabold text-white">
                        Divine Blast
                      </span>
                      <span className="text-[10px] text-orange-300 font-bold">Level 2+</span>
                    </div>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Sweeps across <strong className="text-[#ffdb3c]">ALL 3 lanes</strong> simultaneously. Deals <strong className="text-red-400">2 HP damage</strong> to every active demon on screen + 10% knockback!
                    </span>
                  </div>
                </div>

                {/* Festival Light */}
                <div className="bg-[#150022]/80 border border-[#ffdb3c]/30 p-2.5 rounded-xl flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#462856] flex items-center justify-center text-[#ffdb3c] font-display font-black text-[16px] shrink-0 border border-[#ffdb3c]/30">
                    ✨
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[12px] font-extrabold text-white">
                        Festival Light
                      </span>
                      <span className="text-[10px] text-yellow-300 font-bold">Level 3+</span>
                    </div>
                    <span className="font-body text-[11px] text-[#e1bfb0]">
                      Radiant solar purification. Deals <strong className="text-red-400">2 HP</strong> to all demons AND automatically cleanses a <strong className="text-[#ffdb3c]">3×3 center square</strong> of your Modak board (+250 pts)!
                    </span>
                  </div>
                </div>

                {/* Ganesha Auto-Smite */}
                <div className="bg-[#3a1d4a]/50 border border-amber-400/40 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-lg">🕉️</span>
                  <span className="font-body text-[11px] text-[#ffe16d]">
                    <strong>Ganesha Auto-Smite:</strong> Creating any special piece or 5-match fires a free 1 HP bolt at the front demon!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DEMON MARCH & PANDAL DEFENSE */}
          {(activeTab === 'all' || activeTab === 'demons') && (
            <div className="bg-gradient-to-br from-[#2f123f] to-[#1c012d] border border-[#ffdb3c]/30 rounded-2xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👹</span>
                <h3 className="font-display text-[15px] font-black text-[#ffdb3c] tracking-tight">
                  Demons & Sacred Pandal Defense
                </h3>
              </div>

              <div className="space-y-2 text-[11px] font-body text-[#e1bfb0] leading-relaxed">
                <div className="bg-[#150022]/80 border border-white/10 p-2.5 rounded-xl">
                  <span className="font-bold text-[#ffdb3c] block mb-0.5">🛣️ 3 Parallel Combat Lanes:</span>
                  Demons advance along Top, Center, and Bottom lanes from 45m distance toward the Pandal at the left.
                </div>

                <div className="bg-[#150022]/80 border border-white/10 p-2.5 rounded-xl">
                  <span className="font-bold text-[#ffdb3c] block mb-0.5">⏱️ Real-Time Advance:</span>
                  Demons march continuously in real time (~16 to 22 seconds from spawn to boundary). <em>Do not spend minutes idling on moves!</em>
                </div>

                <div className="bg-[#150022]/80 border border-rose-500/30 p-2.5 rounded-xl">
                  <span className="font-bold text-rose-300 block mb-0.5">⚠️ Barrier Breach & Attacks:</span>
                  When a demon reaches the Rangoli Barrier (94% progress), it halts and strikes every 2.4 seconds, deducting 15% to 25% from your Protection! Cast Trident or Blast to defeat or push them back immediately!
                </div>

                <div className="bg-[#150022]/80 border border-white/10 p-2.5 rounded-xl">
                  <span className="font-bold text-[#ffe16d] block mb-0.5">🎯 Manual Targeting:</span>
                  Tap any advancing demon in the combat corridor to set your target reticle for single-target powers like Trident!
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: STRATEGY TIPS */}
          {(activeTab === 'all' || activeTab === 'rules') && (
            <div className="bg-gradient-to-br from-[#2f123f] to-[#1c012d] border border-[#ffdb3c]/30 rounded-2xl p-3.5 shadow-md flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="font-display text-[15px] font-black text-[#ffdb3c] tracking-tight">
                  Master Temple Strategies
                </h3>
              </div>

              <ul className="space-y-1.5 text-[11px] font-body text-[#e1bfb0] list-disc list-inside">
                <li>
                  <strong className="text-white">Pace Your Swaps:</strong> Make matches promptly to keep charging Prana before demons close the distance.
                </li>
                <li>
                  <strong className="text-white">Prioritize 4-Matches:</strong> Chakras reward +25 Prana and trigger a free Ganesha Auto-Smite.
                </li>
                <li>
                  <strong className="text-white">Save Multi-Hit for Crowds:</strong> When 2 or 3 demons are on screen, use <em>Divine Blast</em> or <em>Festival Light</em> to hit all of them at once.
                </li>
                <li>
                  <strong className="text-white">Knockback Buffer:</strong> If a demon is hitting your barrier, Trident knocks them back 16%, buying you precious seconds.
                </li>
                <li>
                  <strong className="text-white">Moves Bonus:</strong> Every move remaining when you complete the wave adds +75 bonus points and helps secure 3 Stars!
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="p-3 bg-[#150022] border-t border-[#ff6f00]/30 shrink-0 flex items-center justify-between gap-3">
          <button
            id="how-to-play-confirm-btn"
            onClick={handleClose}
            className="w-full bg-gradient-to-b from-[#ffe16d] via-[#ff9800] to-[#ff6f00] py-3 rounded-2xl shadow-[0_4px_16px_rgba(255,111,0,0.5)] active:scale-95 transition-transform flex items-center justify-center gap-2 text-[#341100] font-display text-[15px] font-black border border-white/60 cursor-pointer"
          >
            <AppIcon name="check_circle" size={18} />
            <span>ENTER THE SANCTUM • PLAY NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
